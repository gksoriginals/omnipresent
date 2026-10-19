import {appendFileSync} from "node:fs";
import type {TraceEvent,TraceSink} from "./trace.js";
// Caller chooses a unique run directory; trace data contains no raw transcript/provider text.
export class JsonlTraceSink implements TraceSink {
 constructor(private path:string,private context:Record<string,string|number>={}){}
 write(event:TraceEvent){appendFileSync(this.path,JSON.stringify({...this.context,...event})+"\n");}
}
