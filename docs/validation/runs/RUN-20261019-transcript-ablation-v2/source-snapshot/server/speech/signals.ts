import type {Preparation} from "../../shared/preparation.js";
import {compilePresentation} from "../presentation/prepared.js";
export type DetectionSignal={id:string;assetId:string;claimId:string;beat:number;phrase:string};
export type SignalRepository={revision:string;signals:readonly DetectionSignal[]};
export type SignalAssessment={state:"matched"|"continuation"|"unresolved";signalIds:string[];prefixIds:string[];currentCandidate:boolean};
export interface UtteranceGate {assess(text:string,currentBeats?:readonly number[]):SignalAssessment}
export const unresolvedGate:UtteranceGate={assess:()=>({state:"unresolved",signalIds:[],prefixIds:[],currentCandidate:false})};
const tokens=(text:string)=>text.toLowerCase().replace(/[’']/g,"").match(/[\p{L}\p{N}]+/gu)??[];
type Node={next:Map<string,number>;fail:number;output:Set<number>;prefix:Set<number>;depth:number};
const node=(depth:number):Node=>({next:new Map(),fail:0,output:new Set(),prefix:new Set(),depth});
/** Token Aho–Corasick automaton: shared phrases remain ambiguous, never pick a winner. */
export class SignalIndex implements UtteranceGate {
 private nodes:Node[]=[node(0)];
 constructor(readonly repository:SignalRepository){
  repository.signals.forEach((signal,id)=>{
   const words=tokens(signal.phrase);let at=0;
   words.forEach((word,i)=>{
    if(!this.nodes[at].next.has(word)){this.nodes[at].next.set(word,this.nodes.length);this.nodes.push(node(i+1));}
    at=this.nodes[at].next.get(word)!;
    if(i+1<words.length)this.nodes[at].prefix.add(id);
   });
   if(words.length)this.nodes[at].output.add(id);
  });
  const queue=[...this.nodes[0].next.values()];
  for(let i=0;i<queue.length;i++){
   const at=queue[i];
   for(const [word,next] of this.nodes[at].next){
    queue.push(next);let fail=this.nodes[at].fail;
    while(fail&&!this.nodes[fail].next.has(word))fail=this.nodes[fail].fail;
    this.nodes[next].fail=this.nodes[fail].next.get(word)??0;
    for(const id of this.nodes[this.nodes[next].fail].output)this.nodes[next].output.add(id);
   }
  }
 }
 assess(text:string,currentBeats:readonly number[]=[]):SignalAssessment {
  let at=0;const hits=new Set<number>();
  for(const word of tokens(text)){
   while(at&&!this.nodes[at].next.has(word))at=this.nodes[at].fail;
   at=this.nodes[at].next.get(word)??0;
   for(const id of this.nodes[at].output)hits.add(id);
  }
  const prefixes=new Set<number>();
  // Include suffix prefixes inherited through failure links, not just the longest suffix.
  for(let suffix=at;suffix;suffix=this.nodes[suffix].fail)for(const id of this.nodes[suffix].prefix)prefixes.add(id);
  return {state:prefixes.size?"continuation":hits.size?"matched":"unresolved",signalIds:[...hits].map(i=>this.repository.signals[i].id),prefixIds:[...prefixes].map(i=>this.repository.signals[i].id),currentCandidate:hits.size>0&&[...hits].every(i=>currentBeats.includes(this.repository.signals[i].beat))};
 }
}
const cached=new WeakMap<Preparation,SignalIndex>();
/** The storyteller supplies cueAliases in its draft; approval freezes the evidence vocabulary. */
export function preparedSignalIndex(state:Preparation):SignalIndex {
 const snapshot=compilePresentation(state),existing=cached.get(snapshot.state);if(existing)return existing;
 const signals:DetectionSignal[]=[];
 for(const asset of snapshot.catalog.assets){
  const ref=snapshot.catalog.references.get(asset.id)!;
  for(const claim of asset.evidence.claims)for(const [i,phrase] of claim.aliases.entries())signals.push(Object.freeze({id:`${asset.id}/${claim.id}/${i}`,assetId:asset.id,claimId:claim.id,beat:ref.beat,phrase}));
 }
 const result=new SignalIndex(Object.freeze({revision:snapshot.key,signals:Object.freeze(signals)}));cached.set(snapshot.state,result);return result;
}
