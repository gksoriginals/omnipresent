import {useRef,useState} from "react";
import type {SavedStory} from "../../../shared/workspace";
import type {Stage} from "../../../server/session";
import {AudioQueue,captureMicrophone,type Capture} from "../services/audio-capture";
import type {SessionClient,SessionEvent} from "../services/session-client";
export function usePresentation(socket:React.RefObject<SessionClient|null>,setError:(message:string)=>void){
 const [stage,setStage]=useState<Stage|null>(null),[active,setActive]=useState(false),[starting,setStarting]=useState(false),[paused,setPaused]=useState(false);
 const presentationReady=useRef<{resolve():void;reject(error:Error):void}|null>(null);
 const capture=useRef<Capture|null>(null),speech=useRef("unloaded"),epoch=useRef(0),ready=useRef<{resolve():void;reject(error:Error):void}|null>(null);
 const send=(event:Record<string,unknown>)=>socket.current?.send(event);
 const queue=useRef<AudioQueue|null>(null);
 if(!queue.current)queue.current=new AudioQueue(()=>socket.current,()=>{setError("Audio fell behind. Restart the presentation to continue.");endPresentation();});
 function stopCapture(){epoch.current++;presentationReady.current?.reject(Error("Presentation stopped"));presentationReady.current=null;ready.current?.reject(Error("Presentation stopped"));ready.current=null;capture.current?.stop();capture.current=null;queue.current!.clear();}
 function endPresentation(){stopCapture();speech.current="unloaded";send({type:"speech_stop"});send({type:"speech_unload"});send({type:"presentation_stop"});setActive(false);setStarting(false);setPaused(false);setStage(null);}
 function disconnected(){stopCapture();speech.current="unloaded";setActive(false);setStarting(false);setPaused(false);setStage(null);}
 function event(event:SessionEvent){
  if(event.type==="presentation_ready")presentationReady.current?.resolve();
  if(event.type==="error"||event.type==="agent_error"||event.type==="worker_error")presentationReady.current?.reject(Error(event.message));
  if(event.type==="stage")setStage(event.stage);
  if(event.type==="snapshot"){setStage(event.stage);setPaused(event.paused);}
  if(event.type==="worker_status"){speech.current=event.status;if(event.status==="ready")ready.current?.resolve();if(event.status==="listening"){setActive(true);setStarting(false);}}
  if(event.type==="audio_ack")queue.current!.acknowledge();
 }
 async function startPresentation(story:SavedStory|undefined,connected:boolean){
  if(!story||!connected)return;setError("");setStarting(true);setStage(null);const generation=++epoch.current;
  try{
   const startedCapture=await captureMicrophone(chunk=>{if(speech.current==="listening")queue.current!.push(chunk);},()=>generation===epoch.current);
   if(generation!==epoch.current){startedCapture?.stop();return;}
   capture.current=startedCapture;
   if(speech.current!=="ready")await new Promise<void>((resolve,reject)=>{
    const timeout=setTimeout(()=>ready.current?.reject(Error("Speech could not start. Retry the presentation.")),60000);
    ready.current={resolve(){clearTimeout(timeout);ready.current=null;resolve();},reject(error){clearTimeout(timeout);ready.current=null;reject(error);}};send({type:"speech_load"});
   });
   if(generation!==epoch.current)return;
   send({type:"presentation_load",engine:"adaptive",state:story.state,projectId:story.projectId,storyId:story.id});await new Promise<void>((resolve,reject)=>{
    const timeout=setTimeout(()=>presentationReady.current?.reject(Error("Presentation index could not become ready.")),60000);
    presentationReady.current={resolve(){clearTimeout(timeout);presentationReady.current=null;resolve();},reject(error){clearTimeout(timeout);presentationReady.current=null;reject(error);}};
    send({type:"presentation_start"});
   });
   if(generation!==epoch.current)return;
   send({type:"speech_start"});
  }catch(error){if(generation===epoch.current){endPresentation();setError(error instanceof Error?error.message:"Microphone unavailable");}}
 }
 return {stage,active,starting,paused,endPresentation,startPresentation,stopCapture,disconnected,event};
}
