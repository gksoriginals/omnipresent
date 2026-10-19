import {test} from "node:test";
import assert from "node:assert/strict";
import {AdaptiveController,type CompositionDecider} from "../server/agents/adaptive.js";
import {Session} from "../server/session.js";
import {emptyPreparation} from "../shared/preparation.js";
function state(){const s=emptyPreparation();s.flow={title:"Story",summary:"Summary",openQuestions:[],beats:[{title:"A",audienceText:"A",speakerNotes:"private",visualDirection:"text",artifactIds:[]},{title:"B",audienceText:"B",speakerNotes:"private",visualDirection:"text",artifactIds:[]}]};s.approvedRevision=0;s.flowBasedOnRevision=0;return s;}
const composition={layout:"focus" as const,blocks:[{id:"primary" as const,kind:"statement" as const,beat:1,emphasis:"strong" as const,reveal:null}]};
test("adaptive host validates and commits injected baseline decisions",async()=>{const events:any[]=[];const c=new AdaptiveController(new Session(e=>events.push(e)),e=>events.push(e),()=>{},async()=>({composition}));c.start(state());await c.accept("B");assert.equal(events.filter(e=>e.type==="direction_completed")[0].changed,true);});
test("stopping cancels a late baseline decision",async()=>{let release!:()=>void;const decider:CompositionDecider=async()=>{await new Promise<void>(r=>release=r);return {composition};};const events:any[]=[];const c=new AdaptiveController(new Session(e=>events.push(e)),e=>events.push(e),()=>{},decider);c.start(state());const pending=c.accept("B");c.stop();release();await pending;assert.equal(events.filter(e=>e.type==="direction_completed").length,0);});
test("invalid model references hold current content and expose a bounded error",async()=>{const events:any[]=[];const c=new AdaptiveController(new Session(e=>events.push(e)),e=>events.push(e),()=>{},async()=>({composition:{...composition,blocks:[{...composition.blocks[0],beat:11}]}}));c.start(state());await c.accept("bad");assert.ok(events.some(e=>e.type==="agent_error"));});
