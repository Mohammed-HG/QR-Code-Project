import { useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from './auth';
import { NavigationProvider, useNavigation, Link } from './navigation';
import { PreferencesProvider, usePreferences, contrastInk } from './preferences';
import { SiteProvider, useSite } from './site';
import Home from './Home';
import { LoginPage, RegisterPage } from './AuthPages';
import ProfilePage from './ProfilePage';
import AdminPage from './AdminPage';
const Moon=()=> <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.7 13.5A8.8 8.8 0 0 1 10.5 3.3 9 9 0 1 0 20.7 13.5Z"/></svg>;
const Sun=()=> <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>;
function AccountPage() {
  const {path}=useNavigation(),{t}=usePreferences(),{settings,capabilities}=useSite();
  const registering=path==='/register';
  return <><nav className="account-tabs" aria-label={t('Account')}><Link role="tab" aria-selected={!registering} href="/login">{t('Sign in')}</Link><Link role="tab" aria-selected={registering} href="/register">{t('Register')}</Link></nav>{registering?settings.features.registration?<><RegisterPage/>{!capabilities.emailVerification&&<p className="hint centered">{t('Registration needs configured SMTP to send real verification emails.')}</p>}</>:<section className="panel auth-layout">{t('Registration is disabled.')}</section>:<LoginPage/>}</>;
}
function SettingsPage() {
  const prefs=usePreferences(),{settings}=useSite(),{t}=prefs,mode=prefs.mode||settings.appearance.defaultTheme;
  return <section className="panel settings-panel"><p className="eyebrow">QR CODE PROJECT</p><h1>{t('Settings')}</h1><div className="field"><label htmlFor="language">{t('Language')}</label><select id="language" value={prefs.language} onChange={e=>prefs.setLanguage(e.target.value)}><option value="en">English</option><option value="ar">العربية</option></select></div><h2>{t('Appearance')}</h2><p className="hint">{t(mode==='dark'?'Dark mode':'Light mode')}</p><div className="field"><label htmlFor="page-background">{t('Page background')}</label><input id="page-background" type="color" value={prefs.backgrounds[mode]||settings.appearance[mode==='dark'?'darkBackground':'lightBackground']} onChange={e=>prefs.setBackground(mode,e.target.value)}/></div><button className="text-button" type="button" onClick={()=>prefs.setBackground(mode,null)}>{t('Use site default')}</button></section>;
}
function Site() {
  const {path,navigate}=useNavigation(),auth=useAuth(),prefs=usePreferences(),site=useSite(),{t,language}=prefs;
  const [loggingOut,setLoggingOut]=useState(false),menu=useRef(null),a=site.settings.appearance,mode=prefs.mode||a.defaultTheme,content=site.settings.content[language];
  const background=prefs.backgrounds[mode]||a[mode==='dark'?'darkBackground':'lightBackground'];
  useEffect(()=>{document.documentElement.dataset.theme=mode;},[mode]);
  useEffect(()=>{
    const close=e=>{if(menu.current&&!menu.current.contains(e.target))menu.current.open=false;};
    const escape=e=>{if(e.key==='Escape'&&menu.current?.open){menu.current.open=false;menu.current.querySelector('summary').focus();}};
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
  },[]);
  useEffect(()=>{if(menu.current)menu.current.open=false;},[path]);
  async function signOut(){setLoggingOut(true);try{await auth.logout();navigate('/login');}catch{}finally{setLoggingOut(false);}}
  let page;
  if(path==='/'||path==='/primarypage')page=<Home/>;
  else if(['/account','/login','/register'].includes(path))page=<AccountPage/>;
  else if(path==='/settings')page=<SettingsPage/>;
  else if(path==='/profile')page=<ProfilePage/>;
  else if(path==='/admin')page=<AdminPage/>;
  else if(path==='/about')page=<section className="panel about-panel"><p className="eyebrow">QR CODE PROJECT</p><h1>{content.aboutTitle}</h1><p className="preserve-lines">{content.about}</p><Link className="button primary" href="/">{t('Create a QR code')}</Link></section>;
  else if(path==='/help')page=<section className="panel about-panel"><h1>{content.instructionsTitle}</h1><ol>{content.steps.map((step,i)=><li key={i}>{step}</li>)}</ol><h2>{content.benefitsTitle}</h2><ul>{content.benefits.map((item,i)=><li key={i}>{item}</li>)}</ul></section>;
  else page=<section className="panel about-panel"><h1>{t('Page not found')}</h1><p>{t('This page does not exist.')}</p><Link href="/">{t('Return to the generator')}</Link></section>;
  const style={'--page-background':background,'--page-ink':contrastInk(background),'--accent':a.accent,'--accent-ink':contrastInk(a.accent),'--site-width':a.maxWidth+'px','--section-gap':a.gap+'px','--radius':a.radius+'px','--heading-size':a.headingSize+'px','--panel-padding':a.panelPadding+'px'};
  return <div className="app-shell" data-theme={mode} style={style}>
    <a className="skip-link" href="#main-content">{t('Skip to content')}</a>
    <header className="site-header"><div className="header-inner"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">▦</span><span>QR Code Project</span></Link><nav aria-label={t('Menu')} className="header-actions">
      <button type="button" className="theme-toggle" aria-label={t(mode==='light'?'Dark mode':'Light mode')} title={t(mode==='light'?'Dark mode':'Light mode')} onClick={()=>prefs.setMode(mode==='light'?'dark':'light')}>{mode==='light'?<Moon/>:<Sun/>}</button>
      <details className="nav-menu" ref={menu}><summary aria-label={t('Menu')}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>{t('Menu')}</span></summary><div className="nav-menu-panel">
        {auth.loading?<span role="status">{t('Loading account…')}</span>:auth.user?<><Link href="/profile" className="account-greeting">{t('Welcome')}{language==='ar'?'، ':', '}{auth.user.displayName||auth.user.username}</Link>{auth.user.role==='admin'&&<Link href="/admin">{t('Admin dashboard')}</Link>}</>:<Link href="/account">{t('Sign in')}</Link>}
        <Link href="/">{t('Generator')}</Link><Link href="/settings">{t('Settings')}</Link><Link href="/help">{t('How it works')}</Link>{auth.user&&<button type="button" className="text-button" disabled={loggingOut} onClick={signOut}>{t(loggingOut?'Signing out…':'Sign out')}</button>}
      </div></details>
    </nav></div></header>
    <main id="main-content" tabIndex="-1" className="main-content">{auth.error&&<p className="alert error" role="alert">{t(auth.error)}</p>}{page}</main>
    <footer className="site-footer"><span>QR Code Project · {content.footer}</span><Link href="/about">{t('About')}</Link></footer>
  </div>;
}
export default function App(){return <PreferencesProvider><NavigationProvider><SiteProvider><AuthProvider><Site/></AuthProvider></SiteProvider></NavigationProvider></PreferencesProvider>;}
