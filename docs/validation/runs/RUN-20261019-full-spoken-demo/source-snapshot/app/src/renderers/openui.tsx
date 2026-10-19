import React from "react";
import {Renderer,createLibrary,defineComponent} from "@openuidev/react-lang";
import {z} from "zod";
import {adaptiveSchema,type AdaptiveComposition} from "../../../shared/adaptive";
import {Block,blockProps} from "./PresentationBlock";
const OBlock=defineComponent({name:"PresentationBlock",description:"Grounded prepared presentation content",props:blockProps,component:Block});
const OCanvas=defineComponent({name:"PresentationCanvas",description:"Presentation layout",props:z.object({layout:adaptiveSchema.shape.layout,children:z.array(OBlock.ref)}),component:({props,renderNode})=><article className={`adaptive-canvas layout-${props.layout}`}>{renderNode(props.children)}</article>});
export const presentationLibrary=createLibrary({root:"PresentationCanvas",components:[OCanvas,OBlock]});
export function openuiProgram(c:AdaptiveComposition){
 return `root = PresentationCanvas(${JSON.stringify(c.layout)}, [${c.blocks.map(b=>b.id).join(", ")}])\n`+c.blocks.map(b=>`${b.id} = PresentationBlock(${[b.id,b.kind,b.beat,b.emphasis,b.reveal??0].map(x=>JSON.stringify(x)).join(", ")})`).join("\n");
}
export function OpenUICanvas({composition}:{composition:AdaptiveComposition}){return <Renderer library={presentationLibrary} publishObservability={false} response={openuiProgram(composition)}/>;}
