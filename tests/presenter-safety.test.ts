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
