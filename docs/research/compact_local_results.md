# Compact local decision results

19 October 2026 · EXP-052 and EXP-053 · Native local screen completed; no production promotion.

## Outcome and direction

English GLiNER is promising for **matching speech to prepared assets**, but none of the tested native profiles qualifies as a complete show/hold/missing-evidence decision replacement. Keep the local-first product goal, preserve mandatory host guards, and test a narrower eligible-asset selection contract next. Do not lower the native precision gate after seeing results or assume that quantization will fix semantic errors.

The [frozen protocol](compact_local_protocol.md) separates direct classification from the current host evidence gate. There were 24 authored cases repeated under three option orders per profile, not 72 independent cases. All five profiles produced valid model choices for every scored request. There were 360 scored local decisions plus five separately recorded first-use forwards. No hosted inference or teacher-label calls were made.

## Native anonymous-option screen

[Raw report, inputs, frozen runner and analysis source](../validation/runs/RUN-20261019-compact-local-v1/replay.json).

| Profile | Direct correct / 72 | Positive / 36 | Hold/missing / 36 | Order-stable cases / 24 | Warm median / p95 |
| --- | --- | --- | --- | --- | --- |
| Laya English | 34 | 26 | 8 | 10 | 110 / 123 ms |
| GLiNER multilingual FP32 | 26 | 14 | 12 | 16 | 61 / 74 ms |
| GLiNER English FP32 | 44 | 35 | 9 | 22 | 170 / 228 ms |

Laya uses the existing pinned local HTTP service; GLiNER timing is in-process CPU with four threads. These are different transport/runtime paths, so the table is not a normalized hardware ranking. First-use forwards are excluded from warm metrics and retained separately. All three use identical frozen utterances and candidate descriptions; native model adapters differ because their APIs differ. No context truncation was used.

Laya is still not reliable for abstention. Multilingual GLiNER often holds valid explanations or selects a related topic for unavailable facts. English GLiNER matches nearly all positive cases, but misses the distinction between topic relevance and a request to display supported content. More capacity improved positive matching, not complete control-policy quality.

### Host evidence-gate overlay

| Profile | Guarded correct / 72 | Positive / 36 | Hold/missing / 36 | Wrong shows |
| --- | --- | --- | --- | --- |
| Laya English | 55 | 22 | 33 | 0 |
| GLiNER multilingual | 47 | 14 | 33 | 0 |
| GLiNER English | 59 | 26 | 33 | 0 |

The overlay runs the actual current `storyRequestFrame` and `evidenceGate` on recorded predictions. It is **not** a complete live pipeline: no retrieval, fallback, adaptive commit, composition validation, STT or browser rendering is executed by it. Zero wrong shows here is a property of these fixtures and gates, not independent real-speech safety acceptance.

The bounded interpreter rejects some valid paraphrases before a model can help. English GLiNER's 35/36 direct positives become 26/36 after the gate, showing that the host interpreter is also a quality bottleneck. Three negative observations share a hold-versus-context mismatch across profiles. Those are failures under the frozen labels even though they preserve the canvas. Do not count guarded retention alone as task success.

## Separate semantic-label follow-up

[Follow-up report](../validation/runs/RUN-20261019-compact-local-semantic-v1/replay.json). Only candidate identifiers changed from anonymous IDs to semantic asset IDs; utterances, labels, scope metadata, instructions and thresholds remained fixed. This is development follow-up after observed errors, not independent confirmation.

| Profile | Direct / 72 | Positive / 36 | Hold/missing / 36 | Guarded / 72 | Warm median / p95 |
| --- | --- | --- | --- | --- | --- |
| GLiNER multilingual, semantic IDs | 27 | 16 | 11 | 49 | 63 / 66 ms |
| GLiNER English, semantic IDs | 43 | 32 | 11 | 57 | 157 / 188 ms |

Semantic names did not repair overall quality. English order stability also fell from 22/24 to 15/24; multilingual stability increased from 16/24 to 20/24 while accuracy remained poor. Do not choose a representation based only on timing or one aggregate score. These small sequential runs do not establish a causal performance gain from semantic labels.

## Size, load and quantization decision

Multilingual GLiNER has 287,355,159 full parameters: about 1.149 GB parameter storage and a 1.149 GB native weights file. Its isolated process peaked around 2.30 GB during import/load/inference. English GLiNER has 486,444,053 full parameters (the card's 340M refers to the advertised encoder size), about 1.946 GB parameter storage and a 1.946 GB weights file. Its isolated process peaked around 2.91 GB. These are process high-water marks, not steady-state resident memory, and do not include the rest of Omnipresent. Laya's reported probe RSS covers only the HTTP client, so it is not compared with model-process memory.

Checkpoint construction took about 5.1 seconds for multilingual and 6.6 seconds for English in the initial runs; Python imports/downloads are outside that field. Initial forwards were about 114 ms and 412 ms. Native reference downloads remain in the local Hub cache for reproducibility and are not packaged with the product. The larger English download initially failed in Xet reconstruction; an HTTP retry completed. [Download notes](../validation/runs/RUN-20261019-compact-local-v1/download-notes.json) preserve that blocker separately from inference quality.

The precision-experiment gate was fixed before model execution: at least 80% direct overall, 80% positive, 75% negative accuracy and zero errors. **No profile passed.** No FP16, INT8 or INT4 execution was performed. This does not mean those exports are impossible; it means they have not earned a role under the tested full-decision contract. The existing runner's optional `--precision fp16` is a research capability, not an executed validation claim. It casts FP32-loaded parameters and alone would not prove a smaller download or cold-load peak.

## Next bounded experiment

1. Keep evidence validity, source scope, revision, explicit negation/quotation and commit authority with the host. Do not delegate those duties to a label classifier.
2. Separate intent extraction and eligibility from **candidate preference**. Evaluate English GLiNER only on genuinely eligible alternatives, with a deterministic unique-eligible control and current hybrid ranking as controls. A typed validated intent proposal may improve paraphrase handling, but cannot approve its own evidence.
3. Freeze a new source/story-isolated development set and an independently reviewed holdout before changing the host interpreter. Measure over-abstention, wrong shows, current-content retention and option-order sensitivity separately. Do not tune from these 24 cases and call the follow-up a holdout.
4. If a native selector meets the actual narrowed-role quality bar, compare reduced precision and deployable artifact sizes under simultaneous STT/embedding load. English GLiNER FP16 parameter storage would be about 973 MB by arithmetic, but no working size/latency/quality claim is established here.
5. Keep Laya multilingual and supported d1 Q8 runtime tests as later candidates. They were researched previously but not downloaded or evaluated in this screen. Domain adaptation of a smaller classifier remains an option if zero-shot matching cannot meet the gate. No automatic paid fallback should be introduced.

The model/provider abstraction and hosted development default are unchanged. This experiment identifies a plausible local matching component, not a quality-qualified complete local presentation controller.

## Software and reproducibility

[Software audit](../validation/runs/RUN-20261019-compact-local-final-audit/run.json) records tests and build. Raw per-turn JSONL, model responses, option orders, checkpoint revisions, locked environment, input/source hashes, first-use measurements and separately regenerated guard-overlay summaries are retained in both run folders. The validation catalog checks frozen inputs and source snapshots. No UI, microphone or production model behavior was changed by this screen.
