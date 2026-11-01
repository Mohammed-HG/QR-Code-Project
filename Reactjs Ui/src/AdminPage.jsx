import { useEffect,useRef,useState } from 'react';
import { useAuth } from './auth';
import { usePreferences } from './preferences';
import { Link } from './navigation';
import SiteEditor from './SiteEditor';
function DeleteDialog({user,onClose,onDelete,busy,error}){
  const {t}=usePreferences(),dialog=useRef(null),[confirmation,setConfirmation]=useState(''),[password,setPassword]=useState('');
  useEffect(()=>{dialog.current?.showModal?.();return()=>dialog.current?.close?.();},[]);
  return <dialog ref={dialog} className="delete-dialog" aria-labelledby="delete-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}><form onSubmit={e=>{e.preventDefault();onDelete({action:'delete',confirmUsername:confirmation,currentPassword:password});}}><h2 id="delete-title">{t('Delete account')}: <bdi>{user.username}</bdi></h2><p>{t('Type the username and your administrator password to delete this account permanently.')}</p><div className="field"><label htmlFor="delete-confirm">{t('Confirm username')}</label><input id="delete-confirm" required autoComplete="off" value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoFocus/></div><div className="field"><label htmlFor="delete-password">{t('Current password')}</label><input id="delete-password" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></div>{error&&<p className="alert error" role="alert">{error}</p>}<div className="action-row"><button className="button danger" type="submit" disabled={busy||confirmation!==user.username}>{t('Delete')}</button><button className="button secondary" type="button" disabled={busy} onClick={onClose}>{t('Cancel')}</button></div></form></dialog>;
}
function Users(){
  const auth=useAuth(),{t,language}=usePreferences(),api=useRef(auth.api);api.current=auth.api;
  const [search,setSearch]=useState(''),[filter,setFilter]=useState(''),[page,setPage]=useState(1),[reload,setReload]=useState(0),[data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[deleting,setDeleting]=useState(null),[message,setMessage]=useState('');
  useEffect(()=>{const controller=new AbortController();setError('');api.current('/api/admin/users?search='+encodeURIComponent(filter)+'&page='+page,{signal:controller.signal}).then(setData).catch(err=>{if(!controller.signal.aborted)setError(t(err.message));});return()=>controller.abort();},[filter,page,reload]);
  async function action(user,body){
    setBusy(true);setError('');setMessage('');
    try{await auth.api('/api/admin/users/'+user.id,{method:'POST',body});setDeleting(null);setReload(n=>n+1);setMessage(t('Account updated.'));}
    catch(err){setError(t(err.message));}finally{setBusy(false);}
  }
  return <><div className="stats-grid">{[['Total accounts',data?.stats.total],['Blocked',data?.stats.blocked],['Administrators',data?.stats.admins]].map(([label,count])=><div className="panel stat" key={label}><span>{t(label)}</span><strong>{count??'—'}</strong></div>)}</div><section className="panel">
    <form className="search-bar" onSubmit={e=>{e.preventDefault();setPage(1);setFilter(search);}}><div className="field"><label htmlFor="user-search">{t('Search accounts')}</label><input id="user-search" maxLength={80} value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="button secondary" type="submit">{t('Search')}</button></form>
    {error&&!deleting&&<p className="alert error" role="alert">{error}</p>}{message&&<p className="alert success" role="status">{message}</p>}
    <div className="table-scroll"><table><thead><tr>{['Username','Email','User','Active','Date','Action'].map(key=><th key={key}>{t(key)}</th>)}</tr></thead><tbody>{data?.users.map(user=><tr key={user.id}><td><bdi>{user.displayName||user.username}</bdi><small className="table-sub" dir="auto">@{user.username}</small></td><td dir="auto">{user.email}</td><td>{t(user.role==='admin'?'Administrator':'User')}</td><td><span className={'status-pill '+(user.status==='blocked'?'blocked':'')}>{t(user.status==='blocked'?'Blocked':'Active')}</span></td><td>{user.createdAt?new Intl.DateTimeFormat(language==='ar'?'ar-SA':'en-GB',{dateStyle:'short'}).format(new Date(user.createdAt)):'—'}</td><td><div className="action-row"><button type="button" className="button secondary compact" disabled={busy||user.role==='admin'} onClick={()=>action(user,{action:user.status==='blocked'?'unblock':'block'})}>{t(user.status==='blocked'?'Unblock':'Block')}</button><button type="button" className="button danger compact" disabled={busy||user.role==='admin'} onClick={()=>{setError('');setDeleting(user);}}>{t('Delete')}</button></div></td></tr>)}</tbody></table></div>
    {data&&!data.users.length&&<p>{t('No accounts found.')}</p>}<div className="pagination"><button className="button secondary compact" disabled={page===1||busy} onClick={()=>setPage(n=>n-1)}>{t('Previous')}</button><span>{t('Page')} {page}</span><button className="button secondary compact" disabled={!data||page*20>=data.total||busy} onClick={()=>setPage(n=>n+1)}>{t('Next')}</button></div>
  </section>{deleting&&<DeleteDialog user={deleting} onClose={()=>{setDeleting(null);setError('');}} onDelete={body=>action(deleting,body)} busy={busy} error={error}/>}</>;
}
function Audit(){
  const {api}=useAuth(),{t,language}=usePreferences(),[events,setEvents]=useState([]),[error,setError]=useState('');
  useEffect(()=>{const controller=new AbortController();api('/api/admin/audit',{signal:controller.signal}).then(data=>setEvents(data.events)).catch(err=>{if(!controller.signal.aborted)setError(t(err.message));});return()=>controller.abort();},[]);
  return <section className="panel"><h2>{t('Activity log')}</h2>{error&&<p className="alert error">{error}</p>}<div className="table-scroll"><table><thead><tr>{['Action','Actor','Target','Date'].map(key=><th key={key}>{t(key)}</th>)}</tr></thead><tbody>{events.map(event=><tr key={event.id}><td>{t(event.action)}</td><td><bdi>{event.actor||'—'}</bdi></td><td>{event.targetId||'—'}</td><td>{new Intl.DateTimeFormat(language==='ar'?'ar-SA':'en-GB',{dateStyle:'short',timeStyle:'short'}).format(new Date(event.createdAt))}</td></tr>)}</tbody></table></div>{!events.length&&<p>{t('No activity yet.')}</p>}</section>;
}
export default function AdminPage(){
  const {user,loading}=useAuth(),{t}=usePreferences(),[tab,setTab]=useState('users');
  if(loading)return <p role="status">{t('Loading account…')}</p>;
  if(!user)return <section className="panel"><h1>{t('Admin dashboard')}</h1><Link href="/account">{t('Please sign in.')}</Link></section>;
  if(user.role!=='admin')return <section className="panel"><h1>{t('Admin dashboard')}</h1><p role="alert">{t('Administrator access is required.')}</p></section>;
  return <><div className="admin-heading"><p className="eyebrow">{t('Control center')}</p><h1>{t('Admin dashboard')}</h1></div><div className="service-tabs" role="group" aria-label={t('Admin dashboard')}>{[['users','Users'],['editor','Site editor'],['audit','Activity log']].map(([key,label])=><button type="button" key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{t(label)}</button>)}</div>{tab==='users'?<Users/>:tab==='editor'?<SiteEditor/>:<Audit/>}</>;
}
