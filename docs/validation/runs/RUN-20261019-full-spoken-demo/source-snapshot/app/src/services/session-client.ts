import {z} from "zod";
import {preparationSchema} from "../../../shared/preparation";
import {adaptiveSchema} from "../../../shared/adaptive";
import {visualSchema,mediaSchema} from "../../../shared/visuals";
const stage=z.object({text:z.string(),revision:z.number().int().nonnegative(),source:z.enum(["manual","speech","agent"]),committedAt:z.number(),composition:z.object({adaptive:adaptiveSchema.optional(),title:z.string(),body:z.string(),beat:z.number().int().min(0),flowRevision:z.number().int(),visual:visualSchema.optional(),image:mediaSchema.optional()}).optional()});
const eventSchema=z.discriminatedUnion("type",[
 z.object({type:z.literal("preparation"),state:preparationSchema}),
 z.object({type:z.literal("presentation_feedback"),projectId:z.string(),question:z.string()}),
 z.object({type:z.literal("agent_status"),status:z.string()}),
 z.object({type:z.literal("agent_activity"),label:z.string()}),
 z.object({type:z.literal("agent_delta"),text:z.string()}),
 z.object({type:z.literal("stage"),stage}),z.object({type:z.literal("snapshot"),stage,paused:z.boolean()}),
 z.object({type:z.literal("worker_status"),status:z.string()}),z.object({type:z.literal("audio_ack")}),
 ...(["error","worker_error","agent_error"] as const).map(type=>z.object({type:z.literal(type),message:z.string()})),
]);
export type SessionEvent=z.infer<typeof eventSchema>;
export function parseSessionEvent(data:string):SessionEvent|null{
 const value=JSON.parse(data);if(!value||typeof value.type!=="string")throw Error("Invalid session event");
 // Server telemetry and optional capabilities do not affect the UI state machine.
 if(!["preparation","presentation_feedback","agent_status","agent_activity","agent_delta","stage","snapshot","worker_status","audio_ack","error","worker_error","agent_error"].includes(value.type))return null;
 return eventSchema.parse(value);
}
export class SessionClient {
 private socket:WebSocket|null=null;private disposed=false;private timer?:ReturnType<typeof setTimeout>;
 constructor(private url:string,private handlers:{open():void;event(event:SessionEvent):void;close():void;error(message:string):void},private create:(url:string)=>WebSocket=url=>new WebSocket(url)){}
 get readyState(){return this.socket?.readyState??3;}
 get bufferedAmount(){return this.socket?.bufferedAmount??0;}
 send(data:ArrayBuffer|Record<string,unknown>){if(this.socket?.readyState===1)this.socket.send(data instanceof ArrayBuffer?data:JSON.stringify(data));}
 connect(){if(this.disposed)return;const socket=this.create(this.url);this.socket=socket;
  const current=()=>!this.disposed&&this.socket===socket;
  socket.onopen=()=>{if(current())this.handlers.open();};
  socket.onmessage=({data})=>{if(!current())return;try{const event=parseSessionEvent(String(data));if(event)this.handlers.event(event);}catch{this.handlers.error("The server sent an invalid session event.");}};
  socket.onclose=()=>{if(!current())return;this.handlers.close();this.timer=setTimeout(()=>this.connect(),1500);};
 }
 close(){this.disposed=true;clearTimeout(this.timer);const socket=this.socket;this.socket=null;socket?.close();}
}
