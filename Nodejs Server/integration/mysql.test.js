const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, createHmac } = require('node:crypto');
const request = require('supertest');
const { createPool } = require('../db');
const { createRepository } = require('../repository');
const { migrate } = require('../scripts/migrate');
const { createApp, hash } = require('../app');
const { configFromEnv } = require('../config');
test('MySQL migrations and transactional auth lifecycle', async () => {
  assert.match(process.env.DB_NAME || '', /^qr_test(?:_[a-z0-9]+)?$/, 'Use an isolated qr_test database only.');
  const pool = createPool();
  try {
    await migrate(pool); await migrate(pool);
    const repo = createRepository(pool);
    const config = configFromEnv({ AUTH_SECRET: randomBytes(32).toString('hex') });
    let clock = Date.now();
    let code;
    const app = createApp({ repository: repo, config, now: () => clock, mailer: { ready: true, send: async (_email, otp) => { code = otp; } } });
    const suffix = randomBytes(6).toString('hex');
    const username = 'user_' + suffix;
    const email = suffix + '@example.com';
    const sent = await request(app).post('/api/send-otp').send({ contact: email }).expect(202);
    const id = sent.body.challengeId;
    await request(app).post('/api/verify-otp').send({ challengeId: id, contact: email, otp: '000000' }).expect(400);
    const [attempts] = await pool.execute('SELECT attempts FROM email_challenges WHERE challenge_id = ?', [id]);
    assert.equal(attempts[0].attempts, 1);
    const verified = await request(app).post('/api/verify-otp').send({ challengeId: id, contact: email, otp: code }).expect(200);
    const account = { username, email, password: 'integration-only password', verificationToken: verified.body.verificationToken };
    const registered = await Promise.all([
      request(app).post('/api/register').send(account), request(app).post('/api/register').send(account),
    ]);
    assert.deepEqual(registered.map(r => r.status).sort(), [201, 400]);
    const login = await request(app).post('/api/login').send({ username, password: account.password }).expect(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    const me = await request(app).get('/api/users/me').set('Cookie', cookie).expect(200);
    assert.equal(me.body.user.username, username);
    await request(app).post('/api/logout').set('Cookie', cookie).set('X-CSRF-Token', me.body.csrfToken).expect(204);
    await request(app).get('/api/users/me').set('Cookie', cookie).expect(401);

    // Real transaction: five wrong OTPs persist; the correct sixth attempt must fail.
    const id2 = randomBytes(32).toString('hex'), otp = '654321';
    const digest = createHmac('sha256', config.secret).update(JSON.stringify([id2, email, otp])).digest('hex');
    await repo.createChallenge({ id: id2, email, digest, sentAt: clock, expiresAt: clock + 300000 });
    for (let i = 0; i < 5; i += 1) await request(app).post('/api/verify-otp').send({ challengeId: id2, contact: email, otp: '000000' }).expect(400);
    await request(app).post('/api/verify-otp').send({ challengeId: id2, contact: email, otp }).expect(400);
    const [locked] = await pool.execute('SELECT attempts FROM email_challenges WHERE challenge_id = ?', [id2]);
    assert.equal(locked[0].attempts, 5);
    clock += 300001;
    await repo.cleanup(clock);
    assert.equal(await repo.session(hash(randomBytes(32).toString('hex')), clock), null);
    const [count] = await pool.execute('SELECT COUNT(*) AS n FROM users WHERE username = ?', [username]);
    assert.equal(Number(count[0].n), 1);
  } finally { await pool.end(); }
});
