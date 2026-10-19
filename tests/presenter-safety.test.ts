import {test} from "node:test";
import assert from "node:assert/strict";
import {AdaptiveController,type CompositionDecider} from "../server/agents/adaptive.js";
import {Session} from "../server/session.js";
import {synthesisContext} from "./fixtures/synthesis-context.js";

test("manual cues hold unsupported evidence and invalidate pending automatic decisions",async()=>{
 const {state}=synthesisContext();const events:any[]=[];const questions:string[]=[];
 let complete!:(value:any)=>void;
 const decide:CompositionDecider=()=>new Promise(resolve=>{complete=resolve;});
 const controller=new AdaptiveController(new Session(e=>events.push(e)),e=>events.push(e),q=>questions.push(q),decide);
 await controller.start(state);
 const pending=controller.accept("prepared request");
 controller.cue(1);
 assert.equal(events.at(-1).held,true);assert.equal(questions.length,1);
 complete({composition:{layout:"focus",blocks:[{id:"late",beat:1,kind:"visual",emphasis:"normal",reveal:null}]}});
 await pending;
 assert.ok(!events.some(e=>e.type==="stage"&&e.stage?.composition?.beat===1));
 controller.cue(0);assert.equal(events.at(-1).held,false);
 controller.stop();
});

test("manual cues respect independent review policy",async()=>{
 const original=process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW;
 process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW="true";
 try{
  const events:any[]=[];const controller=new AdaptiveController(new Session(()=>{}),e=>events.push(e),()=>{},async()=>({composition:null}));
  await controller.start(synthesisContext().state);controller.cue(0);
  assert.equal(events.at(-1).held,true);controller.stop();
 }finally{if(original===undefined)delete process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW;else process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW=original;}
});
test("assembled utterances and speech-routing traces stay out of audience events",async()=>{
 const {audienceEvent}=await import("../server/presentation/audience.js");
 assert.equal(audienceEvent({type:"presentation_utterance",text:"Private speech"}),null);
 assert.equal(audienceEvent({type:"presentation_trace",stage:"speech-routing",details:{action:"process"}}),null);
});

test("strict review blocks factual opening and leaves a fact-free standby",async()=>{
 const original=process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW;
 process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW="true";
 const events:any[]=[];const questions:string[]=[];
 const controller=new AdaptiveController(new Session(e=>events.push(e)),e=>events.push(e),q=>questions.push(q),async()=>({composition:null}));
 try{
  await controller.start(synthesisContext().state);
  const stages=events.filter(e=>e.type==="stage");
  assert.equal(stages.length,1);assert.equal(stages[0].stage.composition,undefined);
  assert.equal(stages[0].stage.text,"Ready to present");assert.equal(questions.length,1);
 }finally{controller.stop();if(original===undefined)delete process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW;else process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW=original;}
});

test("final host authorization rejects unsupported and malformed experimental proposals",async()=>{
 const {state}=synthesisContext();const events:any[]=[];
 let proposal:any={layout:"focus",blocks:[{id:"primary",beat:0,kind:"visual",emphasis:"normal",reveal:null}]};
 const controller=new AdaptiveController(new Session(e=>events.push(e)),e=>events.push(e),()=>{},async()=>({composition:proposal}));
 await controller.start(state);const initial=events.filter(e=>e.type==="stage").length;
 await controller.accept("Show the installation cost in dollars");
 assert.equal(events.filter(e=>e.type==="stage").length,initial);
 assert.ok(events.some(e=>e.type==="agent_error"));
 proposal={layout:"split",blocks:[{id:"primary",beat:0,kind:"visual",emphasis:"normal",reveal:null}]};
 await controller.accept("Morning output");
 assert.equal(events.filter(e=>e.type==="stage").length,initial);
 controller.stop();
});

test("final host authorization allows a supported experimental proposal",async()=>{
 const events:any[]=[];const controller=new AdaptiveController(new Session(e=>events.push(e)),e=>events.push(e),()=>{},async()=>({composition:{layout:"focus",blocks:[{id:"primary",beat:0,kind:"visual",emphasis:"strong",reveal:null}]}}));
 try{await controller.start(synthesisContext().state);await controller.accept("Morning output");assert.equal(events.filter(e=>e.type==="stage").at(-1).stage.composition.adaptive.blocks[0].kind,"visual");assert.equal(events.at(-2).changed,true);}finally{controller.stop();}
});

test("unchanged manual views still reauthorize without duplicate canvas commits",async()=>{
 const original=process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW;
 delete process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW;
 const events:any[]=[];const controller=new AdaptiveController(new Session(e=>events.push(e)),e=>events.push(e),()=>{},async()=>({composition:null}));
 try{
  await controller.start(synthesisContext().state);controller.cue(0);
  const count=events.filter(e=>e.type==="stage").length;
  controller.cue(0);assert.equal(events.at(-1).changed,false);assert.equal(events.filter(e=>e.type==="stage").length,count);
  process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW="true";
  controller.cue(0);assert.equal(events.at(-1).held,true);assert.equal(events.filter(e=>e.type==="stage").length,count);
 }finally{controller.stop();if(original===undefined)delete process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW;else process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW=original;}
});
