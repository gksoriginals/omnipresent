import type {AdaptiveComposition} from "../../shared/adaptive.js";
import type {CompositionPlanner,PlanningContext} from "./composition.js";
type Guard=(input:unknown,context:PlanningContext)=>AdaptiveComposition;
// Bounded deterministic synthesis. Every accepted addition passes the host's full-request guard.
export class SynthesisPlanner implements CompositionPlanner {
 readonly id="synthesis";
 constructor(private focus:CompositionPlanner,private validate:Guard){}
 async plan(context:PlanningContext,signal:AbortSignal){
  let plan=await this.focus.plan(context,signal);
  this.validate(plan,context);
  if(context.frame.inferred.family===null||!context.catalog.covered.has(context.selected))return plan;
  const selected=context.catalog.references.get(context.selected)!;
  const used=new Set([context.selected]);
  const currentIds=new Map(context.current.blocks.map(block=>{
   const id=[...context.catalog.references].find(([,r])=>r.beat===block.beat&&r.kind===block.kind)?.[0];return [id,block.id];
  }));
  const candidates=[...context.catalog.references].filter(([id])=>id!==context.selected&&context.catalog.covered.has(id));
  // A story contains at most 36 references. Bound proposals independently of model output.
  let attempts=0;
  while(plan.blocks.length<4&&candidates.length&&attempts<36){
   signal.throwIfAborted();
   const families=new Set([...used].map(id=>context.catalog.assets.find(a=>a.id===id)!.family));
   candidates.sort(([a,ra],[b,rb])=>{
    const score=(id:string,beat:number)=>Number(!families.has(context.catalog.assets.find(a=>a.id===id)!.family))*100+Number(currentIds.has(id))*20+Number(beat===selected.beat)*10;
    return score(b,rb.beat)-score(a,ra.beat)||a.localeCompare(b);
   });
   const [id,reference]=candidates.shift()!;attempts++;
   const beat=context.state.flow!.beats[reference.beat];
   if(reference.kind==="statement"&&(beat.audienceText??"").length>360)continue;
   const occupied=new Set(plan.blocks.map(b=>b.id));
   const oldSlot=currentIds.get(id);
   const slot=oldSlot&&oldSlot!=="primary"&&!occupied.has(oldSlot)?oldSlot:(["secondary","detail","context"] as const).find(slot=>!occupied.has(slot))!;
   const blocks=[...plan.blocks,{...reference,id:slot,emphasis:"normal" as const,reveal:null}];
   const textLength=blocks.reduce((n,b)=>n+(b.kind==="statement"?(context.state.flow!.beats[b.beat].audienceText??"").length:0),0);
   if(textLength>720)continue;
   const proposal:AdaptiveComposition={layout:blocks.length===2?"split":"sequence",blocks};
   try{this.validate(proposal,context);plan=proposal;used.add(id);}catch{/* An incompatible companion never invalidates the eligible primary. */}
  }
  // Restore retained slots as a set, avoiding collisions caused by additions being visited first.
  const available=new Set<AdaptiveComposition["blocks"][number]["id"]>(["secondary","detail","context"]);
  const companions=plan.blocks.slice(1).map(block=>({block,id:[...context.catalog.references].find(([,r])=>r.beat===block.beat&&r.kind===block.kind)![0]}));
  for(const entry of companions){const old=currentIds.get(entry.id);if(old&&old!=="primary"&&available.has(old)){entry.block={...entry.block,id:old};available.delete(old);}else entry.block={...entry.block,id:"primary"};}
  for(const entry of companions)if(entry.block.id==="primary"){entry.block={...entry.block,id:[...available][0]};available.delete(entry.block.id);}
  plan={...plan,blocks:[plan.blocks[0],...companions.map(e=>e.block).sort((a,b)=>["secondary","detail","context"].indexOf(a.id)-["secondary","detail","context"].indexOf(b.id))]};
  signal.throwIfAborted();return this.validate(plan,context);
 }
}
