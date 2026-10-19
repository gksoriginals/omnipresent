import {createHash} from "node:crypto";
import {WebSocket} from "ws";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {emptyPreparation} from "../shared/preparation.js";
import {sourceBackedLibrary} from "./source-backed-evidence-fixture.js";
const id=process.argv[2];if(!id||!/^[-\w]+$/.test(id))throw Error("Unique run ID required");const directory=`docs/validation/runs/${id}`;await mkdir(directory,{recursive:false});
const sourceFiles=[];for(const path of ["scripts/baseline-live-probe.ts","server/index.ts","server/agents/adaptive.ts","server/presentation/baseline.ts","server/presentation/catalog.ts","server/controllers/evidence-contract.ts","server/controllers/library-policy.ts","server/controllers/library-grounding.ts","server/controllers/library-search.ts","server/models/decisions.ts","server/models/decision-transport.ts","server/models/embeddings.ts","shared/evidence.ts","runtime/retrieval-model.json"]){const data=await readFile(path),target=`${directory}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,data);sourceFiles.push({path,sha256:createHash("sha256").update(data).digest("hex")});}
const assets=sourceBackedLibrary(),state=emptyPreparation();state.flow={title:"Solar and water",summary:"Public-source concept presentation",openQuestions:[],beats:assets.map(a=>({title:a.title,audienceText:a.text,speakerNotes:"Private speaking notes",visualDirection:"statement",artifactIds:[],evidence:a.evidence,cueAliases:a.evidence.claims.flatMap(c=>c.aliases)}))};state.flowBasedOnRevision=state.revision;state.approvedRevision=state.revision;
await writeFile(`${directory}/inputs.json`,JSON.stringify(state,null,2));
const events:any[]=[];const ws=new WebSocket("ws://127.0.0.1:4317/session");ws.on("message",data=>events.push({...JSON.parse(String(data)),at:Date.now()}));await new Promise<void>((resolve,reject)=>{ws.on("open",resolve);ws.on("error",reject);});
const send=(e:unknown)=>ws.send(JSON.stringify(e));
async function until(predicate:(e:any)=>boolean,from=0){const deadline=Date.now()+45000;while(Date.now()<deadline){const fail=events.slice(from).find(e=>["agent_error","error"].includes(e.type));if(fail)throw Error(fail.message);const match=events.slice(from).find(predicate);if(match)return match;await new Promise(r=>setTimeout(r,25));}throw Error("Live baseline timeout");}
const began=Date.now();const outcomes=[];
try{
 send({type:"presentation_load",state,projectId:"public-demo",storyId:"source-story"});const loaded=await until(e=>e.type==="presentation_loaded");assert.equal(loaded.baseline,"evidence-v1");assert.equal(loaded.decision,"clef-omni");
 send({type:"presentation_start"});await until(e=>e.type==="stage");
 for(const step of [{speech:"Now explain how condensation and precipitation move water between stores with the actual USGS statement.",beat:5,action:"show"},{speech:"Show the audited EIA photovoltaic conversion statement.",beat:5,action:"context"},{speech:"The note says \"show the actual EIA photovoltaic conversion statement\" but we are checking the microphone.",beat:5,action:"hold"}]){
  const offset=events.length;send({type:"presentation_speech",text:step.speech});const completed=await until(e=>e.type==="direction_completed",offset);assert.equal(completed.decision.baseline,"evidence-v1");assert.equal(completed.decision.action,step.action);assert.equal(completed.composition.blocks[0].beat,step.beat);outcomes.push({speech:step.speech,action:completed.decision.action,beat:completed.composition.blocks[0].beat,inferenceMs:completed.inferenceMs,path:completed.decision.path});
 }
 assert.ok(events.some(e=>e.type==="presentation_feedback"&&e.projectId==="public-demo"));
 send({type:"pause",value:true});await until(e=>e.type==="snapshot"&&e.paused);send({type:"presentation_stop"});
 await writeFile(`${directory}/live-baseline.json`,JSON.stringify({id,startedAt:new Date(began).toISOString(),finishedAt:new Date().toISOString(),sourceFiles,scope:"Actual websocket coordinator, local EmbeddingGemma and hosted Clef-omni; scripted public-source text, no STT/microphone/browser paint",outcomes,events},null,2));console.log(JSON.stringify({id,outcomes},null,2));
}finally{ws.close();}
