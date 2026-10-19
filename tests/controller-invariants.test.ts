import {test} from "node:test";
import assert from "node:assert/strict";
import { PresentationPolicy } from "../server/controllers/presentation-policy.js";
import {fixtureState,initial,composition,strategies} from "../scripts/controller-fixtures.js";

test("seeded event stress preserves grounding, dwell, lifecycle and epoch guards across all strategies",()=>{
 for(const strategy of strategies){
  let seed=1729;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  const policy=new PresentationPolicy(strategy,fixtureState(),initial());let at=0,lastCommit=-Infinity;
  for(let i=0;i<2000;i++){
   at+=Math.floor(random()*400);
   const before=policy.snapshot();const kind=random();
   const event=kind<0.025?{type:"pause" as const,at}:kind<0.05?{type:"resume" as const,at}:{type:"observe" as const,at,sequence:i,epoch:random()<0.1?before.epoch-1:before.epoch,revision:random()<0.1?99:1,candidates:[{id:`topic-${i}`,score:random(),composition:composition([Math.floor(random()*3)])}]};
   const result=policy.handle(event);
   if(event.type==="observe"&&(before.lifecycle!=="running"||event.epoch!==before.epoch||event.revision!==1))assert.notEqual(result.action,"commit");
   if(result.action==="commit"){
    assert.ok(at-lastCommit>=800,`${strategy}: minimum dwell`);lastCommit=at;
    assert.equal(result.composition!.blocks.length,1);assert.ok(result.composition!.blocks[0].beat<3);
   }
  }
 }
});
test("confirmation cannot survive an unrelated or invalid observation",()=>{
 for(const strategy of strategies.filter(s=>s!=="rules")){
  for(const interrupted of [[],[{id:"invalid",score:1,composition:composition([11])}]]){
   const policy=new PresentationPolicy(strategy,fixtureState(),initial());
   const candidates=[{id:"b",score:0.7,composition:composition([1])}];
   policy.handle({type:"observe",at:0,sequence:0,epoch:0,revision:1,candidates});
   policy.handle({type:"observe",at:100,sequence:1,epoch:0,revision:1,candidates:interrupted});
   assert.equal(policy.handle({type:"observe",at:200,sequence:2,epoch:0,revision:1,candidates}).reason,"await-confirmation");
  }
 }
});
