import {spawnSync,spawn} from 'node:child_process';
import {resolve} from 'node:path';

const root=process.cwd();
for(const command of [['run','build'],['run','macos:pack']]){
  const result=spawnSync('npm',command,{cwd:root,stdio:'inherit'});
  if(result.status!==0)process.exit(result.status??1);
}
const executable=resolve(root,'output/macos/Omnipresent.app/Contents/MacOS/Omnipresent');
const app=spawn(executable,[],{cwd:root,env:process.env,stdio:'inherit'});
const stop=signal=>{if(!app.killed)app.kill(signal)};
process.once('SIGINT',()=>stop('SIGINT'));
process.once('SIGTERM',()=>stop('SIGTERM'));
app.once('exit',(code,signal)=>{process.exitCode=code??(signal?1:0)});
