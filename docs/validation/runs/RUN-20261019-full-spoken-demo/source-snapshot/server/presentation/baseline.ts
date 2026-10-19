import {randomUUID} from "node:crypto";
import {traceStage,nullTrace,type TraceSink} from "../experiments/trace.js";
import type {Preparation} from "../../shared/preparation.js";
import type {CompositionDecider} from "../agents/adaptive.js";
import {LibraryPolicy,type DecisionGate} from "../controllers/library-policy.js";
import {evidenceGate} from "../controllers/evidence-contract.js";
import {groundLibrary} from "../controllers/library-grounding.js";
import type {DecisionModel} from "../models/decisions.js";
import type {Embedder} from "../controllers/semantic-retrieval.js";
import {storyRequestFrame,type RequestFrame,type RequestInterpreter} from "./request-frame.js";
import {hybridRetrieval,type RetrievalFactory} from "../controllers/retrieval.js";
import {FocusPlanner,validatePlannedComposition,type CompositionPlanner} from "./composition.js";
import {presentationCatalog} from "./catalog.js";
export class BaselinePresenter {
 private question:string|undefined;
 private key="";private policy:LibraryPolicy|null=null;private catalog:ReturnType<typeof presentationCatalog>|null=null;
 constructor(private embedding:Embedder,private decision:DecisionModel,private retrieval:RetrievalFactory=hybridRetrieval,private interpret:RequestInterpreter=storyRequestFrame,private trace:TraceSink=nullTrace,private planner:CompositionPlanner=new FocusPlanner()){}
 private frame(text:string,assets:Parameters<RequestInterpreter>[1],revision:string):RequestFrame{
  const frame=this.interpret(text,assets,revision);
  // An inferred visual preference is not a constraint spoken by the presenter.
  return this.planner.inferredFormIsPreference&&frame.inferred.family?{...frame,intent:{...frame.intent,family:null}}:frame;
 }
 readonly decide:CompositionDecider=async(state,current,speech,signal)=>{
  const requestId=randomUUID();
  const key=JSON.stringify({revision:state.revision,flow:state.flow,visuals:state.visuals,artifacts:state.artifacts});
  this.question=undefined;
  if(key!==this.key){
   const catalog=presentationCatalog(state);
   const strict=evidenceGate({requireIndependentReview:process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW==="true",interpret:(text,assets)=>this.frame(text,assets,key).intent,feedback:e=>{this.question=e.kind==="clarification"?"Please clarify the intended content or evidence scope in Prepare.":`More evidence is needed for this explanation (${e.reason}).`;}});
   const gate:DecisionGate=strict;
   const policy=new LibraryPolicy(this.embedding,async(text,ranked,abort,context)=>{let attemptNumber=0;return groundLibrary(text,ranked,abort,async attempt=>{this.trace.write({stage:"model-attempt",phase:"complete",atMs:performance.now(),...context,elapsedMs:attempt.elapsedMs,details:{cost:Number.isFinite(attempt.cost)?attempt.cost:null,model:this.decision.id,attempt:++attemptNumber}});},()=>{},this.decision);},gate,this.retrieval,this.trace);
   await policy.refresh(catalog.assets,catalog.bundles,signal,requestId);signal.throwIfAborted();this.policy=policy;this.catalog=catalog;this.key=key;
  }
  // Feedback belongs to the current call, not the closure of a previous initialization.
  const primary=current.blocks[0];
  const committed=[...this.catalog!.references].find(([,r])=>r.beat===primary.beat&&r.kind===primary.kind)?.[0]??null;
  this.policy!.synchronizeCurrent(committed);
  const result=await this.policy!.decide(speech,signal,true,requestId);signal.throwIfAborted();
  if(result.action==="context")this.question="The requested evidence is not available in this story. Add or clarify it in Prepare.";
  let composition=null;
  if(result.action==="show"&&result.selected){
   const context={state,catalog:this.catalog!,selected:result.selected,frame:this.frame(speech,this.catalog!.assets,result.revision),current,requireIndependentReview:process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW==="true"};
   const correlation={requestId,revision:result.revision};
   const proposed=await traceStage(this.trace,"composition-plan",()=>this.planner.plan(structuredClone(context),signal),correlation);signal.throwIfAborted();
   composition=await traceStage(this.trace,"composition-validation",async()=>validatePlannedComposition(proposed,context),correlation);signal.throwIfAborted();
  }
  return {composition,question:this.question,metadata:{requestId,planner:this.planner.id,baseline:"evidence-v1",model:this.decision.id,path:result.path,action:result.action,operation:result.operation,revision:result.revision}};
 };
}
