import { readFileSync } from "node:fs";
import { emptyPreparation } from "../shared/preparation.js";
import { openingComposition, type AdaptiveComposition } from "../shared/adaptive.js";
import { PresentationPolicy, type PolicyEvent, type Strategy } from "../server/controllers/presentation-policy.js";
export type Step = {at:number;type?:"pause"|"resume"|"stop";topics?:[number,number][];comparison?:number[];expect:string;epoch?:number;revision?:number;sequence?:number;missingEvidence?:boolean};
export const fixtures=JSON.parse(readFileSync(new URL("../tests/fixtures/controller-replays.json",import.meta.url),"utf8")) as {version:number;scope:string;scenarios:{id:string;steps:Step[]}[];retrieval:{id:string;speech:string;expectedBeats:number[];domain?:string}[]};
export const strategies:Strategy[]=["rules","fsm","behaviour-tree","hybrid"];
export function fixtureState(domain?:string){
 const state=emptyPreparation();state.revision=1;
 const text=domain==="education"?[["Curriculum","Lessons teaching syllabus topics"],["Assessment","Students compare learning outcomes using assessment feedback"],["Practice","Exercises reinforce skills"]]:[["Panels","Panels convert sunlight into electricity"],["Daily production","Chart morning noon evening energy"],["Battery storage","Battery storage saves electricity for night"]];
 state.flow={title:"Fixture",summary:"Synthetic",openQuestions:[],beats:text.map(([title,audienceText])=>({title,audienceText,speakerNotes:"PRIVATE",visualDirection:"text",artifactIds:[]}))};return state;
}
export function composition(beats:number[]):AdaptiveComposition{return {layout:beats.length>1?"split":"focus",blocks:beats.map((beat,i)=>({id:i===0?"primary":"secondary",beat,kind:"statement",emphasis:i===0?"strong":"normal",reveal:null}))};}
// Match the initial fixture with the same emphasis to avoid counting a style-only refresh as a topic change.
export const initial=()=>composition([0]);
export function eventFromStep(step:Step,index:number):PolicyEvent{
 if(step.type)return {type:step.type,at:step.at};
 return {type:"observe",at:step.at,sequence:step.sequence??index,epoch:step.epoch??0,revision:step.revision??1,missingEvidence:step.missingEvidence,candidates:step.comparison?[{id:"comparison",score:0.95,composition:composition(step.comparison)}]:(step.topics??[]).map(([beat,score])=>({id:`topic-${beat}`,score,composition:composition([beat])}))};
}
export function replay(strategy:Strategy,scenario:typeof fixtures.scenarios[number]){
 const controller=new PresentationPolicy(strategy,fixtureState(),initial());
 return scenario.steps.map((step,index)=>{
  const start=performance.now();const result=controller.handle(eventFromStep(step,index));const elapsedMs=performance.now()-start;
  const actual=result.action==="commit"?`commit:${result.composition!.blocks.map(b=>b.beat).join(",")}`:result.action;
  return {at:step.at,expected:step.expect,actual,correct:actual===step.expect,reason:result.reason,trace:result.trace,elapsedMs};
 });
}
