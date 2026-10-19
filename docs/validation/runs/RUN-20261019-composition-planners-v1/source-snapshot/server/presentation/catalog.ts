import type {Preparation} from "../../shared/preparation.js";
import {preparedComponents} from "../controllers/hybrid-components.js";
import {validateEvidence,type EvidenceAsset} from "../controllers/evidence-contract.js";
import type {CueBundle} from "../controllers/library-policy.js";
export type ComponentReference={beat:number;kind:"statement"|"visual"|"image"};
export type PresentationCatalog=ReturnType<typeof presentationCatalog>;
export function presentationCatalog(state:Preparation){
 if(!state.flow||state.approvedRevision!==state.revision)throw Error("Save and review this story before presenting");
 const references=new Map<string,ComponentReference>();
 const assets:EvidenceAsset[]=preparedComponents(state).map(c=>{
  const beat=state.flow!.beats[c.beat];
  if(!beat.evidence)throw Error("This story predates the evidence baseline. Create a new story.");
  const evidence=beat.evidence,entity=evidence.entity;
  if(!evidence.approved)throw Error("Review evidence before presenting");
  const asset:EvidenceAsset={id:c.id,title:c.title,text:c.text,entity,year:evidence.timeframe?Number(evidence.timeframe):new Date().getUTCFullYear(),status:evidence.provenance==="illustrative"?"illustrative":"actual",family:c.family as EvidenceAsset["family"],evidence};
  validateEvidence(asset);references.set(c.id,{beat:c.beat,kind:c.family==="statement"?"statement":c.family==="image"?"image":"visual"});return asset;
 });
 const bundles:CueBundle[]=assets.map(a=>({assetId:a.id,requests:[...(state.flow!.beats[references.get(a.id)!.beat].cueAliases??[]),a.title,a.text].filter(Boolean)}));
 // Colliding title/cues across forms deliberately ground instead of choosing an arbitrary visual.
 return {assets,references,bundles};
}
