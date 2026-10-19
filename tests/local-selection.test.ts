import {test} from 'node:test';
import assert from 'node:assert/strict';
import {synthesisContext} from './fixtures/synthesis-context.js';
import {LocalHybridSelector,ClassifierPreferenceSelector,eligibleAssets,type SelectionContext} from '../server/presentation/selection.js';
import {BaselinePresenter} from '../server/presentation/baseline.js';
import {createPresenter} from '../server/presentation/factory.js';
import {compositionPlanner} from '../server/presentation/composition.js';
const signal=()=>new AbortController().signal;
const embedding={space:{model:'fixture',revision:'1',dimensions:2},async encode(texts:string[]){return texts.map(()=>[1,0]);}};
function context():SelectionContext{const c=synthesisContext();return {speech:'Morning output',assets:c.catalog.assets,intent:c.frame.intent,current:null,requireIndependentReview:false};}
test("local selector proposes only complete eligible evidence and never broadens missing scope",async()=>{
 const selector=new LocalHybridSelector(),c=context();assert.ok(eligibleAssets(c).length);const result=await selector.select(c,signal());assert.ok(eligibleAssets(c).some(a=>a.id===result.selected));
 const missing={...c,intent:{...c.intent,claims:[...c.intent.claims,'unknown-obligation']}};assert.deepEqual(await selector.select(missing,signal()),{action:'context',selected:null});
 const reviewed={...c,requireIndependentReview:true};assert.equal((await selector.select(reviewed,signal())).selected,null);
 const unique={...c,assets:eligibleAssets(c).slice(0,1)};assert.equal(selector.preselect(unique)?.selected,unique.assets[0].id);
});
test("classifier preference cannot see ineligible components or return unbound IDs",async()=>{
 const c=context();c.intent={...c.intent,family:null};let called=0;
 const selector=new ClassifierPreferenceSelector({id:'fake',async choose(_speech,assets){called++;assert.deepEqual(assets.map(a=>a.id),eligibleAssets(c).map(a=>a.id));return 'not-in-menu';}});
 const fallback=await selector.select(c,signal());assert.equal(fallback.selected,eligibleAssets(c)[0].id);assert.equal(selector.stats.fallbacks,1);assert.equal(called,1);
 const abort=new AbortController();abort.abort();await assert.rejects(selector.select(c,abort.signal));assert.equal(called,1);
});
test("local selection overrides a provider and preserves synthesis and missing-evidence guards without provider calls",async()=>{
 let calls=0;const c=synthesisContext();const presenter=new BaselinePresenter(embedding,{id:'must-not-call',model:'unused',async decide(){calls++;throw Error('Provider must not run');}},undefined,undefined,undefined,compositionPlanner('synthesis'),new LocalHybridSelector());
 const show=await presenter.decide(c.state,c.current,'Explain Panels turn sunlight into electricity. This synthetic example peaks at noon.',signal());
 assert.ok(show.composition);assert.equal(show.composition.blocks.length,4);assert.equal(show.metadata?.selection,'local-hybrid');
 const unknown=await presenter.decide(c.state,c.current,'Show the installation cost',signal());assert.equal(unknown.composition,null);assert.equal(calls,0);
});
test("presentation factory defaults local even with a provider environment default; hosted comparisons require an explicit profile",async()=>{
 const previous=process.env.OMNIPRESENT_DECISION_MODEL;process.env.OMNIPRESENT_DECISION_MODEL='clef-omni';
 try{const local=createPresenter(undefined,embedding),c=synthesisContext();assert.equal(local.id,'local-hybrid');const result=await local.presenter.decide(c.state,c.current,'Morning output',signal());assert.equal(result.metadata?.selection,'local-hybrid');assert.equal(createPresenter('clef-omni',embedding).id,'clef-omni');assert.throws(()=>createPresenter('unknown',embedding));}
 finally{if(previous===undefined)delete process.env.OMNIPRESENT_DECISION_MODEL;else process.env.OMNIPRESENT_DECISION_MODEL=previous;}
});

test("preference deadline falls back locally; parent cancellation never commits a fallback",async()=>{
 const c=context();c.intent={...c.intent,family:null};
 const selector=new ClassifierPreferenceSelector({id:'stalled',choose:()=>new Promise(()=>{})},5);
 assert.equal((await selector.select(c,signal())).selected,eligibleAssets(c)[0].id);assert.equal(selector.stats.fallbacks,1);
 const abort=new AbortController();const pending=selector.select(c,abort.signal);abort.abort();await assert.rejects(pending);assert.equal(selector.stats.fallbacks,1);
});
test("preference has one preparation lifecycle and closes its resources",async()=>{
 let starts=0,closes=0;const selector=new ClassifierPreferenceSelector({id:'lifecycle',async start(){starts++;},close(){closes++;},async choose(_speech,assets){return assets[0].id;}});
 await Promise.all([selector.prepare(signal()),selector.prepare(signal())]);assert.equal(starts,1);selector.close();assert.equal(closes,1);
});
test("classifier selects an eligible alternative rather than simply returning the first rank",async()=>{
 const c=context();c.intent={...c.intent,family:null};const eligible=eligibleAssets(c);assert.ok(eligible.length>1);
 const wanted=eligible.at(-1)!.id;
 const selector=new ClassifierPreferenceSelector({id:'preference',async choose(){return wanted;}});
 assert.equal((await selector.select(c,signal())).selected,wanted);assert.equal(selector.stats.choices,1);
});
test("product factory defaults to validated synthesis and keeps small reranker explicit",async()=>{
 const c=synthesisContext(),active=createPresenter(undefined,embedding);
 const result=await active.presenter.decide(c.state,c.current,'Explain Panels turn sunlight into electricity. This synthetic example peaks at noon.',signal());
 assert.equal(result.metadata?.planner,'synthesis');assert.equal(result.composition?.blocks.length,4);
 const experiment=createPresenter('local-reranker',embedding);assert.equal(experiment.id,'local-reranker');experiment.presenter.close();active.presenter.close();
});
