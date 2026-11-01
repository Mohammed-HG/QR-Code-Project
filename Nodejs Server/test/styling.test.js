const {test}=require('node:test');
const assert=require('node:assert/strict');
const {PNG}=require('pngjs');
const sharp=require('sharp');
const jsQR=require('jsqr');
const fs=require('node:fs');
const path=require('node:path');
const {render}=require('../lib/qr');
const icons=require('../lib/icons.json');
test('browser and server use the same trusted SVG catalog',()=>{
  const frontend=JSON.parse(fs.readFileSync(path.join(__dirname,'../../Reactjs Ui/src/icons.json'),'utf8'));
  assert.deepEqual(frontend,icons);assert.equal(icons.filter(i=>i.category==='Wi-Fi').length,8);
});
for(const icon of icons)test('library icon '+icon.id+' preserves QR readability',async()=>{
  const body=icon.category==='Wi-Fi'?{kind:'wifi',ssid:'Guest',encryption:'nopass'}:{kind:'text',text:'Icon QR data'};
  const buffer=await render({...body,size:480,iconId:icon.id,iconColor:'#ad2861'});
  const image=PNG.sync.read(buffer);
  assert(jsQR(new Uint8ClampedArray(image.data),image.width,image.height));
});
for(const [caption,size]of [['Scan me',480],['امسح الرمز لمعرفة المزيد',480],['W'.repeat(80),256],['<script> & "quoted" caption',640]])test('caption fits inside the background and preserves the QR: '+caption.slice(0,15),async()=>{
  const buffer=await render({text:'Caption QR data',caption,size});
  const image=PNG.sync.read(buffer);assert.equal(image.width,size);assert(image.height>size&&image.height<size+200);
  const decoded=jsQR(new Uint8ClampedArray(image.data),image.width,image.height);assert(decoded);assert.equal(decoded.data,'Caption QR data');
  let ink=0;for(let y=size;y<image.height;y++)for(let x=0;x<size;x++)if(image.data[(y*size+x)*4]<150)ink++;
  assert(ink>10,'Caption should contain visible glyphs');
});
test('transparent caption image retains alpha and scannability',async()=>{
  const buffer=await render({text:'Transparent caption',caption:'Optional caption',transparent:true,size:512});
  const raw=PNG.sync.read(buffer);assert.equal(raw.data[3],0);
  const flat=await sharp(buffer).flatten({background:'#ffffff'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert(jsQR(new Uint8ClampedArray(flat.data),flat.info.width,flat.info.height));
});
test('rejects incompatible icon categories, arbitrary colors, and invalid captions',async()=>{
  for(const body of [
    {text:'a',kind:'text',iconId:'wifi-classic'},
    {kind:'wifi',ssid:'Guest',encryption:'nopass',iconId:'heart'},
    {text:'a',iconId:'not-in-catalog'},
    {text:'a',iconId:'heart',iconColor:'url(https://evil.example)'},
    {text:'a',caption:'x'.repeat(81)},
    {text:'a',caption:'first\nsecond'},
    {text:'a',logo:'data:image/png;base64,YWJjZA==',iconId:'heart'},
  ])await assert.rejects(render(body),error=>error.status===400);
});
