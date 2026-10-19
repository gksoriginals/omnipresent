> Evidence gate result: [EXP-037](research/evidence_gate_results.md) reduced hosted calls from 27 to 4 per pass, retaining all labeled positives and rejecting all negatives. Timings include changed-content refresh/fallback/final validation; authored aliases are not general live-speech evidence.

> Cue bypass result: [EXP-035](research/cue_policy_results.md) counts changed-content refreshes and final grounding, with 44.4% fewer hosted calls. Exact-cue coverage is constructed; missing-evidence quality failed and no live latency claim follows.

> Larger-library check: [EXP-033](research/large_library_results.md) includes warm catalog refresh, fallback and final grounding. No repeatable p95 improvement; content-changing refresh and visible-paint latency remain unvalidated.

> Policy research: [practical composition techniques](research/common_sense_composition.md) separates cheap cue/eligibility paths, continuity and bounded asset warming from speculative model forecasts. Proposed; no additional latency claim.

> Prediction/caching update: [EXP-031](research/prediction_first_results.md) measures hybrid facet routing, scoped exact query caches and approximate forecast lease reuse. Candidate readiness, speculative work and audience response latency are reported separately.

> Measurement update: [EXP-024/025](research/semantic_retrieval_results.md) now measure local EmbeddingGemma 2 queries, scoped exact-query caching and bounded System One selection. These are offline timings, not live end-to-end latency.

# Prepared content and low-latency presentation

Status: product direction and experimental technical plan, 16 October 2026.

## The product decision

Prepare expensive content before presenting. During a talk, the system should mostly
retrieve approved assets and decide what to show, in what order, with what emphasis.
It should not generate the full presentation or regenerate a chart on every phrase.
The user explicitly requested caching, semantic search over prepared assets, and
using generative UI to order/compose retrieved content. This changes the hot path,
not the distinction between interview, storyteller, and realtime agents.

The intended loop is:

1. Interview gathers intent, audience, outcome, source material and constraints.
2. Storyteller prepares an editable story, audience copy, speaker notes, reusable
   images, diagrams, charts and composition options. Validate and review them.
3. Index the approved story/asset snapshot and warm relevant renderers before start.
4. Streaming speech supplies evolving intent. Retrieve a small candidate set of
   beats/assets from that snapshot; include current topic, recent speech, pacing
   and presenter controls in the decision.
5. Reuse the current scene when sufficient. For a clear candidate, select/reveal/
   reorder existing components. Use a bounded LLM call for ambiguous transitions,
   synthesis or genuinely new intent; preserve the last scene while it runs.
6. Commit a complete, validated composition atomically; record its source IDs and
   revision. Continue observing speech and canvas state.

Retrieval ranks relevance, not timing or narrative suitability. The presentation
policy still decides when to change, what to hold, whether to go backward, and
how to combine assets. Generative UI is the composition/rendering layer; AG-UI is
an event protocol candidate, not a substitute for the retrieval or policy layer.
The initial implementation selects one prepared visual/image per beat; multi-asset
reordering, emphasis and reveal operations are planned, not implemented.

## Where EmbeddingGemma fits

Use embeddings to search source passages during preparation, find existing assets
instead of generating duplicates, and retrieve approved beat/asset candidates from
live speech. EmbeddingGemma supports text retrieval and semantic similarity;
EmbeddingGemma 2's model card describes multimodal embeddings, which could later
match uploaded images and other media. Model availability, local runtime, licensing,
quality, footprint and contention still need to be validated for the chosen version.
Do not silently treat a text-only embedding model as understanding images.

At preparation/review time, create a manifest per asset: ID, content digest, story
revision, audience-facing description, semantic cues/aliases, source references,
kind, units/data version, composition compatibility and provenance. Index short
passages/cues rather than whole presentations. Store model ID, version, dimensions,
normalization and task prompts alongside vectors. Rebuild vectors after content or
embedding-model changes. Small stories can use an in-memory vector matrix; do not
add a vector database until scale, durability or sharing requires it.

