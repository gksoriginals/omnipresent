import {resolve} from "node:path";
import {validateVectors,type Embedder,type EmbeddingSpace} from "../controllers/semantic-retrieval.js";

export interface EmbeddingModel extends Embedder {readonly id:string; prepare?(signal:AbortSignal):Promise<void>}
type Runtime={tokenizer:any;model:any};
const modelId="onnx-community/embeddinggemma-2-ONNX";
const revision="daa72c51243991dfcaf9f9137d2c573d8f7790c0";
export class EmbeddingGemmaModel implements EmbeddingModel{
 readonly id="embeddinggemma-2-js-onnx-q8";
 readonly space:EmbeddingSpace={model:modelId,revision,dimensions:768};
 private runtime?:Promise<Runtime>;
 private disposed=false;
 prepare(signal:AbortSignal){signal.throwIfAborted();return this.load(signal).then(()=>{});}
 private load(signal:AbortSignal){
  if(!this.runtime){this.runtime=(async()=>{
   const {env,AutoConfig,AutoTokenizer,AutoModel}=await import("@huggingface/transformers");
   env.cacheDir=process.env.OMNIPRESENT_MODEL_CACHE_DIR??resolve(process.env.OMNIPRESENT_DATA_DIR??"output/omnipresent","models/huggingface");
   const options={revision,progress_callback:(event:any)=>{if(this.disposed)throw Error("Embedding model loading cancelled");}};
   const config=await AutoConfig.from_pretrained(modelId,options);
   (config as any).vision_config=null;(config as any).audio_config=null;
   const [tokenizer,model]=await Promise.all([
    AutoTokenizer.from_pretrained(modelId,options),
    AutoModel.from_pretrained(modelId,{...options,config,device:"cpu",dtype:"q8"}),
   ]);
   return {tokenizer,model};
  })().catch(error=>{this.runtime=undefined;throw error;});}
  signal.throwIfAborted();return this.runtime;
 }
 async encode(texts:string[],kind:"query"|"document",signal:AbortSignal){
  signal.throwIfAborted();
  if(process.env.OMNIPRESENT_TEST_EMBEDDINGS==="1")return texts.map((_,index)=>{const vector=Array(this.space.dimensions).fill(0);vector[index%this.space.dimensions]=1;return vector;});
  const {tokenizer,model}=await this.load(signal);signal.throwIfAborted();
  const inputs=texts.map(text=>kind==="query"?`task: search result | query: ${text}`:text);
  const encoded=tokenizer(inputs,{padding:true});const output=await model(encoded);
  signal.throwIfAborted();const values=output.sentence_embedding.tolist() as number[][];
  const vectors=values.map(vector=>{const norm=Math.sqrt(vector.reduce((sum,n)=>sum+n*n,0));return norm?vector.map(n=>n/norm):vector;});
  validateVectors(vectors,texts.length,this.space.dimensions);return vectors;
 }
}
