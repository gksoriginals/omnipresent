# Small local decision models

19 October 2026 · Local-first product direction; hosted runtime default not switched by this research.

The live presenter should not require a paid API call for each visual change. Ordinary prepared-asset retrieval, selection and composition should run locally. A hosted model may be an explicitly enabled comparison or enhancement; there should be no silent paid fallback. This product target is separate from the current `clef-omni` development default, which remains unchanged until a local replacement preserves quality. Preparation/generation is a different workload and should be priced/measured separately.

Most decisions already avoid inference via cue/intent/evidence policy. The latest full spoken demo made no hosted selection calls. Local compute still consumes memory, CPU/GPU and power, but carries no per-call provider charge.

## Verified candidate inventory

Sources checked online and model metadata captured in [this run](../validation/runs/RUN-20261019-local-decision-feasibility/model-metadata.json). Sizes below are decimal file sizes, not RAM measurements or complete application downloads.

| Candidate | Availability and measured repository size | Proposed role |
| --- | --- | --- |
| Laya English | Apache-2.0; 421.3M parameters; pinned model file 842.6 MB | Existing CPU adapter and compact-input reference; current quality is inadequate |
| Laya multilingual | Apache-2.0; 321.9M; model file 643.8 MB | Smaller multilingual candidate, not tested here |
| GLiNER2.5-Decide | Apache-2.0; card describes 340M encoder, but actual full safetensors metadata is 486.4M parameters / 1.946 GB FP32 | English classifier candidate; quantify full deployment size, not only advertised backbone |
| GLiNER2.5-multi-Decide | Apache-2.0; 287.4M total; 1.149 GB FP32 weights | First compact alternate classifier candidate; investigate reduced precision after baseline |
| Liquid d1-omni-600M | Open weights under its custom LFM license; official Q8 GGUF text model 407.2 MB, optional Q8 media projector 262.8 MB | Secondary small edge candidate; experimental model, exact runtime/decision-head compatibility untested |
| Clef-flash | Apache-2.0; 9B with custom decision head | Heavier optional comparison; not the default small-device target |
| Clef | Apache-2.0; 27B with decision head | Exclude from small-device installation target |

