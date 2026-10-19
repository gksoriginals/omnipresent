import {z} from "zod";
import {appendFileSync} from "node:fs";
import {mkdir,readFile,writeFile,readdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import {runReplay,type ReplayCase} from "../server/experiments/replay.js";
import {JsonlTraceSink} from "../server/experiments/file-trace.js";
import {LibraryPolicy} from "../server/controllers/library-policy.js";
import {hybridRetrieval} from "../server/controllers/retrieval.js";
import {evidenceGate,interpretEvidence,supportsEvidence,sourceDigest} from "../server/controllers/evidence-contract.js";
import {contractedLibrary} from "./evidence-fixtures.js";
import {sourceBackedLibrary,sourceBackedCases} from "./source-backed-evidence-fixture.js";
import {cueBundles,policyCases} from "./cue-policy-fixture.js";
const id=process.argv[2];if(!id||!/^[-\w]+$/.test(id))throw Error("Unique run ID required");
const directory=`docs/validation/runs/${id}`;await mkdir(directory,{recursive:false});const startedAt=new Date().toISOString();
const assets=[...contractedLibrary(),...sourceBackedLibrary()];
const bundles=cueBundles(assets.filter(a=>a.id.includes("/")));
const cases:ReplayCase[]=[...policyCases,...sourceBackedCases].map((c,index)=>({id:c.id,speech:c.speech,expected:{action:z.enum(["show","hold","context"]).parse(c.action),selected:c.expected},refresh:index%8===0}));
const hash=(bytes:string|Buffer)=>createHash("sha256").update(bytes).digest("hex");
const inputs={assets,bundles,cases,passes:3,arms:["default","injected-hybrid"],mode:"deterministic-plumbing-parity"};
const input=JSON.stringify(inputs,null,2);await writeFile(`${directory}/inputs.json`,input);
const sourceFiles:{path:string;sha256:string}[]=[];
async function snapshot(path:string){const bytes=await readFile(path);const target=`${directory}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,bytes);sourceFiles.push({path,sha256:hash(bytes)});}
async function walk(path:string){for(const file of await readdir(path,{withFileTypes:true})){const p=`${path}/${file.name}`;if(file.isDirectory())await walk(p);else if(/\.(ts|json)$/.test(p))await snapshot(p);}}
for(const folder of ["server/controllers","server/experiments","shared"])await walk(folder);
for(const path of ["scripts/replay-baseline.ts","scripts/evidence-fixtures.ts","scripts/source-backed-evidence-fixture.ts","scripts/cue-policy-fixture.ts","scripts/large-library-fixture.ts","tests/fixtures/evidence-source-snapshots.json","package.json","package-lock.json"])await snapshot(path);
await writeFile(`${directory}/start-manifest.json`,JSON.stringify({id,startedAt,inputHash:hash(input),sourceFiles,profile:inputs.mode,environment:{node:process.version}},null,2));
const sinks=new Map<string,JsonlTraceSink>();
const report=await runReplay({cases,passes:3,arms:inputs.arms,sink(context){const key=JSON.stringify(context);let sink=sinks.get(key);if(!sink){sink=new JsonlTraceSink(`${directory}/trace.jsonl`,{runId:id,...context});sinks.set(key,sink);}return sink;},row(row){appendFileSyncRow(row);},create(_pass,arm,sink){
 // Deliberately synthetic embeddings and deterministic grounder: tests wiring, not models.
 const embedder={space:{model:"deterministic-parity",revision:"1",dimensions:2},async encode(texts:string[]){return texts.map(()=>[1,0]);}};
 const policy=new LibraryPolicy(embedder,async(speech,candidates)=>{const intent=interpretEvidence(speech,assets);const selected=candidates.find(a=>supportsEvidence(a,intent));return selected?{action:"show",selected:selected.id}:{action:"context",selected:null};},evidenceGate({requireIndependentReview:false}),arm==="default"?undefined:hybridRetrieval,sink);
 return {id:arm,initialize:signal=>policy.refresh(assets,bundles,signal),async refresh(c,pass,signal){const changed=structuredClone(assets);changed[0].text+=` Revision ${pass}/${c.id}`;changed[0].evidence.sources[0].summary=changed[0].text;changed[0].evidence.sources[0].sha256=sourceDigest(changed[0].text);await policy.refresh(changed,bundles,signal);},decide:(c,signal)=>policy.decide(c.speech,signal)};
}});
function appendFileSyncRow(row:unknown){appendFileSync(`${directory}/steps.jsonl`,JSON.stringify(row)+"\n");}

const parity=report.rows.filter(r=>r.arm==="default").every(row=>{const other=report.rows.find(r=>r.pass===row.pass&&r.caseId===row.caseId&&r.arm==="injected-hybrid");return other?.valid&&row.valid&&row.result?.action===other.result?.action&&row.result?.selected===other.result?.selected;});
await writeFile(`${directory}/replay.json`,JSON.stringify({id,startedAt,finishedAt:new Date().toISOString(),sourceFiles,inputHash:hash(input),profile:inputs.mode,...report,parity,limitations:["Synthetic embeddings and a deterministic evidence-derived grounder test plumbing parity only; these quality labels are not independent model validation.","Offline text path includes scheduled refreshes, retrieval and final guards; excludes STT, real model inference, media and browser paint.","Timing is diagnostic, not a latency improvement claim. Raw provider logging is absent because no provider is called."],productionAcceptance:false},null,2));
console.log(JSON.stringify({id,parity,summary:report.summary},null,2));if(!parity||report.rows.some(row=>!row.valid))process.exitCode=1;
