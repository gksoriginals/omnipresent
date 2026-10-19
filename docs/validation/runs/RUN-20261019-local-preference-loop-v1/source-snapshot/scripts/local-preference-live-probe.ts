import WebSocket from 'ws';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const directory=process.argv[2];if(!directory||!/^output\/[\w/-]+$/.test(directory))throw Error('Provide output/<unique-run>');await mkdir(directory,{recursive:true});
const state=JSON.parse(await readFile('docs/validation/runs/RUN-20261019-full-spoken-demo/manifest.json','utf8')).state;
const ws=new WebSocket('ws://127.0.0.1:4317/session'),events:any[]=[];
ws.on('message',bytes=>events.push(JSON.parse(bytes.toString())));await new Promise<void>((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
const send=(data:object)=>ws.send(JSON.stringify(data));
async function until(predicate:(e:any)=>boolean,from=0){const began=performance.now();while(performance.now()-began<60000){const failure=events.slice(from).find(e=>['agent_error','error'].includes(e.type));if(failure)throw Error(failure.message);const event=events.slice(from).find(predicate);if(event)return event;await new Promise(r=>setTimeout(r,10));}throw Error('Live local-only probe timed out');}
try{
 send({type:'presentation_load',state,decision:'local-classifier',projectId:'local-classifier-project',storyId:'local-classifier-story'});const loaded=await until(e=>e.type==='presentation_loaded');if(loaded.decision!=='local-classifier')throw Error('Default presentation is not local');
 send({type:'presentation_start',requestId:'local-only'});await until(e=>e.type==='presentation_ready'&&e.requestId==='local-only');
 send({type:'presentation_speech',text:'Explain Solar panels turn sunlight into electricity.'});const first=await until(e=>e.type==='direction_completed');
 if(first.composition.blocks.length!==4||!first.decision.selection?.startsWith('local-preference:'))throw Error('Local synthesis did not preserve rich composition');
 const from=events.length;send({type:'presentation_speech',text:'Show the installation cost'});const missing=await until(e=>e.type==='direction_completed',from);
 if(!missing.held||missing.decision.action!=='context')throw Error('Missing-evidence behavior changed');
 const feedback=await until(e=>e.type==='presentation_feedback',from);if(feedback.projectId!=='local-classifier-project'||feedback.storyId!=='local-classifier-story')throw Error('Feedback lost its Prepare origin');
 if(events.some(e=>e.stage==='model-attempt'))throw Error('Default path attempted provider inference');
 const summary={default:loaded.decision,blocks:first.composition.blocks.length,inferenceMs:first.inferenceMs,missingHeld:missing.held,feedbackRouted:true,preference:first.decision.preference,providerAttempts:0,scope:'Actual local coordinator and embedding service; text speech events, not STT or browser paint.'};
 await writeFile(`${directory}/live.json`,JSON.stringify({summary,events},null,2));console.log(JSON.stringify(summary));
}finally{ws.close();}
