import {test} from "node:test";
import assert from "node:assert/strict";
import {CachedEmbedder} from "../server/models/cached-embeddings.js";
import {compilePresentation,immutablePreparation} from "../server/presentation/prepared.js";
import {BaselinePresenter} from "../server/presentation/baseline.js";
import {storyRequestFrame} from "../server/presentation/request-frame.js";
import {synthesisContext} from "./fixtures/synthesis-context.js";
import {AdaptiveController} from "../server/agents/adaptive.js";
import {prepareEvidence} from "../server/presentation/prepare-evidence.js";
import {approvePreparedEvidence} from "../server/presentation/component-evidence.js";
import {Session} from "../server/session.js";
const signal=()=>new AbortController().signal;
const model={id:"fixture",model:"fixture",async decide(){throw Error("Unexpected model");}};
test("exact vector cache separates modes, deduplicates batches, isolates returned values and evicts",async()=>{
 let count=0;const source={space:{model:"fake",revision:"r1",dimensions:2},async encode(texts:string[]){count+=texts.length;return texts.map(()=>[1,0]);}};
 const cache=new CachedEmbedder(source,2);const a=await cache.encode(["a","a"],"document",signal());assert.equal(count,1);a[0][0]=42;
 assert.deepEqual(await cache.encode(["a"],"document",signal()),[[1,0]]);await cache.encode(["a"],"query",signal());assert.equal(count,2);
 await cache.encode(["b"],"document",signal());await cache.encode(["a"],"document",signal());assert.equal(count,4);
 source.space.revision="r2";await assert.rejects(cache.encode(["a"],"document",signal()),/space changed/);
});
test("cancelled and malformed vectors cannot poison cache; instances do not share private inputs",async()=>{
 let count=0,fail=true;const abort=new AbortController();
 const source={space:{model:"fake",revision:"r1",dimensions:2},async encode(texts:string[]){count++;if(fail){abort.abort();return texts.map(()=>[1,0]);}return texts.map(()=>[1,0]);}};
 const cache=new CachedEmbedder(source);await assert.rejects(cache.encode(["a"],"query",abort.signal));fail=false;
 await cache.encode(["a"],"query",signal());assert.equal(count,2);await new CachedEmbedder(source).encode(["a"],"query",signal());assert.equal(count,3);
 const invalid=new CachedEmbedder({...source,async encode(){return [[0,0]];}});await assert.rejects(invalid.encode(["a"],"query",signal()),/normalized/);
});
test("compiled snapshots reuse only host-owned immutable input and detect unversioned evidence changes",()=>{
 const state=synthesisContext().state,snapshot=compilePresentation(state);assert.notEqual(snapshot.state,state);assert.ok(Object.isFrozen(snapshot.state.flow!.beats[0]));assert.equal(compilePresentation(snapshot.state),snapshot);
 assert.throws(()=>{snapshot.state.flow!.beats[0].audienceText="changed";});
 state.flow!.beats[0].audienceText="changed without incrementing revision";assert.throws(()=>compilePresentation(state),/changed/);
 const next=synthesisContext().state;next.approvedRevision=null;assert.throws(()=>compilePresentation(next),/review/);
});
test("prepared presenter builds before speech and interprets each turn once without changing supported or missing outcomes",async()=>{
 let documents=0,interpretations=0;const embedding={space:{model:"fake",revision:"r1",dimensions:2},async encode(texts:string[],kind:string){if(kind==="document")documents+=texts.length;return texts.map(()=>[1,0]);}};
 const presenter=new BaselinePresenter(embedding,model,undefined,(...args)=>{interpretations++;return storyRequestFrame(...args);});
 const context=synthesisContext(),state=immutablePreparation(context.state);await presenter.prepare(state,signal());const encoded=documents;assert.ok(encoded>0);
 const one=await presenter.decide(state,context.current,"Morning output",signal());assert.ok(one.composition);assert.equal(interpretations,1);assert.equal(documents,encoded);
 const missing=await presenter.decide(state,context.current,"Show the payback period",signal());assert.equal(missing.composition,null);assert.equal(interpretations,2);
 const revised=structuredClone(state);revised.revision++;revised.approvedRevision=revised.revision;await presenter.prepare(revised,signal());assert.equal(documents,encoded,"unchanged document vectors reused across reviewed revision");
});
test("controller waits for preparation and stop prevents queued speech from committing",async()=>{
 let release!:()=>void,calls=0;const ready=new Promise<void>(resolve=>release=resolve);const events:Record<string,unknown>[]=[];
 const decider=Object.assign(async()=>{calls++;return {composition:null};},{prepare:async()=>ready});
 const controller=new AdaptiveController(new Session(e=>events.push(e)),e=>events.push(e),()=>{},decider);
 const state=synthesisContext().state;void controller.start(state);const waiting=controller.accept("Morning output");assert.equal(calls,0);controller.stop();release();await waiting;assert.equal(calls,0);assert.ok(!events.some(e=>e.type==="direction_completed"));
});

test("a reviewed content edit only re-encodes changed documents and source withdrawal still fails",async()=>{
 let documents=0;const source={space:{model:"fake",revision:"r1",dimensions:2},async encode(texts:string[],kind:string){if(kind==="document")documents+=texts.length;return texts.map(()=>[1,0]);}};
 const presenter=new BaselinePresenter(source,model),state=synthesisContext().state;await presenter.prepare(immutablePreparation(state),signal());const initial=documents;
 state.visuals![0].spec.title="Revised generation chart";state.revision++;state.flow=prepareEvidence(state.flow!,state);approvePreparedEvidence(state.flow,state);state.approvedRevision=state.revision;
 await presenter.prepare(immutablePreparation(state),signal());assert.equal(documents,initial+1);
 const withdrawn=structuredClone(state);withdrawn.artifacts=[];await assert.rejects(presenter.prepare(withdrawn,signal()),/withdrawn|changed|Missing|Unknown/);
});
test("concurrent cache calls have independent cancellation and failed work is not retained",async()=>{
 const releases:Array<()=>void>=[];let calls=0;
 const source={space:{model:"fake",revision:"r1",dimensions:2},async encode(texts:string[]){calls++;await new Promise<void>(r=>releases.push(r));return texts.map(()=>[1,0]);}};
 const cache=new CachedEmbedder(source),abort=new AbortController();const cancelled=cache.encode(["a"],"query",abort.signal);const valid=cache.encode(["a"],"query",signal());abort.abort();releases.forEach(release=>release());await assert.rejects(cancelled);assert.deepEqual(await valid,[[1,0]]);await cache.encode(["a"],"query",signal());assert.equal(calls,2);
});
