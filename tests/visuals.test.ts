import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAgent, validateReferences } from "../server/agents/preparation.js";
import { emptyPreparation } from "../shared/preparation.js";
import { diagramSource, diagramSchema, chartSchema } from "../shared/visuals.js";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { simulateReadableStream } from "ai";
const usage = { inputTokens: {total:10, noCache:10, cacheRead:0, cacheWrite:0}, outputTokens:{total:10,text:10,reasoning:0} };
async function call(name: string, input: unknown, state = emptyPreparation()) {
 let step = 0;
 const model = new MockLanguageModelV4({doStream: async () => ({stream: simulateReadableStream<LanguageModelV4StreamPart>({chunks:step++ === 0 ? [
  {type:"tool-call",toolCallId:"visual",toolName:name,input:JSON.stringify(input)},
  {type:"finish",finishReason:{unified:"tool-calls",raw:undefined},usage},
 ] : [{type:"tool-call",toolCallId:"flow",toolName:"proposeFlow",input:JSON.stringify({title:"Visual story",summary:"Prepared visual",openQuestions:[],beats:[{title:"Visual",audienceText:"Prepared source content",speakerNotes:"Private",visualDirection:"Use the prepared visual",artifactIds:state.artifacts.map(a=>a.id),visualId:state.visuals?.[0]?.id}]})},{type:"finish",finishReason:{unified:"tool-calls",raw:undefined},usage}]})})});
 const agent = buildAgent("storyteller", model, state, new AbortController().signal, () => {});
 const result = await agent.stream({prompt:"Prepare the requested visual"});
 for await (const part of result.fullStream) { if (part.type === "tool-error" || part.type === "error") throw part.error; }
 return state;
}
test("diagram tool prepares a reusable visual; malformed edges are rejected", async () => {
 const spec = diagramSchema.parse({kind:"diagram",title:"Energy",nodes:["Sun", "Panel"],edges:[{from:0,to:1}]});
 const state = await call("createDiagram",spec);
 assert.equal(state.visuals?.[0].spec.kind, "diagram");
 await assert.rejects(() => call("createDiagram",{...spec,edges:[{from:0,to:3}]}));
 assert.ok(!diagramSource({...spec,nodes:['<script>evil</script>', 'click n0']} ).includes("<script>"));
});
test("chart tool requires known source labels and numbers", async () => {
 const state = emptyPreparation(); state.artifacts.push({id:"source",name:"sales.csv",content:"label,value\nFirst,10\nSecond,20"});
 const spec = chartSchema.parse({kind:"chart",title:"Sales",chartType:"bar",unit:"units",sourceArtifactId:"source",data:[{label:"First",value:10}]});
 const result = await call("createChart",spec,state); assert.equal(result.visuals?.length,1);
 await assert.rejects(() => call("createChart",{...spec,data:[{label:"First",value:1}]},state));
 await assert.rejects(() => call("createChart",{...spec,sourceArtifactId:"unknown"},state));
});
test("flow references must point to existing prepared visuals", () => {
 assert.throws(() => validateReferences({title:"Story",summary:"Summary",openQuestions:[],beats:[{title:"Beat",speakerNotes:"Notes",visualDirection:"Diagram",artifactIds:[],visualId:"missing"}]},emptyPreparation()));
});
