import {test} from "node:test";
import assert from "node:assert/strict";
import {synthesisContext} from "./fixtures/synthesis-context.js";
import {compositionPlanner,validatePlannedComposition} from "../server/presentation/composition.js";
import {prepareEvidence} from "../server/presentation/prepare-evidence.js";
import {approvePreparedEvidence} from "../server/presentation/component-evidence.js";
import {presentationCatalog} from "../server/presentation/catalog.js";
import {storyRequestFrame} from "../server/presentation/request-frame.js";
const signal=()=>new AbortController().signal;
const planner=()=>compositionPlanner("synthesis");
test("synthesis composes four supported references across beats with distinct stable slots",async()=>{
 const c=synthesisContext();const plan=await planner().plan(c,signal());assert.equal(plan.layout,"sequence");assert.equal(plan.blocks.length,4);assert.ok(plan.blocks.some(b=>b.beat===1));assert.equal(new Set(plan.blocks.map(b=>b.id)).size,4);validatePlannedComposition(plan,c);
 c.current=plan;assert.deepEqual(await planner().plan(c,signal()),plan);
 assert.equal(c.state.flow!.beats[1].componentEvidence!.visual!.evidence.claims[0].id,"beat-0");
});
test("synthesis excludes incompatible, withdrawn and undeclared companions and respects explicit form",async()=>{
 for(const mode of ["scope","withdrawn","undeclared","unit"]){const c=synthesisContext();
  if(mode==="scope")c.state.flow!.beats[1].componentEvidence!.visual!.evidence.entity="Other entity";
  if(mode==="withdrawn")c.state.flow!.beats[1].componentEvidence!.visual!.evidence.approved=false;
  if(mode==="undeclared")c.catalog.covered.delete("chart:1");
  if(mode==="unit")c.state.flow!.beats[1].componentEvidence!.visual!.evidence.unit="USD";
  const plan=await planner().plan(c,signal());assert.equal(plan.blocks.length,3,mode);assert.ok(!plan.blocks.some(b=>b.beat===1),mode);validatePlannedComposition(plan,c);
 }
 const c=synthesisContext();c.frame=storyRequestFrame("Show actual Solar energy example Morning output chart",c.catalog.assets,"r");assert.equal((await planner().plan(c,signal())).blocks.length,1);
});
test("cross-beat declarations reject invalid references and deduplicate equivalent references",()=>{
 const c=synthesisContext();c.state.flow!.beats[1].componentClaims={visual:["beat:11"]};assert.throws(()=>prepareEvidence(c.state.flow!,c.state),/Unknown component claim/);
 c.state.flow!.beats[1].componentClaims={visual:["beat:0"]};c.state.flow!.beats[0].componentClaims={visual:["beat","beat:0"]};const flow=prepareEvidence(c.state.flow!,c.state);assert.equal(flow.beats[0].componentEvidence!.visual!.evidence.claims.length,1);
});
test("rendered duplicates cannot sneak through different beat references",async()=>{
 const c=synthesisContext();c.state.visuals![1].spec=structuredClone(c.state.visuals![0].spec);c.state.flow=prepareEvidence(c.state.flow!,c.state);approvePreparedEvidence(c.state.flow,c.state);c.catalog=presentationCatalog(c.state);
 const plan=await planner().plan(c,signal());assert.equal(plan.blocks.length,3);
 const focus=await compositionPlanner().plan(c,signal());assert.throws(()=>validatePlannedComposition({layout:"split",blocks:[...focus.blocks,{id:"secondary",kind:"visual",beat:1,emphasis:"normal",reveal:null}]},c),/Duplicate rendered/);
});
test("synthesis holds invalid primary evidence and enforces cancellation and layout limits",async()=>{
 const c=synthesisContext();c.state.flow!.beats[0].componentEvidence!.visual!.evidence.approved=false;await assert.rejects(planner().plan(c,signal()),/Review/);
 const abort=new AbortController();abort.abort();await assert.rejects(planner().plan(synthesisContext(),abort.signal));
 const valid=synthesisContext(),plan=await planner().plan(valid,signal());assert.throws(()=>validatePlannedComposition({...plan,layout:"focus"},valid),/Layout/);assert.throws(()=>validatePlannedComposition({...plan,blocks:[...plan.blocks,{...plan.blocks[0],id:"context"}]},valid));
});
test("live presenter synthesizes the exact cue without a model call",async()=>{
 const {BaselinePresenter}=await import("../server/presentation/baseline.js");const c=synthesisContext();let calls=0;
 const p=new BaselinePresenter({space:{model:"fake",revision:"1",dimensions:2},async encode(texts){return texts.map(()=>[1,0]);}},{id:"fake",model:"fake",async decide(){calls++;throw Error("Unexpected model");}},undefined,undefined,undefined,planner());
 const result=await p.decide(c.state,c.current,"Morning output",signal());assert.equal(result.composition?.blocks.length,4);assert.equal(calls,0);
});
test("surviving components retain slots when another component disappears or the primary changes",async()=>{
 const c=synthesisContext(),first=await planner().plan(c,signal());c.current=first;
 const slot=(blocks:typeof first.blocks,beat:number,kind:string)=>blocks.find(b=>b.beat===beat&&b.kind===kind)?.id;
 c.state.flow!.beats[0].componentEvidence!.image!.evidence.approved=false;
 const reduced=await planner().plan(c,signal());assert.equal(reduced.blocks.length,3);for(const b of reduced.blocks)assert.equal(b.id,slot(first.blocks,b.beat,b.kind));
 const fresh=synthesisContext();fresh.current=first;fresh.selected="chart:1";fresh.frame=storyRequestFrame("Daily curve",fresh.catalog.assets,"r");const switched=await planner().plan(fresh,signal());assert.equal(switched.blocks[0].beat,1);assert.equal(switched.blocks[0].id,"primary");assert.equal(slot(switched.blocks,0,"statement"),slot(first.blocks,0,"statement"));assert.equal(slot(switched.blocks,0,"image"),slot(first.blocks,0,"image"));
});
test("oversized companions and unsupported extra claims cannot fill the canvas",async()=>{
 const c=synthesisContext();c.state.flow!.beats[0].audienceText="Long text ".repeat(60);c.state.flow=prepareEvidence(c.state.flow!,c.state);approvePreparedEvidence(c.state.flow,c.state);c.catalog=presentationCatalog(c.state);
 const plan=await planner().plan(c,signal());assert.equal(plan.blocks.length,3);assert.ok(!plan.blocks.some(b=>b.kind==="statement"));
 const request=synthesisContext();request.frame={...request.frame,intent:{...request.frame.intent,claims:[...request.frame.intent.claims,"unsupported"]}};await assert.rejects(planner().plan(request,signal()),/evidence/);
});
test("inferred form does not reject a natural spoken statement in synthesis mode",async()=>{
 const {BaselinePresenter}=await import("../server/presentation/baseline.js");const c=synthesisContext();let calls=0;
 const p=new BaselinePresenter({space:{model:"fake",revision:"1",dimensions:2},async encode(texts){return texts.map(()=>[1,0]);}},{id:"fake",model:"fake",async decide(){calls++;throw Error("Unexpected model");}},undefined,undefined,undefined,planner());
 const result=await p.decide(c.state,c.current,c.state.flow!.beats[0].audienceText!,signal());assert.equal(result.composition?.blocks.length,4);assert.equal(calls,0);
});
