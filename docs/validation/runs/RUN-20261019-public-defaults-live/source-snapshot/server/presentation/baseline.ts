import {LocalHybridSelector,type AssetSelector,type SelectionContext} from "./selection.js";
import {randomUUID} from "node:crypto";
import {traceStage,nullTrace,type TraceSink} from "../experiments/trace.js";
import type {Preparation} from "../../shared/preparation.js";
import type {CompositionDecider} from "../agents/adaptive.js";
import {LibraryPolicy} from "../controllers/library-policy.js";
import {evidenceGate} from "../controllers/evidence-contract.js";
import {groundLibrary} from "../controllers/library-grounding.js";
import type {DecisionModel} from "../models/decisions.js";
import type {Embedder} from "../controllers/semantic-retrieval.js";
import {storyRequestFrame,type RequestFrame,type RequestInterpreter} from "./request-frame.js";
import {hybridRetrieval,type RetrievalFactory} from "../controllers/retrieval.js";
import {FocusPlanner,validatePlannedComposition,type CompositionPlanner} from "./composition.js";
import {presentationCatalog} from "./catalog.js";
import {compilePresentation,type PreparedPresentation} from "./prepared.js";
import {CachedEmbedder} from "../models/cached-embeddings.js";
export class BaselinePresenter {
 private question:string|undefined;
 private snapshot:PreparedPresentation|null=null;
 private turn=0;
 private generation=0;
 private key="";private policy:LibraryPolicy|null=null;private catalog:ReturnType<typeof presentationCatalog>|null=null;
 constructor(private embedding:Embedder,private decision:DecisionModel|null,private retrieval:RetrievalFactory=hybridRetrieval,private interpret:RequestInterpreter=storyRequestFrame,private trace:TraceSink=nullTrace,private planner:CompositionPlanner=new FocusPlanner(),private selector?:AssetSelector){if(!decision&&!selector)this.selector=new LocalHybridSelector();this.embedding=new CachedEmbedder(embedding);}
 close(){this.selector?.close?.();this.policy?.pause();}
 private frame(text:string,assets:Parameters<RequestInterpreter>[1],revision:string):RequestFrame{
  const frame=this.interpret(text,assets,revision);
  // An inferred visual preference is not a constraint spoken by the presenter.
  return this.planner.inferredFormIsPreference&&frame.inferred.family?Object.freeze({...frame,intent:Object.freeze({...frame.intent,family:null})}):frame;
 }
 async prepare(state:Preparation,signal:AbortSignal,requestId=randomUUID()){
  await this.selector?.prepare?.(signal);
  const snapshot=compilePresentation(state);signal.throwIfAborted();
  const generation=++this.generation;
  if(snapshot.key===this.key)return;
  const catalog=snapshot.catalog;
  // Each turn supplies its selection closure; initialization never constructs a provider call.
  const policy=new LibraryPolicy(this.embedding,async()=>{throw Error("Missing per-turn selector");},undefined,this.retrieval,this.trace);
  await policy.refresh(catalog.assets,catalog.bundles,signal,requestId);signal.throwIfAborted();
  if(generation!==this.generation)throw Error("Superseded presentation preparation");
  this.policy=policy;this.catalog=catalog;this.key=snapshot.key;this.snapshot=snapshot;
 }
 readonly decide:CompositionDecider=Object.assign(async(state:Preparation,current:Parameters<CompositionDecider>[1],speech:string,signal:AbortSignal)=>{
  const requestId=randomUUID(),turn=++this.turn;this.question=undefined;
  await this.prepare(state,signal,requestId);signal.throwIfAborted();
  const snapshot=this.snapshot!,catalog=this.catalog!,policy=this.policy!;
  state=snapshot.state;
  if(turn!==this.turn)throw Error("Superseded presentation decision");
  const frame=this.frame(speech,catalog.assets,policy.revision!);
  const evidence=evidenceGate({requireIndependentReview:process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW==="true",interpret:()=>frame.intent,feedback:e=>{this.question=e.kind==="clarification"?"Please clarify the intended content or evidence scope in Prepare.":`More evidence is needed for this explanation (${e.reason}).`;}});

  // Feedback belongs to the current call, not the closure of a previous initialization.
  const primary=current.blocks[0];
  const committed=[...catalog.references].find(([,r])=>r.beat===primary.beat&&r.kind===primary.kind)?.[0]??null;
  policy.synchronizeCurrent(committed);
  const selectionContext:SelectionContext={speech,assets:catalog.assets,intent:frame.intent,current:committed,requireIndependentReview:process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW==="true"};
  const strict={...evidence,before:(text:string,assets:Parameters<typeof evidence.before>[1],current:string|null)=>evidence.before(text,assets,current)??this.selector?.preselect?.(selectionContext)??null};
  const result=await policy.decide(speech,signal,true,requestId,strict,async(text,ranked,abort,correlation)=>{
   if(this.selector)return traceStage(this.trace,"local-selection",()=>this.selector!.select({...selectionContext,assets:ranked},abort),correlation??{});
   if(!this.decision)throw Error("No selection implementation");
   let attemptNumber=0;return groundLibrary(text,ranked,abort,async attempt=>{this.trace.write({stage:"model-attempt",phase:"complete",atMs:performance.now(),...correlation,elapsedMs:attempt.elapsedMs,details:{cost:Number.isFinite(attempt.cost)?attempt.cost:null,model:this.decision!.id,attempt:++attemptNumber}});},()=>{},this.decision);
  });signal.throwIfAborted();
  if(result.action==="context")this.question="The requested evidence is not available in this story. Add or clarify it in Prepare.";
  let composition=null;
  if(result.action==="show"&&result.selected){
   const context={state,catalog,selected:result.selected,frame,current,requireIndependentReview:process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW==="true"};
   const correlation={requestId,revision:result.revision};
   const proposed=await traceStage(this.trace,"composition-plan",()=>this.planner.plan(structuredClone(context),signal),correlation);signal.throwIfAborted();
   composition=await traceStage(this.trace,"composition-validation",async()=>validatePlannedComposition(proposed,context),correlation);signal.throwIfAborted();
  }
  if(turn!==this.turn||this.snapshot!==snapshot)throw Error("Superseded presentation decision");
  return {composition,question:this.question,metadata:{requestId,planner:this.planner.id,baseline:"evidence-v1",model:this.selector?.id??this.decision?.id,selection:this.selector?.id??"hosted-grounding",preference:this.selector?.stats?{...this.selector.stats}:undefined,path:result.path,action:result.action,operation:result.operation,revision:result.revision}};
 },{prepare:(state:Preparation,signal:AbortSignal)=>this.prepare(state,signal)});
}
