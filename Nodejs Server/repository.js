const { timingSafeEqual } = require('node:crypto');
const { HttpError } = require('./lib/errors');
const equalHash = (a,b) => typeof a === 'string' && typeof b === 'string' && /^[a-f0-9]{64}$/i.test(a) && /^[a-f0-9]{64}$/i.test(b) && timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
function createRepository(pool) {
  async function transaction(work) {
    for (let attempt = 0; ; attempt += 1) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const result = await work(connection);
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_LOCK_DEADLOCK' && attempt < 2) continue;
        throw error;
      } finally { connection.release(); }
    }
  }
  return {
    async health() { await pool.execute('SELECT 1'); },
    async cleanup(now) {
      await pool.execute('DELETE FROM auth_sessions WHERE expires_at <= ?', [now]);
      await pool.execute('DELETE FROM email_challenges WHERE expires_at <= ? AND (proof_expires_at IS NULL OR proof_expires_at <= ?)', [now, now]);
    },
    async createChallenge(challenge) {
      return transaction(async connection => {
        const [rows] = await connection.execute('SELECT sent_at FROM email_challenges WHERE email = ? FOR UPDATE', [challenge.email]);
        if (rows[0] && Number(rows[0].sent_at) + 60000 > challenge.sentAt) throw new HttpError(429, 'Wait a minute before requesting another code.');
        await connection.execute('DELETE FROM email_challenges WHERE email = ?', [challenge.email]);
        await connection.execute('INSERT INTO email_challenges (challenge_id,email,otp_hash,expires_at,sent_at) VALUES (?,?,?,?,?)',
          [challenge.id, challenge.email, challenge.digest, challenge.expiresAt, challenge.sentAt]);
      });
    },
    async cancelChallenge(id) { await pool.execute('DELETE FROM email_challenges WHERE challenge_id = ?', [id]); },
    async verifyChallenge({ id, email, digest, proofHash, proofExpiresAt, now }) {
      // Return a failure after committing attempt counters; throwing inside would roll them back.
      const verified = await transaction(async connection => {
        const [rows] = await connection.execute('SELECT * FROM email_challenges WHERE challenge_id = ? FOR UPDATE', [id]);
        const row = rows[0];
        if (!row || row.email !== email || Number(row.expires_at) <= now || row.attempts >= 5 || row.proof_hash) return false;
        await connection.execute('UPDATE email_challenges SET attempts = attempts + 1 WHERE challenge_id = ?', [id]);
        if (!equalHash(row.otp_hash, digest)) return false;
        await connection.execute('UPDATE email_challenges SET proof_hash = ?, proof_expires_at = ?, otp_hash = ? WHERE challenge_id = ?',
          [proofHash, proofExpiresAt, '0'.repeat(64), id]);
        return true;
      });
      if (!verified) throw new HttpError(400, 'Invalid or expired verification code.');
    },
    async register({ username, email, passwordHash, proofHash, now }) {
      return transaction(async connection => {
        const [rows] = await connection.execute('SELECT * FROM email_challenges WHERE proof_hash = ? FOR UPDATE', [proofHash]);
        const row = rows[0];
        if (!row || row.email !== email || Number(row.proof_expires_at) <= now) throw new HttpError(400, 'Email verification is required or has expired.');
        const [result] = await connection.execute('INSERT INTO users (username,password,email) VALUES (?,?,?)', [username, passwordHash, email]);
        await connection.execute('DELETE FROM email_challenges WHERE challenge_id = ?', [row.challenge_id]);
        return { id: result.insertId, username, email };
      });
    },
    async userByUsername(username) {
      const [rows] = await pool.execute('SELECT UserId AS id, username, email, display_name AS displayName, bio, role, status, created_at AS createdAt, password FROM users WHERE username = ? LIMIT 1', [username]);
      return rows[0] || null;
    },
    async createSession({ hash, userId, expiresAt }) {
      await pool.execute('INSERT INTO auth_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)', [hash, userId, expiresAt]);
    },
    async session(hash, now) {
      const [rows] = await pool.execute('SELECT u.UserId AS id, u.username, u.email, u.display_name AS displayName, u.bio, u.role, u.status, u.created_at AS createdAt FROM auth_sessions s JOIN users u ON u.UserId = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = ?',
        [hash, now, 'active']);
      return rows[0] || null;
    },
    async userById(id) {
      const [rows] = await pool.execute('SELECT UserId AS id, username, email, display_name AS displayName, bio, role, status, created_at AS createdAt, password FROM users WHERE UserId = ?', [id]);
      return rows[0] || null;
    },
    async updateProfile({ id, username, email, displayName, bio, expectedPasswordHash, newPasswordHash, proofHash, now }) {
      return transaction(async connection => {
        const [rows] = await connection.execute('SELECT * FROM users WHERE UserId = ? FOR UPDATE', [id]);
        const row = rows[0];
        if (!row || row.status !== 'active' || row.password !== expectedPasswordHash) throw new HttpError(409, 'Account changed. Sign in again.');
        if (email !== row.email) {
          const [proofs] = await connection.execute('SELECT * FROM email_challenges WHERE proof_hash = ? FOR UPDATE', [proofHash || '']);
          const proof = proofs[0];
          if (!proof || proof.email !== email || Number(proof.proof_expires_at) <= now) throw new HttpError(400, 'Verify the new email before saving.');
          await connection.execute('DELETE FROM email_challenges WHERE challenge_id = ?', [proof.challenge_id]);
        }
        await connection.execute('UPDATE users SET username = ?, email = ?, display_name = ?, bio = ?, password = ? WHERE UserId = ?',
          [username, email, displayName, bio, newPasswordHash || row.password, id]);
        if (newPasswordHash) await connection.execute('DELETE FROM auth_sessions WHERE user_id = ?', [id]);
      });
    },
    async getSiteSettings() {
      const [rows] = await pool.execute('SELECT revision, settings FROM site_settings WHERE id = 1');
      const row = rows[0];
      return { revision: row.revision, settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings };
    },
    async saveSiteSettings(settings, revision, actorId) {
      return transaction(async connection => {
        const [result] = await connection.execute('UPDATE site_settings SET settings = ?, revision = revision + 1 WHERE id = 1 AND revision = ?', [JSON.stringify(settings), revision]);
        if (!result.affectedRows) throw new HttpError(409, 'Settings changed. Reload before saving.');
        await connection.execute('INSERT INTO admin_audit (actor_id, action) VALUES (?, ?)', [actorId, 'site.settings.updated']);
        return { settings, revision: revision + 1 };
      });
    },
    async adminUsers(search, page) {
      const filter = '%' + search + '%';
      const [users] = await pool.execute('SELECT UserId AS id, username, email, display_name AS displayName, role, status, created_at AS createdAt FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY UserId DESC LIMIT 20 OFFSET ?', [filter, filter, (page - 1) * 20]);
      const [count] = await pool.execute('SELECT COUNT(*) AS total FROM users WHERE username LIKE ? OR email LIKE ?', [filter, filter]);
      const [stats] = await pool.execute("SELECT COUNT(*) AS total, SUM(status = 'blocked') AS blocked, SUM(role = 'admin') AS admins FROM users");
      return { users, total: Number(count[0].total), page, stats: { total: Number(stats[0].total), blocked: Number(stats[0].blocked || 0), admins: Number(stats[0].admins || 0) } };
    },
    async moderateUser(actorId, targetId, action) {
      return transaction(async connection => {
        const [rows] = await connection.execute('SELECT UserId, email, role FROM users WHERE UserId = ? FOR UPDATE', [targetId]);
        const user = rows[0];
        if (!user) throw new HttpError(404, 'Account not found.');
        if (user.role === 'admin' || String(actorId) === String(targetId)) throw new HttpError(409, 'Administrator accounts cannot be blocked or deleted here.');
        if (action === 'delete') {
          await connection.execute('DELETE FROM auth_sessions WHERE user_id = ?', [targetId]);
          await connection.execute('DELETE FROM email_challenges WHERE email = ?', [user.email]);
          await connection.execute('DELETE FROM users WHERE UserId = ?', [targetId]);
        } else {
          await connection.execute('UPDATE users SET status = ? WHERE UserId = ?', [action === 'block' ? 'blocked' : 'active', targetId]);
          if (action === 'block') await connection.execute('DELETE FROM auth_sessions WHERE user_id = ?', [targetId]);
        }
        await connection.execute('INSERT INTO admin_audit (actor_id,action,target_id) VALUES (?,?,?)', [actorId, 'user.' + action, targetId]);
      });
    },
    async auditLog() {
      const [rows] = await pool.execute('SELECT a.id, a.action, a.target_id AS targetId, a.created_at AS createdAt, u.username AS actor FROM admin_audit a LEFT JOIN users u ON u.UserId = a.actor_id ORDER BY a.id DESC LIMIT 50');
      return rows;
    },
    async revokeSession(hash) { await pool.execute('DELETE FROM auth_sessions WHERE token_hash = ?', [hash]); },
  };
}
module.exports = { createRepository, equalHash };
