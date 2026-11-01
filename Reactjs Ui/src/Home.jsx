import { useState } from 'react';
import { usePreferences } from './preferences';
import { useSite } from './site';
import Generator from './Generator';
export default function Home({ draft, preview=false, locale }) {
  const {language,t}=usePreferences(),site=useSite(),settings=draft||site.settings,content=settings.content[locale||language];
  const [welcomeVisible,setWelcomeVisible]=useState(()=>{try{return localStorage.getItem('qr.welcome.dismissed')!=='yes';}catch{return true;}});
  const [guideOpen,setGuideOpen]=useState(true);
  const blocks={
    welcome:<section className="page-intro" key="welcome">
      {(welcomeVisible||preview)&&<div className="welcome-note"><span aria-hidden="true">✦</span><span>{content.welcome}</span>{!preview&&<button type="button" aria-label={t('Dismiss welcome')} onClick={()=>{setWelcomeVisible(false);try{localStorage.setItem('qr.welcome.dismissed','yes');}catch{}}}>×</button>}</div>}
      <p className="eyebrow">{language==='ar'?'أنشئ بأسلوبك':'MAKE IT YOURS'}</p><h1>{content.title}</h1><p>{content.subtitle}</p>
    </section>,
    instructions:<section className="guide panel" key="instructions"><div className="section-heading"><h2>{content.instructionsTitle}</h2><button className="text-button" type="button" aria-expanded={guideOpen} onClick={()=>setGuideOpen(!guideOpen)}>{t(guideOpen?'Hide guide':'Show guide')}</button></div>{guideOpen&&<ol className="guide-steps">{content.steps.map((step,i)=><li key={i}><span>{i+1}</span><p>{step}</p></li>)}</ol>}</section>,
    generator:<Generator key="generator" preview={preview} features={settings.features}/>,
    benefits:<section className="benefits" key="benefits"><h2>{content.benefitsTitle}</h2><div className="benefit-grid">{content.benefits.map((text,i)=><div className="benefit" key={i}><span aria-hidden="true">✧</span><p>{text}</p></div>)}</div></section>,
  };
  return <div className="home-sections">{settings.sections.filter(s=>s.visible).map(s=>blocks[s.id])}</div>;
}
