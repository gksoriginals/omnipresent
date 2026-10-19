> Baseline rollout update: [EXP-039/040](../research/baseline_rollout.md) records actual default coordinator integration, preparation failures/fixes and responsive product UI checks. [ADR-016](../decisions/ADR-016.md) selects the modular evidence-first development baseline. Current software checks are EXP-041; historic counts and failures below remain unchanged.

# Retrospective experiment reports

Report date: 17 October 2026. IDs resolve through the [register](test-register.md); raw reports and hashes through [catalog.json](catalog.json). These are retrospective summaries of retained evidence, not reconstructed prospective protocols. Exact historic source/prompt revisions are unavailable unless present in the artifact. Current dependency versions are in package-lock.json and runtime lock files, and the audited source/environment is in the run manifest.

## Runtime and speech — EXP-001, EXP-006

Question: can isolated local STT and the coordinator sustain streamed speech and bounded decisions? Method: actual WAV ingestion through Moonshine, coordinator transport and synthetic CPU stress; later macOS `say` narration through STT and the approved-scene agent/cache path. Runtime probe: 44.37 seconds of audio in 44.63 seconds wall time; warm worker 337 ms; transport RTT median 0.23 ms/p95 0.67 ms; audio processing median 38.5 ms/p95 129.6 ms; synthetic cancellation 11.3 ms. These timings measure different boundaries and must not be added or compared as equivalent model latency.

The speech/cache trial recorded uncached decisions of 1,792/1,592/1,887 ms and exact-cache replay around 0.10 ms. This supports an exact-cache fast path, not semantic retrieval efficacy. `speech-loop-validation.json` is a copy of the cache report. Only Moonshine was measured: no STT engine ranking, physical microphone, noisy-room, accent, multilingual or sustained contention study exists.

## Preparation and visual tools — EXP-002–005, EXP-007

Question: can separate preparation roles generate audience-facing story content and invoke bounded visual tools? Initial nine-test mocked integration passed while live weights were unavailable. A later actual Qwen run completed interview/story/realtime in 13,408/21,962/2,568 ms with no recorded errors. Audience-copy correction ran at 9,827/27,791/2,886 ms. These are separate scripted runs, not distributions or controlled speed improvements.

A synthetic CSV/brief visual run completed in about 34.69 seconds with no recorded errors. Mermaid and chart tools enforce prepared artifact references and source-value checks. MarkItDown fixture extraction and browser workflow checks are retained in the workflow report. Fixture success does not establish arbitrary document extraction quality or factual interpretation. Images have no validated semantic understanding/OCR pipeline. Alternative orchestration frameworks and visual libraries were researched, not benchmarked against these implementations.

## Projects and responsive UI — EXP-008–010

Question: do project isolation, story upsert, removal and resizing preserve usable state? Historical milestones retained 27 and later 31 software tests; current audited suite has 43. Browser observations cover separate projects/drafts, reload persistence, story upsert, soft removal/undo, floating controls, sidebar hiding and wheel containment. Selected screenshots are archived under evidence/.

A significant method correction occurred: a fixed emulated 1,440 px viewport missed clipping in a narrower native window. Later tests used a null viewport with native widths 1,280, 1,070, 900 and 700 px and actual wheel input. Full historical browser assertion scripts were not retained, so this is browser attestation plus screenshots, not a repeatable automated browser suite. Physical devices, accessibility audit and multi-tab conflict handling remain unvalidated.

## Adaptive composition and renderer formats — EXP-011–014

Question: can prepared content be recomposed from actual changing narration, and can two renderer libraries express the same bounded compositions? Piper generated three narratives: generation-first 52.9 s, storage-first 47.6 s and detour 46.6 s, streamed as actual 16 kHz mono PCM through Moonshine. This is distinct from older macOS `say` tests. Piper is test tooling, with engine/license and voice metadata retained in runtime/tts-model.json and lock files.

The follow-up used a fresh agent-generated preparation and revised prompt: 8/8/6 decisions, 5/4/5 visible changes, with one rejected storage response. Inference medians were roughly 3.3 s and p95 roughly 3.4–4.1 s. Both preparation and prompt changed, preventing causal attribution to the prompt. Topic/asset mismatches remain; progressive reveal quality is not established.

OpenUI 1.0.1 and json-render 0.21.1 render host-validated compositions through common React components. Null handling and JSON provider integration were corrected; an SVG sizing fix restored charts. These are adapter integration results, not native model-format wins. Two native-output requests per renderer failed validation in each of the baseline and clarification passes: 4/4 invalid per pass. Model/prompt/schema interaction is confounded; no renderer winner is selected. Native streaming/patch merging is untested.

## System One decision screening — EXP-015–019

Question: can bounded decision models reduce live composition latency while making suitable selections? The first design independently asked for primary/secondary, allowing duplicate answers. Revised questions ask per-topic inclusion plus mode/layout, and the host derives ordered blocks. This restricts decision freedom compared with the general composer. The same 12 developer-labelled synthetic cases were reused while revising the questions. There is no untouched holdout.

