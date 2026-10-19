import React,{createContext,useContext,useMemo} from "react";
import {z} from "zod";
import {adaptiveSchema} from "../../../shared/adaptive";
import type {Preparation} from "../../../shared/preparation";
import {Visual} from "../Visual";
export const Assets=createContext<Preparation|null>(null);
export const blockProps=adaptiveSchema.shape.blocks.element.extend({reveal:z.number().int().min(0).max(12)});
export function Block({props}:{props:z.infer<typeof blockProps>}){
 const state=useContext(Assets)!;const beat=state.flow!.beats[props.beat];
 const visual=state.visuals?.find(v=>v.id===beat.visualId)?.spec;
 const image=state.artifacts.find(a=>a.id===beat.imageArtifactId)?.media;
 const revealed=useMemo(()=>visual?.kind==="diagram" && props.reveal>0 ? {...visual,nodes:visual.nodes.slice(0,props.reveal),edges:visual.edges.filter(e=>e.from<props.reveal! && e.to<props.reveal!)} : visual,[visual,props.reveal]);
 return <section className={`adaptive-block emphasis-${props.emphasis}`} data-slot={props.id} data-kind={props.kind} data-beat={props.beat}>
   <h1>{props.kind==="visual"?visual?.title:props.kind==="image"?image?.alt:beat.title}</h1>
   {props.kind==="statement" && <p>{beat.audienceText}</p>}
   {props.kind==="visual" && revealed && <Visual spec={revealed} />}
   {props.kind==="image" && image && <img src={image.url} alt={image.alt} />}
 </section>;
}
