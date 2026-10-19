import {readFile,mkdir,writeFile} from "node:fs/promises";
import {openRouterKey,decisionModels} from "../server/agents/system-one.js";
const runId=process.argv[2];if(!runId||!/^[A-Za-z0-9_-]+$/.test(runId))throw Error("Supply unique run ID");
const directory=`docs/validation/runs/${runId}`;await mkdir(directory,{recursive:false});
const source="docs/validation/runs/RUN-20261017-semantic-selection-v1/retrieval-selection.json";
const previous=JSON.parse(await readFile(source,"utf8"));const request=previous.selection.find((r:any)=>r.provider==="jev"&&r.method==="semantic").request;
const results:any[]=[];
for(const provider of ["clef","clef-flash","clef-omni"] as const){
 const began=performance.now();
 try{
  const response=await fetch("https://openrouter.ai/api/alpha/decisions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${await openRouterKey()}`},body:JSON.stringify({...request,model:decisionModels[provider]}),signal:AbortSignal.timeout(20000)});
  const body=await response.json();results.push({provider,status:response.status,ok:response.ok,elapsedMs:performance.now()-began,request,raw:body});
 }catch(error){results.push({provider,ok:false,elapsedMs:performance.now()-began,error:error instanceof Error?error.message:String(error)});}
}
await writeFile(`${directory}/connectivity.json`,JSON.stringify({recordedAt:new Date().toISOString(),scope:"Single-case connection check per Cloudflare variant using one retained benchmark request. Not a quality benchmark. Uses existing OpenRouter credential without recording it.",source,results},null,2)+"\n");
console.log(JSON.stringify(results.map(r=>({provider:r.provider,status:r.status,ok:r.ok,model:r.raw?.model,cost:r.raw?.usage?.cost,error:r.raw?.error??r.error})),null,2));
