import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compactAssets,localCases,precisionScreen} from '../scripts/compact-local-fixture.js';
import {validateEvidence} from '../server/controllers/evidence-contract.js';
test("compact local screen freezes balanced positives and negatives with valid full evidence outside model inputs",()=>{
 const assets=compactAssets();assert.equal(localCases.length,24);assert.equal(new Set(localCases.map(c=>c.id)).size,24);assert.equal(localCases.filter(c=>c.category==='positive').length,12);
 for(const list of Object.values(assets))for(const asset of list){validateEvidence(asset);assert.equal(asset.evidence.independentReview,'pending');}
 for(const c of localCases){assert.ok(assets[c.story]);assert.ok(['hold','context',...assets[c.story].map(a=>a.id)].includes(c.expected));}
 assert.ok(precisionScreen.minPositiveAccuracy>=.8);assert.ok(localCases.some(c=>c.slice==='extra-obligation'));assert.ok(localCases.some(c=>c.slice==='negation'));
});
