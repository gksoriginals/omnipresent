# Validation and technology decision record

Current evidence index: see the generated test register and catalog for the latest audited source and count. This is the entry point for test evidence and component selection. Earlier documents remain chronological records; their results do not automatically describe the current implementation.

- [Test and experiment register](test-register.md): every identified experiment, planned comparison and current named software test.
- [Experiment reports](experiment-reports.md): methods, outcomes, failures and interpretation.
- [Component decisions](../decisions/README.md): rationale, alternatives, evidence and revisit conditions.
- [Machine-readable catalog](catalog.json): artifact paths, SHA-256 hashes, aliases and test-to-run mapping.
- [Latest software audit and individual cases](test-register.md): generated from the most recent run. Historical 79-test and earlier snapshots retain their original scope; they are not current counts.
- [Prediction-first hybrid component search](../research/prediction_first_results.md): current routing, future-only forecasts, exact-reference prefetch and failure analysis.
- [Cloudflare Clef comparison](../research/cloudflare_clef_results.md): three variants and fresh Jev reference on identical bounded requests.
- [Semantic retrieval and bounded selection](../research/semantic_retrieval_results.md): measured EmbeddingGemma 2, BM25/RRF, Jev/Laya and abstention trade-offs.
- [Controller comparison](../research/controller_comparison.md): 21 replay scenarios, separate retrieval metrics, implementation choices and remaining gaps.

- [Practical composition policy research and next experiment](../research/common_sense_composition.md): repository gap assessment and proposed ablations; no new executed test or component adoption.

- [Larger-library decision-path experiment](../research/large_library_results.md): 432 constructed assets, repeated identical-grounding comparison, preserved authored quality and failed repeatable latency gate.

- [Cue bundles and minimum-change experiment](../research/cue_policy_results.md): changed-content refresh, exact-cue inference savings and retained references; missing-evidence failures block promotion.
- [Real-library acceptance gate](../research/real_library_acceptance.md): source-backed corpus, independent review and natural speech remain planned.

- [Evidence contracts and intent-gate results](../research/evidence_gate_results.md): known regressions fixed on authored cases, with repeatable decision-path improvements; independent review remains pending.
- [Selected public-source review packet](../research/source_backed_review.md): EIA/USGS starter selected by the user, without claiming independent acceptance.

- [Current default architecture and diagrams](../architecture/baseline.md): modular model adapters, evidence-first live runtime, defaults and retired paths.
- [Baseline rollout and UI verification](../research/baseline_rollout.md): actual websocket integration, local-model preparation, save/reload and responsive browser checks.

## Evidence rules

`executed` means an experiment ran, not that its component won or meets production requirements. Negative results, provider blockers, design limitations and partial evidence are retained explicitly. `research-only` and `planned` are never measured results. Provisional adoption permits bounded implementation without claiming a comparative winner.

Separate software unit/integration tests, mocked-provider tests, actual model calls, browser observations, actual audio replay, physical microphone testing and production validation. Passing one level does not establish the others. Screenshots establish visible state only; they do not prove decision correctness or timing. Archived screenshots use synthetic demonstration content.

Historical source, prompt and dataset hashes were not consistently retained. The catalog hashes available artifacts now; it cannot reconstruct missing historic provenance. Some browser assertions and console diagnostics exist only as session observations. Reproduction commands identify the current implementation path, not a guarantee of identical historic inputs/results. Do not overwrite historical JSON when rerunning probes: archive new outputs under a unique run ID.

Two pairs of JSON files are byte-identical aliases, not independent repetitions. Repeated requests on the same 12 development cases are not independent examples. System One question revisions reused those cases: reported scores are development screening results, not holdout accuracy. Model cost fields cover recorded requests only, not total account spend.

## Recording future work

Before running a selection experiment, record its ID, decision/question, hypothesis, alternatives, frozen input manifest and labels, acceptance criteria, software/model versions and environment. Preserve the exact command, seed/settings, prompt/schema/controller version, raw responses (redacted), errors, timings and metric definitions. Distinguish cold start, inference, transport and end-to-end latency. Report total attempts as well as valid-output denominators, failures and costs. Record analysis, limitations, decision owner/date/status and conditions that would reverse the decision.

Use development cases for iteration and an untouched holdout for selection. Compare controllers using identical timestamped inputs and prepared candidates, with policy correctness, inappropriate changes/holds, candidate recall, invalid actions and latency distributions. The first controller screen supports a provisional FSM baseline; no production winner or empirically validated UX threshold is established. Run audio/browser trials when changing speech, scheduling, rendering or end-to-end behaviour; offline decision changes can first use deterministic replay benchmarks.

Run `node scripts/audit-validation.mjs <unique-run-id>` to retain current software checks and source hashes. Run `python3 scripts/build-validation-catalog.py` to refresh the retrospective index after intentional artifact changes, then `node scripts/verify-validation.mjs` to verify it. Review hash changes before accepting a regenerated catalog. Never store credentials or private uploaded material in evidence.

## Documentation standard

The structure follows practical [architecture decision record guidance](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record) and the [NIST AI RMF MEASURE guidance](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) on documented methods, metrics, evaluation and uncertainty. This is an engineering evidence system, not a claim of ISO compliance, independent certification or production readiness.
