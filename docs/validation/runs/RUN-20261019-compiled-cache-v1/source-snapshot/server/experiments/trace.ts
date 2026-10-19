export type TraceEvent={stage:string;phase:"start"|"complete"|"error";atMs:number;elapsedMs?:number;revision?:string;requestId?:string;details?:Record<string,string|number|boolean|null>};
export interface TraceSink {write(event:TraceEvent):void}
export const nullTrace:TraceSink={write(){}};
export class MemoryTraceSink implements TraceSink {readonly events:TraceEvent[]=[];write(event:TraceEvent){this.events.push(structuredClone(event));}}
export async function traceStage<T>(sink:TraceSink,stage:string,work:()=>Promise<T>,context:Pick<TraceEvent,"revision"|"requestId">={},clock=()=>performance.now()):Promise<T>{
 const started=clock();sink.write({stage,phase:"start",atMs:started,...context});
 try{const result=await work();const ended=clock();sink.write({stage,phase:"complete",atMs:ended,elapsedMs:ended-started,...context});return result;}
 catch(error){const ended=clock();sink.write({stage,phase:"error",atMs:ended,elapsedMs:ended-started,...context});throw error;}
}
