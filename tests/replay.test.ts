import {test} from "node:test";
import assert from "node:assert/strict";
import {runReplay} from "../server/experiments/replay.js";
import {MemoryTraceSink,traceStage} from "../server/experiments/trace.js";
test("paired replay includes refresh, fallback and grounding in total time and retains failed rows",async()=>{
 let time=0;const orders:string[]=[],sink=new MemoryTraceSink();
 const result=await runReplay({cases:[{id:"positive",speech:"show",refresh:true,expected:{action:"show",selected:"a"}},{id:"missing",speech:"missing",expected:{action:"context",selected:null}}],passes:2,arms:["baseline","candidate"],clock:()=>time,sink:()=>sink,
 create:(_pass,id,trace)=>({id,async initialize(){time+=100;},async refresh(){time+=7;},async decide(c){orders.push(id);return traceStage(trace,"fallback",async()=>{time+=11;if(id==="candidate"&&c.id==="missing")throw Error("provider unavailable");return c.expected;},{},()=>time);}})});
 assert.equal(result.rows.length,8);assert.equal(result.initialization.length,4);assert.ok(result.rows.filter(r=>r.caseId==="positive").every(r=>r.elapsedMs===18));
 assert.equal(result.summary.find(s=>s.arm==="candidate")!.failures,2);assert.deepEqual(orders.slice(0,4),["baseline","candidate","candidate","baseline"]);
 assert.ok(sink.events.some(e=>e.stage==="fallback"&&e.phase==="error"));assert.ok(sink.events.some(e=>e.stage==="turn"&&e.phase==="error"));
});
test("initialization failure cannot silently disappear from replay denominators",async()=>{
 const sink=new MemoryTraceSink();const result=await runReplay({cases:[{id:"one",speech:"",expected:{action:"hold",selected:null}}],passes:1,arms:["broken"],sink:()=>sink,create:()=>({id:"broken",async initialize(){throw Error("unavailable");},async refresh(){},async decide(){throw Error("must not run");}})});
 assert.equal(result.rows.length,1);assert.equal(result.summary[0].failures,1);assert.match(result.rows[0].error!,/Initialization failed/);
});
test("replay attributes model fallbacks to their turn and protects frozen expectations",async()=>{
 const sink=new MemoryTraceSink();const result=await runReplay({cases:[{id:"one",speech:"show",expected:{action:"show",selected:"a"}}],passes:1,arms:["model"],sink:()=>sink,create:(_pass,id,trace)=>({id,async initialize(){},async refresh(){},async decide(c){assert.ok(Object.isFrozen(c.expected));for(const attempt of [1,2])trace.write({stage:"model-attempt",phase:"complete",atMs:attempt,elapsedMs:5,details:{attempt,cost:0}});return c.expected;}})});
 assert.equal(result.rows[0].groundingCalls,2);assert.equal(result.rows[0].fallbacks,1);assert.equal(result.rows[0].stageMs?.["model-attempt"],10);assert.equal(result.passes[0].arms[0].fallbacks,1);
});
test("profile construction errors count as initialization and case failures",async()=>{
 const sink=new MemoryTraceSink();const result=await runReplay({cases:[{id:"one",speech:"",expected:{action:"hold",selected:null}}],passes:1,arms:["broken"],sink:()=>sink,create(){throw Error("bad configuration");}});
 assert.equal(result.initialization.length,1);assert.equal(result.summary[0].failures,1);
});

test("replay preserves actual alternate selections and freezes acceptable reference sets",async()=>{
 const sink=new MemoryTraceSink();const result=await runReplay({cases:[{id:"alternate",speech:"show",expected:{action:"show",selected:"a"},acceptable:[{action:"show",selected:"b"}]}],passes:1,arms:["local"],sink:()=>sink,create:()=>({id:"local",async initialize(){},async refresh(){},async decide(c){assert.ok(Object.isFrozen(c.acceptable));assert.ok(Object.isFrozen(c.acceptable![0]));return {action:"show",selected:"b"};}})});
 assert.equal(result.rows[0].result?.selected,"b");assert.equal(result.rows[0].correct,true);assert.equal(result.summary[0].unsupportedShows,0);
});
