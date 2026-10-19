import {plannerContext} from "./fixtures/planner-context.js";
import {test} from "node:test";
import assert from "node:assert/strict";
import {FocusPlanner,StablePlanner,validatePlannedComposition,compositionPlanner} from "../server/presentation/composition.js";
import {BaselinePresenter} from "../server/presentation/baseline.js";
const signal=()=>new AbortController().signal;
test("focus reproduces bound focus behavior while stable preserves an eligible reveal",async()=>{
 const context=plannerContext();const focus=await new FocusPlanner().plan(context,signal()),stable=await new StablePlanner().plan(context,signal());
 assert.equal(focus.blocks[0].reveal,null);assert.equal(stable.blocks[0].reveal,2);assert.notEqual(stable,context.current);validatePlannedComposition(focus,context);validatePlannedComposition(stable,context);
 assert.equal(compositionPlanner().id,"focus");assert.throws(()=>compositionPlanner("unknown"));
});
test("host rejects omitted selections, unsupported extra claims, duplicates and invalid reveal",async()=>{
 const context=plannerContext();const focus=await new FocusPlanner().plan(context,signal());
 for(const blocks of [[{...focus.blocks[0],beat:1,kind:"statement"}],[...focus.blocks,{...focus.blocks[0],id:"secondary",beat:1,kind:"statement"}],[...focus.blocks,{...focus.blocks[0],id:"secondary"}],[{...focus.blocks[0],reveal:4}]])assert.throws(()=>validatePlannedComposition({...focus,blocks},context));
 context.current.blocks[0].beat=1;assert.deepEqual(await new StablePlanner().plan(context,signal()),focus);
 context.requireIndependentReview=true;assert.throws(()=>validatePlannedComposition(focus,context),/evidence/);
});
test("cancelled planners cannot return proposals",async()=>{const abort=new AbortController();abort.abort();await assert.rejects(new FocusPlanner().plan(plannerContext(),abort.signal));await assert.rejects(new StablePlanner().plan(plannerContext(),abort.signal));});
test("injected planner cannot rewrite evidence or bypass final composition checks",async()=>{
 const context=plannerContext();let called=0;
 const presenter=new BaselinePresenter({space:{model:"fake",revision:"1",dimensions:2},async encode(texts){return texts.map(()=>[1,0]);}},{id:"fake",model:"fake",async decide(request){called++;const options=(request.state as {options:Record<string,{family:string}>}).options;const choice=Object.keys(options).find(key=>options[key].family==="diagram")!;return {usage:{cost:0},answers:{action:{type:"choice",choice,probabilities:Object.fromEntries([...Object.keys(options),"context","hold"].map(key=>[key,key===choice?1:0]))}}};}},undefined,undefined,undefined,{id:"bad",async plan(c){c.state.flow!.beats[1].evidence=c.state.flow!.beats[0].evidence;return {layout:"split",blocks:[...c.current.blocks,{id:"secondary",beat:1,kind:"statement",emphasis:"strong",reveal:null}]};}});
 // The selected diagram is eligible; a planner still cannot add unsupported content.
 const speech="Show illustrative Solar story solar generation diagram";
 await assert.rejects(presenter.decide(context.state,context.current,speech,signal()));assert.equal(context.state.flow!.beats[1].evidence!.claims[0].id,"beat-1");assert.equal(called,1);
});
