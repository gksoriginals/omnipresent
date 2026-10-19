import {ClassifierPreferenceSelector} from './selection.js';
import {LocalClassifierPreference} from '../models/local-preference.js';
import {BaselinePresenter} from './baseline.js';
import {EmbeddingGemmaModel} from '../models/embeddings.js';
import {decisionRegistry} from '../models/decisions.js';
import type {Embedder} from '../controllers/semantic-retrieval.js';
import {nullTrace,type TraceSink} from '../experiments/trace.js';
import {FocusPlanner,type CompositionPlanner} from './composition.js';
// Provider-backed comparison is explicit. Normal/default presentation has no provider model.
export function createPresenter(profile='baseline',embedding:Embedder=new EmbeddingGemmaModel(),trace:TraceSink=nullTrace,planner:CompositionPlanner=new FocusPlanner()){
 const classifier=profile==='local-classifier';
 const local=classifier||profile==='baseline'||profile==='local-hybrid';
 return {id:classifier?'local-classifier':local?'local-hybrid':profile,presenter:new BaselinePresenter(embedding,local?null:decisionRegistry.get(profile),undefined,undefined,trace,planner,classifier?new ClassifierPreferenceSelector(new LocalClassifierPreference()):undefined)};
}
