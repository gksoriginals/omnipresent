> 19 October 2026 update: [small local model research and EXP-051](local_decision_direction.md) records current licensing/weights, quantization risks and a local input-feasibility probe. Historical claims below about local defaults describe the earlier experiment; the implemented development baseline currently uses hosted Clef-omni for ambiguous decisions. The product target is local-first with hosted inference optional.

> Cloudflare update, 17 October 2026: [EXP-027–030](cloudflare_clef_results.md) now measure Clef, Clef-flash and Clef-omni on the bounded semantic shortlist. Open-weight repository metadata and hosted timing/cost boundaries are retained; no local or media test is implied.

# System One presentation decisions

17 October 2026 · Live experiments; framework/model selection remains open.

## Hypothesis and boundaries

Use a single-pass decision model for frequent presentation decisions while keeping
interview/storytelling and novel content generation with a generative model. The
host supplies available topics/assets and executes typed inclusion, content-mode
and layout decisions. It validates references and retains the last valid canvas.
This tests a bounded composition vocabulary, not arbitrary UI generation.

[OpenRouter's Jev documentation](https://openrouter.ai/docs/guides/community/jev)
confirms typed answers with probabilities and the dedicated Decisions endpoint.
Cerebro currently uses `typesafe/jev-1.14` on that endpoint; its source was inspected
rather than assuming its integration was suitable unchanged. Omnipresent reuses the
same local credential lookup, without copying the key into files, frontend code,
logs or results. Calls are billed to that existing OpenRouter account. Cloud calls
are opt-in through the trial selector; normal presentation defaults remain local.
Only synthetic presentation material was used in these experiments.

## Candidate inventory

| Candidate | Availability / relevant distinction | Trial status |
| --- | --- | --- |
| Jev 1.14 | Hosted TypeSafe model through OpenRouter; typed decision API, not chat completion | Paired screen and real voice replay |
| Microsoft Decision 1 | Hosted decision-scoring model through OpenRouter; no self-hostable weights established by this review | Paired screen and voice replay |
| Laya English | Apache-2.0, 421M ModernBERT-based checkpoint; short context; local CPU runner | Paired screen and real voice replay |
| Kev 4B | Apache-2.0 adapter/head on Qwen3.5-4B-Base; self-hostable, also served through OpenRouter | Hosted paired screen; local Kev not run |
| Liquid d1-3B / d1-omni-600M | Released open-weight decision models, with Apple/edge runtime paths; omni is experimental | Next local candidate; not measured here |
| GLiNER2.5-Decide | Apache-2.0, 340M English label classifier; different interface from Jev | Next compact classifier candidate; not installed/measured |

Primary sources: [Laya model card](https://huggingface.co/convaiinnovations/laya),
[Kev model card](https://huggingface.co/jaredpalmer/kev-4b),
[Kev source](https://github.com/jaredpalmer/kev),
[Microsoft announcement](https://commandline.microsoft.com/microsoft-decision-1-model-foundry/),
[Liquid release](https://www.liquid.ai/blog/d1-open),
[GLiNER model card](https://huggingface.co/fastino/GLiNER2.5-Decide).
Vendor latency and calibration claims are not Omnipresent measurements.

## Experiment design and an important correction

The initial request asked for primary and secondary topics independently. These
questions cannot read each other's answers. Several models selected the same topic
for both. Those traces are retained, not treated as a usable composition policy.

The revised request instead asks include/exclude for each available narrative topic,
plus content mode and layout. The host derives primary/secondary display slots,
resolves actual prepared visuals, and assembles the component specification. This
supports combining different topics without generating an OpenUI/JSON program or
relying on one answer to constrain another. Included topics currently retain story
order, emphasis is host-defined, and progressive reveal/context-question generation
are not provided by this decision adapter. Those are narrower freedoms than the
full generative composer.

The screen uses 12 developer-labelled synthetic cases, including paraphrases,
corrections, comparisons, unrelated speech, ambiguity and missing evidence. Decision
APIs run twice; the local Qwen baseline uses equivalent typed choices. Repeats do
not create 24 independent examples. Questions were revised after seeing failures:
this is a development screen, not an untouched holdout benchmark. No probability
threshold is declared calibrated for presentation use.

Hosted timings include network/provider overhead. Laya uses four CPU threads on an
Apple M5, a persistent model process and a pinned checkpoint; download/load time is
separate. Provider hardware and caches are not controlled. The existing full Qwen
composer and matched typed-Qwen screen are distinct baselines: do not equate them.
