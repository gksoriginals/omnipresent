import type {Flow,Preparation} from "../../shared/preparation.js";
import {componentHash} from "./component-evidence.js";
import {componentKinds} from "../../shared/component-evidence.js";
import type {EvidenceContract} from "../../shared/evidence.js";
import {sourceDigest} from "../controllers/evidence-contract.js";
// New story generation only. Old saved stories are never upgraded implicitly.
export function prepareEvidence(flow:Flow,state:Preparation):Flow{
 return {...flow,beats:flow.beats.map((beat,i)=>{
  const visual=state.visuals?.find(v=>v.id===beat.visualId)?.spec;
  const refs=state.artifacts.filter(a=>beat.artifactIds.includes(a.id)||beat.imageArtifactId===a.id||(visual?.kind==="chart"&&visual.sourceArtifactId===a.id));
  const sources=refs.length?refs.map(a=>({id:a.id,uri:`artifact://${a.id}`,summary:a.content,sha256:sourceDigest(a.content)})):[{id:`narrative-${i}`,uri:`prepared://beat/${i}`,summary:beat.audienceText||beat.title,sha256:sourceDigest(beat.audienceText||beat.title)}];
  const evidence:EvidenceContract={version:1 as const,approved:false,provenance:refs.length?"source-backed" as const:"illustrative" as const,verification:"unknown" as const,entity:flow.title,timeframe:null,unit:visual?.kind==="chart"?visual.unit:null,sources,claims:[{id:`beat-${i}`,aliases:[beat.title,...beat.cueAliases??[],...beat.audienceText?[beat.audienceText]:[]],sourceIds:sources.map(s=>s.id)}],independentReview:"pending" as const};
  const componentEvidence:NonNullable<typeof beat.componentEvidence>={};
  for(const kind of componentKinds){
   if(kind==="visual"&&!visual)continue;
   const image=state.artifacts.find(a=>a.id===beat.imageArtifactId);
   if(kind==="image"&&!image?.media)continue;
   const declared=beat.componentClaims?.[kind]??(kind==="statement"?["beat"]:[]);
   const targets=[...new Set(declared.map(reference=>{
    if(!/^(beat|beat:(?:[0-9]|1[01]))$/.test(reference))throw Error("Invalid component claim reference");
    const target=reference==="beat"?i:Number(reference.slice(5));if(!flow.beats[target])throw Error("Unknown component claim reference");return target;
   }))];
   const componentRefs=kind==="statement"?refs:kind==="image"?[image!]:visual?.kind==="chart"?state.artifacts.filter(a=>a.id===visual.sourceArtifactId):[];
   const title=kind==="visual"?visual!.title:kind==="image"?image!.media!.alt:beat.title;
   const componentSources=componentRefs.length?componentRefs.map(a=>({id:a.id,uri:`artifact://${a.id}`,summary:a.content,sha256:sourceDigest(a.content)})):[{id:`component-${kind}-${i}`,uri:`prepared://component/${kind}/${i}`,summary:kind==="statement"?(beat.audienceText||beat.title):(title||beat.title),sha256:sourceDigest(kind==="statement"?(beat.audienceText||beat.title):(title||beat.title))}];
   const claims=targets.length?targets.map(target=>{const b=flow.beats[target];return {id:`beat-${target}`,aliases:[...new Set([b.title,...b.cueAliases??[],...b.audienceText?[b.audienceText]:[],title||beat.title])],sourceIds:componentSources.map(s=>s.id)};}):[{id:`component-${kind}-${i}`,aliases:[title||beat.title],sourceIds:componentSources.map(s=>s.id)}];
   componentEvidence[kind]={contentHash:componentHash(state,beat,kind),evidence:{...evidence,provenance:componentRefs.length?"source-backed":"illustrative",unit:kind==="visual"&&visual?.kind==="chart"?visual.unit:null,sources:componentSources,claims}};
  }
  return {...beat,evidence,componentEvidence};
 })};
}
