import {createOpenAICompatible} from "@ai-sdk/openai-compatible";
import type {LanguageModel} from "ai";
export interface LanguageModelAdapter {readonly id:string;create():LanguageModel}
export class OpenAICompatibleLanguageModel implements LanguageModelAdapter{
 constructor(readonly id:string,private config:{baseURL:string;model:string;apiKey?:string;local:boolean}){}
 create(){const c=this.config;return createOpenAICompatible({name:this.id,baseURL:c.baseURL,apiKey:c.apiKey,transformRequestBody:body=>c.local&&c.baseURL.includes(":11434")?{...body,reasoning_effort:"none"}:body}).chatModel(c.model);}
}
