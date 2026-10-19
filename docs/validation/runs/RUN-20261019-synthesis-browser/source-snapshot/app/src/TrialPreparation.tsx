import { useEffect,useRef,useState } from "react";
import { emptyPreparation,type Preparation } from "../../shared/preparation";
export function TrialPreparation({disabled,onPrepared,onBusy}:{disabled:boolean;onBusy:(busy:boolean)=>void;onPrepared:(state:Preparation)=>void}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const wsRef=useRef<WebSocket|null>(null),epoch=useRef(0);
 useEffect(()=>()=>{epoch.current++;wsRef.current?.close();},[]);
 function cancel(){epoch.current++;wsRef.current?.close();wsRef.current=null;setBusy(false);onBusy(false);setMessage("Preparation stopped; previous trial remains available.");}
 async function prepare(){
  const token=++epoch.current;setBusy(true);onBusy(true);setMessage("Interview agent is gathering the supplied context…");
  const ws=new WebSocket(`${location.protocol==="https:"?"wss":"ws"}://${location.host}/session`);wsRef.current=ws;
  let phase="interview";let current=emptyPreparation();const events:any[]=[];
  ws.onmessage=e=>{if(epoch.current!==token)return;const event=JSON.parse(e.data);events.push(event);if(event.type==="preparation")current=event.state;if(event.type==="agent_delta")setMessage(previous=>(previous+event.text).slice(-1800));};
  async function until(predicate:(event:any)=>boolean,after:number){const start=performance.now();while(epoch.current===token&&performance.now()-start<120000){const failure=events.slice(after).find(e=>["error","agent_error"].includes(e.type));if(failure)throw Error(failure.message);if(events.slice(after).some(predicate))return;await new Promise(r=>setTimeout(r,30));}throw Error("Preparation timed out or was cancelled");}
  function send(event:object){ws.send(JSON.stringify(event));}
  try{
   await new Promise<void>((resolve,reject)=>{ws.onopen=()=>resolve();ws.onerror=()=>reject(Error("Local runtime unavailable"));});if(epoch.current!==token)return;
   send({type:"preparation_open",state:emptyPreparation()});await until(e=>e.type==="preparation",0);
   send({type:"artifact_add",name:"solar-facts.csv",content:"Time,EnergyWh\nMorning,10\nNoon,20\nEvening,5\nSynthetic teaching example, not measured performance. Panels convert sunlight into electricity. Batteries store electricity for use after sunset. Process: Sun, Panels, Battery."});
   let mark=events.length;send({type:"agent_turn",role:"interview",text:"I am teaching solar energy to teachers for five minutes. Explain panels, the daily energy pattern, and battery storage. Use the uploaded synthetic example; no invented measurements. We have all the context. Call updateBrief with these points now and briefly confirm."});
   await until(e=>e.type==="agent_status"&&e.status==="idle"&&e.role==="interview",mark);if(!current.brief){
    mark=events.length;send({type:"agent_turn",role:"interview",text:"The brief was not saved. All context for this test is supplied: teachers, five minutes, teach solar generation and storage using the uploaded synthetic data. Call updateBrief now with these facts. Put any remaining questions in openQuestions."});
    await until(e=>e.type==="agent_status"&&e.status==="idle"&&e.role==="interview",mark);
    if(!current.brief)throw Error("Interview did not produce a brief after one retry");
   }
   phase="storyteller";setMessage("Storyteller is preparing the narrative, diagram and chart…");mark=events.length;
   send({type:"agent_turn",role:"storyteller",text:"Read the uploaded material. Call createDiagram with Sun → Panels → Battery and createChart for Morning 10, Noon 20, Evening 5 Wh, labelled synthetic teaching data, linked to the uploaded artifact. Then proposeFlow with exactly three beats: How panels work (linked to the diagram); Daily energy pattern (linked to the chart); Storage after sunset (linked to the diagram). Provide concise audienceText on each beat and use the returned visual IDs. End with a short confirmation."});
   await until(e=>e.type==="agent_status"&&e.status==="idle"&&e.role==="storyteller",mark);if(!current.flow)throw Error("Storyteller did not produce a flow");
   mark=events.length;send({type:"flow_approve"});await until(e=>e.type==="preparation"&&e.state.approvedRevision===e.state.revision,mark);
   localStorage.setItem("omnipresent-trial-preparation-evidence",JSON.stringify({state:current,events}));onPrepared(current);setMessage("Trial story prepared and reviewed. Choose a narration and press Play.");
  }catch(error){if(epoch.current===token){localStorage.setItem("omnipresent-trial-preparation-evidence",JSON.stringify({state:current,events}));setMessage(`${phase}: ${error instanceof Error?error.message:"Preparation failed"}`);}}
  finally{ws.close();if(epoch.current===token){setBusy(false);onBusy(false);}}
 }
 return <details className="trial-preparation"><summary>Run the interview and storyteller live</summary><p>This supplied-context test creates a fresh trial story without changing your projects. Its source facts match the three Piper narrations. Review the resulting story in the evidence section before presenting.</p><button disabled={disabled||busy} onClick={()=>void prepare()}>Run interview → story</button>{busy&&<button onClick={cancel}>Cancel preparation</button>}<p role="status">{message}</p></details>;
}
