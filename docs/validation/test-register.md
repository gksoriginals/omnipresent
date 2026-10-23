# Test and experiment register

Current source test mapping: RUN-20261023-foundation-model-audit-v3. Historical experiments retain their own versions and counts. See [evidence rules](README.md).

## Experiments and plans

### EXP-001 — Runtime isolation and streaming audio

Status: **executed**.

Evidence: [runtime-probe-results.json](../../docs/research/runtime-probe-results.json). Hash retained in catalog.

Actual upstream WAV; Moonshine worker and synthetic CPU stress. One-run timing, not LLM contention or physical-microphone evidence.

Current reproduction entry point: `npm run probe:audio && npm run probe`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-002 — Agent SDK integration and unavailable-model recovery

Status: **executed-with-provider-blocker**.

Evidence: [agent-preparation-validation.json](../../docs/research/agent-preparation-validation.json). Hash retained in catalog.

Initial 9-test snapshot uses mocked model streams; live endpoint failed because weights were not available. Later experiments resolved availability.

Current reproduction entry point: `npm test`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-003 — Real local interview, storyteller and scene director

Status: **executed**.

Evidence: [agent-live-validation.json](../../docs/research/agent-live-validation.json). Hash retained in catalog.

Single scripted local-model trial; later audience-copy correction is a separate experiment.

### EXP-004 — Audience-facing copy and private-note separation

Status: **executed**.

Evidence: [agent-audience-copy-validation.json](../../docs/research/agent-audience-copy-validation.json). Hash retained in catalog.

Local-model success with audience text. Current probe/source may differ from the exact historic run.

### EXP-005 — Diagram/chart tool generation and source validation

Status: **executed**.

Evidence: [visual-agent-validation.json](../../docs/research/visual-agent-validation.json). Hash retained in catalog.

One successful local model run after tool-schema fixes; not a statistical factual-quality evaluation.

Current reproduction entry point: `npm run probe:visuals`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-006 — Speech, approved-scene decisions and exact-cache replay

Status: **executed**.

Evidence: [speech-loop-cache-validation.json](../../docs/research/speech-loop-cache-validation.json). Hash retained in catalog.

macOS say audio, actual STT/Qwen. Duplicate speech-loop-validation.json is the same run, not another replicate.

Current reproduction entry point: `npm run probe:speech-loop`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-007 — File ingestion and preparation/canvas workflow

Status: **executed-with-browser-attestation**.

Evidence: [workflow-redesign-validation.md](../../docs/research/workflow-redesign-validation.md). Hash retained in catalog.

Actual fixture extraction plus documented browser checks. Historical source revision and full browser assertions were not archived.

Current reproduction entry point: `npm test`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-008 — Projects, unsent drafts, saved-story isolation and persistence

Status: **executed-with-browser-attestation**.

Evidence: [project-session-validation.json](../../docs/research/project-session-validation.json). Hash retained in catalog.

Historic 27-test snapshot. Statements about no deletion are historical; later removal tests supersede them.

Current reproduction entry point: `npm test`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-009 — Responsive geometry, floating controls and wheel containment

Status: **executed-with-browser-attestation**.

Evidence: [projects_and_story_library.md](../../docs/projects_and_story_library.md). Hash retained in catalog.

Initial emulated-viewport checks missed native-window clipping; later null-viewport/native-window and real wheel checks corrected the method. Not all browser code is retained.

### EXP-010 — Story upsert, duplicate consolidation and reversible removal

Status: **executed-with-browser-attestation**.

Evidence: [projects_and_story_library.md](../../docs/projects_and_story_library.md). Hash retained in catalog.

31-test milestone described in source report; current workspace tests recheck state invariants. Browser evidence remains local screenshots.

Current reproduction entry point: `npm test`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-011 — Piper adaptive narration baseline

Status: **executed**.

Evidence: [adaptive-baseline-validation.json](../../docs/research/adaptive-baseline-validation.json). Hash retained in catalog.

Three actual audio replays; first prompt and preparation. Known topic bias; not directly comparable causally with follow-up preparation.

### EXP-012 — Fresh browser preparation and adaptive narration follow-up

Status: **executed**.

Evidence: [adaptive-followup-validation.json](../../docs/research/adaptive-followup-validation.json). Hash retained in catalog.

Historical standalone-browser trial with three real audio replays, one preparation and two renderers. Its launch path has been retired with the browser prototype; evidence is retained.

### EXP-013 — Native OpenUI/JSON generation baseline

Status: **executed-negative-result**.

Evidence: [renderer-format-baseline.json](../../docs/research/renderer-format-baseline.json). Hash retained in catalog.

Two requests per library; all four failed validation. Historic prompt/input hashes were not retained.

Current reproduction entry point: `npm run probe:renderers`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-014 — Native OpenUI/JSON generation after prompt clarification

Status: **executed-negative-result**.

Evidence: [renderer-format-validation.json](../../docs/research/renderer-format-validation.json). Hash retained in catalog.

All four failed validation. This does not rank renderer quality; model/prompt/format were confounded.

Current reproduction entry point: `npm run probe:renderers`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-015 — Independent primary/secondary System One screen

Status: **executed-design-limitation**.

Evidence: [system-one-initial-validation.json](../../docs/research/system-one-initial-validation.json). Hash retained in catalog.

12 synthetic development cases, repeats and changing adapters. Local Laya startup failures must not count as model accuracy failures. Alias system-one-validation.json is identical.

### EXP-016 — Laya CPU and hosted open-weight Kev screen

Status: **executed**.

Evidence: [system-one-open-validation.json](../../docs/research/system-one-open-validation.json). Hash retained in catalog.

Initial question design; hosted Kev is not a local Kev performance test. Present probe uses revised questions.

Current reproduction entry point: `DECISION_PROVIDERS=laya,kev npm run probe:decisions`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-017 — Per-topic System One inclusion screen

Status: **executed**.

Evidence: [system-one-v2-validation.json](../../docs/research/system-one-v2-validation.json). Hash retained in catalog.

Development cases reused after policy changes; no untouched holdout. Five models, with malformed/no-decision Qwen responses counted in total attempts.

Current reproduction entry point: `npm run probe:decisions`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-018 — Qwen required-tool retry screen

Status: **executed-negative-result**.

Evidence: [system-one-qwen-required-validation.json](../../docs/research/system-one-qwen-required-validation.json). Hash retained in catalog.

All 12 attempts recorded no decision. Detailed failed tool-call payloads are absent, so root cause remains unproven.

Current reproduction entry point: `DECISION_PROVIDERS=qwen npm run probe:decisions`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-019 — Same-audio Jev/Laya/Microsoft live decision replay

Status: **executed**.

Evidence: [system-one-live-validation.json](../../docs/research/system-one-live-validation.json). Hash retained in catalog.

Three sequential same-WAV replays; no runtime errors. Changes and holds are not semantic quality labels. No physical microphone.

### EXP-020 — Audited software suite before controller comparison

Status: **executed**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261017-documentation-audit/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261017-documentation-audit/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261017-documentation-audit/typecheck-build.log). Hash retained in catalog.

Historical pre-controller 43-test source snapshot, environment, command exit codes and raw logs. Later software audit supersedes current-suite status.

Current reproduction entry point: `node scripts/audit-validation.mjs <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-021 — Console-only connection and diagnostic checks

Status: **partial-evidence**.

Jev/Kev connection checks and simplified Qwen tool/grammar diagnostics were observed during work but lack dedicated retained result files. Do not use their console-only numbers as benchmark results.

### EXP-022 — Rules/FSM/behaviour-tree/hybrid offline replay comparison

Status: **executed-development-screen**.

Evidence: [controller-benchmark.json](../../docs/validation/runs/RUN-20261017-controller-comparison-v2/controller-benchmark.json). Hash retained in catalog.

Evidence: [controller-benchmark.json](../../docs/validation/runs/RUN-20261017-controller-comparison-v1/controller-benchmark.json). Hash retained in catalog.

21 synthetic regression scenarios, 48 decisions per controller, plus 9 lexical retrieval cases. No model calls, independent holdout or production migration. Earlier v1 result retained separately in its run directory.

Current reproduction entry point: `npm run benchmark:controllers -- <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-023 — Software audit after controller prototypes

Status: **executed**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261017-controller-audit/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261017-controller-audit/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261017-controller-audit/typecheck-build.log). Hash retained in catalog.

Current source hashes, tests and build logs; does not rerun historical browser, audio or hosted model experiments.

Current reproduction entry point: `node scripts/audit-validation.mjs <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### PLAN-001 — Independent labels and asynchronous controller/selector integration

Status: **planned**.

Offline controllers and bounded model-assisted retrieval selection are measured in EXP-022/024/025. Independent human labels, missing-evidence policy and asynchronous FSM/selector/live integration remain unvalidated.

### EXP-024 — EmbeddingGemma 2 retrieval and bounded Jev/Laya selection

Status: **executed-development-screen**.

Evidence: [retrieval-selection.json](../../docs/validation/runs/RUN-20261017-semantic-selection-v1/retrieval-selection.json). Hash retained in catalog.

Evidence: [retrieval.json](../../docs/validation/runs/RUN-20261017-semantic-selection-v1/retrieval.json). Hash retained in catalog.

Evidence: [selection.jsonl](../../docs/validation/runs/RUN-20261017-semantic-selection-v1/selection.jsonl). Hash retained in catalog.

Evidence: [bootstrap-missing-pillow.log](../../docs/validation/runs/RUN-20261017-semantic-selection-v1/bootstrap-missing-pillow.log). Hash retained in catalog.

Evidence: [bootstrap-missing-torchvision.log](../../docs/validation/runs/RUN-20261017-semantic-selection-v1/bootstrap-missing-torchvision.log). Hash retained in catalog.

18 prepared texts across 3 projects; 12 calibration queries and 24 synthetic evaluation queries. Oracle menus are label-informed diagnostics; not an independent holdout. No app migration.

Current reproduction entry point: `npm run benchmark:retrieval -- <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-025 — Unfiltered semantic shortlist follow-up

Status: **executed-development-follow-up**.

Evidence: [retrieval-selection.json](../../docs/validation/runs/RUN-20261017-semantic-selection-raw-v2/retrieval-selection.json). Hash retained in catalog.

Evidence: [retrieval.json](../../docs/validation/runs/RUN-20261017-semantic-selection-raw-v2/retrieval.json). Hash retained in catalog.