At runtime, search only the loaded approved snapshot. Combine semantic similarity
with lexical/entity matches and story continuity. Use top-k candidates, score and
margin checks, and a hold state. Thresholds must come from labeled speech replays,
including negation, corrections, ambiguous topics, out-of-order speech, accents and
ASR errors. Similarity alone must not grant approval to unreviewed material.

Sources: [EmbeddingGemma model card](https://ai.google.dev/gemma/docs/embeddinggemma/model_card),
[EmbeddingGemma 2 model card](https://ai.google.dev/gemma/docs/embeddinggemma/model_card_2?hl=en).

## Cache layers and invalidation

| Cache | Key and invalidation | Status |
| --- | --- | --- |
| Extracted source / prepared assets | Content digest, converter version and options. Keep original provenance; edits create new versions. | Image storage is digest-addressed; document extraction cache is planned. |
| Asset embeddings | Content digest + embedding model/version/task/dimensions. | Planned. |
| Renderer output | Validated visual spec + renderer version/theme. Warm common layouts/fonts. | Mermaid SVG memoization is bounded; chart components reuse prepared data; warming across a full story is planned. |
| Repeated speech decision | Active story snapshot + current beat + normalized exact transcript. | Implemented, 64 entries per live session. New story/start clears it. Feedback requests are not cached. |
| Semantic decision cache | Similar transcript + same scene/context, with strict score/margin and contradiction checks. | Experimental; not enabled. |
| LLM prefix / KV reuse | Stable system/catalog prefix, with runtime/model-specific measurement. | Candidate; no claimed benchmark improvement. |

Do not cache solely on transcript similarity: “show revenue” and “do not show
revenue” can be close in vector space. Presenter interventions, source changes,
revision changes and dialogue context may invalidate decisions. Scope caches by
presentation and ownership; do not reuse private material between users. Bounded
queues/caches and cancellation are required even when using fast retrieval.

## Critical path and experiments

Measure separately: audio capture, STT processing, endpointing, intent/retrieval,
LLM time-to-tool, policy validation, composition commit, asset loading and paint.
Compare both phrase-end-to-visible-scene and final-transcript-to-commit. Cache hits
and holds must be reported separately from uncached transitions. Record accuracy,
unwanted transitions, retrieval recall, stale commits, memory and concurrent load.
Do not report a warm-cache number as overall latency.

The earlier recorded-audio trial measured 2.28–2.92 seconds **after** final STT text,
with websocket p95 under 1 ms. It did not measure physical microphone latency.
This suggests moving routine selection off the large-model path is worth testing;
it does not prove semantic retrieval alone will provide acceptable behavior.

Next comparisons on identical labeled recordings:

- Current tool agent vs compact structured scene classifier.
- Embedding retrieval + continuity/hold policy, then LLM only for ambiguity.
- Exact decision-cache hits; semantic-cache candidates with contradiction tests.
- Stable prompt prefixes, lower output budgets, warm model and preloaded assets.
- Speech partials for speculative retrieval/preloading only; avoid visibly following
  unstable partials without separate evidence that it improves behavior.

Initial experimental target: confident prepared-content selection under 300 ms after
final transcript, with no accuracy regression against the baseline. This is a target,
not achieved performance or a fixed product SLA. New-content generation remains
background work surfaced as a preparation request; it must not block the active scene.

No new framework or media service is required to test this architecture. Mermaid
and Recharts are content renderers; they do not select the generative UI framework.
Library comparisons (json-render and other candidates) remain open and should use
the same content schemas and replay cases.

## Latest bounded measurement

The five-case speech replay after this change passed. Uncached direction times
were 1.59–1.89 s after final transcription. An exact repeated off-topic phrase
at the same scene hit the 64-entry session cache in 0.10 ms, with no model call.
This demonstrates exact reuse only; semantic search is not yet implemented and
these few samples do not establish a general improvement. See
[workflow validation](research/workflow-redesign-validation.md) and
[recorded evidence](research/speech-loop-cache-validation.json).
