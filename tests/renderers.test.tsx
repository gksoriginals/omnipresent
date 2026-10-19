import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createParser } from "@openuidev/react-lang";
import { AdaptiveCanvas,openuiProgram,presentationLibrary } from "../app/src/AdaptiveCanvas.js";
import { openingComposition } from "../shared/adaptive.js";
import { emptyPreparation } from "../shared/preparation.js";
test("both real renderer packages display equivalent grounded content",()=>{
 const state=emptyPreparation();state.flow={title:"Story",summary:"",openQuestions:[],beats:[{title:"Generation",audienceText:"Panels make electricity.",speakerNotes:"PRIVATE",visualDirection:"text",artifactIds:[]}]};
 const composition=openingComposition();const parsed=createParser(presentationLibrary.toJSONSchema(),presentationLibrary.root).parse(openuiProgram(composition));
 assert.equal(parsed.meta.errors.length,0,JSON.stringify(parsed.meta.errors));assert.ok(parsed.root);
 for(const engine of ["openui","json-render"] as const){const html=renderToStaticMarkup(<AdaptiveCanvas state={state} composition={composition} engine={engine}/>);assert.match(html,/Panels make electricity/);assert.ok(!html.includes("PRIVATE"));}
});
test("OpenUI accepts split compositions and numeric reveal boundaries",()=>{
 const c={layout:"split" as const,blocks:[...openingComposition().blocks,{id:"secondary" as const,kind:"visual" as const,beat:1,emphasis:"strong" as const,reveal:2}]};
 const parsed=createParser(presentationLibrary.toJSONSchema(),presentationLibrary.root).parse(openuiProgram(c));
 assert.equal(parsed.meta.errors.length,0,JSON.stringify(parsed.meta.errors));assert.equal(parsed.meta.incomplete,false);assert.deepEqual(parsed.meta.unresolved,[]);
});
test("both renderer adapters display validated paired component references",async()=>{
 const {plannerContext}=await import("./fixtures/planner-context.js");const {PairedPlanner,validatePlannedComposition}=await import("../server/presentation/composition.js");
 const context=plannerContext();const composition=validatePlannedComposition(await new PairedPlanner().plan(context,new AbortController().signal),context);
 for(const engine of ["openui","json-render"] as const){const html=renderToStaticMarkup(<AdaptiveCanvas composition={composition} state={context.state} engine={engine}/>);assert.equal((html.match(/adaptive-block emphasis/g)??[]).length,2);assert.match(html,/Panels convert sunlight/);assert.ok(!html.includes("PRIVATE"));}
});
test("both adapters accept four-component cross-beat synthesis with stable slots",async()=>{
 const {synthesisContext}=await import("./fixtures/synthesis-context.js");const {compositionPlanner,validatePlannedComposition}=await import("../server/presentation/composition.js");
 const context=synthesisContext(),composition=validatePlannedComposition(await compositionPlanner("synthesis").plan(context,new AbortController().signal),context);
 const parsed=createParser(presentationLibrary.toJSONSchema(),presentationLibrary.root).parse(openuiProgram(composition));assert.equal(parsed.meta.errors.length,0);assert.equal(parsed.meta.incomplete,false);
 for(const engine of ["openui","json-render"] as const){const html=renderToStaticMarkup(<AdaptiveCanvas composition={composition} state={context.state} engine={engine}/>);assert.equal((html.match(/adaptive-block emphasis/g)??[]).length,4);assert.match(html,/Synthetic solar panel illustration/);assert.ok(!html.includes("PRIVATE"));}
});
