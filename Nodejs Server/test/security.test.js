const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const request = require('supertest');
const bcrypt = require('bcrypt');
const { createApp } = require('../app');
const { configFromEnv } = require('../config');
const { createRepository } = require('../repository');
const { memoryRepository } = require('./helpers');
function fixture(overrides = {}) {
  let clock = 1700000000000;
  const repository = memoryRepository();
  const sent = [];
  const mailer = { ready: true, async send(email, otp) { sent.push({ email, otp }); } };
  const config = configFromEnv({ AUTH_SECRET: randomBytes(32).toString('hex') });
  const app = createApp({ repository, mailer, config, now: () => clock, ...overrides });
  return { app, repository, mailer, config, sent, advance: ms => { clock += ms; } };
}
async function challenge(f, email = 'person@example.com') {
  const res = await request(f.app).post('/api/send-otp').send({ contact: email, type: 'email' }).expect(202);
  assert.equal(res.body.otp, undefined);
  return res.body.challengeId;
}
test('rejects missing/default secrets and unsafe production origins', () => {
  assert.throws(() => configFromEnv({}), /AUTH_SECRET/);
  assert.throws(() => configFromEnv({ AUTH_SECRET: 'a'.repeat(64) }), /AUTH_SECRET/);
  assert.throws(() => configFromEnv({ AUTH_SECRET: randomBytes(32).toString('hex'), NODE_ENV: 'production', APP_ORIGIN: 'http://example.com' }), /HTTPS/);
});
test('old JWT and missing OTP fields cannot authenticate or verify', async () => {
  const f = fixture();
  await request(f.app).get('/api/users/me').set('Authorization', 'Bearer forged-old-jwt').expect(401);
  await request(f.app).post('/api/verify-otp').send({}).expect(400);
  await request(f.app).post('/api/register').send({ username: 'person', email: 'person@example.com', password: 'a strong password' }).expect(400);
  assert.equal(f.repository.users.length, 0);
});
test('email verification, registration, sessions, CSRF, logout and replay protection', async () => {
  const f = fixture();
  const email = 'person@example.com';
  const id = await challenge(f);
  assert.match(f.sent[0].otp, /^[0-9]{6}$/);
  assert.notEqual(f.repository.challenges.get(id).digest, f.sent[0].otp);
  const verify = await request(f.app).post('/api/verify-otp').send({ challengeId: id, contact: email, otp: f.sent[0].otp }).expect(200);
  const body = { username: 'Person', email, password: 'long secret password', verificationToken: verify.body.verificationToken };
  await request(f.app).post('/api/verify-otp').send({ challengeId: id, contact: email, otp: f.sent[0].otp }).expect(400);
  await request(f.app).post('/api/register').send(body).expect(201);
  await request(f.app).post('/api/register').send(body).expect(400);
  assert.equal(f.repository.users[0].username, 'person');
  assert(await bcrypt.compare(body.password, f.repository.users[0].password));
  const login = await request(f.app).post('/api/login').send({ username: 'person', password: body.password }).expect(200);
  const setCookie = login.headers['set-cookie'][0];
  assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /SameSite=Lax/);
  assert.equal(login.body.token, undefined);
  const cookie = setCookie.split(';')[0];
  const me = await request(f.app).get('/api/users/me').set('Cookie', cookie).expect(200);
  assert.equal(me.body.user.username, 'person');
  assert.equal(me.body.user.password, undefined);
  assert.equal(me.body.csrfToken, login.body.csrfToken);
  await request(f.app).post('/api/logout').set('Cookie', cookie).expect(403);
  await request(f.app).post('/api/logout').set('Cookie', cookie).set('Origin', 'https://evil.example').set('X-CSRF-Token', login.body.csrfToken).expect(403);
  await request(f.app).post('/api/logout').set('Cookie', cookie).set('X-CSRF-Token', login.body.csrfToken).expect(204);
  await request(f.app).get('/api/users/me').set('Cookie', cookie).expect(401);
});
test('OTP attempt limits, resend invalidation and expiry are server enforced', async () => {
  const f = fixture();
  const id = await challenge(f);
  await request(f.app).post('/api/send-otp').send({ contact: 'person@example.com' }).expect(429);
  const wrong = f.sent[0].otp === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i += 1) await request(f.app).post('/api/verify-otp').send({ challengeId: id, contact: 'person@example.com', otp: wrong }).expect(400);
  await request(f.app).post('/api/verify-otp').send({ challengeId: id, contact: 'person@example.com', otp: f.sent[0].otp }).expect(400);
  f.advance(61000);
  const second = await challenge(f);
  await request(f.app).post('/api/verify-otp').send({ challengeId: id, contact: 'person@example.com', otp: f.sent[0].otp }).expect(400);
  f.advance(5 * 60000 + 1);
  await request(f.app).post('/api/verify-otp').send({ challengeId: second, contact: 'person@example.com', otp: f.sent[1].otp }).expect(400);
});
test('proof is bound to email, expires and cannot be used without verification', async () => {
  const f = fixture();
  const id = await challenge(f);
  const v = await request(f.app).post('/api/verify-otp').send({ challengeId: id, contact: 'person@example.com', otp: f.sent[0].otp }).expect(200);
  const body = { username: 'person', password: 'long secret password', email: 'other@example.com', verificationToken: v.body.verificationToken };
  await request(f.app).post('/api/register').send(body).expect(400);
  f.advance(5 * 60000 + 1);
  await request(f.app).post('/api/register').send({ ...body, email: 'person@example.com' }).expect(400);
});
test('unconfigured or failing mail never pretends to deliver a code', async () => {
  const f = fixture();
  f.mailer.ready = false;
  await request(f.app).post('/api/send-otp').send({ contact: 'person@example.com' }).expect(503);
  assert.equal(f.repository.challenges.size, 0);
  f.mailer.ready = true;
  f.mailer.send = async () => { throw new Error('provider failed'); };
  await request(f.app).post('/api/send-otp').send({ contact: 'person@example.com' }).expect(503);
  assert.equal(f.repository.challenges.size, 0);
});
test('malformed input, object credentials and oversized bodies fail safely', async () => {
  const f = fixture();
  await request(f.app).post('/api/login').expect(400);
  await request(f.app).post('/api/send-otp').send({ contact: 'person,other@example.com' }).expect(400);
  await request(f.app).post('/api/login').send({ username: { username: 1 }, password: [] }).expect(400);
  await request(f.app).post('/api/login').send({ username: 'person', password: 'invalid' }).expect(401);
  await request(f.app).post('/api/login').send({ username: 'person', password: '🔑'.repeat(20) }).expect(400);
  await request(f.app).post('/api/register').set('Content-Type', 'application/json').send('{').expect(400);
  await request(f.app).post('/qr/generate-qr').send({ text: 'a'.repeat(420000) }).expect(413);
  await request(f.app).post('/qr/generate-qr').send({ kind: 'text', text: 'ok', size: 999999 }).expect(400);
  await request(f.app).post('/qr/generate-qr').send({ kind: 'wifi', ssid: 'office', encryption: 'WPA' }).expect(400);
  await request(f.app).post('/qr/generate-qr').send({ kind: 'location', latitude: '', longitude: 0 }).expect(400);
});
test('production cookies are host-only, Secure, HttpOnly and expire on server', async () => {
  const base = configFromEnv({ AUTH_SECRET: randomBytes(32).toString('hex'), NODE_ENV: 'production', APP_ORIGIN: 'https://qr.example.com' });
  const f = fixture({ config: base });
  f.repository.users.push({ id: 1, username: 'person', email: 'person@example.com', password: await bcrypt.hash('long secret password', 4) });
  const login = await request(f.app).post('/api/login').send({ username: 'person', password: 'long secret password' }).expect(200);
  const cookie = login.headers['set-cookie'][0];
  assert.match(cookie, /^__Host-qr_session=/); assert.match(cookie, /Secure/); assert.doesNotMatch(cookie, /Domain=/);
  f.advance(base.sessionMs + 1);
  await request(f.app).get('/api/users/me').set('Cookie', cookie.split(';')[0]).expect(401);
});
test('public QR rate limits are enforced and CORS is restricted', async () => {
  const f = fixture({ generate: async () => Buffer.from('png') });
  for (let i = 0; i < 60; i += 1) await request(f.app).post('/qr/generate-qr').send({ text: 'test' }).expect(200);
  await request(f.app).post('/qr/generate-qr').send({ text: 'test' }).expect(429);
  await request(f.app).post('/qr/generate-qr').set('Origin', 'https://evil.example').send({ text: 'test' }).expect(403);
  const preflight = await request(f.app).options('/api/login').set('Origin', f.config.origin).expect(204);
  assert.equal(preflight.headers['access-control-allow-origin'], f.config.origin);
});
test('concurrent QR rendering is bounded and recovers after completion', async () => {
  const releases = [];
  const f = fixture({ generate: () => new Promise(resolve => releases.push(resolve)) });
  const first = request(f.app).post('/qr/generate-qr').send({ text: '1' }).then(r => r);
  const second = request(f.app).post('/qr/generate-qr').send({ text: '2' }).then(r => r);
  while (releases.length < 2) await new Promise(resolve => setTimeout(resolve, 5));
  await request(f.app).post('/qr/generate-qr').send({ text: '3' }).expect(503);
  releases.forEach(resolve => resolve(Buffer.from('png')));
  assert.equal((await first).status, 200); assert.equal((await second).status, 200);
});
test('SQL repository commits failed OTP attempt counters instead of rolling them back', async () => {
  let attempts = 0, commits = 0, rollbacks = 0;
  const connection = {
    beginTransaction: async () => {}, release: () => {},
    commit: async () => { commits += 1; }, rollback: async () => { rollbacks += 1; },
    execute: async (sql) => {
      if (sql.startsWith('SELECT')) return [[{ email: 'person@example.com', expires_at: 5000, attempts, otp_hash: '1'.repeat(64) }]];
      if (sql.includes('attempts = attempts + 1')) attempts += 1;
      return [{}];
    },
  };
  const repo = createRepository({ getConnection: async () => connection });
  for (let i = 0; i < 6; i += 1) {
    await assert.rejects(repo.verifyChallenge({ id: 'a'.repeat(64), email: 'person@example.com', digest: '2'.repeat(64), now: 1000 }), /Invalid/);
  }
  assert.equal(attempts, 5); assert.equal(commits, 6); assert.equal(rollbacks, 0);
});
