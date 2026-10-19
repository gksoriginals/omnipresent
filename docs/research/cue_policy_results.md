# Cue bundles and minimum-change results

EXP-035 · 17 October 2026 · Development experiment; absolute missing-evidence gate failed.

## Decision

Continue the grounded prepared-library policy, but prioritize evidence completeness and intent interpretation in the fallback before live integration or more model comparisons. Exact approved cue bindings can eliminate unnecessary inference. That benefit is useful only when the fallback also rejects unsupported content. Keep the live default unchanged.

The tested fast path is deliberately narrow: exact whole-utterance prepared requests and an explicit keep control. It does not establish low-latency understanding of spontaneous explanatory speech. Multi-component composition, reveal and semantic continuity remain future experiments. The minimum-change behavior implemented here is retaining the identical asset reference.

## Results

[Protocol](cue_policy_protocol.md), [raw report](../validation/runs/RUN-20261017-cue-policy-v1/cue-policy.json), [frozen input/cue manifest](../validation/runs/RUN-20261017-cue-policy-v1/inputs.json), [raw model calls](../validation/runs/RUN-20261017-cue-policy-v1/model-requests.jsonl), and [decision/timing traces](../validation/runs/RUN-20261017-cue-policy-v1/steps.jsonl) preserve the complete experiment. Sources and the protocol were copied and hashed before execution.

| Pass | Full median / p95 | Cue policy median / p95 | Exact decisions: full / cue |
| --- | --- | --- | --- |
| 1 | 532 / 1,011 ms | 92 / 935 ms | 18/23 / 19/23 |
| 2 | 582 / 1,841 ms | 91 / 1,031 ms | 18/23 / 19/23 |
| 3 | 640 / 1,085 ms | 89 / 858 ms | 18/23 / 19/23 |

The policy reduced grounding calls from **27 to 15 per pass (44.4%)**. Eleven of 23 observations used exact prepared cue bindings; an explicit keep observation also avoided inference. Cue and keep outcomes were correct on every repeated observation. All 13 positive selections were correct in each arm/pass. The policy retained the current asset five times per pass versus four for the full-search arm; this is an offline identity operation, not a visual motion measurement.

Both median and p95 improved in all three passes. Timings include per-observation changed-content refresh, query embedding when needed, hybrid ranking, fallback calls, final semantic grounding on unmatched paths, deterministic cue binding on exact paths, reference checks and the host commit decision. Each arm performed three refreshes and re-embedded three changed documents per pass using separate caches. Initial indexing of all 432 documents took roughly 10.8–12.1 seconds per arm/pass, reported separately. Changes appended wording to one document at a time; source withdrawal and late-result rejection were tested separately in software tests.

All 138 arm observations completed validly. The 126 hosted requests cost USD 0.0218169 in recorded provider usage. Four broader grounding attempts per arm/pass remained. No audio, renderer, visible paint or concurrent resource contention was measured.

## Absolute quality failure

The cue policy correctly handled only **6/10 negative cases per pass**, compared with 5/10 for full search. Four cases produced unsupported or inappropriately selected content in both arms:

- Quoting a visual request during a microphone check was treated as a current show request.
- Requesting a chart including an unavailable payback period received the chart without the additional fact.
- Requesting audited evidence received an asset whose metadata did not establish audit status.
- A request without a year received one year's chart arbitrarily instead of holding for clarification under the frozen label policy.

The explicit keep control fixed the fifth baseline failure. These disagreements were preserved; labels and prompts were not adjusted during the run. The ambiguous-year label is an author-defined behavior rule, not independent evidence of user preference. A real acceptance set should explicitly annotate allowed alternatives and clarification policies.

The original run's `qualityPreserved` flag checks aggregate baseline non-regression, and its `repeatableLatency` flag checks repeated timing. Those two true flags do **not** mean acceptable missing-evidence quality. `productionAcceptance` remains false. Subsequent benchmark code now checks paired case preservation and a separate absolute negative/unsupported-show gate; this does not retroactively change the archived run or constitute a new model experiment. Under that stronger interpretation, this run fails development acceptance despite the timing improvement.

## Implementation and validation

[Library policy](../../server/controllers/library-policy.ts) owns immutable prepared snapshots, revision-scoped cue bindings, collision abstention, latest-decision cancellation, current-asset retention and final reference checks. Refresh invalidates current/cues before rebuilding; old asynchronous work cannot commit afterward. [Grounding](../../server/controllers/library-grounding.ts) shares the same five-option then twelve-option fallback between both arms. No new dependencies or live app wiring were introduced.

Focused tests cover cue bypass, repeated-reference retention, negated/quoted/extra-fact escape, ambiguous bindings, changed evidence, removed cues, unknown references, cancelled work, and refresh/new-decision races. Escaping the cue path is a routing guarantee, not proof the fallback understands the sentence; the model experiment exposed that distinction.

The [real-library acceptance plan](real_library_acceptance.md) defines the remaining source, reviewer, transcript, quality and latency requirements. These 23 authored cases, repeated three times, are not 69 independent examples or an untouched holdout. Timing estimates are small-sample development results. Do not extrapolate cue coverage or call savings to real talks.

## Next implementation boundary

Prepare claim-level evidence scopes and coverage metadata, including unknown provenance, then validate requested obligations against the selected plan. Separate current presenter intent from quoted or hypothetical mentions. Retain current content while requesting missing evidence privately. Test these changes on versioned development cases and then independently reviewed natural speech; do not tune the current examples and relabel them a holdout. Only after that quality gate passes should cue bundles broaden beyond exact commands or System One alternatives be compared again.
