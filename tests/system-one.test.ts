import {test} from "node:test";
import assert from "node:assert/strict";
import {decisionRequest,decodeDecision} from "../server/agents/system-one.js";
import {emptyPreparation} from "../shared/preparation.js";
import {openingComposition} from "../shared/adaptive.js";
function setup(){const state=emptyPreparation();state.flow={title:"Solar",summary:"",openQuestions:[],beats:[{title:"Panels",audienceText:"Generate electricity",speakerNotes:"PRIVATE",visualDirection:"text",artifactIds:[]},{title:"Storage",audienceText:"Save electricity",speakerNotes:"PRIVATE",visualDirection:"text",artifactIds:[]}]};const request=decisionRequest(state,openingComposition(),"Compare generation and storage");return {state,request};}
function answers(request:ReturnType<typeof decisionRequest>,selections:Record<string,string>){return {answers:Object.fromEntries(Object.entries(request.questions).map(([id,q])=>[id,{type:"choice",choice:selections[id],probabilities:Object.fromEntries(Object.keys(q.criteria).map(k=>[k,k===selections[id]?1:0]))}]))};}
test("decision request shares topic descriptions without private notes",()=>{const {request}=setup();assert.ok(!JSON.stringify(request).includes("PRIVATE"));assert.match(request.questions.include_topic_0.criteria.include,/Panels/);});
test("typed decisions produce grounded multi-topic composition",()=>{const {state,request}=setup();const raw=answers(request,{include_topic_0:"include",include_topic_1:"include",mode:"text",layout:"split"});const result=decodeDecision(raw,request,state);assert.deepEqual(result.composition?.blocks.map(b=>b.beat),[0,1]);});
test("hold never constructs a composition and invalid choices/probabilities fail closed",()=>{const {state,request}=setup();const raw=answers(request,{include_topic_0:"exclude",include_topic_1:"exclude",mode:"text",layout:"focus"});assert.equal(decodeDecision(raw,request,state).composition,null);raw.answers.include_topic_0.choice="invented";assert.throws(()=>decodeDecision(raw,request,state),/Invalid/);raw.answers.include_topic_0.choice="exclude";raw.answers.include_topic_0.probabilities.exclude=NaN;assert.throws(()=>decodeDecision(raw,request,state),/probabilities/);});

test("Cloudflare variants use the existing authenticated decision endpoint without changing typed requests",async(t)=>{
 const {callDecision}=await import("../server/agents/system-one.js");
 const previous=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY="test-only-not-a-real-key";
 const calls:{url:string;body:any;authorization:string|null}[]=[];
 t.mock.method(globalThis,"fetch",async(input:RequestInfo|URL,init?:RequestInit)=>{
  calls.push({url:String(input),body:JSON.parse(String(init?.body)),authorization:new Headers(init?.headers).get("Authorization")});
  return Response.json({answers:{},model:"fixture"});
 });
 try{
  const {request}=setup();
  for(const provider of ["clef","clef-flash","clef-omni"] as const)await callDecision(provider,request,AbortSignal.timeout(1000));
  assert.deepEqual(calls.map(c=>c.body.model),["cloudflare/clef","cloudflare/clef-flash","cloudflare/clef-omni"]);
  for(const call of calls){assert.equal(call.url,"https://openrouter.ai/api/alpha/decisions");assert.equal(call.authorization,"Bearer test-only-not-a-real-key");assert.deepEqual(call.body.questions,request.questions);assert.deepEqual(call.body.state,request.state);}
 }finally{if(previous===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=previous;}
});
test("unsupported decision providers fail before any transport call",async(t)=>{
 const {callDecision}=await import("../server/agents/system-one.js");
 const fetch=t.mock.method(globalThis,"fetch",async()=>{throw Error("Must not call transport");});
 await assert.rejects(callDecision("unknown" as never,setup().request,AbortSignal.timeout(1000)),/Unknown decision provider/);assert.equal(fetch.mock.callCount(),0);
});
