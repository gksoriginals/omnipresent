import {readFile,writeFile,mkdir,appendFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import os from "node:os";
import {decisionModels,type DecisionProvider} from "../server/agents/system-one.js";
import {emptyPreparation,type Preparation} from "../shared/preparation.js";
import {SemanticIndex,httpEmbedder,lexicalRank,preparedDocuments,fusedRank,type RankedTopic} from "../server/controllers/semantic-retrieval.js";
import {buildDecisionMenu,chooseShortlisted} from "../server/controllers/shortlisted-decision.js";
type Query={id:string;project:string;split:"dev"|"evaluation";speech:string;expectedBeats:number[];expectedAction:string};
type Fixture={version:number;scope:string;projects:Record<string,{revision:number;beats:{title:string;audienceText:string}[]}>;cases:Query[]};
const runId=process.argv[2];if(!runId||!/^[A-Za-z0-9_-]+$/.test(runId))throw Error("Supply a unique run ID");
const directory=`docs/validation/runs/${runId}`;await mkdir(directory,{recursive:false});
const startedAt=new Date().toISOString();const fixture:Fixture=JSON.parse(await readFile("tests/fixtures/semantic-retrieval.json","utf8"));
const sourcePaths=["scripts/retrieval-benchmark.ts","server/controllers/semantic-retrieval.ts","server/controllers/shortlisted-decision.ts","runtime/retrieval_server.py","runtime/retrieval-model.json","runtime/retrieval-requirements.lock","tests/fixtures/semantic-retrieval.json","tests/semantic-retrieval.test.ts","server/agents/system-one.ts"];
const sourceFiles=await Promise.all(sourcePaths.map(async path=>({path,sha256:createHash("sha256").update(await readFile(path)).digest("hex")})));
for(const source of sourceFiles){const target=`${directory}/source-snapshot/${source.path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,await readFile(source.path));}
await writeFile(`${directory}/start-manifest.json`,JSON.stringify({startedAt,sourceFiles},null,2)+"\n");
const settings=JSON.parse(await readFile("runtime/retrieval-model.json","utf8"));
const healthResponse=await fetch("http://127.0.0.1:4332/health",{signal:AbortSignal.timeout(5000)});if(!healthResponse.ok)throw Error("Embedding runner unavailable");
const health=await healthResponse.json();
const states:Record<string,Preparation>={};const indexes:Record<string,SemanticIndex>={};const indexing:any[]=[];
const embedder=httpEmbedder({model:settings.model,revision:settings.revision,dimensions:settings.dimensions});
for(const [project,spec] of Object.entries(fixture.projects)){
 const state=emptyPreparation();state.revision=spec.revision;state.flow={title:project,summary:"Synthetic prepared corpus",openQuestions:[],beats:spec.beats.map(b=>({...b,speakerNotes:"PRIVATE",visualDirection:"text",artifactIds:[]}))};
 states[project]=state;const begin=performance.now();const index=new SemanticIndex(project,state,embedder);await index.build(AbortSignal.timeout(60000));
 indexes[project]=index;indexing.push({project,documents:spec.beats.length,elapsedMs:performance.now()-begin});
}
const rankings:any[]=[];
for(const query of fixture.cases){
 const state=states[query.project];const index=indexes[query.project];const begin=performance.now();
 const semantic=await index.rank(query.project,state,query.speech,AbortSignal.timeout(30000));const queryMs=performance.now()-begin;
 const lexicalStart=performance.now(),lexical=lexicalRank(preparedDocuments(state),query.speech),lexicalMs=performance.now()-lexicalStart;
 const fusionStart=performance.now(),hybrid=fusedRank(semantic.hits,lexical),fusionMs=performance.now()-fusionStart;
 const cacheBegin=performance.now();const cached=await index.rank(query.project,state,query.speech,AbortSignal.timeout(1000));
 rankings.push({...query,semantic:semantic.hits,lexical,hybrid,queryMs,lexicalMs,fusionMs,exactCacheMs:performance.now()-cacheBegin,cacheHit:cached.cacheHit});
 console.log("retrieval",query.id,Math.round(queryMs),"ms");
}
// Tune only a binary topic-presence threshold on development cases. Equal ties prefer lower cutoff (recall).
const thresholds=Array.from({length:41},(_,i)=>i/40);
const calibration=thresholds.map(threshold=>{
 const dev=rankings.filter(q=>q.split==="dev");const positives=dev.filter(q=>q.expectedAction==="show"),negatives=dev.filter(q=>q.expectedAction!=="show");
 const tpr=positives.filter(q=>q.semantic[0].score>=threshold).length/positives.length;
 const tnr=negatives.filter(q=>q.semantic[0].score<threshold).length/negatives.length;
 return {threshold,balancedAccuracy:(tpr+tnr)/2,tpr,tnr};
}).sort((a,b)=>b.balancedAccuracy-a.balancedAccuracy||a.threshold-b.threshold);
const threshold=calibration[0].threshold;
const methods=(process.env.SHORTLIST_METHODS??"oracle,lexical,semantic,hybrid").split(",");
if(methods.some(m=>!["oracle","lexical","semantic","hybrid","semantic-raw"].includes(m)))throw Error("Unknown selection method");
const retrieved=(row:any,method:string):RankedTopic[]=>method==="semantic-raw"?row.semantic.slice(0,2):method==="lexical"?row.lexical.slice(0,2):row.semantic[0].score<threshold?[]:row[method].slice(0,2);
const metrics=(rows:any[],method:string,gated:boolean)=>{
 let found=0,required=0,retrievedCount=0,exact=0,positiveCovered=0,positives=0,emptyCorrect=0,negatives=0;const reciprocal:number[]=[];
 for(const row of rows){
  const hits:RankedTopic[]=gated?retrieved(row,method):row[method].slice(0,2);const actual=hits.map(h=>h.beat);const expected:number[]=row.expectedBeats;
  const matches=expected.filter(b=>actual.includes(b)).length;found+=matches;required+=expected.length;retrievedCount+=actual.length;
  if(JSON.stringify([...actual].sort())===JSON.stringify([...expected].sort()))exact++;
  if(expected.length){positives++;if(matches===expected.length)positiveCovered++;const first=row[method].findIndex((h:RankedTopic)=>expected.includes(h.beat));reciprocal.push(first<0?0:1/(first+1));}
  else{negatives++;if(!actual.length)emptyCorrect++;}
 }
 return {cases:rows.length,exactSets:exact,found,required,retrievedCount,microRecall:required?found/required:null,microPrecision:retrievedCount?found/retrievedCount:null,fullyCoveredPositiveQueries:positiveCovered,positiveQueries:positives,correctEmptyQueries:emptyCorrect,negativeQueries:negatives,mrr:reciprocal.reduce((n,x)=>n+x,0)/(reciprocal.length||1)};
};
const evaluation=rankings.filter(q=>q.split==="evaluation");
const retrievalSummary=Object.fromEntries(["lexical","semantic","hybrid"].map(method=>[method,{rawTop2:metrics(evaluation,method,false),gatedTop2:metrics(evaluation,method,true)}]));
const percentile=(values:number[],p:number)=>[...values].sort((a,b)=>a-b)[Math.max(0,Math.ceil(values.length*p)-1)];
const providers=(process.env.SHORTLIST_PROVIDERS??"laya,jev").split(",").filter(Boolean);
if(providers.some(p=>!Object.hasOwn(decisionModels,p)))throw Error("Unknown decision provider");
let spentUSD=0,hostedRequests=0,costMissing=0;const selection:any[]=[];
// Persist retrieval before selection so a later provider outage cannot lose the embedding experiment.
await writeFile(`${directory}/retrieval.json`,JSON.stringify({startedAt,fixtureScope:fixture.scope,health,indexing,threshold,calibration,rankings,retrievalSummary},null,2)+"\n");
for(const provider of providers)for(const method of methods)for(const row of evaluation){
 const state=states[row.project];
 const oracleBeats=row.expectedBeats.length===2?row.expectedBeats:row.expectedBeats.length===1?[row.expectedBeats[0],state.flow!.beats.findIndex((_,i)=>!row.expectedBeats.includes(i))]:[0,1];
 const hits:RankedTopic[]=method==="oracle"?oracleBeats.map((beat:number)=>({beat,score:1})):retrieved(row,method);
 const menu=buildDecisionMenu(state,row.speech,hits);const candidateCovered=row.expectedBeats.every((beat:number)=>hits.some(h=>h.beat===beat));
 if(provider!=="laya"&&(spentUSD>=0.02||hostedRequests>=96||costMissing>0)){
  const skipped={provider,method,id:row.id,valid:false,skipped:true,error:"Hosted budget/request cap or missing cost metadata",candidateCovered};selection.push(skipped);await appendFile(`${directory}/selection.jsonl`,JSON.stringify(skipped)+"\n");continue;
 }
 const begin=performance.now();let result:any;
 try{
  if(provider!=="laya")hostedRequests++;
  const decision=await chooseShortlisted(provider as DecisionProvider,state,menu,AbortSignal.timeout(20000));
  const actualBeats=decision.composition?.blocks.map(b=>b.beat)??[];
  const correct=decision.action===row.expectedAction&&JSON.stringify([...actualBeats].sort())===JSON.stringify([...row.expectedBeats].sort());
  const cost=decision.raw.usage?.cost;
  if(provider!=="laya"){if(typeof cost==="number"&&Number.isFinite(cost)&&cost>=0)spentUSD+=cost;else costMissing++;}
  result={provider,method,id:row.id,elapsedMs:performance.now()-begin,valid:true,correct,candidateCovered,expectedAction:row.expectedAction,expectedBeats:row.expectedBeats,actualAction:decision.action,actualBeats,choice:decision.choice,selectedProbability:decision.selectedProbability,request:menu.request,raw:decision.raw};
 }catch(error){result={provider,method,id:row.id,elapsedMs:performance.now()-begin,valid:false,correct:false,candidateCovered,error:error instanceof Error?error.message:String(error),request:menu.request};}
 selection.push(result);await appendFile(`${directory}/selection.jsonl`,JSON.stringify(result)+"\n");console.log("selection",provider,method,row.id,result.valid,result.correct,Math.round(result.elapsedMs));
}
const selectionSummary=providers.flatMap(provider=>methods.map(method=>{
 const rows=selection.filter(r=>r.provider===provider&&r.method===method),attempted=rows.filter(r=>!r.skipped),valid=attempted.filter(r=>r.valid);
 return {provider,method,cases:rows.length,attempts:attempted.length,skipped:rows.length-attempted.length,valid:valid.length,correct:valid.filter(r=>r.correct).length,candidateCovered:rows.filter(r=>r.candidateCovered).length,wrongShows:valid.filter(r=>r.actualAction==="show"&&!r.correct).length,missedContext:valid.filter(r=>r.expectedAction==="request-context"&&r.actualAction!=="request-context").length,latency:{scope:"All attempted requests including errors; sequential, one attempt per case; no STT/render/dwell.",medianMs:attempted.length?percentile(attempted.map(r=>r.elapsedMs),0.5):null,p95Ms:attempted.length?percentile(attempted.map(r=>r.elapsedMs),0.95):null}};
}));
const report={id:runId,startedAt,finishedAt:new Date().toISOString(),scope:fixture.scope,design:{methods,modelCalls:selection.filter(r=>!r.skipped).length,hostedRequests,spentUSD,costMissing,calibrationCases:12,evaluationCases:24,topK:2,menuLimit:3,holdAndContextAlwaysAvailable:true,threshold,thresholdObjective:"Balanced topic-presence accuracy on 12 calibration cases only; ties choose lower threshold",fusion:"RRF k=60, semantic+BM25; same semantic presence gate",limitations:["Synthetic author-labelled split, no independent human review","Oracle menus are label-informed diagnostic upper-bound candidates, not an available production retriever","One repeat per provider/method/case; not a latency or model winner study","Confidence values not calibrated; this benchmark does not run temporal FSM or assert end-to-end timing","Methods reuse the same cases and embeddings; oracle distractor positions are not randomized"]},environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,memoryBytes:os.totalmem()},health,indexing,sourceFiles,retrievalSummary,retrievalLatency:{scope:"36 sequential uncached query calls and immediate exact-cache repeats; excludes model load and separately recorded document indexing",queryMedianMs:percentile(rankings.map(r=>r.queryMs),0.5),queryP95Ms:percentile(rankings.map(r=>r.queryMs),0.95),cacheMedianMs:percentile(rankings.map(r=>r.exactCacheMs),0.5)},selectionSummary,selection};
await writeFile(`${directory}/retrieval-selection.json`,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({path:`${directory}/retrieval-selection.json`,threshold,retrievalSummary,selectionSummary,spentUSD},null,2));
