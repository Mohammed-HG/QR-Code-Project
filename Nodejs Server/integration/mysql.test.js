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
    const storedUser = await repo.userByUsername(username);
    const adminName = 'admin_' + suffix;
    await pool.execute("INSERT INTO users (username,password,email,display_name,role) VALUES (?,?,?,?,'admin')",
      [adminName, storedUser.password, 'admin_'+email, 'Test Admin']);
    const adminLogin = await request(app).post('/api/login').send({username:adminName,password:account.password}).expect(200);
    const adminCookie = adminLogin.headers['set-cookie'][0].split(';')[0], csrf = adminLogin.body.csrfToken;
    const accounts = await request(app).get('/api/admin/users?page=1').set('Cookie',adminCookie).expect(200);
    assert(accounts.body.users.some(user=>user.username===username));
    assert(!JSON.stringify(accounts.body.users).includes('password'));
    const site = await request(app).get('/api/admin/settings').set('Cookie',adminCookie).expect(200);
    site.body.settings.content.ar.title='محرر الموقع يعمل';
    site.body.settings.sections.reverse();
    await request(app).post('/api/admin/settings').set('Cookie',adminCookie).set('X-CSRF-Token',csrf).send(site.body).expect(200);
    await request(app).post('/api/admin/settings').set('Cookie',adminCookie).set('X-CSRF-Token',csrf).send(site.body).expect(409);
    const savedSite=await request(app).get('/api/site').expect(200);
    assert.equal(savedSite.body.settings.content.ar.title,'محرر الموقع يعمل');
    const userLogin=await request(app).post('/api/login').send({username,password:account.password}).expect(200);
    const userCookie=userLogin.headers['set-cookie'][0].split(';')[0], userCsrf=userLogin.body.csrfToken;
    await request(app).post('/api/users/me').set('Cookie',userCookie).set('X-CSRF-Token',userCsrf).send({username,email,currentPassword:account.password,displayName:'Updated profile',bio:'Real SQL test',role:'admin'}).expect(200);
    const profile=await request(app).get('/api/users/me').set('Cookie',userCookie).expect(200);
    assert.equal(profile.body.user.displayName,'Updated profile');assert.equal(profile.body.user.role,'user');
    await request(app).post('/api/admin/users/'+storedUser.id).set('Cookie',adminCookie).set('X-CSRF-Token',csrf).send({action:'block'}).expect(200);
    await request(app).get('/api/users/me').set('Cookie',userCookie).expect(401);
    await request(app).post('/api/login').send({username,password:account.password}).expect(401);
    await request(app).post('/api/admin/users/'+storedUser.id).set('Cookie',adminCookie).set('X-CSRF-Token',csrf).send({action:'unblock'}).expect(200);
    await request(app).post('/api/admin/users/'+storedUser.id).set('Cookie',adminCookie).set('X-CSRF-Token',csrf).send({action:'delete',confirmUsername:username,currentPassword:account.password}).expect(200);
    assert.equal(await repo.userByUsername(username),null);
    const audit=await request(app).get('/api/admin/audit').set('Cookie',adminCookie).expect(200);
    assert(audit.body.events.length>=4);
  } finally { await pool.end(); }
});
