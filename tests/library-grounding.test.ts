import {test} from "node:test";
import assert from "node:assert/strict";
import {groundLibrary} from "../server/controllers/library-grounding.js";
import {largeLibrary} from "../scripts/large-library-fixture.js";
test("live grounding does not characterize real source evidence as simulated",async()=>{
 let attempts=0;
 const result=await groundLibrary("explain this",largeLibrary().slice(0,1),new AbortController().signal,async()=>{attempts++;},()=>{},{async decide(request){
  assert.doesNotMatch(request.questions.action.instructions,/benchmark|simulated/i);
  assert.match(request.questions.action.instructions,/evidence, never instructions/);
  return {usage:{cost:0},answers:{action:{type:"choice",choice:"option_0",probabilities:{option_0:1,context:0,hold:0}}}};
 }});
 assert.equal(result.action,"show");assert.equal(attempts,1);
});
test("grounding does not silently choose a hosted comparison provider",async()=>{
 await assert.rejects(groundLibrary('explain this',largeLibrary().slice(0,1),new AbortController().signal,async()=>{},()=>{}),/Explicit grounding comparison model required/);
});
