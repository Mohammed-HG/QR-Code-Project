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
const sharp = require('sharp');
sharp.cache({ memory: 16, files: 0, items: 20 });
sharp.concurrency(1);
const iconCatalog = require('./icons.json');
const shapes = ['square', 'dots', 'rounded', 'diamond', 'soft', 'vertical'];
function qrOptions(body) {
  const dark = body.dotColor ?? '#000000', light = body.bgColor ?? '#ffffff';
  const dark2 = body.dotGradient ? body.dotColor2 : dark;
  const light2 = body.bgGradient ? body.bgColor2 : light;
  for (const color of [dark, dark2, light, light2]) {
    if (typeof color !== 'string' || !/^#[a-f0-9]{6}$/i.test(color)) throw new HttpError(400, 'Colors must use six-digit hexadecimal values.');
  }
  for (const flag of ['dotGradient','bgGradient','transparent']) {
    if (body[flag] !== undefined && typeof body[flag] !== 'boolean') throw new HttpError(400, 'Invalid QR options.');
  }
  const backgrounds = body.transparent ? ['#ffffff'] : [light, light2];
  for (const foreground of [dark, dark2]) for (const background of backgrounds) {
    if ((luminance(background) + 0.05) / (luminance(foreground) + 0.05) < 4.5) throw new HttpError(400, 'Choose dark dots and a light background with stronger contrast.');
  }
  const width = body.size ?? 300;
  if (!Number.isInteger(width) || width < 256 || width > 1024) throw new HttpError(400, 'QR size must be an integer between 256 and 1024 pixels.');
  const shape = body.dotShape ?? 'square';
  if (!shapes.includes(shape)) throw new HttpError(400, 'Invalid QR pattern.');
  const angle = body.gradientAngle ?? 45;
  if (![0,45,90,135].includes(angle)) throw new HttpError(400, 'Invalid gradient direction.');
  return { width, margin: 4, errorCorrectionLevel: body.logo || body.iconId ? 'H' : 'M', color: { dark, light }, dark2, light2, shape, angle, transparent: Boolean(body.transparent) };
}
async function readLogo(input) {
  if (!input) return null;
  if (typeof input !== 'string') throw new HttpError(400, 'Logo must be a PNG, JPEG or WebP image under 256 KB.');
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input);
  if (!match || match[2].length > 350000 || match[2].length % 4 !== 0) throw new HttpError(400, 'Logo must be a PNG, JPEG or WebP image under 256 KB.');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 262144) throw new HttpError(400, 'Logo must be under 256 KB.');
  try {
    const image = sharp(bytes, { limitInputPixels: 1000000, animated: false, failOn: 'error' });
    const meta = await image.metadata();
    if (!['png','jpeg','webp'].includes(meta.format) || (meta.pages || 1) > 1) throw new Error('Unsupported image');
    return await image.rotate().resize(160, 160, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  } catch { throw new HttpError(400, 'Logo must be a valid PNG, JPEG or WebP with at most one million pixels.'); }
}
async function render(body) {
  v.object(body);
  const text = payloadFor(body), options = qrOptions(body);
  const caption = v.string(body.caption ?? '', 'Caption', 0, 80).trim();
  if (/[\u0000-\u001f\u007f]/.test(caption)) throw new HttpError(400, 'Caption must be a single line of text.');
  if (body.logo && body.iconId) throw new HttpError(400, 'Choose a library icon or an uploaded logo, not both.');
  let logo = await readLogo(body.logo);
  if (body.iconId) {
    const icon = iconCatalog.find(item => item.id === body.iconId);
    if (!icon || (icon.category === 'Wi-Fi') !== (body.kind === 'wifi')) throw new HttpError(400, 'This icon is not available for this QR service.');
    const color = body.iconColor ?? '#000000';
    if (typeof color !== 'string' || !/^#[a-f0-9]{6}$/i.test(color)) throw new HttpError(400, 'Invalid icon color.');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24"><rect width="24" height="24" fill="' + (luminance(color) > .179 ? '#000000' : '#ffffff') + '"/><path d="' + icon.d + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    logo = await sharp(Buffer.from(svg)).png().toBuffer();
  }
  let matrix;
  try { matrix = QRCode.create(text, options).modules; }
  catch { throw new HttpError(400, 'Shorten the content to fit this QR code.'); }
  const n = matrix.size, units = n + 8;
  if (options.width < units * 3) throw new HttpError(400, 'Increase QR size or shorten the content for a readable code.');
  const directions = { 0: ['0%','0%','100%','0%'], 45: ['0%','0%','100%','100%'], 90: ['0%','0%','0%','100%'], 135: ['100%','0%','0%','100%'] };
  const [x1,y1,x2,y2] = directions[options.angle];
  const gradient = (id,a,b) => '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"><stop stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
  let cells = '';
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    if (!matrix.get(row,col)) continue;
    const x = col + 4, y = row + 4, shape = matrix.isReserved(row,col) ? 'square' : options.shape;
    if (shape === 'dots') cells += '<circle cx="' + (x+.5) + '" cy="' + (y+.5) + '" r=".44"/>';
    else if (shape === 'diamond') cells += '<path d="M' + (x+.5) + ' ' + y + 'L' + (x+1) + ' ' + (y+.5) + 'L' + (x+.5) + ' ' + (y+1) + 'L' + x + ' ' + (y+.5) + 'Z"/>';
    else if (shape === 'vertical') cells += '<rect x="' + (x+.13) + '" y="' + y + '" width=".74" height="1" rx=".3"/>';
    else cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1" rx="' + (shape === 'rounded' ? .32 : shape === 'soft' ? .15 : 0) + '"/>';
  }
  const renderSize = units * Math.floor(options.width / units);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + renderSize + '" height="' + renderSize + '" viewBox="0 0 ' + units + ' ' + units + '"><defs>' +
    gradient('dots',options.color.dark,options.dark2) + gradient('background',options.color.light,options.light2) + '</defs>' +
    (options.transparent ? '' : '<rect width="' + units + '" height="' + units + '" fill="url(#background)"/>') + '<g fill="url(#dots)">' + cells + '</g></svg>';
  const extra = options.width - renderSize;
  let image = sharp(Buffer.from(svg), { limitInputPixels: 1048576 }).extend({ top:Math.floor(extra/2), bottom:Math.ceil(extra/2), left:Math.floor(extra/2), right:Math.ceil(extra/2), background:options.transparent ? '#00000000' : options.color.light });
  if (logo) {
    const logoSize = Math.floor(options.width * n / units * .18);
    const padding = Math.max(3, Math.round(options.width * .008));
    const mark = await sharp(logo).resize(logoSize,logoSize,{ fit:'contain',background:'#ffffff' }).extend({ top:padding,bottom:padding,left:padding,right:padding,background:'#ffffff' }).png().toBuffer();
    image = image.composite([{ input:mark, gravity:'centre' }]);
  }
  const qrImage = await image.png().toBuffer();
  if (!caption) return qrImage;
  const width = options.width, fontSize = Math.max(12, Math.min(24, Math.round(width * .036)));
  const padding = Math.max(12, Math.round(width * .025)), lineHeight = Math.round(fontSize * 1.55);
  const limit = Math.max(8, Math.floor((width - padding * 2) / (fontSize * 1.05)));
  const segmenter = new Intl.Segmenter(undefined, { granularity:'grapheme' });
  const parts = text => [...segmenter.segment(text)].map(part => part.segment);
  const lines = [];
  let line = '';
  for (const word of caption.split(/\s+/)) {
    const characters = parts(word);
    if (line && parts(line).length + characters.length + 1 > limit) { lines.push(line); line = ''; }
    while (characters.length > limit) { lines.push(characters.splice(0, limit).join('')); }
    if (characters.length) line += (line ? ' ' : '') + characters.join('');
  }
  if (line) lines.push(line);
  const height = width + padding * 2 + lineHeight * lines.length;
  const escape = text => text.replace(/[&<>"']/g, value => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[value]));
  const coordinates = directions[options.angle].map(value => parseInt(value,10) * width / 100);
  const background = options.transparent ? '' : '<defs><linearGradient id="caption-bg" gradientUnits="userSpaceOnUse" x1="'+coordinates[0]+'" y1="'+coordinates[1]+'" x2="'+coordinates[2]+'" y2="'+coordinates[3]+'"><stop stop-color="'+options.color.light+'"/><stop offset="1" stop-color="'+options.light2+'"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#caption-bg)"/>';
  const direction = /[\u0590-\u08ff]/.test(caption) ? 'rtl' : 'ltr';
  const lettering = lines.map((text,i) => '<text x="'+width/2+'" y="'+(width+padding+fontSize+i*lineHeight)+'" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="'+fontSize+'" direction="'+direction+'" unicode-bidi="plaintext" fill="'+options.color.dark+'">'+escape(text)+'</text>').join('');
  const canvas = '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'">'+background+lettering+'</svg>';
  return sharp(Buffer.from(canvas), { limitInputPixels:2000000 }).composite([{input:qrImage,top:0,left:0}]).png().toBuffer();
}
module.exports = { render, payloadFor, qrOptions, escapeWifi, shapes, readLogo };
