import {spawn,type ChildProcessWithoutNullStreams} from "node:child_process";
import {resolve} from "node:path";
export interface StreamingSpeechModel{readonly id:string;spawnWorker(python:string):ChildProcessWithoutNullStreams}
export class MoonshineSmallStreamingModel implements StreamingSpeechModel{
 readonly id="moonshine-small-streaming";
 spawnWorker(python:string){return spawn(python,["-u",resolve("runtime/worker.py")],{stdio:["pipe","pipe","pipe"]});}
}
