import {runtimeDefaults} from '../config/defaults.js';
import {BaselinePresenter} from './baseline.js';
import {EmbeddingGemmaModel} from '../models/embeddings.js';
import {decisionRegistry} from '../models/decisions.js';
import type {Embedder} from '../controllers/semantic-retrieval.js';
import {nullTrace,type TraceSink} from '../experiments/trace.js';
import {compositionPlanner,type CompositionPlanner} from './composition.js';
// Provider-backed comparison is explicit. Normal/default presentation has no provider model.
export function createPresenter(profile:string=runtimeDefaults.presentation.profile,embedding:Embedder=new EmbeddingGemmaModel(),trace:TraceSink=nullTrace,planner:CompositionPlanner=compositionPlanner(runtimeDefaults.presentation.planner)){
 const local=profile==='baseline'||profile==='local-hybrid';
 const known=local||decisionRegistry.list().some(model=>model.id===profile);
 if(!known)throw Error(`Unknown presentation decision profile: ${profile}`);
 const decision=local?null:decisionRegistry.get(profile);
 return {id:local?'local-hybrid':profile,presenter:new BaselinePresenter(embedding,decision,undefined,undefined,trace,planner)};
}
