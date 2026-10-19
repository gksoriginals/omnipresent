import {spawn,type ChildProcessWithoutNullStreams} from 'node:child_process';
import {createInterface} from 'node:readline';
import type {LocalPreferenceModel} from '../presentation/selection.js';
import type {LibraryAsset} from '../controllers/library-search.js';
export class LocalClassifierPreference implements LocalPreferenceModel {
 constructor(readonly id='gliner-english-native',private worker='runtime/preference_worker.py'){}
 readonly resources:{parameters?:number;weightsBytes?:number;peakRssBytes?:number}={};
 private child?:ChildProcessWithoutNullStreams;
 private ready=false;
 private sequence=0;
 private pending=new Map<number,{resolve(value:string):void;reject(error:Error):void}>();
 readonly stats={calls:0,computeMs:0,loadMs:0};
 async start(){
  if(this.child)throw Error('Preference worker already started');
  const child=spawn('output/classifier-venv/bin/python',['-u',this.worker],{stdio:'pipe'});this.child=child;
  let diagnostic='';child.stderr.on('data',chunk=>{diagnostic=(diagnostic+String(chunk)).slice(-1000);});
  await new Promise<void>((resolve,reject)=>{
   const timer=setTimeout(()=>{reject(Error('Local preference worker load timed out'));this.close();},60000);
   const fail=(error:Error)=>{this.ready=false;clearTimeout(timer);reject(error);for(const request of this.pending.values())request.reject(error);this.pending.clear();};
   child.on('error',fail);child.on('exit',code=>fail(Error(`Preference worker exited (${code}): ${diagnostic}`)));child.stdin.on('error',fail);
   createInterface({input:child.stdout}).on('line',line=>{try{const event=JSON.parse(line);if(event.type==='ready'){this.ready=true;Object.assign(this.resources,{parameters:event.parameters,weightsBytes:event.weightsBytes,peakRssBytes:event.peakRssBytes});this.stats.loadMs=event.loadMs;clearTimeout(timer);resolve();return;}if(event.peakRssBytes)this.resources.peakRssBytes=Math.max(this.resources.peakRssBytes??0,event.peakRssBytes);const request=this.pending.get(event.id);if(!request)return;this.pending.delete(event.id);if(event.error)request.reject(Error(event.error));else{this.stats.computeMs+=event.computeMs??0;request.resolve(event.selected);}}catch{fail(Error('Invalid local preference protocol'));}});
  });
 }
 async choose(speech:string,assets:readonly LibraryAsset[],signal:AbortSignal){
  signal.throwIfAborted();if(!this.ready||!this.child||this.child.killed)throw Error('Preference worker is not ready');if(this.pending.size>=8)throw Error('Preference queue full');
  const id=++this.sequence;this.stats.calls++;
  return new Promise<string>((resolve,reject)=>{
   // Retain cancelled work in queue accounting until its response drains.
   const abort=()=>{reject(signal.reason??Error('Cancelled'));};signal.addEventListener('abort',abort,{once:true});
   this.pending.set(id,{resolve(value){signal.removeEventListener('abort',abort);resolve(value);},reject(error){signal.removeEventListener('abort',abort);reject(error);}});
   this.child!.stdin.write(JSON.stringify({id,speech,assets:assets.map(a=>({id:a.id,title:a.title,text:a.text}))})+'\n');
  });
 }
 close(){this.ready=false;this.child?.kill();for(const request of this.pending.values())request.reject(Error('Preference worker closed'));this.pending.clear();this.child=undefined;}
}
