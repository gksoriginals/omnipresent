# Direction: grounded prepared-library policy

17 October 2026 · Started as an isolated prototype; live defaults unchanged.

The next implementation direction combines explicit evidence eligibility, hybrid retrieval with a global escape path, and small host-owned composition plans. Lifecycle/timing belongs to the existing deterministic controller. A System One decision is an optional ambiguity resolver over grounded feasible plans. Predicting a family before every retrieval remains experimental.

## Started

[Library search](../../server/controllers/library-search.ts) separates stable asset identifiers from bounded story-beat positions. It provides normalized dense plus BM25/RRF ranking, deterministic ties, explicit scope eligibility and conservative scope-cue abstention. This is an experimental controller module, not wired into the live app. It has no new dependencies.

[The larger-library protocol](large_library_protocol.md) fixes the quality and repeated end-to-end text-decision timing gates before reading results. Both arms retain identical final grounding; fallback work is included. [The practical-policy assessment](common_sense_composition.md) defines cue bundles, compatibility and minimum-change behavior that remain to be tested.

[Cue/continuity experiment](cue_policy_results.md) now demonstrates narrow exact-cue inference savings, but shared fallback errors fail absolute evidence quality. Prioritize claim coverage and intent interpretation; do not expand model comparisons or migrate the live default. [Real-library acceptance](real_library_acceptance.md) remains pending.

[Evidence gate development follow-up](evidence_gate_results.md) now addresses the known missing-evidence failures with explicit contracts and bounded intent parsing. The user selected the EIA/USGS starter for the next round; independent review and natural-speech acquisition still gate live integration.

## Advance in this order

1. Establish a trustworthy library and evaluation set. Constructed scope collisions are a useful stress screen, but do not replace varied source-backed presentations and independently checked natural speech labels. Preserve provenance and distinguish actual, illustrative, unknown and stale evidence explicitly.
2. Measure whether scope eligibility changes errors or latency with identical grounding. If it does not show repeatable median and p95 improvements, retain it only where it improves correctness; do not market it as a speed optimization or promote reverse routing.
3. Test reducing unnecessary decision calls through narrowly defined cue bundles and continuity operations. Exact explicit references may resolve without model inference only when unique, eligible and contextually supported. Ambiguous, negated, quoted or corrected speech must escape. Semantic similarity alone cannot authorize answer-cache reuse.
4. Add compatible multi-component templates and minimum-change plans. Compare hold, emphasize, reveal, add/remove and replace against existing behavior; preserve positions and evidence. Browser readability and visible-paint validation follow offline policy evaluation.
5. Compare System One models only on unresolved grounded ambiguity after the candidate-policy gates pass. Include model refreshes, grounding and fallbacks; record failures and costs. A lower-performing model does not merit a retest solely because a new pipeline order exists.

A later live integration should support stable prepared asset IDs without silently changing the existing beat-index composition API. That migration requires its own compatibility design and validation after the isolated policy earns integration. No major framework or storage decision is needed for this experiment.
