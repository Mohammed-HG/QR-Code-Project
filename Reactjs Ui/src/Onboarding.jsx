import {useEffect,useRef,useState} from 'react';
import {usePreferences} from './preferences';
import {useSite} from './site';
const hidden=()=>document.cookie.split(';').some(item=>item.trim()==='qr_intro_hidden=1');
export default function Onboarding(){
  const {t,language,setLanguage}=usePreferences(),{settings}=useSite(),content=settings.content[language];
  const [visible,setVisible]=useState(()=>!hidden()),[remember,setRemember]=useState(false),dialog=useRef(null);
  useEffect(()=>{if(!visible||!dialog.current)return;const element=dialog.current;if(typeof element.showModal==='function')element.showModal();else element.setAttribute('open','');return()=>{element.close?.();};},[visible]);
  function dismiss(){if(remember)document.cookie='qr_intro_hidden=1; Max-Age=31536000; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');setVisible(false);}
  if(!visible)return null;
  return <dialog ref={dialog} className="onboarding-dialog" aria-labelledby="onboarding-title" onCancel={e=>{e.preventDefault();dismiss();}}>
    <div className="onboarding-top"><span className="brand-mark" aria-hidden="true">▦</span><button type="button" className="onboarding-close" aria-label={t('Close')} onClick={dismiss}>×</button></div>
    <h2 id="onboarding-title">{t('Welcome to QR Code Project')}</h2><p className="onboarding-welcome">{content.welcome}</p><p>{content.subtitle}</p>
    <div className="field"><label htmlFor="intro-language">{t('Language')}</label><select id="intro-language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="ar">العربية</option></select></div>
    <h3>{content.instructionsTitle}</h3><ol className="onboarding-steps">{content.steps.map((step,i)=><li key={i}>{step}</li>)}</ol>
    <h3>{content.benefitsTitle}</h3><ul className="onboarding-benefits">{content.benefits.map((benefit,i)=><li key={i}>{benefit}</li>)}</ul>
    <label className="check-row"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>{t("Don't show this again")}</label>
    <button type="button" className="button primary" onClick={dismiss}>{t("Let's start")}</button>
  </dialog>;
}
