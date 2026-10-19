import {mkdir,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {synthesisContext} from "../tests/fixtures/synthesis-context.js";
import {compositionPlanner,validatePlannedComposition} from "../server/presentation/composition.js";
import {supportsEvidence} from "../server/controllers/evidence-contract.js";
import {runReplay,type ReplayCase} from "../server/experiments/replay.js";
import {traceStage} from "../server/experiments/trace.js";
import {JsonlTraceSink} from "../server/experiments/file-trace.js";
import {storyRequestFrame} from "../server/presentation/request-frame.js";
import {prepareEvidence} from "../server/presentation/prepare-evidence.js";
import {approvePreparedEvidence} from "../server/presentation/component-evidence.js";
import {presentationCatalog} from "../server/presentation/catalog.js";
const id=process.argv[2];if(!id||!/^[-\w]+$/.test(id))throw Error("Unique run ID required");const directory=`docs/validation/runs/${id}`;await mkdir(directory,{recursive:false});const startedAt=new Date().toISOString();
const counts:Record<string,number>={four:4,three:3,two:2,focus:1,"explicit-form":1,"duplicate-visual":3,"wrong-entity":3,"wrong-time":3,"wrong-unit":3,"source-withdrawn":0,"unknown-claim":0,"rejected-primary":0,"overlong-text":3,"stable-slots":4,"primary-switch":4};
const cases:ReplayCase[]=Object.keys(counts).map((id,index)=>({id,speech:id==="explicit-form"?"Show actual Solar energy example Morning output chart":id==="unknown-claim"?"Show warranty":id==="primary-switch"?"Daily curve":"Morning output",expected:{action:counts[id]?"show":"context",selected:counts[id]?(id==="primary-switch"?"chart:1":"chart:0"):null},refresh:index%4===0}));
const inputs={cases,counts,context:synthesisContext(),passes:3,arms:["focus","synthesis"],scope:"Authored full-request composition invariants; not independent model or natural-speech quality"};
const hash=(data:string|Buffer)=>createHash("sha256").update(data).digest("hex"),input=JSON.stringify(inputs,(_key,v)=>v instanceof Map||v instanceof Set?[...v]:v,2);await writeFile(`${directory}/inputs.json`,input);
const sources=["scripts/synthesis-replay.ts","tests/fixtures/synthesis-context.ts","server/presentation/synthesis.ts","server/presentation/composition.ts","server/presentation/component-evidence.ts","server/presentation/prepare-evidence.ts","server/presentation/catalog.ts","server/presentation/request-frame.ts","server/controllers/evidence-contract.ts","server/controllers/hybrid-components.ts","server/controllers/semantic-retrieval.ts","server/controllers/library-search.ts","server/controllers/library-policy.ts","server/controllers/retrieval.ts","server/experiments/replay.ts","server/experiments/trace.ts","server/experiments/file-trace.ts","shared/component-evidence.ts","shared/preparation.ts","shared/evidence.ts","shared/adaptive.ts","shared/visuals.ts","package.json","package-lock.json"];
const sourceFiles=[];for(const path of sources){const data=await readFile(path),target=`${directory}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,data);sourceFiles.push({path,sha256:hash(data)});}
await writeFile(`${directory}/start-manifest.json`,JSON.stringify({id,startedAt,sourceFiles,inputHash:hash(input),node:process.version},null,2));const plans:unknown[]=[];
const report=await runReplay({cases,passes:3,arms:inputs.arms,sink:c=>new JsonlTraceSink(`${directory}/trace.jsonl`,{runId:id,...c}),create(pass,arm,sink){
 const planner=compositionPlanner(arm);return {id:arm,async initialize(){},async refresh(){synthesisContext();},async decide(test,signal){
  const context=synthesisContext();context.frame=storyRequestFrame(test.speech,context.catalog.assets,"replay");
  if(test.id==="primary-switch")context.selected="chart:1";
  if(test.id==="three")context.catalog.covered.delete("chart:1");
  if(test.id==="two")context.catalog.covered=new Set(["chart:0","statement:0"]);
  if(test.id==="focus")context.catalog.covered=new Set(["chart:0"]);
  if(["wrong-entity","wrong-time","wrong-unit"].includes(test.id)){
   const e=context.state.flow!.beats[1].componentEvidence!.visual!.evidence;
   if(test.id==="wrong-entity")e.entity="Other entity";if(test.id==="wrong-time")e.timeframe="2025";if(test.id==="wrong-unit")e.unit="USD";
   context.catalog.assets.find(a=>a.id==="chart:1")!.evidence=structuredClone(e);
  }
  if(test.id==="duplicate-visual"){context.state.visuals![1].spec=structuredClone(context.state.visuals![0].spec);context.state.flow=prepareEvidence(context.state.flow!,context.state);approvePreparedEvidence(context.state.flow,context.state);context.catalog=presentationCatalog(context.state);}
  if(test.id==="overlong-text"){context.state.flow!.beats[0].audienceText="Long explanation ".repeat(40);context.state.flow=prepareEvidence(context.state.flow!,context.state);approvePreparedEvidence(context.state.flow,context.state);context.catalog=presentationCatalog(context.state);}
  if(test.id==="source-withdrawn")context.state.artifacts=context.state.artifacts.filter(a=>a.id!==context.state.visuals![0].spec.kind.replace("chart","00000000-0000-4000-8000-000000000010"));
  if(test.id==="rejected-primary")context.state.flow!.beats[0].componentEvidence!.visual!.evidence.approved=false;
  if(test.id==="stable-slots")context.current=await compositionPlanner("synthesis").plan(context,signal);
  const selected=context.catalog.assets.find(a=>a.id===context.selected)!;if(!supportsEvidence(selected,context.frame.intent))return {action:"context",selected:null};
  try{
   const proposed=await traceStage(sink,"composition-plan",()=>planner.plan(structuredClone(context),signal));
   const plan=await traceStage(sink,"composition-validation",async()=>validatePlannedComposition(proposed,context));
   assert.equal(plan.blocks.length,arm==="synthesis"?counts[test.id]:1);if(test.id==="stable-slots"&&arm==="synthesis")assert.deepEqual(plan,context.current);
   plans.push({pass,arm,caseId:test.id,plan});return {action:"show",selected:context.selected};
  }catch(error){if(!(error instanceof Error)||!/^Review component evidence|^Component source withdrawn/.test(error.message))throw error;return {action:"context",selected:null};}
 }};
}});
await writeFile(`${directory}/steps.jsonl`,report.rows.map(r=>JSON.stringify(r)).join("\n")+"\n");await writeFile(`${directory}/replay.json`,JSON.stringify({id,startedAt,finishedAt:new Date().toISOString(),sourceFiles,inputHash:hash(input),...report,plans,productionAcceptance:false,limitations:[inputs.scope,"Primary selections are authored; all displayed blocks must independently cover the complete request. No complementary-claim union reasoning.","Synthetic sources and imagery; no new provider calls. Refresh reconstructs context rather than embedding indexes.","Timing is diagnostic, not a latency winner claim."]},null,2));console.log(JSON.stringify({id,summary:report.summary},null,2));if(report.rows.some(r=>!r.correct))process.exitCode=1;
