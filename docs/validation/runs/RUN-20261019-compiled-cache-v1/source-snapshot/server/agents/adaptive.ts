import {immutablePreparation} from "../presentation/prepared.js";
import { openingComposition, validateComposition, type AdaptiveComposition } from "../../shared/adaptive.js";
import type { Preparation } from "../../shared/preparation.js";
import type { Session } from "../session.js";
export type CompositionDecider=((state:Preparation,current:AdaptiveComposition,speech:string,signal:AbortSignal)=>Promise<{composition:AdaptiveComposition|null;question?:string;metadata?:Record<string,unknown>}>) & {prepare?:(state:Preparation,signal:AbortSignal)=>Promise<void>};
export class AdaptiveController {
 private state:Preparation|null=null;
 private current=openingComposition();
 private epoch=0; private running=false; private pending=""; private paused=false;
 private readiness:Promise<void>=Promise.resolve();
 private preparationAbort?:AbortController;
 private abort?:AbortController; private recent:string[]=[];
 constructor(private session:Session,private emit:(e:Record<string,unknown>)=>void,private feedback:(question:string)=>void,private decider:CompositionDecider){}
 start(state:Preparation){
  if(!state.flow || state.approvedRevision!==state.revision || state.flowBasedOnRevision===null) throw Error("Review the story before presenting");
  this.stop(); this.state=immutablePreparation(state); this.current=openingComposition(); this.session.pause(false); this.commit(this.current);
  const abort=new AbortController();this.preparationAbort=abort;
  this.readiness=this.decider.prepare?.(this.state,AbortSignal.any([abort.signal,AbortSignal.timeout(60000)]))??Promise.resolve();
  // The caller and accept() observe failures; prevent detached-start unhandled rejection.
  void this.readiness.catch(()=>{});return this.readiness;
 }
 stop(){this.preparationAbort?.abort();this.epoch++;this.abort?.abort();this.state=null;this.pending="";this.running=false;this.paused=false;this.recent=[];}
 pause(value:boolean){this.epoch++;this.abort?.abort();this.running=false;this.pending="";this.paused=value;this.session.pause(value);}
 private commit(composition:AdaptiveComposition){
  this.current=composition;
  const first=this.state!.flow!.beats[composition.blocks[0].beat];
  this.session.propose(first.title,"agent",0,{title:first.title,body:first.audienceText??"",beat:composition.blocks[0].beat,flowRevision:this.state!.revision,adaptive:composition});
 }
 async accept(text:string){
  if(!this.state||this.paused||!text.trim())return;
  this.pending=(this.pending+"\n"+text).slice(-6000); if(this.running)return;
  this.running=true;const epoch=this.epoch;
  try{while(this.pending && epoch===this.epoch){
   const speech=this.pending;this.pending=""; const state=this.state!;
   const abort=new AbortController();this.abort=abort;const timer=setTimeout(()=>abort.abort(),30000);const started=performance.now();
   let decision:{composition:AdaptiveComposition|null;question?:string;metadata?:Record<string,unknown>}|undefined;
   this.emit({type:"presentation_status",status:"composing"});
   try{
    await this.readiness;abort.signal.throwIfAborted();if(epoch!==this.epoch)return;
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
