const nodemailer = require('nodemailer');
function createMailer(env = process.env) {
  const ready = ['SMTP_HOST', 'SMTP_FROM', 'SMTP_USER', 'SMTP_PASSWORD'].every(key => Boolean(env[key]));
  if (!ready) return { ready: false, send: async () => { throw new Error('Email delivery is not configured.'); } };
  const port = Number(env.SMTP_PORT || 587);
  const secure = env.SMTP_SECURE === 'true';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SMTP_PORT.');
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST, port, secure, requireTLS: !secure,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    tls: { rejectUnauthorized: true }, logger: false, debug: false,
  });
  return { ready: true, async send(email, otp) {
    await transporter.sendMail({
      from: env.SMTP_FROM, to: email, subject: 'Your QR Code Project verification code',
      text: 'Your verification code is ' + otp + '. It expires in 5 minutes. If you did not request this code, ignore this email.',
      disableFileAccess: true, disableUrlAccess: true,
    });
  } };
}
module.exports = { createMailer };
