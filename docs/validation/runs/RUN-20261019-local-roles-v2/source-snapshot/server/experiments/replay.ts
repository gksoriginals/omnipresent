import {traceStage,type TraceSink} from "./trace.js";
export type ReplayDecision={action:"show"|"hold"|"context";selected:string|null};
export type ReplayCase={id:string;speech:string;expected:ReplayDecision;acceptable?:readonly ReplayDecision[];refresh?:boolean};
export interface ReplayArm {id:string;initialize(signal:AbortSignal):Promise<void>;refresh(test:ReplayCase,pass:number,signal:AbortSignal):Promise<void>;decide(test:ReplayCase,signal:AbortSignal):Promise<ReplayDecision>}
export type ReplayRow={pass:number;arm:string;caseId:string;expected:ReplayDecision;acceptable?:readonly ReplayDecision[];result?:ReplayDecision;valid:boolean;correct:boolean;elapsedMs:number;stageMs?:Record<string,number>;groundingCalls?:number;fallbacks?:number;refreshed?:boolean;error?:string};
export async function runReplay(options:{cases:readonly ReplayCase[];passes:number;create:(pass:number,arm:string,sink:TraceSink)=>ReplayArm;arms:readonly string[];sink:(context:{pass:number;arm:string;caseId:string})=>TraceSink;row?:(row:ReplayRow)=>void;timeoutMs?:number;clock?:()=>number}){
 if(!Number.isInteger(options.passes)||options.passes<1)throw Error("Positive replay pass count required");
 if(!options.arms.length||new Set(options.arms).size!==options.arms.length||new Set(options.cases.map(c=>c.id)).size!==options.cases.length)throw Error("Unique arms and cases required");
 const stageRows=new Map<string,{stageMs:Record<string,number>;groundingCalls:number;fallbacks:number}>();
 const sinkFor=(context:{pass:number;arm:string;caseId:string}):TraceSink=>({write(event){
  const key=JSON.stringify(context);let stats=stageRows.get(key);if(!stats){stats={stageMs:{},groundingCalls:0,fallbacks:0};stageRows.set(key,stats);}
  if(event.phase!=="start"&&event.elapsedMs!==undefined)stats.stageMs[event.stage]=(stats.stageMs[event.stage]??0)+event.elapsedMs;
  if(event.stage==="model-attempt"&&event.phase!=="start"){stats.groundingCalls++;if(typeof event.details?.attempt==="number"&&event.details.attempt>1)stats.fallbacks++;}
  options.sink(context).write(event);
 }});
 const clock=options.clock??(()=>performance.now()),rows:ReplayRow[]=[],initialization:{pass:number;arm:string;elapsedMs:number;error?:string}[]=[];
 for(let pass=0;pass<options.passes;pass++){
  const arms=new Map<string,ReplayArm>(),failed=new Map<string,string>();let activeCase="initialization";
  for(const id of options.arms){const sink:TraceSink={write:event=>sinkFor({pass,arm:id,caseId:activeCase}).write(event)};const start=clock();
   try{const arm=options.create(pass,id,sink);arms.set(id,arm);const signal=AbortSignal.timeout(options.timeoutMs??45000);await traceStage(sink,"initialization",async()=>{await arm.initialize(signal);signal.throwIfAborted();},{},clock);initialization.push({pass,arm:id,elapsedMs:clock()-start});}
   catch(error){const message=String(error);failed.set(id,message);initialization.push({pass,arm:id,elapsedMs:clock()-start,error:message});}
  }
  for(let index=0;index<options.cases.length;index++){
   const test=Object.freeze({...options.cases[index],expected:Object.freeze({...options.cases[index].expected}),acceptable:options.cases[index].acceptable?.map(value=>Object.freeze({...value}))});activeCase=test.id;
   // Rotate and reverse paired order to avoid assigning all warm-up drift to one arm.
   const offset=(pass+index)%options.arms.length;let order=[...options.arms.slice(offset),...options.arms.slice(0,offset)];if(pass%2)order=order.reverse();
   for(const id of order){const started=clock(),signal=AbortSignal.timeout(options.timeoutMs??45000),arm=arms.get(id)!,sink=sinkFor({pass,arm:id,caseId:test.id});const row:ReplayRow={pass,arm:id,caseId:test.id,expected:test.expected,acceptable:test.acceptable,valid:false,correct:false,elapsedMs:0};
    try{if(failed.has(id))throw Error(`Initialization failed: ${failed.get(id)}`);
     row.result=await traceStage(sink,"turn",async()=>{if(test.refresh)await arm.refresh(test,pass,signal);signal.throwIfAborted();const result=await arm.decide(test,signal);signal.throwIfAborted();if(!["show","hold","context"].includes(result.action)||(result.action==="show"?typeof result.selected!=="string":result.selected!==null))throw Error("Invalid replay decision");return result;},{requestId:`${pass}/${id}/${test.id}`},clock);
     row.valid=true;row.correct=[test.expected,...test.acceptable??[]].some(expected=>row.result!.action===expected.action&&row.result!.selected===expected.selected);
    }catch(error){row.error=String(error);}row.elapsedMs=clock()-started;Object.assign(row,stageRows.get(JSON.stringify({pass,arm:id,caseId:test.id})),{refreshed:!!test.refresh});rows.push(row);options.row?.(row);
   }
  }
 }
 const summarize=(selected:ReplayRow[],arm:string)=>{const times=selected.map(r=>r.elapsedMs).sort((a,b)=>a-b),q=(p:number)=>times[Math.ceil(times.length*p)-1]??null;
  return {arm,total:selected.length,correct:selected.filter(r=>r.correct).length,failures:selected.filter(r=>!r.valid).length,positiveCorrect:selected.filter(r=>r.expected.action==="show"&&r.correct).length,negativeCorrect:selected.filter(r=>r.expected.action!=="show"&&r.correct).length,unsupportedShows:selected.filter(r=>r.result?.action==="show"&&!r.correct).length,refreshes:selected.filter(r=>r.refreshed).length,groundingCalls:selected.reduce((n,r)=>n+(r.groundingCalls??0),0),fallbacks:selected.reduce((n,r)=>n+(r.fallbacks??0),0),medianMs:q(.5),p95Ms:q(.95)};
 };
 return {rows,initialization,summary:options.arms.map(arm=>summarize(rows.filter(r=>r.arm===arm),arm)),passes:Array.from({length:options.passes},(_,pass)=>({pass,arms:options.arms.map(arm=>summarize(rows.filter(r=>r.pass===pass&&r.arm===arm),arm))}))};
}
