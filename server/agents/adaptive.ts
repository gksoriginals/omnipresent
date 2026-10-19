import {TranscriptAssembler,type TranscriptEvent} from "../speech/transcripts.js";
import {authorizeComposition,beatRequestFrame} from "../presentation/authorization.js";
import {immutablePreparation} from "../presentation/prepared.js";
import { openingComposition, type AdaptiveComposition } from "../../shared/adaptive.js";
import type { Preparation } from "../../shared/preparation.js";
import type { Session } from "../session.js";
export type CompositionDecider=((state:Preparation,current:AdaptiveComposition,speech:string,signal:AbortSignal)=>Promise<{composition:AdaptiveComposition|null;question?:string;metadata?:Record<string,unknown>}>) & {prepare?:(state:Preparation,signal:AbortSignal)=>Promise<void>};
export class AdaptiveController {
 private state:Preparation|null=null;
 private current=openingComposition();
 private committed=false;
 private epoch=0; private running=false; private pending=""; private paused=false;
 private transcripts=new TranscriptAssembler();
 private transcriptTimer?:ReturnType<typeof setInterval>;
 private readiness:Promise<void>=Promise.resolve();
 private preparationAbort?:AbortController;
 private abort?:AbortController;
 constructor(private session:Session,private emit:(e:Record<string,unknown>)=>void,private feedback:(question:string)=>void,private decider:CompositionDecider){}
 start(state:Preparation){
  if(!state.flow || state.approvedRevision!==state.revision || state.flowBasedOnRevision===null) throw Error("Review the story before presenting");
  this.stop(); this.state=immutablePreparation(state); this.current=openingComposition(); this.committed=false; this.session.pause(false);
  try{this.commit(this.current,beatRequestFrame(this.state,0));}
  catch{this.session.propose("Ready to present","agent");this.feedback("More evidence is needed for the opening before it can be shown.");}
  this.transcripts=new TranscriptAssembler();
  this.transcriptTimer=setInterval(()=>this.flushTranscripts(),50);this.transcriptTimer.unref();
  const abort=new AbortController();this.preparationAbort=abort;
  this.readiness=this.decider.prepare?.(this.state,AbortSignal.any([abort.signal,AbortSignal.timeout(60000)]))??Promise.resolve();
  // The caller and accept() observe failures; prevent detached-start unhandled rejection.
  void this.readiness.catch(()=>{});return this.readiness;
 }
 stop(){clearInterval(this.transcriptTimer);this.transcripts.reset();this.preparationAbort?.abort();this.epoch++;this.abort?.abort();this.state=null;this.pending="";this.running=false;this.paused=false;}
 pause(value:boolean){this.resetTranscripts();this.paused=value;this.session.pause(value);}
 private commit(proposal:AdaptiveComposition,request:Parameters<typeof authorizeComposition>[3]){
  const composition=authorizeComposition(this.state!,proposal,this.current,request);
  if(this.committed&&JSON.stringify(composition)===JSON.stringify(this.current))return false;
  this.current=composition;this.committed=true;
  const first=this.state!.flow!.beats[composition.blocks[0].beat];
  this.session.propose(first.title,"agent",0,{title:first.title,body:first.audienceText??"",beat:composition.blocks[0].beat,flowRevision:this.state!.revision,adaptive:composition});
  return true;
 }
 cue(beatIndex:number){
  if(!this.state||!this.state.flow||this.paused)return;
  const beat=this.state.flow.beats[beatIndex];
  if(!beat)return;
  // Manual navigation cancels older automatic proposals and obeys the same host gate.
  this.resetTranscripts();
  const frame=beatRequestFrame(this.state,beatIndex);
  let changed=false,authorized=false;
  for(const kind of ["visual","image","statement"] as const){
   try{
    changed=this.commit({layout:"focus",blocks:[{id:"primary",kind,beat:beatIndex,emphasis:"normal",reveal:null}]},frame);
    authorized=true;break;
   }catch{ /* Try the next prepared representation; all must pass the same authority. */ }
  }
  if(!authorized){
   this.feedback("More evidence is needed for this story beat before it can be shown.");
   this.emit({type:"direction_completed",engine:"adaptive",inferenceMs:0,changed:false,held:true,composition:this.current,decision:{cue:beatIndex,manual:true}});
   return;
  }
  if(changed)this.emit({type:"presentation_trace",stage:"commit",phase:"complete",atMs:performance.now(),requestId:`cue-${beatIndex}`,revision:String(this.state.revision),details:{changed:true,manual:true}});
  this.emit({type:"direction_completed",engine:"adaptive",inferenceMs:0,changed,held:false,composition:this.current,decision:{cue:beatIndex,manual:true}});
 }
 resetTranscripts(){this.transcripts.reset();this.invalidateDecision();}
 private invalidateDecision(){this.epoch++;this.abort?.abort();this.running=false;this.pending="";}
 acceptTranscript(event:TranscriptEvent){
  if(!this.state||this.paused)return;
  if(this.transcripts.push(event,performance.now()))this.invalidateDecision();
  this.flushTranscripts();
 }
 private flushTranscripts(){
  if(!this.state||this.paused)return;
  const batch=this.transcripts.flush(performance.now());if(!batch)return;
  this.emit({type:"presentation_trace",stage:"speech-routing",phase:"complete",atMs:performance.now(),details:{action:batch.action,reason:batch.reason,segments:batch.segmentIds.length,waitMs:batch.waitMs}});
  if(batch.action==="hold"){this.feedback("Speech context could not be safely assembled. Pause and resume the presentation, then repeat the complete explanation.");return;}
  if(batch.action==="process"){
   this.emit({type:"presentation_utterance",text:batch.text});
   void this.accept(batch.text);
  }
 }
 async accept(text:string){
  if(!this.state||this.paused||!text.trim())return;
  if(this.pending.length+text.length+(this.pending?1:0)>6000){this.invalidateDecision();this.feedback("The explanation exceeded the processing window. Please repeat a shorter complete request.");return;}
  this.pending=this.pending?this.pending+"\n"+text:text; if(this.running)return;
  this.running=true;const epoch=this.epoch;
  try{while(this.pending && epoch===this.epoch){
   const speech=this.pending;this.pending=""; const state=this.state!;
   const abort=new AbortController();this.abort=abort;const timer=setTimeout(()=>abort.abort(),30000);const started=performance.now();
   let decision:{composition:AdaptiveComposition|null;question?:string;metadata?:Record<string,unknown>}|undefined;
   this.emit({type:"presentation_status",status:"composing"});
   try{
    if(this.decider.prepare)await this.readiness;abort.signal.throwIfAborted();if(epoch!==this.epoch)return;
    decision=await this.decider(state,this.current,speech,abort.signal);
    if(epoch!==this.epoch)return;
    abort.signal.throwIfAborted();
    if(!decision)throw Error("No valid composition returned; holding canvas");
    const next=decision.composition;const changed=next!==null&&this.commit(next,speech);
    if(changed){this.emit({type:"presentation_trace",stage:"commit",phase:"complete",atMs:performance.now(),requestId:decision.metadata?.requestId??String(epoch),revision:decision.metadata?.revision??String(state.revision),details:{changed:true}});}
    if(decision.question)this.feedback(decision.question);
    this.emit({type:"direction_completed",engine:"adaptive",inferenceMs:performance.now()-started,changed,held:next===null,composition:this.current,decision:decision.metadata});
   }finally{clearTimeout(timer);if(epoch===this.epoch)this.emit({type:"presentation_status",status:"ready"});}
  }}catch(error){if(epoch===this.epoch){this.pending="";this.feedback("The proposed view could not be safely authorized. Review the request and supporting evidence in Prepare.");this.emit({type:"agent_error",message:error instanceof Error?error.message:"Composition failed; holding canvas"});}}
  finally{if(epoch===this.epoch)this.running=false;}
 }
}
