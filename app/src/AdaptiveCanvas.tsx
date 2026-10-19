import React from "react";
import type {AdaptiveComposition} from "../../shared/adaptive";
import type {Preparation} from "../../shared/preparation";
import {Assets} from "./renderers/PresentationBlock";
import {OpenUICanvas} from "./renderers/openui";
import {JsonCanvas} from "./renderers/json-render";
export {openuiProgram,presentationLibrary} from "./renderers/openui";
export {jsonSpec} from "./renderers/json-render";
const renderers={openui:OpenUICanvas,"json-render":JsonCanvas};
export type RendererId=keyof typeof renderers;
export function AdaptiveCanvas({composition,state,engine}:{composition:AdaptiveComposition;state:Preparation;engine:RendererId}){
 const Renderer=renderers[engine];return <Assets.Provider value={state}><Renderer composition={composition}/></Assets.Provider>;
}
