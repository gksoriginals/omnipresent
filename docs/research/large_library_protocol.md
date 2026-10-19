# Larger-library selection validation

17 October 2026 · EXP-033 · Constructed stress test; not an independent real-library acceptance test.

## Decision and gates

Compare full hybrid retrieval against conservative explicit-scope filtering followed by hybrid retrieval. Both use the same hosted Clef-omni final grounding prompt and choices. Advance only if selection and missing-evidence quality are preserved, unsupported shows do not increase, and median/p95 improve in every repeated pass including refresh, query encoding, fallbacks and grounding. This screen cannot authorize a live-default migration.

The direction being started is an eligibility-aware prepared library with stable asset identifiers, conservative cue fast paths and global escape. The existing live composition schema is bounded by story-beat references; this experiment deliberately isolates library search without changing that public contract. Cue bundles and minimum-change compositions remain subsequent ablations, not assumed improvements.

## Frozen design

- 432 authored assets: eight presentation topics, three institutions, three years, two provenance scopes and three component families. Topics overlap across entities, years and actual/illustrative labels, creating hard distractors. Numerical data and institutions are constructed. “Actual” denotes a simulated evidence scope, never real institutional evidence.
- Sixteen authored cases: eleven positive exact-asset requests and five negative/missing-content requests, including paraphrase, correction, negation, missing year/entity and unavailable sensitive facts. Cases are development material written alongside the fixture; no independent holdout is claimed.
- Three sequential, counterbalanced passes. Arm order alternates and case order rotates. Repeats estimate timing variation, not additional independent quality observations. Requests are not run concurrently.
- EmbeddingGemma 2 local CPU text embeddings, BM25 plus cosine reciprocal-rank fusion (k=60), hosted Clef-omni grounding. Scope rules use only explicit observed entity/year/provenance language; competing cues, negation and corrections escape to full search. No expected labels enter runtime inputs.
- Each arm encodes its own query; no shared query vector or semantic answer cache. Document vectors are content-addressed and shared equally between arms after initial indexing.
- Catalog/BM25 rebuild refreshes at observation indices 0 and 8 in each arm/pass are inside elapsed timing. These exercise warm catalog reconstruction, not content-changing refresh, model restart or remote asset reload. Initial full document encoding is reported separately.
- First grounding uses five options. Empty scoped results fall back to full search; a context answer in either arm triggers a global top-twelve search and another grounding call. Final choices are validated against the catalog and, when present, explicit scope. All these costs and failed attempts remain in timings.
- Maximum 150 hosted calls / USD 0.10 recorded provider cost; timeout 20 seconds per decision. No weaker-model comparison or local Clef download.

## Evidence and limitations

Reproduce with `node --import tsx scripts/large-library-benchmark.ts <unique-run-id>`. The immutable run directory retains source snapshots and hashes, inputs, start manifest, raw model requests/usage, per-arm timing/error rows and a summary. Do not overwrite it.

Record total/valid/correct, positive and negative correctness, unsupported shows, fallbacks, grounding calls and per-pass median/p95 of the complete measured text decision path. Provider failures count as failures; their elapsed time is retained. Inspect disagreement cases before choosing a direction.

No STT, actual asset decoding, renderer or visible paint is measured. Readability and intelligent multi-component composition are not established by exact single-asset selection. Natural speech, independently labeled real presentation libraries, content-changing refreshes and larger varied media libraries remain required before declaring the user's larger realistic-library gate met. A favorable constructed result alone is insufficient.
