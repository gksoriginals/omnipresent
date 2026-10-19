import type {DecisionRequest} from "../agents/system-one.js";
export async function openRouterKey(){
 if(process.env.OPENROUTER_API_KEY)return process.env.OPENROUTER_API_KEY;

 throw Error("OpenRouter credential unavailable; configure OPENROUTER_API_KEY locally");
}
export async function sendDecision(model:string,local:boolean,request:DecisionRequest,signal:AbortSignal){
 const response=await fetch(local?"http://127.0.0.1:4331/v1/systemone":"https://openrouter.ai/api/alpha/decisions",{method:"POST",headers:{"Content-Type":"application/json",...(!local?{Authorization:`Bearer ${await openRouterKey()}`}:{})},body:JSON.stringify({...request,model}),signal});
 if(!response.ok)throw Error(`Decision request failed (HTTP ${response.status})`);return response.json();
}
