import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import { fixtures,replay,strategies,fixtureState,initial } from "./controller-fixtures.js";
import { buildPreparedIndex,shortlist } from "../server/controllers/candidates.js";
import { policyConfig,PresentationPolicy } from "../server/controllers/presentation-policy.js";
const runId=process.argv[2];
if(!runId||!/^[A-Za-z0-9_-]+$/.test(runId))throw Error("Supply a unique run ID: npm run benchmark:controllers -- <id>");
const directory=`docs/validation/runs/${runId}`;
await mkdir(directory,{recursive:false});
const startedAt=new Date().toISOString();
const sources=["server/controllers/presentation-policy.ts","server/controllers/candidates.ts","scripts/controller-fixtures.ts","scripts/controller-benchmark.ts","tests/fixtures/controller-replays.json","tests/controllers.test.ts","tests/controller-invariants.test.ts","package-lock.json"];
const sourceFiles=await Promise.all(sources.map(async path=>({path,sha256:createHash("sha256").update(await readFile(path)).digest("hex")})));
const percentile=(values:number[],p:number)=>[...values].sort((a,b)=>a-b)[Math.max(0,Math.ceil(values.length*p)-1)];
// Thresholds are software-regression gates, not empirical product UX acceptance thresholds.
const gates={temporalPolicyMismatch:0,invalidCommits:0,deterministicDisagreements:0};
const rows=strategies.map(strategy=>{
 const scenarios=fixtures.scenarios.map(scenario=>({id:scenario.id,steps:replay(strategy,scenario)}));
 const all=scenarios.flatMap(s=>s.steps);
 // Warm all paths; measure complete scenario batches to reduce timer overhead bias.
 for(let i=0;i<10;i++)for(const scenario of fixtures.scenarios)replay(strategy,scenario);
 const samples:number[]=[];
 for(let i=0;i<100;i++){
  const begin=performance.now();for(const scenario of fixtures.scenarios)replay(strategy,scenario);
  samples.push(performance.now()-begin);
 }
 let invalidCommits=0,deterministicDisagreements=0;
 for(const scenario of fixtures.scenarios){
  const twice=replay(strategy,scenario).map(({elapsedMs,...step})=>step);
  const original=scenarios.find(s=>s.id===scenario.id)!.steps.map(({elapsedMs,...step})=>step);
  if(JSON.stringify(twice)!==JSON.stringify(original))deterministicDisagreements++;
  invalidCommits+=original.filter(r=>r.actual.startsWith("commit:")&&r.actual.slice(7).split(",").some(v=>!Number.isInteger(Number(v))||Number(v)<0||Number(v)>2)).length;
 }
 const mismatch=all.filter(r=>!r.correct);
 return {strategy,scenarios,summary:{scenarios:scenarios.length,decisions:all.length,correct:all.length-mismatch.length,mismatches:mismatch.length,falseChanges:mismatch.filter(r=>r.actual.startsWith("commit:")&&!r.expected.startsWith("commit:")).length,missedChanges:mismatch.filter(r=>!r.actual.startsWith("commit:")&&r.expected.startsWith("commit:")).length,invalidCommits,deterministicDisagreements,latency:{scope:"100 repeated warmed complete replay-suite batches, includes controller construction/cloning/validation and fixture conversion; no retrieval/model/STT/network. Not independent examples or user-visible latency.",batchMedianMs:percentile(samples,0.5),batchP95Ms:percentile(samples,0.95),amortizedDecisionMedianMs:percentile(samples,0.5)/all.length,samplesMs:samples}}};
});
const retrieval=fixtures.retrieval.map(c=>{
 const state=fixtureState(c.domain);const index=buildPreparedIndex(state);const start=performance.now();const candidates=shortlist(index,state,c.speech);const elapsedMs=performance.now()-start;
 const actual=[...new Set(candidates.flatMap(c=>c.composition.blocks.map(b=>b.beat)))].sort();const expected=[...c.expectedBeats].sort();
 const hits=expected.filter(beat=>actual.includes(beat)).length;
 const policy=new PresentationPolicy("hybrid",state,initial());
 const result=policy.handle({type:"observe",at:0,sequence:0,epoch:0,revision:state.revision,candidates});
 return {...c,actualBeats:actual,hits,expectedCount:expected.length,retrievedCount:actual.length,exact:JSON.stringify(actual)===JSON.stringify(expected),candidates,firstPolicyAction:result.action,firstPolicyReason:result.reason,elapsedMs};
});
const hits=retrieval.reduce((n,r)=>n+r.hits,0),needed=retrieval.reduce((n,r)=>n+r.expectedCount,0),retrieved=retrieval.reduce((n,r)=>n+r.retrievedCount,0);
const report={id:runId,startedAt,finishedAt:new Date().toISOString(),scope:fixtures.scope,design:{gates,policyConfig,fixtureVersion:fixtures.version,holdout:false,modelCalls:0,externalCostUSD:0,ordering:"rules, FSM, behaviour tree, hybrid; sequential on same process/machine; timings exploratory only",limitations:["Policies share candidate validation and score thresholds; the rules baseline lacks temporal confirmation by design. This is a feature comparison, not evidence that rules cannot express memory.","FSM, stateful BT and hybrid intentionally express the same temporal contract. Equal correctness is expected, not evidence of independent implementation correctness.","Injected candidate scores are not calibrated retrieval or model confidence. Lexical retrieval evaluated separately.","No STT, browser, audio, model selection or production integration; no new independent holdout."]},environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,memoryBytes:os.totalmem()},sourceFiles,controllers:rows,retrieval:{cases:retrieval,summary:{cases:retrieval.length,exactSets:retrieval.filter(r=>r.exact).length,microRecall:needed?hits/needed:null,microPrecision:retrieved?hits/retrieved:null,hits,expectedTopics:needed,retrievedTopics:retrieved}},passed:rows.filter(r=>r.strategy!=="rules").every(r=>r.summary.mismatches===0&&r.summary.invalidCommits===0&&r.summary.deterministicDisagreements===0)};
await writeFile(`${directory}/controller-benchmark.json`,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({path:`${directory}/controller-benchmark.json`,passed:report.passed,controllers:rows.map(r=>({strategy:r.strategy,...r.summary,latency:{batchMedianMs:r.summary.latency.batchMedianMs,batchP95Ms:r.summary.latency.batchP95Ms}})),retrieval:report.retrieval.summary},null,2));
if(!report.passed)process.exitCode=1;
