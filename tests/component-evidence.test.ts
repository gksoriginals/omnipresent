import {test} from "node:test";
import assert from "node:assert/strict";
import {plannerContext} from "./fixtures/planner-context.js";
import {prepareEvidence} from "../server/presentation/prepare-evidence.js";
import {approvePreparedEvidence,componentHash} from "../server/presentation/component-evidence.js";
import {presentationCatalog} from "../server/presentation/catalog.js";
import {PairedPlanner,FocusPlanner,validatePlannedComposition} from "../server/presentation/composition.js";
import {storyRequestFrame} from "../server/presentation/request-frame.js";
const signal=()=>new AbortController().signal;
test("paired composition requires explicit same-claim component coverage",async()=>{
 const context=plannerContext();const plan=await new PairedPlanner().plan(context,signal());assert.equal(plan.layout,"split");assert.equal(plan.blocks.length,2);validatePlannedComposition(plan,context);
 delete context.state.flow!.beats[0].componentClaims;
 context.state.flow=prepareEvidence(context.state.flow!,context.state);approvePreparedEvidence(context.state.flow,context.state);
 const catalog=presentationCatalog(context.state);const text=catalog.assets.find(a=>a.id==="statement:0")!,visual=catalog.assets.find(a=>a.id==="diagram:0")!;
 assert.notEqual(text.evidence.claims[0].id,visual.evidence.claims[0].id);
 context.catalog=catalog;context.frame=storyRequestFrame("Solar generation",catalog.assets,"r");context.selected="statement:0";
 assert.equal((await new PairedPlanner().plan(context,signal())).blocks.length,1);
});
test("explicit visual requests remain focused and legacy beat coverage cannot form pairs",async()=>{
 const context=plannerContext();context.frame=storyRequestFrame("Show illustrative Solar story solar generation diagram",context.catalog.assets,"r");assert.equal(context.frame.inferred.family,null);
 assert.equal((await new PairedPlanner().plan(context,signal())).blocks.length,1);
 context.frame=storyRequestFrame("Solar generation",context.catalog.assets,"r");context.catalog.covered.clear();
 assert.equal((await new PairedPlanner().plan(context,signal())).blocks.length,1);
 const focus=await new FocusPlanner().plan(context,signal());assert.throws(()=>validatePlannedComposition({layout:"split",blocks:[...focus.blocks,{id:"secondary",kind:"statement",beat:0,emphasis:"normal",reveal:null}]},context),/explicit/);
});
test("changing rendered content or withdrawing a contract invalidates planned pairs",async()=>{
 for(const change of ["content","approval","claim"]){const context=plannerContext();const plan=await new PairedPlanner().plan(context,signal());
  const beat=context.state.flow!.beats[0];if(change==="content")beat.audienceText="Different unsupported content";
  if(change==="approval")beat.componentEvidence!.statement!.evidence.approved=false;
  if(change==="claim")beat.componentEvidence!.statement!.evidence.claims[0].id="withdrawn";
  assert.throws(()=>validatePlannedComposition(plan,context));
 }
});
test("component source withdrawal and stale reviews fail before approval",()=>{
 const context=plannerContext();context.state.artifacts=[{id:"data",name:"data.csv",content:"Morning,10"}];
 context.state.visuals=[{id:context.state.flow!.beats[0].visualId!,spec:{kind:"chart",title:"Production",unit:"Wh",chartType:"bar",sourceArtifactId:"data",data:[{label:"Morning",value:10}]}}];
 context.state.flow=prepareEvidence(context.state.flow!,context.state);context.state.artifacts=[];
 assert.throws(()=>approvePreparedEvidence(context.state.flow!,context.state),/withdrawn/);assert.equal(context.state.flow!.beats[0].evidence!.approved,false);
});
test("preparation does not infer audit status and content hashes survive schema whitespace normalization",()=>{
 const context=plannerContext(),beat=context.state.flow!.beats[0];const before=componentHash(context.state,beat,"statement");beat.audienceText+="  ";assert.equal(componentHash(context.state,beat,"statement"),before);
 assert.equal(beat.componentEvidence!.visual!.evidence.verification,"unknown");assert.equal(beat.componentEvidence!.visual!.evidence.independentReview,"pending");
});
test("live presenter can form an approved pair on a unique cue without a model call",async()=>{
 const {BaselinePresenter}=await import("../server/presentation/baseline.js");const context=plannerContext();let calls=0;
 const presenter=new BaselinePresenter({space:{model:"fake",revision:"1",dimensions:2},async encode(texts){return texts.map(()=>[1,0]);}},{id:"fake",model:"fake",async decide(){calls++;throw Error("Unexpected model call");}},undefined,undefined,undefined,new PairedPlanner());
 const result=await presenter.decide(context.state,context.current,"Solar process",signal());assert.equal(result.composition?.layout,"split");assert.equal(result.composition?.blocks.length,2);assert.equal(calls,0);assert.equal(result.metadata?.path,"cue");
});
test("declared coverage cannot silently omit its chart or image binding",()=>{
 for(const kind of ["visual","image"] as const){const c=plannerContext();const beat=c.state.flow!.beats[0];if(kind==="visual")delete beat.visualId;else beat.componentClaims={image:["beat"]};assert.throws(()=>prepareEvidence(c.state.flow!,c.state),/without a.* reference/);}
});
