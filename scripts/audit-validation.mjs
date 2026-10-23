import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import os from 'node:os';

const runId=process.argv[2];
if(!runId||!/^[A-Za-z0-9_-]+$/.test(runId))throw Error('Provide a unique safe run ID');
const outputDirectory=`docs/validation/runs/${runId}`;
await mkdir(outputDirectory,{recursive:false});
const startedAt=new Date().toISOString();
const commands=[];
const checks=[
  ['unit-integration',['test']],
  ['typecheck-build',['run','build']],
  ['packaged-macos-app',['run','macos:pack']],
  ['publication-check',['run','check:publication']],
];
for(const [id,args] of checks){
  const began=performance.now();
  const result=spawnSync('npm',args,{encoding:'utf8',timeout:240000,maxBuffer:10_000_000});
  const output=(result.stdout??'')+(result.stderr??'');
  await writeFile(`${outputDirectory}/${id}.log`,output);
  commands.push({id,command:`npm ${args.join(' ')}`,exitCode:result.status,signal:result.signal,error:result.error?.message,elapsedMs:performance.now()-began,log:`${outputDirectory}/${id}.log`,...(id==='unit-integration'?{counts:Object.fromEntries(['tests','pass','fail','skipped','cancelled'].map(key=>[key,Number(output.match(new RegExp(`^# ${key} (\\d+)$`,'m'))?.[1]??NaN)]))}:{})});
}

const sha256=content=>createHash('sha256').update(content).digest('hex');
const files=[];
async function walk(path){
  let entries;try{entries=await readdir(path,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw error;}
  for(const entry of entries){
    if(entry.name.startsWith('.')||entry.name==='__pycache__')continue;
    const pathName=`${path}/${entry.name}`;
    if(entry.isDirectory())await walk(pathName);
    else if(/\.(ts|tsx|swift|css|html|js|cjs|json|mjs|py|lock|md)$/.test(pathName)){const bytes=await readFile(pathName);files.push({path:pathName,sha256:sha256(bytes),bytes:bytes.length});}
  }
}
for(const path of ['shared','server','scripts','tests','runtime','macos'])await walk(path);
await walk(outputDirectory);
const keyFiles=['package.json','package-lock.json','tsconfig.json','.env.example','README.md','docs/README.md','docs/PRD.md','docs/architecture/current.md','docs/architecture/presentation-harness.md','docs/configuration.md','docs/getting-started.md','docs/testing.md','docs/desktop-macos-alpha.md','docs/changelog.md','docs/roadmap.md','docs/images/README.md','docs/third-party-notices.md','.github/CONTRIBUTING.md','.github/SECURITY.md','.github/workflows/ci.yml'];
for(const path of keyFiles){const bytes=await readFile(path);files.push({path,sha256:sha256(bytes),bytes:bytes.length});}
const git=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'});
const record={id:runId,startedAt,finishedAt:new Date().toISOString(),scope:'Current TypeScript coordinator tests, TypeScript type-check, Apple Silicon SwiftUI app compilation and bundle validation including a real packaged-coordinator HTTP smoke test, and publication check. No hosted model requests, model-weight downloads, audio replay, microphone trial, interactive native UI trial, historical rerun or component benchmark implied.',environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,memoryBytes:os.totalmem()},git:git.status===0?{commit:git.stdout.trim(),note:'Uncommitted contents are identified by file hashes; a commit alone does not identify this run.'}:{commit:null,note:'No Git revision available; use captured source hashes.'},commands,sourceFiles:files.sort((a,b)=>a.path.localeCompare(b.path))};
await writeFile(`${outputDirectory}/run.json`,JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({id:runId,commands:commands.map(({command,exitCode,counts})=>({command,exitCode,counts}))},null,2));
if(commands.some(command=>command.exitCode!==0))process.exitCode=1;
