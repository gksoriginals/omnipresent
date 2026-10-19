import {interpretEvidence,validateEvidence,type EvidenceIntent} from "../controllers/evidence-contract.js";
import type {LibraryAsset} from "../controllers/library-search.js";
export type RequestFrame=Readonly<{
 transcript:string;
 revision:string;
 intent:Readonly<EvidenceIntent>;
 inferred:Readonly<{entity:string|null;provenance:string|null;family:LibraryAsset["family"]|null}>;
}>;
export type RequestInterpreter=(transcript:string,assets:readonly LibraryAsset[],revision:string)=>RequestFrame;
// Preserve the original utterance. Only uniquely declared story scope may fill omissions.
export const storyRequestFrame:RequestInterpreter=(transcript,assets,revision)=>{
 let intent=interpretEvidence(transcript,assets);
 const inferred:{entity:string|null;provenance:string|null;family:LibraryAsset["family"]|null}={entity:null,provenance:null,family:null};
 if(intent.mode==="clarify"&&intent.reason==="unspecified-scope"&&intent.claims.length===1){
  const candidates=assets.filter(a=>validateEvidence(a).claims.some(c=>intent.claims.includes(c.id)));
  const entities=[...new Set(candidates.map(a=>a.entity))],statuses=[...new Set(candidates.map(a=>a.status))];
  if(entities.length===1&&statuses.length===1){
   inferred.entity=intent.entities.length?null:entities[0];
   inferred.provenance=intent.provenance||intent.audited?null:statuses[0];
   inferred.family=intent.family?null:(candidates.some(a=>a.family==="diagram")?"diagram":candidates.some(a=>a.family==="chart")?"chart":candidates.some(a=>a.family==="image")?"image":"statement");
   // The bounded parser still checks unknown obligations and temporal requirements.
   intent=interpretEvidence(`${transcript} ${inferred.entity??""} ${inferred.provenance??""} ${inferred.family??""}`,assets);
  }
 }
 for(const value of Object.values(intent))if(Array.isArray(value))Object.freeze(value);
 return Object.freeze({transcript,revision,intent:Object.freeze(intent),inferred:Object.freeze(inferred)});
};
