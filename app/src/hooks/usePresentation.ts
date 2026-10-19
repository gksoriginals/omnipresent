import {useRef,useState} from "react";
import type {SavedStory} from "../../../shared/workspace";
import type {Stage} from "../../../server/session";
import {AudioQueue,captureMicrophone,type Capture} from "../services/audio-capture";
import type {SessionClient,SessionEvent} from "../services/session-client";

export function usePresentation(socket:React.RefObject<SessionClient|null>,setError:(message:string)=>void){
 const [stage,setStage]=useState<Stage|null>(null);
 const [active,setActive]=useState(false);
 const [starting,setStarting]=useState(false);
 const [paused,setPaused]=useState(false);
 const [lastTranscript,setLastTranscript]=useState("");
 const [sessionId,setSessionId]=useState("");
 const loaded=useRef<{resolve(resumed:boolean):void;reject(error:Error):void}|null>(null);
 const presentationReady=useRef<{requestId:string;resolve():void;reject(error:Error):void}|null>(null);
 const capture=useRef<Capture|null>(null),speech=useRef("unloaded"),epoch=useRef(0),ready=useRef<{resolve():void;reject(error:Error):void}|null>(null);
 const send=(event:Record<string,unknown>)=>socket.current?.send(event);
 const queue=useRef<AudioQueue|null>(null);
 if(!queue.current)queue.current=new AudioQueue(()=>socket.current,()=>{setError("Audio fell behind. Restart the presentation to continue.");endPresentation();});

 function stopCapture(){
  epoch.current++;
  loaded.current?.reject(Error("Presentation stopped"));loaded.current=null;
  presentationReady.current?.reject(Error("Presentation stopped"));
  presentationReady.current=null;
  ready.current?.reject(Error("Presentation stopped"));
  ready.current=null;
  capture.current?.stop();
  capture.current=null;
  queue.current!.clear();
 }

 function endPresentation(){
  stopCapture();
  speech.current="unloaded";
  send({type:"speech_stop"});
  send({type:"speech_unload"});
  send({type:"presentation_stop"});
  try { sessionStorage.removeItem("omnipresent_active_session"); } catch {}
  setActive(false);
  setStarting(false);
  setPaused(false);
  setStage(null);
  setLastTranscript("");
  setSessionId("");
 }

 function disconnected(){
  stopCapture();
  speech.current="unloaded";
  setActive(false);
  setStarting(false);
  setPaused(false);
  setStage(null);
 }

 function cueBeat(index:number){
  send({type:"presentation_cue",beatIndex:index});
 }

 function event(event:SessionEvent){
  if(event.type==="presentation_ready"&&event.requestId===presentationReady.current?.requestId)presentationReady.current?.resolve();
  if(event.type==="error"||event.type==="agent_error"||event.type==="worker_error"){presentationReady.current?.reject(Error(event.message));ready.current?.reject(Error(event.message));loaded.current?.reject(Error(event.message));}
  if(event.type==="presentation_loaded"){
   if(event.sessionId)setSessionId(event.sessionId);
   loaded.current?.resolve(event.resumed===true);
  }
  if(event.type==="stage")setStage(event.stage);
  if(event.type==="snapshot"){setStage(event.stage);setPaused(event.paused);}
  if(event.type==="worker_status"){
   speech.current=event.status;
   if(event.status==="ready"||event.status==="listening")ready.current?.resolve();

  }
  if((event.type==="transcript"||event.type==="presentation_utterance")&&event.text){
   setLastTranscript(event.text);
  }
  if(event.type==="audio_ack")queue.current!.acknowledge();
 }

 async function resumePresentation(story:SavedStory|undefined,sid:string){
  if(story)await beginPresentation(story,sid);
 }
 async function startPresentation(story:SavedStory|undefined,connected:boolean){
  if(story&&connected)await beginPresentation(story,`${story.projectId}:${story.id}`);
 }
 async function beginPresentation(story:SavedStory,sid:string){
  stopCapture();
  setError("");setStarting(true);setSessionId(sid);
  const generation=epoch.current;
  try{
   const resumed=await new Promise<boolean>((resolve,reject)=>{
    const timeout=setTimeout(()=>loaded.current?.reject(Error("Presentation could not load.")),15000);
    loaded.current={resolve(value){clearTimeout(timeout);loaded.current=null;resolve(value);},reject(error){clearTimeout(timeout);loaded.current=null;reject(error);}};
    send({type:"presentation_load",engine:"adaptive",state:story.state,projectId:story.projectId,storyId:story.id,sessionId:sid});
   });
   if(generation!==epoch.current)return;
   if(!resumed){
    setStage(null);setLastTranscript("");setPaused(false);
    await new Promise<void>((resolve,reject)=>{
     const timeout=setTimeout(()=>presentationReady.current?.reject(Error("Presentation index could not become ready.")),60000);
     presentationReady.current={requestId:`presentation-${generation}`,resolve(){clearTimeout(timeout);presentationReady.current=null;resolve();},reject(error){clearTimeout(timeout);presentationReady.current=null;reject(error);}};
     send({type:"presentation_start",requestId:`presentation-${generation}`});
    });
   }
   if(generation!==epoch.current)return;
   if(!["ready","listening"].includes(speech.current))await new Promise<void>((resolve,reject)=>{
    const timeout=setTimeout(()=>ready.current?.reject(Error("Speech could not start. Retry the presentation.")),60000);
    ready.current={resolve(){clearTimeout(timeout);ready.current=null;resolve();},reject(error){clearTimeout(timeout);ready.current=null;reject(error);}};
    send({type:"speech_load"});
   });
   if(generation!==epoch.current)return;
   const startedCapture=await captureMicrophone(chunk=>{if(speech.current==="listening")queue.current!.push(chunk);},()=>generation===epoch.current);
   if(generation!==epoch.current){startedCapture?.stop();return;}
   capture.current=startedCapture;
   if(speech.current!=="listening")send({type:"speech_start"});
   try{sessionStorage.setItem("omnipresent_active_session",JSON.stringify({projectId:story.projectId,storyId:story.id,sessionId:sid}));}catch{}
   setActive(true);setStarting(false);
  }catch(error){
   if(generation===epoch.current){endPresentation();setError(error instanceof Error?error.message:"Microphone unavailable");}
  }
 }

 return {stage,active,starting,paused,lastTranscript,sessionId,endPresentation,startPresentation,resumePresentation,cueBeat,stopCapture,disconnected,event};
}
