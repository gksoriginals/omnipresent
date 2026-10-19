import {test} from "node:test";
import assert from "node:assert/strict";
import {LivePresentationSession} from "../server/presentation/live-session.js";
import {synthesisContext} from "./fixtures/synthesis-context.js";
function fixture(){
 const calls:string[]=[];
 const session=new LivePresentationSession({sessionId:"test",story:synthesisContext().state,session:{cancel:()=>calls.push("cancel")} as any,adaptive:{stop:()=>calls.push("stop")} as any,activePresenter:{presenter:{close:()=>calls.push("close")}} as any,presenterSocket:null,audienceSockets:new Set([{readyState:1,send:()=>calls.push("notify")} as any]),presentationEpoch:0});
 return {session,calls};
}
test("presentation owner disposes resources once and invalidates readiness",()=>{
 const {session,calls}=fixture();session.begin();assert.equal(session.lifecycle,"preparing");session.ready();assert.equal(session.lifecycle,"ready");session.dispose();session.dispose();session.ready();
 assert.equal(session.lifecycle,"disposed");assert.equal(session.started,false);assert.equal(session.presentationEpoch,1);
 assert.deepEqual(calls,["stop","cancel","close","notify"]);assert.equal(session.audienceSockets.size,0);
});
test("presentation expiry is cancelled on reconnect and disposal",async()=>{
 const {session}=fixture();let expiries=0;
 session.scheduleExpiry(()=>expiries++,5);session.cancelExpiry();await new Promise(r=>setTimeout(r,15));assert.equal(expiries,0);
 session.scheduleExpiry(()=>expiries++,5);session.dispose();await new Promise(r=>setTimeout(r,15));assert.equal(expiries,0);
 session.scheduleExpiry(()=>expiries++,5);await new Promise(r=>setTimeout(r,15));assert.equal(expiries,0);
});
test("presentation expiry runs once and failed startup returns to loaded",async()=>{
 const {session}=fixture();session.begin();session.failed();assert.equal(session.lifecycle,"loaded");assert.equal(session.started,false);
 let expiries=0;session.scheduleExpiry(()=>{expiries++;session.dispose();},5);session.scheduleExpiry(()=>expiries++,5);
 await new Promise(r=>setTimeout(r,20));assert.equal(expiries,1);assert.equal(session.disposed,true);assert.throws(()=>session.begin(),/disposed/);
});
