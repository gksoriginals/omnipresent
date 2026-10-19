import {validateComposition,type AdaptiveComposition} from "../../shared/adaptive.js";
import type {Preparation} from "../../shared/preparation.js";
import {supportsEvidence} from "../controllers/evidence-contract.js";
import type {RequestFrame} from "./request-frame.js";
import type {PresentationCatalog} from "./catalog.js";
export type PlanningContext={state:Preparation;catalog:PresentationCatalog;selected:string;frame:RequestFrame;current:AdaptiveComposition;requireIndependentReview:boolean};
export interface CompositionPlanner {readonly id:string;plan(context:PlanningContext,signal:AbortSignal):Promise<AdaptiveComposition>}
export class FocusPlanner implements CompositionPlanner {
 readonly id="focus";
 async plan(context:PlanningContext,signal:AbortSignal){
  signal.throwIfAborted();const reference=context.catalog.references.get(context.selected);if(!reference)throw Error("Unknown selected component");
  return {layout:"focus" as const,blocks:[{...reference,id:"primary" as const,emphasis:"strong" as const,reveal:null}]};
 }
}
// A planner is a proposal source, never the evidence/commit authority.
export function validatePlannedComposition(input:unknown,context:PlanningContext):AdaptiveComposition{
 const composition=validateComposition(input,context.state);const seen=new Set<string>();let selectedPresent=false;
 for(const block of composition.blocks){
  const entry=[...context.catalog.references].find(([,r])=>r.beat===block.beat&&r.kind===block.kind);
  if(!entry)throw Error("Uncatalogued composition component");const [id]=entry;
  if(seen.has(id))throw Error("Duplicate composition content");seen.add(id);
  const asset=context.catalog.assets.find(a=>a.id===id)!;
  if(!supportsEvidence(asset,context.frame.intent,context.requireIndependentReview))throw Error("Composition evidence does not cover request");
  if(block.reveal!==null){
   const beat=context.state.flow!.beats[block.beat],visual=context.state.visuals?.find(v=>v.id===beat.visualId)?.spec;
   if(block.kind!=="visual"||visual?.kind!=="diagram"||block.reveal>visual.nodes.length)throw Error("Invalid composition reveal");
  }
  if(id===context.selected)selectedPresent=true;
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
export function compositionPlanner(id="focus"):CompositionPlanner{
 if(id==="focus")return new FocusPlanner();if(id==="stable")return new StablePlanner();throw Error(`Unknown composition planner: ${id}`);
}
