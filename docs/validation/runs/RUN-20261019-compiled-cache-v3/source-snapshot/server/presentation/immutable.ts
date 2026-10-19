import type {Preparation} from "../../shared/preparation.js";
const trusted=new WeakSet<Preparation>();
function freeze(value:unknown):void{if(value&&typeof value==="object"){for(const child of Object.values(value))freeze(child);Object.freeze(value);}}
// Only host-owned clones can be reused by identity. Arbitrarily frozen input is not trusted.
export function immutablePreparation(input:Preparation):Preparation{
 if(trusted.has(input))return input;
 const state=structuredClone(input);freeze(state);trusted.add(state);return state;
}

export const isImmutablePreparation=(state:Preparation)=>trusted.has(state);
