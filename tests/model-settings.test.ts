import {test} from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as wait} from "node:timers/promises";
import {mkdtemp,readFile,rm,stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createServer} from "node:http";

test("model settings can be tested and saved without returning the API key",async()=>{
 const folder=await mkdtemp(join(tmpdir(),"omnipresent-settings-")),port=4336;
 const models=createServer((_req,res)=>{res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({data:[{id:"fixture-model"}]}));});
 await new Promise<void>(resolve=>models.listen(0,"127.0.0.1",resolve));const address=models.address();assert.ok(address&&typeof address==="object");
 const child=spawn(process.execPath,["--import","tsx","server/index.ts"],{env:{...process.env,PORT:String(port),OMNIPRESENT_SETTINGS_PATH:join(folder,"settings.json"),OMNIPRESENT_TEST_EMBEDDINGS:"1"},stdio:"pipe"});
 try{
  let ready=false;for(let i=0;i<120;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok){ready=true;break;}}catch{}await wait(25);}assert.ok(ready);
  const origin=`http://127.0.0.1:${port}`,get=await fetch(`${origin}/api/settings/model`);assert.equal(get.status,200);const initial=await get.json() as any;assert.equal(initial.apiKey,undefined);assert.equal(initial.apiKeyConfigured,false);
  const secret="fixture-secret-never-returned";const saved=await fetch(`${origin}/api/settings/model`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({baseURL:`http://127.0.0.1:${address.port}/v1`,model:"fixture-model",apiKey:secret})});assert.equal(saved.status,200);const safe=await saved.json() as any;assert.deepEqual(safe,{baseURL:`http://127.0.0.1:${address.port}/v1`,model:"fixture-model",apiKeyConfigured:true});assert.equal(JSON.stringify(safe).includes(secret),false);
  const tested=await fetch(`${origin}/api/settings/model/test`,{method:"POST"});assert.equal(tested.status,200);assert.deepEqual(await tested.json(),{ok:true,modelFound:true,availableModels:["fixture-model"]});
  const onDisk=JSON.parse(await readFile(join(folder,"settings.json"),"utf8"));assert.equal(onDisk.apiKey,secret);assert.equal((await stat(join(folder,"settings.json"))).mode&0o777,0o600);
  const invalid=await fetch(`${origin}/api/settings/model`,{method:"PUT",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({baseURL:"file:///etc/passwd"})});assert.equal(invalid.status,400);
  const forbidden=await fetch(`${origin}/api/settings/model`,{method:"PUT",headers:{Origin:"https://foreign.example","Content-Type":"application/json"},body:"{}"});assert.equal(forbidden.status,400);
 }finally{child.kill();await new Promise<void>(resolve=>child.once("exit",()=>resolve()));models.close();await rm(folder,{recursive:true,force:true});}
});
