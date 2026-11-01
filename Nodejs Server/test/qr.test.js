const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PNG } = require('pngjs');
const jsQR = require('jsqr');
const { render, payloadFor } = require('../lib/qr');
for (const body of [
  { kind: 'url', text: 'https://example.com:8443/path?q=qr&lang=ar#result' },
  { kind: 'text', text: 'Hello — مرحبًا بالعالم' },
  { kind: 'wifi', ssid: 'Office;A:B,C\\D"', password: 'secret;colon:slash\\', encryption: 'WEP' },
  { kind: 'wifi', ssid: 'Guest', encryption: 'nopass' },
  { kind: 'location', latitude: 25.383, longitude: 49.586 },
]) test('PNG decodes to the correct customized ' + body.kind + ' payload', async () => {
  const buffer = await render({ ...body, size: 640, dotColor: '#17243d', bgColor: '#ffffff' });
  const image = PNG.sync.read(buffer);
  assert.equal(image.width, 640);
  const decoded = jsQR(new Uint8ClampedArray(image.data), image.width, image.height);
  assert(decoded, 'QR should be readable');
  assert.equal(decoded.data, payloadFor(body));
  if (body.kind === 'wifi' && body.encryption === 'WEP') assert.equal(decoded.data, 'WIFI:T:WEP;S:Office\\;A\\:B\\,C\\\\D\\";P:secret\\;colon\\:slash\\\\;;');
});
test('rejects unsafe schemes, invalid types, low contrast and oversized images', async () => {
  for (const body of [
    { kind: 'url', text: 'javascript:alert(1)' },
    { kind: 'url', text: 'https://user:password@example.com' },
    { kind: 'wifi', ssid: 'office', password: 'pass', encryption: 'invalid' },
    { kind: 'location', latitude: 91, longitude: 0 },
    { kind: 'text', text: {} },
    { kind: 'text', text: ' ' },
    { text: 'test', dotColor: '#fff' },
    { text: 'test', dotColor: '#ffffff' },
    { text: 'test', size: -1 }, { text: 'test', size: 999999 }, { text: 'test', size: 300.5 },
    { text: 'test', dotShape: 'dots' },
    { kind: 'unknown', text: 'test' },
  ]) await assert.rejects(render(body), error => error.status === 400);
});
