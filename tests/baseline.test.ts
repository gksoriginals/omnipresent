import {approvePreparedEvidence} from "../server/presentation/component-evidence.js";
import {test} from "node:test";
import assert from "node:assert/strict";
import {emptyPreparation} from "../shared/preparation.js";
import {prepareEvidence} from "../server/presentation/prepare-evidence.js";
import {presentationCatalog} from "../server/presentation/catalog.js";
import {BaselinePresenter} from "../server/presentation/baseline.js";
import {comparisonDecisionModel,decisionRegistry,ModelRegistry} from "../server/models/decisions.js";
function story(){const state=emptyPreparation();state.flow={title:"Solar story",summary:"How it works",openQuestions:[],beats:[{title:"Solar generation",audienceText:"Photovoltaic cells convert sunlight to electricity",speakerNotes:"PRIVATE",visualDirection:"statement",artifactIds:[]}]};state.flow=prepareEvidence(state.flow,state);approvePreparedEvidence(state.flow,state);state.approvedRevision=state.revision;state.flowBasedOnRevision=state.revision;return state;}
const embedder={space:{model:"fixture",revision:"1",dimensions:2},encode:async(t:string[])=>t.map(()=>[1,0])};
test("historical model registry retains Clef-omni and useful tested comparison models",()=>{assert.equal(comparisonDecisionModel("clef-omni").id,"clef-omni");for(const id of ["jev","laya","clef","clef-flash","clef-omni"])assert.equal(decisionRegistry.get(id).id,id);assert.throws(()=>decisionRegistry.get("kev"));const registry=new ModelRegistry<{id:string}>();registry.register({id:"a"});assert.throws(()=>registry.register({id:"a"}));});
test("catalog rejects legacy stories and does not silently invent contracts",()=>{const state=story();delete state.flow!.beats[0].evidence;assert.throws(()=>presentationCatalog(state),/predates/);});
test("default pipeline selects grounded prepared content without a model on exact supported cues",async()=>{let called=0;const p=new BaselinePresenter(embedder,{id:"fixture",model:"fixture",decide:async()=>{called++;throw Error("Unexpected inference");}});const state=story(),current={layout:"focus" as const,blocks:[{id:"primary" as const,kind:"statement" as const,beat:0,emphasis:"normal" as const,reveal:null}]};const result=await p.decide(state,current,"Solar generation",new AbortController().signal);assert.equal(result.composition?.blocks[0].beat,0);assert.equal(called,0);assert.equal(result.metadata?.baseline,"evidence-v1");const absent=await p.decide(state,current,"Show the actual Solar story solar generation statement including the payback period",new AbortController().signal);assert.equal(absent.composition,null);assert.ok(absent.question);});
test("new stories record explicit evidence status and speaker notes are excluded",()=>{const state=story();const c=presentationCatalog(state);assert.equal(c.assets[0].evidence.provenance,"illustrative");assert.equal(c.assets[0].evidence.independentReview,"pending");assert.ok(!JSON.stringify(c).includes("PRIVATE"));});
test("baseline trace metadata correlates final validation and decisions without transcripts",async()=>{
 const events:import("../server/experiments/trace.js").TraceEvent[]=[];
 const p=new BaselinePresenter(embedder,{id:"fixture",model:"fixture",async decide(){throw Error("Unexpected model");}},undefined,undefined,{write:event=>events.push(event)});
 const state=story(),current={layout:"focus" as const,blocks:[{id:"primary" as const,kind:"statement" as const,beat:0,emphasis:"normal" as const,reveal:null}]};
 const result=await p.decide(state,current,"Solar generation",new AbortController().signal);
 assert.ok(result.metadata?.requestId);for(const stage of ["refresh","eligibility","final-evidence","decision"])assert.ok(events.some(e=>e.stage===stage&&e.requestId===result.metadata?.requestId),stage);
 assert.ok(!JSON.stringify(events).includes("Photovoltaic"));assert.ok(!JSON.stringify(events).includes("PRIVATE"));
});
