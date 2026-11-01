import { useEffect, useRef, useState } from 'react';
import { usePreferences } from './preferences';
const patterns=[['square','Square'],['dots','Dots'],['rounded','Rounded'],['diamond','Diamond'],['soft','Soft'],['vertical','Vertical']];
export default function QRDesign({ values,update,features }) {
  const {t}=usePreferences(),[error,setError]=useState(''),fileInput=useRef(null),readRevision=useRef(0);
  const [iconValue,setIconValue]=useState('');
  const [fileName,setFileName]=useState('');
  useEffect(()=>()=>{readRevision.current++;},[]);
  const field=key=>({value:values[key],onChange:e=>update({[key]:e.target.value})});
  const check=key=>({checked:Boolean(values[key]),onChange:e=>update({[key]:e.target.checked})});
  async function upload(event) {
    const id=++readRevision.current,file=event.target.files?.[0];setError('');
    if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>262144){setError(t('PNG, JPEG or WebP; up to 256 KB and one million pixels.'));event.target.value='';return;}
    try {
      if(typeof createImageBitmap==='function'){const image=await createImageBitmap(file);const pixels=image.width*image.height;image.close();if(pixels>1000000)throw new Error('size');}
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
      if(id===readRevision.current){setIconValue('');setFileName(file.name);update({logo:data});}
    }catch{setError(t('Logo must be a valid PNG, JPEG or WebP with at most one million pixels.'));event.target.value='';}
  }
  function icon(value) {
    setIconValue(value);setFileName('');
    readRevision.current++;if(fileInput.current)fileInput.current.value='';
    if(!value){update({logo:''});return;}
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const context=canvas.getContext('2d');context.fillStyle='#ffffff';context.fillRect(0,0,128,128);
    context.fillStyle=values.dotColor;context.textAlign='center';context.textBaseline='middle';context.font='bold 86px sans-serif';
    context.fillText({heart:'♥',star:'★',infinity:'∞',link:'↗'}[value],64,66);
    update({logo:canvas.toDataURL('image/png')});
  }
  return <fieldset className="customize"><legend>{t('Customize your code')}</legend>
    <div className="field"><span className="field-label">{t('Pattern')}</span><div className="pattern-options" role="group" aria-label={t('Pattern')}>{patterns.map(([value,label])=><button type="button" key={value} aria-pressed={values.dotShape===value} onClick={()=>update({dotShape:value})}><span className={'pattern-swatch '+value} aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</span>{t(label)}</button>)}</div></div>
    <div className="two-columns"><div className="field"><label htmlFor="dot-color">{t('Dot color')}</label><input id="dot-color" type="color" {...field('dotColor')}/></div>{features.gradients&&<div className="field"><label htmlFor="dot-color-2">{t('Second dot color')}</label><input id="dot-color-2" type="color" disabled={!values.dotGradient} {...field('dotColor2')}/></div>}</div>
    {features.gradients&&<label className="check-row"><input type="checkbox" {...check('dotGradient')}/>{t('Two-color dots')}</label>}
    <div className="two-columns"><div className="field"><label htmlFor="bg-color">{t('Background color')}</label><input id="bg-color" type="color" disabled={values.transparent} {...field('bgColor')}/></div>{features.gradients&&<div className="field"><label htmlFor="bg-color-2">{t('Second background color')}</label><input id="bg-color-2" type="color" disabled={values.transparent||!values.bgGradient} {...field('bgColor2')}/></div>}</div>
    {features.gradients&&<label className="check-row"><input type="checkbox" disabled={values.transparent} {...check('bgGradient')}/>{t('Two-color background')}</label>}
    {features.transparency&&<label className="check-row"><input type="checkbox" {...check('transparent')}/>{t('Transparent background')}</label>}
    {values.transparent&&<p className="hint">{t('Use a light surface behind transparent codes and test the final placement.')}</p>}
    {features.gradients&&(values.dotGradient||values.bgGradient)&&<div className="field"><label htmlFor="gradient-angle">{t('Gradient direction')}</label><select id="gradient-angle" {...field('gradientAngle')}><option value="0">{t('Horizontal')}</option><option value="45">{t('Diagonal')}</option><option value="90">{t('Vertical gradient')}</option><option value="135">{t('Reverse diagonal')}</option></select></div>}
    <div className="field"><label htmlFor="qr-size">{t('Image size')}: {values.size} {t('px')}</label><input id="qr-size" type="range" min="256" max="1024" step="1" {...field('size')}/></div>
    {features.logos&&<section className="logo-editor"><h3>{t('Logo or icon')}</h3><div className="field"><label htmlFor="logo-file">{t('Upload logo')}</label><input ref={fileInput} id="logo-file" type="file" className="upload-native" tabIndex="-1" accept="image/png,image/jpeg,image/webp" onChange={upload}/><div className="file-picker"><button className="button secondary compact" type="button" onClick={()=>fileInput.current?.click()}>{t('Choose file')}</button><span dir="auto">{fileName||t('No file chosen')}</span></div><small>{t('PNG, JPEG or WebP; up to 256 KB and one million pixels.')}</small></div><div className="field"><label htmlFor="logo-icon">{t('Choose an icon')}</label><select id="logo-icon" value={iconValue} onChange={event=>icon(event.target.value)}><option value="">{t('No icon')}</option><option value="heart">{t('Heart')}</option><option value="star">{t('Star')}</option><option value="infinity">{t('Infinity')}</option><option value="link">{t('Link')}</option></select></div>{values.logo&&<div className="logo-preview"><img src={values.logo} alt={t('Logo or icon')}/><button className="text-button" type="button" onClick={()=>{readRevision.current++;setIconValue('');setFileName('');update({logo:''});if(fileInput.current)fileInput.current.value='';}}>{t('Remove logo')}</button></div>}<small>{t('Logo files are used only for this image and are not saved.')}</small></section>}
    {error&&<p className="alert error" role="alert">{error}</p>}<p className="hint">{t('Keep dots darker than the background. Logos use higher error correction.')}</p>
  </fieldset>;
}
