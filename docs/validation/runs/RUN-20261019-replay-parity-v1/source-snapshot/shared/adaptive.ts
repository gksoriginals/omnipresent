import { z } from "zod";
import type { Preparation } from "./preparation.js";
// References, never generated chart values or arbitrary markup. Stable slot ids preserve identity.
export const adaptiveSchema = z.object({
  layout:z.enum(["focus","split","sequence"]),
  blocks:z.array(z.object({
    id:z.enum(["primary","secondary","detail","context"]),
    kind:z.enum(["statement","visual","image"]),
    beat:z.number().int().min(0).max(11),
    emphasis:z.enum(["normal","strong"]),
    reveal:z.number().int().min(1).max(12).nullable(),
  })).min(1).max(4),
});
export type AdaptiveComposition=z.infer<typeof adaptiveSchema>;
export function validateComposition(input:unknown,state:Preparation):AdaptiveComposition {
 const result=adaptiveSchema.parse(input);
 if(new Set(result.blocks.map(b=>b.id)).size!==result.blocks.length) throw Error("Duplicate composition slot");
 for(const block of result.blocks){
  const beat=state.flow?.beats[block.beat]; if(!beat) throw Error("Unknown narrative reference");
  if(block.kind==="visual" && !state.visuals?.some(v=>v.id===beat.visualId)) throw Error("Unknown prepared visual");
  if(block.kind==="image" && !state.artifacts.some(a=>a.id===beat.imageArtifactId && a.media)) throw Error("Unknown prepared image");
 }
 return result;
}
export function openingComposition():AdaptiveComposition {
 return {layout:"focus",blocks:[{id:"primary",kind:"statement",beat:0,emphasis:"normal",reveal:null}]};
}