Evidence: [selection.jsonl](../../docs/validation/runs/RUN-20261017-semantic-selection-raw-v2/selection.jsonl). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261017-semantic-selection-raw-v2/start-manifest.json). Hash retained in catalog.

Same evaluation cases reused after identifying gate false negatives. No independent confirmation; prompts and dataset unchanged.

Current reproduction entry point: `SHORTLIST_METHODS=semantic-raw npm run benchmark:retrieval -- <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-026 — Software audit after semantic retrieval

Status: **executed**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261017-retrieval-audit/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261017-retrieval-audit/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261017-retrieval-audit/typecheck-build.log). Hash retained in catalog.

Current tests/build/source hashes; no automatic replay of paid models or audio/browser trials.

Current reproduction entry point: `node scripts/audit-validation.mjs <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-027 — Cloudflare Clef family connectivity and primary metadata

Status: **executed-connectivity-only**.

Evidence: [connectivity.json](../../docs/validation/runs/RUN-20261017-clef-connectivity/connectivity.json). Hash retained in catalog.

Evidence: [source-manifest.json](../../docs/validation/runs/RUN-20261017-clef-connectivity/source-manifest.json). Hash retained in catalog.

Evidence: [model-metadata.json](../../docs/validation/runs/RUN-20261017-clef-connectivity/model-metadata.json). Hash retained in catalog.

One retained request per variant; not independent quality cases. Public repository metadata does not identify exact hosted checkpoint weights.

Current reproduction entry point: `npx tsx scripts/clef-connectivity-probe.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-028 — Cloudflare Clef and Clef-flash bounded selection

Status: **executed-development-screen**.

Evidence: [retrieval-selection.json](../../docs/validation/runs/RUN-20261017-clef-comparison-v1/retrieval-selection.json). Hash retained in catalog.

Evidence: [retrieval.json](../../docs/validation/runs/RUN-20261017-clef-comparison-v1/retrieval.json). Hash retained in catalog.

Evidence: [selection.jsonl](../../docs/validation/runs/RUN-20261017-clef-comparison-v1/selection.jsonl). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261017-clef-comparison-v1/start-manifest.json). Hash retained in catalog.

Evidence: [paired-summary.json](../../docs/validation/runs/RUN-20261017-clef-comparison-v1/paired-summary.json). Hash retained in catalog.

Same frozen synthetic evaluation set and menu, no tuning; gated/raw arms reuse cases. Hosted OpenRouter timing, not local or direct Workers AI performance.

Current reproduction entry point: `SHORTLIST_PROVIDERS=clef,clef-flash SHORTLIST_METHODS=semantic,semantic-raw npm run benchmark:retrieval -- <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-029 — Cloudflare Clef-omni with fresh Jev reference

Status: **executed-development-screen**.

Evidence: [retrieval-selection.json](../../docs/validation/runs/RUN-20261017-clef-omni-jev-reference/retrieval-selection.json). Hash retained in catalog.

Evidence: [retrieval.json](../../docs/validation/runs/RUN-20261017-clef-omni-jev-reference/retrieval.json). Hash retained in catalog.

Evidence: [selection.jsonl](../../docs/validation/runs/RUN-20261017-clef-omni-jev-reference/selection.jsonl). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261017-clef-omni-jev-reference/start-manifest.json). Hash retained in catalog.

Sequential single-attempt arms; unchanged text corpus/menu. Does not evaluate audio, images, video, self-hosted weights or independent holdout.

Current reproduction entry point: `SHORTLIST_PROVIDERS=clef-omni,jev SHORTLIST_METHODS=semantic,semantic-raw npm run benchmark:retrieval -- <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-030 — Software audit after Cloudflare adapter addition

Status: **executed**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261017-clef-audit/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261017-clef-audit/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261017-clef-audit/typecheck-build.log). Hash retained in catalog.

Current tests/build/source hashes. No paid model, browser or voice experiment rerun implied.

Current reproduction entry point: `node scripts/audit-validation.mjs <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-031 — Prediction-first hybrid component retrieval and speculative prefetch

Status: **executed-development-screen**.

Evidence: [prediction-first.json](../../docs/validation/runs/RUN-20261017-prediction-first-v1/prediction-first.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261017-prediction-first-v1/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261017-prediction-first-v1/steps.jsonl). Hash retained in catalog.

Evidence: [model-requests.jsonl](../../docs/validation/runs/RUN-20261017-prediction-first-v1/model-requests.jsonl). Hash retained in catalog.

Evidence: [local-setup-note.json](../../docs/validation/runs/RUN-20261017-prediction-first-v1/local-setup-note.json). Hash retained in catalog.

18 scripted steps, 9 components per project; 49 hosted Clef-omni requests. All search arms use BM25 plus dense RRF. Current-context routing, prior-only forecasts and final decisions use different metrics. Virtual lead timing is not live scheduling evidence. Local Clef setup was cancelled before weight download at user request.

Current reproduction entry point: `npm run benchmark:prediction -- <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-032 — Current software audit after prediction-first prototype

Status: **executed**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261017-prediction-first-audit/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261017-prediction-first-audit/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261017-prediction-first-audit/typecheck-build.log). Hash retained in catalog.

Current tests/build/source hashes; includes hybrid component facets, forecast scopes/epochs/TTL and malformed response guards. No implied repeat of paid, voice or browser experiments.

Current reproduction entry point: `node scripts/audit-validation.mjs <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-033 — Larger constructed library with identical final grounding

Status: **executed-development-screen**.

Evidence: [large-library.json](../../docs/validation/runs/RUN-20261017-large-library-v1/large-library.json). Hash retained in catalog.

432 constructed assets, 16 development cases, three counterbalanced passes. Warm catalog refresh, query encoding, fallbacks and grounding included. No independent real-library holdout, content-changing refresh or visible-paint validation.

Current reproduction entry point: `node --import tsx scripts/large-library-benchmark.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-034 — Software audit after library search prototype

Status: **executed**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261017-library-policy-audit/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261017-library-policy-audit/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261017-library-policy-audit/typecheck-build.log). Hash retained in catalog.

Current source/tests/build only; does not repeat hosted model benchmark or establish live integration.

Current reproduction entry point: `node scripts/audit-validation.mjs <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-035 — Grounded cue bypass and minimum-change decisions

Status: **executed-development-screen**.

Evidence: [cue-policy.json](../../docs/validation/runs/RUN-20261017-cue-policy-v1/cue-policy.json). Hash retained in catalog.

432 constructed assets, 23 authored cases, three repeated passes. Exact whole-utterance prepared cues, independent arm caches, changed-document refresh, grounding fallbacks and retain operations. No real-library holdout, renderer or live-default validation.

Current reproduction entry point: `node --import tsx scripts/cue-policy-benchmark.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-036 — Software audit after cue policy prototype

Status: **executed**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261017-cue-policy-final-audit/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261017-cue-policy-final-audit/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261017-cue-policy-final-audit/typecheck-build.log). Hash retained in catalog.

Current source/tests/build; does not rerun hosted models, speech or UI.

Current reproduction entry point: `node scripts/audit-validation.mjs <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-037 — Claim-level evidence and intent gate comparison

Status: **executed-development-screen**.

Evidence: [evidence-gate.json](../../docs/validation/runs/RUN-20261017-evidence-gate-v1/evidence-gate.json). Hash retained in catalog.

432 constructed scope assets plus six source-backed EIA/USGS concept cards; 37 authored development cases, three passes. Changed-text refreshes, final guards and grounding fallbacks included. User selected the source starter; independent review, natural STT and real-media acceptance remain pending.

Current reproduction entry point: `node --import tsx scripts/evidence-gate-benchmark.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-038 — Software audit after evidence contract implementation

Status: **executed**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261017-evidence-contract-final-audit/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261017-evidence-contract-final-audit/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261017-evidence-contract-final-audit/typecheck-build.log). Hash retained in catalog.

Current source/tests/build only; no automatic rerun of hosted model, speech, browser or independent review.

Current reproduction entry point: `node scripts/audit-validation.mjs <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### PLAN-004 — Independent review and natural speech on selected source-backed starter

Status: **planned**.

Evidence: [source_backed_review.md](../../docs/research/source_backed_review.md). Hash retained in catalog.

User selected prepared EIA/USGS cards. Source-backed development cases are not independent holdout evidence; review status remains pending.

### EXP-039 — Default evidence baseline live coordinator replay

Status: **executed-integration**.

Evidence: [live-baseline.json](../../docs/validation/runs/RUN-20261017-baseline-live-v3/live-baseline.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261017-baseline-live-v3/inputs.json). Hash retained in catalog.

Evidence: [live-baseline.json](../../docs/validation/runs/RUN-20261017-baseline-live-v1/live-baseline.json). Hash retained in catalog.

Evidence: [live-baseline.json](../../docs/validation/runs/RUN-20261017-baseline-live-v2/live-baseline.json). Hash retained in catalog.

Actual websocket, local EmbeddingGemma and hosted Clef-omni; supported selection, missing audit evidence and quoted intent. Scripted text only; no physical microphone, renderer paint or model-selection billing study.

Current reproduction entry point: `node --import tsx scripts/baseline-live-probe.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-040 — Baseline product UI, preparation fixes and Mermaid browser review

Status: **executed-with-browser-attestation**.

Evidence: [baseline_rollout.md](../../docs/research/baseline_rollout.md). Hash retained in catalog.

Evidence: [preparation-reference-failure.log](../../docs/validation/runs/RUN-20261017-baseline-ui-v1/preparation-reference-failure.log). Hash retained in catalog.

Evidence: [preparation-schema-failure.log](../../docs/validation/runs/RUN-20261017-baseline-ui-v1/preparation-schema-failure.log). Hash retained in catalog.

Evidence: [preparation-success.log](../../docs/validation/runs/RUN-20261017-baseline-ui-v1/preparation-success.log). Hash retained in catalog.

Actual local-model preparation and save/reload/library/preview; desktop/narrow geometry and wheel checks, four rendered Mermaid diagrams. Earlier failed preparation attempts preserved. No physical microphone or independent source review.

### EXP-041 — Software audit after modular baseline rollout

Status: **executed**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261023-foundation-model-audit-v3/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261023-foundation-model-audit-v3/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261023-foundation-model-audit-v3/typecheck-build.log). Hash retained in catalog.

Evidence: [packaged-macos-app.log](../../docs/validation/runs/RUN-20261023-foundation-model-audit-v3/packaged-macos-app.log). Hash retained in catalog.

Evidence: [publication-check.log](../../docs/validation/runs/RUN-20261023-foundation-model-audit-v3/publication-check.log). Hash retained in catalog.

Current tests/typecheck/build/source hashes. Superseded director tests retired; baseline/model-boundary/no-migration tests added. Does not repeat model, browser or audio trials.

Current reproduction entry point: `node scripts/audit-validation.mjs <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-042 — Shared replay runner hybrid wiring parity

