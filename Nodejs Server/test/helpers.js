const { HttpError } = require('../lib/errors');
const { equalHash } = require('../repository');
function memoryRepository() {
  const users = [];
  const challenges = new Map();
  const sessions = new Map();
  return {
    users, challenges, sessions,
    health: async () => {}, cleanup: async () => {},
    async createChallenge(c) {
      const old = [...challenges.values()].find(row => row.email === c.email);
      if (old && old.sentAt + 60000 > c.sentAt) throw new HttpError(429, 'Wait a minute before requesting another code.');
      if (old) challenges.delete(old.id);
      challenges.set(c.id, { ...c, attempts: 0 });
    },
    async cancelChallenge(id) { challenges.delete(id); },
    async verifyChallenge({ id, email, digest, proofHash, proofExpiresAt, now }) {
      const c = challenges.get(id);
      if (!c || c.email !== email || c.expiresAt <= now || c.attempts >= 5 || c.proofHash) throw new HttpError(400, 'Invalid or expired verification code.');
      c.attempts += 1;
      if (!equalHash(c.digest, digest)) throw new HttpError(400, 'Invalid or expired verification code.');
      c.proofHash = proofHash; c.proofExpiresAt = proofExpiresAt;
    },
    async register({ username, email, passwordHash, proofHash, now }) {
      const c = [...challenges.values()].find(row => row.proofHash === proofHash && row.email === email && row.proofExpiresAt > now);
      if (!c) throw new HttpError(400, 'Email verification is required or has expired.');
      if (users.some(u => u.username === username || u.email === email)) { const err = new Error(); err.code = 'ER_DUP_ENTRY'; throw err; }
      const user = { id: users.length + 1, username, email, password: passwordHash };
      users.push(user); challenges.delete(c.id); return user;
    },
    async userByUsername(username) { return users.find(u => u.username === username) || null; },
    async createSession(s) { sessions.set(s.hash, s); },
    async session(hash, now) {
      const s = sessions.get(hash);
      if (!s || s.expiresAt <= now) return null;
      const u = users.find(u => u.id === s.userId);
      return u && { id: u.id, username: u.username, email: u.email };
    },
    async revokeSession(hash) { sessions.delete(hash); },
  };
}
module.exports = { memoryRepository };
