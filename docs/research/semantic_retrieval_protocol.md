# Prepared-content retrieval and bounded selection protocol

EXP-024 · 17 October 2026 · Offline text experiment. No application-default migration.

## Primary experiment

Freeze `tests/fixtures/semantic-retrieval.json` before first execution: 18 prepared audience-text passages in three project scopes, 12 development/calibration queries, 24 evaluation queries. Labels distinguish show (with required topic references), hold, and request-context. Dataset and code hashes belong in every run. These labels are synthetic and developer-authored alongside implementation, not independently reviewed or externally held out.

Compare BM25 lexical ranking, pinned EmbeddingGemma 2 text-only normalized vectors, and reciprocal rank fusion (k=60). Report raw top-two recall, full-positive-query coverage, precision and exact sets separately from the binary topic-presence gate. Tune the gate on calibration cases only, maximizing balanced presence accuracy over thresholds 0–1 in increments of 0.025; ties prefer the lower cutoff. No query rewriting, learned reranker or label-specific synonyms.

Build a maximum of three prepared compositions from the top two topics: either topic alone or their split comparison. Always offer hold and request-context. Models cannot invent references, text, chart values or markup. Run local Laya and hosted Jev on identical requests, one attempt per case/method. Include an oracle-candidate arm that supplies the correct positive topic(s) plus a distractor where possible. Oracle candidates are label-informed diagnostics, not a production retriever; their option order is not randomized and may be easier than real ranking.

Measure complete action-plus-topic-set correctness over all 24 cases, invalid responses, wrong shows, missed context requests and all-attempt request latency. Record provider response/usage, source hashes, hardware, index cost, uncached query cost and exact-cache cost. Cap hosted requests at 96 and recorded cost at $0.02 per invocation; halt additional hosted requests if cost metadata is missing. Timeouts/errors remain in the denominator. No physical microphone, STT or browser rendering is part of this benchmark.

Software gates: vectors must match pinned model/revision/dimension, remain normalized and finite; scopes and revisions must match; cancellation must not populate query caches; only registered menu choices can resolve to host-validated compositions. These are software invariants, not presentation-quality adoption criteria.

## Follow-up arm declared after primary retrieval analysis

The first run found raw semantic top-two recall of 21/21 required topic references, while the development-selected cutoff removed two positive evaluation queries. Keep the same frozen data and prompts and add `semantic-raw`: pass the raw top two to the same selector without a similarity cutoff. Test both Laya and Jev. This investigates a failure observed on the evaluation split, so it is **development follow-up**, not a fresh holdout confirmation. Do not tune a replacement threshold from these evaluation labels.

Report the extra model requests and retained run separately. Do not count reused queries or repeated embeddings as new independent examples. Keep the application unchanged until retrieval/selection errors and asynchronous temporal integration are evaluated.

## Reproduction

```sh
npm run retrieval:setup
npm run retrieval:serve
# Separate terminal; requires the existing local Laya runner and optional hosted credentials:
npm run decision:serve
npm run benchmark:retrieval -- RUN-unique-primary
SHORTLIST_METHODS=semantic-raw npm run benchmark:retrieval -- RUN-unique-followup
```

The isolated Python runner uses CPU float32, four threads, 768 dimensions, pinned model revision and explicit retrieval query/document prompts. Its processor currently requires Pillow/torchvision even with vision/audio encoders disabled. Lock files capture those dependencies; this does not validate media embeddings. The earlier failed bootstrap logs must be retained with the experiment.

Primary implementation references: [Google text inference and task prompts](https://ai.google.dev/gemma/docs/embeddinggemma/inference-embeddinggemma-with-sentence-transformers), [Sentence Transformers semantic search](https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html). No LangChain, vector database or new hosted infrastructure is introduced.
