import {spawn} from "node:child_process";
import {createInterface} from "node:readline";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import {setTimeout as wait} from "node:timers/promises";
import {AdaptiveController} from "../server/agents/adaptive.js";
import {BaselinePresenter} from "../server/presentation/baseline.js";
import {EmbeddingGemmaModel} from "../server/models/embeddings.js";
import {compositionPlanner} from "../server/presentation/composition.js";
import {Session} from "../server/session.js";
import {transcriptPolicy} from "../server/speech/transcripts.js";
const id=process.argv[2];if(!id||!/^RUN-[\w-]+$/.test(id))throw Error("Unique run ID required");
const root=`docs/validation/runs/${id}`;await mkdir(root);const startedAt=new Date().toISOString();
const source="docs/validation/runs/RUN-20261019-release-live-v1";
const state=JSON.parse(await readFile(`${source}/inputs.json`,"utf8")).workspace.stories[0].state;
const cases=[{id:"panels",path:`${source}/speech-0.wav`,expected:"show",expectedBeat:0},{id:"battery",path:`${source}/speech-1.wav`,expected:"show",expectedBeat:1},{id:"missing",path:`${source}/speech-2.wav`,expected:"context",expectedBeat:null},{id:"retain",path:"output/preference-audio/retain.pcm",expected:"hold",expectedBeat:null}];
const hash=(b:Buffer)=>createHash("sha256").update(b).digest("hex");
function pcm(bytes:Buffer,path:string){if(path.endsWith(".pcm"))return bytes;let at=12;while(at+8<=bytes.length){const name=bytes.toString("ascii",at,at+4),size=bytes.readUInt32LE(at+4);if(name==="data")return bytes.subarray(at+8,at+8+size);at+=8+size+(size%2);}throw Error("WAV has no data");}
const inputs={state,policy:transcriptPolicy,arms:["per-final","temporal"],cases:await Promise.all(cases.map(async c=>({...c,sha256:hash(await readFile(c.path))}))),scope:"Four authored Piper recordings; identical actual paced Moonshine events shared across all arms. No browser, physical microphone, independent holdout or hosted inference."};
await writeFile(`${root}/inputs.json`,JSON.stringify(inputs,null,2)+"\n");
const sourceFiles=[];
for(const path of ["scripts/speech-assembly-replay.ts","server/speech/transcripts.ts","server/agents/adaptive.ts","server/presentation/baseline.ts","server/presentation/request-frame.ts","runtime/worker.py","runtime/requirements.lock","runtime/retrieval-model.json"]){const bytes=await readFile(path),target=`${root}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf("/")),{recursive:true});await writeFile(target,bytes);sourceFiles.push({path,sha256:hash(bytes)});}
const worker=spawn(".venv/bin/python",["-u","runtime/worker.py"],{env:{...process.env,HF_HUB_OFFLINE:"1"},stdio:"pipe"});
const events:any[]=[],rows:any[]=[],routes:any[]=[];let arms:{id:string;controller:AdaptiveController;presenter:BaselinePresenter;session:Session;events:any[]}[]=[];let diagnostic="";
worker.stderr.on("data",chunk=>diagnostic=(diagnostic+chunk.toString()).slice(-1500));worker.stdin.on("error",()=>{});
createInterface({input:worker.stdout}).on("line",line=>{const e={...JSON.parse(line),at:performance.now()};events.push(e);for(const arm of arms){if(arm.id==="per-final"){if(e.type==="transcript"&&e.final&&e.text.trim())void arm.controller.accept(e.text);}else if(e.type==="transcript"||e.type==="speech_activity")arm.controller.acceptTranscript(e);}});
const send=(e:object)=>worker.stdin.write(JSON.stringify(e)+"\n");
async function until(predicate:(e:any)=>boolean,from=0,timeout=60000){const began=performance.now();while(performance.now()-began<timeout){const error=events.slice(from).find(e=>e.type==="worker_error");if(error)throw Error(error.message);const e=events.slice(from).find(predicate);if(e)return e;await wait(10);}throw Error("Speech timeout: "+diagnostic);}
try{
 send({type:"load"});await until(e=>e.type==="worker_status"&&e.status==="ready");
 for(const c of cases){
  for(const name of inputs.arms){const armEvents:any[]=[];const presenter=new BaselinePresenter(new EmbeddingGemmaModel(),null,undefined,undefined,undefined,compositionPlanner("synthesis"));const emit=(e:object)=>armEvents.push({...e,at:performance.now()});const session=new Session(emit);const controller=new AdaptiveController(session,emit,question=>emit({type:"feedback",question}),presenter.decide);arms.push({id:name,controller,presenter,session,events:armEvents});await controller.start(state);if(c.id==="panels")controller.cue(1);armEvents.length=0;}
  const from=events.length;send({type:"start"});await until(e=>e.type==="worker_status"&&e.status==="listening",from);
  const audio=pcm(await readFile(c.path),c.path),began=performance.now();let sequence=0;
  for(let offset=0;offset<audio.length;offset+=8000){const delay=began+offset/32-performance.now();if(delay>0)await wait(delay);const mark=events.length;send({type:"audio",pcm:audio.subarray(offset,offset+8000).toString("base64"),sampleRate:16000,sequence:++sequence});await until(e=>e.type==="audio_ack"&&e.sequence===sequence,mark);}
  send({type:"stop"});await until(e=>e.type==="worker_status"&&e.status==="ready",from);await wait(2000);
  const finals=events.slice(from).filter(e=>e.type==="transcript"&&e.final);
  for(const arm of arms){const completed=arm.events.filter(e=>e.type==="direction_completed"),last=completed.at(-1),finalAt=finals.at(-1)?.at;const row={case:c.id,arm:arm.id,expected:c.expected,expectedBeat:c.expectedBeat,action:last?.decision?.action??"none",beat:arm.session.stage.composition?.beat??null,correct:last?.decision?.action===c.expected&&(c.expectedBeat===null||arm.session.stage.composition?.beat===c.expectedBeat),hostCalls:completed.length,finalToDirectionMs:finalAt&&last?last.at-finalAt:null,utterances:arm.events.filter(e=>e.type==="presentation_utterance").map(e=>e.text),feedback:arm.events.filter(e=>e.type==="feedback").map(e=>e.question),routes:arm.events.filter(e=>e.stage==="speech-routing").map(e=>e.details)};rows.push(row);routes.push({case:c.id,arm:arm.id,events:arm.events});console.log(JSON.stringify(row));arm.controller.stop();arm.presenter.close();}
  arms=[];
 }
}finally{for(const arm of arms){arm.controller.stop();arm.presenter.close();}send({type:"close"});worker.stdin.end();worker.kill();}
const report={id,startedAt,finishedAt:new Date().toISOString(),scope:inputs.scope,inputHash:hash(await readFile(`${root}/inputs.json`)),sourceFiles,rows,events,routes,limitations:["Four authored TTS recordings, one pass each, same events per arm; not independent speech acceptance or statistical latency evidence.","The initial panel view is the battery beat, so successful detection must change the canvas.","No new VAD model was installed or benchmarked."]};
await writeFile(`${root}/local.json`,JSON.stringify(report,null,2)+"\n");
