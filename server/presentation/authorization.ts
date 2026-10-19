import type {Preparation} from "../../shared/preparation.js";
import {validateComposition,type AdaptiveComposition} from "../../shared/adaptive.js";
import type {EvidenceIntent} from "../controllers/evidence-contract.js";
import {presentationCatalog} from "./catalog.js";
import {validatePlannedComposition} from "./composition.js";
import {storyRequestFrame,type RequestFrame} from "./request-frame.js";

export function beatRequestFrame(state:Preparation,beat:number):RequestFrame{
 const evidence=state.flow?.beats[beat]?.evidence;
 if(!evidence)throw Error("Story beat has no evidence contract");
 const intent:EvidenceIntent={mode:"present",reason:"manual-cue",claims:evidence.claims.map(c=>c.id),entities:[evidence.entity],years:evidence.timeframe?[evidence.timeframe]:[],family:null,provenance:null,audited:false,unit:null,unknown:[]};
 return {transcript:"",revision:String(state.revision),intent,inferred:{entity:null,provenance:null,family:null}};
}

// Called at the commit boundary, independently of the proposal source.
export function authorizeComposition(state:Preparation,input:unknown,current:AdaptiveComposition,request:RequestFrame|string):AdaptiveComposition{
 const catalog=presentationCatalog(state);
 const parsed=validateComposition(input,state);
 const original=typeof request==="string"?storyRequestFrame(request,catalog.assets,String(state.revision)):request;
 // Inferred form is a presentation preference; spoken form and factual obligations remain binding.
 const frame=original.inferred.family?{...original,intent:{...original.intent,family:null}}:original;
 const first=parsed.blocks[0];
 const selected=[...catalog.references].find(([,ref])=>ref.beat===first.beat&&ref.kind===first.kind)?.[0];
 if(!selected)throw Error("Uncatalogued composition component");
 return validatePlannedComposition(parsed,{state,catalog,selected,frame,current,requireIndependentReview:process.env.OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW==="true"});
}
