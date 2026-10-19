import {createHash} from "node:crypto";
import type {Preparation} from "../../shared/preparation.js";
import {validateComposition,type AdaptiveComposition} from "../../shared/adaptive.js";
import {validateVectors,type Embedder} from "./semantic-retrieval.js";
export const componentFamilies=["statement","diagram","chart","image"] as const;
export type ComponentFamily=typeof componentFamilies[number];
export type PreparedComponent={id:string;beat:number;family:ComponentFamily;title:string;text:string;composition:AdaptiveComposition};
export type ComponentHit={id:string;beat:number;family:ComponentFamily;score:number;semanticScore:number;lexicalScore:number};
export function preparedComponents(state:Preparation):PreparedComponent[]{
 const result:PreparedComponent[]=[];
 for(const [beat,b] of (state.flow?.beats??[]).entries()){
  const add=(family:ComponentFamily,kind:"statement"|"visual"|"image",title:string,text:string)=>result.push({id:`${family}:${beat}`,beat,family,title,text,composition:validateComposition({layout:"focus",blocks:[{id:"primary",beat,kind,emphasis:"strong",reveal:null}]},state)});
  add("statement","statement",b.title,b.audienceText??"");
  const visual=state.visuals?.find(v=>v.id===b.visualId)?.spec;
  if(visual)add(visual.kind==="diagram"?"diagram":"chart","visual",visual.title,visual.kind==="diagram"?`${b.audienceText??""} Process: ${visual.nodes.join("; ")}`:`${b.audienceText??""} ${visual.unit}: ${visual.data.map(d=>`${d.label} ${d.value}`).join("; ")}`);
  const media=state.artifacts.find(a=>a.id===b.imageArtifactId)?.media;
  if(media)add("image","image",b.title,media.alt);
 }
 return result;
}
const hash=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const catalogKey=(project:string,state:Preparation)=>hash({project,revision:state.revision,components:preparedComponents(state),visuals:state.visuals,media:state.artifacts.filter(a=>a.media).map(a=>({id:a.id,media:a.media}))});
const ignored=new Set("a an the of and or to for in on is are it this that with from as we our how why what at can".split(" "));
const terms=(text:string)=>(text.toLowerCase().match(/[\p{L}\p{N}]+/gu)??[]).filter(t=>t.length>2&&!ignored.has(t));
export class HybridComponentIndex {
 private catalog:PreparedComponent[];
 private spaceKey:string;
 get components():ReadonlyArray<PreparedComponent>{return structuredClone(this.catalog);}
 private key:string;
 private vectors:number[][]=[];
 private frequencies:Map<string,number>[];
 private df=new Map<string,number>();
 private lengths:number[];
 private average:number;
 private queries=new Map<string,number[]>();
 constructor(project:string,state:Preparation,private embedder:Embedder){
  this.catalog=preparedComponents(state);this.spaceKey=JSON.stringify(embedder.space);this.key=catalogKey(project,state);
  this.frequencies=this.catalog.map(c=>{const counts=new Map<string,number>();for(const t of terms(`${c.title} ${c.text}`))counts.set(t,(counts.get(t)??0)+1);for(const t of counts.keys())this.df.set(t,(this.df.get(t)??0)+1);return counts;});
  this.lengths=this.frequencies.map(f=>[...f.values()].reduce((a,b)=>a+b,0));this.average=this.lengths.reduce((a,b)=>a+b,0)/(this.catalog.length||1);
 }
 private assertScope(project:string,state:Preparation){if(catalogKey(project,state)!==this.key||JSON.stringify(this.embedder.space)!==this.spaceKey)throw Error("Stale or cross-project component index");}
 async build(signal:AbortSignal){
  if(!this.catalog.length)throw Error("No prepared components");
  const vectors=await this.embedder.encode(this.catalog.map(c=>`title: ${c.title} | text: ${c.text}`),"document",signal);signal.throwIfAborted();validateVectors(vectors,this.catalog.length,this.embedder.space.dimensions);this.vectors=vectors.map(v=>[...v]);this.queries.clear();
 }
 async encodeQuery(project:string,state:Preparation,speech:string,signal:AbortSignal,useCache=true){
  this.assertScope(project,state);signal.throwIfAborted();if(!this.vectors.length)throw Error("Build component index first");
  if(!speech.trim()||speech.length>3000)throw Error("Invalid component search window");
  const cached=useCache?this.queries.get(speech):undefined;
  if(cached)return {vector:[...cached],cacheHit:true};
  const vectors=await this.embedder.encode([speech],"query",signal);signal.throwIfAborted();this.assertScope(project,state);validateVectors(vectors,1,this.embedder.space.dimensions);
  if(useCache){if(this.queries.size>=32)this.queries.delete(this.queries.keys().next().value!);this.queries.set(speech,[...vectors[0]]);}
  return {vector:[...vectors[0]],cacheHit:false};
 }
 rank(project:string,state:Preparation,speech:string,vector:number[],allowed?:ReadonlySet<ComponentFamily>){
  this.assertScope(project,state);if(!this.vectors.length)throw Error("Build component index first");validateVectors([vector],1,this.embedder.space.dimensions);
  if(allowed&&[...allowed].some(f=>!componentFamilies.includes(f)))throw Error("Unknown component family");
  const indices=this.catalog.flatMap((c,i)=>!allowed||allowed.has(c.family)?[i]:[]);const query=new Set(terms(speech));
  const scored=indices.map(i=>{
   let lexicalScore=0;
   for(const term of query){const tf=this.frequencies[i].get(term)??0;if(!tf)continue;const df=this.df.get(term)??0;lexicalScore+=Math.log(1+(this.catalog.length-df+0.5)/(df+0.5))*tf*2.2/(tf+1.2*(0.25+0.75*this.lengths[i]/(this.average||1)));}
   return {i,semanticScore:this.vectors[i].reduce((n,v,j)=>n+v*vector[j],0),lexicalScore};
  });
  const bySemantic=[...scored].sort((a,b)=>b.semanticScore-a.semanticScore||a.i-b.i);
  const byLexical=scored.filter(r=>r.lexicalScore>0).sort((a,b)=>b.lexicalScore-a.lexicalScore||a.i-b.i);
  const scores=new Map<number,number>();for(const ranking of [bySemantic,byLexical])ranking.forEach((r,i)=>scores.set(r.i,(scores.get(r.i)??0)+1/(60+i+1)));
  const hits:ComponentHit[]=scored.map(r=>({id:this.catalog[r.i].id,beat:this.catalog[r.i].beat,family:this.catalog[r.i].family,semanticScore:r.semanticScore,lexicalScore:r.lexicalScore,score:scores.get(r.i)!})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  return {hits,scoredComponents:indices.length,totalComponents:this.catalog.length};
 }
}
