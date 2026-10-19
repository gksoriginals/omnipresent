import { generateText } from "ai";
import { createParser } from "@openuidev/react-lang";
import { presentationLibrary } from "../app/src/AdaptiveCanvas.js";
import { localModel } from "../server/agents/model.js";
import { readFile,writeFile } from "node:fs/promises";
import { validateComposition } from "../shared/adaptive.js";
const pack=JSON.parse(await readFile("output/adaptive-trial/manifest.json","utf8"));
const parser=createParser(presentationLibrary.toJSONSchema(),presentationLibrary.root);
const cases=["Focus on battery storage after sunset.","Compare panels generating electricity with batteries storing electricity; show both together."];
const results=[];
for(const engine of ["openui","json-render"]){for(const request of cases){
 const prompt=engine==="openui"?presentationLibrary.prompt():`Output only a JSON object {root:"root",elements:{root:{type:"PresentationCanvas",props:{layout:"focus"|"split"|"sequence"},children:["primary","secondary"]},primary:{type:"PresentationBlock",props:{id:"primary",kind:"statement"|"visual"|"image",beat:0,emphasis:"normal"|"strong",reveal:0},children:[]}}}. Omit secondary when unnecessary, include it when used. reveal 0 means all. Only use the defined components, stable ids primary/secondary/detail/context and real zero-based narrative beats. No markdown.`;
 const started=performance.now();const response=await generateText({model:localModel(),system:prompt+"\nUse only prepared content. No queries, actions, variables, or arbitrary code. A PresentationBlock refers to a narrative beat. No repeated text needed in props. There are no image assets: never select image. reveal is an integer node count from 0 to 12, never a percentage; use 0 for full content. Focus requests need exactly one block for the named topic; comparisons need exactly two blocks for the named topics.",prompt:`Narrative:${JSON.stringify(pack.state.flow.beats.map((b:any,i:number)=>({beat:i,title:b.title,audienceText:b.audienceText,hasVisual:!!b.visualId,hasImage:false})))}\nRequest:${request}`,temperature:0,maxOutputTokens:1200,maxRetries:0,abortSignal:AbortSignal.timeout(45000)});
 let valid=false,error="";
 try{if(engine==="openui"){
  const parsed=parser.parse(response.text);if(!parsed.root||parsed.meta.incomplete||parsed.meta.errors.length||parsed.meta.unresolved.length)throw Error(JSON.stringify(parsed.meta));
  if(parsed.root.typeName!=="PresentationCanvas")throw Error("Invalid root");
  const nodes=parsed.root.props.children as {typeName:string;props:Record<string,unknown>}[];
  const blocks=nodes.map(n=>{if(n.typeName!=="PresentationBlock")throw Error("Invalid component");return {...n.props,reveal:n.props.reveal===0?null:n.props.reveal};});
  validateComposition({layout:parsed.root.props.layout,blocks},pack.state);valid=true;
 }else{
  const spec=JSON.parse(response.text.replace(/^```(?:json)?\s*|\s*```$/g,""));const root=spec.elements[spec.root];if(root.type!=="PresentationCanvas")throw Error("Invalid root");
  const blocks=root.children.map((id:string)=>{const node=spec.elements[id];if(node.type!=="PresentationBlock")throw Error("Invalid component");return {...node.props,reveal:node.props.reveal===0?null:node.props.reveal};});
  validateComposition({layout:root.props.layout,blocks},pack.state);valid=true;
 }}catch(e){error=e instanceof Error?e.message:String(e);}
 results.push({engine,request,ms:performance.now()-started,usage:response.usage,valid,error,output:response.text});
 console.log(engine,valid,Math.round(performance.now()-started));
}}
await writeFile("docs/research/renderer-format-validation.json",JSON.stringify({recordedAt:new Date().toISOString(),scope:"Small native-format generation smoke test; two requests each, sequential, not a statistical benchmark. Both formats validate component contracts and domain references.",results},null,2));
