import { test } from "node:test";
import assert from "node:assert/strict";
import { fixtures,replay,fixtureState,initial,strategies } from "../scripts/controller-fixtures.js";
import { PresentationPolicy } from "../server/controllers/presentation-policy.js";
import { buildPreparedIndex,shortlist } from "../server/controllers/candidates.js";

test("temporal controllers satisfy every fixed replay including interruptions, comparisons and stale inputs",()=>{
 for(const strategy of strategies.filter(s=>s!=="rules"))for(const scenario of fixtures.scenarios){
  for(const row of replay(strategy,scenario))assert.equal(row.actual,row.expected,`${strategy}/${scenario.id} at ${row.at}: ${row.reason}`);
 }
});
test("priority rules baseline exposes one-window noise rather than silently granting confirmation memory",()=>{
 const rows=replay("rules",fixtures.scenarios.find(s=>s.id==="one-window-noise")!);
 assert.equal(rows[0].actual,"commit:1");assert.equal(rows[0].correct,false);
});
test("all strategies reject malformed confidence and preserve immutable prepared state",()=>{
 for(const strategy of strategies){
  const state=fixtureState();const policy=new PresentationPolicy(strategy,state,initial());
  state.flow!.beats=[];
  const result=policy.handle({type:"observe",at:0,sequence:0,epoch:0,revision:1,candidates:[{id:"bad",score:NaN,composition:initial()}]});
  assert.equal(result.reason,"invalid-candidates");assert.equal(policy.snapshot().composition.blocks[0].beat,0);
  const snapshot=policy.snapshot();snapshot.composition.blocks[0].beat=2;assert.equal(policy.snapshot().composition.blocks[0].beat,0);
 }
});
test("prepared shortlist is bounded, grounded, revision-scoped and excludes private notes",()=>{
 const state=fixtureState();const index=buildPreparedIndex(state);
 assert.equal(shortlist(index,state,"PRIVATE").length,0);
 const result=shortlist(index,state,"Compare panels sunlight and battery storage night");
 assert.equal(result.length,1);assert.deepEqual(result[0].composition.blocks.map(b=>b.beat).sort(),[0,2]);
 state.flow!.beats[0].audienceText="A changed story at the same revision";assert.throws(()=>shortlist(index,state,"panels"),/Stale/);
 state.revision++;assert.throws(()=>shortlist(index,state,"panels"),/Stale/);
});
test("lexical retrieval regression retains paraphrase and missing-evidence failures as explicit gaps",()=>{
 const state=fixtureState();const index=buildPreparedIndex(state);
 assert.equal(shortlist(index,state,"Keep the surplus until darkness falls.").length,0);
 assert.ok(shortlist(index,state,"What is the installation cost of panels? No cost data is supplied.").length>0);
});
