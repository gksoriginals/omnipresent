# Semantic retrieval and bounded System One selection

> Follow-up: [Cloudflare Clef evaluation](cloudflare_clef_results.md) adds three variants and a fresh Jev reference. The earlier results below are preserved as EXP-024/025.

EXP-024/025 · 17 October 2026 · Offline prototype and development evaluation.

## Outcome

EmbeddingGemma 2 text retrieval is now implemented and exercised locally. Its raw top-two shortlist covered all 21 required topic references across 18 positive evaluation queries, including paraphrases and comparisons. BM25 covered 19/21. Hosted Jev with semantic shortlisting matched 22/24 complete action/topic labels; local Laya was faster but much less reliable on this menu.

Keep **EmbeddingGemma 2 plus bounded Jev selection as the next experimental combination**, with the small FSM from EXP-022 responsible for temporal control when integrated. This is not a final component winner or a production migration. Do not automatically replace the app's current live adapter: this experiment found both false holds and wrong shows depending on abstention policy, and did not test the asynchronous FSM/model/renderer combination.

## Design and evidence

The [protocol](semantic_retrieval_protocol.md) records methods and the follow-up rationale. The frozen [dataset](../../tests/fixtures/semantic-retrieval.json) contains 18 prepared text passages across three projects (solar, education, software), 12 calibration queries and 24 evaluation queries. It covers literal and paraphrased explanations, negation, two-topic comparisons, unrelated speech and requested facts absent from the material. It is synthetic, developer-authored and not independently reviewed. A split frozen before execution is useful for development discipline but does not make it independent human validation.

- [Primary run](../validation/runs/RUN-20261017-semantic-selection-v1/retrieval-selection.json): 192 model requests, 96 each to local Laya and hosted Jev. Methods: oracle-candidate diagnostic, BM25, semantic ranking plus presence gate, and RRF fusion plus the same gate.
- [Raw-shortlist follow-up](../validation/runs/RUN-20261017-semantic-selection-raw-v2/retrieval-selection.json): 48 requests, 24 per provider, on the same evaluation cases. It was motivated by primary-run errors and is not a new holdout.
- Each directory retains raw selection JSONL, retrieval rankings/metrics and exact source/input snapshots with hashes. The primary directory also retains the two failed model-bootstrap logs. Failed bootstrap attempts required Pillow and then torchvision; the completed runtime lock includes both.
- [Current software audit](../validation/runs/RUN-20261017-retrieval-audit/run.json): 56 tests, type checking and production build. Earlier 43- and 50-test audits remain historical evidence.

Oracle candidates use labels to guarantee inclusion of correct positive topics and provide a distractor where possible. They are a diagnostic for selection errors, not a deployable retriever; their option ordering is not randomized. All other ranking is label-free. Gate calibration sees only the 12 calibration cases. Source snapshots identify these runs even though this checkout has no Git revision.

## Implemented boundaries

[SemanticIndex](../../server/controllers/semantic-retrieval.ts) indexes audience-visible titles/text with normalized vectors. Index identity includes project, preparation revision, corpus fingerprint, embedding model/revision and dimensions. Queries reject a stale/cross-project scope and recheck context after inference. The exact query cache is capped at 32 entries per index; cancelled/stale responses cannot populate it. This is exact caching, not similarity-based answer reuse. An in-memory linear search is sufficient for six passages per project; no vector database or LangChain dependency was added.

[Bounded selection](../../server/controllers/shortlisted-decision.ts) takes at most two retrieved topics and offers at most three registered compositions: either topic alone or their split comparison. Hold and request-context are always separate choices. The model receives the latest speech and prepared audience text, not private speaker notes or labels. Host validation resolves the selected reference and rejects unknown choices, stale menus, invalid probabilities or invalid compositions. Probabilities are recorded, not treated as calibrated temporal-controller confidence.

The menu currently uses audience statements only. It does not yet choose visual/image modes, progressive reveal or new chart content. Missing-content requests here are labels/actions in a benchmark, not an implemented handoff from this prototype to the live preparation agent. No model endpoint, credential, account or app setting was replaced.

## Local embedding configuration and cost

Pinned model: `google/embeddinggemma-2`, revision `914f7f89142e33e77833254d9c9b90c3cef7303b`; text-only configuration with vision/audio encoders disabled; 271,002,624 loaded parameters; CPU float32, four threads, 768 normalized dimensions. The Python process is isolated under `output/retrieval-venv`; package versions and model settings are retained in `runtime/retrieval-requirements.lock` and `runtime/retrieval-model.json`.

Primary-run measurements on Apple M5/16 GB:

| Measurement | Result | Boundary |
|---|---:|---|
| Load with downloaded weights cached | 4,316 ms | Successful startup after bootstrap dependency fixes; not first download time |
| Index six solar passages | 172 ms | First corpus/batch in process |
| Index six education/software passages | 87 / 89 ms | Subsequent corpus batches |
| Uncached query median / p95 | 26.55 / 30.10 ms | 36 sequential loopback queries, tokenization and inference |
| Exact-query-cache median | 0.051 ms | Immediate repeat in same scoped index |
| Process high-water RSS at startup health check | 2.36 GB | Python process only, not steady incremental model memory or whole app |

