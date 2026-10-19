import { useEffect,useRef,useState } from "react";
import { TrialPreparation } from "./TrialPreparation";
import { AdaptiveCanvas } from "./AdaptiveCanvas";
import type { Preparation } from "../../shared/preparation";
import type { Stage } from "../../server/session";
type Manifest={createdAt:string;state:Preparation;variants:{id:string;title:string;audio:string;paragraphs:string[]}[]};
export default function ReplayTrial(){
 const inspector=useRef<HTMLDialogElement>(null);
 const [preparing,setPreparing]=useState(false);
 const [pack,setPack]=useState<Manifest>(); const [variant,setVariant]=useState(0);const [engine,setEngine]=useState<"openui"|"json-render">("openui");
 const [decision,setDecision]=useState("baseline");
 const [stage,setStage]=useState<Stage>();const [status,setStatus]=useState("Ready");const [running,setRunning]=useState(false);const [transcript,setTranscript]=useState("");
 const [events,setEvents]=useState<Record<string,unknown>[]>([]);const [error,setError]=useState("");
 const connection=useRef<WebSocket|null>(null),audio=useRef<AudioContext|null>(null),epoch=useRef(0);
 useEffect(()=>{fetch("/api/trial/manifest.json").then(r=>{if(!r.ok)throw Error("Generate the trial materials first: npm run trial:prepare");return r.json();}).then(setPack).catch(e=>setError(e.message));return()=>{epoch.current++;connection.current?.close();if(audio.current?.state!=="closed")void audio.current?.close();};},[]);
 function stop(){epoch.current++;connection.current?.close();connection.current=null;if(audio.current?.state!=="closed")void audio.current?.close();audio.current=null;setRunning(false);setStatus("Stopped");}
 async function start(){
  if(!pack)return;stop();const token=epoch.current;setError("");setEvents([]);setTranscript("");setStage(undefined);setRunning(true);setStatus("Loading speech model…");
  const context=new AudioContext({sampleRate:16000});audio.current=context;await context.resume();
  const ws=new WebSocket(`${location.protocol==="https:"?"wss":"ws"}://${location.host}/session`);connection.current=ws;
  const log:Record<string,unknown>[]=[];let sequence=0;
  ws.onmessage=e=>{
   if(token!==epoch.current)return;
   const event=JSON.parse(e.data);log.push(event);
   if(event.type==="stage"||event.type==="snapshot")setStage(event.stage);
   if(event.type==="transcript"&&event.final)setTranscript(event.text);
   if(["direction_completed","transcript","stage","agent_error"].includes(event.type))setEvents(previous=>[...previous.slice(-199),{...event,at:Date.now()}]);
   if(["error","agent_error","worker_error"].includes(event.type))setError(event.message);
   if(event.type==="audio_ack")sequence++;
  };
  async function until(predicate:(e:any)=>boolean,after=0,timeout=60000){const start=performance.now();while(token===epoch.current && performance.now()-start<timeout){const found=log.slice(after).find(predicate);if(found)return found;const failure=log.slice(after).find(e=>["error","worker_error"].includes(e.type as string));if(failure)throw Error(String(failure.message));await new Promise(r=>setTimeout(r,20));}throw Error(token!==epoch.current?"Cancelled":"Timed out waiting for speech pipeline");}
  try{
   await new Promise<void>((resolve,reject)=>{ws.onopen=()=>resolve();ws.onerror=()=>reject(Error("Unable to connect to local runtime"));});
   if(token!==epoch.current)return;
   ws.send(JSON.stringify({type:"presentation_load",state:pack.state,engine:"adaptive",decision}));await until(e=>e.type==="presentation_loaded");
   setStatus("Preparing presentation…");ws.send(JSON.stringify({type:"presentation_start",requestId:`replay-${token}`}));ws.send(JSON.stringify({type:"speech_load"}));await until(e=>e.type==="presentation_ready"&&e.requestId===`replay-${token}`);await until(e=>e.type==="worker_status"&&e.status==="ready");
   const bytes=await fetch(pack.variants[variant].audio).then(r=>{if(!r.ok)throw Error("Narration audio unavailable");return r.arrayBuffer();});
   const buffer=await context.decodeAudioData(bytes);if(token!==epoch.current)return;
   const pcm=buffer.getChannelData(0);const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);
   const mark=log.length;ws.send(JSON.stringify({type:"speech_start"}));await until(e=>e.type==="worker_status"&&e.status==="listening",mark);
   setStatus("Playing narration · following speech");source.start();const started=context.currentTime;
   // Pace real PCM samples against the same audio clock used for audible playback.
   // One acknowledged frame in flight; never substitute the known narrative text.
   for(let offset=0;offset<pcm.length;offset+=4000){
    if(token!==epoch.current)return;
    const target=offset/16000;const remaining=target-(context.currentTime-started);if(remaining>0)await new Promise(r=>setTimeout(r,remaining*1000));
    if(token!==epoch.current)return;
    if(context.currentTime-started-target>2)throw Error("Audio transport fell behind narration; stopped to preserve synchronization");
    const values=pcm.subarray(offset,offset+4000),frame=new Int16Array(values.length);for(let i=0;i<values.length;i++)frame[i]=Math.max(-32768,Math.min(32767,Math.round(values[i]*32767)));
    const ack=sequence;ws.send(frame.buffer);const deadline=performance.now()+5000;
    while(sequence===ack && token===epoch.current && performance.now()<deadline)await new Promise(r=>setTimeout(r,5));
    if(sequence===ack)throw Error("Audio acknowledgement timed out");
   }
   if(token!==epoch.current)return;
   setStatus("Finishing last spoken passage…");const markStop=log.length;ws.send(JSON.stringify({type:"speech_stop"}));await until(e=>e.type==="worker_status"&&e.status==="ready",markStop);
   // Wait for any pending inference to finish, with a quiet period for asynchronous endpoint delivery.
   await new Promise(r=>setTimeout(r,2000));
   const lastFollowing=log.map(e=>e.type==="presentation_status"&&e.status==="composing").lastIndexOf(true);
   if(lastFollowing>=0)await until(e=>e.type==="presentation_status"&&e.status==="ready",lastFollowing);
   if(token!==epoch.current)return;
   setStatus("Replay complete");setRunning(false);ws.close();if(context.state!=="closed")await context.close();if(audio.current===context)audio.current=null;
  }catch(e){if(token===epoch.current){setError(e instanceof Error?e.message:"Replay failed");stop();}}
 }
 const directions=events.filter(e=>e.type==="direction_completed");
 return <main className="trial-shell">
  <header className="trial-header"><a className="wordmark" href="/">Omnipresent</a><span className="trial-story-title">{pack?.state.flow?.title||"Presentation"}</span><button className="experiment-trigger" aria-haspopup="dialog" onClick={()=>inspector.current?.showModal()}>Experiment</button></header>
  {error&&<p role="alert" className="error">{error}</p>}
  <section className="trial-stage" aria-label="Presentation canvas">{stage?.composition?.adaptive&&pack?<AdaptiveCanvas composition={stage.composition.adaptive} state={pack.state} engine={engine}/>:<div className="trial-ready"><h1>{pack?.state.flow?.title||"Your presentation"}</h1><p>Choose a narration, then start the presentation.</p></div>}</section>
  <div className="trial-playback"><label><span className="sr-only">Narrative</span><select aria-label="Narrative" disabled={running} value={variant} onChange={e=>setVariant(Number(e.target.value))}>{pack?.variants.map((v,i)=><option key={v.id} value={i}>{v.title}</option>)}</select></label><span role="status">{status}</span>{running?<button onClick={stop}>Stop</button>:<button className="primary" disabled={!pack||preparing} onClick={()=>void start()}>Play spoken presentation</button>}</div>
  <dialog ref={inspector} className="experiment-dialog" aria-labelledby="experiment-title" onClick={e=>{if(e.target===inspector.current)inspector.current.close();}}>
   <div className="experiment-heading"><h2 id="experiment-title">Experiment</h2><button aria-label="Close experiment details" onClick={()=>inspector.current?.close()}>Close</button></div>
   <div className="experiment-body">
    <section className="experiment-settings"><h3>Runtime</h3><label>Renderer<select disabled={running} value={engine} onChange={e=>setEngine(e.target.value as typeof engine)}><option value="openui">OpenUI 1.0</option><option value="json-render">json-render</option></select></label>
    <label>Selection<select disabled={running||preparing} value={decision} onChange={e=>setDecision(e.target.value)}><option value="baseline">Local hybrid</option><option value="clef-omni">Clef-omni (experimental)</option><option value="clef-flash">Clef-flash (experimental)</option><option value="clef">Clef (experimental)</option><option value="jev">Jev · OpenRouter</option><option value="laya">Laya · local CPU</option></select></label></section>
    <section><h3>Speech and decisions</h3><p aria-label="Recognized speech">{transcript||"No speech recognized yet."}</p><p>{directions.length} decisions · {directions.filter(e=>e.changed).length} composition changes</p></section>
    <TrialPreparation disabled={running} onBusy={setPreparing} onPrepared={state=>{setPack(previous=>previous?{...previous,state}:previous);setStage(undefined);setEvents([]);setTranscript("");}}/>
    <details><summary>Interview</summary><pre>{pack?.state.messages.interview.map(m=>`${m.role}: ${m.content}`).join("\n\n")}</pre></details>
    <details><summary>Story and source references</summary><pre>{JSON.stringify(pack?.state.flow,null,2)}</pre></details>
    <details><summary>Replay trace</summary><pre data-testid="trial-events">{JSON.stringify(events,null,2)}</pre></details>
    <button disabled={!events.length} onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({variant:pack?.variants[variant].id,engine,decision,events},null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="omnipresent-replay.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Download replay evidence</button>
   </div>
  </dialog>
 </main>;
}
