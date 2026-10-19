import {approvePreparedEvidence} from "../../server/presentation/component-evidence.js";
import {emptyPreparation} from "../../shared/preparation.js";
import {prepareEvidence} from "../../server/presentation/prepare-evidence.js";
import {presentationCatalog} from "../../server/presentation/catalog.js";
import {storyRequestFrame} from "../../server/presentation/request-frame.js";
import type {PlanningContext} from "../../server/presentation/composition.js";
export function plannerContext():PlanningContext{
 const state=emptyPreparation();state.visuals=[{id:"00000000-0000-4000-8000-000000000001",spec:{kind:"diagram",title:"Solar process",nodes:["Sun","Panels","Battery"],edges:[{from:0,to:1},{from:1,to:2}]}}];
 state.flow={title:"Solar story",summary:"Prepared process",openQuestions:[],beats:[{title:"Solar generation",audienceText:"Panels convert sunlight to electricity.",speakerNotes:"PRIVATE",visualDirection:"diagram",visualId:"00000000-0000-4000-8000-000000000001",componentClaims:{visual:["beat"]},artifactIds:[]},{title:"Wind generation",audienceText:"Wind turns turbines.",speakerNotes:"PRIVATE",visualDirection:"statement",artifactIds:[]}]};
 state.flow=prepareEvidence(state.flow,state);approvePreparedEvidence(state.flow,state);state.approvedRevision=state.revision;state.flowBasedOnRevision=state.revision;
 const catalog=presentationCatalog(state),frame=storyRequestFrame("Solar generation",catalog.assets,"fixture-revision");
 return {state,catalog,selected:"diagram:0",frame,current:{layout:"focus",blocks:[{id:"primary",kind:"visual",beat:0,emphasis:"strong",reveal:2}]},requireIndependentReview:false};
}