The follow-up query median/p95 was 25.09/27.51 ms. These small sequential runs do not establish concurrency, sustained memory, multilingual or STT-contention performance. Server health reports high-water memory before the benchmark, not a long-run memory study. No media encoder or alternative precision/dimension was measured. [Google's guide](https://ai.google.dev/gemma/docs/embeddinggemma/inference-embeddinggemma-with-sentence-transformers) informed the text configuration and distinct query/document prompts; local results above come from our own run artifacts.

## Retrieval quality

The 24 evaluation queries contain 21 required topic references across 18 positive queries, plus six negative queries (three unrelated and three missing-evidence requests).

| Retrieval configuration | Required topic references found | Positive queries fully covered | Correct empty shortlists on negatives | Precision | Exact topic sets |
|---|---:|---:|---:|---:|---:|
| BM25 top two nonzero matches | 19/21 | 16/18 | 4/6 | 70.4% | 15/24 |
| Raw semantic top two | 21/21 | 18/18 | 0/6 | 43.8% | 3/24 |
| Semantic with calibrated presence gate | 19/21 | 16/18 | 6/6 | 59.4% | 9/24 |
| Raw RRF top two | 21/21 | 18/18 | 0/6 | 43.8% | 3/24 |
| RRF with semantic presence gate | 19/21 | 16/18 | 6/6 | 59.4% | 9/24 |

Raw dense ranking always supplies two candidates; its low exact-set score reflects deliberate over-retrieval and is not final canvas accuracy. Candidate recall and precision must be interpreted together. Positive-query MRR was BM25 0.917 versus semantic/RRF 0.944. Precision uses all retrieved references, including distractors/negative queries. This small corpus is not evidence of large-library search quality.

The development-selected gate was cosine 0.70, giving perfect binary presence classification on the 12 calibration cases. It then rejected two positive evaluation paraphrases: recall practice and peer voting. A cosine score is not calibrated confidence. The raw follow-up removed the gate rather than tuning a new threshold on the evaluation labels.

## Bounded selector quality and latency

Each score requires both the correct action (show, hold, request-context) and exact displayed topic set. All 240 requests returned valid typed choices; no timeout, provider error or skipped case was recorded. Validity does not imply semantic correctness.

| Candidate source | Jev correct / 24 | Jev wrong shows | Laya correct / 24 | Laya wrong shows |
|---|---:|---:|---:|---:|
| Oracle diagnostic | 23 | 0 | 7 | 17 |
| BM25 | 20 | 2 | 11 | 9 |
| Semantic with gate | 22 | 0 | 10 | 9 |
| RRF with gate | 22 | 0 | 10 | 9 |
| Raw semantic follow-up | 22 | 1 | 7 | 17 |

Jev response model: `typesafe/jev-1.14-20261014`. Laya: pinned `convaiinnovations/laya` from the existing local runner. The larger choice menu differs from earlier System One questions; do not compare these scores directly with EXP-017 or claim all local/open-weight models behave like Laya. No local Kev, Microsoft or general LLM arm was run here.

Jev gated semantic median/p95 request latency: **441/512 ms**; raw semantic follow-up: **447/541 ms**. Local Laya gated semantic: **128/137 ms**; raw: **127/138 ms**. Each arm uses 24 sequential requests, one attempt per case. Timings include all attempted requests, and hosted timings include network latency. They exclude retrieval, temporal dwell/confirmation, STT and rendering. Do not add independent percentiles to claim an end-to-end percentile or attribute earlier-vs-current timing changes solely to shortlisting.

Recorded provider costs: primary **$0.001863246**, follow-up **$0.000499212**, combined **$0.002362458** for 120 hosted requests. This is provider-reported usage for these retained requests, not complete account billing or the cost of local compute.

## Error analysis and next decision

With the gate, Jev's two errors are false holds caused by excluded positive topics. All six negative queries were handled correctly. Removing the gate lets it recover both positive topics but introduces a wrong show for unavailable solar installation cost and a hold instead of request-context for missing class results. The raw solar-cost error chooses a related roof-survey topic despite absent prices. Oracle Jev also misses that class-results handoff; correct candidate inclusion cannot solve every action decision.

Laya frequently chooses a topic for unrelated or missing-content speech and rarely uses the comparison choice; in the raw arm it never chose hold/context. It is not suitable for this request shape without further input/question/model work. The oracle arm confirms that poor retrieval is not its only bottleneck.

Next, keep semantic shortlisting and Jev as an **opt-in integration candidate**, preserve the FSM guards, and add explicit missing-evidence metadata/handling without hardcoding these evaluation phrases. Obtain independently labelled examples and replay current regressions before selecting an abstention policy. Then test asynchronous epoch cancellation, bounded pending work, prepared asset resolution and feedback routing in the actual loop. An audio/browser trial is appropriate after that integration; this offline experiment does not establish it.
