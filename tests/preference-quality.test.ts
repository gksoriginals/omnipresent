import {test} from 'node:test';
import assert from 'node:assert/strict';
import {preferenceQualityFixture} from '../scripts/preference-quality-fixture.js';
import {supportsEvidence} from '../server/controllers/evidence-contract.js';
test("preference fixture has a single declared target among five fully eligible alternatives",()=>{
 const f=preferenceQualityFixture();assert.equal(f.groups.flatMap(g=>g.cases).length,32);
 for(const g of f.groups){assert.equal(g.assets.length,5);for(const a of g.assets)assert.equal(supportsEvidence(a,g.intent,false),true);for(const c of g.cases)assert.equal(g.assets.filter(a=>a.id===c.expected).length,1);assert.equal(g.assets.some(a=>supportsEvidence(a,{...g.intent,claims:[...g.intent.claims,'absent']},false)),false);}
});
