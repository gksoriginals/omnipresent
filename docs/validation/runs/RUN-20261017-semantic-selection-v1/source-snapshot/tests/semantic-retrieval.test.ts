import {test} from "node:test";
import assert from "node:assert/strict";
import {SemanticIndex,scopeKey,validateVectors,fusedRank,preparedDocuments,type Embedder} from "../server/controllers/semantic-retrieval.js";
import {buildDecisionMenu,decodeShortlistedDecision,chooseShortlisted} from "../server/controllers/shortlisted-decision.js";
import {fixtureState} from "../scripts/controller-fixtures.js";
const space={model:"fixture",revision:"fixed",dimensions:3};
function mock(){let calls=0;const embedder:Embedder={space,async encode(texts,kind){calls++;return texts.map((_,i)=>kind==="query"?[0,0,1]:[Number(i===0),Number(i===1),Number(i===2)]);}};return {embedder,calls:()=>calls};}
test("semantic index ranks normalized vectors and scopes exact query cache to prepared project content",async()=>{
 const state=fixtureState(),m=mock(),index=new SemanticIndex("a",state,m.embedder),signal=AbortSignal.timeout(1000);
 await index.build(signal);
 const first=await index.rank("a",state,"surplus after sunset",signal);assert.equal(first.hits[0].beat,2);assert.equal(first.cacheHit,false);
 first.hits[0].score=999;
 const second=await index.rank("a",state,"surplus after sunset",signal);assert.equal(second.cacheHit,true);assert.equal(second.hits[0].score,1);assert.equal(m.calls(),2);
 await assert.rejects(index.rank("b",state,"surplus",signal),/cross-project/);
 const changed=structuredClone(state);changed.flow!.beats[0].audienceText="changed";await assert.rejects(index.rank("a",changed,"surplus",signal),/Stale/);
 assert.notEqual(scopeKey("a",state,space),scopeKey("a",state,{...space,revision:"other"}));
});
test("semantic index rejects malformed vectors and cancelled query never enters cache",async()=>{
 assert.throws(()=>validateVectors([[NaN,0,1]],1,3),/values/);assert.throws(()=>validateVectors([[0,0,0]],1,3),/normalized/);assert.throws(()=>validateVectors([[1,0]],1,3),/dimensions/);
 const state=fixtureState(),abort=new AbortController();let queryCalls=0;
 const index=new SemanticIndex("a",state,{space,async encode(texts,kind){if(kind==="query"){queryCalls++;if(queryCalls===1)abort.abort();}return texts.map((_,i)=>kind==="query"?[0,0,1]:[Number(i===0),Number(i===1),Number(i===2)]);}});
 await index.build(AbortSignal.timeout(1000));await assert.rejects(index.rank("a",state,"query",abort.signal));
 assert.equal((await index.rank("a",state,"query",AbortSignal.timeout(1000))).cacheHit,false);assert.equal(queryCalls,2);
});
test("bounded selection exposes only prepared choices and separates hold from missing context",()=>{
 const state=fixtureState(),menu=buildDecisionMenu(state,"compare",[{beat:0,score:0.8},{beat:2,score:0.7}]);
 assert.equal(menu.options.length,3);assert.ok(!JSON.stringify(menu.request).includes("PRIVATE"));
 const raw=(choice:string)=>({answers:{action:{type:"choice",choice,probabilities:Object.fromEntries(Object.keys(menu.request.questions.action.criteria).map(k=>[k,k===choice?1:0]))}}});
 assert.deepEqual(decodeShortlistedDecision(raw("pair"),menu,state).composition!.blocks.map(b=>b.beat),[0,2]);
 assert.equal(decodeShortlistedDecision(raw("hold"),menu,state).composition,null);assert.equal(decodeShortlistedDecision(raw("context"),menu,state).action,"request-context");
 assert.throws(()=>decodeShortlistedDecision(raw("invented"),menu,state),/Invalid/);
 const invalid=raw("pair");invalid.answers.action.probabilities.hold=1;assert.throws(()=>decodeShortlistedDecision(invalid,menu,state),/Unnormalized/);
 state.revision++;assert.throws(()=>decodeShortlistedDecision(raw("pair"),menu,state),/Stale/);
});
test("choice menu cannot invent references and fusion ranks deterministically without treating scores as confidence",()=>{
 const state=fixtureState();assert.throws(()=>buildDecisionMenu(state,"speech",[{beat:99,score:0.9}]),/Invalid/);
 assert.throws(()=>buildDecisionMenu(state,"speech",[{beat:1,score:NaN}]),/Invalid/);
 assert.deepEqual(fusedRank([{beat:2,score:0.8},{beat:0,score:0.7}],[{beat:0,score:8}]).map(h=>h.beat),[0,2]);
 assert.ok(preparedDocuments(state).every(d=>!d.text.includes("PRIVATE")));
});
