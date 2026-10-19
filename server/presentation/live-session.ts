import {WebSocket} from "ws";
import type {Preparation} from "../../shared/preparation.js";
import type {Session} from "../session.js";
import type {AdaptiveController} from "../agents/adaptive.js";
import type {createPresenter} from "./factory.js";
type Resources={
 sessionId:string;storyOrigin?:{projectId:string;storyId:string};story:Preparation;
 session:Session;adaptive:AdaptiveController;activePresenter:ReturnType<typeof createPresenter>;
 presenterSocket:WebSocket|null;audienceSockets:Set<WebSocket>;presentationEpoch:number;
};
// The resumable presentation owns resources; a WebSocket only borrows them.
export class LivePresentationSession implements Resources {
 readonly sessionId:string;readonly storyOrigin?:Resources["storyOrigin"];readonly story:Preparation;
 readonly session:Session;readonly adaptive:AdaptiveController;readonly activePresenter:Resources["activePresenter"];
 presenterSocket:WebSocket|null;readonly audienceSockets:Set<WebSocket>;presentationEpoch:number;
 lifecycle:"loaded"|"preparing"|"ready"|"disposed"="loaded";
 get started(){return this.lifecycle==="preparing"||this.lifecycle==="ready";}
 get disposed(){return this.lifecycle==="disposed";}
 begin(){if(this.disposed)throw Error("Presentation is disposed");this.lifecycle="preparing";}
 ready(){if(!this.disposed)this.lifecycle="ready";}
 failed(){if(!this.disposed)this.lifecycle="loaded";}
 lastStage:unknown=null;lastSnapshot:Record<string,unknown>|null=null;lastTranscript?:string;
 private graceTimer?:ReturnType<typeof setTimeout>;
 constructor(resources:Resources){
  this.sessionId=resources.sessionId;this.storyOrigin=resources.storyOrigin;this.story=resources.story;
  this.session=resources.session;this.adaptive=resources.adaptive;this.activePresenter=resources.activePresenter;
  this.presenterSocket=resources.presenterSocket;this.audienceSockets=resources.audienceSockets;this.presentationEpoch=resources.presentationEpoch;
 }
 cancelExpiry(){clearTimeout(this.graceTimer);this.graceTimer=undefined;}
 scheduleExpiry(expire:()=>void,delay=30000){if(this.disposed||this.graceTimer)return;this.graceTimer=setTimeout(expire,delay);}
 dispose(){
  if(this.disposed)return;
  this.lifecycle="disposed";this.presentationEpoch++;this.cancelExpiry();
  this.adaptive.stop();this.session.cancel();this.activePresenter.presenter.close();
  const message=JSON.stringify({type:"presentation_stopped"});
  for(const socket of this.audienceSockets)if(socket.readyState===WebSocket.OPEN){try{socket.send(message);}catch{}}
  this.audienceSockets.clear();this.presenterSocket=null;
 }
}
