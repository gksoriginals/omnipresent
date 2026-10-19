import type {UtteranceGate} from "../speech/signals.js";
import {preparedSignalIndex} from "../speech/signals.js";
import {TranscriptRouter,type TranscriptEvent} from "../speech/transcripts.js";
import {presentationCatalog} from "../presentation/catalog.js";
import {supportsEvidence,type EvidenceIntent} from "../controllers/evidence-contract.js";
import {immutablePreparation} from "../presentation/prepared.js";
import { openingComposition, validateComposition, type AdaptiveComposition } from "../../shared/adaptive.js";
import type { Preparation } from "../../shared/preparation.js";
import type { Session } from "../session.js";
export type CompositionDecider=((state:Preparation,current:AdaptiveComposition,speech:string,signal:AbortSignal)=>Promise<{composition:AdaptiveComposition|null;question?:string;metadata?:Record<string,unknown>}>) & {prepare?:(state:Preparation,signal:AbortSignal)=>Promise<void>};
export class AdaptiveController {
 private state:Preparation|null=null;
 private current=openingComposition();
 private epoch=0; private running=false; private pending=""; private paused=false;
 private transcripts=new TranscriptRouter();
 private transcriptTimer?:ReturnType<typeof setInterval>;
 private readiness:Promise<void>=Promise.resolve();
 private preparationAbort?:AbortController;
 private abort?:AbortController; private recent:string[]=[];
 constructor(private session:Session,private emit:(e:Record<string,unknown>)=>void,private feedback:(question:string)=>void,private decider:CompositionDecider,private speechGate?:UtteranceGate){}
 start(state:Preparation){
  if(!state.flow || state.approvedRevision!==state.revision || state.flowBasedOnRevision===null) throw Error("Review the story before presenting");
  this.stop(); this.state=immutablePreparation(state); this.current=openingComposition(); this.session.pause(false); this.commit(this.current);
  const signals=preparedSignalIndex(this.state);
  this.transcripts=new TranscriptRouter(this.speechGate??{assess:text=>signals.assess(text,this.current.blocks.map(b=>b.beat))});
  this.transcriptTimer=setInterval(()=>this.flushTranscripts(),50);this.transcriptTimer.unref();
  const abort=new AbortController();this.preparationAbort=abort;
  this.readiness=this.decider.prepare?.(this.state,AbortSignal.any([abort.signal,AbortSignal.timeout(60000)]))??Promise.resolve();
  // The caller and accept() observe failures; prevent detached-start unhandled rejection.
  void this.readiness.catch(()=>{});return this.readiness;
 }
 stop(){clearInterval(this.transcriptTimer);this.transcripts.reset();this.preparationAbort?.abort();this.epoch++;this.abort?.abort();this.state=null;this.pending="";this.running=false;this.paused=false;this.recent=[];}
 pause(value:boolean){this.transcripts.reset();this.epoch++;this.abort?.abort();this.running=false;this.pending="";this.paused=value;this.session.pause(value);}
 private commit(composition:AdaptiveComposition){
  this.current=composition;
  const first=this.state!.flow!.beats[composition.blocks[0].beat];
  this.session.propose(first.title,"agent",0,{title:first.title,body:first.audienceText??"",beat:composition.blocks[0].beat,flowRevision:this.state!.revision,adaptive:composition});
 }
 cue(beatIndex:number){
  if(!this.state||!this.state.flow||this.paused)return;
  const beat=this.state.flow.beats[beatIndex];
  if(!beat)return;
  // Manual navigation cancels older automatic proposals and obeys the same host gate.
  this.transcripts.reset();this.epoch++;this.abort?.abort();this.running=false;this.pending="";
  const catalog=presentationCatalog(this.state);
  const evidence=beat.evidence!;
  const intent:EvidenceIntent={mode:"present",reason:"manual-cue",claims:evidence.claims.map(c=>c.id),entities:[evidence.entity],years:evidence.timeframe?[evidence.timeframe]:[],family:null,provenance:null,audited:false,unit:null,unknown:[]};
  const kind=(["visual","image","statement"] as const).find(kind=>catalog.assets.some(asset=>{
   const ref=catalog.references.get(asset.id)!;
   return ref.beat===beatIndex&&ref.kind===kind&&supportsEvidence(asset,intent,process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW==="true");
  }));
  if(!kind){
   this.feedback("More evidence is needed for this story beat before it can be shown.");
   this.emit({type:"direction_completed",engine:"adaptive",inferenceMs:0,changed:false,held:true,composition:this.current,decision:{cue:beatIndex,manual:true}});
   return;
  }
  const comp:AdaptiveComposition={
   layout:"focus",
   blocks:[{id:"primary",kind,beat:beatIndex,emphasis:"normal",reveal:null}],
  };
  const validated=validateComposition(comp,this.state);
  const changed=JSON.stringify(validated)!==JSON.stringify(this.current);
  if(changed){
   this.commit(validated);
   this.emit({type:"presentation_trace",stage:"commit",phase:"complete",atMs:performance.now(),requestId:`cue-${beatIndex}`,revision:String(this.state.revision),details:{changed:true,manual:true}});
  }
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
  this.emit({type:"presentation_trace",stage:"speech-routing",phase:"complete",atMs:performance.now(),details:{action:batch.action,reason:batch.reason,segments:batch.segmentIds.length,waitMs:batch.waitMs,gate:batch.gate?.state??"none",signals:batch.gate?.signalIds.length??0,currentCandidate:batch.gate?.currentCandidate??false}});
  if(batch.action==="hold"){this.feedback("Speech context could not be safely assembled. Pause and resume the presentation, then repeat the complete explanation.");return;}
  if(batch.action==="process"){
   this.emit({type:"presentation_utterance",text:batch.text});
   void this.accept(batch.text);
  }
 }
 async accept(text:string){
  if(!this.state||this.paused||!text.trim())return;
  if(this.pending.length+text.length+1>6000){this.invalidateDecision();this.feedback("The explanation exceeded the processing window. Please repeat a shorter complete request.");return;}
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
    if(decision.composition)decision.composition=validateComposition(decision.composition,state);
    if(epoch!==this.epoch)return;
    if(!decision)throw Error("No valid composition returned; holding canvas");
    const next=decision.composition;const changed=!!next && JSON.stringify(next)!==JSON.stringify(this.current);
    if(changed){this.commit(next!);this.emit({type:"presentation_trace",stage:"commit",phase:"complete",atMs:performance.now(),requestId:decision.metadata?.requestId??String(epoch),revision:decision.metadata?.revision??String(state.revision),details:{changed:true}});}
    if(decision.question)this.feedback(decision.question);
    this.recent=[...this.recent,speech].slice(-3);
    this.emit({type:"direction_completed",engine:"adaptive",inferenceMs:performance.now()-started,changed,held:next===null,composition:this.current,decision:decision.metadata});
   }finally{clearTimeout(timer);if(epoch===this.epoch)this.emit({type:"presentation_status",status:"ready"});}
  }}catch(error){if(epoch===this.epoch){this.pending="";this.emit({type:"agent_error",message:error instanceof Error?error.message:"Composition failed; holding canvas"});}}
  finally{if(epoch===this.epoch)this.running=false;}
 }
}
