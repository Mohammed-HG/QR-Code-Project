import { useEffect, useRef, useState } from 'react';
import { usePreferences, contrastInk } from './preferences';
import icons from './icons.json';
const patterns=[['square','Square'],['dots','Dots'],['rounded','Rounded'],['diamond','Diamond'],['soft','Soft'],['vertical','Vertical']];
function Swatch({pattern}){return <span className={'pattern-swatch '+pattern} aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</span>;}
export function LibrarySymbol({icon,color='#000000'}){return <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{background:contrastInk(color),borderRadius:4,padding:2}} aria-hidden="true"><path d={icon.d}/></svg>;}
export default function QRDesign({values,update,features,kind='url'}){
  const {t}=usePreferences(),[error,setError]=useState(''),[fileName,setFileName]=useState(''),[category,setCategory]=useState('All icons'),[query,setQuery]=useState('');
  const fileInput=useRef(null),revision=useRef(0),patternMenu=useRef(null);
  useEffect(()=>()=>{revision.current++;},[]);
  useEffect(()=>{setCategory('All icons');setQuery('');},[kind]);
  useEffect(()=>{
    const close=event=>{if(patternMenu.current&&!patternMenu.current.contains(event.target))patternMenu.current.open=false;};
    const escape=event=>{if(event.key==='Escape'&&patternMenu.current?.open){patternMenu.current.open=false;patternMenu.current.querySelector('summary').focus();}};
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
  },[]);
  const field=key=>({value:values[key],onChange:e=>update({[key]:e.target.value})});
  const selectedPattern=patterns.find(([key])=>key===values.dotShape)||patterns[0];
  const available=icons.filter(icon=>(icon.category==='Wi-Fi')===(kind==='wifi'));
  const selected=available.find(icon=>icon.id===values.iconId);
  const categories=['All icons',...new Set(available.map(icon=>icon.category))];
  const filtered=available.filter(icon=>(category==='All icons'||icon.category===category)&&[icon.label,t(icon.label)].some(label=>label.toLowerCase().includes(query.toLowerCase())));
  async function upload(event){
    const id=++revision.current,file=event.target.files?.[0];setError('');
    if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>262144){setError(t('PNG, JPEG or WebP; up to 256 KB and one million pixels.'));event.target.value='';return;}
    try{
      if(typeof createImageBitmap==='function'){const image=await createImageBitmap(file),pixels=image.width*image.height;image.close();if(pixels>1000000)throw new Error('size');}
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
      if(id===revision.current){setFileName(file.name);update({logo:data,iconId:''});}
    }catch{setError(t('Logo must be a valid PNG, JPEG or WebP with at most one million pixels.'));event.target.value='';}
  }
  function pickIcon(icon){revision.current++;setFileName('');setError('');if(fileInput.current)fileInput.current.value='';update({iconId:icon.id,logo:''});}
  function remove(){revision.current++;setFileName('');update({logo:'',iconId:''});if(fileInput.current)fileInput.current.value='';}
  return <fieldset className="customize"><legend>{t('Customize your code')}</legend>
    <div className="field"><span id="pattern-label" className="field-label">{t('Pattern')}</span><details className="pattern-list" ref={patternMenu}><summary aria-label={t('Pattern')}><Swatch pattern={selectedPattern[0]}/><span>{t(selectedPattern[1])}</span><span className="select-arrow" aria-hidden="true">⌄</span></summary><div className="pattern-list-options" role="group" aria-labelledby="pattern-label">{patterns.map(([value,label])=><button type="button" key={value} aria-pressed={values.dotShape===value} onClick={()=>{update({dotShape:value});patternMenu.current.open=false;patternMenu.current.querySelector('summary').focus();}}><Swatch pattern={value}/><span>{t(label)}</span><span className="pattern-check" aria-hidden="true">{values.dotShape===value?'✓':''}</span></button>)}</div></details></div>
    <section className="color-section"><div className="design-heading"><h3>{t('Dot color')}</h3>{features.gradients&&<button type="button" className="button secondary compact" aria-label={t('Dot color mode')} aria-pressed={values.dotGradient} onClick={()=>update({dotGradient:!values.dotGradient})}>{t(values.dotGradient?'Single color only':'Blend two colors')}</button>}</div><div className={values.dotGradient?'two-columns':''}><div className="field"><label htmlFor="dot-color">{t('Dot color')}</label><input id="dot-color" type="color" {...field('dotColor')}/></div>{features.gradients&&values.dotGradient&&<div className="field"><label htmlFor="dot-color-2">{t('Second dot color')}</label><input id="dot-color-2" type="color" {...field('dotColor2')}/></div>}</div></section>
    <section className="color-section"><div className="design-heading"><h3>{t('Background color')}</h3>{features.transparency&&<button type="button" className="button secondary compact" aria-label={t('Transparent background')} aria-pressed={values.transparent} onClick={()=>update({transparent:!values.transparent})}>{t(values.transparent?'Colored background':'Transparent background')}</button>}</div>
    {!values.transparent&&<><div className="color-mode-row">{features.gradients&&<button type="button" className="button secondary compact" aria-label={t('Background color mode')} aria-pressed={values.bgGradient} onClick={()=>update({bgGradient:!values.bgGradient})}>{t(values.bgGradient?'Single color only':'Blend two colors')}</button>}</div><div className={values.bgGradient?'two-columns':''}><div className="field"><label htmlFor="bg-color">{t('Background color')}</label><input id="bg-color" type="color" {...field('bgColor')}/></div>{features.gradients&&values.bgGradient&&<div className="field"><label htmlFor="bg-color-2">{t('Second background color')}</label><input id="bg-color-2" type="color" {...field('bgColor2')}/></div>}</div></>}
    {values.transparent&&<p className="hint">{t('Use a light surface behind transparent codes and test the final placement.')}</p>}</section>
    {features.gradients&&(values.dotGradient||(!values.transparent&&values.bgGradient))&&<div className="field"><label htmlFor="gradient-angle">{t('Gradient direction')}</label><select id="gradient-angle" {...field('gradientAngle')}><option value="0">{t('Horizontal')}</option><option value="45">{t('Diagonal')}</option><option value="90">{t('Vertical gradient')}</option><option value="135">{t('Reverse diagonal')}</option></select></div>}
    <div className="field"><label htmlFor="qr-size">{t('Image size')}: {values.size} {t('px')}</label><input id="qr-size" type="range" min="256" max="1024" step="1" {...field('size')}/></div>
    <div className="field"><label htmlFor="qr-caption">{t('Text below QR (optional)')}</label><input id="qr-caption" type="text" maxLength={80} placeholder={t('Add a short caption')} {...field('caption')}/><small>{t('Up to 80 characters, included inside the image background.')}</small></div>
    {features.logos&&<section className="logo-editor"><h3>{t('Logo or icon')}</h3>
      <div className="field"><label htmlFor="logo-file">{t('Upload logo')}</label><input ref={fileInput} id="logo-file" type="file" className="upload-native" tabIndex="-1" accept="image/png,image/jpeg,image/webp" onChange={upload}/><div className="file-picker"><button className="button secondary compact" type="button" onClick={()=>fileInput.current?.click()}>{t('Choose file')}</button><span dir="auto">{fileName||t('No file chosen')}</span></div><small>{t('PNG, JPEG or WebP; up to 256 KB and one million pixels.')}</small></div>
      <div className="icon-library"><div className="design-heading"><h3>{t(kind==='wifi'?'Wi-Fi icon library':'Icon library')}</h3><span className="library-count">{available.length}</span></div><div className="field"><label htmlFor="icon-color">{t('Icon color')}</label><input id="icon-color" type="color" {...field('iconColor')}/></div>
      {kind!=='wifi'&&<><div className="field"><label htmlFor="icon-search">{t('Search icons')}</label><input id="icon-search" type="search" maxLength={60} value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="icon-categories" role="group" aria-label={t('Icon categories')}>{categories.map(name=><button type="button" key={name} aria-pressed={category===name} onClick={()=>setCategory(name)}>{t(name)}</button>)}</div></>}
      <div className="icon-grid" role="group" aria-label={t(kind==='wifi'?'Wi-Fi icon library':'Icon library')}>{filtered.map(icon=><button type="button" key={icon.id} title={t(icon.label)} aria-label={t(icon.label)} aria-pressed={values.iconId===icon.id} onClick={()=>pickIcon(icon)}><LibrarySymbol icon={icon} color={values.iconColor}/><span>{t(icon.label)}</span></button>)}</div>{!filtered.length&&<p className="hint">{t('No matching icons.')}</p>}</div>
      {(values.logo||selected)&&<div className="logo-preview">{selected?<span className="selected-library-symbol"><LibrarySymbol icon={selected} color={values.iconColor}/></span>:<img src={values.logo} alt={t('Logo or icon')}/>}<button className="text-button" type="button" onClick={remove}>{t('Remove logo')}</button></div>}
      <small>{t('Logo files are used only for this image and are not saved.')}</small>
    </section>}
    {error&&<p className="alert error" role="alert">{error}</p>}<p className="hint">{t('Keep dots darker than the background. Logos use higher error correction.')}</p>
  </fieldset>;
}
