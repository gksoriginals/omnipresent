import {mkdir,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {plannerContext} from "../tests/fixtures/planner-context.js";
import {compositionPlanner,validatePlannedComposition} from "../server/presentation/composition.js";
import {supportsEvidence} from "../server/controllers/evidence-contract.js";
import {runReplay,type ReplayCase} from "../server/experiments/replay.js";
import {traceStage} from "../server/experiments/trace.js";
import {JsonlTraceSink} from "../server/experiments/file-trace.js";
import {storyRequestFrame} from "../server/presentation/request-frame.js";
const id=process.argv[2];if(!id||!/^[-\w]+$/.test(id))throw Error("Unique run ID required");const directory=`docs/validation/runs/${id}`;await mkdir(directory,{recursive:false});const startedAt=new Date().toISOString();
const ids=["compatible-pair","explicit-form","undeclared-companion","incompatible-scope","withdrawn-companion","changed-content","unsupported-claim","withdrawn-primary"];
const cases:ReplayCase[]=ids.map((id,index)=>({id,speech:id==="explicit-form"?"Show illustrative Solar story solar generation diagram":id==="unsupported-claim"?"Show warranty":"Solar generation",expected:{action:["changed-content","unsupported-claim","withdrawn-primary"].includes(id)?"context":"show",selected:["changed-content","unsupported-claim","withdrawn-primary"].includes(id)?null:"diagram:0"},refresh:index%3===0}));
const inputs={cases,context:plannerContext(),passes:3,arms:["focus","paired"],scope:"Authored component coverage and composition invariants; no models or independent review"};
const hash=(data:string|Buffer)=>createHash("sha256").update(data).digest("hex");const input=JSON.stringify(inputs,(_key,v)=>v instanceof Map||v instanceof Set?[...v]:v,2);await writeFile(`${directory}/inputs.json`,input);
const sourceFiles=[];for(const path of ["scripts/component-coverage-replay.ts","tests/fixtures/planner-context.ts","server/presentation/component-evidence.ts","shared/component-evidence.ts","server/presentation/composition.ts","server/presentation/catalog.ts","server/presentation/prepare-evidence.ts","server/presentation/request-frame.ts","server/controllers/evidence-contract.ts","server/controllers/hybrid-components.ts","server/controllers/semantic-retrieval.ts","server/controllers/library-search.ts","server/controllers/library-policy.ts","server/controllers/retrieval.ts","server/experiments/replay.ts","server/experiments/trace.ts","server/experiments/file-trace.ts","shared/preparation.ts","shared/evidence.ts","shared/adaptive.ts","shared/visuals.ts","package.json","package-lock.json"]){const data=await readFile(path),target=`${directory}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,data);sourceFiles.push({path,sha256:hash(data)});}
await writeFile(`${directory}/start-manifest.json`,JSON.stringify({id,startedAt,sourceFiles,inputHash:hash(input),node:process.version},null,2));const plans:unknown[]=[];
const report=await runReplay({cases,passes:3,arms:inputs.arms,sink:c=>new JsonlTraceSink(`${directory}/trace.jsonl`,{runId:id,...c}),create(pass,arm,sink){
 const planner=compositionPlanner(arm);return {id:arm,async initialize(){},async refresh(){plannerContext();},async decide(test,signal){
  const context=plannerContext();context.frame=storyRequestFrame(test.speech,context.catalog.assets,"replay");
  if(test.id==="undeclared-companion")context.catalog.covered.delete("statement:0");
  if(test.id==="incompatible-scope"){const c=context.state.flow!.beats[0].componentEvidence!.statement!;c.evidence.entity="Other entity";context.catalog.assets.find(a=>a.id==="statement:0")!.evidence=structuredClone(c.evidence);}
  if(test.id==="withdrawn-companion")context.state.flow!.beats[0].componentEvidence!.statement!.evidence.approved=false;
  if(test.id==="withdrawn-primary")context.state.flow!.beats[0].componentEvidence!.visual!.evidence.approved=false;
  if(test.id==="changed-content")context.state.visuals![0].spec.title="Changed diagram";
  const selected=context.catalog.assets.find(a=>a.id===context.selected)!;
  if(!supportsEvidence(selected,context.frame.intent))return {action:"context",selected:null};
  try{
   const proposed=await traceStage(sink,"composition-plan",()=>planner.plan(structuredClone(context),signal));
   const plan=await traceStage(sink,"composition-validation",async()=>validatePlannedComposition(proposed,context));
   const paired=arm==="paired"&&test.id==="compatible-pair";assert.equal(plan.blocks.length,paired?2:1);
   plans.push({pass,arm,caseId:test.id,plan});return {action:"show",selected:context.selected};
  }catch(error){
   // Only evidence rejection is an expected hold. Assertion/program errors must remain failures.
   if(test.id!=="withdrawn-primary"&&test.id!=="changed-content")throw error;
   return {action:"context",selected:null};
  }
 }};
}});
await writeFile(`${directory}/steps.jsonl`,report.rows.map(r=>JSON.stringify(r)).join("\n")+"\n");await writeFile(`${directory}/replay.json`,JSON.stringify({id,startedAt,finishedAt:new Date().toISOString(),sourceFiles,inputHash:hash(input),...report,plans,productionAcceptance:false,limitations:[inputs.scope,"Selection is fixed to an authored component; this is not a retrieval, LLM, speech or end-to-end product quality benchmark.","Refresh events rebuild synthetic context rather than real embedding indexes.","Coverage declarations and presenter approval are not proof of entailment or independent review."]},null,2));console.log(JSON.stringify({id,summary:report.summary},null,2));if(report.rows.some(r=>!r.correct))process.exitCode=1;
