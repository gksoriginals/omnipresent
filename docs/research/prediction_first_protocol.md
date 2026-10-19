# Prediction-first hybrid component search protocol

Recorded before model execution · 17 October 2026 · EXP-031/032.

## User direction and hypothesis

Test the reverse order: System One predicts useful component families from story context; hybrid retrieval finds exact prepared components inside those families. Use BM25 plus dense similarity, and keep Clef hosted on OpenRouter. Local Clef setup was stopped at the user's storage preference: only metadata/code and an isolated dependency environment had been downloaded, no Clef weights. The temporary environment and inspection directory were removed; shared package caches were not purged.

Simply reversing two serial calls does not inherently reduce their summed latency. The hypotheses are reduced candidate scoring and reduced model input, or moving predictions off the response path through speculative prefetch and reuse. Test type exclusion errors, candidate recall and wasted prefetch as well as timing. Probability outputs are uncalibrated model scores for the dominant family, not independently calibrated probabilities that each UI component will appear.

## Frozen development replay

`tests/fixtures/component-prediction.json`: three projects, nine prepared components each (six statements, two process diagrams, one chart), 18 scripted steps. Twelve positive queries have a labelled exact prepared component; six negative queries require hold or request-context. The source diagram/chart content is synthetic. Prepared brief constraints are shared model context; expected IDs/actions are never sent to the model. Current story positions are scripted observations shared across arms, not model-generated rollouts. This is developer-labelled development data, not an independent holdout.

All retrieval arms combine globally prepared BM25 statistics with cosine ranking via reciprocal rank fusion (k=60). Family filtering precedes both lexical scoring and vector dot products. Embedding query cost is measured separately and shared across offline arms to compare ranking operations fairly. It must still be paid once on a real speech query. No semantic-only experimental arm is used.

## Arms

1. **Retrieval first:** full hybrid search, then hosted Clef-omni selects an exact prepared component or hold/context from the top three candidates.
2. **Current-context decision first:** Clef-omni sees current speech, story position, near-term story titles, available family counts and prepared constraints. It predicts the dominant family distribution plus show/hold/context. Hybrid search is then evaluated with top-one and top-two family masks; use its top hit if the action is show. This is a coarse-routing approximation, not equivalent freedom to the exact selector.
3. **Forecast/prefetch:** Clef-omni sees prior speech and observed story position only, never the target future utterance. Evaluate its top-one/top-two family masks against the next query. Measure family hit, candidate recall, scored fraction, cache freshness and the virtual one-second lead budget. Speculative exact candidate references are ranked using prior speech plus next-story titles, never the target utterance; evaluate their next-query hit separately from family coverage. Forecasts only prepare candidate material; they never authorize showing it. A simulated lead-time hit is not live scheduling evidence.

At most three model calls per step, 54 maximum quality requests; reuse forecast leases while the scripted story position and scope match within three seconds, even if speech changes. This reuse is approximate and its misses must be reported. All work remains recorded, including background speculative query encoding. Use the existing OpenRouter credential. Cap recorded cloud usage at $0.02, stop further cloud calls if usage cost is missing, and retain all failures/timeouts. Record raw distributions, exact requests/responses, timings, costs, source/input snapshots and mismatches. No prompt or label tuning after results. UI rendering, STT, production corpus scale and async integration remain outside this screen.

## Metrics and interpretation

Report exact action/component correctness for arms 1–2; route exclusion recall, full hybrid candidate recall at three, and top-hit correctness for positive queries; prefetch family recall and useful next-query candidates for arm 3. Keep 12 positives separate from six negatives; prefetch on a negative query is wasted work, not a correct audience change. Count the number of components actually scored and compare with the full nine-component project corpus. Record query embedding and rank compute separately from hosted call completion. Do not add independent latency percentiles. Construct per-case serial totals for current routing, and separately report speculative readiness using the declared one-second lead assumption. Never describe speculative costs as removed: they move earlier and can be wasted.

Next-step selection remains provisional. A good small synthetic result does not establish general forecasting, calibrated probabilities, a runtime winner or permission to bypass host validation/FSM control. Hard-family filtering can exclude the correct asset; broader top-k/fallback policies require explicit evaluation.
