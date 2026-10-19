import {unresolvedGate,type UtteranceGate,type SignalAssessment} from "./signals.js";
/** Speech boundaries are hints; only the evidence host may authorize a canvas change. */
export type TranscriptEvent={type:"transcript"|"speech_activity";segmentId:string;streamId?:string;text?:string;final?:boolean;startMs?:number;endMs?:number};
export type TranscriptPolicy={quietMs:number;prefixWaitMs:number;joinGapMs:number;carryMs:number;maxWindowMs:number;maxChars:number;maxSegments:number};
export const transcriptPolicy:Readonly<TranscriptPolicy>=Object.freeze({quietMs:350,prefixWaitMs:1500,joinGapMs:1250,carryMs:6000,maxWindowMs:15000,maxChars:6000,maxSegments:8});
export type TranscriptBatch={action:"process"|"skip"|"hold";reason:string;text:string;segmentIds:string[];waitMs:number;gate?:SignalAssessment};
type Segment={id:string;text:string;final:boolean;startMs?:number;endMs?:number};
/** Pure bounded assembler. Its owner supplies monotonic time and controls lifecycle. */
export class TranscriptRouter {
 private segments:Segment[]=[];
 private seen=new Map<string,string>();
 private stream?:string;
 private retired:string[]=[];
 private openedAt=0;private updatedAt=0;
 private carry?:{segments:Segment[];at:number};
 private blocked=false;private reported=false;
 constructor(private gate:UtteranceGate=unresolvedGate,readonly policy:Readonly<TranscriptPolicy>=transcriptPolicy){}
 reset(){this.segments=[];this.seen.clear();this.stream=undefined;this.retired=[];this.carry=undefined;this.blocked=false;this.reported=false;}
 private clearWindow(){this.segments=[];this.openedAt=0;}
 private gap(first:Segment,second:Segment){return first.endMs!==undefined&&second.startMs!==undefined?second.startMs-first.endMs:undefined;}
 push(event:TranscriptEvent,now:number):boolean {
  if(!event.segmentId||event.segmentId.length>160)return false;
  if(event.streamId!==undefined){
   if(this.retired.includes(event.streamId))return false;
   if(this.stream!==undefined&&event.streamId!==this.stream){const previous=this.stream;const retired=this.retired;this.reset();this.retired=[...retired,previous].slice(-8);}
   this.stream=event.streamId;
  }
  const text=event.text?.trim()??"",final=event.type==="transcript"&&event.final===true;
  const key=`${this.stream??"legacy"}:${event.segmentId}`;
  if(this.seen.has(key)){
   if(!final||this.seen.get(key)===text)return false;
   // An amended final is not a new request; invalidate and require a clean boundary.
   this.blocked=true;return true;
  }
  if(this.blocked)return false;
  if(text.length>this.policy.maxChars){this.blocked=true;return true;}
  let segment=this.segments.find(s=>s.id===event.segmentId);
  if(segment&&segment.text===text&&segment.final===final&&event.type!=="speech_activity")return false;
  if(!segment){
   const next:Segment={id:event.segmentId,text,final,startMs:event.startMs,endMs:event.endMs};
   if(!this.segments.length){
    const previous=this.carry;
    if(previous&&now-previous.at<=this.policy.carryMs){
     const gap=this.gap(previous.segments.at(-1)!,next);
     if(gap!==undefined&&gap<=this.policy.joinGapMs)this.segments=previous.segments.map(s=>({...s}));
    }
    this.carry=undefined;this.openedAt=now;
   }
   segment=next;this.segments.push(segment);
  }else{
   segment.text=text;segment.final=final;segment.startMs=event.startMs??segment.startMs;segment.endMs=event.endMs??segment.endMs;
  }
  this.updatedAt=now;
  if(final){this.seen.set(key,text);if(this.seen.size>64)this.seen.delete(this.seen.keys().next().value!);}
  if(this.segments.length>this.policy.maxSegments||this.segments.reduce((n,s)=>n+s.text.length+1,0)>this.policy.maxChars){this.blocked=true;}
  return true;
 }
 flush(now:number):TranscriptBatch|null {
  const text=this.segments.map(s=>s.text).filter(Boolean).join(" "),ids=this.segments.map(s=>s.id);
  if(this.segments.length&&now-this.openedAt>=this.policy.maxWindowMs)this.blocked=true;
  if(this.blocked){
   if(this.reported)return null;this.reported=true;
   return {action:"hold",reason:"unsafe-or-oversized-window",text:"",segmentIds:[],waitMs:now-this.openedAt};
  }
  if(!this.segments.length||this.segments.some(s=>!s.final))return null;
  // ASR intervals may overlap; union adjacent intervals, split only confirmed silence gaps.
  const ordered=[...this.segments].sort((a,b)=>(a.startMs??0)-(b.startMs??0));
  let boundary=ordered.length,coveredEnd=ordered[0].endMs;
  for(let i=1;i<ordered.length;i++){
   const next=ordered[i];
   if(coveredEnd!==undefined&&next.startMs!==undefined&&next.startMs-coveredEnd>this.policy.joinGapMs){boundary=i;break;}
   if(next.endMs!==undefined)coveredEnd=Math.max(coveredEnd??next.endMs,next.endMs);
  }
  const group=ordered.slice(0,boundary),remainder=ordered.slice(boundary);
  const completeText=group.map(s=>s.text).filter(Boolean).join(" ");
  const gate=this.gate.assess(completeText),prefix=gate.state==="continuation",delay=prefix?this.policy.prefixWaitMs:this.policy.quietMs;
  if(now-this.updatedAt<delay)return null;
  const batch:TranscriptBatch={action:completeText?"process":"skip",reason:completeText?"completed-window":"empty",text:completeText,segmentIds:group.map(s=>s.id),waitMs:now-this.updatedAt,gate};
  // Retain only unresolved prepared prefixes, never a rolling bag of old claims.
  this.carry=prefix&&!remainder.length?{segments:group.map(s=>({...s})),at:now}:undefined;
  this.clearWindow();this.segments=remainder;if(remainder.length)this.openedAt=now;return batch;
 }
}
