import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as wait} from 'node:timers/promises';
import {performance} from 'node:perf_hooks';
import {BaselinePresenter} from '../server/presentation/baseline.js';
import {EmbeddingGemmaModel} from '../server/models/embeddings.js';
import {ClassifierPreferenceSelector,LocalHybridSelector} from '../server/presentation/selection.js';
import {LocalClassifierPreference} from '../server/models/local-preference.js';
import {compositionPlanner} from '../server/presentation/composition.js';
import {AdaptiveController} from '../server/agents/adaptive.js';
import {Session} from '../server/session.js';
const id=process.argv[2];if(!id||!/^RUN-[\w-]+$/.test(id))throw Error('Unique run ID required');
const dir=`docs/validation/runs/${id}`;await mkdir(dir);
const manifest=JSON.parse(await readFile('output/preference-audio/manifest.json','utf8'));
const state=JSON.parse(await readFile('docs/validation/runs/RUN-20261019-full-spoken-demo/manifest.json','utf8')).state;
const input={manifest,state,arms:['hybrid','gliner','minilm'],scope:'Actual paced Piper PCM, Moonshine streaming STT, presenter and AdaptiveController commit; excludes browser rendering and microphone capture.'};
await writeFile(`${dir}/inputs.json`,JSON.stringify(input,null,2));
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),sourceFiles=[];
for(const path of ['scripts/preference-audio-loop.ts','scripts/synthesize-preference-audio.py','runtime/worker.py','runtime/requirements.lock','runtime/tts-model.json','runtime/preference_worker.py','runtime/reranker_preference_worker.py','runtime/preference-reranker-model.json','server/presentation/baseline.ts','server/presentation/selection.ts','server/presentation/request-frame.ts','server/presentation/composition.ts','server/models/local-preference.ts','server/agents/adaptive.ts','server/session.ts']){const b=await readFile(path),target=`${dir}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,b);sourceFiles.push({path,sha256:hash(b)});}
for(const c of manifest.cases){const pcm=await readFile(`output/preference-audio/${c.pcm}`);if(hash(pcm)!==c.sha256)throw Error('Audio changed');await writeFile(`${dir}/${c.pcm}`,pcm);}
const worker=spawn('.venv/bin/python',['-u','runtime/worker.py'],{stdio:'pipe'}),events:any[]=[],rows:any[]=[],resources:any[]=[];
let adaptive:AdaptiveController|undefined,diagnostics='';worker.stderr.on('data',b=>diagnostics=(diagnostics+b).slice(-2000));
createInterface({input:worker.stdout}).on('line',line=>{const e={...JSON.parse(line),at:performance.now()};events.push(e);if(e.type==='transcript'&&e.final&&adaptive)void adaptive.accept(e.text);});
const send=(e:object)=>worker.stdin.write(JSON.stringify(e)+'\n');
async function until(predicate:(e:any)=>boolean,from=0,timeout=60000){const start=performance.now();while(performance.now()-start<timeout){const error=events.slice(from).find(e=>['worker_error','agent_error'].includes(e.type));if(error)throw Error(error.message);const e=events.slice(from).find(predicate);if(e)return e;await wait(10);}throw Error('Speech loop timeout: '+diagnostics);}
try{
 const sttStarted=performance.now();send({type:'load'});await until(e=>e.type==='worker_status'&&e.status==='ready');resources.push({arm:'stt',readyMs:performance.now()-sttStarted});
 for(const arm of input.arms){
  const model=arm==='hybrid'?null:new LocalClassifierPreference(arm,arm==='gliner'?'runtime/preference_worker.py':'runtime/reranker_preference_worker.py');
  const presenter=new BaselinePresenter(new EmbeddingGemmaModel(),null,undefined,undefined,undefined,compositionPlanner('synthesis'),model?new ClassifierPreferenceSelector(model):new LocalHybridSelector());
  const emit=(event:Record<string,unknown>)=>events.push({...event,arm,at:performance.now()});
  const session=new Session(emit);adaptive=new AdaptiveController(session,emit,question=>emit({type:'feedback',question}),presenter.decide);
  try{
   const started=performance.now();await adaptive.start(state);resources.push({arm,readyMs:performance.now()-started});
   for(const c of manifest.cases){
    const from=events.length,previous=JSON.stringify(session.stage.composition),pcm=await readFile(`${dir}/${c.pcm}`);
    send({type:'start'});await until(e=>e.type==='worker_status'&&e.status==='listening',from);
    const began=performance.now();let sequence=0;
    for(let offset=0;offset<pcm.length;offset+=8000){const delay=began+offset/32-performance.now();if(delay>0)await wait(delay);send({type:'audio',pcm:pcm.subarray(offset,offset+8000).toString('base64'),sampleRate:16000,sequence:sequence++});}
    send({type:'stop'});await until(e=>e.type==='worker_status'&&e.status==='ready',from);
    const direction=await until(e=>e.type==='direction_completed'&&e.arm===arm,from,15000),final=events.slice(from).find(e=>e.type==='transcript'&&e.final);
    const unchanged=JSON.stringify(session.stage.composition)===previous;
    rows.push({arm,id:c.id,expected:c.expected,actual:direction.decision.action,correct:direction.decision.action===c.expected,transcript:final?.text,generatedAudioEndToFinalMs:final?final.at-(began+c.speechSamples/16):null,finalToDirectionMs:final?direction.at-final.at:null,inferenceMs:direction.inferenceMs,held:direction.held,unchanged,blocks:direction.composition.blocks.length,preference:direction.decision.preference,feedback:events.slice(from).filter(e=>e.type==='feedback').map(e=>e.question)});
    console.log(JSON.stringify(rows.at(-1)));
   }
   if(model)resources.push({arm,stats:model.stats,resources:model.resources});
  }finally{adaptive.stop();adaptive=undefined;presenter.close();}
 }
}finally{send({type:'close'});worker.stdin.end();worker.kill();}
await writeFile(`${dir}/local.json`,JSON.stringify({id,inputHash:hash(await readFile(`${dir}/inputs.json`)),sourceFiles,scope:input.scope,resources,rows,events,limitations:['Three authored TTS utterances, one pass per arm; not representative preference-quality acceptance.','Final-to-direction includes host processing, not browser paint.','Audio timing is relative to generated PCM end, which may contain voice trailing silence.','Earlier preference-quality test uses oracle intent; this loop uses the real request interpreter.']},null,2));
if(rows.some(r=>!r.correct))process.exitCode=1;
