import type {DecisionRequest} from "../agents/system-one.js";
import {sendDecision} from "./decision-transport.js";
export interface DecisionModel {readonly id:string;readonly model:string;decide(request:DecisionRequest,signal:AbortSignal):Promise<any>}
export class ModelRegistry<T extends {readonly id:string}>{
 private models=new Map<string,T>();
 register(model:T){if(this.models.has(model.id))throw Error(`Duplicate model: ${model.id}`);this.models.set(model.id,model);return this;}
 get(id:string):T{const model=this.models.get(id);if(!model)throw Error(`Unknown model: ${id}`);return model;}
 list(){return [...this.models.values()].map(m=>({id:m.id}));}
}
export const decisionModels={jev:"typesafe/jev-1.14",laya:"convaiinnovations/laya",microsoft:"microsoft/microsoft-decision-1",kev:"jaredpalmer/kev-4b",clef:"cloudflare/clef","clef-flash":"cloudflare/clef-flash","clef-omni":"cloudflare/clef-omni"} as const;
export type DecisionProvider=keyof typeof decisionModels;
export class OpenRouterDecisionModel implements DecisionModel{
 constructor(readonly id:string,readonly model:string){}
 decide(request:DecisionRequest,signal:AbortSignal){return sendDecision(this.model,false,request,signal);}
}
export class JevModel extends OpenRouterDecisionModel{constructor(){super("jev",decisionModels.jev);}}
export class ClefModel extends OpenRouterDecisionModel{constructor(){super("clef",decisionModels.clef);}}
export class ClefFlashModel extends OpenRouterDecisionModel{constructor(){super("clef-flash",decisionModels["clef-flash"]);}}
export class ClefOmniModel extends OpenRouterDecisionModel{constructor(){super("clef-omni",decisionModels["clef-omni"]);}}
export class LayaModel implements DecisionModel{readonly id="laya";readonly model=decisionModels.laya;async decide(request:DecisionRequest,signal:AbortSignal){const raw=await sendDecision(this.model,true,request,signal);return {...raw,usage:{...raw.usage,cost:raw.usage?.cost??0},billingScope:"Local inference; machine/energy cost is not priced"};}}
export const decisionRegistry=new ModelRegistry<DecisionModel>();
for(const model of [new JevModel(),new LayaModel(),new ClefModel(),new ClefFlashModel(),new ClefOmniModel()])decisionRegistry.register(model);
// Hosted comparisons always require an explicit profile. There is no billed default.
export function comparisonDecisionModel(profile:string){return decisionRegistry.get(profile);}
