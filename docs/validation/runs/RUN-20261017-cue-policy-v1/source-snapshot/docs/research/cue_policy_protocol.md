# Cue bundles and minimum-change policy protocol

17 October 2026 · EXP-035 · Frozen development experiment; live defaults unchanged.

## Question and gates

Can approved exact cues and retaining an unchanged asset reduce unnecessary inference while preserving selection and missing-evidence quality? Compare the same full hybrid search plus Clef-omni grounding against a policy with conservative exact cue bypass and current-asset continuity. The same fallback grounding function and final catalog-reference validation apply. Cue paths use deterministic prepared bindings as final grounding; they do not incur a hidden hosted call.

Require per-case quality preservation, no increase in unsupported shows, valid completion, and lower median and p95 in each of three passes before declaring a useful latency result. Production acceptance additionally needs independently reviewed source material, varied natural speech, broader refreshes and visible-paint testing. A timing pass alone does not meet that gate.

## Inputs and comparison

Use the existing 432-entry constructed stress library. Build cue requests from asset metadata before reading expected labels. Exact whole-utterance templates specify action, provenance, year, entity, topic and form. Only the complete normalized approved request matches; extra facts, negation, quotations, corrections and unmatched paraphrases use full retrieval and grounding. Conflicting cue bindings cannot select arbitrarily. “Keep this visual” can hold a current validated asset.

Twenty-three development cases extend the previous sixteen with repeated references, quoted speech, extra requested facts, unsupported provenance, an ambiguous year and keep. Both arms see identical sequential speech. Arm order counterbalances; sequence order remains fixed to exercise continuity. Cases are implementer-authored and are not independent holdout material. Labels must not be retuned after seeing outputs; disagreements remain failures or require a separately versioned experiment.

Each pass starts fresh policy instances. Each arm has a separate content-addressed document-vector cache. Full initial indexing is reported separately. At indices 0, 8 and 16, rebuild the catalog with one changed document, invalidating cue/current state; count rebuilding and encoding the changed document inside the observation latency. Removed cues, unknown IDs and late results after refresh are covered by separate unit tests. These are modest text updates, not a substitute for all real-world revision patterns.

Fallback grounding initially sees five hybrid-ranked options; a context answer retries with twelve. Include all requests, errors, refreshed-document encoding, query encoding, search, cue evaluation, final grounding/reference validation and commit decision in elapsed time. No semantic answer caching. Limits: 220 calls / USD 0.10; stop on unknown provider cost. Report attempts, errors and denominators.

## Metrics and evidence

Preserve exact action/asset correctness, positive and negative correctness, unsupported shows, valid outputs, cue coverage, grounding calls, fallback counts and retain operations. Retain is a host operation over the same semantic selected asset, not an excuse to mark a wrong selection correct. Report per-pass median/p95, initial indexing, refresh counts and re-embedded document counts. Nearest-rank p95 on 23 observations has limited tail precision.

Archive exact sources, inputs, protocol, hashes, requests, responses, costs and step traces under a unique run. Reproduce with `node --import tsx scripts/cue-policy-benchmark.ts <unique-run-id>`. The result measures an offline validated decision, not STT, browser paint or multi-component composition quality. No default migration or weaker-model comparison follows automatically.
