import type {Preparation} from "../../shared/preparation.js";
import {preparedComponents} from "../controllers/hybrid-components.js";
import {validateEvidence,type EvidenceAsset} from "../controllers/evidence-contract.js";
import type {CueBundle} from "../controllers/library-policy.js";
export function presentationCatalog(state:Preparation){
 if(!state.flow||state.approvedRevision!==state.revision)throw Error("Save and review this story before presenting");
 const bindings=new Map<string,ReturnType<typeof preparedComponents>[number]["composition"]>();
 const assets:EvidenceAsset[]=preparedComponents(state).map(c=>{
  const beat=state.flow!.beats[c.beat];
  if(!beat.evidence)throw Error("This story predates the evidence baseline. Create a new story.");
  const evidence=beat.evidence,entity=evidence.entity;
  if(!evidence.approved)throw Error("Review evidence before presenting");
  const asset:EvidenceAsset={id:c.id,title:c.title,text:c.text,entity,year:evidence.timeframe?Number(evidence.timeframe):new Date().getUTCFullYear(),status:evidence.provenance==="illustrative"?"illustrative":"actual",family:c.family as EvidenceAsset["family"],evidence};
  validateEvidence(asset);bindings.set(c.id,c.composition);return asset;
 });
 const bundles:CueBundle[]=assets.map(a=>({assetId:a.id,requests:[...(state.flow!.beats[Number(a.id.split(":")[1])].cueAliases??[]),a.title,a.text].filter(Boolean)}));
 // Colliding title/cues across forms deliberately ground instead of choosing an arbitrary visual.
 return {assets,bindings,bundles};
}