Status: **executed-synthetic-parity**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-replay-parity-v4/replay.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-replay-parity-v1/inputs.json). Hash retained in catalog.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-replay-parity-v1/replay.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-replay-parity-v1/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-replay-parity-v1/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-replay-parity-v1/trace.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-replay-parity-v2/inputs.json). Hash retained in catalog.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-replay-parity-v2/replay.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-replay-parity-v2/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-replay-parity-v2/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-replay-parity-v2/trace.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-replay-parity-v3/inputs.json). Hash retained in catalog.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-replay-parity-v3/replay.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-replay-parity-v3/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-replay-parity-v3/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-replay-parity-v3/trace.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-replay-parity-v4/inputs.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-replay-parity-v4/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-replay-parity-v4/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-replay-parity-v4/trace.jsonl). Hash retained in catalog.

438 fixture assets, 37 authored cases, three passes per arm. Synthetic embeddings and deterministic evidence-derived grounding; validates wiring and accounting, not independent model quality or latency gains.

Current reproduction entry point: `npm run replay:baseline -- <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-043 — Frontend service extraction browser verification

Status: **executed-synthetic-browser**.

Evidence: [browser.json](../../docs/validation/runs/RUN-20261019-frontend-browser/browser.json). Hash retained in catalog.

Evidence: [browser.log](../../docs/validation/runs/RUN-20261019-frontend-browser/browser.log). Hash retained in catalog.

Evidence: [checks.json](../../docs/validation/runs/RUN-20261019-frontend-browser/checks.json). Hash retained in catalog.

Evidence: [failure.txt](../../docs/validation/runs/RUN-20261019-frontend-browser/failure.txt). Hash retained in catalog.

Historical standalone-browser check using a seeded synthetic story. 1440/900/600 geometry, draft reload, session switching, sidebar persistence, independent scroll, library and ready view. Launch script is retired; no physical microphone or live interview/model trial.

### EXP-044 — Composition planner separation and guarded retention replay

Status: **executed-synthetic-replay**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-composition-planners-v1/replay.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-composition-planners-v1/inputs.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-composition-planners-v1/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-composition-planners-v1/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-composition-planners-v1/trace.jsonl). Hash retained in catalog.

Five authored scenarios, three passes per planner. Real layout/reveal assertions, scripted selection/missing outcome. No model calls, independent labels, new multi-component synthesis or latency winner claim.

Current reproduction entry point: `npx tsx scripts/composition-replay.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-045 — Component evidence and optional paired composition replay

Status: **executed-synthetic-replay**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-component-coverage-v3/replay.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-component-coverage-v1/inputs.json). Hash retained in catalog.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-component-coverage-v1/replay.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-component-coverage-v1/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-component-coverage-v1/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-component-coverage-v1/trace.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-component-coverage-v2/inputs.json). Hash retained in catalog.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-component-coverage-v2/replay.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-component-coverage-v2/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-component-coverage-v2/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-component-coverage-v2/trace.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-component-coverage-v3/inputs.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-component-coverage-v3/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-component-coverage-v3/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-component-coverage-v3/trace.jsonl). Hash retained in catalog.

Eight authored scenarios, three passes per planner. Fixed selected component; tests coverage/compatibility/withdrawal invariants, not model, retrieval or natural-speech quality.

Current reproduction entry point: `npx tsx scripts/component-coverage-replay.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-046 — Component coverage disclosure browser and persistence checks

Status: **executed-synthetic-browser**.

Evidence: [browser.json](../../docs/validation/runs/RUN-20261019-component-coverage-browser/browser.json). Hash retained in catalog.

Evidence: [browser.log](../../docs/validation/runs/RUN-20261019-component-coverage-browser/browser.log). Hash retained in catalog.

Evidence: [checks.json](../../docs/validation/runs/RUN-20261019-component-coverage-browser/checks.json). Hash retained in catalog.

Evidence: [component-coverage-failure-1792392667303.txt](../../docs/validation/runs/RUN-20261019-component-coverage-browser/component-coverage-failure-1792392667303.txt). Hash retained in catalog.

Evidence: [component-coverage-v2-failure-1792392732577.txt](../../docs/validation/runs/RUN-20261019-component-coverage-browser/component-coverage-v2-failure-1792392732577.txt). Hash retained in catalog.

Evidence: [component-coverage-v3-failure-1792392881257.txt](../../docs/validation/runs/RUN-20261019-component-coverage-browser/component-coverage-v3-failure-1792392881257.txt). Hash retained in catalog.

Evidence: [component-coverage-v4-browser.log](../../docs/validation/runs/RUN-20261019-component-coverage-browser/component-coverage-v4-browser.log). Hash retained in catalog.

Evidence: [component-coverage-v4-checks.json](../../docs/validation/runs/RUN-20261019-component-coverage-browser/component-coverage-v4-checks.json). Hash retained in catalog.

Evidence: [initial-focused-assertion-failures.log](../../docs/validation/runs/RUN-20261019-component-coverage-browser/initial-focused-assertion-failures.log). Hash retained in catalog.

Historical standalone-browser check with seeded reviewed text/diagram story, coverage disclosure and 1440/900/600 geometry. Launch script is retired; earlier invalid UUID/connection-limit failures retained. No microphone or new model generation.

### EXP-047 — Bounded richer synthesis replay

Status: **executed-synthetic-replay**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-synthesis-v2/replay.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-synthesis-v1/inputs.json). Hash retained in catalog.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-synthesis-v1/replay.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-synthesis-v1/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-synthesis-v1/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-synthesis-v1/trace.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-synthesis-v2/inputs.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-synthesis-v2/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-synthesis-v2/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-synthesis-v2/trace.jsonl). Hash retained in catalog.

15 authored scenarios, three passes per arm; actual composition counts/slot checks, fixed primary selections. No new model, speech or independent semantic benchmark.

Current reproduction entry point: `npx tsx scripts/synthesis-replay.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-048 — Four-component OpenUI and JSON-render browser checks

Status: **executed-synthetic-browser**.

Evidence: [browser.json](../../docs/validation/runs/RUN-20261019-synthesis-browser/browser.json). Hash retained in catalog.

Evidence: [browser.log](../../docs/validation/runs/RUN-20261019-synthesis-browser/browser.log). Hash retained in catalog.

Evidence: [checks.json](../../docs/validation/runs/RUN-20261019-synthesis-browser/checks.json). Hash retained in catalog.

Evidence: [json-render-1440.png](../../docs/validation/runs/RUN-20261019-synthesis-browser/json-render-1440.png). Hash retained in catalog.

Evidence: [json-render-600.png](../../docs/validation/runs/RUN-20261019-synthesis-browser/json-render-600.png). Hash retained in catalog.

Evidence: [json-render-900.png](../../docs/validation/runs/RUN-20261019-synthesis-browser/json-render-900.png). Hash retained in catalog.

Evidence: [openui-1440.png](../../docs/validation/runs/RUN-20261019-synthesis-browser/openui-1440.png). Hash retained in catalog.

Evidence: [openui-600.png](../../docs/validation/runs/RUN-20261019-synthesis-browser/openui-600.png). Hash retained in catalog.

Evidence: [openui-900.png](../../docs/validation/runs/RUN-20261019-synthesis-browser/openui-900.png). Hash retained in catalog.

Evidence: [panel.png](../../docs/validation/runs/RUN-20261019-synthesis-browser/panel.png). Hash retained in catalog.

Evidence: [review.html](../../docs/validation/runs/RUN-20261019-synthesis-browser/review.html). Hash retained in catalog.

Historical standalone-browser renderer comparison: four components, two real chart SVGs and synthetic PNG, both renderer packages at 1440/900/600. Temporary harness and launch path are retired; no microphone or full product acceptance.

### EXP-049 — Reviewed local preparation and actual Chrome spoken rich demo

Status: **executed-with-disclosed-intervention**.

Evidence: [demo.json](../../docs/validation/runs/RUN-20261019-full-spoken-demo/demo.json). Hash retained in catalog.

Evidence: [chrome-generation-complete.png](../../docs/validation/runs/RUN-20261019-full-spoken-demo/chrome-generation-complete.png). Hash retained in catalog.

Evidence: [chrome-rich-complete.png](../../docs/validation/runs/RUN-20261019-full-spoken-demo/chrome-rich-complete.png). Hash retained in catalog.

Evidence: [chrome-storage-complete.png](../../docs/validation/runs/RUN-20261019-full-spoken-demo/chrome-storage-complete.png). Hash retained in catalog.

Evidence: [coverage-correction.json](../../docs/validation/runs/RUN-20261019-full-spoken-demo/coverage-correction.json). Hash retained in catalog.

Evidence: [detour-and-return.wav](../../docs/validation/runs/RUN-20261019-full-spoken-demo/detour-and-return.wav). Hash retained in catalog.

Evidence: [first-replay.json](../../docs/validation/runs/RUN-20261019-full-spoken-demo/first-replay.json). Hash retained in catalog.

Evidence: [generation-first-replay.json](../../docs/validation/runs/RUN-20261019-full-spoken-demo/generation-first-replay.json). Hash retained in catalog.

Evidence: [generation-first.wav](../../docs/validation/runs/RUN-20261019-full-spoken-demo/generation-first.wav). Hash retained in catalog.

Evidence: [interview.json](../../docs/validation/runs/RUN-20261019-full-spoken-demo/interview.json). Hash retained in catalog.

Evidence: [manifest.json](../../docs/validation/runs/RUN-20261019-full-spoken-demo/manifest.json). Hash retained in catalog.

Evidence: [preparation.json](../../docs/validation/runs/RUN-20261019-full-spoken-demo/preparation.json). Hash retained in catalog.

Evidence: [presenter-review.log](../../docs/validation/runs/RUN-20261019-full-spoken-demo/presenter-review.log). Hash retained in catalog.

Evidence: [second-replay.json](../../docs/validation/runs/RUN-20261019-full-spoken-demo/second-replay.json). Hash retained in catalog.

Evidence: [storage-first-replay.json](../../docs/validation/runs/RUN-20261019-full-spoken-demo/storage-first-replay.json). Hash retained in catalog.

