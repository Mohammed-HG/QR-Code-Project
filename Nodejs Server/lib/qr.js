const QRCode = require('qrcode');
const v = require('./validation');
const { HttpError } = require('./errors');
function escapeWifi(value) { return value.replace(/[\\;:,"]/g, '\\$&'); }
function payloadFor(body) {
  const kind = body.kind || 'text';
  if (kind === 'text') {
    const text = v.string(body.text, 'Text', 1, 1500);
    if (!text.trim() || Buffer.byteLength(text, 'utf8') > 1800) throw new HttpError(400, 'Text is too long or empty.');
    return text;
  }
  if (kind === 'url') {
    let url;
    try { url = new URL(v.string(body.text, 'URL', 1, 1500)); } catch { throw new HttpError(400, 'Enter a complete http:// or https:// URL.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new HttpError(400, 'Only HTTP(S) URLs without embedded credentials are supported.');
    const result = url.href;
    if (Buffer.byteLength(result, 'utf8') > 1800) throw new HttpError(400, 'URL is too long.');
    return result;
  }
  if (kind === 'wifi') {
    const ssid = v.string(body.ssid, 'Network name', 1, 32);
    if (Buffer.byteLength(ssid, 'utf8') > 32) throw new HttpError(400, 'Network name must be at most 32 UTF-8 bytes.');
    if (!['WPA', 'WEP', 'nopass'].includes(body.encryption)) throw new HttpError(400, 'Invalid Wi-Fi security type.');
    const password = body.encryption === 'nopass' ? '' : v.string(body.password, 'Wi-Fi password', 1, 128);
    return 'WIFI:T:' + body.encryption + ';S:' + escapeWifi(ssid) + ';' +
      (body.encryption === 'nopass' ? '' : 'P:' + escapeWifi(password) + ';') + ';';
  }
  if (kind === 'location') {
    if (typeof body.latitude !== 'number' || !Number.isFinite(body.latitude) || Math.abs(body.latitude) > 90 ||
        typeof body.longitude !== 'number' || !Number.isFinite(body.longitude) || Math.abs(body.longitude) > 180) {
      throw new HttpError(400, 'Latitude and longitude are out of range.');
    }
    return 'geo:' + body.latitude + ',' + body.longitude;
  }
  throw new HttpError(400, 'Unknown QR service.');
}
function luminance(hex) {
  const rgb = hex.match(/[a-f0-9]{2}/gi).map(c => parseInt(c, 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function qrOptions(body) {
  const dark = body.dotColor ?? '#000000';
  const light = body.bgColor ?? '#ffffff';
  for (const color of [dark, light]) {
    if (typeof color !== 'string' || !/^#[a-f0-9]{6}$/i.test(color)) throw new HttpError(400, 'Colors must use six-digit hexadecimal values.');
  }
  if ((luminance(light) + 0.05) / (luminance(dark) + 0.05) < 4.5) throw new HttpError(400, 'Choose dark dots and a light background with stronger contrast.');
  const width = body.size ?? 300;
  if (!Number.isInteger(width) || width < 256 || width > 1024) throw new HttpError(400, 'QR size must be an integer between 256 and 1024 pixels.');
  if (body.dotShape !== undefined && body.dotShape !== 'square') throw new HttpError(400, 'Only square QR modules are supported.');
  return { width, margin: 4, errorCorrectionLevel: 'M', color: { dark, light } };
}
async function render(body) {
  v.object(body);
  const text = payloadFor(body);
  const options = qrOptions(body);
  const modules = QRCode.create(text, options).modules.size;
  if (options.width < (modules + options.margin * 2) * 3) {
    throw new HttpError(400, 'Increase QR size or shorten the content for a readable code.');
  }
  return QRCode.toBuffer(text, options);
}
module.exports = { render, payloadFor, qrOptions, escapeWifi };
