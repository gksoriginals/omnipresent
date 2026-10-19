import {BaselinePresenter} from './baseline.js';
import {EmbeddingGemmaModel} from '../models/embeddings.js';
import {decisionRegistry} from '../models/decisions.js';
import type {Embedder} from '../controllers/semantic-retrieval.js';
import {nullTrace,type TraceSink} from '../experiments/trace.js';
import {FocusPlanner,type CompositionPlanner} from './composition.js';
// Provider-backed comparison is explicit. Normal/default presentation has no provider model.
export function createPresenter(profile='baseline',embedding:Embedder=new EmbeddingGemmaModel(),trace:TraceSink=nullTrace,planner:CompositionPlanner=new FocusPlanner()){
 const local=profile==='baseline'||profile==='local-hybrid';
 return {id:local?'local-hybrid':profile,presenter:new BaselinePresenter(embedding,local?null:decisionRegistry.get(profile),undefined,undefined,trace,planner)};
}