Evidence: [storage-first.wav](../../docs/validation/runs/RUN-20261019-full-spoken-demo/storage-first.wav). Hash retained in catalog.

Actual Qwen preparation, presenter reference/coverage correction, Piper audio to Moonshine to synthesis in Chrome. Tuned synthetic headings; failed preparation/recognition attempts retained. 4/2/4 and 2/4/2 observed, not untouched speech acceptance.

### EXP-050 — Compiled snapshots, exact vector cache and preparation readiness

Status: **executed-local-embedding-parity**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v5/replay.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v1/inputs.json). Hash retained in catalog.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v1/replay.json). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-compiled-cache-v1/trace.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v2/inputs.json). Hash retained in catalog.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v2/replay.json). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-compiled-cache-v2/trace.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v3/inputs.json). Hash retained in catalog.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v3/replay.json). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-compiled-cache-v3/trace.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v4/inputs.json). Hash retained in catalog.

Evidence: [live.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v4/live.json). Hash retained in catalog.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v4/replay.json). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-compiled-cache-v4/trace.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v5/inputs.json). Hash retained in catalog.

Evidence: [live.json](../../docs/validation/runs/RUN-20261019-compiled-cache-v5/live.json). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-compiled-cache-v5/trace.jsonl). Hash retained in catalog.

Real local EmbeddingGemma, 12 synthetic-story requests repeated three times per arm, two metadata refreshes per pass, deterministic selection stub. Exact outcomes compared with archived presenter. Includes startup and final checks; not independent quality, hosted cost, STT or paint acceptance.

Current reproduction entry point: `node --import tsx scripts/optimization-replay.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-051 — Small local decision input feasibility

Status: **executed-negative-development-probe**.

Evidence: [local.json](../../docs/validation/runs/RUN-20261019-local-decision-feasibility/local.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-local-decision-feasibility/inputs.json). Hash retained in catalog.

Evidence: [model-metadata.json](../../docs/validation/runs/RUN-20261019-local-decision-feasibility/model-metadata.json). Hash retained in catalog.

Evidence: [requests.json](../../docs/validation/runs/RUN-20261019-local-decision-feasibility/requests.json). Hash retained in catalog.

Pinned local Laya, six synthetic cases repeated twice. Full requests rejected on token budget; compact requests valid but 4/12 correct. Direct model probe without live guards, no quantization or hosted calls.

Current reproduction entry point: `node --import tsx scripts/local-decision-feasibility.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-052 — Native compact local classifiers and host evidence overlay

Status: **executed-negative-development-screen**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-compact-local-v1/replay.json). Hash retained in catalog.

Evidence: [compact-gliner-english.log](../../docs/validation/runs/RUN-20261019-compact-local-v1/compact-gliner-english.log). Hash retained in catalog.

Evidence: [compact-gliner-multi.log](../../docs/validation/runs/RUN-20261019-compact-local-v1/compact-gliner-multi.log). Hash retained in catalog.

Evidence: [compact-laya.log](../../docs/validation/runs/RUN-20261019-compact-local-v1/compact-laya.log). Hash retained in catalog.

Evidence: [download-notes.json](../../docs/validation/runs/RUN-20261019-compact-local-v1/download-notes.json). Hash retained in catalog.

Evidence: [gliner-english-fp32.json](../../docs/validation/runs/RUN-20261019-compact-local-v1/gliner-english-fp32.json). Hash retained in catalog.

Evidence: [gliner-english-fp32.jsonl](../../docs/validation/runs/RUN-20261019-compact-local-v1/gliner-english-fp32.jsonl). Hash retained in catalog.

Evidence: [gliner-multi-fp32.json](../../docs/validation/runs/RUN-20261019-compact-local-v1/gliner-multi-fp32.json). Hash retained in catalog.

Evidence: [gliner-multi-fp32.jsonl](../../docs/validation/runs/RUN-20261019-compact-local-v1/gliner-multi-fp32.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-compact-local-v1/inputs.json). Hash retained in catalog.

Evidence: [laya-english-fp32.json](../../docs/validation/runs/RUN-20261019-compact-local-v1/laya-english-fp32.json). Hash retained in catalog.

Evidence: [laya-english-fp32.jsonl](../../docs/validation/runs/RUN-20261019-compact-local-v1/laya-english-fp32.jsonl). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-compact-local-v1/start-manifest.json). Hash retained in catalog.

24 authored cases under three option orders; local Laya and native GLiNER English/multilingual. Direct quality and actual guard overlay reported separately. No candidate passed the frozen precision gate; no quantization or default change.

Current reproduction entry point: `node --import tsx scripts/prepare-compact-local.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-053 — Semantic label codec development follow-up

Status: **executed-negative-development-followup**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-compact-local-semantic-v1/replay.json). Hash retained in catalog.

Evidence: [compact-gliner-english-semantic.log](../../docs/validation/runs/RUN-20261019-compact-local-semantic-v1/compact-gliner-english-semantic.log). Hash retained in catalog.

Evidence: [compact-gliner-multi-semantic.log](../../docs/validation/runs/RUN-20261019-compact-local-semantic-v1/compact-gliner-multi-semantic.log). Hash retained in catalog.

Evidence: [gliner-english-fp32-semantic.json](../../docs/validation/runs/RUN-20261019-compact-local-semantic-v1/gliner-english-fp32-semantic.json). Hash retained in catalog.

Evidence: [gliner-english-fp32-semantic.jsonl](../../docs/validation/runs/RUN-20261019-compact-local-semantic-v1/gliner-english-fp32-semantic.jsonl). Hash retained in catalog.

Evidence: [gliner-multi-fp32-semantic.json](../../docs/validation/runs/RUN-20261019-compact-local-semantic-v1/gliner-multi-fp32-semantic.json). Hash retained in catalog.

Evidence: [gliner-multi-fp32-semantic.jsonl](../../docs/validation/runs/RUN-20261019-compact-local-semantic-v1/gliner-multi-fp32-semantic.jsonl). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-compact-local-semantic-v1/inputs.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-compact-local-semantic-v1/start-manifest.json). Hash retained in catalog.

Same frozen 24 cases after observed failures; only label IDs change. Two local GLiNER variants, no independent holdout, retrieval, STT or live UI acceptance.

Current reproduction entry point: `runtime/compact_local_benchmark.py --codec semantic`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-054 — Local-only role assignment: host eligibility, hybrid ranking and classifier preference

Status: **executed-development-role-replay**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-local-roles-v2/replay.json). Hash retained in catalog.

Evidence: [bootstrap-failure.json](../../docs/validation/runs/RUN-20261019-local-roles-v1/bootstrap-failure.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-local-roles-v2/inputs.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-local-roles-v2/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-local-roles-v2/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-local-roles-v2/trace.jsonl). Hash retained in catalog.

438 authored/source-backed cards plus a declared alternate; 42 cases repeated three times per arm. Real local embeddings/native classifier, isolated caches and scheduled refresh/withdrawal. All arms 126/126; no hosted calls or independent natural-speech acceptance.

Current reproduction entry point: `node --import tsx scripts/local-role-replay.ts <unique-run-id>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-055 — Normal local profile coordinator integration

Status: **executed-local-text-integration**.

Evidence: [local.json](../../docs/validation/runs/RUN-20261019-local-roles-live/local.json). Hash retained in catalog.

Actual coordinator and embedding runtime: omitted profile selects local hybrid, four-component synthesis, missing-evidence hold, zero provider attempts. Text protocol only; no audio, STT or browser paint claim.

Current reproduction entry point: `node --import tsx scripts/local-only-live-probe.ts output/<unique-name>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-056 — Bounded local preference runtime and feedback loop

Status: **executed-local-text-integration**.

Evidence: [local.json](../../docs/validation/runs/RUN-20261019-local-preference-loop-v1/local.json). Hash retained in catalog.

Real coordinator, embeddings and native worker readiness; 300 ms deadline triggered local fallback; four-component synthesis, missing evidence retention and project/story feedback; no audio or browser acceptance.

Current reproduction entry point: `node --import tsx scripts/local-preference-live-probe.ts output/<unique-name>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-057 — Runtime preference repeated large-library replay

Status: **executed-local-model**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-local-preference-runtime-v1/replay.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-local-preference-runtime-v1/inputs.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-local-preference-runtime-v1/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-local-preference-runtime-v1/steps.jsonl). Hash retained in catalog.

Evidence: [trace.jsonl](../../docs/validation/runs/RUN-20261019-local-preference-runtime-v1/trace.jsonl). Hash retained in catalog.

42 authored cases, three passes, three arms, real local embeddings/native classifier. No new preference-quality holdout; same acceptable alternatives as EXP-054. Separate live warm probe overlapped near end; not isolated timing.

Current reproduction entry point: `node --import tsx scripts/local-role-replay.ts RUN-unique-id`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-058 — Warm native preference coordinator loop

Status: **executed-local-text-integration**.

Evidence: [local.json](../../docs/validation/runs/RUN-20261019-local-preference-loop-v2/local.json). Hash retained in catalog.

One native choice, one deadline fallback, one retained turn; missing feedback and zero provider attempts. Same-machine replay contention; text protocol only.

Current reproduction entry point: `node --import tsx scripts/local-preference-live-probe.ts output/<unique-name>`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-059 — Distinct eligible-asset preference quality and small reranker

Status: **executed-development-quality-screen**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-preference-quality-v1/replay.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-preference-quality-v1/inputs.json). Hash retained in catalog.

Evidence: [start-manifest.json](../../docs/validation/runs/RUN-20261019-preference-quality-v1/start-manifest.json). Hash retained in catalog.

Evidence: [steps.jsonl](../../docs/validation/runs/RUN-20261019-preference-quality-v1/steps.jsonl). Hash retained in catalog.

32 authored exact-preference cases, three passes, 458-entry library, real local embeddings and two native workers. Oracle intent isolates preference; actual interpreter rejects all 32. GLiNER misses budget; MiniLM is fast but no accuracy gain. Not independent speech acceptance.

Current reproduction entry point: `node --import tsx scripts/preference-quality-replay.ts RUN-unique-id`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-060 — Piper to Moonshine to presenter commit preference acceptance

Status: **executed-negative-audio-integration**.

Evidence: [local.json](../../docs/validation/runs/RUN-20261019-preference-audio-v2/local.json). Hash retained in catalog.

Evidence: [explain.pcm](../../docs/validation/runs/RUN-20261019-preference-audio-v1/explain.pcm). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-preference-audio-v1/inputs.json). Hash retained in catalog.

