# Offline presentation controller comparison

> Follow-up: [EXP-024/025](semantic_retrieval_results.md) now measure semantic retrieval and bounded model choice. The controller results below remain the earlier offline baseline.

EXP-022 · 17 October 2026 · Development screen, not production selection or independent holdout.

## Question and decision

Can priority rules, a finite state machine (FSM), a stateful behaviour tree (BT), or a hybrid control prepared canvas changes without calling a general LLM for every speech window?

All three temporal implementations meet this synthetic policy contract. Use the **small FSM plus explicit priority guards as the next experimental baseline**, because the current contract has only stable/confirming states and does not yet justify a tree abstraction. Retain the BT and hybrid alternatives for future branching needs. This is a simplicity judgment, not a measured framework-quality winner. No new framework dependency or app-default migration was made.

The larger finding is that temporal control is cheap but lexical candidate retrieval is inadequate. A controller cannot recover a relevant asset that retrieval excluded. Improve and measure retrieval before attributing remaining errors to a System One model.

## Implementation and shared contract

- [Policy implementations](../../server/controllers/presentation-policy.ts): common grounded candidate validation, lifecycle/epoch/revision/sequence guards, dwell limits, and feedback deduplication. Each instance owns isolated state; no network or application side effects.
- [Prepared candidate index](../../server/controllers/candidates.ts): audience-visible text only, up to three grounded proposals, comparison composition, revision/content fingerprint checks. This is an intentionally simple lexical baseline, not EmbeddingGemma or semantic retrieval.
- [Frozen synthetic fixtures](../../tests/fixtures/controller-replays.json): 21 scenarios, 48 timestamped events per strategy, nine separate retrieval cases, two subject domains. Labels were written before the first benchmark and not changed after seeing its results. They were authored alongside the implementation, so they are regression data, not independent validation.
- [Reproduction harness](../../scripts/controller-benchmark.ts): immutable result directories, source/input hashes, environment, complete per-step expected/actual actions and traces, raw timing samples, total denominators and software gates.

The priority-rules baseline applies the same validation, confidence/margin and dwell guards, but switches immediately on eligible candidates. FSM adds stable/confirming states. BT uses a reactive priority fallback, sequence, persistent blackboard and a RUNNING confirmation leaf. Hybrid uses the BT priority structure and explicit FSM stability transition. These are small synchronous in-repo implementations, not benchmarks of XState or BehaviorTree.CPP runtimes.

Every policy holds for stale revisions/epochs, repeated sequences, out-of-order times, invalid/duplicate/unbounded candidates, paused/stopped sessions and insufficient evidence. Missing evidence requests context while retaining the audience canvas. Stop is terminal for an instance. Lifecycle commands are typed host events, never parsed from speech. A changed story starts a fresh instance.

Prototype thresholds: score at least 0.60, margin at least 0.15; score at least 0.90 switches immediately; otherwise temporal variants require the same proposal on two consecutive eligible observations within 1,200 ms. After a commit, wait at least 800 ms before another. These are explicit software policy assumptions, **not calibrated probabilities or user-validated UX thresholds**. Candidate scores in controller fixtures are injected, not inferred from the speech. Retrieval is evaluated separately to expose that distinction.

## Results

[Final raw report](../validation/runs/RUN-20261017-controller-comparison-v2/controller-benchmark.json). The [initial report](../validation/runs/RUN-20261017-controller-comparison-v1/controller-benchmark.json) is retained; both use the same labelled fixture set and must not be counted as independent evidence.

| Controller | Expected actions matched | False changes | Missed changes | Invalid commits |
|---|---:|---:|---:|---:|
| Priority rules | 39/48 | 6 | 3 | 0 |
| FSM | 48/48 | 0 | 0 | 0 |
| Stateful BT | 48/48 | 0 | 0 | 0 |
| Hybrid | 48/48 | 0 | 0 | 0 |

