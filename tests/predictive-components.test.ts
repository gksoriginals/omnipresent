import {test} from "node:test";
import assert from "node:assert/strict";
import {predictionStates} from "../scripts/predictive-fixtures.js";
import {HybridComponentIndex,preparedComponents,catalogKey} from "../server/controllers/hybrid-components.js";
import {componentForecastRequest,decodeFamilyForecast,allowedForecastFamilies} from "../server/controllers/component-forecast.js";
import type {Embedder} from "../server/controllers/semantic-retrieval.js";
const signal=()=>AbortSignal.timeout(1000);
function embedder():Embedder{return {space:{model:"fixture",revision:"one",dimensions:2},async encode(texts,kind){return texts.map((_,i)=>kind==="query"?[1,0]:i%2?[0,1]:[1,0]);}};}
test("hybrid component facets restrict both lexical and vector scoring to prepared families",async()=>{
 const state=predictionStates().solar,index=new HybridComponentIndex("solar",state,embedder());await index.build(signal());const query="synthetic daily chart noon";
 const {vector}=await index.encodeQuery("solar",state,query,signal());
 const all=index.rank("solar",state,query,vector),filtered=index.rank("solar",state,query,vector,new Set(["chart"]));
 assert.equal(all.totalComponents,9);assert.equal(filtered.scoredComponents,1);assert.equal(filtered.hits[0].id,"chart:1");assert.ok(filtered.hits[0].lexicalScore>0);
 assert.equal(index.rank("solar",state,query,vector,new Set()).hits.length,0);
 const copy=index.components as any;copy[0].text="mutated";assert.notEqual(index.components[0].text,"mutated");
});
test("hybrid search rejects cross-project, changed source and embedding-space cache reuse",async()=>{
 const state=predictionStates().solar,e=embedder(),index=new HybridComponentIndex("solar",state,e);await index.build(signal());
 await assert.rejects(index.encodeQuery("other",state,"query",signal()),/cross-project/);
 const changed=structuredClone(state);changed.visuals![0].spec.title="Changed diagram";assert.notEqual(catalogKey("solar",state),catalogKey("solar",changed));
 await assert.rejects(index.encodeQuery("solar",changed,"query",signal()),/Stale/);
 e.space.revision="two";await assert.rejects(index.encodeQuery("solar",state,"query",signal()),/Stale/);
});
test("forecast context excludes future speech and private notes and invalidates on epoch, revision and expiry",()=>{
 const state=predictionStates().solar,context={project:"solar",currentBeat:0,recentSpeech:"Current context only",epoch:4,at:100};
 const request=componentForecastRequest(state,context,"next");assert.ok(!JSON.stringify(request).includes("PRIVATE"));assert.match(request.questions.family.instructions,/Future speech is unknown/);
 const raw={answers:{family:{type:"choice",choice:"chart",probabilities:{statement:0.2,diagram:0.3,chart:0.5}}}};
 const forecast=decodeFamilyForecast(raw,request,state,context);
 assert.deepEqual([...allowedForecastFamilies(forecast,state,"solar",4,200,2)!],["chart","diagram"]);
 assert.equal(allowedForecastFamilies(forecast,state,"other",4,200),null);assert.equal(allowedForecastFamilies(forecast,state,"solar",5,200),null);assert.equal(allowedForecastFamilies(forecast,state,"solar",4,4000),null);
 assert.equal(allowedForecastFamilies(forecast,state,"solar",4,200,2,1),null);
 state.revision++;assert.equal(allowedForecastFamilies(forecast,state,"solar",4,200),null);
});
test("malformed family distributions fail closed and retrieval never creates unsupported component references",()=>{
 const state=predictionStates().solar,context={project:"solar",currentBeat:0,recentSpeech:"chart",epoch:0,at:0};const request=componentForecastRequest(state,context,"current");
 assert.throws(()=>decodeFamilyForecast({answers:{family:{type:"choice",choice:"invented",probabilities:{}}}},request,state,context),/Invalid/);
 assert.throws(()=>decodeFamilyForecast({answers:{family:{type:"choice",choice:"chart",probabilities:{statement:1,diagram:1,chart:1}}}},request,state,context),/Unnormalized/);
 for(const c of preparedComponents(state)){assert.equal(c.composition.blocks[0].beat,c.beat);assert.ok(!c.text.includes("PRIVATE"));assert.ok(["statement","diagram","chart"].includes(c.family));}
});
