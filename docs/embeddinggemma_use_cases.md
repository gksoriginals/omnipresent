> Implementation update, 17 October 2026: text-only EmbeddingGemma 2 retrieval and bounded System One selection have now been exercised in [EXP-024/025](research/semantic_retrieval_results.md). The assessment below records the earlier research stage; media retrieval and semantic answer caching remain unvalidated.

# EmbeddingGemma in Omnipresent

16 October 2026 · Product placement decision and research assessment; no model execution or retrieval benchmarks performed

## Decision

Use EmbeddingGemma as the candidate semantic retrieval layer across preparation and live presentation. Prioritize artifact discovery, story-to-asset linking, live contextual retrieval, and question-driven evidence lookup. Include direct visual/media search when the relevant artifacts exist. These are finalized intended uses for exploration, not a claim of production readiness or a requirement to build them all before a first version.

EmbeddingGemma 2 is the preferred version to prototype because Omnipresent combines text and visual artifacts. Start with only the encoders needed by the experiment; the original text-only model remains a useful fallback/comparison. Runtime, storage, dimensions, quality thresholds, and final adoption remain subject to actual trials. This placement does not select a generative UI renderer or agent framework.

## Evidence and source material

The user supplied a use-case survey covering local RAG, cross-modal media search, offline field work, classification/routing, code search, clustering/deduplication, and memory/storage optimizations. The original text is preserved [unchanged](research/sources/embeddinggemma-user-notes.txt). It is research input; claims are not automatically accepted as measured facts.

Additional primary sources reviewed:

