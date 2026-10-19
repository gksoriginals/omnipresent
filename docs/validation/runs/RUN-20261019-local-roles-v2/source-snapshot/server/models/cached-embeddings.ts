import {createHash} from "node:crypto";
import {validateVectors,type Embedder} from "../controllers/semantic-retrieval.js";
// Exact vectors only: retrieval, intent and evidence decisions are never cached.
// Instance scope is the cache namespace; callers must not share across projects.
export class CachedEmbedder implements Embedder {
 readonly space;
 private entries=new Map<string,number[]>();
 readonly stats={hits:0,misses:0,encoded:0};
 constructor(private source:Embedder,private capacity=256){
  if(!Number.isInteger(capacity)||capacity<1)throw Error("Positive cache capacity required");
  this.space=Object.freeze({...source.space});
 }
 async encode(texts:string[],kind:"query"|"document",signal:AbortSignal){
  signal.throwIfAborted();
  const identity=JSON.stringify(this.source.space);
  if(identity!==JSON.stringify(this.space))throw Error("Embedding space changed; create a new cache");
  const keys=texts.map(text=>createHash("sha256").update(JSON.stringify({space:this.space,kind,text})).digest("hex"));
  const missing=new Map<string,string>();const found=new Map<string,number[]>();
  keys.forEach((key,i)=>{const value=this.entries.get(key);if(value){this.stats.hits++;this.entries.delete(key);this.entries.set(key,value);found.set(key,value);}else{this.stats.misses++;missing.set(key,texts[i]);}});
  if(missing.size){
   const vectors=await this.source.encode([...missing.values()],kind,signal);
   signal.throwIfAborted();validateVectors(vectors,missing.size,this.space.dimensions);
   if(JSON.stringify(this.source.space)!==identity)throw Error("Embedding space changed during encoding");
   this.stats.encoded+=vectors.length;
   [...missing.keys()].forEach((key,i)=>{const vector=[...vectors[i]];found.set(key,vector);this.entries.delete(key);this.entries.set(key,vector);while(this.entries.size>this.capacity)this.entries.delete(this.entries.keys().next().value!);});
  }
  signal.throwIfAborted();return keys.map(key=>[...found.get(key)!]);
 }
}
