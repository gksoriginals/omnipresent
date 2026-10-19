# Evidence-contract gate experiment

17 October 2026 · EXP-037 · Development replay; no live migration.

Compare the prior cue policy against the same policy with explicit claim-level evidence checks before selection and before commit. Both use the same hybrid index, exact-cue bindings and hosted Clef-omni grounding on unmatched requests. Positive source selections must remain useful: a policy that holds everything fails.

## Inputs and labels

Use 432 constructed scope-collision assets and six source-backed concept cards, with the previous 23 development utterances and 14 additional source-backed development utterances. Source cards are paraphrases of checked EIA and USGS pages, with source URLs, retained summary snapshots and SHA-256 hashes of those summaries. They are not measured institutional data or copies of complete remote pages. Concept cards have no temporal measure; their retrieval year is the snapshot year, not a claimed measurement period.

Labels and aliases are authored by the implementer. The prior failures are known development regressions, not untouched holdout examples. Spoken-style lines are authored text, not recordings or natural STT. Independent review remains pending. Experimental mode explicitly permits that pending state; the gate's default requires accepted independent review and would withhold these assets.

Constructed asset claims point to clearly marked fixture summaries and have simulated actual/illustrative scope. They do not establish real-world claims. Source-backed inputs must not be confused with a large real-presentation acceptance corpus.

## Gate semantics

Contracts declare entity, timeframe, units, provenance, audit status, source snapshots and covered claim identifiers/aliases. Unknown is explicit. Hashes establish snapshot identity, not correctness or source authority. Contract structure and source links are validated; the truth of claim coverage still requires review.

The bounded interpreter recognizes prepared aliases and explicit scopes. Quoted, hypothetical or negated mentions conservatively hold; an unambiguous “instead of X show Y” uses the active clause. Missing timeframe or conflicting scope asks for private clarification while holding. Unknown remaining request terms or missing claim coverage requests private evidence context. It must not infer audit status from an “actual” label, substitute entities, or satisfy only part of a conjunction. Ambiguous/mixed speech may be over-conservatively held; general language understanding is not claimed.

No supported asset means context without inference. Known candidates still pass the same final gate after cue or model selection. Context preserves the current canvas. Feedback is tagged presenter-only; no UI integration exists in this experiment.

## Measurement and acceptance

Run three sequential counterbalanced passes, preserving speech sequence. Each arm has its own content-addressed document cache. At indices divisible by eight, change one asset's evidence text and corresponding summary hash, rebuild the catalog/cues, reset current state and re-embed changed documents. Count refresh, query encoding, ranking, fallbacks, semantic grounding or deterministic bindings, final validation and decision commit in elapsed latency. Report initial full indexing separately. No query/semantic answer cache is shared.

Preserve positive and negative correctness separately, paired case regressions, unsupported shows, errors, model calls, fallback counts, guarded outcomes and retain operations. Require zero unsupported shows and all labeled negatives correct in the gated arm, no paired correctness regression, and lower median/p95 in every pass before development acceptance. A smaller author-labeled set cannot authorize production acceptance. Retain failures without changing labels mid-run. Budget: 220 hosted attempts / USD 0.10, stop on unknown cost.

Archive sources, protocol, inputs, exact requests/responses, errors, cost and per-observation timings. Reproduce with `node --import tsx scripts/evidence-gate-benchmark.ts <unique-run-id>`. This is a validated offline text decision endpoint, excluding STT, actual media loading, readable multi-component layouts, visible paint and real concurrency. Independently reviewed real presentations and natural speech remain a separate acceptance gate.
