const { HttpError } = require('../lib/errors');
const { equalHash } = require('../repository');
function memoryRepository() {
  const users = [];
  const challenges = new Map();
  const sessions = new Map();
  let site={settings:require('../site-settings').copyDefaults(),revision:0};
  const events=[];
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
      const user = { id: users.length + 1, username, email, password: passwordHash,role:'user',status:'active' };
      users.push(user); challenges.delete(c.id); return user;
    },
    async userByUsername(username) { return users.find(u => u.username === username) || null; },
    async createSession(s) { sessions.set(s.hash, s); },
    async session(hash, now) {
      const s = sessions.get(hash);
      if (!s || s.expiresAt <= now) return null;
      const u = users.find(u => u.id === s.userId);
      return u && u.status!=='blocked' && { id:u.id,username:u.username,email:u.email,role:u.role||'user',status:u.status||'active',displayName:u.displayName||'',bio:u.bio||'' };
    },
    async userById(id){return users.find(user=>String(user.id)===String(id))||null;},
    async updateProfile(input){
      const user=users.find(u=>u.id===input.id);
      if(!user||user.password!==input.expectedPasswordHash)throw new HttpError(409,'Account changed. Sign in again.');
      if(input.email!==user.email){
        const proof=[...challenges.values()].find(c=>c.email===input.email&&c.proofHash===input.proofHash&&c.proofExpiresAt>input.now);
        if(!proof)throw new HttpError(400,'Verify the new email before saving.');
        challenges.delete(proof.id);
      }
      Object.assign(user,{username:input.username,email:input.email,displayName:input.displayName,bio:input.bio});
      if(input.newPasswordHash){user.password=input.newPasswordHash;for(const [key,s] of sessions)if(s.userId===user.id)sessions.delete(key);}
    },
    async getSiteSettings(){return structuredClone(site);},
    async saveSiteSettings(settings,revision,actorId){if(site.revision!==revision)throw new HttpError(409,'Settings changed. Reload before saving.');site={settings:structuredClone(settings),revision:revision+1};events.push({id:events.length+1,actorId,action:'site.settings.updated'});return structuredClone(site);},
    async adminUsers(search,page){
      const matched=users.filter(u=>u.username.includes(search)||u.email.includes(search));
      return {users:matched.slice((page-1)*20,page*20).map(({password,...user})=>user),total:matched.length,page,stats:{total:users.length,blocked:users.filter(u=>u.status==='blocked').length,admins:users.filter(u=>u.role==='admin').length}};
    },
    async moderateUser(actorId,targetId,action){
      const user=users.find(u=>u.id===targetId);
      if(!user)throw new HttpError(404,'Account not found.');
      if(user.role==='admin'||actorId===targetId)throw new HttpError(409,'Administrator accounts cannot be blocked or deleted here.');
      if(action==='delete')users.splice(users.indexOf(user),1);else user.status=action==='block'?'blocked':'active';
      if(action==='block'||action==='delete')for(const [key,s] of sessions)if(s.userId===targetId)sessions.delete(key);
      events.push({id:events.length+1,actorId,targetId,action:'user.'+action});
    },
    async auditLog(){return structuredClone(events);},
    async revokeSession(hash) { sessions.delete(hash); },
  };
}
module.exports = { memoryRepository };
