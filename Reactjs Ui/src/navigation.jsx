import { createContext, useContext, useEffect, useState } from 'react';
const Navigation = createContext(null);
export function NavigationProvider({ children }) {
  const [path, setPath] = useState(window.location.pathname.toLowerCase());
  useEffect(() => {
    const update = () => setPath(window.location.pathname.toLowerCase());
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  function navigate(url) {
    if (url !== window.location.pathname) window.history.pushState(null, '', url);
    setPath(window.location.pathname.toLowerCase());
    document.getElementById('main-content')?.focus();
    window.scrollTo?.({ top: 0, behavior: 'instant' });
  }
  return <Navigation.Provider value={{ path, navigate }}>{children}</Navigation.Provider>;
}
export const useNavigation = () => useContext(Navigation);
export function Link({ href, children, ...props }) {
  const { navigate } = useNavigation();
  return <a href={href} {...props} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(href);
  }}>{children}</a>;
}
