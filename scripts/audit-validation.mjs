import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import os from 'node:os';
const runId=process.argv[2];
if(!runId||!/^[A-Za-z0-9_-]+$/.test(runId))throw Error('Provide a unique safe run ID');
const root=`docs/validation/runs/${runId}`;
await mkdir(root,{recursive:false});
const startedAt=new Date().toISOString();
const commands=[];
for(const [id,args] of [['unit-integration',['test']],['typecheck-build',['run','build']]]){
 const began=performance.now();const result=spawnSync('npm',args,{encoding:'utf8',timeout:180000,maxBuffer:10_000_000});
 const output=(result.stdout??'')+(result.stderr??'');await writeFile(`${root}/${id}.log`,output);
 commands.push({id,command:`npm ${args.join(' ')}`,exitCode:result.status,signal:result.signal,error:result.error?.message,elapsedMs:performance.now()-began,log:`${root}/${id}.log`,...(id==='unit-integration'?{counts:Object.fromEntries(['tests','pass','fail','skipped','cancelled'].map(k=>[k,Number(output.match(new RegExp(`^# ${k} (\\d+)$`,'m'))?.[1]??NaN)]))}:{})});
}
const sha256=content=>createHash('sha256').update(content).digest('hex');
const files=[];
async function walk(path){for(const entry of await readdir(path,{withFileTypes:true})){if(entry.name.startsWith('.')||entry.name==='__pycache__')continue;const p=`${path}/${entry.name}`;if(entry.isDirectory())await walk(p);else if(/\.(ts|tsx|css|html|json|mjs|py|lock|md)$/.test(p)){const bytes=await readFile(p);files.push({path:p,sha256:sha256(bytes),bytes:bytes.length});}}}
for(const path of ['app/src','shared','server','scripts','tests','runtime'])await walk(path);
for(const path of ['package.json','package-lock.json','app/index.html','tsconfig.json','vite.config.ts']){const bytes=await readFile(path);files.push({path,sha256:sha256(bytes),bytes:bytes.length});}
const git=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'});
const python=spawnSync('.venv/bin/python',['--version'],{encoding:'utf8'});
const record={id:runId,startedAt,finishedAt:new Date().toISOString(),scope:'Current automated software tests and production build only. No model API calls, audio replay, browser test, historical rerun or component benchmark implied.',environment:{node:process.version,python:python.status===0?python.stdout.trim():null,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,memoryBytes:os.totalmem()},git:git.status===0?{commit:git.stdout.trim(),note:'Uncommitted contents are identified by file hashes; a commit alone does not identify this run.'}:{commit:null,note:'No Git revision available; use captured source hashes.'},commands,sourceFiles:files.sort((a,b)=>a.path.localeCompare(b.path))};
await writeFile(`${root}/run.json`,JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({id:runId,commands:commands.map(({command,exitCode,counts})=>({command,exitCode,counts}))},null,2));
if(commands.some(c=>c.exitCode!==0))process.exitCode=1;
