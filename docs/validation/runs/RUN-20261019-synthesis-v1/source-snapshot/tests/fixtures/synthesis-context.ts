import {emptyPreparation,preparationSchema} from "../../shared/preparation.js";
import {prepareEvidence} from "../../server/presentation/prepare-evidence.js";
import {approvePreparedEvidence} from "../../server/presentation/component-evidence.js";
import {presentationCatalog} from "../../server/presentation/catalog.js";
import {storyRequestFrame} from "../../server/presentation/request-frame.js";
import type {PlanningContext} from "../../server/presentation/composition.js";
export function synthesisContext():PlanningContext{
 let state=emptyPreparation();
 const data="00000000-0000-4000-8000-000000000010",image="00000000-0000-4000-8000-000000000011";
 state.artifacts=[{id:data,name:"synthetic-energy.csv",content:"Synthetic example, not measured data. Morning,10; Noon,20; Evening,5. All figures in Wh."},{id:image,name:"synthetic-panel.png",content:"Synthetic illustration of sunlight reaching panels, not a photograph of an actual installation.",media:{url:`/api/materials/${"a".repeat(64)}.png`,alt:"Synthetic solar panel illustration"}}];
 state.visuals=[{id:"00000000-0000-4000-8000-000000000012",spec:{kind:"chart",title:"Morning output",chartType:"bar",unit:"Wh",sourceArtifactId:data,data:[{label:"Morning",value:10},{label:"Noon",value:20},{label:"Evening",value:5}]}},{id:"00000000-0000-4000-8000-000000000013",spec:{kind:"chart",title:"Daily curve",chartType:"line",unit:"Wh",sourceArtifactId:data,data:[{label:"Morning",value:10},{label:"Noon",value:20},{label:"Evening",value:5}]}}];
 state.flow={title:"Solar energy example",summary:"A synthetic demonstration, not measured generation.",openQuestions:[],beats:[{title:"Sunlight becomes electricity",audienceText:"Panels turn sunlight into electricity. This synthetic example peaks at noon.",speakerNotes:"PRIVATE",visualDirection:"chart and illustration",visualId:state.visuals[0].id,imageArtifactId:image,artifactIds:[data,image],componentClaims:{visual:["beat"],image:["beat"]}},{title:"A second view of the same example",audienceText:"Use a curve to see the daily pattern.",speakerNotes:"PRIVATE",visualDirection:"line chart",visualId:state.visuals[1].id,artifactIds:[data],componentClaims:{statement:[],visual:["beat:0"]}}]};
 state.flow=prepareEvidence(state.flow,state);approvePreparedEvidence(state.flow,state);state.approvedRevision=state.revision;state.flowBasedOnRevision=state.revision;state=preparationSchema.parse(state);
 const catalog=presentationCatalog(state);return {state,catalog,selected:"chart:0",frame:storyRequestFrame("Morning output",catalog.assets,"synthesis-fixture"),current:{layout:"focus",blocks:[{id:"primary",kind:"visual",beat:0,emphasis:"strong",reveal:null}]},requireIndependentReview:false};
}
