import {readFile,writeFile} from "node:fs/promises";
import {PreparationController} from "../server/agents/preparation.js";
import {localModel} from "../server/agents/model.js";
const previous=JSON.parse(await readFile("output/full-demo/preparation.json","utf8"));const events=previous.events;
const a=new PreparationController(previous.state,event=>events.push(event),localModel),flow=structuredClone(a.state.flow!);
const visuals=a.state.visuals??[];for(const [index,title] of ["Morning output","Daily curve","Storage reserves"].entries()){const visual=visuals.find(v=>v.spec.title===title);if(!visual)throw Error("Missing generated visual "+title);flow.beats[index].visualId=visual.id;}
flow.beats[0].imageArtifactId=a.state.artifacts.find(a=>a.media)!.id;
flow.beats[2].componentClaims={...flow.beats[2].componentClaims,visual:["beat:2"]};a.editFlow(flow);a.approve();
const pack=JSON.parse(await readFile("output/adaptive-trial/manifest.json","utf8"));pack.state=a.state;pack.preparationEvents=events;pack.variants=[{id:"generation-first",title:"Generation → storage → generation",paragraphs:["Morning output.",flow.beats[0].audienceText,"Storage reserves.",flow.beats[2].audienceText,"Daily curve.","Checking the microphone."]},{id:"storage-first",title:"Storage → generation → storage",paragraphs:["Storage reserves.",flow.beats[2].audienceText,"Morning output.",flow.beats[0].audienceText,"Storage reserves."]},{id:"detour-and-return",title:"Generation, off-topic hold and return",paragraphs:["Morning output.","Checking the microphone.","Storage reserves.","Daily curve."]}].map(v=>({...v,audio:`/api/trial/${v.id}.wav`}));
pack.presenterReview={correction:"Storage chart coverage changed from generation beat:0 to its storage beat:2 and missing chart/image IDs linked through editFlow, then approved.",agentCorrectionSucceeded:false};
await writeFile("output/adaptive-trial/manifest.json",JSON.stringify(pack,null,2));await writeFile("output/full-demo/manifest.json",JSON.stringify(pack,null,2));console.log(JSON.stringify({flow:a.state.flow?.beats.map(b=>({title:b.title,coverage:b.componentClaims})),visuals:a.state.visuals},null,2));
