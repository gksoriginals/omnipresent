import {test} from "node:test";
import assert from "node:assert/strict";
import {AudioQueue} from "../app/src/services/audio-capture.js";
import {WorkspaceStore} from "../app/src/services/workspace-store.js";
import {parseSessionEvent,SessionClient} from "../app/src/services/session-client.js";
test("audio queue sends one chunk until acknowledged and clears on overflow",()=>{
 const sent:ArrayBuffer[]=[];let overflow=0;const socket={readyState:1,bufferedAmount:0,send:(chunk:ArrayBuffer)=>sent.push(chunk)};
 const queue=new AudioQueue(()=>socket,()=>overflow++);for(let i=0;i<5;i++)queue.push(new ArrayBuffer(2));assert.equal(sent.length,1);
 queue.acknowledge();assert.equal(sent.length,2);queue.push(new ArrayBuffer(2));queue.push(new ArrayBuffer(2));assert.equal(overflow,1);
 queue.acknowledge();assert.equal(sent.length,2);socket.bufferedAmount=64001;queue.push(new ArrayBuffer(2));assert.equal(overflow,2);
});
test("workspace store retains in-tab changes after persistence failure and protects unreadable storage",()=>{
 let raw:string|null=null;let fail=false;const storage={getItem:()=>raw,setItem:(_key:string,value:string)=>{if(fail)throw Error("full");raw=value;}};
 const store=new WorkspaceStore(storage);const next={...store.current,projects:store.current.projects.map(p=>({...p,composer:"kept draft"}))};
 assert.equal(store.commit(next).persisted,true);assert.equal(new WorkspaceStore(storage).current.projects[0].composer,"kept draft");
 fail=true;assert.equal(store.commit({...next,stories:[]}).persisted,false);assert.equal(store.current.projects[0].composer,"kept draft");
 raw="broken";const protectedStore=new WorkspaceStore(storage);assert.equal(protectedStore.commit(protectedStore.current).persisted,false);assert.equal(raw,"broken");
 assert.ok(new WorkspaceStore(()=>{throw Error("disabled");}).error);
});
test("session client ignores unknown telemetry and detached socket callbacks",()=>{
 assert.equal(parseSessionEvent('{"type":"direction_completed"}'),null);assert.throws(()=>parseSessionEvent('{"type":"preparation","state":{}}'));
 let opened=0,events=0,errors=0;const fake={readyState:1,bufferedAmount:0,send(){},close(){},onopen:null,onmessage:null,onclose:null} as unknown as WebSocket;
 const client=new SessionClient("ws://test",{open(){opened++;},event(){events++;},close(){},error(){errors++;}},()=>fake);client.connect();
 fake.onopen!({} as Event);fake.onmessage!({data:'{"type":"audio_ack"}'} as MessageEvent);fake.onmessage!({data:'invalid'} as MessageEvent);
 assert.equal(opened,1);assert.equal(events,1);assert.equal(errors,1);client.close();fake.onopen!({} as Event);fake.onmessage!({data:'{"type":"audio_ack"}'} as MessageEvent);assert.equal(opened,1);assert.equal(events,1);
});
test("cancelled microphone acquisition stops tracks before constructing audio resources",async()=>{
 const {captureMicrophone}=await import("../app/src/services/audio-capture.js");const descriptor=Object.getOwnPropertyDescriptor(globalThis,"navigator");let stopped=0;
 Object.defineProperty(globalThis,"navigator",{configurable:true,value:{mediaDevices:{async getUserMedia(){return {getTracks:()=>[{stop(){stopped++;}}]};}}}});
 try{assert.equal(await captureMicrophone(()=>assert.fail("Unexpected chunk"),()=>false),null);assert.equal(stopped,1);}
 finally{if(descriptor)Object.defineProperty(globalThis,"navigator",descriptor);else Reflect.deleteProperty(globalThis,"navigator");}
});
