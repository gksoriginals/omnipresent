# Local preference quality and practical latency

19 October 2026. Development experiments; the production default remains local hybrid.

## Question and protocol

Can a small local model choose the **best** eligible presentation asset, rather than merely any eligible asset, well enough to justify its latency and memory?

The [frozen input](../validation/runs/RUN-20261019-preference-quality-v1/inputs.json) contains 32 authored utterances across four synthetic teaching topics. Each topic offers five assets that declare complete coverage of the same illustrative claim: trend, category comparison, process, overview and scene illustration. Each utterance names one expected reference; equivalent alternatives are no longer counted correct. Three passes produce 96 observations per arm, not 96 independent cases. A separate diagnostic rotates candidate order across passes.

The promotion gate was written before inference: at least 90% exact preference accuracy, at least five percentage points above hybrid, warm pipeline p95 at most 150 ms, and fallback rate at most 1%. The runtime retains its existing 300 ms timeout. These thresholds are development decision rules, not established user-perception limits. Missing obligations, withdrawn assets and hold intent must never invoke preference.

The library contains 458 entries: 432 constructed distractors, six earlier source-backed cards and 20 new illustrative assets. Actual EmbeddingGemma BM25/vector ranking filters by complete host eligibility, then the real selector proposes a reference, followed by the host evidence check. All 32 query vectors are prewarmed for every arm before timing. Initial indexing and query warmup are reported separately; percentiles therefore describe warm query-cache operation, not arbitrary cold speech. The first native model forward remains visible in the runtime rows. Arms run sequentially; do not interpret the timing difference as a randomized causal estimate.

This experiment deliberately supplies an explicit request intent to isolate preference. The unchanged actual host interpreter is evaluated separately on the same natural phrasing; its failures must not be hidden by the oracle intent.

## Candidate and source

The new small reference is [cross-encoder/ms-marco-MiniLM-L6-v2](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2), pinned at `233902d25c440f23af6f7d6e94d2946bac0bee0a`. Its model card describes passage relevance ranking; it is not a general instruction-following classifier or an evidence verifier. The local worker scores speech–asset pairs and chooses the largest score inside the eligible menu. The existing locked classifier environment already contains its Transformers dependencies; no new package or hosted inference service was introduced. Model loading is local-only after the explicitly executed download.

Measured parameters: **22,713,601**, FP32 weight file **90,870,598 bytes**. This is a genuinely smaller comparison with the existing 486,444,053-parameter native GLiNER reference. The Python worker remains separate from the application process and uses the same bounded JSON-line preference protocol. No app default or normal UI control changed.

## Executed quality result

[Complete report, raw rows, source hashes and snapshots](../validation/runs/RUN-20261019-preference-quality-v1/replay.json).

| Runtime arm | Exact preference | Fallbacks | Warm pipeline median / p95 | Worker load | Worker peak RSS |
| --- | --- | --- | --- | --- | --- |
| Hybrid | 84/96 (87.5%) | 0 | 0.59 / 1.45 ms | None | Separate embedding service |
| GLiNER FP32, 300 ms budget | 84/96 (87.5%) | 96/96 | 302.13 / 302.45 ms | 8.43 s | 3.55 GB |
| MiniLM FP32 | 84/96 (87.5%) | 0 | 12.69 / 14.06 ms | 1.82 s | 424 MB |

RSS is Python process high-water memory, including runtime and tokenizer; it excludes the separate embedding/STT/app processes and is not model-file size. File sizes use decimal bytes. Index construction took 11.60 seconds and is excluded from the warm percentiles.

GLiNER's **unrestricted** rotated-menu diagnostic achieved 96/96 and stable choices on all 32 cases. That is evidence for its preference quality on this authored set, but not for the timed runtime: all runtime calls missed the deadline and fell back. Raw diagnostic calls were separately awaited, so cancelled work drained rather than growing an unbounded queue. They are not included in the runtime percentile. The timed result correctly retains the timeout cost rather than reporting only successful calls.

MiniLM's rotated diagnostic achieved 84/96, stable across all three orders. Hybrid missed half the comparison observations; MiniLM fixed those but missed half the process observations, specifically the causal-chain phrasing. It changed the distribution of mistakes without improving total accuracy. None passes the frozen promotion gate. The result does **not** justify changing the default.

All three host guard checks per arm retained content or requested context, with zero preference calls on missing, withdrawn or hold input. This shows evidence boundaries for the declared intents, not a proof that the interpreter can discover all unknown obligations.

## Language boundary exposed

On the same 32 natural requests, the actual strict interpreter returned **28 missing and four hold** outcomes: zero present intents. Thus none of the good preference choices would be reached through the unchanged live language path for these requests. The oracle-role result must not be described as full product accuracy.

The next architecture bottleneck is a robust transcript-to-request proposal that recognizes paraphrases and presentation purpose while preserving host evidence obligations. Treat visual-purpose preference separately from factual obligations, account for completed speech segments, and retain unknown evidence requests. Do not solve this by silently discarding unrecognized words or letting a model approve evidence.

## Precision follow-up rule

The unrestricted native preference result passes this new narrow role's 90% quality screen, so a separately recorded dynamic INT8 Linear experiment is permitted. This does not retroactively pass the earlier full-action precision gate: that experiment included abstention and failed. INT8 here means PyTorch dynamic quantization of Linear layers on CPU; remaining operations may stay FP32, and cached checkpoint storage is unchanged. Check exact choices again after quantization; do not infer quality or a speedup from smaller tensor types.