Evidence: [local.json](../../docs/validation/runs/RUN-20261019-preference-audio-v1/local.json). Hash retained in catalog.

Evidence: [missing.pcm](../../docs/validation/runs/RUN-20261019-preference-audio-v1/missing.pcm). Hash retained in catalog.

Evidence: [retain.pcm](../../docs/validation/runs/RUN-20261019-preference-audio-v1/retain.pcm). Hash retained in catalog.

Evidence: [explain.pcm](../../docs/validation/runs/RUN-20261019-preference-audio-v2/explain.pcm). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-preference-audio-v2/inputs.json). Hash retained in catalog.

Evidence: [missing.pcm](../../docs/validation/runs/RUN-20261019-preference-audio-v2/missing.pcm). Hash retained in catalog.

Evidence: [retain.pcm](../../docs/validation/runs/RUN-20261019-preference-audio-v2/retain.pcm). Hash retained in catalog.

Three authored TTS utterances per arm; real paced PCM/STT/controller and no transcript injection. Explanatory utterance splits and is held; missing/retain behavior passes. No browser paint or physical microphone. Earlier v1 selected first completed segment; preserved with full event stream.

Current reproduction entry point: `node --import tsx scripts/preference-audio-loop.ts RUN-unique-id`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-061 — Dynamic INT8 narrow preference diagnostic

Status: **executed-negative-precision-screen**.

Evidence: [replay.json](../../docs/validation/runs/RUN-20261019-preference-int8-v1/replay.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-preference-int8-v1/inputs.json). Hash retained in catalog.

Same frozen 32 role cases, three rotated menus. INT8 Linear/qnnpack is slower, 89/96 unrestricted versus 96/96 FP32; all timed calls fall back. Rotated fallback menu is not hybrid-ranked, so its timed accuracy is not comparable to EXP-059. Checkpoint storage unchanged; peak includes conversion.

Current reproduction entry point: `node --import tsx scripts/preference-precision-replay.ts RUN-unique-id`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-062 — Public snapshot local defaults and synthesis integration

Status: **executed-local-text-integration**.

Evidence: [local.json](../../docs/validation/runs/RUN-20261019-public-defaults-live/local.json). Hash retained in catalog.

Restarted normal dev command without planner override; local hybrid plus default synthesis makes four supported components and holds missing evidence. No provider attempts; text protocol only, not audio or browser acceptance.

Current reproduction entry point: `node --import tsx scripts/local-only-live-probe.ts output/unique-name`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-063 — Alpha release browser speech and lifecycle acceptance

Status: **executed-mixed-browser-audio**.

Evidence: [browser.json](../../docs/validation/runs/RUN-20261019-release-live-v1/browser.json). Hash retained in catalog.

Evidence: [audience-resumed.png](../../docs/validation/runs/RUN-20261019-release-live-v1/audience-resumed.png). Hash retained in catalog.

Evidence: [browser-init.js](../../docs/validation/runs/RUN-20261019-release-live-v1/browser-init.js). Hash retained in catalog.

Evidence: [first-story-attempt-failed.png](../../docs/validation/runs/RUN-20261019-release-live-v1/first-story-attempt-failed.png). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-release-live-v1/inputs.json). Hash retained in catalog.

Evidence: [panels-audio.log](../../docs/validation/runs/RUN-20261019-release-live-v1/panels-audio.log). Hash retained in catalog.

Evidence: [prepared-final.png](../../docs/validation/runs/RUN-20261019-release-live-v1/prepared-final.png). Hash retained in catalog.

Evidence: [presenter-resumed.png](../../docs/validation/runs/RUN-20261019-release-live-v1/presenter-resumed.png). Hash retained in catalog.

Evidence: [speech-0.wav](../../docs/validation/runs/RUN-20261019-release-live-v1/speech-0.wav). Hash retained in catalog.

Evidence: [speech-1.wav](../../docs/validation/runs/RUN-20261019-release-live-v1/speech-1.wav). Hash retained in catalog.

Evidence: [speech-2.wav](../../docs/validation/runs/RUN-20261019-release-live-v1/speech-2.wav). Hash retained in catalog.

Evidence: [synthesize.py](../../docs/validation/runs/RUN-20261019-release-live-v1/synthesize.py). Hash retained in catalog.

Real local interview and fourth-attempt story after brief refinement; Piper virtual microphone, Moonshine, embeddings, audience projection, reconnect and fresh-session recovery. Battery selection and missing evidence pass; panel STT split fails. No physical microphone or independent speech acceptance.

### EXP-064 — Transcript assembly versus a separate story-signal index

Status: **executed-local-audio-ablation**.

Evidence: [local.json](../../docs/validation/runs/RUN-20261019-transcript-ablation-v2/local.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-transcript-ablation-v1/inputs.json). Hash retained in catalog.

Evidence: [local.json](../../docs/validation/runs/RUN-20261019-transcript-ablation-v1/local.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-transcript-ablation-v2/inputs.json). Hash retained in catalog.

Four authored Piper recordings shared across per-final, temporal and signal-assisted arms. v1 overlap bug retained; v2 temporal and extra index both 4/4 versus per-final 3/4. Removed index has no incremental demonstrated benefit. Current command runs only the retained arms; historical three-arm source is frozen.

Current reproduction entry point: `node --import tsx scripts/speech-assembly-replay.ts RUN-unique-id`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-065 — Minimal transcript assembly after signal-index removal

Status: **executed-local-audio-development**.

Evidence: [local.json](../../docs/validation/runs/RUN-20261019-transcript-minimal-v3/local.json). Hash retained in catalog.

Evidence: [inputs.json](../../docs/validation/runs/RUN-20261019-transcript-minimal-v3/inputs.json). Hash retained in catalog.

Same four recordings, one pass per case. Panel starts on battery view and must change canvas. Minimal assembly 4/4 versus per-final 3/4; unknown costs and retain preserved. Adds quiet-window latency; not independent microphone, semantic-quality or p95 acceptance.

Current reproduction entry point: `node --import tsx scripts/speech-assembly-replay.ts RUN-unique-id`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-066 — Native SwiftUI app shell, model settings and packaged coordinator

Status: **executed-local-software-and-package-check**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261020-swiftui-native-v1/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261020-swiftui-native-v1/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261020-swiftui-native-v1/typecheck-build.log). Hash retained in catalog.

Evidence: [packaged-macos-app.log](../../docs/validation/runs/RUN-20261020-swiftui-native-v1/packaged-macos-app.log). Hash retained in catalog.

Evidence: [publication-check.log](../../docs/validation/runs/RUN-20261020-swiftui-native-v1/publication-check.log). Hash retained in catalog.

Native SwiftUI interface, credential-safe model settings, owner-only persistence, bundled TypeScript coordinator and official standalone Node runtime. Includes coordinator HTTP health/settings smoke and app compilation. No model inference, real microphone, speech-quality or interactive UI acceptance.

Current reproduction entry point: `node scripts/audit-validation.mjs RUN-20261020-swiftui-native-v1`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-067 — SwiftUI package runtime imports and refreshed source evidence

Status: **executed-local-software-and-package-check**.

Evidence: [run.json](../../docs/validation/runs/RUN-20261020-swiftui-native-v2/run.json). Hash retained in catalog.

Evidence: [unit-integration.log](../../docs/validation/runs/RUN-20261020-swiftui-native-v2/unit-integration.log). Hash retained in catalog.

Evidence: [typecheck-build.log](../../docs/validation/runs/RUN-20261020-swiftui-native-v2/typecheck-build.log). Hash retained in catalog.

Evidence: [packaged-macos-app.log](../../docs/validation/runs/RUN-20261020-swiftui-native-v2/packaged-macos-app.log). Hash retained in catalog.

Evidence: [publication-check.log](../../docs/validation/runs/RUN-20261020-swiftui-native-v2/publication-check.log). Hash retained in catalog.

Rechecks current documentation/source hashes and loads the bundled Transformers.js plus native ONNX runtime before the packaged coordinator HTTP smoke. No model weights, inference, real microphone or interactive native UI trial.

Current reproduction entry point: `node scripts/audit-validation.mjs RUN-20261020-swiftui-native-v2`. Inspect prerequisites/output paths before running; model probes may incur costs.

### EXP-068 — Apple Foundation Models preparation feasibility

Status: **executed-negative-reference-contract**.

Evidence: [comparison.json](../../docs/validation/runs/RUN-20261023-foundation-model-feasibility/comparison.json). Hash retained in catalog.

Evidence: [protocol.md](../../docs/validation/runs/RUN-20261023-foundation-model-feasibility/protocol.md). Hash retained in catalog.

Evidence: [cases.json](../../docs/validation/runs/RUN-20261023-foundation-model-feasibility/cases.json). Hash retained in catalog.

Evidence: [foundation-model-probe.swift](../../scripts/foundation-model-probe.swift). Hash retained in catalog.

Evidence: [foundation-model-comparison.mjs](../../scripts/foundation-model-comparison.mjs). Hash retained in catalog.

Two frozen synthetic one-shot cases on macOS 27.0.1/M5, one attempt per case/provider. Foundation Models was available with 8,192-token context and produced valid structure in about 7 seconds, but altered all supported-case source IDs so host exact-reference validation would reject it; missing-evidence case passed. Installed Qwen took about 61/117 seconds, passed only the missing-evidence shape/reference checks. Not an independent benchmark; semantic judgement is limited to retained authored outputs; no tool-loop, long-source, cancellation or application integration.

### PLAN-002 — Media retrieval, dimensions and semantic answer cache comparison

Status: **planned**.

Evidence: [embeddinggemma_use_cases.md](../../docs/embeddinggemma_use_cases.md). Hash retained in catalog.

Text-only embedding retrieval and exact query caching are measured in EXP-024/025. Multimodal encoders, smaller dimensions and semantic answer reuse remain unvalidated.

### PLAN-003 — Alternative STT, Groq, orchestration and desktop comparisons

Status: **research-only**.

Evidence: [baseline_technology_research.md](../../docs/baseline_technology_research.md). Hash retained in catalog.

Moonshine Medium/sherpa, Groq/other local sizes, alternative orchestration frameworks and Electron were not benchmarked as winners.

## Current individual software cases

160/160 passed in RUN-20261023-foundation-model-audit-v3, 0 failed, 0 skipped.

