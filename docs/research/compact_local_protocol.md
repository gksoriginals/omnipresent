# Compact local selection protocol

19 October 2026 · Development screen, not independent acceptance.

The user authorized comparing small local candidates and testing reduced precision only where native decision quality warrants it. No hosted model or teacher-label calls are authorized by this experiment. Model download and package dependencies live in the existing Hugging Face cache and a separate `output/classifier-venv`, not in the application's runtime environment.

The initial dependency resolution briefly installed gliner2 1.3.2 before model execution; it was immediately replaced with 2.1.0 to match the current boundary-model API. The frozen `runtime/classifier-requirements.lock` identifies the environment actually used. No production SDK or model default was changed.

## Frozen inputs

`scripts/compact-local-fixture.ts` defines three constructed presentation contexts: solar explanation/storage, water cycle/rainfall and scoped energy charts. There are 24 authored cases: 12 positive, six hold and six missing-evidence outcomes. They cover exact statements, paraphrases, corrective speech, quotation, hypothetical and negated content, ambiguous pronouns, missing claims, extra obligations, dates, entity, provenance and audit status. Numeric values are illustrative; evidence and independent review remain explicitly pending.

Three passes rotate the asset order and the position of hold/context labels. Each of three assets appears at every option position. Repetition tests position sensitivity; 72 observations do not constitute 72 independent examples. Models see the same speech and prepared descriptions. No truncation of discriminating dates/entities/units is allowed, and no source hashes or private speaker notes need to be sent to the model. The original codec uses anonymous option IDs with descriptions. A separately frozen development follow-up substitutes semantic candidate IDs, preserving the utterances, labels, instructions and all other scope metadata.

## Native comparisons

- Existing Laya English service: pinned revision `7b928d828b7b0e022f929d9bd2e44165aa270148`, laya 0.3.20, CPU, four threads. HTTP timing includes loopback transport; its benchmark process RSS excludes the existing model service.
- GLiNER multilingual: pinned revision `e173bca1f0c4217d7a55b3b0c705d5ece8a0218d`, gliner2 2.1.0, in-process CPU, FP32, four threads. Full parameter and weight-file counts are recorded.
- GLiNER English: pinned revision `9d1bfb848cd16d93ee56ccbc59cd92bf0f284d90`, same classifier runtime. It is a larger reference arm, not proof it meets the small-install target.

Imports/checkpoint construction and the first forward pass are separate from warm turn times. Report every error in the denominator. GLiNER timing is in-process; Laya uses an already resident HTTP service. Do not present their difference as a transport/hardware-normalized model ranking. Host contention, downloads and uncontrolled caches limit precise timing comparisons. No STT/browser paint or multi-session throughput claim follows.

## Two quality views

Raw model output is decoded to stable asset IDs or hold/context. Report positive and negative outcomes separately, valid errors, shuffled-order stability, median/p95 and resource accounting.

Then overlay the **actual current evidence gate and request-frame interpreter** on those recorded choices. It may preflight-hold/context or reject an unsupported selected asset. Report its positive misses separately: an always-hold guarded system is not a winner. The overlay does not execute hybrid retrieval, fallback calls, adaptive lifecycle or final composition/UI validation and must not be described as a complete live pipeline test. A source of errors can be the bounded interpreter or the menu representation, not only the model.

## Precision gate fixed before model execution

For a further precision experiment, native raw accuracy must be at least 80% overall, at least 80% on positives, at least 75% on hold/missing cases, and have no transport/decoding errors. This is an engineering screen, not a deployment acceptance threshold. Do not lower it after seeing failures.

Only qualifying candidates get a native-versus-FP16 comparison on identical inputs. This casts parameter storage; it is not INT8/INT4 quantization, and loading FP32 weights before casting does not establish smaller download or cold-start peak memory. Later ONNX/INT8 requires decision drift, calibration, latency and artifact-byte accounting. Do not quantize a low-quality model and call the smaller artifact a product improvement.

No candidate is promoted from these authored cases alone. Independent source/story holdouts, realistic asset libraries, natural STT, retrieval/refresh/fallback/final guard timing, concurrency and cancellation remain required. Product policy is local-first; hosted inference must ultimately be optional and explicit. This screen leaves the current development default unchanged until a suitable local candidate is demonstrated.

## Reproduce

```sh
node scripts/setup-compact-local.mjs
node --import tsx scripts/prepare-compact-local.ts RUN-your-unique-id
# Download only the pinned checkpoint's model/config/tokenizer files before inference.
USE_TF=0 output/classifier-venv/bin/python runtime/compact_local_benchmark.py docs/validation/runs/RUN-your-unique-id gliner-multi
# Existing pinned Laya service must be running for this arm:
USE_TF=0 output/classifier-venv/bin/python runtime/compact_local_benchmark.py docs/validation/runs/RUN-your-unique-id laya-english
node --import tsx scripts/summarize-compact-local.ts docs/validation/runs/RUN-your-unique-id
```

Use a new frozen run for `--codec semantic`, preserving the first failures. Model report paths refuse overwrites. Summary files may be regenerated from the frozen model rows and record their analysis-source hashes. Raw responses, every request order, fixture hashes, model revisions and source snapshots accompany results.
