import type {Preparation,Flow} from "../../shared/preparation.js";
import type {ComponentKind} from "../../shared/component-evidence.js";
import {evidenceSchema} from "../../shared/evidence.js";
import {sourceDigest} from "../controllers/evidence-contract.js";
const canonical=(value:unknown):unknown=>typeof value==="string"?value.trim():Array.isArray(value)?value.map(canonical):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>[key,canonical(v)])):value;
const contentJSON=(value:unknown)=>JSON.stringify(canonical(value));
export function componentContent(state:Preparation,beat:Flow["beats"][number],kind:ComponentKind):string|null{
 if(kind==="statement")return contentJSON({title:beat.title,text:beat.audienceText??""});
 if(kind==="visual"){const visual=state.visuals?.find(v=>v.id===beat.visualId);return visual?contentJSON({title:beat.title,visual:visual.spec}):null;}
 const image=state.artifacts.find(a=>a.id===beat.imageArtifactId)?.media;return image?contentJSON({title:beat.title,image}):null;
}
export function componentHash(state:Preparation,beat:Flow["beats"][number],kind:ComponentKind){const content=componentContent(state,beat,kind);if(content===null)throw Error("Missing component content");return sourceDigest(content);}
export function validateComponentSnapshot(state:Preparation,beat:Flow["beats"][number],kind:ComponentKind,requireApproved=true){
 const contract=beat.componentEvidence?.[kind];if(!contract)throw Error("Component coverage is not declared");
 const evidence=evidenceSchema.parse(contract.evidence);
 if(new Set(evidence.sources.map(s=>s.id)).size!==evidence.sources.length||new Set(evidence.claims.map(c=>c.id)).size!==evidence.claims.length)throw Error("Duplicate component evidence identifier");
 for(const source of evidence.sources)if(sourceDigest(source.summary)!==source.sha256)throw Error("Component source hash mismatch");
 for(const claim of evidence.claims)if(claim.sourceIds.some(id=>!evidence.sources.some(s=>s.id===id)))throw Error("Unknown component claim source");
 if(requireApproved&&!contract.evidence.approved)throw Error("Review component evidence before presenting");
 if(contract.contentHash!==componentHash(state,beat,kind))throw Error("Component content changed after evidence review");
 for(const source of contract.evidence.sources){
  if(source.uri.startsWith("artifact://")){
   const artifact=state.artifacts.find(a=>a.id===source.id);
   if(!artifact||sourceDigest(artifact.content)!==source.sha256)throw Error("Component source withdrawn or changed");
  }
 }
 return evidence;
}
// Save approves declarations, not semantic entailment or independent audit status.
export function approvePreparedEvidence(flow:Flow,state:Preparation){
 for(const beat of flow.beats){
  if(!beat.evidence)throw Error("Create a new story with evidence contracts before saving.");
  for(const kind of ["statement","visual","image"] as const){
   if(beat.componentEvidence&&componentContent(state,beat,kind)!==null&&!beat.componentEvidence[kind])throw Error("Missing component evidence declaration");
   if(beat.componentEvidence?.[kind])validateComponentSnapshot(state,beat,kind,false);
  }
 }
 for(const beat of flow.beats){beat.evidence!.approved=true;for(const contract of Object.values(beat.componentEvidence??{}))if(contract)contract.evidence.approved=true;}
}
