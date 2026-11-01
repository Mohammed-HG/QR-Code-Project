import { createContext, useContext, useEffect, useState } from 'react';
import { request } from './api';
import { defaultSettings } from './site-defaults';
const Site = createContext(null);
export function SiteProvider({ children }) {
  const [state,setState]=useState({settings:defaultSettings,revision:0,capabilities:{emailVerification:false}});
  useEffect(()=>{
    const controller=new AbortController();
    request('/api/site',{signal:controller.signal}).then(value=>{if(!controller.signal.aborted)setState(value);}).catch(()=>{});
    return ()=>controller.abort();
  },[]);
  return <Site.Provider value={{...state,updateSite:value=>setState(old=>({...old,...value}))}}>{children}</Site.Provider>;
}
export const useSite=()=>useContext(Site)||{settings:defaultSettings,revision:0,capabilities:{emailVerification:false}};
