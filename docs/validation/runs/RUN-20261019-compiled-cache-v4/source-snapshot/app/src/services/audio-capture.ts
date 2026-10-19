export interface AudioTransport {readyState:number;bufferedAmount:number;send(data:ArrayBuffer):void}
// One chunk in flight; queued chunks are bounded independently of the worklet.
export class AudioQueue {
 private chunks:ArrayBuffer[]=[];private pending=false;
 constructor(private transport:()=>AudioTransport|null,private overflow:()=>void){}
 push(chunk:ArrayBuffer){const socket=this.transport();if(this.chunks.length>=4||!socket||socket.bufferedAmount>64000){this.clear();this.overflow();return;}this.chunks.push(chunk);this.pump();}
 acknowledge(){this.pending=false;this.pump();}
 clear(){this.chunks=[];this.pending=false;}
 private pump(){const socket=this.transport();if(!this.pending&&this.chunks.length&&socket?.readyState===1){this.pending=true;socket.send(this.chunks.shift()!);}}
}
export type Capture={stop():void};
export async function captureMicrophone(onChunk:(chunk:ArrayBuffer)=>void,isCurrent:()=>boolean):Promise<Capture|null>{
 const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true}});
 let context:AudioContext|undefined,node:AudioWorkletNode|undefined;
 const stop=()=>{stream.getTracks().forEach(t=>t.stop());node?.disconnect();if(context&&context.state!=="closed")void context.close();};
 try{
  if(!isCurrent()){stop();return null;}
  context=new AudioContext();await context.audioWorklet.addModule("/capture-worklet.js");await context.resume();
  if(!isCurrent()){stop();return null;}
  node=new AudioWorkletNode(context,"pcm-capture");const source=context.createMediaStreamSource(stream),mute=context.createGain();
  mute.gain.value=0;source.connect(node);node.connect(mute);mute.connect(context.destination);
  node.port.onmessage=({data})=>{if(isCurrent())onChunk(data);};return {stop};
 }catch(error){stop();throw error;}
}
