import { useState } from 'react';
import { useAuth } from './auth';
import { usePreferences } from './preferences';
import { Link,useNavigation } from './navigation';
function ProfileEditor({user}) {
  const {t,language}=usePreferences(),auth=useAuth(),{navigate}=useNavigation();
  const [form,setForm]=useState({username:user.username,email:user.email,displayName:user.displayName||'',bio:user.bio||'',currentPassword:'',newPassword:''});
  const [challenge,setChallenge]=useState(''),[otp,setOtp]=useState(''),[proof,setProof]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[resendAt,setResendAt]=useState(0);
  const field=key=>({value:form[key],onChange:event=>{setForm(old=>({...old,[key]:event.target.value}));if(key==='email'){setChallenge('');setProof('');setOtp('');}},disabled:busy});
  async function verifyEmail(){
    setBusy(true);setError('');
    try {
      if(!challenge){
        if(Date.now()<resendAt)throw new Error('Wait a minute before requesting another code.');
        const sent=await auth.api('/api/send-otp',{method:'POST',body:{contact:form.email,type:'email'}});
        setChallenge(sent.challengeId);setResendAt(Date.now()+60000);setMessage('A six-digit code has been sent to your email. It expires in five minutes.');
      }else{
        const result=await auth.api('/api/verify-otp',{method:'POST',body:{challengeId:challenge,contact:form.email,otp}});
        setProof(result.verificationToken);setMessage('New email verified.');
      }
    }catch(err){setError(t(err.message));}finally{setBusy(false);}
  }
  async function submit(event){
    event.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      const result=await auth.saveProfile({...form,verificationToken:proof});
      setForm(old=>({...old,currentPassword:'',newPassword:''}));setChallenge('');setProof('');
      if(result.reauthenticate){navigate('/login?passwordChanged=1');}else setMessage('Saved successfully.');
    }catch(err){setError(t(err.message));}finally{setBusy(false);}
  }
  return <div className="profile-layout"><aside className="panel profile-summary"><div className="avatar" aria-hidden="true">{(user.displayName||user.username).slice(0,1).toUpperCase()}</div><h1>{user.displayName||user.username}</h1><p dir="auto">@{user.username}</p><p dir="auto">{user.email}</p>{user.createdAt&&<p className="hint">{t('Member since')}: {new Intl.DateTimeFormat(language==='ar'?'ar-SA':'en-GB',{dateStyle:'medium'}).format(new Date(user.createdAt))}</p>}<span className="status-pill">{t(user.role==='admin'?'Administrator':'User')}</span></aside>
  <section className="panel"><h2>{t('Edit profile')}</h2><form onSubmit={submit}>
    <div className="two-columns"><div className="field"><label htmlFor="profile-name">{t('Display name')}</label><input id="profile-name" maxLength={80} autoComplete="name" {...field('displayName')}/></div><div className="field"><label htmlFor="profile-username">{t('Username')}</label><input id="profile-username" required minLength={3} maxLength={32} autoComplete="username" {...field('username')}/></div></div>
    <div className="field"><label htmlFor="profile-bio">{t('Bio')}</label><textarea id="profile-bio" rows="3" maxLength={500} {...field('bio')}/></div>
    <div className="field"><label htmlFor="profile-email">{t('Email')}</label><input id="profile-email" type="email" required maxLength={254} autoComplete="email" {...field('email')}/></div>
    {form.email.trim().toLowerCase()!==user.email&&!proof&&<div className="email-verification">{challenge&&<div className="field"><label htmlFor="profile-otp">{t('Verification code')}</label><input id="profile-otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={otp} onChange={e=>setOtp(e.target.value)}/></div>}<button className="button secondary" type="button" disabled={busy||(challenge&&otp.length!==6)} onClick={verifyEmail}>{t(challenge?'Verify new email':'Send verification code')}</button></div>}
    <div className="field"><label htmlFor="profile-current-password">{t('Current password')}</label><input id="profile-current-password" type="password" required autoComplete="current-password" maxLength={72} {...field('currentPassword')}/><small>{t('Enter your current password to save changes.')}</small></div>
    <div className="field"><label htmlFor="profile-new-password">{t('New password')}</label><input id="profile-new-password" type="password" minLength={12} maxLength={72} autoComplete="new-password" {...field('newPassword')}/><small>{t('Leave blank to keep your password.')}</small></div>
    {error&&<p className="alert error" role="alert">{error}</p>}{message&&<p className="alert success" role="status">{t(message)}</p>}
    <button className="button primary" type="submit" disabled={busy||(form.email.trim().toLowerCase()!==user.email&&!proof)}>{t(busy?'Saving…':'Save profile')}</button>
  </form></section></div>;
}
export default function ProfilePage(){const {user,loading}=useAuth(),{t}=usePreferences();if(loading)return <p role="status">{t('Loading account…')}</p>;if(!user)return <section className="panel"><h1>{t('Profile')}</h1><Link href="/account">{t('Please sign in.')}</Link></section>;return <ProfileEditor user={user}/>;}
