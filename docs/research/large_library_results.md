# Larger-library decision-path results

EXP-033 · 17 October 2026 · Constructed development stress screen; latency gate failed.

## Outcome and direction

Keep eligibility-aware retrieval as a correctness-oriented prototype, not a demonstrated speed optimization. Do not promote prediction-first routing or repeat weaker System One comparisons yet. Start the [grounded prepared-library policy direction](library_policy_direction.md): explicit evidence scopes, hybrid global escape, then safe cue bundles and minimum-change composition ablations aimed at avoiding unnecessary inference.

The [protocol](large_library_protocol.md) required preserved selection/missing-evidence quality and lower median **and** p95 in every repeated pass. Quality was preserved on these authored cases. The repeatable latency gate failed because scoped p95 increased in pass 1. There is no independent real-library acceptance result.

## Measured results

[Raw report](../validation/runs/RUN-20261017-large-library-v1/large-library.json), [frozen inputs](../validation/runs/RUN-20261017-large-library-v1/inputs.json), [manifest](../validation/runs/RUN-20261017-large-library-v1/start-manifest.json), [request/response traces](../validation/runs/RUN-20261017-large-library-v1/model-requests.jsonl), and [per-observation timing](../validation/runs/RUN-20261017-large-library-v1/steps.jsonl) retain all 120 hosted Clef-omni requests. Recorded provider cost: USD 0.0209061. Initial local document indexing: 11.275 seconds, reported separately from warm decision-path latency.

| Pass | Full median / p95 | Scoped median / p95 | Exact decisions, each arm |
| --- | --- | --- | --- |
| 1 | 477 / 1,036 ms | 464 / 1,145 ms | 16/16 |
| 2 | 474 / 1,160 ms | 470 / 1,131 ms | 16/16 |
| 3 | 471 / 1,118 ms | 443 / 1,030 ms | 16/16 |

Each arm preserved 11/11 positive selections and 5/5 negative decisions per pass, with zero unsupported shows or invalid responses. Repetitions are not 48 independent quality cases: the corpus contains only 16 authored cases. Nearest-rank p95 with 16 observations is the maximum, so these tails are particularly unstable and need many more varied observations before deployment conclusions.

Each arm performed two timed warm catalog refreshes per pass. Full search incurred four global fallback grounding attempts per pass; scoped search incurred five fallback search events, including one empty-scope escape, and four fallback grounding attempts. Both made 20 hosted grounding calls per pass. There was no inference-call reduction. Each observation includes its own query embedding, scope/ranking work, fallback searches, all grounding calls, host reference/scope validation and applicable warm refresh. Failed attempts would remain in elapsed timings; none occurred here.

## What this does and does not validate

The 432 entries exercise entity/year/provenance/form collisions across eight coherent presentation topics. They are programmatically expanded from authored topic descriptions, with repeated patterns and simulated figures; they are not 432 independently sourced assets. “Actual” is simulated metadata. This is more demanding than the previous nine-entry screen but does not meet an independent realistic-library gate.

The same grounding question is used in both arms, eliminating the earlier differing-question comparison problem. The scoped arm uses deterministic explicit-scope cues, not a new forecast-model call. Thus this experiment does not validate prediction-first model routing. Its result is a useful screen for the simpler candidate-policy alternative.

Warm refresh reconstructs the catalog and BM25 while reusing content-addressed document embeddings. It does not test changed content, stale asynchronous revisions, cold restarts, expiring model forecasts or actual media reload. The measured endpoint is a validated text decision, not audience-visible paint; STT, rendering and audio are excluded. Separate initial indexing time must not be hidden when evaluating cold start or changed-content costs.

All labels were authored by the implementer alongside the fixture. No statistical significance, natural-speech generalization, calibrated missing-evidence probability, multi-component readability or production-readiness claim follows.

## Remaining acceptance work

Use independently reviewed presentation material with varied claims, media and evidence scopes, and natural speech transcripts. Add content-changing refreshes, cache expiry, errors, unknown metadata and stale-work cancellation. Include both current and future-candidate setups with the same final grounding authority. Increase observations and repeat counterbalanced measurements before making median/p95 claims. Visual composition changes need browser geometry/readability and final-transcript-to-visible-paint measurements.

Until that gate passes, retain the live default. The isolated library-search module and its tests establish an implementation starting point; they do not migrate the application or validate the later cue/template policies.
