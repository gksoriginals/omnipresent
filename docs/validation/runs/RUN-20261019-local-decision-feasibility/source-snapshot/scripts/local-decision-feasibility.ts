import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {groundLibrary} from '../server/controllers/library-grounding.js';
import {presentationCatalog} from '../server/presentation/catalog.js';
const id=process.argv[2];if(!id||!/^RUN-[\w-]+$/.test(id))throw Error('Unique run ID required');const directory=`docs/validation/runs/${id}`;await mkdir(directory);
const fixture=await readFile('docs/validation/runs/RUN-20261019-full-spoken-demo/manifest.json');const state=JSON.parse(fixture.toString()).state;
const assets=presentationCatalog(state).assets;
const selected=[assets.find(a=>a.family==='statement'&&a.text==='Solar panels turn sunlight into electricity.')!,assets.find(a=>a.family==='statement'&&a.text==='Batteries store electricity for later use.')!,assets.find(a=>a.family==='chart'&&a.title==='Daily curve')!];if(selected.some(a=>!a))throw Error('Fixture mismatch');
// Development transport/input-shape probe only. Host guards are deliberately not tested here.
const cases=[{speech:'Solar panels turn sunlight into electricity.',expected:'option_0'},{speech:'Batteries store electricity for later use.',expected:'option_1'},{speech:'Show the daily generation curve.',expected:'option_2'},{speech:'Checking the microphone.',expected:'hold'},{speech:'What is the installation cost?',expected:'context'},{speech:'Do not show battery storage.',expected:'hold'}];
const rows:any[]=[],requests:any[]=[];
const local={async decide(request:any,signal:AbortSignal){requests.push(request);const response=await fetch('http://127.0.0.1:4331/v1/systemone',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal});if(!response.ok)throw Error(`HTTP ${response.status}: ${(await response.text()).slice(0,300)}`);return response.json();}};
for(let pass=0;pass<2;pass++)for(const [index,c] of cases.entries())for(const format of (pass+index)%2?['compact','current']:['current','compact']){
 const began=performance.now();try{
  let choice:string,raw:any;
  if(format==='current'){
   const result=await groundLibrary(c.speech,selected,AbortSignal.timeout(10000),async trace=>{raw=trace.raw;},()=>{},local);
   choice=result.action==='show'?`option_${selected.findIndex(a=>a.id===result.selected)}`:result.action;
  }else{
   const request={state:{speech:c.speech,options:Object.fromEntries(selected.map((a,i)=>[`option_${i}`,{title:a.title,text:a.text,entity:a.entity,timeframe:(a as any).evidence.timeframe,provenance:(a as any).evidence.provenance,unit:(a as any).evidence.unit,family:a.family}]))},questions:{action:{type:'choice',instructions:'Choose content matching the speech. Hold for unrelated or negated speech. Context if requested facts are missing.',criteria:{option_0:'Show solar explanation',option_1:'Show battery explanation',option_2:'Show generation curve',hold:'Keep current content',context:'Evidence is missing'}}}};
   raw=await local.decide(request,AbortSignal.timeout(10000));choice=raw.answers?.action?.choice;
  }
  rows.push({pass,index,format,speech:c.speech,expected:c.expected,choice,correct:choice===c.expected,elapsedMs:performance.now()-began,raw});
 }catch(error){rows.push({pass,index,format,speech:c.speech,expected:c.expected,error:String(error),correct:false,elapsedMs:performance.now()-began});}
}
const summary=['current','compact'].map(format=>{const r=rows.filter(r=>r.format===format),valid=r.filter(r=>!r.error),times=r.map(r=>r.elapsedMs).sort((a,b)=>a-b);return {format,attempts:r.length,valid:valid.length,correct:r.filter(r=>r.correct).length,medianMs:times[Math.ceil(times.length*.5)-1],p95Ms:times[Math.ceil(times.length*.95)-1]};});
const sourceFiles=[];for(const path of ['scripts/local-decision-feasibility.ts','runtime/decision_server.py','runtime/decision-requirements.lock','server/controllers/library-grounding.ts']){const bytes=await readFile(path),destination=`${directory}/source-snapshot/${path}`;await mkdir(destination.slice(0,destination.lastIndexOf('/')),{recursive:true});await writeFile(destination,bytes);sourceFiles.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile(`${directory}/inputs.json`,JSON.stringify({state,selected,cases,passes:2},null,2));
await writeFile(`${directory}/requests.json`,JSON.stringify(requests,null,2));
await writeFile(`${directory}/local.json`,JSON.stringify({id,recordedAt:new Date().toISOString(),sourceFiles,fixtureHash:createHash('sha256').update(fixture).digest('hex'),summary,rows,productionAcceptance:false,limitations:['Six authored cases repeated twice, one synthetic story; not independent selection-quality acceptance.','Current uses full host-generated grounding payload; compact is a different prompt and payload, so latency differences are not a model comparison.','Direct local model only; does not apply the live evidence gate, retrieval or final composition guard. Errors remain in denominator.','No quantization, hosted requests, additional weight downloads, STT or UI replay.']},null,2));console.log(JSON.stringify({id,summary},null,2));
