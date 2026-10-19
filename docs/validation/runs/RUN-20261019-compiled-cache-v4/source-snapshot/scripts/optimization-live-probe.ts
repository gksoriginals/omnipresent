import WebSocket from 'ws';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const directory=process.argv[2];if(!directory||!/^output\/[\w/-]+$/.test(directory))throw Error('Provide output/<unique-name>');await mkdir(directory,{recursive:true});
const state=JSON.parse(await readFile('docs/validation/runs/RUN-20261019-full-spoken-demo/manifest.json','utf8')).state;
async function probe(cancel:boolean){
 const ws=new WebSocket('ws://127.0.0.1:4317/session'),events:any[]=[];ws.on('message',data=>events.push(JSON.parse(data.toString())));
 await new Promise<void>((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 const send=(event:object)=>ws.send(JSON.stringify(event));
 async function until(predicate:(e:any)=>boolean){const start=performance.now();while(performance.now()-start<10000){const failure=events.find(e=>['error','agent_error'].includes(e.type));if(failure)throw Error(failure.message);const match=events.find(predicate);if(match)return match;await new Promise(r=>setTimeout(r,10));}throw Error('Probe timeout');}
 try{
  send({type:'presentation_load',state});await until(e=>e.type==='presentation_loaded');const start=performance.now();send({type:'presentation_start'});
  if(cancel){send({type:'presentation_stop'});await new Promise(r=>setTimeout(r,500));if(events.some(e=>e.type==='presentation_ready'))throw Error('Cancelled preparation reported ready');return {cancel,events};}
  await until(e=>e.type==='presentation_ready');const readinessMs=performance.now()-start;send({type:'presentation_speech',text:'Daily curve'});const decision=await until(e=>e.type==='direction_completed');
  if(decision.composition.blocks.length!==4)throw Error('Synthesis changed');
  if(events.findIndex(e=>e.type==='presentation_trace'&&e.stage==='refresh'&&e.phase==='complete')>events.findIndex(e=>e.type==='presentation_ready'))throw Error('Index was not ready before acknowledgement');
  return {cancel,readinessMs,inferenceMs:decision.inferenceMs,blocks:decision.composition.blocks.length,events};
 }finally{ws.close();}
}
const completed=await probe(false),cancelled=await probe(true);await writeFile(`${directory}/live.json`,JSON.stringify({scope:'Actual loopback WebSocket readiness/stop/commit integration; text input, no audio or hosted selection',completed,cancelled},null,2));console.log(JSON.stringify({readyMs:completed.readinessMs,inferenceMs:completed.inferenceMs,blocks:completed.blocks,cancelled:!cancelled.events.some(e=>e.type==='presentation_ready')}));
