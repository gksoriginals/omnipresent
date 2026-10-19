import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {runReplay,type ReplayCase} from '../server/experiments/replay.js';
import {JsonlTraceSink} from '../server/experiments/file-trace.js';
import {LibraryPolicy} from '../server/controllers/library-policy.js';
import {hybridRetrieval} from '../server/controllers/retrieval.js';
import {CachedEmbedder} from '../server/models/cached-embeddings.js';
import {EmbeddingGemmaModel} from '../server/models/embeddings.js';
import {evidenceGate,interpretEvidence,sourceDigest} from '../server/controllers/evidence-contract.js';
import {LocalHybridSelector,RankedEligibleSelector,ClassifierPreferenceSelector,type SelectionContext} from '../server/presentation/selection.js';
import {LocalClassifierPreference} from '../server/experiments/local-preference.js';
import {contractedLibrary} from './evidence-fixtures.js';
import {sourceBackedLibrary,sourceBackedCases} from './source-backed-evidence-fixture.js';
import {cueBundles,policyCases} from './cue-policy-fixture.js';
const id=process.argv[2];if(!id||!/^RUN-[\w-]+$/.test(id))throw Error('Unique RUN id required');const directory=`docs/validation/runs/${id}`;await mkdir(directory);
const startedAt=new Date().toISOString(),hash=(data:string|Buffer)=>createHash('sha256').update(data).digest('hex');
const assets=[...contractedLibrary(),...sourceBackedLibrary()];
const pv=sourceBackedLibrary().find(a=>a.id==='pv-conversion')!;if(!pv)throw Error('Missing source-backed PV fixture');
const alternative={...structuredClone(pv),id:'pv-alternative',title:'Alternate photovoltaic explanation',text:'Photovoltaic cells turn sunlight into electricity in a PV panel.'};
const baseCases:ReplayCase[]=[...policyCases,...sourceBackedCases].map((c,i)=>({id:c.id,speech:c.speech,expected:{action:z.enum(['show','hold','context']).parse(c.action),selected:c.expected},refresh:i%8===0}));
const choiceSpeech=`Please explain actual ${pv.entity} photovoltaic conversion statement`;
const cases:ReplayCase[]=[...baseCases,{id:'choice-add',speech:choiceSpeech,expected:{action:'show',selected:pv.id},acceptable:[{action:'show',selected:alternative.id}],refresh:true},{id:'choice-repeat',speech:`Now ${choiceSpeech}`,expected:{action:'show',selected:pv.id},acceptable:[{action:'show',selected:alternative.id}]},{id:'choice-missing',speech:`${choiceSpeech} including installation cost`,expected:{action:'context',selected:null}},{id:'choice-withdraw',speech:choiceSpeech,expected:{action:'context',selected:null},refresh:true},{id:'choice-restore',speech:choiceSpeech,expected:{action:'show',selected:pv.id},acceptable:[{action:'show',selected:alternative.id}],refresh:true}];
const inputs={assets,alternative,cases,passes:3,arms:['eligibility-first','hybrid-ranking','classifier-preference'],profile:'local-only-role-assignment-v1',note:'Historical 37 authored cases unchanged; five declared addition/withdrawal/preference cases appended before execution. All acceptable alternate IDs are explicit.'};
await writeFile(`${directory}/inputs.json`,JSON.stringify(inputs,null,2));
const sourceFiles:{path:string;sha256:string}[]=[];async function capture(path:string){const data=await readFile(path),target=`${directory}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,data);sourceFiles.push({path,sha256:hash(data)});}
async function walk(path:string){for(const file of await readdir(path,{withFileTypes:true})){const p=`${path}/${file.name}`;if(file.isDirectory())await walk(p);else if(/\.(ts|json)$/.test(p))await capture(p);}}
for(const folder of ['server','shared'])await walk(folder);
for(const path of ['scripts/local-role-replay.ts','scripts/evidence-fixtures.ts','scripts/large-library-fixture.ts','scripts/source-backed-evidence-fixture.ts','scripts/cue-policy-fixture.ts','tests/fixtures/evidence-source-snapshots.json','runtime/preference_worker.py','runtime/classifier-requirements.lock','runtime/retrieval-model.json','package.json','package-lock.json'])await capture(path);
await writeFile(`${directory}/start-manifest.json`,JSON.stringify({id,startedAt,inputHash:hash(await readFile(`${directory}/inputs.json`)),sourceFiles,profile:inputs.profile},null,2));
const preference=new LocalClassifierPreference();console.log('Loading the optional native local preference worker…');await preference.start();console.log(`Worker ready in ${preference.stats.loadMs.toFixed(0)} ms`);
const counters:any[]=[];
try{
 const report=await runReplay({cases,passes:3,arms:inputs.arms,timeoutMs:180000,sink:c=>new JsonlTraceSink(`${directory}/trace.jsonl`,{runId:id,...c}),row:row=>{appendFileSync(`${directory}/steps.jsonl`,JSON.stringify(row)+'\n');if(row.refreshed)console.log(JSON.stringify({pass:row.pass,arm:row.arm,case:row.caseId,correct:row.correct,ms:Math.round(row.elapsedMs)}));},create(pass,arm,sink){
  const count={pass,arm,documentEncodes:0,queryEncodes:0,selections:0,preselections:0};counters.push(count);
  const source=new EmbeddingGemmaModel();
  const observed={space:source.space,async encode(texts:string[],kind:'query'|'document',signal:AbortSignal){if(kind==='query')count.queryEncodes+=texts.length;else count.documentEncodes+=texts.length;return source.encode(texts,kind,signal);}};
  const ownedCache=new CachedEmbedder(observed,1024);
  let currentAssets=structuredClone(assets);const selector=arm==='eligibility-first'?new LocalHybridSelector():arm==='hybrid-ranking'?new RankedEligibleSelector():new ClassifierPreferenceSelector(preference);
  const policy=new LibraryPolicy(ownedCache,async()=>{throw Error('Missing local per-turn selection');},undefined,hybridRetrieval,sink);
  const bundles=(all:typeof assets)=>cueBundles(all.filter(a=>a.id.includes('/')));
  return {id:arm,initialize:signal=>policy.refresh(currentAssets,bundles(currentAssets),signal),async refresh(test,pass,signal){
   currentAssets=structuredClone(assets);currentAssets[0].text+=` Revision ${pass}/${test.id}`;currentAssets[0].evidence.sources[0].summary=currentAssets[0].text;currentAssets[0].evidence.sources[0].sha256=sourceDigest(currentAssets[0].text);
   if(test.id==='choice-add'||test.id==='choice-restore')currentAssets.push(structuredClone(alternative));
   if(test.id==='choice-withdraw')currentAssets=currentAssets.filter(a=>a.id!==pv.id);
   await policy.refresh(currentAssets,bundles(currentAssets),signal);
  },async decide(test,signal){
   const intent=interpretEvidence(test.speech,currentAssets),context:SelectionContext={speech:test.speech,assets:currentAssets,intent,current:policy.currentAsset,requireIndependentReview:false};
   const strict=evidenceGate({requireIndependentReview:false,interpret:()=>intent});
   const gate={...strict,before:(speech:string,all:Parameters<typeof strict.before>[1],current:string|null)=>{const guarded=strict.before(speech,all,current);if(guarded)return guarded;const selected=selector.preselect(context);if(selected)count.preselections++;return selected;}};
   return policy.decide(test.speech,signal,true,undefined,gate,async(speech,ranked,abort)=>{count.selections++;return selector.select({...context,assets:ranked},abort);});
  }};
 }});
 const allCorrect=report.rows.every(row=>row.correct);await writeFile(`${directory}/replay.json`,JSON.stringify({id,startedAt,finishedAt:new Date().toISOString(),sourceFiles,inputHash:hash(await readFile(`${directory}/inputs.json`)),profile:inputs.profile,...report,counters,preference:preference.stats,allCorrect,hostedCalls:0,hostedCost:0,productionAcceptance:false,limitations:['Authored development library: 432 constructed distractors plus 6 curated source cards and one declared alternate; not an independent real-media holdout.','Repeated text decision intervals include scheduled refresh, final gate, local preference and errors; exclude STT and paint.','Index caches are isolated per arm/pass. The native preference process is shared and resident across passes; its startup is separately reported, not hidden.','All 37 historical expected actions/IDs remain unchanged. Five appended cases have declared alternate acceptable IDs.','No hosted comparator was called; zero hosted cost excludes local compute/energy.']},null,2));console.log(JSON.stringify({id,allCorrect,summary:report.summary,counters,preference:preference.stats},null,2));if(!allCorrect)process.exitCode=1;
}finally{preference.close();}
