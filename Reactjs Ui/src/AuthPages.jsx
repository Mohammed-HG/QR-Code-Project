import { usePreferences } from './preferences';
import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import { request } from './api';
import { Link, useNavigation } from './navigation';
function AuthLayout({ title, children }) {
  const {t}=usePreferences();
  return <div className="auth-layout"><section className="panel auth-panel"><p className="eyebrow">QR CODE PROJECT</p><h1>{title}</h1>{children}</section></div>;
}
export function LoginPage() {
  const {t}=usePreferences();
  const { login } = useAuth();
  const { navigate } = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await login(username, password); navigate('/'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <AuthLayout title={t('Welcome back')}>
    {new URLSearchParams(window.location.search).has('passwordChanged') && <p className="alert success" role="status">{t('Password changed. Sign in again.')}</p>}
    {new URLSearchParams(window.location.search).has('registered') && <p className="alert success" role="status">{t("Account created. Sign in to continue.")}</p>}
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="username">{t("Username")}</label><input id="username" required minLength={3} maxLength={32} autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} disabled={busy} /></div>
      <div className="field"><label htmlFor="password">{t("Password")}</label><input id="password" type="password" required maxLength={72} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></div>
      {error && <p role="alert" className="alert error">{t(error)}</p>}
      <button className="button primary" type="submit" disabled={busy}>{t(busy ? 'Signing in…' : 'Sign in')}</button>
    </form>
    <p className="auth-link">New here? <Link href="/register">{t("Create an account")}</Link></p>
  </AuthLayout>;
}
export function RegisterPage() {
  const {t}=usePreferences();
  const { navigate } = useNavigation();
  const [details, setDetails] = useState({ username: '', email: '', password: '' });
  const [challengeId, setChallengeId] = useState('');
  const [proof, setProof] = useState('');
  const [otp, setOtp] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);
  async function send() {
    const response = await request('/api/send-otp', { method: 'POST', body: { contact: details.email, type: 'email' } });
    setChallengeId(response.challengeId); setProof(''); setOtp('');
    setResendAt(Date.now() + response.resendAfter * 1000);
    setMessage('A six-digit code has been sent to your email. It expires in five minutes.');
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (!challengeId) { await send(); return; }
      let verificationToken = proof;
      if (!verificationToken) {
        const response = await request('/api/verify-otp', { method: 'POST', body: { challengeId, contact: details.email, otp } });
        verificationToken = response.verificationToken; setProof(verificationToken);
      }
      await request('/api/register', { method: 'POST', body: { ...details, verificationToken } });
      navigate('/login?registered=1');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true); setError('');
    try { await send(); } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const field = name => ({ value: details[name], onChange: event => setDetails(old => ({ ...old, [name]: event.target.value })), disabled: busy || Boolean(challengeId) });
  return <AuthLayout title={t('Create your account')}>
    <p>{t("Verify your email to finish signing up.")}</p>
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="new-username">{t("Username")}</label><input id="new-username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_ ]{3,32}" autoComplete="username" {...field('username')} /><small>{t("3–32 letters, numbers, spaces or underscores.")}</small></div>
      <div className="field"><label htmlFor="new-email">{t("Email")}</label><input id="new-email" type="email" required maxLength={254} autoComplete="email" {...field('email')} /></div>
      <div className="field"><label htmlFor="new-password">{t("Password")}</label><input id="new-password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" {...field('password')} /><small>{t("At least 12 characters, at most 72 UTF-8 bytes.")}</small></div>
      {challengeId && !proof && <div className="field"><label htmlFor="otp">{t("Verification code")}</label><input id="otp" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} disabled={busy} /></div>}
      {message && <p className="alert success" role="status">{t(message)}</p>}
      {error && <p className="alert error" role="alert">{t(error)}</p>}
      <button className="button primary" type="submit" disabled={busy}>{t(busy ? 'Please wait…' : challengeId ? 'Verify and create account' : 'Send verification code')}</button>
      {challengeId && <div className="auth-actions">
        <button type="button" className="text-button" disabled={busy || seconds > 0} onClick={resend}>{seconds > 0 ? t('Resend in') + ' ' + seconds + ' ' + t('seconds') : t('Resend code')}</button>
        <button type="button" className="text-button" disabled={busy} onClick={() => { setChallengeId(''); setProof(''); setOtp(''); setError(''); setMessage(''); }}>{t("Edit account details")}</button>
      </div>}
    </form>
    <p className="auth-link">Already registered? <Link href="/login">{t("Sign in")}</Link></p>
  </AuthLayout>;
}
