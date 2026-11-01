const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const bcrypt = require('bcrypt');
const { randomBytes, randomInt, createHash, createHmac } = require('node:crypto');
const v = require('./lib/validation');
const { HttpError } = require('./lib/errors');
const { equalHash } = require('./repository');
const { render } = require('./lib/qr');
const randomToken = () => randomBytes(32).toString('hex');
const hash = value => createHash('sha256').update(value).digest('hex');

function createApp({ repository, mailer, config, now = Date.now, generate = render }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxyHops);
  app.use(helmet());
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const origin = req.get('Origin');
    if (origin && origin !== config.origin && !['GET', 'HEAD'].includes(req.method)) {
      return next(new HttpError(403, 'Request origin is not allowed.'));
    }
    if (origin === config.origin) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Credentials', 'true');
      res.vary('Origin');
    }
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type,X-CSRF-Token');
      return res.sendStatus(204);
    }
    next();
  });
  app.use(express.json({ limit: '12kb', strict: true }));
  const limiter = (limit, windowMs = 15 * 60 * 1000, extra = {}) => rateLimit({
    windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }, ...extra,
  });
  const loginIp = limiter(30);
  const loginIdentity = limiter(10, 15 * 60 * 1000, {
    keyGenerator: req => hash(String(req.body?.username || '').toLowerCase()),
  });
  const otpLimit = limiter(5);
  const verifyLimit = limiter(30);
  const registrationLimit = limiter(10);
  const qrLimit = limiter(60, 60000);
  const dummyHash = bcrypt.hashSync(randomToken(), 12);
  const digestOtp = (id, email, otp) => createHmac('sha256', config.secret).update(JSON.stringify([id, email, otp])).digest('hex');
  const csrfFor = token => createHmac('sha256', config.secret).update('csrf:' + token).digest('hex');
  const readCookie = req => {
    const item = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(config.cookieName + '='));
    const token = item?.slice(config.cookieName.length + 1);
    return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) ? token : null;
  };
  const cookieOptions = { httpOnly: true, secure: config.production, sameSite: 'lax', path: '/' };
  async function authenticate(req, res, next) {
    const token = readCookie(req);
    const user = token && await repository.session(hash(token), now());
    if (!user) throw new HttpError(401, 'Please sign in.');
    req.auth = { token, user };
    next();
  }
  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.get('/readyz', async (_req, res) => {
    await repository.health();
    res.json({ status: 'ready' });
  });
  app.post('/api/send-otp', otpLimit, async (req, res) => {
    const body = v.object(req.body);
    const email = v.email(body.contact);
    if (body.type !== undefined && body.type !== 'email') throw new HttpError(400, 'Only email verification is supported.');
    if (!mailer.ready) throw new HttpError(503, 'Email verification is not configured. Please contact the site owner.');
    const id = randomToken();
    const otp = randomInt(100000, 1000000).toString();
    const sentAt = now();
    await repository.createChallenge({ id, email, digest: digestOtp(id, email, otp), sentAt, expiresAt: sentAt + config.otpMs });
    try { await mailer.send(email, otp); }
    catch {
      await repository.cancelChallenge(id);
      throw new HttpError(503, 'Verification email could not be delivered. Please try again later.');
    }
    res.status(202).json({ challengeId: id, expiresIn: config.otpMs / 1000, resendAfter: 60 });
  });
  app.post('/api/verify-otp', verifyLimit, async (req, res) => {
    const body = v.object(req.body);
    const id = v.token(body.challengeId, 'Challenge');
    const email = v.email(body.contact);
    const otp = v.string(body.otp, 'Verification code', 6, 6);
    if (!/^[0-9]{6}$/.test(otp)) throw new HttpError(400, 'Verification code must contain six digits.');
    const proof = randomToken();
    await repository.verifyChallenge({ id, email, digest: digestOtp(id, email, otp),
      proofHash: hash(proof), proofExpiresAt: now() + config.proofMs, now: now() });
    res.json({ verificationToken: proof });
  });
  app.post('/api/register', registrationLimit, async (req, res) => {
    const body = v.object(req.body);
    const username = v.username(body.username);
    const email = v.email(body.email);
    const password = v.password(body.password, true);
    const proof = v.token(body.verificationToken, 'Email verification');
    const passwordHash = await bcrypt.hash(password, 12);
    await repository.register({ username, email, passwordHash, proofHash: hash(proof), now: now() });
    res.status(201).json({ message: 'Account created. You can now sign in.' });
  });
  app.post('/api/login', loginIp, loginIdentity, async (req, res) => {
    const body = v.object(req.body);
    const username = v.username(body.username);
    const password = v.password(body.password);
    const user = await repository.userByUsername(username);
    const valid = await bcrypt.compare(password, user?.password || dummyHash);
    if (!user || !valid) throw new HttpError(401, 'Invalid username or password.');
    const old = readCookie(req);
    if (old) await repository.revokeSession(hash(old));
    const token = randomToken();
    await repository.createSession({ hash: hash(token), userId: user.id, expiresAt: now() + config.sessionMs });
    res.cookie(config.cookieName, token, { ...cookieOptions, maxAge: config.sessionMs });
    res.json({ user: { id: user.id, username: user.username, email: user.email }, csrfToken: csrfFor(token) });
  });
  app.get('/api/users/me', authenticate, (req, res) => {
    res.json({ user: req.auth.user, csrfToken: csrfFor(req.auth.token) });
  });
  app.post('/api/logout', authenticate, async (req, res) => {
    if (!equalHash(req.get('X-CSRF-Token'), csrfFor(req.auth.token))) throw new HttpError(403, 'Invalid request token. Reload the page and try again.');
    await repository.revokeSession(hash(req.auth.token));
    res.clearCookie(config.cookieName, cookieOptions);
    res.status(204).end();
  });
  let activeQR = 0;
  async function qr(req, res) {
    if (activeQR >= 2) throw new HttpError(503, 'QR generator is busy. Please try again.');
    activeQR += 1;
    try {
      const buffer = await generate(v.object(req.body));
      res.type('png').set('Content-Disposition', 'inline; filename="qr-code.png"').send(buffer);
    } finally { activeQR -= 1; }
  }
  app.post('/qr/generate-qr', qrLimit, qr);
  app.post('/qr/customize-qr', qrLimit, qr);
  app.post('/qr/generate-qr/wifi', qrLimit, (req, _res, next) => { req.body = { ...v.object(req.body), kind: 'wifi' }; next(); }, qr);
  app.post('/qr/generate-qr/location', qrLimit, (req, _res, next) => { req.body = { ...v.object(req.body), kind: 'location' }; next(); }, qr);
  app.use((_req, _res, next) => next(new HttpError(404, 'Endpoint not found.')));
  app.use((error, _req, res, _next) => {
    if (res.headersSent) return res.end();
    let status = error.status || 500;
    let message = error.status ? error.message : 'The service is temporarily unavailable.';
    if (error.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body.'; }
    if (error.type === 'entity.too.large') { status = 413; message = 'Request body is too large.'; }
    if (error.code === 'ER_DUP_ENTRY') { status = 409; message = 'This username or email is unavailable. Use another or sign in.'; }
    if (status >= 500) console.error('Request failed:', error.code || 'internal_error');
    res.status(status).json({ error: message });
  });
  return app;
}
module.exports = { createApp, hash };