## Reproduce

```sh
# Existing embedding service on 4332 and locked classifier environment:
output/classifier-venv/bin/python scripts/setup-preference-reranker.py
node --import tsx scripts/preference-quality-replay.ts RUN-unique-quality
node --import tsx scripts/preference-precision-replay.ts RUN-unique-int8
# Existing Piper voice/environment and Moonshine runtime:
output/tts-venv/bin/python scripts/synthesize-preference-audio.py
node --import tsx scripts/preference-audio-loop.ts RUN-unique-audio
```

Audio generation refuses to overwrite `output/preference-audio`; reuse its recorded manifest/PCM or choose a new directory in an explicitly versioned script. Each run directory is immutable. No paid model or teacher labeling was used. Authored expectations require independent review before acceptance or training claims.


## Executed INT8 result

[INT8 diagnostic and source snapshot](../validation/runs/RUN-20261019-preference-int8-v1/replay.json) reused the frozen preference inputs without altering expected references. Unrestricted rotated-menu accuracy fell from FP32's 96/96 to **89/96**. All 96 timed calls exceeded 300 ms. Total native compute was **165.20 seconds over 192 calls**, compared with FP32's **68.29 seconds over 192 calls** in the quality run. This implementation therefore fails the latency objective and is not a candidate for promotion.

Its timed 24/96 accuracy is **not comparable with hybrid**: this diagnostic rotates the eligible menu directly, so timeout fallback chooses the first rotated option rather than a hybrid-ranked option. Report the 89/96 unrestricted quality and all-timeout outcome, not the rotated fallback score as evidence that quantization destroys ordinary hybrid selection. Existing host guards remain unchanged.

Peak process RSS was **4.36 GB**, including quantization conversion allocations; loading took 8.15 seconds. This is not steady resident memory. The original cached 1.95 GB FP32 file is still used at startup; no smaller checkpoint was serialized. The report's 138,028,032 `parameters` counts only remaining ordinary PyTorch parameters after Linear modules are quantized; packed quantized weights are excluded from that enumeration. It must not be advertised as a 138M-parameter model. Nominal architecture remains the same 486M reference.

This is one CPU backend/precision implementation. It rejects this implementation, not every quantization backend. Further conversion work is currently lower priority than the demonstrated transcript/intent bottleneck.


## Actual streaming speech and commit loop

[Audio run v2](../validation/runs/RUN-20261019-preference-audio-v2/local.json) records actual locally generated Piper PCM streamed in paced 250 ms chunks through the unchanged Moonshine worker, then the real request interpreter, presenter, synthesis planner and AdaptiveController. No expected transcript was injected. Model/index readiness was awaited before starting audio; the classifier quality run and INT8 run had finished, so v2 had no intentional benchmark contention. The same three authored utterances were replayed once per arm. Raw PCM, voice manifest, transcript segments, direction events and source snapshots are retained.

Across hybrid, GLiNER and MiniLM:

- “Show the installation cost” correctly requested context and kept the current composition: 3/3.
- “Keep this visual” correctly held the composition: 3/3.
- “Explain Solar panels turn sunlight into electricity” failed to produce a show: 0/3. STT produced two final segments, “Explain solar panels turned sunlight.” and “Into the electricity”. The host processed these separately, first requesting context and then holding. No preference inference occurred in any arm.

The result is **6/9 correct integration outcomes**, with the positive case failing consistently. This is an exposed product limitation, not successful full speech acceptance. Negative cases retain the canvas safely, but that does not compensate for failing a supported positive request.

Final transcript completion was approximately 241–391 ms after the end of generated voice PCM across these cases; the final controller result followed roughly 0.18–0.75 ms later. These tiny controller numbers reflect early hold/context paths, **not successful presentation or classifier latency**. Timing is relative to the complete generated waveform (including any voice trailing silence), excludes model readiness and browser paint, and uses synthetic speech rather than a microphone. There is no justified claim of satisfactory speech-to-screen latency yet. Since the positive path failed before composition, browser paint acceptance was not pursued.

[v1](../validation/runs/RUN-20261019-preference-audio-v1/local.json) is preserved. Its row summarizer selected the first completed transcript/direction, creating an apparent negative endpoint interval for the first split segment. Full raw events already recorded both segments. v2 changes only the observer: it summarizes all final segments and the last completed direction after flushing STT; it does not alter the product's speech aggregation behavior. The v2 positive case therefore reports hold as its final action, versus v1's first-segment context. The first run also overlapped INT8 startup near its end; use v2 for the reported audio timings.

## Decision and next bounded work

Keep normal selection on local hybrid. Retain GLiNER and the small reranker as explicit experiment implementations, not automatic background dependencies. Do not ship this INT8 conversion as an optimization. No new hosted fallback or product UI was added.

Prioritize a regression set and implementation for completed-speech aggregation and local intent/purpose proposals. Evaluate the complete request boundary: positive paraphrases, split/corrected segments, negated and hypothetical requests, missing facts, source withdrawal and stale turns. Keep host eligibility and abstention authoritative; purpose preference must not remove factual obligations. Freeze a new independent quality set before training or tuning a small model. Repeat preference and speech-to-commit tests after that boundary works, then measure actual browser paint before promoting a default.

Software validation for these additions: **133 tests and production build pass**. These tests establish bounded adapters and fixture invariants; the recorded failed audio acceptance remains failed.
