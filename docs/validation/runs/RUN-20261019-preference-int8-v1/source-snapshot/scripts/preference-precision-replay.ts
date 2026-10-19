import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {LocalClassifierPreference} from '../server/models/local-preference.js';
import {ClassifierPreferenceSelector,type SelectionContext} from '../server/presentation/selection.js';
const id=process.argv[2];if(!id||!/^RUN-[\w-]+$/.test(id))throw Error('Unique run ID required');const dir=`docs/validation/runs/${id}`;await mkdir(dir);
const parent='docs/validation/runs/RUN-20261019-preference-quality-v1';
const bytes=await readFile(`${parent}/inputs.json`),inputs=JSON.parse(bytes.toString());await writeFile(`${dir}/inputs.json`,bytes);
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),sourceFiles=[];
for(const path of ['scripts/preference-precision-replay.ts','runtime/preference_worker.py','server/models/local-preference.ts','server/presentation/selection.ts','runtime/classifier-requirements.lock']){const b=await readFile(path),target=`${dir}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,b);sourceFiles.push({path,sha256:hash(b)});}
const model=new LocalClassifierPreference('gliner-int8','runtime/preference_worker.py',['--int8']),selector=new ClassifierPreferenceSelector(model,300),rows:any[]=[],raw:any[]=[];
let error:string|undefined;
try{
 await selector.prepare(AbortSignal.timeout(60000));
 for(let pass=0;pass<3;pass++)for(const g of inputs.groups)for(const test of g.cases){
  const menu=[...g.assets.slice(pass),...g.assets.slice(0,pass)],context:SelectionContext={speech:test.speech,assets:menu,intent:g.intent,current:null,requireIndependentReview:false},before=selector.stats.fallbacks,began=performance.now();
  const result=await selector.select(context,AbortSignal.timeout(10000));rows.push({id:test.id,pass,selected:result.selected,expected:test.expected,correct:result.selected===test.expected,fallback:selector.stats.fallbacks>before,elapsedMs:performance.now()-began});
  const rawStart=performance.now();try{const selected=await model.choose(test.speech,menu,AbortSignal.timeout(10000));raw.push({id:test.id,pass,selected,correct:selected===test.expected,elapsedMs:performance.now()-rawStart});}catch(e){raw.push({id:test.id,pass,error:String(e),correct:false});}
 }
}catch(e){error=String(e);}finally{selector.close();}
const sorted=rows.map(r=>r.elapsedMs).sort((a,b)=>a-b),summary={total:rows.length,correct:rows.filter(r=>r.correct).length,fallbacks:rows.filter(r=>r.fallback).length,rawCorrect:raw.filter(r=>r.correct).length,rawTotal:raw.length,medianMs:sorted[Math.ceil(sorted.length*.5)-1],p95Ms:sorted[Math.ceil(sorted.length*.95)-1]};
await writeFile(`${dir}/replay.json`,JSON.stringify({id,inputHash:hash(bytes),sourceFiles,parent,scope:'INT8 diagnostic on frozen narrow preference set; rotated eligible menu only, excludes retrieval, STT and paint. Distinct from earlier failed full-action precision gate.',precision:'PyTorch dynamic INT8 Linear / qnnpack; embeddings and other operations may remain FP32',error,stats:model.stats,resources:model.resources,summary,rows,raw},null,2));console.log(JSON.stringify({error,summary,stats:model.stats,resources:model.resources},null,2));
