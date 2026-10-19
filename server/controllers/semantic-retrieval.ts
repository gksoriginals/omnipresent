import {createHash} from "node:crypto";
import type {Preparation} from "../../shared/preparation.js";
export type PreparedDocument={beat:number;title:string;text:string};
export type RankedTopic={beat:number;score:number};
export type EmbeddingSpace={model:string;revision:string;dimensions:number};
export type Embedder={space:EmbeddingSpace;encode:(texts:string[],kind:"query"|"document",signal:AbortSignal)=>Promise<number[][]>};
export function preparedDocuments(state:Preparation):PreparedDocument[]{return (state.flow?.beats??[]).map((b,beat)=>({beat,title:b.title,text:b.audienceText??""}));}
const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function scopeKey(projectId:string,state:Preparation,space:EmbeddingSpace){return digest({projectId,revision:state.revision,documents:preparedDocuments(state),space});}
export function validateVectors(vectors:number[][],count:number,dimensions:number){
 if(vectors.length!==count)throw Error("Embedding count mismatch");
 for(const vector of vectors){
  if(vector.length!==dimensions || vector.some(n=>!Number.isFinite(n)))throw Error("Invalid embedding dimensions/values");
  const norm=Math.sqrt(vector.reduce((n,v)=>n+v*v,0));if(Math.abs(norm-1)>0.002)throw Error("Embedding is not normalized");
 }
}
export class SemanticIndex {
 private vectors:number[][]=[];
 private cachedQueries=new Map<string,number[]>();
 private key:string;
 private documents:PreparedDocument[];
 constructor(projectId:string,state:Preparation,private embedder:Embedder){this.documents=preparedDocuments(state);this.key=scopeKey(projectId,state,embedder.space);}
 async build(signal:AbortSignal){
  signal.throwIfAborted();
  const result=await this.embedder.encode(this.documents.map(d=>`title: ${d.title} | text: ${d.text}`),"document",signal);
  signal.throwIfAborted();validateVectors(result,this.documents.length,this.embedder.space.dimensions);
  this.vectors=result.map(v=>[...v]);this.cachedQueries.clear();
 }
 async rank(projectId:string,state:Preparation,speech:string,signal:AbortSignal){
  if(scopeKey(projectId,state,this.embedder.space)!==this.key)throw Error("Stale or cross-project embedding index");
  signal.throwIfAborted();
  if(!this.vectors.length)throw Error("Build embedding index first");
  const query=speech.trim();if(!query)return {hits:[] as RankedTopic[],cacheHit:false};
  if(query.length>3000)throw Error("Speech window exceeds embedding budget");
  let vector=this.cachedQueries.get(query);const cacheHit=!!vector;
  if(!vector){
   const result=await this.embedder.encode([query],"query",signal);signal.throwIfAborted();
   if(scopeKey(projectId,state,this.embedder.space)!==this.key)throw Error("Prepared context changed during embedding");
   validateVectors(result,1,this.embedder.space.dimensions);vector=[...result[0]];
   if(this.cachedQueries.size>=32)this.cachedQueries.delete(this.cachedQueries.keys().next().value!);
   this.cachedQueries.set(query,vector);
  }
  return {hits:this.documents.map((d,i)=>({beat:d.beat,score:this.vectors[i].reduce((s,n,j)=>s+n*vector![j],0)})).sort((a,b)=>b.score-a.score || a.beat-b.beat),cacheHit};
 }
}
const stop=new Set("a an the of and or to for in on is are it this that with from as we our how why what at can no not".split(" "));
const terms=(text:string)=>(text.toLowerCase().match(/[\p{L}\p{N}]+/gu)??[]).filter(t=>t.length>2&&!stop.has(t));
// Small corpus BM25 baseline; no hand-written topic synonyms or labels.
export function lexicalRank(documents:PreparedDocument[],speech:string):RankedTopic[]{
 const docs=documents.map(d=>terms(`${d.title} ${d.text}`));const query=new Set(terms(speech));const average=docs.reduce((n,d)=>n+d.length,0)/(docs.length||1);
 return documents.map((document,i)=>{
  let score=0;for(const term of query){
   const frequency=docs[i].filter(t=>t===term).length;if(!frequency)continue;
   const df=docs.filter(d=>d.includes(term)).length;const idf=Math.log(1+(docs.length-df+0.5)/(df+0.5));
   score+=idf*frequency*2.2/(frequency+1.2*(0.25+0.75*docs[i].length/(average||1)));
  }return {beat:document.beat,score};
 }).filter(h=>h.score>0).sort((a,b)=>b.score-a.score||a.beat-b.beat);
}
export function fusedRank(semantic:RankedTopic[],lexical:RankedTopic[]):RankedTopic[]{
 const scores=new Map<number,number>();
 for(const ranking of [semantic,lexical])ranking.forEach((hit,i)=>scores.set(hit.beat,(scores.get(hit.beat)??0)+1/(60+i+1)));
 return [...scores].map(([beat,score])=>({beat,score})).sort((a,b)=>b.score-a.score||a.beat-b.beat);
}
export function httpEmbedder(space:EmbeddingSpace):Embedder{return {space,async encode(texts,kind,signal){
 const response=await fetch("http://127.0.0.1:4332/embed",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({texts,kind}),signal});
 if(!response.ok)throw Error(`Embedding runner HTTP ${response.status}`);
 const result=await response.json();
 if(result.model!==space.model||result.revision!==space.revision||result.dimensions!==space.dimensions)throw Error("Embedding space mismatch");
 validateVectors(result.vectors,texts.length,space.dimensions);return result.vectors;
}};}
