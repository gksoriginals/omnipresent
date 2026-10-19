import {SynthesisPlanner} from "./synthesis.js";
import {componentIdentity,validateComponentSnapshot} from "./component-evidence.js";
import {validateComposition,type AdaptiveComposition} from "../../shared/adaptive.js";
import type {Preparation} from "../../shared/preparation.js";
import {supportsEvidence} from "../controllers/evidence-contract.js";
import type {RequestFrame} from "./request-frame.js";
import type {PresentationCatalog} from "./catalog.js";
export type PlanningContext={state:Preparation;catalog:PresentationCatalog;selected:string;frame:RequestFrame;current:AdaptiveComposition;requireIndependentReview:boolean};
export interface CompositionPlanner {readonly id:string;readonly inferredFormIsPreference?:boolean;plan(context:PlanningContext,signal:AbortSignal):Promise<AdaptiveComposition>}
export class FocusPlanner implements CompositionPlanner {
 readonly id="focus";
 async plan(context:PlanningContext,signal:AbortSignal){
  signal.throwIfAborted();const reference=context.catalog.references.get(context.selected);if(!reference)throw Error("Unknown selected component");
  return {layout:"focus" as const,blocks:[{...reference,id:"primary" as const,emphasis:"strong" as const,reveal:null}]};
 }
}
// A planner is a proposal source, never the evidence/commit authority.
export function validatePlannedComposition(input:unknown,context:PlanningContext):AdaptiveComposition{
 const composition=validateComposition(input,context.state);
 if((composition.layout==="focus"&&composition.blocks.length!==1)||(composition.layout==="split"&&composition.blocks.length!==2)||(composition.layout==="sequence"&&composition.blocks.length<3))throw Error("Layout does not match component count");
 if(composition.blocks.length>=3){
  const texts=composition.blocks.filter(b=>b.kind==="statement").map(b=>context.state.flow!.beats[b.beat].audienceText??"");
  if(texts.some(t=>t.length>360)||texts.reduce((n,t)=>n+t.length,0)>720)throw Error("Composition readability budget exceeded");
  for(const block of composition.blocks)if(block.kind==="image"&&(context.state.artifacts.find(a=>a.id===context.state.flow!.beats[block.beat].imageArtifactId)?.media?.alt.length??0)>160)throw Error("Composition image heading exceeds readability budget");
 }
 const seenContent=new Set<string>();const seen=new Set<string>();let selectedPresent=false;
 for(const block of composition.blocks){
  const entry=[...context.catalog.references].find(([,r])=>r.beat===block.beat&&r.kind===block.kind);
  if(!entry)throw Error("Uncatalogued composition component");const [id]=entry;
  if(seen.has(id))throw Error("Duplicate composition content");seen.add(id);
  const identity=componentIdentity(context.state,context.state.flow!.beats[block.beat],block.kind);
  if(seenContent.has(identity))throw Error("Duplicate rendered content");seenContent.add(identity);
  const asset=context.catalog.assets.find(a=>a.id===id)!;
  if(context.state.flow!.beats[block.beat].componentEvidence?.[block.kind]){const evidence=validateComponentSnapshot(context.state,context.state.flow!.beats[block.beat],block.kind);if(JSON.stringify(evidence)!==JSON.stringify(asset.evidence))throw Error("Component evidence changed after catalog snapshot");}
  const requestedIntent=id===context.selected||context.frame.inferred.family===null?context.frame.intent:{...context.frame.intent,family:null};
  if(composition.blocks.length>1&&!context.catalog.covered.has(id))throw Error("Multi-component coverage must be explicit");
  if(!supportsEvidence(asset,requestedIntent,context.requireIndependentReview))throw Error("Composition evidence does not cover request");
  if(block.reveal!==null){
   const beat=context.state.flow!.beats[block.beat],visual=context.state.visuals?.find(v=>v.id===beat.visualId)?.spec;
   if(block.kind!=="visual"||visual?.kind!=="diagram"||block.reveal>visual.nodes.length)throw Error("Invalid composition reveal");
  }
  if(id===context.selected)selectedPresent=true;
 }
 if(composition.blocks.length>1){
  const selected=context.catalog.assets.find(a=>a.id===context.selected);if(!selected)throw Error("Unknown selection");
  for(const id of seen){const asset=context.catalog.assets.find(a=>a.id===id)!;
   const a=selected.evidence,b=asset.evidence;
   if(a.entity!==b.entity||a.timeframe!==b.timeframe||a.provenance!==b.provenance||(a.unit&&b.unit&&a.unit!==b.unit))throw Error("Incompatible component scope");
  }
 }
 if(!selectedPresent)throw Error("Composition omitted selected component");
 return composition;
}
export class StablePlanner implements CompositionPlanner {
 readonly id="stable";
 private fallback=new FocusPlanner();
 async plan(context:PlanningContext,signal:AbortSignal){
  signal.throwIfAborted();
  try{
   const current=validatePlannedComposition(context.current,context);
   // Retention does not add content or infer a new coverage relationship.
   return structuredClone(current);
  }catch{return this.fallback.plan(context,signal);}
 }
}
export class PairedPlanner implements CompositionPlanner {
 readonly id="paired";
 private focus=new FocusPlanner();
 async plan(context:PlanningContext,signal:AbortSignal){
  const focus=await this.focus.plan(context,signal);
  if(context.frame.inferred.family===null||!context.catalog.covered.has(context.selected))return focus;
  const primary=context.catalog.references.get(context.selected)!;
  try{const retained=validatePlannedComposition(context.current,context);if(retained.blocks.length===2)return structuredClone(retained);}catch{}
  for(const [id,reference] of context.catalog.references){
   if(id===context.selected||reference.beat!==primary.beat||reference.kind===primary.kind||!context.catalog.covered.has(id))continue;
   const proposed:AdaptiveComposition={layout:"split",blocks:[...focus.blocks,{...reference,id:"secondary",emphasis:"normal",reveal:null}]};
   try{return validatePlannedComposition(proposed,context);}catch{}
  }
  return focus;
 }
}
export function compositionPlanner(id="focus"):CompositionPlanner{
 if(id==="synthesis")return new SynthesisPlanner(new FocusPlanner(),validatePlannedComposition);if(id==="paired")return new PairedPlanner();if(id==="focus")return new FocusPlanner();if(id==="stable")return new StablePlanner();throw Error(`Unknown composition planner: ${id}`);
}
