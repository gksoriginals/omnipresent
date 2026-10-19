# Generation and Inference — Research Notes

16 October 2026 · Potential technical PRD input; no backend plan selected

## Product question

What inference capabilities help Omnipresent understand an explanation and create or curate useful presentation material?

The baseline has three distinct agents: an interview agent for gathering context/assets, a presentation storyteller agent for generating the presentation flow, and a realtime presentation agent for directing content as the user speaks. Additional specialists may be useful for research, extraction, retrieval, artifact generation, composition, or review; do not fix their number in advance.

Separate agent identities and responsibilities do not require separate models, providers, or OS processes. Choose models and context per task. Keep preparation work from blocking the live loop; test orchestration, handoff consistency, cancellation, and resource contention as agents are introduced.

## Questions to investigate

- What context helps a model respond usefully without overreacting to partial intent?
- When is selection or a simple operation sufficient, and when does new generation help?
- Which representations enable expressive output while supporting factual integrity and presenter control?
- How should the system handle uncertainty, slow output, cancellation, or changed intent?
- What should run locally, remotely, or in preparation? What privacy, cost, quality, and device tradeoffs result?
- When do multiple models or interchangeable backends solve an observed problem?

Local inference remains an interesting direction. It does not impose a runtime shortlist, model family, common adapter framework, or benchmark matrix before the first useful experiment. Introducing remote processing or a paid service should explicitly address the user’s data and cost expectations.

## Evidence to collect when relevant

Try representative explanations and retain enough context to assess the result. Observe relevance, visual usefulness, factual errors, consistency, response time, correction behavior, and resource usage. Record actual model/provider/version and test conditions when drawing comparisons.

Structured-output success measures only one part of the experience. A valid representation can still be unhelpful or misleading. Compare with simpler or curated approaches where that helps establish the value of generation.

## Path to a technical PRD

When an implementation exposes a concrete inference decision, document the required outcome, viable options, smallest meaningful trial, findings, and revisiting conditions. Define interfaces and quantitative targets when they support that decision. See [potential technical PRDs](technical_design.md).

## Current candidate research

The [baseline technology review](baseline_technology_research.md) records current candidates, sources, limitations, and proposed comparisons. See its “LLM candidates” section. These are documentation-based recommendations pending experiments, not finalized technology choices.

## Retrieval support for agents

The [EmbeddingGemma decision](embeddinggemma_use_cases.md) places retrieval alongside the preparation and live agents. Retrieved artifacts and passages can support interview follow-ups, story preparation, live content selection, and evidence-based responses to deviations. The generative model still interprets the request and produces appropriate text, tool requests, or composition directions.

Evaluate whether retrieved context improves those outcomes over keyword/metadata lookup and simpler context selection. Preserve references and relevant exact constraints; a high similarity score is neither factual verification nor calibrated intent confidence. Sending retrieved content to Groq remains a hosted operation even when embedding computation is local. Embedding-based routing and semantic caching are experiments, not required inference architecture.
