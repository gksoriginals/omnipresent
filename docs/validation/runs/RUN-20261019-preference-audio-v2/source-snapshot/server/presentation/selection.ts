import {supportsEvidence,type EvidenceIntent} from '../controllers/evidence-contract.js';
import type {LibraryAsset} from '../controllers/library-search.js';
import type {LibraryDecision} from '../controllers/library-policy.js';
export type SelectionContext={speech:string;assets:readonly LibraryAsset[];intent:Readonly<EvidenceIntent>;current:string|null;requireIndependentReview:boolean};
export interface AssetSelector {
 readonly id:string;
 prepare?(signal:AbortSignal):Promise<void>;
 close?():void;
 readonly stats?:{choices:number;fallbacks:number};
 // A preselection is still a proposal: the final host gate always runs.
 preselect?(context:SelectionContext):LibraryDecision|null;
 select(context:SelectionContext,signal:AbortSignal):Promise<LibraryDecision>;
}
export function eligibleAssets(context:SelectionContext){return context.assets.filter(asset=>supportsEvidence(asset,context.intent,context.requireIndependentReview));}
export class LocalHybridSelector implements AssetSelector {
 readonly id:string='local-hybrid';
 preselect(context:SelectionContext):LibraryDecision|null{
  if(context.intent.mode!=='present')return null;
  const eligible=eligibleAssets(context);
  return eligible.length===1?{action:'show',selected:eligible[0].id}:null;
 }
 async select(context:SelectionContext,signal:AbortSignal):Promise<LibraryDecision>{
  signal.throwIfAborted();
  if(context.intent.mode!=='present')return {action:context.intent.mode==='missing'?'context':'hold',selected:null};
  const eligible=eligibleAssets(context);
  return eligible.length?{action:'show',selected:eligible[0].id}:{action:'context',selected:null};
 }
}
// Experimental control: force ranking even when eligibility has a unique result.
export class RankedEligibleSelector extends LocalHybridSelector {
 override readonly id:string='local-ranked';
 override preselect(){return null;}
}
export interface LocalPreferenceModel {readonly id:string;start?():Promise<void>;close?():void;choose(speech:string,assets:readonly LibraryAsset[],signal:AbortSignal):Promise<string>}
export class ClassifierPreferenceSelector extends LocalHybridSelector {
 override readonly id:string;
 constructor(private preference:LocalPreferenceModel,private budgetMs=300){super();this.id=`local-preference:${preference.id}`;}
 private ready?:Promise<void>;
 async prepare(signal:AbortSignal){signal.throwIfAborted();await (this.ready??=this.preference.start?.()??Promise.resolve());signal.throwIfAborted();}
 close(){this.preference.close?.();this.ready=undefined;}
 readonly stats={choices:0,fallbacks:0};
 override async select(context:SelectionContext,signal:AbortSignal):Promise<LibraryDecision>{
  signal.throwIfAborted();const eligible=eligibleAssets(context);
  if(context.intent.mode!=='present'||eligible.length<2)return super.select(context,signal);
  // Ranking bounds the menu; eligibility remains a hard host condition.
  const menu=eligible.slice(0,5),deadline=new AbortController();
  const abort=()=>deadline.abort(signal.reason);signal.addEventListener('abort',abort,{once:true});
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{deadline.abort(Error('Preference deadline'));reject(Error('Preference deadline'));},this.budgetMs);});
   const selected=await Promise.race([this.preference.choose(context.speech,menu,deadline.signal),timeout]);signal.throwIfAborted();
   if(!menu.some(asset=>asset.id===selected))throw Error('Preference model returned an ineligible asset');
   this.stats.choices++;return {action:'show',selected};
  }catch(error){signal.throwIfAborted();this.stats.fallbacks++;return super.select(context,signal);}
  finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
 }
}
