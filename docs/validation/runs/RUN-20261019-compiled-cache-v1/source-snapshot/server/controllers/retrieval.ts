import {LibrarySearch,type LibraryAsset} from "./library-search.js";
import type {Embedder} from "./semantic-retrieval.js";

// A snapshot owns its index. Implementations must include content and configuration in revision.
export interface RetrievalSnapshot {
 readonly revision:string;
 build(signal:AbortSignal):Promise<void>;
 retrieve(text:string,signal:AbortSignal):Promise<readonly LibraryAsset[]>;
}
export type RetrievalFactory=(assets:readonly LibraryAsset[],embedder:Embedder)=>RetrievalSnapshot;
export const hybridRetrieval:RetrievalFactory=(assets,embedder)=>{
 const index=new LibrarySearch(assets,embedder);
 return {revision:index.revision,build:signal=>index.build(signal),async retrieve(text,signal){
  const vector=await index.query(text,signal);signal.throwIfAborted();return index.rank(text,vector);
 }};
};
