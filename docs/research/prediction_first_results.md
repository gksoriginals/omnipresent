# Prediction-first hybrid component retrieval

EXP-031/032 · 17 October 2026 · Offline development prototype.

## User direction and outcome

Use hosted Clef through OpenRouter, use hybrid search rather than dense-only search, and test whether predicting probable component families before retrieving exact prepared instances improves the live decision loop. Local Clef setup was stopped after the user's storage preference. No Clef weights were downloaded; the temporary isolated environment and inspection directory were removed. Existing embedding weights and shared package caches were retained.

The experiment supports **current-context type shortlisting as a candidate layer**, but does not yet support replacing grounded selection with an advance forecast:

- With the latest speech available, top-two family routing reduces the mean number of components scored by **40.1%** while retaining the correct component among the top three for **12/12 positive queries**.
- Top-one routing reduces scoring by **73.5%**, but loses the correct component on one positive query: **11/12** coverage.
- Forecasts from earlier speech retain the next component's family in **7/12** positive cases with two families, and the speculative exact references contain the next component in only **4/12**.
- Complete action/component correctness is **14/18 retrieval-first**, **12/18 top-one decision-first**, and **13/18 top-two decision-first**. Neither prototype is ready to own audience changes.

Keep the reversed order experimental. Use probabilities as reusable hints or prefetch priorities with a broader hybrid-search escape path, not authority to exclude content or show it. A separate current-query grounding/abstention decision and host/FSM controls remain necessary. No app-default or UI behavior was changed.

## Why stage order alone does not prove a speedup

Both serial arrangements still pay model inference, query embedding and search. The potential advantages are less candidate scoring, a different/smaller model request, fewer coarse model refreshes, or speculative work moved earlier. They are separate hypotheses and need separate measurements.

Here, query embedding takes about **27.4 ms median**, while full hybrid rank computation takes only **0.090 ms median** on nine components. Hosted model calls take hundreds of milliseconds. Retrieval is much faster than the decision calls on this machine, but removing four or five of nine dot products does not materially improve the measured response path. Scope validation still fingerprints the prepared catalog, and all queries still need their embedding; filtered scoring is not a claim that every indexing/search operation becomes proportional to the mask.

The forward arm selects exact content after seeing candidates; the reversed arm predicts a family and show/hold/context before seeing their exact content. Those are different questions and permissions. The observed timing/quality differences cannot be attributed to order alone.

## Implementation

[Hybrid component index](../../server/controllers/hybrid-components.ts) creates grounded statement, diagram, chart and available-image entries from the existing preparation. Each entry carries a stable prepared reference and host-validated composition. This fixture contains no image entries. Image alt-text indexing would not establish image understanding.

The index precomputes global BM25 document statistics and normalized prepared embeddings. Retrieval combines BM25 and cosine ranks with reciprocal rank fusion (k=60). Family masks are applied before lexical scoring and vector dot products. Exact query caching is bounded at 32 per index. Index identity covers project, preparation/corpus contents, prepared visuals/media and embedding space; cancelled or context-changed query results cannot populate caches. These caches reuse identical query work, not semantically similar answers.

[Component forecasting](../../server/controllers/component-forecast.ts) requests a distribution over the dominant available component family. Current routing also asks for show/hold/request-context. Prior-context forecasting has no audience-action question. Forecast leases validate project, catalog revision/content, epoch, story position, time and a three-second expiry. These validity checks do not guarantee semantic freshness when speech changes without a story-position change.

The [protocol](prediction_first_protocol.md) and [frozen fixture](../../tests/fixtures/component-prediction.json) define three nine-component projects, 18 scripted steps, 12 positive exact-component labels and six negative action labels. Stories contain synthetic diagrams/charts and explicit prepared constraints. Expected IDs/actions are not model inputs. All arms use the same scripted observed story position rather than rolling forward the model's actual previous decisions.

## Results

### Current-query routing and exact selection

| Arm | Full action/component matches | Positive candidate coverage at three | Mean components scored | Constructed serial median / p95 |
|---|---:|---:|---:|---:|
| Full hybrid → exact Clef choice | 14/18 | 12/12 | 9/9 | 730 / 6,476 ms |
| Clef current context → top-one family → hybrid | 12/18 | 11/12 | 26.5% of corpus | 486 / 1,653 ms |
| Clef current context → top-two families → hybrid | 13/18 | 12/12 | 59.9% of corpus | 486 / 1,653 ms |

These per-case serial totals include the measured query embedding once, the arm's rank operation and its hosted request duration. A shared query vector is used across offline ranking arms for comparison; actual deployments must encode each new speech window. Timings use nearest-rank percentiles, so they need not equal an average of the two middle observations. They exclude STT, renderer, FSM dwell and network media loading.

All 18 baseline and all 18 routing requests completed. The baseline has a 6.45-second hosted-call tail outlier. A single nonrandomized sweep cannot establish a latency winner or isolate networking, scheduling and schema effects. Median input sizes were about 424 tokens for the exact selector and 428 for the router (ordinary median of token counts): **this run did not demonstrate smaller model inputs**. The router has two questions rather than the selector's single choice question.

