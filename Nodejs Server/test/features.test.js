const {test}=require('node:test');
const assert=require('node:assert/strict');
const request=require('supertest');
const bcrypt=require('bcrypt');
const {randomBytes}=require('node:crypto');
const {createApp}=require('../app');
const {configFromEnv}=require('../config');
const {memoryRepository}=require('./helpers');
const {copyDefaults}=require('../site-settings');
async function fixture(){
  const repository=memoryRepository(),password='test-only strong password',digest=await bcrypt.hash(password,4);
  repository.users.push({id:1,username:'mhg admin',displayName:'MHG Admin',email:'admin@example.com',password:digest,role:'admin',status:'active'},{id:2,username:'person',email:'person@example.com',password:digest,role:'user',status:'active'});
  const app=createApp({repository,mailer:{ready:false},config:configFromEnv({AUTH_SECRET:randomBytes(32).toString('hex')})});
  async function login(username){const response=await request(app).post('/api/login').send({username,password}).expect(200);return {cookie:response.headers['set-cookie'][0].split(';')[0],csrf:response.body.csrfToken};}
  return {app,repository,password,login};
}
test('only administrators can read account data or modify settings',async()=>{
  const f=await fixture(),user=await f.login('person'),admin=await f.login('MHG Admin');
  await request(f.app).get('/api/admin/users').expect(401);
  await request(f.app).get('/api/admin/users').set('Cookie',user.cookie).expect(403);
  await request(f.app).post('/api/admin/settings').set('Cookie',admin.cookie).send({settings:copyDefaults(),revision:0}).expect(403);
  const users=await request(f.app).get('/api/admin/users').set('Cookie',admin.cookie).expect(200);
  assert.equal(users.body.users.length,2);assert(!JSON.stringify(users.body).includes('password'));assert(!JSON.stringify(users.body).includes('$2b$'));
  await request(f.app).post('/api/admin/users/2').set('Cookie',user.cookie).set('X-CSRF-Token',user.csrf).send({action:'block'}).expect(403);
});
test('blocking invalidates sessions immediately; unblocking permits new logins',async()=>{
  const f=await fixture(),admin=await f.login('mhg admin'),user=await f.login('person');
  const moderate=body=>request(f.app).post('/api/admin/users/2').set('Cookie',admin.cookie).set('X-CSRF-Token',admin.csrf).send(body);
  await moderate({action:'block'}).expect(200);
  await request(f.app).get('/api/users/me').set('Cookie',user.cookie).expect(401);
  await request(f.app).post('/api/login').send({username:'person',password:f.password}).expect(401);
  await moderate({action:'unblock'}).expect(200);
  await f.login('person');
  await request(f.app).post('/api/admin/users/1').set('Cookie',admin.cookie).set('X-CSRF-Token',admin.csrf).send({action:'block'}).expect(409);
  assert.equal(f.repository.users[0].status,'active');
});
test('deletion needs exact confirmation and current administrator password',async()=>{
  const f=await fixture(),admin=await f.login('mhg admin'),user=await f.login('person');
  const remove=body=>request(f.app).post('/api/admin/users/2').set('Cookie',admin.cookie).set('X-CSRF-Token',admin.csrf).send({action:'delete',...body});
  await remove({confirmUsername:'other',currentPassword:f.password}).expect(400);
  await remove({confirmUsername:'person',currentPassword:'wrong password'}).expect(403);
  await remove({confirmUsername:'person',currentPassword:f.password}).expect(200);
  await request(f.app).get('/api/users/me').set('Cookie',user.cookie).expect(401);
  assert.equal(f.repository.users.length,1);assert.equal(f.repository.users[0].role,'admin');
});
test('visual editor validates structure and rejects stale writes or feature bypass',async()=>{
  const f=await fixture(),admin=await f.login('mhg admin'),settings=copyDefaults();
  settings.content.ar.title='عنوان جديد';settings.sections.reverse();settings.features.logos=false;
  const save=(settings,revision)=>request(f.app).post('/api/admin/settings').set('Cookie',admin.cookie).set('X-CSRF-Token',admin.csrf).send({settings,revision});
  const saved=await save(settings,0).expect(200);assert.equal(saved.body.revision,1);
  const visible=await request(f.app).get('/api/site').expect(200);assert.equal(visible.body.settings.content.ar.title,'عنوان جديد');
  await save(settings,0).expect(409);
  const invalid=structuredClone(settings);invalid.sections[0].id='script';await save(invalid,1).expect(400);
  const hidden=structuredClone(settings);hidden.sections.find(s=>s.id==='generator').visible=false;await save(hidden,1).expect(400);
  const injection=structuredClone(settings);injection.appearance.accent='url(https://evil.example)';await save(injection,1).expect(400);
  await request(f.app).post('/qr/generate-qr').send({text:'test',logo:'anything'}).expect(403);
  const log=await request(f.app).get('/api/admin/audit').set('Cookie',admin.cookie).expect(200);assert.equal(log.body.events.length,1);
});
test('profile cannot elevate role, skip email proof, or keep old sessions after password change',async()=>{
  const f=await fixture(),user=await f.login('person');
  const save=body=>request(f.app).post('/api/users/me').set('Cookie',user.cookie).set('X-CSRF-Token',user.csrf).send({username:'person',email:'person@example.com',currentPassword:f.password,...body});
  await save({displayName:'New name',bio:'Hello',role:'admin'}).expect(200);
  assert.equal(f.repository.users[1].role,'user');
  const me=await request(f.app).get('/api/users/me').set('Cookie',user.cookie).expect(200);assert.equal(me.body.user.displayName,'New name');assert(!me.body.user.password);
  await save({email:'other@example.com'}).expect(400);
  await save({currentPassword:'wrong password'}).expect(403);
  const result=await save({newPassword:'brand new secret password'}).expect(200);assert(result.body.reauthenticate);
  await request(f.app).get('/api/users/me').set('Cookie',user.cookie).expect(401);
  await request(f.app).post('/api/login').send({username:'person',password:f.password}).expect(401);
  await request(f.app).post('/api/login').send({username:'person',password:'brand new secret password'}).expect(200);
});
