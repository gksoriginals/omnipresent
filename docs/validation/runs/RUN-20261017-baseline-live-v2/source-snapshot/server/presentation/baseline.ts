import type {Preparation} from "../../shared/preparation.js";
import type {CompositionDecider} from "../agents/adaptive.js";
import {LibraryPolicy,type DecisionGate} from "../controllers/library-policy.js";
import {evidenceGate,interpretEvidence,validateEvidence} from "../controllers/evidence-contract.js";
import {groundLibrary} from "../controllers/library-grounding.js";
import type {DecisionModel} from "../models/decisions.js";
import type {Embedder} from "../controllers/semantic-retrieval.js";
import {presentationCatalog} from "./catalog.js";
export class BaselinePresenter {
 private question:string|undefined;
 private key="";private policy:LibraryPolicy|null=null;private catalog:ReturnType<typeof presentationCatalog>|null=null;
 constructor(private embedding:Embedder,private decision:DecisionModel){}
 readonly decide:CompositionDecider=async(state,current,speech,signal)=>{
  const key=JSON.stringify({revision:state.revision,flow:state.flow,visuals:state.visuals,artifacts:state.artifacts});
  this.question=undefined;
  if(key!==this.key){
   const catalog=presentationCatalog(state);
   const strict=evidenceGate({requireIndependentReview:process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW==="true",feedback:e=>{this.question=e.kind==="clarification"?"Please clarify the intended content or evidence scope in Prepare.":`More evidence is needed for this explanation (${e.reason}).`;}});
   // Resolve omitted story-local scope only when the prepared alias identifies a unique claim.
   // Never append a topic/claim inferred merely from the selected candidate.
   const contextual=(text:string)=>{
    const frame=interpretEvidence(text,catalog.assets);if(frame.mode!=="clarify"||frame.reason!=="unspecified-scope"||frame.claims.length!==1)return text;
    const candidates=catalog.assets.filter(a=>validateEvidence(a).claims.some(c=>frame.claims.includes(c.id)));
    const entities=[...new Set(candidates.map(a=>a.entity))],statuses=[...new Set(candidates.map(a=>a.status))];
    if(entities.length!==1||statuses.length!==1)return text;
    const family=frame.family??(candidates.some(a=>a.family==="diagram")?"diagram":candidates.some(a=>a.family==="chart")?"chart":candidates.some(a=>a.family==="image")?"image":"statement");
    return `${text} ${frame.entities.length?"":entities[0]} ${frame.provenance||frame.audited?"":statuses[0]} ${frame.family?"":family}`;
   };
   const gate:DecisionGate={before:(s,a,c)=>strict.before(contextual(s),a,c),after:(s,r,a,c)=>strict.after(contextual(s),r,a,c)};
   const policy=new LibraryPolicy(this.embedding,async(text,ranked,abort)=>groundLibrary(text,ranked,abort,async()=>{},()=>{},this.decision),gate);
   await policy.refresh(catalog.assets,catalog.bundles,signal);signal.throwIfAborted();this.policy=policy;this.catalog=catalog;this.key=key;
  }
  // Feedback belongs to the current call, not the closure of a previous initialization.
  const result=await this.policy!.decide(speech,signal);signal.throwIfAborted();
  if(result.action==="context")this.question="The requested evidence is not available in this story. Add or clarify it in Prepare.";
  const composition=result.action==="show"&&result.selected?this.catalog!.bindings.get(result.selected)??null:null;
  return {composition,question:this.question,metadata:{baseline:"evidence-v1",model:this.decision.id,path:result.path,action:result.action,operation:result.operation,revision:result.revision}};
 };
}
