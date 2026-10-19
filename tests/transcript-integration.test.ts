import {test} from "node:test";
import assert from "node:assert/strict";
import {setTimeout as wait} from "node:timers/promises";
import {AdaptiveController} from "../server/agents/adaptive.js";
import {BaselinePresenter} from "../server/presentation/baseline.js";
import {Session} from "../server/session.js";
import {prepareEvidence} from "../server/presentation/prepare-evidence.js";
import {approvePreparedEvidence} from "../server/presentation/component-evidence.js";
import {emptyPreparation} from "../shared/preparation.js";
const embedder={space:{model:"fixture",revision:"1",dimensions:2},encode:async(t:string[])=>t.map(()=>[1,0])};
function state(){const s=emptyPreparation();s.flow={title:"Solar energy",summary:"Concept illustration",openQuestions:[],beats:[{title:"Opening",audienceText:"Welcome",speakerNotes:"private",visualDirection:"statement",artifactIds:[]},{title:"Solar panels turn sunlight into electricity",audienceText:"Solar panels turn sunlight into electricity.",speakerNotes:"private",visualDirection:"statement",artifactIds:[]}]};s.flow=prepareEvidence(s.flow,s);approvePreparedEvidence(s.flow,s);s.approvedRevision=0;s.flowBasedOnRevision=0;return s;}
const event=(segmentId:string,text:string,final:boolean,startMs:number,endMs:number)=>({type:"transcript" as const,segmentId,text,final,streamId:"stream",startMs,endMs});

test("assembled split speech reaches the unchanged evidence host and unknown extra claims still abstain",async()=>{
 const events:any[]=[],questions:string[]=[];const presenter=new BaselinePresenter(embedder,null);const session=new Session(e=>events.push(e));
 const controller=new AdaptiveController(session,e=>events.push(e),q=>questions.push(q),presenter.decide);
 try{
  await controller.start(state());controller.acceptTranscript(event("a","Solar panels turn sunlight.",true,0,2000));
  controller.acceptTranscript(event("b","Into electricity.",false,2100,2900));
  await wait(400);assert.equal(session.stage.composition?.beat,0);
  controller.acceptTranscript(event("b","Into electricity.",true,2100,3100));
  await wait(450);assert.equal(session.stage.composition?.beat,1);
  assert.equal(events.filter(e=>e.type==="presentation_utterance").at(-1).text,"Solar panels turn sunlight. Into electricity.");
  const revision=session.stage.revision;
  controller.acceptTranscript(event("c","Solar panels turn sunlight into electricity. And show installation cost.",true,5000,8000));
  await wait(450);assert.equal(session.stage.revision,revision);assert.ok(questions.length);
 }finally{controller.stop();presenter.close();}
});
test("manual cues and pause cancel assembled windows before they can enter the host",async()=>{
 let calls=0;const controller=new AdaptiveController(new Session(()=>{}),()=>{},()=>{},async()=>{calls++;return {composition:null};});
 try{
  await controller.start(state());controller.acceptTranscript(event("a","Solar panels turn sunlight into electricity.",true,0,1000));controller.pause(true);await wait(450);assert.equal(calls,0);
  controller.pause(false);controller.acceptTranscript(event("b","Solar panels turn sunlight into electricity.",true,2000,3000));controller.cue(0);await wait(450);assert.equal(calls,0);
 }finally{controller.stop();}
});
test("full assembled obligations survive routing into negation and missing-evidence guards",async()=>{
 const {TranscriptAssembler}=await import("../server/speech/transcripts.js");
 const cases=[
  {parts:["Do not show","Solar panels turn sunlight into electricity."],show:false},
  {parts:["Solar panels turn sunlight into electricity.","And show the installation cost."],show:false},
  {parts:["Keep this visual.","Show the installation cost."],show:false},
  {parts:["If I said show","Solar panels turn sunlight into electricity."],show:false},
  {parts:["This chart shows a 50 percent efficiency improvement."],show:false},
  {parts:["Solar panels turn sunlight.","Into electricity."],show:true},
 ];
 for(const c of cases){
  const assembler=new TranscriptAssembler();c.parts.forEach((text,i)=>assembler.push(event(String(i),text,true,i*1000,(i+1)*1000),i));
  const batch=assembler.flush(1000)!;assert.equal(batch.action,"process");assert.equal(batch.text,c.parts.join(" "));
  const presenter=new BaselinePresenter(embedder,null);
  try{
   const result=await presenter.decide(state(),{layout:"focus",blocks:[{id:"primary",kind:"statement",beat:0,emphasis:"normal",reveal:null}]},batch.text,new AbortController().signal);
   assert.equal(result.composition!==null,c.show,batch.text);
  }finally{presenter.close();}
 }
});
