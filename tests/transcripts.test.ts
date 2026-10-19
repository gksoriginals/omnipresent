import {test} from "node:test";
import assert from "node:assert/strict";
import {TranscriptAssembler,transcriptPolicy} from "../server/speech/transcripts.js";
const line=(segmentId:string,text:string,final=true,startMs=0,endMs=1000)=>({type:"transcript" as const,segmentId,text,final,startMs,endMs,streamId:"one"});
const router=()=>new TranscriptAssembler();

test("partial revisions replace a segment and never enter decision processing",()=>{
 const r=router();r.push(line("a","Solar",false),0);r.push(line("a","Solar panels",false),100);
 assert.equal(r.flush(800),null);
 r.push(line("a","Solar panels turn sunlight into electricity."),900);
 const result=r.flush(1250)!;assert.equal(result.action,"process");assert.equal(result.text,"Solar panels turn sunlight into electricity.");assert.equal(result.waitMs,350);
 assert.equal(r.push(line("a","Solar panels turn sunlight into electricity."),1300),false);
 assert.equal(r.flush(2000),null);
});
test("split finals wait for an active continuation and retain the exact transcript",()=>{
 const r=router();r.push(line("a","Solar panels turn sunlight.",true,0,2000),0);
 r.push({type:"speech_activity",segmentId:"b",streamId:"one",startMs:2100},100);
 assert.equal(r.flush(2000),null);
 r.push(line("b","Into electricity.",true,2100,3100),2200);
 assert.equal(r.flush(2549),null);
 assert.equal(r.flush(2550)?.text,"Solar panels turn sunlight. Into electricity.");
});
test("default routing preserves current-view remarks, extra facts, negation and corrections",()=>{
 for(const text of ["Keep this visual.","This chart shows a 50 percent improvement.","Don't show this chart.","Instead, show storage.","What does the current view say about costs?"]){
  const r=router();r.push(line("a",text),0);const batch=r.flush(350)!;
  assert.equal(batch.action,"process");assert.equal(batch.text,text);
 }
});
test("joined corrections and missing obligations are not stripped to a supported alias",()=>{
 const r=router();r.push(line("a","Solar panels turn sunlight into electricity.",true,0,1000),0);
 r.push(line("b","And show installation cost.",true,1050,2000),100);
 assert.equal(r.flush(450)?.text,"Solar panels turn sunlight into electricity. And show installation cost.");
 const q=router();q.push(line("a","Do not show",true,0,800),0);q.push(line("b","Solar panels turn sunlight into electricity.",true,850,2000),100);
 assert.equal(q.flush(450)?.text,"Do not show Solar panels turn sunlight into electricity.");
});
test("lifecycle resets and retired streams cannot replay stale text",()=>{
 const r=router();r.push(line("a","Solar panels turn sunlight."),0);r.reset();assert.equal(r.flush(2000),null);
 r.push(line("a","Keep this visual."),2100);r.push({...line("b","Show installation cost."),streamId:"two"},2200);
 assert.equal(r.push(line("old","Solar panels turn sunlight into electricity."),2300),false);
 assert.equal(r.flush(2550)?.text,"Show installation cost.");
});
test("overflow and amended finals hold without truncating into an apparently valid request",()=>{
 const r=router();r.push(line("a","private".repeat(1000)),0);const result=r.flush(350)!;
 assert.equal(result.action,"hold");assert.equal(result.text,"");assert.equal(r.push(line("b","Solar panels turn sunlight into electricity."),400),false);
 assert.equal(r.flush(900),null);r.reset();r.push(line("c","Keep this visual."),1000);r.flush(1350);
 r.push(line("c","Actually show cost."),1400);assert.equal(r.flush(1750)?.action,"hold");
 const q=router();q.push(line("a","unfinished",false),0);assert.equal(q.flush(transcriptPolicy.maxWindowMs)?.action,"hold");
});
test("overlapping ASR intervals merge while a genuine silence gap separates complete requests",()=>{
 const r=router();r.push(line("a","Solar panels turn sunlight.",true,1856,4192),0);
 r.push(line("b","Into electricity.",true,3968,5600),100);
 assert.equal(r.flush(450)?.text,"Solar panels turn sunlight. Into electricity.");
 const q=router();q.push(line("a","First complete request.",true,0,1000),0);
 q.push(line("b","Second complete request.",true,3000,4000),100);
 assert.equal(q.flush(450)?.text,"First complete request.");
 assert.equal(q.flush(451)?.text,"Second complete request.");
});
test("bounded interval assembly conserves every finalized word across varied overlaps and gaps",()=>{
 let seed=74321;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 for(let trial=0;trial<100;trial++){
  const r=router();const count=1+Math.floor(random()*8);let start=0;const expected:string[]=[];
  for(let i=0;i<count;i++){
   const text=`obligation_${trial}_${i}`;expected.push(text);
   r.push(line(String(i),text,true,start,start+1000),i);
   start+=Math.floor(random()*3000);
  }
  const texts:string[]=[];let result;while((result=r.flush(500))!==null){assert.equal(result.action,"process");texts.push(result.text);}
  assert.equal(texts.join(" "),expected.join(" "));
 }
});
test("scheduling thresholds are parameters and empty finals cannot trigger detection",()=>{
 const r=new TranscriptAssembler({...transcriptPolicy,quietMs:100});
 r.push(line("a","Unknown request with no prepared signal."),0);assert.equal(r.flush(99),null);assert.equal(r.flush(100)?.action,"process");
 r.push(line("b","",true,2000,3000),1000);assert.equal(r.flush(1100)?.action,"skip");
});
