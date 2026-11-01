import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { request } from './api';
const Auth = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const revision = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const version = revision.current;
    // Retire bearer tokens left by older versions. Authentication now uses HttpOnly cookies.
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch { /* Storage may be disabled. */ }
    request('/api/users/me', { signal: controller.signal }).then(value => { if (!controller.signal.aborted && revision.current === version) setSession(value); }).catch(err => {
      if (!controller.signal.aborted && revision.current === version && err.status !== 401) setError(err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  async function login(username, password) {
    revision.current += 1;
    setError('');
    setSession(await request('/api/login', { method: 'POST', body: { username, password } }));
    setLoading(false);
  }
  async function logout() {
    revision.current += 1;
    try {
      await request('/api/logout', { method: 'POST', csrfToken: session?.csrfToken });
      setSession(null); setError('');
    } catch (err) {
      if (err.status === 401) { setSession(null); return; }
      setError(err.message);
      throw err;
    }
  }
  async function api(url,options={}) {
    try { return await request(url,{...options,csrfToken:session?.csrfToken}); }
    catch(error){if(error.status===401)setSession(null);throw error;}
  }
  async function saveProfile(body) {
    revision.current+=1;
    const result=await api('/api/users/me',{method:'POST',body});
    if(result.reauthenticate)setSession(null);else setSession(result);
    return result;
  }
  return <Auth.Provider value={{ user: session?.user, loading, error, login, logout, api, saveProfile }}>{children}</Auth.Provider>;
}
export const useAuth = () => useContext(Auth);
