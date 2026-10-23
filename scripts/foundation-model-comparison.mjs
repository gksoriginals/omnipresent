import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';

const runId='RUN-20261023-foundation-model-feasibility';
const runDir=`docs/validation/runs/${runId}`;
const cases=JSON.parse(await readFile(`${runDir}/cases.json`,'utf8'));
const model=process.env.OMNIPRESENT_LOCAL_MODEL??'qwen3.5:4b';
const endpoint=(process.env.OMNIPRESENT_OLLAMA_URL??'http://127.0.0.1:11434').replace(/\/$/,'');
const binary=`/tmp/omni-foundation-model-probe-${process.pid}`;
const compile=spawnSync('swiftc',['-parse-as-library','-target','arm64-apple-macosx26.0','-framework','FoundationModels','scripts/foundation-model-probe.swift','-o',binary],{encoding:'utf8'});
if(compile.status!==0)throw Error(`Foundation Models probe compilation failed:\n${compile.stderr}`);

function score(response,testCase){
  let value;try{value=JSON.parse(response);}catch{return {validJSON:false,validShape:false,unknownSourceIDs:null,usedRequiredSourceIDs:[]};}
  const beats=Array.isArray(value.beats)?value.beats:[];
  const refs=beats.flatMap(beat=>Array.isArray(beat.sourceIDs)?beat.sourceIDs:[]);
  return {
    validJSON:true,
    validShape:typeof value.title==='string'&&beats.length===3&&beats.every(beat=>typeof beat.title==='string'&&typeof beat.claim==='string'&&Array.isArray(beat.sourceIDs))&&Array.isArray(value.missingEvidence)&&typeof value.questionForPresenter==='string',
    unknownSourceIDs:[...new Set(refs.filter(id=>!testCase.allowedSourceIDs.includes(id)))],
    usedRequiredSourceIDs:testCase.requiredSourceIDs.filter(id=>refs.includes(id)),
    missingEvidence:value.missingEvidence,
    response:value,
  };
}

async function native(testCase){
  const payload=JSON.stringify({instructions:cases.instructions,prompt:testCase.prompt});
  const began=performance.now();
  const result=spawnSync(binary,[],{input:payload,encoding:'utf8',timeout:180000,maxBuffer:2_000_000});
  if(result.status!==0)throw Error(`Foundation Models failed for ${testCase.id} (status ${result.status}): ${result.stderr}`);
  const output=JSON.parse(result.stdout.trim());
  return {elapsedMs:performance.now()-began,contextSize:output.contextSize,...score(output.response,testCase)};
}

async function local(testCase){
  const began=performance.now();
  const response=await fetch(`${endpoint}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,format:'json',options:{temperature:0},messages:[{role:'system',content:`${cases.instructions} Return only this JSON object shape: {"title":"string","beats":[{"title":"string","claim":"string","sourceIDs":["string"]}],"missingEvidence":["string"],"questionForPresenter":"string"}. beats must contain exactly three items.`},{role:'user',content:testCase.prompt}] }),signal:AbortSignal.timeout(180000)});
  if(!response.ok)throw Error(`Local Ollama returned HTTP ${response.status} for ${testCase.id}.`);
  const body=await response.json();
  const content=body.message?.content;
  if(typeof content!=='string')throw Error(`Local Ollama returned no text for ${testCase.id}.`);
  return {elapsedMs:performance.now()-began,...score(content,testCase)};
}

const tags=await fetch(`${endpoint}/api/tags`,{signal:AbortSignal.timeout(3000)});
if(!tags.ok)throw Error('Existing local Ollama service is unavailable; no weights will be downloaded.');
const inventory=await tags.json();
if(!inventory.models?.some(item=>item.name===model||item.name.split(':')[0]===model.split(':')[0]))throw Error(`Local model ${model} is not installed; no weights will be downloaded.`);

const results=[];
for(const testCase of cases.cases){
  results.push({caseId:testCase.id,foundationModels:await native(testCase),ollama:{model,...await local(testCase)}});
}
const output={runId,recordedAt:new Date().toISOString(),scope:'Two frozen synthetic preparation cases; one call per provider and case; on-device Foundation Models versus installed local Ollama Qwen; no hosted inference.',foundationModels:{framework:'Apple FoundationModels',model:'SystemLanguageModel.default',availability:'available',contextSize:results[0]?.foundationModels.contextSize},ollama:{model,endpoint:`${new URL(endpoint).host}`},results,limitations:['Two authored feasibility cases are not an independent benchmark.','Semantic factual support and abstention require human review.','The probe tests guided single-response generation only, not AI SDK tool-loop, long-source, cancellation, app lifecycle, latency under load, or production behavior.']};
await mkdir(runDir,{recursive:true});
await writeFile(`${runDir}/comparison.json`,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({runId,results:results.map(({caseId,foundationModels,ollama})=>({caseId,foundationModels:{elapsedMs:foundationModels.elapsedMs,validShape:foundationModels.validShape,unknownSourceIDs:foundationModels.unknownSourceIDs,usedRequiredSourceIDs:foundationModels.usedRequiredSourceIDs},ollama:{elapsedMs:ollama.elapsedMs,validShape:ollama.validShape,unknownSourceIDs:ollama.unknownSourceIDs,usedRequiredSourceIDs:ollama.usedRequiredSourceIDs}}))},null,2));
