# Cloudflare Clef decision model evaluation

EXP-027–030 · 17 October 2026 · Hosted text-only bounded-selection screen.

## Outcome and next candidate

Cloudflare's **Clef, Clef-flash and Clef-omni each matched all 24 complete action/topic labels with the raw semantic shortlist**. The fresh Jev reference matched 21/24 on identical raw requests. Clef-omni had the lowest observed raw-arm median request latency (383 ms); Jev had the lower p95 (519 versus 584 ms). Clef-flash had the lowest recorded request cost in these arms.

Promote **EmbeddingGemma 2 raw shortlist → bounded Clef-omni choice → FSM timing guards** as the next experimental integration candidate, retaining Jev for comparison and Clef-flash as a cost alternative. This updates the earlier Jev candidate assessment; it does not change the live app default or establish a production winner. A single sweep on 24 reused synthetic cases is insufficient to select universally best quality, latency or cost.

## Models and access verified

The [Cloudflare launch](https://blog.cloudflare.com/clef-decision-models/) introduced Clef and Clef-flash; the [October 9 update](https://developers.cloudflare.com/changelog/post/2026-10-09-clef-omni-workers-ai/) added Clef-omni. Cloudflare documents Clef as 27B, Clef-flash as 9B, and Clef-omni as a 30B MoE with 3B active parameters. These are decision models with typed option probabilities, not a reason to assume calibrated probabilities for Omnipresent.

| Variant | OpenRouter selector used | Response model ID | Open-weight repository |
|---|---|---|---|
| Clef | `cloudflare/clef` | `cloudflare/clef` | [Cloudflare/clef](https://huggingface.co/Cloudflare/clef) |
| Clef-flash | `cloudflare/clef-flash` | `cloudflare/clef-flash` | [Cloudflare/clef-flash](https://huggingface.co/Cloudflare/clef-flash) |
| Clef-omni | `cloudflare/clef-omni` | `cloudflare/clef-omni-20261009` | [Cloudflare/clef-omni](https://huggingface.co/Cloudflare/clef-omni) |

The repository API metadata reports Apache-2.0 and ungated weights for all three; repository revisions are retained in [model-metadata.json](../validation/runs/RUN-20261017-clef-connectivity/model-metadata.json). These hashes identify public repository metadata, not proof that OpenRouter serves those exact weight revisions. No weights were downloaded or self-hosted. Media support was researched, not exercised. These results do not measure direct Workers AI requests, local inference or native audio-to-decision performance.

The adapter uses the existing `https://openrouter.ai/api/alpha/decisions` endpoint and existing server-side credential lookup. Three single-case connection checks succeeded and are retained separately. No Cloudflare account, Worker deployment, credential copy, new model server or UI control was introduced.

## Paired experimental design

The [protocol](cloudflare_clef_protocol.md) was recorded before quality runs. Reuse the exact EXP-024/025 corpus: 18 passages across three projects, 12 calibration queries and 24 evaluation queries. Cases include paraphrases, negation, comparisons, unrelated speech and missing evidence. The same prompts, top-two ranking, menu options and full action-plus-topic-set scoring apply.

`semantic` uses the unchanged 0.70 presence threshold chosen on the calibration cases. `semantic-raw` passes the top two topics without that gate. Each menu offers either topic, their comparison, hold and request-context. The selector cannot generate new facts or references. No input, question, threshold or label was tuned for Cloudflare.

One attempt per provider/method/case: 48 quality requests per provider, **192 total**, plus three connectivity checks. All 192 requests returned valid typed choices with zero transport errors or skipped cases. The [derived paired summary](../validation/runs/RUN-20261017-clef-comparison-v1/paired-summary.json) checks that all request payloads exactly match the corresponding retained earlier Jev requests, excluding the transport model selector. The two fresh quality runs also use identical candidate inputs across providers.

These are reused developer-authored cases, not independent human labels or a new holdout. Providers ran sequentially (Clef, Flash, Omni, Jev), not in randomized order. Cases and two shortlist arms are correlated, not independent samples. Complete source/input snapshots, raw JSONL/response bodies, timings, hashes and recorded costs are archived.

## Results

### Raw semantic shortlist

| Model | Full action/topic correct | Wrong shows | Missed context requests | Median / p95 request time | Recorded cost for 24 |
|---|---:|---:|---:|---:|---:|
| Clef | 24/24 | 0 | 0 | 605 / 859 ms | $0.000363474 |
| Clef-flash | 24/24 | 0 | 0 | 543 / 1,032 ms | $0.000198251 |
| Clef-omni | 24/24 | 0 | 0 | 383 / 584 ms | $0.001077300 |
| Jev, fresh reference | 21/24 | 1 | 3 | 431 / 519 ms | $0.000499212 |

All positive queries had their required topics available in these menus. All three Cloudflare variants correctly distinguished absent facts from unrelated speech in the six negative cases. Jev showed a roof-survey topic for an unavailable installation-cost request and held instead of requesting context for missing class results and missing software latency measurements. The prior raw Jev run scored 22/24; this fresh run scored 21/24 despite identical request payloads. The cause of that variation is not established; do not claim deterministic correctness or infer model changes without evidence.

### Same models with the similarity gate

| Model | Full action/topic correct | Wrong shows | Median / p95 request time |
|---|---:|---:|---:|
| Clef | 21/24 | 0 | 648 / 1,130 ms |
| Clef-flash | 20/24 | 0 | 554 / 1,066 ms |
| Clef-omni | 21/24 | 0 | 380 / 722 ms |
| Jev, fresh reference | 22/24 | 0 | 434 / 491 ms |

The gate excludes two valid education paraphrases for every provider, preventing correct shows. Clef and Omni additionally request context for one unrelated query; Flash does so for two unrelated queries. With no relevant candidates available, hold versus request-context still requires a real action decision. The Cloudflare raw arms solve these cases on this dataset, supporting a model-based abstention experiment rather than a universal cosine cutoff.

Timings include client serialization, network and hosted request completion, not only model compute. They exclude STT, retrieval, temporal dwell/confirmation, asynchronous queueing and rendering. Do not add these percentiles to retrieval percentiles to claim end-to-end latency. The fresh reference helps contextualize the measurements but one nonrandomized sweep does not establish a universal speed winner. In particular, Omni's better median comes with a higher p95 and recorded cost than Jev in these raw arms.

## Cost and evidence

Quality-run provider-reported usage: **$0.004152883**. Connectivity checks: **$0.000061959**. Total recorded for this extension: **$0.004214842**. These are retained response usage fields, not complete account billing or a price guarantee. They should not be replaced with Cloudflare's direct Workers AI list prices or older launch pricing.

- [EXP-027 connectivity, three requests](../validation/runs/RUN-20261017-clef-connectivity/connectivity.json), [metadata](../validation/runs/RUN-20261017-clef-connectivity/model-metadata.json), and [post-run source manifest](../validation/runs/RUN-20261017-clef-connectivity/source-manifest.json). Connectivity source was captured immediately afterward, before edits, and that timing is explicit.
- [EXP-028 Clef/Flash, 96 requests](../validation/runs/RUN-20261017-clef-comparison-v1/retrieval-selection.json), [raw JSONL](../validation/runs/RUN-20261017-clef-comparison-v1/selection.jsonl), [paired comparison](../validation/runs/RUN-20261017-clef-comparison-v1/paired-summary.json).
- [EXP-029 Omni/Jev, 96 requests](../validation/runs/RUN-20261017-clef-omni-jev-reference/retrieval-selection.json), [raw JSONL](../validation/runs/RUN-20261017-clef-omni-jev-reference/selection.jsonl).
- [EXP-030 software audit](../validation/runs/RUN-20261017-clef-audit/run.json): 58 tests plus type checking/build. Two new tests verify Cloudflare model/auth/endpoint routing preserves the typed input and unsupported providers fail before transport. Historical software and model experiments are not implicitly rerun by this audit.

## Reproduce and remaining gates

Use the [protocol commands](cloudflare_clef_protocol.md) with unique run IDs and the existing local embedding runner. Credentials remain local. `node scripts/compare-clef-results.mjs` verifies the retained named comparison; it refuses to overwrite its summary artifact. Run the audit/catalog verifier after intentional source/document updates.

Next: independently labelled, harder presentation queries with realistic asset collections; option-order and paraphrase perturbations; repeated latency and failure measurements; then opt-in asynchronous FSM/selector integration with actual feedback routing. Test stale responses, revisions, pause/resume and bounded work before another voice/browser smoke test. No multimodal accuracy, local deployment feasibility, calibrated confidence, production reliability or new generative visual behavior is established here.
