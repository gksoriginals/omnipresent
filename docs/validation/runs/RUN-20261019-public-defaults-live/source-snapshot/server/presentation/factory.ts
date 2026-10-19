import {runtimeDefaults} from '../config/defaults.js';
import {ClassifierPreferenceSelector} from './selection.js';
import {LocalClassifierPreference} from '../models/local-preference.js';
import {BaselinePresenter} from './baseline.js';
import {EmbeddingGemmaModel} from '../models/embeddings.js';
import {decisionRegistry} from '../models/decisions.js';
import type {Embedder} from '../controllers/semantic-retrieval.js';
import {nullTrace,type TraceSink} from '../experiments/trace.js';
import {compositionPlanner,type CompositionPlanner} from './composition.js';
// Provider-backed comparison is explicit. Normal/default presentation has no provider model.
export function createPresenter(profile:string=runtimeDefaults.presentation.profile,embedding:Embedder=new EmbeddingGemmaModel(),trace:TraceSink=nullTrace,planner:CompositionPlanner=compositionPlanner(runtimeDefaults.presentation.planner)){
 const classifier=profile==='local-classifier'||profile==='local-reranker';
 const local=classifier||profile==='baseline'||profile==='local-hybrid';
 return {id:classifier?profile:local?'local-hybrid':profile,presenter:new BaselinePresenter(embedding,local?null:decisionRegistry.get(profile),undefined,undefined,trace,planner,classifier?new ClassifierPreferenceSelector(profile==='local-reranker'?new LocalClassifierPreference('minilm','runtime/reranker_preference_worker.py'):new LocalClassifierPreference(),runtimeDefaults.presentation.preferenceBudgetMs):undefined)};
}
