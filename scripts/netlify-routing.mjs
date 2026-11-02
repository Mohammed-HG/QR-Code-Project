import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Keep authentication cookies on the frontend origin, including /profile and /admin.
const value = process.env.QR_API_ORIGIN;
if (!value) throw new Error('Set QR_API_ORIGIN to the HTTPS origin of the QR Render service.');
const origin = new URL(value);
if (origin.origin !== value || origin.protocol !== 'https:' || origin.username || origin.password ||
    !/^[a-z0-9-]+\.onrender\.com$/.test(origin.hostname)) {
  throw new Error('QR_API_ORIGIN must be an exact https://SERVICE.onrender.com origin.');
}
const redirects = `/api/* ${value}/api/:splat 200!\n/qr/* ${value}/qr/:splat 200!\n/* /index.html 200\n`;
await writeFile(fileURLToPath(new URL('../Reactjs Ui/dist/_redirects', import.meta.url)), redirects);
console.log('Netlify API routes generated.');
