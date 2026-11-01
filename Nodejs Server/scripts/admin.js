const readline = require('node:readline/promises');
const { Writable } = require('node:stream');
const bcrypt = require('bcrypt');
const { configFromEnv } = require('../config');
const { createPool } = require('../db');
const { migrate } = require('./migrate');
const v = require('../lib/validation');
async function main(){
  configFromEnv();
  const args=process.argv.slice(2),index=args.indexOf('--username');
  if(index<0||!args[index+1])throw new Error('Usage: node scripts/admin.js --username "MHG Admin" --create');
  const displayName=v.string(args[index+1],'Display name',3,80),username=v.username(args[index+1]);
  if(!process.stdin.isTTY||!process.stdout.isTTY)throw new Error('Use an interactive local terminal. Passwords cannot be supplied as arguments or piped input.');
  let muted=false;
  const output=new Writable({write(chunk,_encoding,callback){if(!muted)process.stdout.write(chunk);callback();}});
  const terminal=readline.createInterface({input:process.stdin,output,terminal:true});
  async function password(prompt){process.stdout.write(prompt);muted=true;const answer=await terminal.question('');muted=false;process.stdout.write('\n');return answer;}
  let first,second;
  try{first=await password('New administrator password (hidden): ');v.password(first,true);second=await password('Confirm administrator password (hidden): ');if(first!==second)throw new Error('Passwords do not match. Nothing was changed.');}
  finally{terminal.close();}
  const passwordHash=await bcrypt.hash(first,12);first='';second='';
  const pool=createPool();
  try{
    await migrate(pool);
    const connection=await pool.getConnection();
    try{
      await connection.beginTransaction();
      const [rows]=await connection.execute('SELECT UserId,role FROM users WHERE username = ? FOR UPDATE',[username]);
      if(rows[0]){
        if(rows[0].role!=='admin'&&!args.includes('--promote'))throw new Error('This is an existing user. Use --promote explicitly to grant administrator access.');
        await connection.execute("UPDATE users SET password=?,role='admin',status='active',display_name=? WHERE UserId=?",[passwordHash,displayName,rows[0].UserId]);
        await connection.execute('DELETE FROM auth_sessions WHERE user_id=?',[rows[0].UserId]);
      }else{
        if(!args.includes('--create'))throw new Error('Account not found. Use --create to create the initial administrator.');
        const email=username.replace(/ /g,'-')+'@localhost.invalid';
        await connection.execute("INSERT INTO users (username,password,email,display_name,role,status) VALUES (?,?,?,?,'admin','active')",[username,passwordHash,email,displayName]);
      }
      await connection.execute('INSERT INTO admin_audit (action) VALUES (?)',['admin.local.setup']);
      await connection.commit();
      console.log('Administrator ready. Sign in using: '+displayName);
      console.log('No password was written to source, Git, logs or an environment file.');
    }catch(error){await connection.rollback();throw error;}finally{connection.release();}
  }finally{await pool.end();}
}
if(require.main===module)main().catch(error=>{console.error('Administrator setup failed: '+(error.code||error.message));process.exitCode=1;});
