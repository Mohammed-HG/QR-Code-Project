import { useState } from 'react';
import { AuthProvider, useAuth } from './auth';
import { NavigationProvider, useNavigation, Link } from './navigation';
import Generator from './Generator';
import { LoginPage, RegisterPage } from './AuthPages';
function Site() {
  const { path, navigate } = useNavigation();
  const { user, loading, error, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  async function signOut() {
    setLoggingOut(true);
    try { await logout(); navigate('/login'); } catch { /* Auth context displays the error. */ }
    finally { setLoggingOut(false); }
  }
  let page;
  if (path === '/' || path === '/primarypage') page = <Generator />;
  else if (path === '/login') page = <LoginPage />;
  else if (path === '/register') page = <RegisterPage />;
  else if (path === '/about') page = <section className="panel about-panel"><p className="eyebrow">SIMPLE TO SHARE</p><h1>Make everyday information easy to scan.</h1><p>Create QR codes for website links, plain text, Wi-Fi networks and locations. Customize the colors and image size, then download a PNG.</p><p>QR images are generated on request and are not saved to your account. Image uploads and a saved-code library are not currently available.</p><p>Your account uses email verification and a secure session cookie. Generated QR codes can be read by anyone who has the image, so share sensitive details carefully.</p><Link className="button primary" href="/">Create a QR code</Link></section>;
  else page = <section className="panel about-panel"><h1>Page not found</h1><p>This page does not exist.</p><Link href="/">Return to the generator</Link></section>;
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">▦</span><span>QR Code Project</span></Link>
      <nav aria-label="Main navigation">
        <Link href="/" aria-current={path === '/' || path === '/primarypage' ? 'page' : undefined}>Generator</Link>
        <Link href="/about" aria-current={path === '/about' ? 'page' : undefined}>About</Link>
        {loading ? <span role="status">Loading account…</span> : user ? <><span className="username">Hi, {user.username}</span><button type="button" className="text-button" disabled={loggingOut} onClick={signOut}>{loggingOut ? 'Signing out…' : 'Sign out'}</button></> : <><Link href="/login" aria-current={path === '/login' ? 'page' : undefined}>Sign in</Link><Link href="/register" aria-current={path === '/register' ? 'page' : undefined}>Register</Link></>}
      </nav>
    </div></header>
    <main id="main-content" tabIndex="-1" className="main-content">{error && <p className="alert error" role="alert">{error}</p>}{page}</main>
    <footer className="site-footer">QR Code Project · Create. Customize. Share.</footer>
  </>;
}
export default function App() { return <NavigationProvider><AuthProvider><Site /></AuthProvider></NavigationProvider>; }
