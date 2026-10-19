import {httpEmbedder,type Embedder,type EmbeddingSpace} from "../controllers/semantic-retrieval.js";
import {readFileSync} from "node:fs";
export interface EmbeddingModel extends Embedder {readonly id:string}
export class EmbeddingGemmaModel implements EmbeddingModel{
 readonly id="embeddinggemma-2";readonly space:EmbeddingSpace;
 private adapter:Embedder;
 constructor(space?:EmbeddingSpace){this.space=space??JSON.parse(readFileSync(new URL("../../runtime/retrieval-model.json",import.meta.url),"utf8"));this.adapter=httpEmbedder(this.space);}
 encode(texts:string[],kind:"query"|"document",signal:AbortSignal){return this.adapter.encode(texts,kind,signal);}
}
