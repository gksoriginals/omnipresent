import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evidenceGate,type EvidenceAsset} from '../server/controllers/evidence-contract.js';
import {storyRequestFrame} from '../server/presentation/request-frame.js';
import type {LibraryDecision} from '../server/controllers/library-policy.js';
const root=process.argv[2];if(!root||!/^docs\/validation\/runs\/RUN-[\w-]+$/.test(root))throw Error('Run path required');
const inputs=JSON.parse(await readFile(`${root}/inputs.json`,'utf8')),start=JSON.parse(await readFile(`${root}/start-manifest.json`,'utf8'));
const reports=[];
for(const name of (await readdir(root)).filter(n=>/^(gliner|laya).+\.json$/.test(n))){
 const report=JSON.parse(await readFile(`${root}/${name}`,'utf8'));const guarded=[];
 for(const row of report.rows){
  const test=inputs.cases.find((c:any)=>c.id===row.id),assets:EvidenceAsset[]=inputs.assets[test.story];
  const gate=evidenceGate({requireIndependentReview:false,interpret:(speech,all)=>storyRequestFrame(speech,all,'local-screen').intent});
  const proposal:LibraryDecision=['hold','context'].includes(row.choice)?{action:row.choice,selected:null}:{action:'show',selected:row.choice};
  const before=gate.before(test.speech,assets,null),after=before??(row.error?{action:'hold',selected:null}:gate.after(test.speech,proposal,assets,null));
  const result=after.action==='show'?after.selected:after.action;
  guarded.push({id:row.id,pass:row.pass,expected:row.expected,result,correct:result===row.expected,preflight:!!before,rejectedProposal:!before&&proposal.action==='show'&&after.action!=='show'});
 }
 reports.push({...report,memoryScope:report.profile.startsWith('laya')?'Benchmark HTTP client process only; existing Laya server memory is excluded':'Isolated in-process model benchmark, including library import and initialization peak',guardedSummary:{scope:'Actual evidence gate/request interpreter overlay on recorded direct choices. No retrieval, new model calls, composition commit or UI.',correct:guarded.filter(r=>r.correct).length,total:guarded.length,positiveCorrect:guarded.filter(r=>!['hold','context'].includes(r.expected)&&r.correct).length,negativeCorrect:guarded.filter(r=>['hold','context'].includes(r.expected)&&r.correct).length,wrongShows:guarded.filter(r=>r.result!==null&&!['hold','context'].includes(r.result)&&!r.correct).length},guardedRows:guarded});
}
const priorFiles=new Map(start.sourceFiles.map((s:any)=>[s.path,s]));
for(const path of ['scripts/summarize-compact-local.ts','runtime/decision_server.py','runtime/decision-requirements.lock','scripts/setup-compact-local.mjs','server/controllers/evidence-contract.ts','server/presentation/request-frame.ts']){const bytes=await readFile(path),target=`${root}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,bytes);priorFiles.set(path,{path,sha256:createHash('sha256').update(bytes).digest('hex')});}
const output={id:root.split('/').pop(),recordedAt:new Date().toISOString(),sourceFiles:[...priorFiles.values()],inputHash:start.inputHash,reports,scope:'Pinned CPU small-model screen; native precision then reduced precision only if the frozen research gate passes.',productionAcceptance:false,limitations:['24 authored cases repeated under 3 option orders, not 72 independent quality samples.','Host guard overlay is not the complete hybrid retrieval, fallback, lifecycle or final UI guard path. Raw quality is reported independently so an always-hold guarded system cannot pass.','Laya HTTP response time and GLiNER in-process time use different transports; latency is not a hardware-normalized model ranking.','All downloaded decision checkpoints are local; no hosted decision or teacher-label calls.','No deployment promotion or probability calibration from this authored development set.']};
await writeFile(`${root}/replay.json`,JSON.stringify(output,null,2));console.log(JSON.stringify(reports.map(r=>({profile:r.profile,raw:r.summary,guarded:r.guardedSummary,precisionEligible:r.eligibleForPrecisionExperiment})),null,2));
