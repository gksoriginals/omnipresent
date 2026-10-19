import {traceStage,type TraceSink} from "./trace.js";
export type ReplayDecision={action:"show"|"hold"|"context";selected:string|null};
export type ReplayCase={id:string;speech:string;expected:ReplayDecision;refresh?:boolean};
export interface ReplayArm {id:string;initialize(signal:AbortSignal):Promise<void>;refresh(test:ReplayCase,pass:number,signal:AbortSignal):Promise<void>;decide(test:ReplayCase,signal:AbortSignal):Promise<ReplayDecision>}
export type ReplayRow={pass:number;arm:string;caseId:string;expected:ReplayDecision;result?:ReplayDecision;valid:boolean;correct:boolean;elapsedMs:number;error?:string};
export async function runReplay(options:{cases:readonly ReplayCase[];passes:number;create:(pass:number,arm:string,sink:TraceSink)=>ReplayArm;arms:readonly string[];sink:(context:{pass:number;arm:string;caseId:string})=>TraceSink;row?:(row:ReplayRow)=>void;timeoutMs?:number;clock?:()=>number}){
 if(!Number.isInteger(options.passes)||options.passes<1)throw Error("Positive replay pass count required");
 if(!options.arms.length||new Set(options.arms).size!==options.arms.length||new Set(options.cases.map(c=>c.id)).size!==options.cases.length)throw Error("Unique arms and cases required");
 const clock=options.clock??(()=>performance.now()),rows:ReplayRow[]=[],initialization:{pass:number;arm:string;elapsedMs:number;error?:string}[]=[];
 for(let pass=0;pass<options.passes;pass++){
  const arms=new Map<string,ReplayArm>(),failed=new Map<string,string>();let activeCase="initialization";
  for(const id of options.arms){const sink:TraceSink={write:event=>options.sink({pass,arm:id,caseId:activeCase}).write(event)},arm=options.create(pass,id,sink);arms.set(id,arm);const start=clock();
   try{await traceStage(sink,"initialization",()=>arm.initialize(AbortSignal.timeout(options.timeoutMs??45000)),{},clock);initialization.push({pass,arm:id,elapsedMs:clock()-start});}
   catch(error){const message=String(error);failed.set(id,message);initialization.push({pass,arm:id,elapsedMs:clock()-start,error:message});}
  }
  for(let index=0;index<options.cases.length;index++){
   const test=options.cases[index];activeCase=test.id;
   // Rotate and reverse paired order to avoid assigning all warm-up drift to one arm.
   const offset=(pass+index)%options.arms.length;let order=[...options.arms.slice(offset),...options.arms.slice(0,offset)];if(pass%2)order=order.reverse();
   for(const id of order){const started=clock(),signal=AbortSignal.timeout(options.timeoutMs??45000),arm=arms.get(id)!,sink=options.sink({pass,arm:id,caseId:test.id});const row:ReplayRow={pass,arm:id,caseId:test.id,expected:test.expected,valid:false,correct:false,elapsedMs:0};
    try{if(failed.has(id))throw Error(`Initialization failed: ${failed.get(id)}`);
     row.result=await traceStage(sink,"turn",async()=>{if(test.refresh)await arm.refresh(test,pass,signal);signal.throwIfAborted();const result=await arm.decide(test,signal);signal.throwIfAborted();if(!["show","hold","context"].includes(result.action)||(result.action==="show"?typeof result.selected!=="string":result.selected!==null))throw Error("Invalid replay decision");return result;},{requestId:`${pass}/${id}/${test.id}`},clock);
     row.valid=true;row.correct=row.result.action===test.expected.action&&row.result.selected===test.expected.selected;
    }catch(error){row.error=String(error);}row.elapsedMs=clock()-started;rows.push(row);options.row?.(row);
   }
  }
 }
 return {rows,initialization,summary:options.arms.map(arm=>{const selected=rows.filter(r=>r.arm===arm),times=selected.map(r=>r.elapsedMs).sort((a,b)=>a-b),q=(p:number)=>times[Math.ceil(times.length*p)-1]??null;
  return {arm,total:selected.length,correct:selected.filter(r=>r.correct).length,failures:selected.filter(r=>!r.valid).length,positiveCorrect:selected.filter(r=>r.expected.action==="show"&&r.correct).length,negativeCorrect:selected.filter(r=>r.expected.action!=="show"&&r.correct).length,unsupportedShows:selected.filter(r=>r.result?.action==="show"&&!r.correct).length,medianMs:q(.5),p95Ms:q(.95)};})};
}
