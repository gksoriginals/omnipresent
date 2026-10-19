import type {Flow,Preparation} from "../../shared/preparation.js";
import {sourceDigest} from "../controllers/evidence-contract.js";
// New story generation only. Old saved stories are never upgraded implicitly.
export function prepareEvidence(flow:Flow,state:Preparation):Flow{
 return {...flow,beats:flow.beats.map((beat,i)=>{
  const visual=state.visuals?.find(v=>v.id===beat.visualId)?.spec;
  const refs=state.artifacts.filter(a=>beat.artifactIds.includes(a.id)||beat.imageArtifactId===a.id||(visual?.kind==="chart"&&visual.sourceArtifactId===a.id));
  const sources=refs.length?refs.map(a=>({id:a.id,uri:`artifact://${a.id}`,summary:a.content,sha256:sourceDigest(a.content)})):[{id:`narrative-${i}`,uri:`prepared://beat/${i}`,summary:beat.audienceText||beat.title,sha256:sourceDigest(beat.audienceText||beat.title)}];
  return {...beat,evidence:{version:1 as const,approved:false,provenance:refs.length?"source-backed" as const:"illustrative" as const,verification:"unknown" as const,entity:flow.title,timeframe:null,unit:visual?.kind==="chart"?visual.unit:null,sources,claims:[{id:`beat-${i}`,aliases:[beat.title,...beat.cueAliases??[],...beat.audienceText?[beat.audienceText]:[]],sourceIds:sources.map(s=>s.id)}],independentReview:"pending" as const}};
 })};
}
