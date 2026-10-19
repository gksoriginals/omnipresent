import React from "react";
import {Renderer,JSONUIProvider,defineRegistry} from "@json-render/react";
import {schema} from "@json-render/react/schema";
import {defineCatalog} from "@json-render/core";
import {z} from "zod";
import {adaptiveSchema,type AdaptiveComposition} from "../../../shared/adaptive";
import {Block,blockProps} from "./PresentationBlock";
const catalog=defineCatalog(schema,{components:{PresentationCanvas:{props:z.object({layout:adaptiveSchema.shape.layout}),description:"Presentation layout"},PresentationBlock:{props:blockProps,description:"Prepared presentation content"}},actions:{}});
const {registry}=defineRegistry(catalog,{components:{PresentationCanvas:({props,children})=><article className={`adaptive-canvas layout-${props.layout}`}>{children}</article>,PresentationBlock:Block}});
export function jsonSpec(c:AdaptiveComposition){
 return {root:"root",elements:{root:{type:"PresentationCanvas",props:{layout:c.layout},children:c.blocks.map(b=>b.id)},...Object.fromEntries(c.blocks.map(b=>[b.id,{type:"PresentationBlock",props:{...b,reveal:b.reveal??0},children:[]}]))}};
}
export function JsonCanvas({composition}:{composition:AdaptiveComposition}){return <JSONUIProvider registry={registry}><Renderer spec={jsonSpec(composition)} registry={registry}/></JSONUIProvider>;}
