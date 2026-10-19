import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const primary='docs/validation/runs/RUN-20261017-semantic-selection-v1/retrieval-selection.json';
const previousRaw='docs/validation/runs/RUN-20261017-semantic-selection-raw-v2/retrieval-selection.json';
const paths=['docs/validation/runs/RUN-20261017-clef-comparison-v1/retrieval-selection.json','docs/validation/runs/RUN-20261017-clef-omni-jev-reference/retrieval-selection.json'];
const reference=new Map();const sources=[];
for(const path of [primary,previousRaw]){
 const content=await readFile(path);sources.push({path,sha256:createHash('sha256').update(content).digest('hex')});
 for(const row of JSON.parse(content).selection.filter(r=>r.provider==='jev'))reference.set(`${row.method}/${row.id}`,row.request);
}
let matchedRequests=0;const arms=[];
for(const path of paths){
 const content=await readFile(path);sources.push({path,sha256:createHash('sha256').update(content).digest('hex')});const report=JSON.parse(content);
 assert.equal(report.design.threshold,0.7);
 for(const row of report.selection){assert.deepEqual(row.request,reference.get(`${row.method}/${row.id}`),`Request changed: ${row.provider}/${row.method}/${row.id}`);matchedRequests++;}
 for(const summary of report.selectionSummary){
  const rows=report.selection.filter(r=>r.provider===summary.provider&&r.method===summary.method);
  arms.push({...summary,run:report.id,spentUSD:rows.reduce((n,r)=>n+(r.raw?.usage?.cost??0),0),models:[...new Set(rows.map(r=>r.raw?.model??null))],failures:rows.filter(r=>!r.correct).map(r=>({id:r.id,expectedAction:r.expectedAction,actualAction:r.actualAction,expectedBeats:r.expectedBeats,actualBeats:r.actualBeats,error:r.error}))});
 }
}
const connectivityPath='docs/validation/runs/RUN-20261017-clef-connectivity/connectivity.json';const connectivity=JSON.parse(await readFile(connectivityPath,'utf8'));
const qualityCostUSD=arms.reduce((n,r)=>n+r.spentUSD,0),connectivityCostUSD=connectivity.results.reduce((n,r)=>n+(r.raw?.usage?.cost??0),0);
const output='docs/validation/runs/RUN-20261017-clef-comparison-v1/paired-summary.json';
await writeFile(output,JSON.stringify({recordedAt:new Date().toISOString(),scope:'Derived paired comparison; reuses original cases, not independent new trials. Requests match retained earlier Jev inputs, excluding the transport model selector.',sources,matchedRequests,qualityCostUSD,connectivityCostUSD,totalRecordedCostUSD:qualityCostUSD+connectivityCostUSD,arms},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,matchedRequests,qualityCostUSD,connectivityCostUSD,totalRecordedCostUSD:qualityCostUSD+connectivityCostUSD},null,2));
