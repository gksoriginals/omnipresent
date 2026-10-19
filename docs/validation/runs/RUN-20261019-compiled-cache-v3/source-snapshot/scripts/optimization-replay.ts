import {readFile,mkdir,writeFile,readdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import {BaselinePresenter as PriorPresenter} from "../docs/validation/runs/RUN-20261019-full-spoken-demo/source-snapshot/server/presentation/baseline.js";
import {BaselinePresenter} from "../server/presentation/baseline.js";
import {immutablePreparation} from "../server/presentation/prepared.js";
import {EmbeddingGemmaModel} from "../server/models/embeddings.js";
import {storyRequestFrame} from "../server/presentation/request-frame.js";
import {presentationCatalog} from "../server/presentation/catalog.js";
import {supportsEvidence} from "../server/controllers/evidence-contract.js";
import type {Preparation} from "../shared/preparation.js";
import {openingComposition} from "../shared/adaptive.js";
const id=process.argv[2];if(!id||!/^RUN-[\w-]+$/.test(id))throw Error("Unique RUN id required");
const directory=`docs/validation/runs/${id}`;await mkdir(directory);
const bytes=await readFile('docs/validation/runs/RUN-20261019-full-spoken-demo/manifest.json');
const state:Preparation=JSON.parse(bytes.toString()).state;
const hash=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
const sourceFiles:{path:string;sha256:string}[]=[];
async function snapshot(path:string){const bytes=await readFile(path),target=`${directory}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,bytes);sourceFiles.push({path,sha256:hash(bytes)});}
async function walk(path:string){for(const file of await readdir(path,{withFileTypes:true})){const p=`${path}/${file.name}`;if(file.isDirectory())await walk(p);else if(/\.(ts|tsx|css|json)$/.test(p))await snapshot(p);}}
for(const folder of ['server','shared','app/src'])await walk(folder);
for(const path of ['scripts/optimization-replay.ts','runtime/retrieval-model.json','package.json','package-lock.json'])await snapshot(path);
const speech=['Daily curve','Solar panels turn sunlight into electricity.','explain Solar panels turn sunlight into electricity','Storage reserves','Batteries store electricity for later use.','explain Batteries store electricity for later use','Checking the microphone','Show the payback period','Daily curve','Storage reserves','Daily curve','explain Solar panels turn sunlight into electricity'];
await writeFile(`${directory}/inputs.json`,JSON.stringify({state,speech,refreshAt:[4,9],passes:3},null,2));
const rows:any[]=[],initialization:any[]=[],counters:any[]=[],traces:any[]=[];
for(let pass=0;pass<3;pass++){
 const arms=new Map<string,any>();
 for(const arm of pass%2?['optimized','prior']:['prior','optimized']){
  let documentTexts=0,queryTexts=0,calls=0;const source=new EmbeddingGemmaModel();
  const embedding={space:source.space,async encode(texts:string[],kind:'query'|'document',signal:AbortSignal){if(kind==='query')queryTexts+=texts.length;else documentTexts+=texts.length;return source.encode(texts,kind,signal);}};
  const catalog=presentationCatalog(state);
  const model={id:'deterministic-policy-control',model:'not-a-provider',async decide(request:any){calls++;const intent=storyRequestFrame(request.state.speech,catalog.assets,'control').intent;const options=request.state.options;const choice=Object.keys(options).find(k=>supportsEvidence(options[k],intent))??'context';const keys=[...Object.keys(options),'context','hold'];return {usage:{cost:0},answers:{action:{type:'choice',choice,probabilities:Object.fromEntries(keys.map(k=>[k,Number(k===choice)]))}}};}};
  const sink={write(event:any){traces.push({pass,arm,...event});}};
  const presenter=arm==='prior'?new PriorPresenter(embedding,model,undefined,undefined,sink):new BaselinePresenter(embedding,model,undefined,undefined,sink);
  const frozen=immutablePreparation(state),start=performance.now();if(arm==='optimized')await (presenter as BaselinePresenter).prepare(frozen,AbortSignal.timeout(60000));
  initialization.push({pass,arm,elapsedMs:performance.now()-start});
  arms.set(arm,{presenter,state:frozen,current:openingComposition(),count:()=>({pass,arm,documentTexts,queryTexts,calls})});
 }
 for(let index=0;index<speech.length;index++)for(const arm of (index+pass)%2?['optimized','prior']:['prior','optimized']){
  const a=arms.get(arm),start=performance.now();
  if([4,9].includes(index)){const changed=structuredClone(a.state);changed.revision++;changed.approvedRevision=changed.revision;changed.flowBasedOnRevision=changed.revision;changed.flow.summary+=' Reviewed metadata revision.';a.state=immutablePreparation(changed);if(arm==='optimized')await a.presenter.prepare(a.state,AbortSignal.timeout(60000));}
  try{const result=await a.presenter.decide(a.state,a.current,speech[index],AbortSignal.timeout(60000));if(result.composition)a.current=result.composition;rows.push({pass,arm,index,speech:speech[index],elapsedMs:performance.now()-start,action:result.metadata.action,path:result.metadata.path,composition:result.composition,question:result.question??null,refresh:[4,9].includes(index)});}
  catch(error){rows.push({pass,arm,index,elapsedMs:performance.now()-start,error:String(error)});}
 }
 for(const arm of arms.values())counters.push(arm.count());
}
const parity=rows.filter(r=>r.arm==='prior').every(row=>{const other=rows.find(r=>r.arm==='optimized'&&r.pass===row.pass&&r.index===row.index);return !row.error&&!other?.error&&JSON.stringify([row.action,row.composition,row.question])===JSON.stringify([other.action,other.composition,other.question]);});
const summary=['prior','optimized'].map(arm=>{const data=rows.filter(r=>r.arm===arm),sorted=data.map(r=>r.elapsedMs).sort((a,b)=>a-b);return {arm,turns:data.length,errors:data.filter(r=>r.error).length,medianMs:sorted[Math.ceil(sorted.length*.5)-1],p95Ms:sorted[Math.ceil(sorted.length*.95)-1],startupMs:initialization.filter(r=>r.arm===arm).map(r=>r.elapsedMs),totalSessionMsByPass:[0,1,2].map(pass=>initialization.find(r=>r.arm===arm&&r.pass===pass).elapsedMs+data.filter(r=>r.pass===pass).reduce((n,r)=>n+r.elapsedMs,0)),counters:counters.filter(r=>r.arm===arm)};});
await writeFile(`${directory}/trace.jsonl`,traces.map(t=>JSON.stringify(t)).join('\n')+'\n');
await writeFile(`${directory}/replay.json`,JSON.stringify({id,sourceFiles,inputHash:hash(await readFile(`${directory}/inputs.json`)),priorSource:'RUN-20261019-full-spoken-demo/source-snapshot',parity,summary,rows,initialization,limitations:['Real local EmbeddingGemma; deterministic selection stub, no hosted cost or quality claim.','One reviewed synthetic demo story, 12 requests repeated 3 times; not a large-library or independent holdout acceptance.','Two metadata refreshes per session include index rebuild; source/content withdrawal, changed documents and cancellation are regression tests.','Transcript-final decision timing includes final validation and scheduled refresh; excludes STT, media and paint. Startup plus all turns also reported.'],productionAcceptance:false},null,2));
console.log(JSON.stringify({id,parity,summary},null,2));if(!parity)process.exitCode=1;
