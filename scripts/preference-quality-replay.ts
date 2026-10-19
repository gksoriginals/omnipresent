import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {preferenceQualityFixture} from './preference-quality-fixture.js';
import {contractedLibrary} from './evidence-fixtures.js';
import {sourceBackedLibrary} from './source-backed-evidence-fixture.js';
import {LibrarySearch} from '../server/controllers/library-search.js';
import {CachedEmbedder} from '../server/models/cached-embeddings.js';
import {EmbeddingGemmaModel} from '../server/models/embeddings.js';
import {LocalHybridSelector,ClassifierPreferenceSelector,eligibleAssets,type SelectionContext,type AssetSelector} from '../server/presentation/selection.js';
import {LocalClassifierPreference} from '../server/models/local-preference.js';
import {supportsEvidence,interpretEvidence} from '../server/controllers/evidence-contract.js';
const id=process.argv[2];if(!id||!/^RUN-[\w-]+$/.test(id))throw Error('Unique run ID required');
const dir=`docs/validation/runs/${id}`;await mkdir(dir);
const hash=(data:string|Buffer)=>createHash('sha256').update(data).digest('hex');
const inputs=preferenceQualityFixture();await writeFile(`${dir}/inputs.json`,JSON.stringify(inputs,null,2));
const sourceFiles:{path:string;sha256:string}[]=[];
async function capture(path:string){const data=await readFile(path),target=`${dir}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,data);sourceFiles.push({path,sha256:hash(data)});}
async function walk(path:string){for(const f of await readdir(path,{withFileTypes:true})){const p=`${path}/${f.name}`;if(f.isDirectory())await walk(p);else if(/\.(ts|json)$/.test(p))await capture(p);}}
for(const f of ['server','shared'])await walk(f);
for(const f of ['scripts/preference-quality-replay.ts','scripts/preference-quality-fixture.ts','scripts/evidence-fixtures.ts','scripts/large-library-fixture.ts','scripts/source-backed-evidence-fixture.ts','runtime/preference_worker.py','runtime/reranker_preference_worker.py','runtime/preference-reranker-model.json','runtime/classifier-requirements.lock','package.json','package-lock.json'])await capture(f);
const startedAt=new Date().toISOString(),inputHash=hash(await readFile(`${dir}/inputs.json`));
await writeFile(`${dir}/start-manifest.json`,JSON.stringify({id,startedAt,inputHash,sourceFiles,gate:inputs.promotionGate},null,2));
const embedding=new CachedEmbedder(new EmbeddingGemmaModel(),1024);
const library=[...contractedLibrary(),...sourceBackedLibrary(),...inputs.groups.flatMap(g=>g.assets)];
const search=new LibrarySearch(library,embedding);const init=performance.now();await search.build(AbortSignal.timeout(180000));const indexMs=performance.now()-init;
const warmAt=performance.now();for(const g of inputs.groups)for(const c of g.cases)await search.query(c.speech,AbortSignal.timeout(10000));const queryWarmMs=performance.now()-warmAt;
const rows:any[]=[],rawOrders:any[]=[],hostInterpretation=inputs.groups.flatMap(g=>g.cases.map(c=>({id:c.id,mode:interpretEvidence(c.speech,g.assets).mode}))),resources:any[]=[];
const percentile=(a:number[],p:number)=>[...a].sort((x,y)=>x-y)[Math.max(0,Math.ceil(a.length*p)-1)];
for(const arm of ['hybrid','gliner','minilm']){
 const model=arm==='hybrid'?null:new LocalClassifierPreference(arm,arm==='gliner'?'runtime/preference_worker.py':'runtime/reranker_preference_worker.py');
 const selector:AssetSelector=model?new ClassifierPreferenceSelector(model,inputs.budgetMs):new LocalHybridSelector();
 try{
  if(model)await selector.prepare?.(AbortSignal.timeout(60000));
  for(let pass=0;pass<inputs.passes;pass++)for(const group of inputs.groups)for(const test of group.cases){
   const began=performance.now(),signal=AbortSignal.timeout(5000);
   const vector=await search.query(test.speech,signal);const ranked=search.rank(test.speech,vector,a=>supportsEvidence(a,group.intent,false));
   const context:SelectionContext={speech:test.speech,assets:ranked,intent:group.intent,current:null,requireIndependentReview:false};
   const before=model?{...(selector as ClassifierPreferenceSelector).stats}:null,decisionAt=performance.now();
   const result=await selector.select(context,signal);
   if(result.selected&&!ranked.some(a=>a.id===result.selected&&supportsEvidence(a,group.intent,false)))throw Error('Final evidence check rejected result');
   const row={arm,pass,id:test.id,expected:test.expected,selected:result.selected,correct:result.selected===test.expected,elapsedMs:performance.now()-began,selectionMs:performance.now()-decisionAt,ranked:ranked.map(a=>a.id),fallback:model?(selector as ClassifierPreferenceSelector).stats.fallbacks>before!.fallbacks:false};
   rows.push(row);appendFileSync(`${dir}/steps.jsonl`,JSON.stringify(row)+'\n');
   if(model){const offset=pass%ranked.length,menu=[...ranked.slice(offset),...ranked.slice(0,offset)];const start=performance.now();try{const selected=await model.choose(test.speech,menu,AbortSignal.timeout(5000));rawOrders.push({arm,pass,id:test.id,expected:test.expected,selected,correct:selected===test.expected,elapsedMs:performance.now()-start,order:menu.map(a=>a.id)});}catch(error){rawOrders.push({arm,pass,id:test.id,correct:false,error:String(error),elapsedMs:performance.now()-start});}}
  }
  // Missing, withdrawal and non-present outcomes must never invoke preference.
  const g=inputs.groups[0],base:SelectionContext={speech:g.cases[0].speech,assets:g.assets,intent:g.intent,current:null,requireIndependentReview:false};
  const calls=model?.stats.calls??0;
  const guardResults=[];
  for(const context of [{...base,intent:{...g.intent,claims:[...g.intent.claims,'unsupported-fact']}},{...base,assets:[]},{...base,intent:{...g.intent,mode:'hold' as const}}]){const outcome=await selector.select(context,AbortSignal.timeout(5000));guardResults.push(outcome);if(outcome.selected!==null)throw Error('Guard wrongly selected');}
  if((model?.stats.calls??0)!==calls)throw Error('Host guard invoked preference');
  resources.push({arm,stats:model?.stats,resources:model?.resources,guardResults});
  console.log(JSON.stringify({arm,correct:rows.filter(r=>r.arm===arm&&r.correct).length,total:rows.filter(r=>r.arm===arm).length}));
 }finally{selector.close?.();}
}
const summary=['hybrid','gliner','minilm'].map(arm=>{const r=rows.filter(r=>r.arm===arm),raw=rawOrders.filter(r=>r.arm===arm);return {arm,total:r.length,correct:r.filter(r=>r.correct).length,accuracy:r.filter(r=>r.correct).length/r.length,fallbacks:r.filter(r=>r.fallback).length,medianMs:percentile(r.map(r=>r.elapsedMs),.5),p95Ms:percentile(r.map(r=>r.elapsedMs),.95),selectionP95Ms:percentile(r.map(r=>r.selectionMs),.95),firstTurnMs:r[0].elapsedMs,byPreference:Object.fromEntries(['trend','comparison','process','overview','illustration'].map(key=>{const subset=r.filter(r=>r.expected.endsWith('-'+key));return [key,{correct:subset.filter(r=>r.correct).length,total:subset.length}];})),rawOrderAccuracy:raw.length?raw.filter(r=>r.correct).length/raw.length:null,orderStableCases:raw.length?inputs.groups.flatMap(g=>g.cases).filter(c=>new Set(raw.filter(r=>r.id===c.id).map(r=>r.selected??r.error)).size===1).length:null};});
const baseline=summary[0].accuracy;
const promotion=summary.slice(1).map(s=>({arm:s.arm,pass:s.accuracy>=inputs.promotionGate.minAccuracy&&s.accuracy-baseline>=inputs.promotionGate.minGainOverHybrid&&s.p95Ms<=inputs.promotionGate.maxWarmP95Ms&&s.fallbacks/s.total<=inputs.promotionGate.maxFallbackRate}));
const report={id,startedAt,finishedAt:new Date().toISOString(),inputHash,sourceFiles,scope:inputs.scope,librarySize:library.length,indexMs,queryWarmMs,summary,promotion,hostInterpretation,resources,rows,rawOrders,limitations:['Oracle intent isolates asset preference; strict real parser coverage is reported separately.','No STT or browser paint included.','32 authored cases repeated three times are not 96 independent examples.','All 32 query vectors are warmed before any arm and reported separately; percentiles measure the same warm query-cache condition. Arms run sequentially, so timing remains descriptive, not an isolated causal speed claim.','Rotated-order diagnostic calls are separate from actual ranked runtime decisions.']};
await writeFile(`${dir}/replay.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({summary,promotion,indexMs},null,2));
