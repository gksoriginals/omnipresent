import {traceStage,nullTrace,type TraceSink} from "../experiments/trace.js";
import {createHash} from "node:crypto";
import {type LibraryAsset} from "./library-search.js";
import {hybridRetrieval,type RetrievalFactory,type RetrievalSnapshot} from "./retrieval.js";
import type {Embedder} from "./semantic-retrieval.js";
export type CueBundle={assetId:string;requests:string[]};
export type LibraryDecision={action:"show"|"hold"|"context";selected:string|null};
export type DecisionGate={before:(speech:string,assets:readonly LibraryAsset[],current:string|null)=>LibraryDecision|null;after:(speech:string,result:LibraryDecision,assets:readonly LibraryAsset[],current:string|null)=>LibraryDecision};
export type PolicyDecision=LibraryDecision & {operation:"replace"|"retain"|"none";path:"cue"|"keep"|"grounded"|"guard";revision:string};
export type Grounder=(speech:string,candidates:readonly LibraryAsset[],signal:AbortSignal,context?:{requestId:string;revision:string})=>Promise<LibraryDecision>;
// Exact, whole-utterance matching deliberately leaves paraphrases, quotations and corrections to grounding.
const normalize=(text:string)=>text.trim().toLowerCase().replace(/[.!]$/u,"").replace(/\s+/g," ");
const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export class LibraryPolicy {
 private generation=0;
 private epoch=0;
 private ready:{assets:readonly LibraryAsset[];index:RetrievalSnapshot;cues:Map<string,string|null>;revision:string}|null=null;
 private current:string|null=null;
 private active=new Set<AbortController>();
 constructor(private embedder:Embedder,private ground:Grounder,private gate?:DecisionGate,private retrieval:RetrievalFactory=hybridRetrieval,private trace:TraceSink=nullTrace){}
 get currentAsset(){return this.current;}
 synchronizeCurrent(id:string|null){if(id!==null&&!this.ready?.assets.some(a=>a.id===id))throw Error("Unknown committed asset");this.current=id;}
 get revision(){return this.ready?.revision??null;}
 pause(){this.epoch++;for(const a of this.active)a.abort();this.active.clear();}
 async refresh(assets:readonly LibraryAsset[],bundles:readonly CueBundle[],signal:AbortSignal,requestId?:string){
  const generation=++this.generation;this.pause();this.ready=null;this.current=null;
  const bundleCopy=structuredClone(bundles);const copy=structuredClone(assets);const freeze=(value:unknown):void=>{if(value&&typeof value==="object"){for(const child of Object.values(value))freeze(child);Object.freeze(value);}};freeze(copy);
  const ids=new Set(copy.map(a=>a.id));const cues=new Map<string,string|null>();
  for(const b of bundleCopy){if(!ids.has(b.assetId))throw Error("Unknown cue asset");for(const request of b.requests){const key=normalize(request);if(!key)throw Error("Empty cue");cues.set(key,cues.has(key)&&cues.get(key)!==b.assetId?null:b.assetId);}}
  const index=this.retrieval(copy,this.embedder);await traceStage(this.trace,"refresh",()=>index.build(signal),{revision:index.revision,requestId});signal.throwIfAborted();
  if(generation!==this.generation)throw Error("Superseded library refresh");
  this.ready={assets:copy,index,cues,revision:digest({index:index.revision,bundles:bundleCopy})};
 }
 async decide(speech:string,signal:AbortSignal,allowCues=true,requestId?:string,gate:DecisionGate|undefined=this.gate,ground:Grounder=this.ground):Promise<PolicyDecision>{
  const snapshot=this.ready;if(!snapshot)throw Error("Library not ready");
  // Latest decision wins; a slow previous result cannot overwrite a newer canvas.
  this.pause();const epoch=this.epoch;const controller=new AbortController();this.active.add(controller);
  const combined=AbortSignal.any([signal,controller.signal]);const key=normalize(speech);
  try{
   combined.throwIfAborted();let result:LibraryDecision,path:PolicyDecision["path"]="grounded";
   const context={revision:snapshot.revision,requestId:requestId??String(epoch)};
   const preliminary=await traceStage(this.trace,"eligibility",async()=>gate?.before(speech,snapshot.assets,this.current),context);
   if(preliminary){result=preliminary;path="guard";}
   else if(allowCues&&/^(keep this|keep this visual|keep the current visual)$/.test(key)&&this.current){result={action:"hold",selected:null};path="keep";}
   else if(allowCues&&snapshot.cues.get(key)){result={action:"show",selected:snapshot.cues.get(key)!};path="cue";}
   else {const candidates=await traceStage(this.trace,"retrieval",()=>snapshot.index.retrieve(speech,combined),context);combined.throwIfAborted();result=await traceStage(this.trace,"grounding",()=>ground(speech,candidates,combined,context),context);}
   combined.throwIfAborted();if(this.ready!==snapshot||epoch!==this.epoch)throw Error("Stale policy decision");
   if(gate)result=await traceStage(this.trace,"final-evidence",async()=>gate!.after(speech,result,snapshot.assets,this.current),context);
   combined.throwIfAborted();if(this.ready!==snapshot||epoch!==this.epoch)throw Error("Stale policy decision");
   if(!["show","hold","context"].includes(result.action))throw Error("Invalid grounded action");
   if(result.action==="show"&&!snapshot.assets.some(a=>a.id===result.selected))throw Error("Unknown grounded asset");
   if(result.action!=="show"&&result.selected!==null)throw Error("Unexpected non-show reference");
   let operation:PolicyDecision["operation"]="none";
   if(result.action==="show"){operation=this.current===result.selected?"retain":"replace";this.current=result.selected;}
   else if((result.action==="hold"||result.action==="context")&&this.current)operation="retain";
   this.trace.write({stage:"decision",phase:"complete",atMs:performance.now(),...context,details:{action:result.action,path,operation,selected:result.selected}});
   return {...result,operation,path,revision:snapshot.revision};
  }finally{this.active.delete(controller);}
 }
}