Full hybrid retrieval's first hit already matches the exact component on all 12 positives in this explicitly worded, small fixture. It still returns related candidates on negative queries and cannot supply correct abstention by itself. The baseline selector changes a correct chart candidate to a statement once and misses three required context handoffs. The two-family router retains all positive candidates but holds four valid explanations and misses one context handoff. Asking for an audience action before the model sees the retrieved evidence is a distinct source of errors; family probability alone does not repair it.

### Forecasts made without the target utterance

| Prior-context forecast | Next positive family included | Exact references prefetched for next positive query | Candidate coverage after actual speech and filtered search |
|---|---:|---:|---:|
| Top one family | 2/12 | 2/12 | 3/12 |
| Top two families | 7/12 | 4/12 | 8/12 |

The last column includes a full-search fallback when a forecast misses the virtual lead deadline, so it can exceed the family-hit count. Of 18 steps, 17 forecasts/prefetches were ready within the **assumed one-second lead**; one education step exceeded it. These are virtual timestamps constructed from sequential measured durations, not evidence of a working concurrent scheduler.

The prototype issues 13 prior-context forecast calls and reuses five leases, compared with forecasting on every one of 18 steps. Reuse is intentionally approximate while story position/scope/TTL match; it can ignore changed speech. Two reused leases occur on positive queries and both exclude the next needed family. Thus the 27.8% reduction in forecast calls is accompanied by semantic staleness, not a free optimization.

Speculative exact references are retrieved from prior speech plus next-story titles. No target future speech is used. These are references to already resident prepared specifications, not downloaded/rendered image/video assets or a measured browser preload cache. Six negative queries also incur speculative work with no useful new display. Prefetch readiness median after the target query is about **27.6 ms**, but **this is candidate readiness only**, excludes a current grounding/commit decision and fails to provide the right forecast on many queries. It is not 28 ms audience response latency.

The probability metric on the 12 positive cases is unscaled multiclass Brier score: sum of squared differences from the one-hot family label, averaged over cases. Current-context routing scores **0.127**; prior-context forecasts/reused leases score **1.180**. The tiny development set does not calibrate either model distribution. A choice distribution describes one dominant family, not independent probabilities for multiple components appearing together.

## Interpretation and remaining gaps

The replay deliberately changes component types and includes jumps away from planned order. Such traces expose forecasting risk; they are not evidence about naturally rehearsed presentations or larger libraries. The router sees current story summary, nearby story titles, aggregate family counts and prepared constraints. It lacks a topic-by-family availability graph or exact candidate evidence. Its failures may reflect those inputs as well as model behavior; this does not disprove all decision-first architectures.

A useful next design is two rates: refresh coarse family priors on meaningful context changes in a slower loop, while each current speech window runs fast hybrid retrieval. Reserve a broader search/fallback when the prior is stale, uncertain or disagrees with current evidence. Keep speculative exact candidates separate from authorized audience composition. Do not use story position alone as a semantic cache key. Before adopting this design, test the availability graph, content-aware refresh, diversity/escape policies, independently labelled natural speaker traces and larger candidate corpora.

For now, the measured safe boundary is an offline shortlist/prefetch prototype. The existing live default, preparation workflow and UI are unchanged. There is no new local Clef service, model weight download, general LLM generator or vector database.

## Evidence and reproduction

- [Complete EXP-031 report](../validation/runs/RUN-20261017-prediction-first-v1/prediction-first.json), including per-step errors, probabilities and method limitations.
- [Raw model requests/responses](../validation/runs/RUN-20261017-prediction-first-v1/model-requests.jsonl), [step traces](../validation/runs/RUN-20261017-prediction-first-v1/steps.jsonl), [startup source manifest](../validation/runs/RUN-20261017-prediction-first-v1/start-manifest.json), exact source snapshots and [local-setup cancellation note](../validation/runs/RUN-20261017-prediction-first-v1/local-setup-note.json).
- **49 hosted Clef-omni calls**, no invalid or failed replay step; recorded usage **$0.002895900**. Provider response model `cloudflare/clef-omni-20261009`; costs cover these retained requests, not account billing or local embedding compute.
- [EXP-032 software audit](../validation/runs/RUN-20261017-prediction-first-audit/run.json): 62 tests plus type checking and production build. Four new tests cover facet scoring, project/corpus/embedding isolation, forecast expiry/epoch/position and malformed probabilities. Current build retains its existing bundle-size advisory.

```sh
# Keep the existing local text embedding runner available. Clef stays hosted.
npm run benchmark:prediction -- RUN-your-unique-id
node scripts/audit-validation.mjs RUN-your-unique-software-id
python3 scripts/build-validation-catalog.py
node scripts/verify-validation.mjs
```

New runs are separate immutable directories. Paid model/voice/browser experiments are never implied by a software audit. This benchmark is development evidence with a new fixture; it is not independent holdout validation or an end-to-end live presentation test.
