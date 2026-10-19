# Evidence-contract and intent-gate results

EXP-037 · 17 October 2026 · Development gates passed; live acceptance remains pending.

## Outcome

Claim-level evidence validation fixes the known development failures without sacrificing the labeled positive selections. Continue with the user's selected EIA/USGS source-backed starter for independent review and natural-speech acquisition. Do not broaden model comparisons or migrate the live default solely on these results.

[Protocol](evidence_gate_protocol.md), [raw report](../validation/runs/RUN-20261017-evidence-gate-v1/evidence-gate.json), [input contracts/cases](../validation/runs/RUN-20261017-evidence-gate-v1/inputs.json), [start/source manifest](../validation/runs/RUN-20261017-evidence-gate-v1/start-manifest.json), [model requests/responses](../validation/runs/RUN-20261017-evidence-gate-v1/model-requests.jsonl), and [step traces](../validation/runs/RUN-20261017-evidence-gate-v1/steps.jsonl) preserve the frozen experiment. Recorded cost for 93 hosted Clef-omni requests: USD 0.03611505.

## Quality and measured decision latency

| Pass | Prior cue policy median / p95 | Evidence gate median / p95 | Correct: prior / gated |
| --- | --- | --- | --- |
| 1 | 445 / 1,126 ms | 3.3 / 486 ms | 29/37 / 37/37 |
| 2 | 437 / 1,094 ms | 2.9 / 473 ms | 29/37 / 37/37 |
| 3 | 430 / 1,047 ms | 2.8 / 505 ms | 30/37 / 37/37 |

The gated arm preserved **21/21 positive selections**, correctly handled **16/16 negative cases**, and produced **zero unsupported shows** per pass. Every paired case that the prior arm got right remained correct. This is not an always-hold policy: the positives still selected their expected assets.

Grounding calls fell from **27 to 4 per pass (85.2%)**. Seventeen cases used prepared exact cues, sixteen returned a guarded hold/context outcome, and four required retrieval plus semantic grounding. Eight broader grounding fallback attempts per pass in the prior arm became zero in the gated arm on this set. Median and p95 improved in all three passes. Each arm included five changed-content refreshes and five changed-document embeddings per pass. Initial full indexing is reported separately in the raw report.

The measured interval includes applicable refresh, query encoding, hybrid ranking, cue/intent checks, every grounding/fallback call, final evidence/reference validation and the host decision. It excludes STT, real media loading, browser rendering and visible paint. Small-sample p95 estimates and repeated authored cases do not establish general live latency.

## What changed

[Evidence contracts](../../server/controllers/evidence-contract.ts) declare approved claim identifiers/aliases, entity, timeframe, unit, provenance, audit status, source snapshot identities and independent-review status. Structural validation rejects mismatched entities/timeframes, broken claim references, duplicate identifiers and changed summary hashes. Hashes establish identity of retained summaries; they do not authenticate a remote source or prove semantic entailment.

A bounded intent interpreter separates supported current requests from quoted, hypothetical, negated or incidental mentions. It recognizes an explicit corrective active clause. Unrecognized residual obligations request missing evidence rather than accepting a partial topic match. Conflicting or missing scope holds for private clarification. The guard requires every requested claim to be covered by the same selected asset in this single-asset prototype; it does not synthesize a multi-asset answer implicitly.

The [library policy](../../server/controllers/library-policy.ts) applies the gate before cue/model work and again before committing a selected reference. A valid catalog ID cannot bypass claim coverage. Context retains the current canvas. Optional feedback is explicitly tagged presenter-only; the live app is not wired to this experimental policy yet. Prepared snapshots now freeze nested evidence metadata as well as top-level asset fields.

Default evidence gating requires accepted independent review. This development run explicitly allows pending-review material so the policy can be tested without falsely marking it reviewed. The user selected the starter corpus; that selection does not change review status.

## Failure categories addressed in development

The prior arm still substituted partially related content for extra requested facts and unsupported audit status, treated quoted/hypothetical mentions as show intent, and chose an arbitrary year where the label policy required clarification. It also sometimes selected a single card for a conjunction requiring two unsupported-together claims. The guarded arm refused these changes while preserving supported positives.

The known four earlier regressions were reused as development cases. They are not independent confirmation. The aliases, interpreter and label rules were authored together; a strict lexical grammar can over-abstain on real explanatory speech. Purely holding mixed quoted/current speech is intentionally conservative and may miss valid intent. “Actual,” source-backed, illustrative and audited remain distinct concepts; actual labels in the constructed assets are simulated fixture scope.

## Source-backed material and remaining gate

The library contains 432 constructed distractor assets plus six source-backed concept cards from checked [EIA](https://www.eia.gov/energyexplained/solar/photovoltaics-and-electricity.php) and [USGS](https://www.usgs.gov/water-science-school/water-cycle) pages. Their URLs, curated summary snapshots and hashes are retained. Fourteen source-backed cases include authored spoken-style lines, not recordings or natural STT. This small starter is not a large library of real presentation assets.

The [review packet](source_backed_review.md) records the user's corpus choice and pending independent review. Obtain reviewed claims/allowed outcomes and unrehearsed speech before claiming holdout acceptance or broadening the parser. Add real media and source-backed quantitative series before evaluating multi-component composition or audience-visible latency. Preserve [the full acceptance gate](real_library_acceptance.md).

## Software verification and version boundary

Focused tests cover complete obligations, audit/units mismatch, source identity and hash failures, unknown metadata, extra facts, quotes/hypotheticals/negation, active corrections, wrong cue bindings, presenter-only feedback, retained content and review requirements. Existing tests continue to exercise refresh, cancellation and latest-result races.

After the archived model run, additional single-quote handling and unit tests were added without retuning benchmark labels or rerunning the hosted experiment. The frozen run's source snapshot remains unchanged; the current software audit covers the final quote-hardening version. Software verification does not repeat hosted requests, independently review claims or validate the live browser.
