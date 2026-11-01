import { usePreferences } from './preferences';
import { useSite } from './site';
import Generator from './Generator';
export default function Home({ draft, preview=false, locale }) {
  const {language,t}=usePreferences(),site=useSite(),settings=draft||site.settings,content=settings.content[locale||language];
  const blocks={
    welcome:<section className="page-intro" key="welcome">
      <p className="eyebrow">{language==='ar'?'أنشئ بأسلوبك':'MAKE IT YOURS'}</p><h1>{content.title}</h1><p>{content.subtitle}</p>
    </section>,
    generator:<Generator key="generator" preview={preview} features={settings.features}/>,
    benefits:<section className="benefits" key="benefits"><h2>{content.benefitsTitle}</h2><div className="benefit-grid">{content.benefits.map((text,i)=><div className="benefit" key={i}><span aria-hidden="true">✧</span><p>{text}</p></div>)}</div></section>,
  };
  return <div className="home-sections">{settings.sections.filter(s=>s.visible&&s.id!=='instructions').map(s=>blocks[s.id])}</div>;
}
