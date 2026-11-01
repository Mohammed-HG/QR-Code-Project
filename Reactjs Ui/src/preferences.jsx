import { createContext, useContext, useEffect, useState } from 'react';
import { arabic, english } from './translations';
const Preferences = createContext(null);
function initialPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem('qr.preferences.v1') || '{}');
    return { language: ['en','ar'].includes(value.language) ? value.language : (navigator.language?.startsWith('ar') ? 'ar' : 'en'),
      mode: ['light','dark'].includes(value.mode) ? value.mode : null,
      backgrounds: { light: /^#[a-f0-9]{6}$/i.test(value.backgrounds?.light) ? value.backgrounds.light : null, dark: /^#[a-f0-9]{6}$/i.test(value.backgrounds?.dark) ? value.backgrounds.dark : null } };
  } catch { return { language:'en', mode:null, backgrounds:{ light:null,dark:null } }; }
}
export function PreferencesProvider({ children }) {
  const [preferences,setPreferences] = useState(initialPreferences);
  useEffect(() => {
    document.documentElement.lang = preferences.language;
    document.documentElement.dir = preferences.language === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('qr.preferences.v1',JSON.stringify(preferences)); } catch { /* Preferences still work when storage is unavailable. */ }
  },[preferences]);
  const t = text => preferences.language === 'ar' ? (arabic[text] || (/^.+ is invalid\.$/.test(text)?'القيمة المدخلة غير صالحة.':text)) : (english[text] || text);
  return <Preferences.Provider value={{ ...preferences, t, setLanguage:language=>setPreferences(p=>({...p,language})), setMode:mode=>setPreferences(p=>({...p,mode})), setBackground:(mode,color)=>setPreferences(p=>({...p,backgrounds:{...p.backgrounds,[mode]:color}})) }}>{children}</Preferences.Provider>;
}
const englishFallback = { language:'en', mode:null, backgrounds:{}, t:text=>text };
export const usePreferences = () => useContext(Preferences) || englishFallback;
export function contrastInk(hex) {
  const c=hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return c[0]*.2126+c[1]*.7152+c[2]*.0722 > .179 ? '#000000' : '#ffffff';
}
