import {test} from "node:test";
import assert from "node:assert/strict";
import {storyRequestFrame} from "../server/presentation/request-frame.js";
import {contractedLibrary} from "../scripts/evidence-fixtures.js";
const assets=contractedLibrary().filter(a=>a.entity==="Harbor School"&&a.status==="actual");
test("request frames preserve speech and record inferred scope without inventing time",()=>{
 const speech="Explain solar generation";const frame=storyRequestFrame(speech,assets,"revision-1");
 assert.equal(frame.transcript,speech);assert.equal(frame.revision,"revision-1");
 assert.equal(frame.inferred.entity,"Harbor School");assert.equal(frame.inferred.provenance,"actual");
 assert.equal(frame.intent.mode,"clarify");assert.equal(frame.intent.reason,"unspecified-timeframe");
 assert.ok(Object.isFrozen(frame));assert.ok(Object.isFrozen(frame.intent.claims));
});
test("request frames preserve explicit scope, unknown obligations and quoted speech",()=>{
 const explicit=storyRequestFrame("Show the actual 2025 Harbor School solar generation chart",assets,"r");
 assert.equal(explicit.intent.mode,"present");assert.deepEqual(explicit.inferred,{entity:null,provenance:null,family:null});
 assert.equal(storyRequestFrame('"Explain solar generation"',assets,"r").intent.mode,"hold");
 assert.equal(storyRequestFrame("Explain solar generation including warranty",assets,"r").intent.mode,"missing");
 const ambiguous=storyRequestFrame("Explain solar generation",contractedLibrary(),"r");
 assert.equal(ambiguous.inferred.entity,null);
});