- [Google AI Edge use cases](https://developers.googleblog.com/google-ai-edge-with-embeddinggemma-2/): published Instant Media Search, Video Moments Finder, and experimental Mac Foresight examples. They demonstrate the relevance of media retrieval, timestamped search, and conversation-context retrieval. The article also describes zero-shot routing. These are vendor examples, not tested Omnipresent integrations or independent adoption measurements.
- [Sentence Transformers guide](https://ai.google.dev/gemma/docs/embeddinggemma/inference-embeddinggemma-with-sentence-transformers): retrieval, classification, clustering, task prompts, and interpretation of similarity scores.
- [Multimodal guide](https://ai.google.dev/gemma/docs/embeddinggemma/multimodal-embeddinggemma-with-sentence-transformers): encoding text and media for cross-modal search.
- [EmbeddingGemma 2 model card](https://ai.google.dev/gemma/docs/embeddinggemma/model_card_2): capabilities, input limits, precision, output dimensions, and license.
- [Google AI Edge Gallery repository](https://github.com/google-ai-edge/gallery): a reference application for on-device experiments; source was located, not built or tested here.
- [Original model card](https://ai.google.dev/gemma/docs/embeddinggemma/model_card): text-model baseline, distinct from the multimodal successor.

The placements below are Omnipresent-specific engineering recommendations inferred from these capabilities and our product flow.

## Intended product uses

| Placement | Example | Role of embeddings | Boundary |
| --- | --- | --- | --- |
| Interview material discovery | The presenter describes customer onboarding; relevant notes and screenshots are suggested from uploaded material. | Search passages and artifacts from the evolving conversation. | The interview agent asks questions and decides what else is needed. |
| Story-to-asset linking | A story beat about retention is associated with a chart, evidence paragraph, and illustrative image. | Rank candidate material for each narrative point. | Ranking does not verify the claim, units, period, or suitability. |
| Live artifact retrieval | “Let’s look at what happened after launch” retrieves supporting launch-period material. | Match contextualized speech to prepared artifacts. | The live agent resolves ambiguity; the stage controls audience-visible timing. |
| Live story alignment | A paraphrase matches a prepared talking point despite different wording. | Shortlist nearby/relevant story beats. | Similarity does not prove progress, coverage, or completion; revisits remain possible. |
| Questions and deviations | “How does that compare with last year?” locates relevant evidence beyond the current scene. | Retrieve source passages and candidate artifacts for a grounded answer. | A reasoning component assesses the actual comparison; no answer is invented from vectors. |
| Presenter semantic search | The presenter asks to find the earlier process illustration. | Search the current presentation’s material and approved history. | Cross-presentation/private-library access is opt-in and scope-filtered. |

These are one retrieval capability used in different parts of the journey, not six mandatory services. The first useful implementation can expose only one or two entry points.

## Media-specific uses to include when needed

**Images and visual documents:** retrieve illustrations, screenshots, diagram images, or rendered document pages using natural-language descriptions or an example image. Preserve page/region references and companion extracted text where exact wording or numbers matter. Finding a chart visually does not extract its values.

**Video and audio moments:** retrieve relevant segments from demonstrations, recordings, or interviews. Index bounded segments with source/time metadata; an embedding match is a candidate location rather than frame-perfect localization. Retain separate visual and audio information where the query needs either; do not assume a default video encoder automatically uses its soundtrack.

**Direct voice-to-media retrieval:** evaluate v2 audio queries against visual assets if it improves the experience. Keep this experimental relative to STT-text queries: direct audio similarity does not replace transcription needed for a script, quantities, corrections, or inspectable reasoning context. No continuous recording is implied by accepting this use case.

**Reuse across presentations:** let a presenter find earlier artifacts from an explicitly chosen library. Apply access/project filters before exposing candidates. Start within a presentation; broaden scope only when useful and authorized.

## Useful secondary experiments

| Use | Why it may help | Why it remains experimental |
| --- | --- | --- |
| Preparation clustering | Group a large upload by topic so the user and interview agent can explore it. | Semantic groups are suggestions; narrative order and importance need judgment. |
| Related/near-duplicate suggestions | Surface repeated or overlapping material during curation. | Use hashes for exact duplication; similar assets may intentionally show different dates or versions. Never delete automatically. |
| Lightweight topic/intent routing | Compare a contextual utterance against descriptions such as explanation, comparison, or revisit. | Needs examples, negatives, abstention, and correction tests; not authority for scene changes or external actions. |
| Predictive preloading | Retrieve probable next assets from current context and story directions. | Embeddings rank candidates; predictive policy must measure benefit and wasted work. Do not display solely because preloaded. |
| Semantic caching | Suggest reuse of an earlier retrieval result. | Scope, artifact revisions, filters, freshness, and exact intent must match. Similarity alone cannot reuse a factual answer safely. |

Code retrieval is applicable if the presenter uploads code as presentation material. A repository-wide coding assistant is outside this product’s current purpose. Field-maintenance, email triage, and mobile routing examples establish broader applicability, not additional Omnipresent features.

## What it will not own

EmbeddingGemma will not conduct the interview, write the story, generate media, design the component composition, decide when to transition, authorize tools, or certify factual truth. A retrieval pipeline can provide evidence for those activities. Calling it RAG does not supply the generative or verification parts automatically.

It will not act as a complete memory system: identities, revisions, permissions, provenance, timestamps, and user decisions need ordinary application data. Avoid deriving causal relationships, contradicting facts, or story-coverage judgments from a similarity score alone.

## Corrections and qualifications to the supplied notes

- The original model is text-oriented; native shared-space media retrieval belongs to v2. Treat them as separate embedding spaces and reindex on incompatible changes.
- An 8,192-token context is a bounded shared multimodal budget, not unlimited long-document or hours-of-recording ingestion. Split content while preserving references and timestamps.
- The quoted ~191 MB/~567 MB measurements are a particular quantized mobile deployment reported by Google, not a portable end-to-end RAM budget. Measure runtime allocation, index storage, preprocessing, and concurrent STT/LLM/UI use on our machine.
- Reducing 768 dimensions to 128 reduces raw vector storage sixfold at the same element precision. It does not imply a sixfold model RAM reduction or preserved retrieval quality. Test smaller dimensions against a full-dimensional baseline.
- For the documented full-precision path, v2 requires bfloat16 or float32; float16 can silently degrade results. Quantized runtime behavior requires separate validation.
- Native media retrieval can avoid captions/transcripts for some matching tasks, but text extraction/transcription remains useful for exact content and other product features.
- A local embedder keeps embedding computation local. If retrieved content is sent to Groq, that downstream reasoning is hosted; the whole pipeline is not offline.
- Zero-shot classification is a supported downstream technique, not calibrated probability, general planning, or proof that an action is appropriate.

## Small implementation experiment

Use a presentation-sized corpus of story beats, text passages, images, and a short demonstration clip. Include visually similar but factually different charts, repeated terms across topics, paraphrases, corrections, no-match queries, and a question outside the current story.

Compare lexical/metadata lookup, original/text-only embeddings where appropriate, and v2 with the necessary encoders. Label acceptable artifacts and locations for interview queries, story linking, live speech, and questions. Measure top-k recall, top-choice usefulness, no-match errors, time to useful retrieval, indexing cost, memory, and downstream agent errors. Do not claim successful model execution from a hand-authored ranking fixture.

Use versioned artifact references with page/time/segment locations. Keep exact entity/date/metric filters alongside semantic ranking; lexical search remains important for names and numbers. Use an agent or reranker only when candidates need additional interpretation. Keep source data separate from embedding caches and recompute when source or embedding settings change.

Choose dimensions, chunking, and score handling from this corpus rather than universal thresholds. Start with a simple local index; a dedicated vector service is unnecessary unless scale or access requirements demonstrate the need. Test retrieval under simultaneous speech and model load before making a latency promise.

## Acceptance of placement versus acceptance of implementation

We now have a clear intended role: **find the right prepared or available material for the interview, story plan, and live explanation, with multimodal search where it helps.** Secondary classification, organization, and caching uses need evidence before adoption. The prototype must still establish runtime compatibility, retrieval quality, acceptable latency/memory, and actual presenter usefulness.
