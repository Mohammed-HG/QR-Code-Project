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
    { text: 'test', dotShape: 'not-a-pattern' },
    { kind: 'unknown', text: 'test' },
  ]) await assert.rejects(render(body), error => error.status === 400);
});

const sharp=require('sharp');
const {shapes}=require('../lib/qr');
for(const shape of shapes)test('styled '+shape+' with gradients and a logo remains scannable',async()=>{
  const logo=await sharp({create:{width:40,height:40,channels:4,background:'#de2855'}}).png().toBuffer();
  const body={kind:'url',text:'https://example.com/features',size:640,dotShape:shape,dotGradient:true,dotColor:'#152039',dotColor2:'#492b78',bgGradient:true,bgColor:'#ffffff',bgColor2:'#edf3ff',gradientAngle:45,logo:'data:image/png;base64,'+logo.toString('base64')};
  const image=PNG.sync.read(await render(body));
  const decoded=jsQR(new Uint8ClampedArray(image.data),image.width,image.height);
  assert(decoded,shape+' should scan');assert.equal(decoded.data,body.text);
});
test('transparent PNG has real alpha transparency and scans against a white surface',async()=>{
  const buffer=await render({text:'Transparent code',size:512,dotShape:'dots',transparent:true,dotGradient:true,dotColor:'#152039',dotColor2:'#492b78'});
  const image=PNG.sync.read(buffer);assert.equal(image.data[3],0);
  const decodedImage=await sharp(buffer).flatten({background:'#ffffff'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const decoded=jsQR(new Uint8ClampedArray(decodedImage.data),decodedImage.info.width,decodedImage.info.height);assert(decoded);assert.equal(decoded.data,'Transparent code');
});
test('rejects SVG, invalid image data, oversized logos and pixel bombs',async()=>{
  for(const logo of ['data:image/svg+xml;base64,PHN2Zy8+','https://evil.example/logo.png','data:image/png;base64,YWJjZA==','data:image/png;base64,'+'A'.repeat(360000)])await assert.rejects(render({text:'test',logo}),error=>error.status===400);
  const huge=await sharp({create:{width:1100,height:1100,channels:3,background:'#ffffff'}}).png().toBuffer();
  await assert.rejects(render({text:'test',logo:'data:image/png;base64,'+huge.toString('base64')}),error=>error.status===400);
});
