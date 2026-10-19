import {createHash} from "node:crypto";
import {validateVectors,type Embedder} from "./semantic-retrieval.js";
export type LibraryAsset={id:string;title:string;text:string;entity:string;year:number;status:"actual"|"illustrative";family:"statement"|"chart"|"diagram"};
const words=(s:string)=>s.toLowerCase().match(/[\p{L}\p{N}]+/gu)??[];
export class LibrarySearch {
 private vectors:number[][]=[];
 private frequencies:Map<string,number>[];
 private df=new Map<string,number>();
 private lengths:number[];
 private average:number;
 readonly revision:string;
 constructor(readonly assets:readonly LibraryAsset[],private embedder:Embedder){
  if(new Set(assets.map(a=>a.id)).size!==assets.length)throw Error("Duplicate library IDs");
  this.revision=createHash("sha256").update(JSON.stringify({assets,space:embedder.space})).digest("hex");
  this.frequencies=assets.map(a=>{const f=new Map<string,number>();for(const w of words(`${a.title} ${a.text}`))f.set(w,(f.get(w)??0)+1);for(const w of f.keys())this.df.set(w,(this.df.get(w)??0)+1);return f;});
  this.lengths=this.frequencies.map(f=>[...f.values()].reduce((n,v)=>n+v,0));this.average=this.lengths.reduce((a,b)=>a+b,0)/(assets.length||1);
 }
 async build(signal:AbortSignal){const all:number[][]=[];for(let i=0;i<this.assets.length;i+=24){const batch=this.assets.slice(i,i+24);const v=await this.embedder.encode(batch.map(a=>`title: ${a.title} | text: ${a.text}`),"document",signal);validateVectors(v,batch.length,this.embedder.space.dimensions);all.push(...v);}signal.throwIfAborted();this.vectors=all;}
 async query(text:string,signal:AbortSignal){const v=await this.embedder.encode([text],"query",signal);validateVectors(v,1,this.embedder.space.dimensions);return v[0];}
 rank(text:string,vector:number[],eligible:(a:LibraryAsset)=>boolean=()=>true){
  validateVectors([vector],1,this.embedder.space.dimensions);if(this.vectors.length!==this.assets.length)throw Error("Unbuilt library");
  const terms=new Set(words(text));const rows=this.assets.flatMap((a,i)=>{if(!eligible(a))return [];let lexical=0;for(const t of terms){const tf=this.frequencies[i].get(t)??0;if(tf)lexical+=Math.log(1+(this.assets.length-(this.df.get(t)??0)+.5)/((this.df.get(t)??0)+.5))*tf*2.2/(tf+1.2*(.25+.75*this.lengths[i]/this.average));}return [{id:a.id,i,lexical,semantic:vector.reduce((s,n,j)=>s+n*this.vectors[i][j],0),score:0}];});
  for(const ranked of [[...rows].sort((a,b)=>b.semantic-a.semantic||a.i-b.i),rows.filter(r=>r.lexical>0).sort((a,b)=>b.lexical-a.lexical||a.i-b.i)])ranked.forEach((r,i)=>r.score+=1/(61+i));
  return rows.sort((a,b)=>b.score-a.score||a.i-b.i).map(r=>this.assets[r.i]);
 }
}
// Conservative explicit-scope cue: unknown, negated or competing cues escape to full search.
export function libraryScope(speech:string,assets:readonly LibraryAsset[]){
 const lower=speech.toLowerCase();if(/\b(not|don't|instead|rather|versus|compare)\b/.test(lower))return null;
 const entities=[...new Set(assets.map(a=>a.entity))].filter(e=>lower.includes(e.toLowerCase()));
 const years=[...new Set(speech.match(/\b20\d\d\b/g)??[])].map(Number);
 const statuses=[...new Set((lower.match(/\b(actual|illustrative)\b/g)??[]))];
 if(entities.length!==1||years.length!==1||statuses.length!==1)return null;
 return {entity:entities[0],year:years[0],status:statuses[0]};
}
export function scopeEligible(scope:NonNullable<ReturnType<typeof libraryScope>>,a:LibraryAsset){return a.entity===scope.entity&&a.year===scope.year&&a.status===scope.status;}