| Revised development screen | Attempts | Valid | Correct topic set / all attempts | Median / p95 latency |
|---|---:|---:|---:|---|
| Jev hosted | 24 | 24 | 20/24 | 453 / 534 ms |
| Microsoft Decision hosted | 24 | 24 | 22/24 | 580 / 647 ms |
| Laya local CPU | 24 | 24 | 14/24 | 387 / 434 ms |
| Kev hosted | 24 | 24 | 14/24 | 828 / 1,067 ms |
| Qwen local | 12 | 4 | 3/12 | 2,758 ms median conditional on valid output |

Each 24-attempt screen is two repeats on 12 cases, not 24 independent examples. Topic-set correctness is not complete composition quality. Qwen had eight no-decision responses; conditional latency hides that failure rate. A required-tool follow-up failed all 12 attempts. Detailed failing payloads are not retained, so this does not prove a universal limitation of normal LLMs. Earlier Qwen success used a different question design. Console-only simplified diagnostics are partial evidence, excluded from benchmark claims.

Laya's first screen included 24 startup connection failures: infrastructure failures, not zero model accuracy. Initial load/download was about 98.25 s; warm restart about 2.64 s. CPU configuration is four threads on Apple M5. Laya checkpoint revision is 7b928d828b7b0e022f929d9bd2e44165aa270148; Python packages are pinned. Conservative token limits reject oversized inputs instead of accepting silent truncation. Calibration beyond the small trial option counts is unproven. Kev was hosted, not measured locally. Other open-weight candidates were researched only.

A sequential same-WAV storage-first replay produced Jev 9 decisions/4 changes/5 holds (median 466.58 ms, p95 600.2 ms), Laya 9/2/7 (559.38/761.3 ms), and Microsoft 9/6/3 (576.69/2,301.43 ms), with no runtime errors. Holds/changes lack independent semantic labels; inappropriate holds remain. These results support further evaluation, not a production winner. Provider-reported costs apply only to retained requests.

## Historical pre-controller software audit — EXP-020

`npm test`: 43 passed, zero failed/skipped/cancelled. `npm run build`: type checking and production build passed. Raw logs, exact source SHA-256 inventory, Node/Python versions and machine characteristics are retained in the run directory. No Git revision exists for this checkout; hashes identify the captured source. The audit did not repeat paid API requests, audio or browser trials.

## Outstanding selection work — PLAN-001–003

The initial rules/FSM/BT/hybrid offline comparison is completed as [EXP-022](../research/controller_comparison.md): temporal variants matched 48/48 expected actions, priority rules 39/48; lexical retrieval returned the exact expected set in only 4/9 cases. The current software audit EXP-023 passes 50 tests plus type checking/build. These developer-authored fixtures are not a holdout. Next: improve retrieval, add bounded model selection and independently labelled validation. The default app live adapter still uses the local general model; the System One trials are opt-in prototypes.

Text-only EmbeddingGemma 2/BM25/RRF retrieval and Jev/Laya selection are now measured in [EXP-024/025](../research/semantic_retrieval_results.md). Media retrieval and semantic answer caching, alternative STT engines, Groq, other orchestration frameworks, LiveKit and Electron remain unvalidated. Physical microphone/noise trials, long-running resource use, representative content/audience studies and production readiness remain open. These gaps must not be presented as completed component selection.

## Retrieval and shortlisted selection — EXP-024–026

See the [full report](../research/semantic_retrieval_results.md): 18 documents, 12 calibration queries, 24 synthetic evaluation queries; 192 primary and 48 follow-up model requests. Raw semantic top-two recall 21/21 required references versus BM25 19/21; gated semantic Jev 22/24 complete actions versus BM25 Jev 20/24. Removing the similarity gate preserved 22/24 but exchanged two false holds for missing-content errors. Laya is faster but only 7–11/24 correct. The six new named software tests bring the audited suite to 56; production build/type checking pass. Source snapshots, raw requests/responses, hashes, costs, failures and limitations are retained. No independent human holdout or app-default migration is claimed.

## Cloudflare Clef extension — EXP-027–030

[Full report](../research/cloudflare_clef_results.md): 192 quality requests plus three connection checks. Raw semantic menus yield 24/24 complete action/topic matches for Clef, Flash and Omni, versus fresh Jev 21/24; gated menus yield 20–22/24. Omni raw median/p95 is 383/584 ms versus Jev 431/519 ms. Inputs match the retained reference requests exactly; dataset reuse and sequential single attempts limit generalization. Total recorded cost $0.004214842. Source snapshots, metadata, raw failures and paired evidence are retained. Current software audit EXP-030 passes 58 tests and build/type checking; no live-default migration occurred.

## Prediction-first hybrid component search — EXP-031/032

[Full report](../research/prediction_first_results.md): 18 scripted steps, 27 prepared components across three scoped projects and 49 hosted Clef-omni calls. All searches use BM25+dense RRF. Current top-two family routing reduces scored components 40.1%, retains 12/12 positive candidates and matches 13/18 full actions, versus retrieval-first 14/18. Prior-context top-two forecasts hit the next family 7/12 and prefetch exact candidates 4/12; virtual readiness is not live authorization. Local Clef setup was cancelled before weights at the user request; temporary directories were removed. Recorded usage $0.002895900. EXP-032 passes 62 tests and build/type checking. Source snapshots, raw probabilities, errors and setup limitations are retained.
