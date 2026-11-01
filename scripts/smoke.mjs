import assert from 'node:assert/strict';
const origin = process.env.SMOKE_ORIGIN || 'http://localhost:3000';
for (const route of ['/', '/login', '/register', '/about']) {
  const response = await fetch(origin + route);
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert(response.headers.get('content-security-policy'), 'CSP should be present');
}
assert.equal((await fetch(origin + '/assets/missing.js')).status, 404);
assert.equal((await fetch(origin + '/api/users/me')).status, 401);
const post = (route, body) => fetch(origin + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });
const png = await post('/qr/generate-qr', { kind: 'wifi', ssid: 'Office;network', password: 'sample-password', encryption: 'WEP', size: 400 });
assert.equal(png.status, 200);
assert.match(png.headers.get('content-type'), /image\/png/);
assert.deepEqual([...new Uint8Array(await png.arrayBuffer()).slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
assert.equal((await post('/qr/generate-qr', { text: 'test', size: 999999 })).status, 400);
assert.equal((await post('/api/verify-otp', {})).status, 400);
assert.equal((await post('/api/send-otp', { contact: 'smoke@example.com' })).status, 503);
console.log('Compose smoke checks passed: routes, security headers, API proxy, QR PNG, limits and safe auth failures.');
