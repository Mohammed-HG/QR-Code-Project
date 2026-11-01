const { timingSafeEqual } = require('node:crypto');
const { HttpError } = require('./lib/errors');
const equalHash = (a, b) => typeof a === 'string' && typeof b === 'string' &&
  a.length === 64 && b.length === 64 && timingSafeEqual(Buffer.from(a), Buffer.from(b));
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
      const [rows] = await pool.execute('SELECT UserId AS id, username, email, password FROM users WHERE username = ? LIMIT 1', [username]);
      return rows[0] || null;
    },
    async createSession({ hash, userId, expiresAt }) {
      await pool.execute('INSERT INTO auth_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)', [hash, userId, expiresAt]);
    },
    async session(hash, now) {
      const [rows] = await pool.execute('SELECT u.UserId AS id, u.username, u.email FROM auth_sessions s JOIN users u ON u.UserId = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?',
        [hash, now]);
      return rows[0] || null;
    },
    async revokeSession(hash) { await pool.execute('DELETE FROM auth_sessions WHERE token_hash = ?', [hash]); },
  };
}
module.exports = { createRepository, equalHash };
