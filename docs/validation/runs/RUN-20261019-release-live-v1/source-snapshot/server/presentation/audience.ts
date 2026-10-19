import {emptyPreparation,type Preparation} from "../../shared/preparation.js";
// A rendering projection, never an evidence-bearing preparation snapshot.
export function audienceState(state:Preparation):Preparation {
 const beats=state.flow?.beats??[];
 return {...emptyPreparation(),revision:state.revision,flow:state.flow?{
  title:state.flow.title,summary:state.flow.title,openQuestions:[],
  beats:beats.map(b=>({title:b.title,audienceText:b.audienceText,speakerNotes:"Audience view",visualDirection:"Audience view",artifactIds:[],visualId:b.visualId,imageArtifactId:b.imageArtifactId}))
 }:null,
 visuals:state.visuals?.filter(v=>beats.some(b=>b.visualId===v.id)),
 artifacts:state.artifacts.filter(a=>a.media&&beats.some(b=>b.imageArtifactId===a.id)).map(a=>({id:a.id,name:"Presentation image",content:"",media:a.media}))};
}
export function audienceEvent(event:Record<string,unknown>):Record<string,unknown>|null {
 if(event.type==="presentation_loaded")return {type:event.type,title:event.title,sessionId:event.sessionId,state:audienceState(event.state as Preparation)};
 return ["stage","snapshot","presentation_stopped"].includes(String(event.type))?event:null;
}