Rules react to one-window noise and oscillation; early changes can then cause a dwell guard to block a desired later change. The other implementations have the confirmation feature those labels require. **This does not establish that rules cannot represent memory**, or that FSM/BT notation itself improves semantic decisions. Shared validation and intentionally equivalent temporal contracts limit implementation independence.

On Apple M5/16 GB, Node 22.22.1, warmed median/p95 times for complete 48-event batches were rules 0.282/0.404 ms; FSM 0.160/0.294 ms; BT 0.165/0.185 ms; hybrid 0.146/0.188 ms. Each distribution has 100 repeated batches after ten warm-up batches. Batches include instance construction, cloning, validation and fixture conversion. Strategies ran sequentially, with no randomized execution order. Small differences and changing v1/v2 timings do not support a speed winner. These measurements exclude retrieval, model calls, STT, transport, browser rendering and the deliberate 800 ms dwell/confirmation delay. Computational overhead and user-visible response time are different quantities.

All temporal policies matched all labels, with zero deterministic replay disagreements. Seven new named software tests cover regression scenarios, malformed inputs/state isolation, retrieval boundaries, interruption of pending confirmation and 8,000 seeded stress events (2,000 per strategy; seed 1729). The stress checks establish invariants, not semantic accuracy or independent sample count.

### Candidate retrieval results

Exact retrieved topic set: **4/9 cases**. Micro recall: **7/8 required topic references = 87.5%**. Micro precision: **7/11 retrieved topic references = 63.6%**. These metrics evaluate the union of at most three proposed compositions; they do not establish correct ranking, usable selection confidence or final canvas quality. Nine cases are too few for a generalization claim.

The paraphrase “Keep the surplus until darkness falls” retrieves no battery content. Literal negated topic mentions and requests for unavailable installation-cost data produce false candidates. Broad words can also pull in unrelated electricity topics. The controller fixture supplies `missingEvidence` explicitly; the lexical retriever does not reliably infer it. Automatically connecting these prototypes to the audience canvas would therefore be premature.

## Reproduce and inspect

```sh
npm run benchmark:controllers -- RUN-your-unique-id
node scripts/audit-validation.mjs RUN-your-unique-software-audit-id
python3 scripts/build-validation-catalog.py
node scripts/verify-validation.mjs
```

The benchmark requires only existing Node dependencies. It calls no model, sends no audio, consumes no provider credit and preserves previous result directories. Review both the per-step trace and aggregate counts. The catalog points to this named experiment; new runs remain in their own directories until intentionally registered. The current software audit is EXP-023; the older 43-test documentation audit remains EXP-020.

## Next experiment and acceptance boundaries

1. Add representative prepared assets/query labels and explicit missing-content/negation cases; obtain an independently labelled holdout before claiming a retrieval/model winner. Keep current regression cases for development.
2. Compare lexical retrieval, semantic retrieval and combined reranking on candidate recall, precision, ranking, prepared revision isolation and cost. Freeze the corpus/index/model revision and measure index-build separately from query latency.
3. Give System One a bounded choice among candidate compositions plus hold/request-context. Evaluate candidate recall separately, and compare downstream selection on both oracle and retrieved candidates. Do not fall back to generating arbitrary assets in the live controller.
4. Only then integrate the selected policy into the actual asynchronous loop and test cancellation, stale in-flight responses and delayed speech windows. Offline prototypes do not prove these integration properties. An audio/browser smoke test follows changes to scheduling or visible behavior.

No holdout, calibrated confidence, model-assisted shortlist selection, asset-mode/reveal policy, mixed-language retrieval, contention/soak testing or production integration is established by EXP-022.

## Primary design references

State/guard/transition semantics were checked against [Stately transitions](https://stately.ai/docs/transitions). Sequence, fallback and tick semantics were checked against [BehaviorTree.CPP basics](https://www.behaviortree.dev/docs/learn-the-basics/BT_basics/) and [fallback controls](https://www.behaviortree.dev/docs/nodes-library/FallbackNode/). These informed the concepts; those libraries were not installed or performance-tested.