| ID | Case | Source |
|---|---|---|
| TEST-ADAPTIVE-01 | adaptive host validates and commits injected baseline decisions | [tests/adaptive.test.ts:9](../../tests/adaptive.test.ts#L9) |
| TEST-ADAPTIVE-02 | stopping cancels a late baseline decision | [tests/adaptive.test.ts:10](../../tests/adaptive.test.ts#L10) |
| TEST-ADAPTIVE-03 | invalid model references hold current content and expose a bounded error | [tests/adaptive.test.ts:11](../../tests/adaptive.test.ts#L11) |
| TEST-AGENTS-01 | real SDK interviewer tool loop gathers a brief without producing a story | [tests/agents.test.ts:68](../../tests/agents.test.ts#L68) |
| TEST-AGENTS-02 | storyteller returns a structured flow, correction invalidates review | [tests/agents.test.ts:80](../../tests/agents.test.ts#L80) |
| TEST-AGENTS-03 | missing context travels back to interviewer without autonomous runaway loops | [tests/agents.test.ts:98](../../tests/agents.test.ts#L98) |
| TEST-AGENTS-04 | unknown artifact references reject the entire draft | [tests/agents.test.ts:114](../../tests/agents.test.ts#L114) |
| TEST-AGENTS-05 | cancelled old response cannot overwrite a newer presenter correction | [tests/agents.test.ts:131](../../tests/agents.test.ts#L131) |
| TEST-AGENTS-06 | finishing the interview hands a committed brief to the separate storyteller | [tests/agents.test.ts:144](../../tests/agents.test.ts#L144) |
| TEST-AGENTS-07 | incomplete interview does not launch a storyteller | [tests/agents.test.ts:151](../../tests/agents.test.ts#L151) |
| TEST-AGENTS-08 | preparation with no materials exposes no readArtifact tool | [tests/agents.test.ts:156](../../tests/agents.test.ts#L156) |
| TEST-AGENTS-09 | storyteller tool schema excludes host-owned evidence contracts | [tests/agents.test.ts:160](../../tests/agents.test.ts#L160) |
| TEST-AGENTS-10 | interviewer exposes searchWeb tool which safely executes queries and saves research artifacts | [tests/agents.test.ts:164](../../tests/agents.test.ts#L164) |
| TEST-BASELINE-01 | historical model registry retains Clef-omni and useful tested comparison models | [tests/baseline.test.ts:11](../../tests/baseline.test.ts#L11) |
| TEST-BASELINE-02 | catalog rejects legacy stories and does not silently invent contracts | [tests/baseline.test.ts:12](../../tests/baseline.test.ts#L12) |
| TEST-BASELINE-03 | default pipeline selects grounded prepared content without a model on exact supported cues | [tests/baseline.test.ts:13](../../tests/baseline.test.ts#L13) |
| TEST-BASELINE-04 | new stories record explicit evidence status and speaker notes are excluded | [tests/baseline.test.ts:14](../../tests/baseline.test.ts#L14) |
| TEST-BASELINE-05 | baseline trace metadata correlates final validation and decisions without transcripts | [tests/baseline.test.ts:15](../../tests/baseline.test.ts#L15) |
| TEST-COMPACT-LOCAL-FIXTURE-01 | compact local screen freezes balanced positives and negatives with valid full evidence outside model inputs | [tests/compact-local-fixture.test.ts:5](../../tests/compact-local-fixture.test.ts#L5) |
| TEST-COMPONENT-EVIDENCE-01 | paired composition requires explicit same-claim component coverage | [tests/component-evidence.test.ts:10](../../tests/component-evidence.test.ts#L10) |
| TEST-COMPONENT-EVIDENCE-02 | explicit visual requests remain focused and legacy beat coverage cannot form pairs | [tests/component-evidence.test.ts:19](../../tests/component-evidence.test.ts#L19) |
| TEST-COMPONENT-EVIDENCE-03 | changing rendered content or withdrawing a contract invalidates planned pairs | [tests/component-evidence.test.ts:26](../../tests/component-evidence.test.ts#L26) |
| TEST-COMPONENT-EVIDENCE-04 | component source withdrawal and stale reviews fail before approval | [tests/component-evidence.test.ts:34](../../tests/component-evidence.test.ts#L34) |
| TEST-COMPONENT-EVIDENCE-05 | preparation does not infer audit status and content hashes survive schema whitespace normalization | [tests/component-evidence.test.ts:40](../../tests/component-evidence.test.ts#L40) |
| TEST-COMPONENT-EVIDENCE-06 | live presenter can form an approved pair on a unique cue without a model call | [tests/component-evidence.test.ts:44](../../tests/component-evidence.test.ts#L44) |
| TEST-COMPONENT-EVIDENCE-07 | declared coverage cannot silently omit its chart or image binding | [tests/component-evidence.test.ts:49](../../tests/component-evidence.test.ts#L49) |
| TEST-COMPOSITION-PLANNER-01 | focus reproduces bound focus behavior while stable preserves an eligible reveal | [tests/composition-planner.test.ts:7](../../tests/composition-planner.test.ts#L7) |
| TEST-COMPOSITION-PLANNER-02 | host rejects omitted selections, unsupported extra claims, duplicates and invalid reveal | [tests/composition-planner.test.ts:12](../../tests/composition-planner.test.ts#L12) |
| TEST-COMPOSITION-PLANNER-03 | cancelled planners cannot return proposals | [tests/composition-planner.test.ts:18](../../tests/composition-planner.test.ts#L18) |
| TEST-COMPOSITION-PLANNER-04 | injected planner cannot rewrite evidence or bypass final composition checks | [tests/composition-planner.test.ts:19](../../tests/composition-planner.test.ts#L19) |
| TEST-CONTROLLER-INVARIANTS-01 | seeded event stress preserves grounding, dwell, lifecycle and epoch guards across all strategies | [tests/controller-invariants.test.ts:6](../../tests/controller-invariants.test.ts#L6) |
| TEST-CONTROLLER-INVARIANTS-02 | confirmation cannot survive an unrelated or invalid observation | [tests/controller-invariants.test.ts:23](../../tests/controller-invariants.test.ts#L23) |
| TEST-CONTROLLERS-01 | temporal controllers satisfy every fixed replay including interruptions, comparisons and stale inputs | [tests/controllers.test.ts:7](../../tests/controllers.test.ts#L7) |
| TEST-CONTROLLERS-02 | priority rules baseline exposes one-window noise rather than silently granting confirmation memory | [tests/controllers.test.ts:12](../../tests/controllers.test.ts#L12) |
| TEST-CONTROLLERS-03 | all strategies reject malformed confidence and preserve immutable prepared state | [tests/controllers.test.ts:16](../../tests/controllers.test.ts#L16) |
| TEST-CONTROLLERS-04 | prepared shortlist is bounded, grounded, revision-scoped and excludes private notes | [tests/controllers.test.ts:25](../../tests/controllers.test.ts#L25) |
| TEST-CONTROLLERS-05 | lexical retrieval regression retains paraphrase and missing-evidence failures as explicit gaps | [tests/controllers.test.ts:33](../../tests/controllers.test.ts#L33) |
| TEST-CREDENTIALS-01 | hosted comparisons require explicit credentials instead of discovering other app auth | [tests/credentials.test.ts:4](../../tests/credentials.test.ts#L4) |
| TEST-DUAL-SCREEN-RESUMPTION-01 | dual-screen presenter view and session resumption | [tests/dual-screen-resumption.test.ts:11](../../tests/dual-screen-resumption.test.ts#L11) |
| TEST-EVIDENCE-CONTRACT-01 | claim contracts validate references, hashes and identity without inventing audit status | [tests/evidence-contract.test.ts:9](../../tests/evidence-contract.test.ts#L9) |
| TEST-EVIDENCE-CONTRACT-02 | complete request obligations require matching claim, scope, form, units and provenance | [tests/evidence-contract.test.ts:10](../../tests/evidence-contract.test.ts#L10) |
| TEST-EVIDENCE-CONTRACT-03 | quoted, hypothetical, negated and incidental mentions do not become show requests | [tests/evidence-contract.test.ts:11](../../tests/evidence-contract.test.ts#L11) |
| TEST-EVIDENCE-CONTRACT-04 | additional facts, unsupported provenance and missing time never inherit arbitrary evidence | [tests/evidence-contract.test.ts:12](../../tests/evidence-contract.test.ts#L12) |
| TEST-EVIDENCE-CONTRACT-05 | explicit correction resolves the active clause without keeping the negated entity | [tests/evidence-contract.test.ts:13](../../tests/evidence-contract.test.ts#L13) |
| TEST-EVIDENCE-CONTRACT-06 | incomplete evidence is blocked even when cue or model proposes a valid catalog ID | [tests/evidence-contract.test.ts:14](../../tests/evidence-contract.test.ts#L14) |
| TEST-EVIDENCE-CONTRACT-07 | uncontracted or unreviewed sources fail closed when independent review is required | [tests/evidence-contract.test.ts:15](../../tests/evidence-contract.test.ts#L15) |
| TEST-EVIDENCE-CONTRACT-08 | unsupported requested claims cannot be concealed by a broad topic alias | [tests/evidence-contract.test.ts:16](../../tests/evidence-contract.test.ts#L16) |
| TEST-EVIDENCE-CONTRACT-09 | independent review is required by default and approving a snapshot is not an audit | [tests/evidence-contract.test.ts:17](../../tests/evidence-contract.test.ts#L17) |
| TEST-EVIDENCE-CONTRACT-10 | a wrongly bound prepared cue cannot override evidence obligations | [tests/evidence-contract.test.ts:18](../../tests/evidence-contract.test.ts#L18) |
| TEST-EVIDENCE-CONTRACT-11 | public-source obligations have useful positive coverage and reject unsupported conjunctions | [tests/evidence-contract.test.ts:19](../../tests/evidence-contract.test.ts#L19) |
| TEST-EVIDENCE-CONTRACT-12 | single-quoted requests cannot become active intent while contractions remain ordinary text | [tests/evidence-contract.test.ts:21](../../tests/evidence-contract.test.ts#L21) |
| TEST-LIBRARY-GROUNDING-01 | live grounding does not characterize real source evidence as simulated | [tests/library-grounding.test.ts:5](../../tests/library-grounding.test.ts#L5) |
| TEST-LIBRARY-GROUNDING-02 | grounding does not silently choose a hosted comparison provider | [tests/library-grounding.test.ts:14](../../tests/library-grounding.test.ts#L14) |
| TEST-LIBRARY-POLICY-01 | prepared whole-utterance cues bypass inference and preserve unchanged asset identity | [tests/library-policy.test.ts:9](../../tests/library-policy.test.ts#L9) |
| TEST-LIBRARY-POLICY-02 | quotes, negation, unknown qualifiers and extra requested facts cannot match cues | [tests/library-policy.test.ts:10](../../tests/library-policy.test.ts#L10) |
| TEST-LIBRARY-POLICY-03 | ambiguous prepared cue collisions escape rather than picking an arbitrary asset | [tests/library-policy.test.ts:11](../../tests/library-policy.test.ts#L11) |
| TEST-LIBRARY-POLICY-04 | content-changing refresh invalidates removed cues and resets current composition | [tests/library-policy.test.ts:12](../../tests/library-policy.test.ts#L12) |
| TEST-LIBRARY-POLICY-05 | refresh prevents late grounded decisions from committing old evidence | [tests/library-policy.test.ts:13](../../tests/library-policy.test.ts#L13) |
| TEST-LIBRARY-POLICY-06 | unknown grounding references and cancelled decisions cannot change the canvas | [tests/library-policy.test.ts:14](../../tests/library-policy.test.ts#L14) |
| TEST-LIBRARY-POLICY-07 | a newer exact cue supersedes a slow grounded decision | [tests/library-policy.test.ts:15](../../tests/library-policy.test.ts#L15) |
| TEST-LIBRARY-POLICY-08 | injected retrieval owns ranking while final reference validation remains mandatory | [tests/library-policy.test.ts:16](../../tests/library-policy.test.ts#L16) |
| TEST-LIBRARY-POLICY-09 | committed canvas synchronization overrides a previous uncommitted selection | [tests/library-policy.test.ts:23](../../tests/library-policy.test.ts#L23) |
| TEST-LIBRARY-SEARCH-01 | scope cues abstain on ambiguity, negation and corrections | [tests/library-search.test.ts:5](../../tests/library-search.test.ts#L5) |
| TEST-LIBRARY-SEARCH-02 | library index preserves semantic-only candidates and stable ties | [tests/library-search.test.ts:6](../../tests/library-search.test.ts#L6) |
| TEST-LIVE-SESSION-01 | presentation owner disposes resources once and invalidates readiness | [tests/live-session.test.ts:10](../../tests/live-session.test.ts#L10) |
| TEST-LIVE-SESSION-02 | presentation expiry is cancelled on reconnect and disposal | [tests/live-session.test.ts:15](../../tests/live-session.test.ts#L15) |
| TEST-LIVE-SESSION-03 | presentation expiry runs once and failed startup returns to loaded | [tests/live-session.test.ts:21](../../tests/live-session.test.ts#L21) |
| TEST-LOCAL-SELECTION-01 | local selector proposes only complete eligible evidence and never broadens missing scope | [tests/local-selection.test.ts:11](../../tests/local-selection.test.ts#L11) |
| TEST-LOCAL-SELECTION-02 | classifier preference cannot see ineligible components or return unbound IDs | [tests/local-selection.test.ts:17](../../tests/local-selection.test.ts#L17) |
| TEST-LOCAL-SELECTION-03 | local selection overrides a provider and preserves synthesis and missing-evidence guards without provider calls | [tests/local-selection.test.ts:23](../../tests/local-selection.test.ts#L23) |
| TEST-LOCAL-SELECTION-04 | presentation factory defaults local even with a provider environment default; hosted comparisons require an explicit profile | [tests/local-selection.test.ts:29](../../tests/local-selection.test.ts#L29) |
| TEST-LOCAL-SELECTION-05 | preference deadline falls back locally; parent cancellation never commits a fallback | [tests/local-selection.test.ts:35](../../tests/local-selection.test.ts#L35) |
| TEST-LOCAL-SELECTION-06 | preference has one preparation lifecycle and closes its resources | [tests/local-selection.test.ts:41](../../tests/local-selection.test.ts#L41) |
| TEST-LOCAL-SELECTION-07 | classifier selects an eligible alternative rather than simply returning the first rank | [tests/local-selection.test.ts:45](../../tests/local-selection.test.ts#L45) |
| TEST-LOCAL-SELECTION-08 | product factory defaults to validated synthesis and excludes Python-only classifiers | [tests/local-selection.test.ts:51](../../tests/local-selection.test.ts#L51) |
| TEST-MATERIALS-01 | TypeScript material extraction handles text, DOCX and images; rejects unsupported files and origins | [tests/materials.test.ts:12](../../tests/materials.test.ts#L12) |
| TEST-MODEL-SETTINGS-01 | model settings can be tested and saved without returning the API key | [tests/model-settings.test.ts:10](../../tests/model-settings.test.ts#L10) |
| TEST-PREDICTIVE-COMPONENTS-01 | hybrid component facets restrict both lexical and vector scoring to prepared families | [tests/predictive-components.test.ts:9](../../tests/predictive-components.test.ts#L9) |
| TEST-PREDICTIVE-COMPONENTS-02 | hybrid search rejects cross-project, changed source and embedding-space cache reuse | [tests/predictive-components.test.ts:17](../../tests/predictive-components.test.ts#L17) |
| TEST-PREDICTIVE-COMPONENTS-03 | forecast context excludes future speech and private notes and invalidates on epoch, revision and expiry | [tests/predictive-components.test.ts:24](../../tests/predictive-components.test.ts#L24) |
| TEST-PREDICTIVE-COMPONENTS-04 | malformed family distributions fail closed and retrieval never creates unsupported component references | [tests/predictive-components.test.ts:34](../../tests/predictive-components.test.ts#L34) |
| TEST-PREFERENCE-QUALITY-01 | preference fixture has a single declared target among five fully eligible alternatives | [tests/preference-quality.test.ts:5](../../tests/preference-quality.test.ts#L5) |
| TEST-PREPARATION-HARNESS-01 | preparation skill traverses material, chart, draft and explicit review through the SDK | [tests/preparation-harness.test.ts:12](../../tests/preparation-harness.test.ts#L12) |
| TEST-PREPARATION-HARNESS-02 | preparation skill rejects missing references and cancellation without partial draft mutation | [tests/preparation-harness.test.ts:30](../../tests/preparation-harness.test.ts#L30) |
| TEST-PREPARATION-HARNESS-03 | preparation skill reconstructs host evidence instead of trusting supplied approval | [tests/preparation-harness.test.ts:36](../../tests/preparation-harness.test.ts#L36) |
| TEST-PRESENTATION-OPTIMIZATION-01 | exact vector cache separates modes, deduplicates batches, isolates returned values and evicts | [tests/presentation-optimization.test.ts:14](../../tests/presentation-optimization.test.ts#L14) |
| TEST-PRESENTATION-OPTIMIZATION-02 | cancelled and malformed vectors cannot poison cache; instances do not share private inputs | [tests/presentation-optimization.test.ts:21](../../tests/presentation-optimization.test.ts#L21) |
| TEST-PRESENTATION-OPTIMIZATION-03 | compiled snapshots reuse only host-owned immutable input and detect unversioned evidence changes | [tests/presentation-optimization.test.ts:28](../../tests/presentation-optimization.test.ts#L28) |
| TEST-PRESENTATION-OPTIMIZATION-04 | prepared presenter builds before speech and interprets each turn once without changing supported or missing outcomes | [tests/presentation-optimization.test.ts:34](../../tests/presentation-optimization.test.ts#L34) |
| TEST-PRESENTATION-OPTIMIZATION-05 | controller waits for preparation and stop prevents queued speech from committing | [tests/presentation-optimization.test.ts:42](../../tests/presentation-optimization.test.ts#L42) |
| TEST-PRESENTATION-OPTIMIZATION-06 | a reviewed content edit only re-encodes changed documents and source withdrawal still fails | [tests/presentation-optimization.test.ts:49](../../tests/presentation-optimization.test.ts#L49) |
| TEST-PRESENTATION-OPTIMIZATION-07 | concurrent cache calls have independent cancellation and failed work is not retained | [tests/presentation-optimization.test.ts:56](../../tests/presentation-optimization.test.ts#L56) |
| TEST-PRESENTER-SAFETY-01 | manual cues hold unsupported evidence and invalidate pending automatic decisions | [tests/presenter-safety.test.ts:7](../../tests/presenter-safety.test.ts#L7) |
| TEST-PRESENTER-SAFETY-02 | manual cues respect independent review policy | [tests/presenter-safety.test.ts:23](../../tests/presenter-safety.test.ts#L23) |
| TEST-PRESENTER-SAFETY-03 | assembled utterances and speech-routing traces stay out of audience events | [tests/presenter-safety.test.ts:32](../../tests/presenter-safety.test.ts#L32) |
| TEST-PRESENTER-SAFETY-04 | strict review blocks factual opening and leaves a fact-free standby | [tests/presenter-safety.test.ts:38](../../tests/presenter-safety.test.ts#L38) |
| TEST-PRESENTER-SAFETY-05 | final host authorization rejects unsupported and malformed experimental proposals | [tests/presenter-safety.test.ts:51](../../tests/presenter-safety.test.ts#L51) |
| TEST-PRESENTER-SAFETY-06 | final host authorization allows a supported experimental proposal | [tests/presenter-safety.test.ts:65](../../tests/presenter-safety.test.ts#L65) |
| TEST-PRESENTER-SAFETY-07 | unchanged manual views still reauthorize without duplicate canvas commits | [tests/presenter-safety.test.ts:70](../../tests/presenter-safety.test.ts#L70) |
| TEST-REPLAY-01 | paired replay includes refresh, fallback and grounding in total time and retains failed rows | [tests/replay.test.ts:5](../../tests/replay.test.ts#L5) |
| TEST-REPLAY-02 | initialization failure cannot silently disappear from replay denominators | [tests/replay.test.ts:13](../../tests/replay.test.ts#L13) |
| TEST-REPLAY-03 | replay attributes model fallbacks to their turn and protects frozen expectations | [tests/replay.test.ts:17](../../tests/replay.test.ts#L17) |
| TEST-REPLAY-04 | profile construction errors count as initialization and case failures | [tests/replay.test.ts:21](../../tests/replay.test.ts#L21) |
| TEST-REPLAY-05 | replay preserves actual alternate selections and freezes acceptable reference sets | [tests/replay.test.ts:26](../../tests/replay.test.ts#L26) |
| TEST-REQUEST-FRAME-01 | request frames preserve speech and record inferred scope without inventing time | [tests/request-frame.test.ts:6](../../tests/request-frame.test.ts#L6) |
| TEST-REQUEST-FRAME-02 | request frames preserve explicit scope, unknown obligations and quoted speech | [tests/request-frame.test.ts:13](../../tests/request-frame.test.ts#L13) |
| TEST-SEMANTIC-RETRIEVAL-01 | semantic index ranks normalized vectors and scopes exact query cache to prepared project content | [tests/semantic-retrieval.test.ts:8](../../tests/semantic-retrieval.test.ts#L8) |
| TEST-SEMANTIC-RETRIEVAL-02 | semantic index rejects malformed vectors and cancelled query never enters cache | [tests/semantic-retrieval.test.ts:18](../../tests/semantic-retrieval.test.ts#L18) |
| TEST-SEMANTIC-RETRIEVAL-03 | bounded selection exposes only prepared choices and separates hold from missing context | [tests/semantic-retrieval.test.ts:25](../../tests/semantic-retrieval.test.ts#L25) |
| TEST-SEMANTIC-RETRIEVAL-04 | choice menu cannot invent references and fusion ranks deterministically without treating scores as confidence | [tests/semantic-retrieval.test.ts:35](../../tests/semantic-retrieval.test.ts#L35) |
| TEST-SEMANTIC-RETRIEVAL-05 | a story edit during embedding rejects the result without caching it | [tests/semantic-retrieval.test.ts:42](../../tests/semantic-retrieval.test.ts#L42) |
| TEST-SEMANTIC-RETRIEVAL-06 | semantic query cache evicts old entries instead of growing without bound | [tests/semantic-retrieval.test.ts:47](../../tests/semantic-retrieval.test.ts#L47) |
| TEST-SERVER-01 | local transport isolates sessions, rejects bad messages and foreign origins | [tests/server.test.ts:6](../../tests/server.test.ts#L6) |
| TEST-SESSION-01 | new intent prevents a delayed old intent overwriting the canvas | [tests/session.test.ts:5](../../tests/session.test.ts#L5) |
| TEST-SESSION-02 | pause invalidates pending work and resume does not replay a backlog | [tests/session.test.ts:14](../../tests/session.test.ts#L14) |
| TEST-SESSION-03 | cancel prevents a pending commit | [tests/session.test.ts:26](../../tests/session.test.ts#L26) |
| TEST-SQLITE-WORKSPACE-01 | sqlite workspace store initializes, writes and reads workspace atomically | [tests/sqlite-workspace.test.ts:39](../../tests/sqlite-workspace.test.ts#L39) |
| TEST-SQLITE-WORKSPACE-02 | exporting and importing an omnipresent bundle preserves story integrity | [tests/sqlite-workspace.test.ts:77](../../tests/sqlite-workspace.test.ts#L77) |
| TEST-SQLITE-WORKSPACE-03 | workspace HTTP handler serves GET, PUT, export and import endpoints | [tests/sqlite-workspace.test.ts:116](../../tests/sqlite-workspace.test.ts#L116) |
| TEST-SQLITE-WORKSPACE-04 | story bundle transfers media to a separate material store and rejects tampering | [tests/sqlite-workspace.test.ts:227](../../tests/sqlite-workspace.test.ts#L227) |
| TEST-SYNTHESIS-01 | synthesis composes four supported references across beats with distinct stable slots | [tests/synthesis.test.ts:11](../../tests/synthesis.test.ts#L11) |
| TEST-SYNTHESIS-02 | synthesis excludes incompatible, withdrawn and undeclared companions and respects explicit form | [tests/synthesis.test.ts:16](../../tests/synthesis.test.ts#L16) |
| TEST-SYNTHESIS-03 | cross-beat declarations reject invalid references and deduplicate equivalent references | [tests/synthesis.test.ts:26](../../tests/synthesis.test.ts#L26) |
| TEST-SYNTHESIS-04 | rendered duplicates cannot sneak through different beat references | [tests/synthesis.test.ts:30](../../tests/synthesis.test.ts#L30) |
| TEST-SYNTHESIS-05 | synthesis holds invalid primary evidence and enforces cancellation and layout limits | [tests/synthesis.test.ts:35](../../tests/synthesis.test.ts#L35) |
| TEST-SYNTHESIS-06 | live presenter synthesizes the exact cue without a model call | [tests/synthesis.test.ts:40](../../tests/synthesis.test.ts#L40) |
| TEST-SYNTHESIS-07 | surviving components retain slots when another component disappears or the primary changes | [tests/synthesis.test.ts:45](../../tests/synthesis.test.ts#L45) |
| TEST-SYNTHESIS-08 | oversized companions and unsupported extra claims cannot fill the canvas | [tests/synthesis.test.ts:52](../../tests/synthesis.test.ts#L52) |
| TEST-SYNTHESIS-09 | inferred form does not reject a natural spoken statement in synthesis mode | [tests/synthesis.test.ts:57](../../tests/synthesis.test.ts#L57) |
| TEST-SYSTEM-ONE-01 | decision request shares topic descriptions without private notes | [tests/system-one.test.ts:8](../../tests/system-one.test.ts#L8) |
| TEST-SYSTEM-ONE-02 | typed decisions produce grounded multi-topic composition | [tests/system-one.test.ts:9](../../tests/system-one.test.ts#L9) |
| TEST-SYSTEM-ONE-03 | hold never constructs a composition and invalid choices/probabilities fail closed | [tests/system-one.test.ts:10](../../tests/system-one.test.ts#L10) |
| TEST-SYSTEM-ONE-04 | Cloudflare variants use the existing authenticated decision endpoint without changing typed requests | [tests/system-one.test.ts:12](../../tests/system-one.test.ts#L12) |
| TEST-SYSTEM-ONE-05 | unsupported decision providers fail before any transport call | [tests/system-one.test.ts:27](../../tests/system-one.test.ts#L27) |
| TEST-TRANSCRIPT-INTEGRATION-01 | assembled split speech reaches the unchanged evidence host and unknown extra claims still abstain | [tests/transcript-integration.test.ts:14](../../tests/transcript-integration.test.ts#L14) |
| TEST-TRANSCRIPT-INTEGRATION-02 | manual cues and pause cancel assembled windows before they can enter the host | [tests/transcript-integration.test.ts:29](../../tests/transcript-integration.test.ts#L29) |
| TEST-TRANSCRIPT-INTEGRATION-03 | full assembled obligations survive routing into negation and missing-evidence guards | [tests/transcript-integration.test.ts:36](../../tests/transcript-integration.test.ts#L36) |
| TEST-TRANSCRIPTS-01 | partial revisions replace a segment and never enter decision processing | [tests/transcripts.test.ts:7](../../tests/transcripts.test.ts#L7) |
| TEST-TRANSCRIPTS-02 | split finals wait for an active continuation and retain the exact transcript | [tests/transcripts.test.ts:15](../../tests/transcripts.test.ts#L15) |
| TEST-TRANSCRIPTS-03 | default routing preserves current-view remarks, extra facts, negation and corrections | [tests/transcripts.test.ts:23](../../tests/transcripts.test.ts#L23) |
| TEST-TRANSCRIPTS-04 | joined corrections and missing obligations are not stripped to a supported alias | [tests/transcripts.test.ts:29](../../tests/transcripts.test.ts#L29) |
| TEST-TRANSCRIPTS-05 | lifecycle resets and retired streams cannot replay stale text | [tests/transcripts.test.ts:36](../../tests/transcripts.test.ts#L36) |
| TEST-TRANSCRIPTS-06 | overflow and amended finals hold without truncating into an apparently valid request | [tests/transcripts.test.ts:42](../../tests/transcripts.test.ts#L42) |
| TEST-TRANSCRIPTS-07 | overlapping ASR intervals merge while a genuine silence gap separates complete requests | [tests/transcripts.test.ts:49](../../tests/transcripts.test.ts#L49) |
| TEST-TRANSCRIPTS-08 | bounded interval assembly conserves every finalized word across varied overlaps and gaps | [tests/transcripts.test.ts:58](../../tests/transcripts.test.ts#L58) |
| TEST-TRANSCRIPTS-09 | scheduling thresholds are parameters and empty finals cannot trigger detection | [tests/transcripts.test.ts:71](../../tests/transcripts.test.ts#L71) |
| TEST-VISUALS-01 | diagram tool prepares a reusable visual; malformed edges are rejected | [tests/visuals.test.ts:21](../../tests/visuals.test.ts#L21) |
| TEST-VISUALS-02 | chart tool requires known source labels and numbers | [tests/visuals.test.ts:28](../../tests/visuals.test.ts#L28) |
| TEST-VISUALS-03 | flow references must point to existing prepared visuals | [tests/visuals.test.ts:35](../../tests/visuals.test.ts#L35) |
| TEST-WORKSPACE-01 | legacy stories are not imported into the evidence baseline | [tests/workspace.test.ts:13](../../tests/workspace.test.ts#L13) |
| TEST-WORKSPACE-02 | incompatible saved stories are removed rather than migrated | [tests/workspace.test.ts:17](../../tests/workspace.test.ts#L17) |
| TEST-WORKSPACE-03 | project chats, materials and composer drafts remain isolated across serialization | [tests/workspace.test.ts:22](../../tests/workspace.test.ts#L22) |
| TEST-WORKSPACE-04 | interrupted preparation requests survive workspace validation and reload | [tests/workspace.test.ts:32](../../tests/workspace.test.ts#L32) |
| TEST-WORKSPACE-05 | repeated identical saves update one immutable project-linked snapshot | [tests/workspace.test.ts:39](../../tests/workspace.test.ts#L39) |
| TEST-WORKSPACE-06 | unreadable project data is preserved instead of replaced by an empty workspace | [tests/workspace.test.ts:48](../../tests/workspace.test.ts#L48) |
| TEST-WORKSPACE-07 | presentation context requests return only to the originating project | [tests/workspace.test.ts:53](../../tests/workspace.test.ts#L53) |
| TEST-WORKSPACE-08 | saving updates a stable story id and retains changed snapshots | [tests/workspace.test.ts:63](../../tests/workspace.test.ts#L63) |
| TEST-WORKSPACE-09 | story removal preserves chat and can be restored after reload | [tests/workspace.test.ts:73](../../tests/workspace.test.ts#L73) |
| TEST-WORKSPACE-10 | removing active and last sessions preserves stories and valid active project | [tests/workspace.test.ts:79](../../tests/workspace.test.ts#L79) |
| TEST-WORKSPACE-11 | restoring a removed story preserves its replacement in history | [tests/workspace.test.ts:87](../../tests/workspace.test.ts#L87) |
