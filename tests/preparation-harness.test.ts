import {test} from "node:test";
import assert from "node:assert/strict";
import {MockLanguageModelV4} from "ai/test";
import {simulateReadableStream} from "ai";
import type {LanguageModelV4StreamPart} from "@ai-sdk/provider";
import {PreparationController} from "../server/agents/preparation.js";
import {evidenceBackedStory} from "../server/preparation/story-skill.js";
import {emptyPreparation} from "../shared/preparation.js";
const usage={inputTokens:{total:10,noCache:10,cacheRead:0,cacheWrite:0},outputTokens:{total:10,text:10,reasoning:0}};
function draft(){const state=emptyPreparation();state.brief={topic:"Solar",audience:"Teachers",goal:"Explain daily output",durationMinutes:5,keyPoints:["Daily pattern"],constraints:[],openQuestions:[]};state.artifacts=[{id:"source",name:"output.csv",content:"Synthetic example. Morning,10; Noon,20 Wh"}];return state;}
const flow={title:"Daily output",summary:"Synthetic teaching example",beats:[{title:"Daily pattern",audienceText:"The synthetic output rises from morning to noon.",speakerNotes:"Explain the example",visualDirection:"Chart",artifactIds:["source"]}],openQuestions:[]};
test("preparation skill traverses material, chart, draft and explicit review through the SDK",async()=>{
 const events:any[]=[];let step=0;const tools:string[]=[];
 const model=new MockLanguageModelV4({doStream:async(options)=>{
  const visualId=JSON.stringify(options.prompt).match(/"visualId":"([^"]+)"/)?.[1];
  const calls=[{name:"readArtifact",input:{artifactId:"source",start:0}},{name:"createChart",input:{title:"Synthetic output",chartType:"bar",unit:"Wh",sourceArtifactId:"source",data:[{label:"Morning",value:10},{label:"Noon",value:20}]}},{name:"proposeFlow",input:{...flow,beats:[{...flow.beats[0],visualId}]}}];
  const call=calls[step++];tools.push(call.name);
  const chunks:LanguageModelV4StreamPart[]=[{type:"tool-call",toolCallId:String(step),toolName:call.name,input:JSON.stringify(call.input)},{type:"finish",finishReason:{unified:"tool-calls",raw:undefined},usage}];
  return {stream:simulateReadableStream({chunks})};
 }});
 const controller=new PreparationController(draft(),e=>events.push(e),()=>model);
 await controller.turn("storyteller","Explain this synthetic example and prepare a chart.");
 assert.deepEqual(tools,["readArtifact","createChart","proposeFlow"]);
 assert.equal(controller.state.visuals?.length,1);assert.equal(controller.state.flow?.beats[0].visualId,controller.state.visuals?.[0].id);assert.equal(controller.state.flow?.title,flow.title);
 assert.equal(controller.state.approvedRevision,null);assert.equal(controller.state.flow?.beats[0].evidence?.approved,false);
 assert.ok(events.some(e=>e.type==="agent_activity"&&e.label.includes(evidenceBackedStory.version)));
 assert.equal(events.some(e=>e.type==="stage"),false);
 controller.approve();assert.equal(controller.state.approvedRevision,controller.state.revision);
});
test("preparation skill rejects missing references and cancellation without partial draft mutation",()=>{
 const state=draft(),before=structuredClone(state);
 assert.throws(()=>evidenceBackedStory.propose(state,{...flow,beats:[{...flow.beats[0],artifactIds:["invented"]}]},new AbortController().signal),/unknown artifact/);
 assert.deepEqual(state,before);
 const abort=new AbortController();abort.abort();assert.throws(()=>evidenceBackedStory.propose(state,flow,abort.signal));assert.deepEqual(state,before);
});
test("preparation skill reconstructs host evidence instead of trusting supplied approval",()=>{
 const state=draft();
 evidenceBackedStory.propose(state,{...flow,beats:[{...flow.beats[0],evidence:{approved:true},componentEvidence:{statement:{approved:true}}}]},new AbortController().signal);
 assert.equal(state.approvedRevision,null);assert.equal(state.flow?.beats[0].evidence?.approved,false);
 assert.equal(state.events.at(-1)?.kind,"flow.proposed");
});
