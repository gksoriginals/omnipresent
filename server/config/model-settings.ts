import {readFileSync} from "node:fs";
import {chmod,mkdir,rename,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";

export type ModelSettings={baseURL:string;model:string;apiKey:string};
export type PublicModelSettings={baseURL:string;model:string;apiKeyConfigured:boolean};
const defaults={baseURL:"http://127.0.0.1:11434/v1",model:"qwen3.5:4b"};
const path=resolve(process.env.OMNIPRESENT_SETTINGS_PATH??resolve(process.env.OMNIPRESENT_DATA_DIR??"output/omnipresent","settings.json"));
let current:ModelSettings=loadInitial();
function loadInitial():ModelSettings{
 try{const value=JSON.parse(requireText());if(typeof value.baseURL==="string"&&typeof value.model==="string"&&typeof value.apiKey==="string")return validate(value);}catch{}
 return validate({baseURL:process.env.OMNIPRESENT_LLM_BASE_URL??defaults.baseURL,model:process.env.OMNIPRESENT_LLM_MODEL??defaults.model,apiKey:process.env.OMNIPRESENT_LLM_API_KEY??""});
}
function requireText(){return readFileSync(path,"utf8");}
function validate(value:ModelSettings):ModelSettings{
 const baseURL=value.baseURL.trim(),model=value.model.trim(),apiKey=value.apiKey.trim();
 let parsed:URL;try{parsed=new URL(baseURL);}catch{throw Error("Enter a valid model endpoint URL.");}
 if(!["http:","https:"].includes(parsed.protocol))throw Error("Model endpoint must use HTTP or HTTPS.");
 if(!model||model.length>160||/[\r\n]/.test(model))throw Error("Enter a model name under 160 characters.");
 if(apiKey.length>2048||/[\r\n]/.test(apiKey))throw Error("API key is invalid.");
 return {baseURL:parsed.toString().replace(/\/$/,""),model,apiKey};
}
function apply(value:ModelSettings){current=value;process.env.OMNIPRESENT_LLM_BASE_URL=value.baseURL;process.env.OMNIPRESENT_LLM_MODEL=value.model;if(value.apiKey)process.env.OMNIPRESENT_LLM_API_KEY=value.apiKey;else delete process.env.OMNIPRESENT_LLM_API_KEY;}
apply(current);
export function modelSettings():PublicModelSettings{return {baseURL:current.baseURL,model:current.model,apiKeyConfigured:Boolean(current.apiKey)};}
export async function updateModelSettings(input:Partial<Pick<ModelSettings,"baseURL"|"model"|"apiKey">>&{clearApiKey?:boolean}):Promise<PublicModelSettings>{
 const candidate=validate({baseURL:input.baseURL??current.baseURL,model:input.model??current.model,apiKey:input.clearApiKey?"":input.apiKey?.trim()?input.apiKey:current.apiKey});
 await mkdir(dirname(path),{recursive:true});const temp=`${path}.${process.pid}.tmp`;
 await writeFile(temp,JSON.stringify(candidate,null,2)+"\n",{mode:0o600});await chmod(temp,0o600);await rename(temp,path);apply(candidate);return modelSettings();
}
export async function handleModelSettings(req:import("node:http").IncomingMessage,res:import("node:http").ServerResponse,allowedOrigins:Set<string>):Promise<boolean>{
 if(!req.url?.startsWith("/api/settings/model"))return false;
 try{
  if(req.headers.origin&&!allowedOrigins.has(req.headers.origin))throw Error("Unsupported settings request origin");
  res.setHeader("Cache-Control","no-store");res.setHeader("Content-Type","application/json");
  if(req.method==="GET"&&req.url==="/api/settings/model"){res.end(JSON.stringify(modelSettings()));return true;}
  if(req.method==="POST"&&req.url==="/api/settings/model/test"){
   const response=await fetch(`${current.baseURL.replace(/\/$/,"")}/models`,{headers:{...(current.apiKey?{Authorization:`Bearer ${current.apiKey}`}:{})},signal:AbortSignal.timeout(5000)});
   if(!response.ok)throw Error(`Endpoint responded with HTTP ${response.status}.`);
   const payload=await response.json() as {data?:Array<{id?:string}>;models?:Array<{name?:string;model?:string}>};
   const ids=[...(payload.data??[]).map(m=>m.id),...(payload.models??[]).flatMap(m=>[m.name,m.model])].filter((v):v is string=>Boolean(v));
   const exact=ids.some(id=>id===current.model||id.split(":")[0]===current.model.split(":")[0]);
   res.end(JSON.stringify({ok:true,modelFound:ids.length?exact:null,availableModels:ids.slice(0,40)}));return true;
  }
  if(req.method==="PUT"&&req.url==="/api/settings/model"){
   const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8192)throw Error("Settings request is too large.");chunks.push(Buffer.from(chunk));}
   const body=JSON.parse(Buffer.concat(chunks).toString("utf8"));if(!body||typeof body!=="object"||Array.isArray(body))throw Error("Invalid settings body.");
   const result=await updateModelSettings({baseURL:typeof body.baseURL==="string"?body.baseURL:undefined,model:typeof body.model==="string"?body.model:undefined,apiKey:typeof body.apiKey==="string"?body.apiKey:undefined,clearApiKey:body.clearApiKey===true});
   res.end(JSON.stringify(result));return true;
  }
  res.writeHead(405);res.end(JSON.stringify({error:"Method not allowed."}));return true;
 }catch(error){res.writeHead(400);res.end(JSON.stringify({error:error instanceof Error?error.message:"Could not update model settings."}));return true;}
}