Laya [English](https://huggingface.co/convaiinnovations/laya) and [multilingual](https://huggingface.co/convaiinnovations/laya-multilingual) are single-pass classifiers. English has a 512-token budget in our pinned runner; multilingual defaults to 1,024 with upstream long-context options. Their shipped probability calibration must not be assumed valid for Omnipresent. The earlier [semantic retrieval experiment](semantic_retrieval_results.md) already found Laya fast but unreliable: gated semantic selection was 10/24 correct with nine wrong shows. That was an older menu/policy, not a score for the current host-gated system.

[GLiNER's model card](https://huggingface.co/fastino/GLiNER2.5-Decide) describes a label-set classifier with a different interface from the Jev/SystemOne API. It can be adapted to a bounded menu, but assigning evidence validity remains the host's job. Its published benchmark is not a presentation benchmark. Verify full parameter/file accounting before choosing the English checkpoint; our metadata check found the advertised-backbone/full-model distinction above. [The multilingual variant](https://huggingface.co/fastino/GLiNER2.5-multi-Decide) is a smaller candidate, not an established winner.

[Liquid's announcement](https://www.liquid.ai/blog/d1-open) calls d1-omni-600M experimental and describes a 350M text encoder plus media encoders. [Official GGUF files](https://huggingface.co/LiquidAI/d1-omni-600M-GGUF/tree/main) include Q8_0, F16 and BF16, with separate projector files. Treat it as open-weight with its specific license, not automatically Apache-2.0. The existence of GGUF files does not prove that the current Ollama/llama.cpp installation can serve its typed decision head; pin and test the supported runtime first. We have not downloaded or run it.

[Clef-flash](https://huggingface.co/Cloudflare/clef-flash) uses a Qwen3.5-9B backbone plus a joint schema head. Quantizing backbone weights alone does not prove equivalent decision output or a usable standard chat endpoint. Its raw 4-bit parameter payload would be about 4.5 GB before heads, scales, activations and runtime overhead; this is arithmetic, not a measured working quant. We did not download Clef-family weights.

## Quantization is an experiment, not a quality guarantee

Upstream [Laya quantized-export documentation](https://github.com/NandhaKishorM/laya/blob/main/docs/reference/agent.md) supports ONNX INT8 export, but reports material decision drift. The documented larger comparison has about 67% English / 83% multilingual eager-vs-per-tensor-INT8 agreement, with worse per-channel behavior. These are upstream workload results, not our own. A short fixture elsewhere may show less drift; that does not establish preservation on presentation decisions. Naively dynamically quantizing every PyTorch linear layer can also break the custom head's fast path.

Use a staged ladder: native reference → FP16/BF16 where backend support is sound → FP32 ONNX parity → per-tensor INT8 or mixed precision → only then INT4 if supported and useful. Keep normalization/scoring heads in higher precision where justified. Measure actual artifact bytes, resident/peak memory, cold load, queueing, warm median/p95, energy where possible and decision/calibration drift. Embedding tables and unquantized operators mean parameter-count × bit-width estimates are not deployment measurements. Do not claim a fourfold application memory saving from INT8 alone.

The official Laya ONNX path is worth testing, but no export, SDK upgrade or quantization happened in this research. The installed runtime is pinned to laya 0.3.20; current upstream docs describe newer functionality and must be validated against a deliberately selected version.

## Actual local feasibility probe

[EXP-051](../validation/runs/RUN-20261019-local-decision-feasibility/local.json) used the already-running pinned Laya CPU service. Six authored cases were repeated twice, with counterbalanced full-versus-compact request order. No new weights, package updates, hosted requests or quantization were involved.

- Current `groundLibrary` full candidate records: **0/12 accepted**, all rejected with HTTP 400 for exceeding the pinned context budget. Failed attempts remain in the denominator; their short latency is not successful inference.
- Compact three-component menu, keeping text, title, entity, timeframe, provenance, unit and family while excluding bulky source contracts/hashes: **12/12 valid**, **4/12 correct**. It chose the wrong content for battery explanation and failed hold/context on microphone, missing-cost and negated requests. Median HTTP latency was about 174 ms; p95 about 4.39 s, including a slow first invocation. This small probe does not establish a stable latency distribution.
- This was direct model evaluation. Live evidence gates, hybrid retrieval and final composition checks were deliberately outside it, so wrong direct choices are not evidence that the current guarded app displayed unsupported content. Conversely, the guards cannot repair every missed valid selection.

The compact experiment changes both payload and question wording, so it diagnoses feasibility and input shape, not a causal model/quantization improvement. Labels and prompts are authored development data; they do not justify default adoption.

Reproduce with the existing optional runner and synthetic manifest:

```sh
# Existing dependency lock and pinned runner; do not replace with latest implicitly.
npm run decision:serve
node --import tsx scripts/local-decision-feasibility.ts RUN-unique-local-probe
```

## Proposed implementation and acceptance

Keep model transports behind `DecisionModel`, but add a **selection-request codec** at the selection-policy boundary. It constructs a token-budgeted request from a host-filtered eligible menu, with complete request obligations and enough content/scope to distinguish choices. Source blobs, hashes and private speaker notes stay with the host. A codec may omit redundant transport metadata but must not truncate a meaningful distinction to fit. Overflow returns a typed unavailable/hold result; it must not silently call a paid model.

Next compare GLiNER multilingual and English (full parameter counts recorded), Laya English/multilingual with compact requests, and a supported d1 Q8 runtime if license/packaging fit. Use shuffled option order, collisions, natural paraphrases, corrections, absent evidence, extra obligations, units/dates and ambiguous requests. Calibrate abstention only on a development split; keep source/story-isolated reviewed holdout cases untouched. Domain fine-tuning/distillation is a possible next step if small zero-shot models plateau, not a claim that quantization creates missing reasoning ability.

Evaluate unquantized and quantized versions on the identical frozen inputs. Require positive selection retention, missing-evidence quality, zero new unsupported shows and stable composition behavior under final guards. Include retrieval, fallbacks, source refresh, final validation, cancellation and simultaneous STT/embedding load. An always-hold local model does not pass. No new hosted teacher-label requests are part of this research.

Provisional engineering targets for a compact local tier: under 1 GB decision-model download and a decision-runner peak-memory budget established alongside STT and embeddings; aim for warm full-path p95 under 150 ms on the reference laptop. These are proposed targets, not achieved guarantees or permanent product restrictions. A larger optional device tier can be evaluated separately.

Once a candidate passes, make local the normal presentation profile and require explicit opt-in for hosted inference. Until then, preserve the current development default and label the missing local-quality gate clearly. This research does not silently substitute a weaker local model or introduce a paid fallback.

## Executed compact-model follow-up

[EXP-052/053 results](compact_local_results.md) now contain native local Laya English, GLiNER multilingual and GLiNER English comparisons, option-order sensitivity and a separate semantic-ID codec follow-up. No native profile passed the predeclared precision gate, so reduced precision was not run and the default remains unchanged. English GLiNER is a candidate for a narrower host-eligible asset-matching experiment; it is not a qualified complete local controller.

## Role reassignment implemented

The [local selection baseline](../architecture/local-selection.md) now replaces the required hosted live selector with host eligibility and local hybrid preference. EXP-054 records the real local embedding/native preference comparison. Earlier statements that the development default was unchanged describe the earlier compact-model screen; this later change does not claim those direct model failures disappeared.
