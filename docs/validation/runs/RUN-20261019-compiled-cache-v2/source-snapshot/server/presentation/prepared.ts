import {createHash} from "node:crypto";
import type {Preparation} from "../../shared/preparation.js";
import {presentationCatalog} from "./catalog.js";
import {immutablePreparation,isImmutablePreparation} from "./immutable.js";
export {immutablePreparation} from "./immutable.js";
export function preparationIdentity(state:Preparation){
 return createHash("sha256").update(JSON.stringify({revision:state.revision,approvedRevision:state.approvedRevision,flowBasedOnRevision:state.flowBasedOnRevision,flow:state.flow,visuals:state.visuals,artifacts:state.artifacts})).digest("hex");
}
export type PreparedPresentation=ReturnType<typeof compilePresentation>;
const compiled=new WeakMap<Preparation,{state:Preparation;key:string;catalog:ReturnType<typeof presentationCatalog>}>();
export function compilePresentation(input:Preparation){
 if(isImmutablePreparation(input)){const ready=compiled.get(input);if(ready)return ready;}
 const state=immutablePreparation(input),key=preparationIdentity(state),catalog=presentationCatalog(state);
 const deepFreeze=(value:unknown):void=>{if(value&&typeof value==="object"){for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}};
 deepFreeze(catalog.assets);deepFreeze(catalog.bundles);
 const snapshot=Object.freeze({state,key,catalog});compiled.set(state,snapshot);return snapshot;
}
