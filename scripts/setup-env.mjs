import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const secret = () => randomBytes(32).toString('hex');
const content = [
  'NODE_ENV=development', 'APP_ORIGIN=http://localhost:3000', 'APP_PORT=3000',
  'MYSQL_ROOT_PASSWORD=' + secret(), 'DB_PASSWORD=' + secret(), 'AUTH_SECRET=' + secret(),
  'SMTP_HOST=', 'SMTP_PORT=587', 'SMTP_SECURE=false', 'SMTP_USER=', 'SMTP_PASSWORD=', 'SMTP_FROM=', '',
].join('\n');
try {
  await writeFile(fileURLToPath(new URL('../.env', import.meta.url)), content, { flag: 'wx', mode: 0o600 });
  console.log('Created .env with new random secrets. Configure SMTP before enabling registration. Never commit this file.');
} catch (error) {
  if (error.code === 'EEXIST') console.error('.env already exists. It was not changed. Rotate existing credentials separately.');
  else console.error('Could not create .env.');
  process.exitCode = 1;
}
