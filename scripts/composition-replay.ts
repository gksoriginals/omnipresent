import {mkdir,readFile,writeFile,appendFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {plannerContext} from "../tests/fixtures/planner-context.js";
import {compositionPlanner,validatePlannedComposition} from "../server/presentation/composition.js";
import {runReplay,type ReplayCase} from "../server/experiments/replay.js";
import {traceStage} from "../server/experiments/trace.js";
import {JsonlTraceSink} from "../server/experiments/file-trace.js";
const id=process.argv[2];if(!id||!/^[-\w]+$/.test(id))throw Error("Unique run ID required");const folder=`docs/validation/runs/${id}`;await mkdir(folder,{recursive:false});const startedAt=new Date().toISOString();
const cases:ReplayCase[]=["retain-reveal","wrong-current","invalid-reveal","duplicate-content","missing-evidence"].map((id,index)=>({id,speech:id==="missing-evidence"?"Show unsupported warranty":"Solar generation",expected:{action:id==="missing-evidence"?"context":"show",selected:id==="missing-evidence"?null:"diagram:0"},refresh:index===2}));
const inputs={cases,context:plannerContext(),passes:3,arms:["focus","stable"],scope:"Synthetic planner behavior and host checks, not model quality or performance comparison"};
// Map values require explicit serialization to preserve reference identities in frozen inputs.
const input=JSON.stringify(inputs,(_key,value)=>value instanceof Map||value instanceof Set?[...value]:value,2);await writeFile(`${folder}/inputs.json`,input);const hash=(data:string|Buffer)=>createHash("sha256").update(data).digest("hex");
const sourceFiles=[];for(const path of ["scripts/composition-replay.ts","tests/fixtures/planner-context.ts","server/presentation/composition.ts","server/presentation/catalog.ts","server/presentation/prepare-evidence.ts","server/presentation/request-frame.ts","server/controllers/evidence-contract.ts","server/controllers/hybrid-components.ts","server/controllers/semantic-retrieval.ts","server/controllers/library-search.ts","server/controllers/library-policy.ts","server/controllers/retrieval.ts","server/experiments/replay.ts","server/experiments/trace.ts","server/experiments/file-trace.ts","shared/preparation.ts","shared/evidence.ts","shared/adaptive.ts","shared/visuals.ts","package.json","package-lock.json"]){const bytes=await readFile(path),target=`${folder}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,bytes);sourceFiles.push({path,sha256:hash(bytes)});}
await writeFile(`${folder}/start-manifest.json`,JSON.stringify({id,startedAt,sourceFiles,inputHash:hash(input),node:process.version},null,2));
const plans:unknown[]=[];const result=await runReplay({cases,passes:3,arms:inputs.arms,sink:context=>new JsonlTraceSink(`${folder}/trace.jsonl`,{runId:id,...context}),create(pass,arm,sink){
 let context=plannerContext();const planner=compositionPlanner(arm);
 return {id:arm,async initialize(){context=plannerContext();},async refresh(){context=plannerContext();},async decide(test,signal){
  if(test.id==="missing-evidence")return {action:"context",selected:null};
  const current=structuredClone(context.current);
  if(test.id==="wrong-current")current.blocks[0]={id:"primary",kind:"statement",beat:1,emphasis:"strong",reveal:null};
  if(test.id==="invalid-reveal")current.blocks[0].reveal=4;
  if(test.id==="duplicate-content")current.blocks.push({...current.blocks[0],id:"secondary"});
  const turn={...context,current};
  const proposed=await traceStage(sink,"composition-plan",()=>planner.plan(structuredClone(turn),signal));
  const plan=await traceStage(sink,"composition-validation",async()=>validatePlannedComposition(proposed,turn));
  assert.equal(plan.blocks[0].reveal,arm==="stable"&&test.id==="retain-reveal"?2:null);assert.equal(plan.blocks.length,1);
  plans.push({pass,arm,caseId:test.id,plan});return {action:"show",selected:"diagram:0"};
 }};
}});
await writeFile(`${folder}/steps.jsonl`,result.rows.map(row=>JSON.stringify(row)).join("\n")+"\n");
await writeFile(`${folder}/replay.json`,JSON.stringify({id,startedAt,finishedAt:new Date().toISOString(),sourceFiles,inputHash:hash(input),...result,plans,productionAcceptance:false,limitations:[inputs.scope,"No new multi-component synthesis: beat-level contracts do not establish independent component coverage.","Missing-evidence case is a scripted controller outcome; host evidence violations are exercised in unit tests.","Initializations and refreshes here rebuild the small planner context, not embedding indexes."]},null,2));
console.log(JSON.stringify({id,summary:result.summary},null,2));if(result.rows.some(row=>!row.correct))process.exitCode=1;
