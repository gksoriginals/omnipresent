> Current test evidence and component selection status: [validation and decision records](validation/README.md) (audited 17 October 2026). Historical milestones below are not independent current validation.

# Baseline Technology Research

16 October 2026 · Primary-documentation review; provisional candidates, not benchmark winners

## User direction

Evaluate generative UI options through parallel or sequential experiments rather than choosing a winner from documentation. Find a fast local streaming STT option. Investigate EmbeddingGemma’s useful roles. Evaluate self-hostable open models and Groq’s free-plan models against interview, story preparation, and live presentation needs.

No models or dependencies were installed, no provider requests were made, and no microphone or performance tests were run during this review. A read-only hardware check identified an Apple M5 MacBook Pro with 16 GB unified memory. Recommendations below are engineering judgments to test, not measured results.

## Generative UI: compare the right layers

| Candidate | Role and relevance | Proposed comparison |
| --- | --- | --- |
| json-render | Catalog-constrained UI specifications, registered components, bindings, incremental updates. | Test custom presentation composition and updates. |
| Thesys OpenUI | Component libraries, generated prompts, streamed OpenUI Lang rendering. | Test equivalent presentation tasks against json-render. |
| A2UI | Declarative UI messages and data binding; custom catalog/renderer integration. | Evaluate an appropriate renderer using equivalent presentation capabilities. |
| AG-UI / CopilotKit ecosystem | Agent/frontend event and state communication; can carry presentation updates. | Evaluate communication/integration separately from rendering quality. |

json-render and AG-UI can coexist. Its [AG-UI integration page](https://json-render.dev/docs/ag-ui) explicitly labels the examples conceptual and requiring adaptation. This is not evidence of a production-ready integrated Omnipresent engine.

Sources: [json-render](https://json-render.dev/docs), [Thesys OpenUI source](https://github.com/thesysdev/openui), [A2UI architecture](https://a2ui.org/concepts/overview/), [AG-UI](https://docs.ag-ui.com/introduction).

Keep the same artifacts, explanatory tasks, and equivalent presentation capabilities across experiments. Allow each technology its native representation rather than forcing an elaborate shared abstraction first. Compare expressive composition, readable visual quality, usable incremental updates, state continuity, invalid-output recovery, generation tokens/latency, integration effort, and licenses. Use controlled fixtures first, then the same actual model where supported. A vendor’s token-efficiency benchmark is a hypothesis to check on our workloads. No renderer is selected.

## Local streaming STT

**First candidate: Moonshine Small Streaming (English, 123M parameters).** Compare Medium Streaming (245M) for accuracy and resource tradeoffs. Moonshine documents on-device streaming and macOS support; its current English streaming models are MIT-licensed. This is a candidate for testing on the actual machine, not a demonstrated latency result. Sources: [repository](https://github.com/moonshine-ai/moonshine), [model inventory](https://moonshine-voice.readthedocs.io/en/latest/models/available-models/).

**Alternative engine: sherpa-onnx with a streaming Zipformer model.** It documents streaming recognition and macOS support. Pin an exact checkpoint and check its model license separately from the engine. [Official documentation](https://k2-fsa.github.io/sherpa/onnx/).

Test actual microphone speech, representative accents, technical names, quantities, corrections, pauses, and background noise. Record first useful partial, finalization delay, revision churn, missed/corrupted entities, and downstream canvas mistakes under simultaneous inference/rendering load. Start with English recordings without declaring the product English-only; language/code-switching requirements still need discovery. Avoid equating rolling-window retranscription with native streaming support.

## Where EmbeddingGemma fits

The [focused use-case decision](embeddinggemma_use_cases.md) expands and refines this initial shortlist using the user’s supplied notes and further primary-source research. It identifies intended preparation/live retrieval roles, secondary experiments, exclusions, and validation needs.

Embeddings can help retrieve artifacts from a spoken idea, locate related story-plan passages, group preparation material, and shortlist candidates for the live agent. These are proposed uses to compare against simple keyword/metadata lookup; similarity is not factual verification or a calibrated intent-confidence score.

Distinguish versions:

- Original EmbeddingGemma is a roughly 300M text embedding model, with 2K input context and 768-dimensional vectors that can be reduced. Images/media need textual descriptions or another encoder. [Original model card](https://ai.google.dev/gemma/docs/embeddinggemma/model_card).
- EmbeddingGemma 2 adds a shared text/image/video/audio space, modular encoders, and an 8K context. The official guide lists 270M text-only, 440M text+vision, and 740M full configurations under Apache-2.0. [Developer guide](https://developers.googleblog.com/embeddinggemma-2-the-developer-guide/).

Test the text path for transcript-to-story/asset retrieval; consider the multimodal version for direct visual retrieval. Keep query/document prompts, dimensions, preprocessing, and exact model revision consistent. Do not mix original and v2 vectors in one similarity search merely because dimensions match. Index prepared material in advance where useful; no dedicated vector database is required for a small comparison corpus. Embeddings do not conduct the interview, generate artifacts, or decide presentation timing.

## LLM candidates

### Local/self-hosted

Try **Qwen3.5-4B**, quantized with a verified compatible local runtime, first; compare **Qwen3.5-9B** if quality or tool reliability warrants the added memory. The official cards identify Apache-2.0 licensing and document multimodal and agentic use. [4B card](https://huggingface.co/Qwen/Qwen3.5-4B/blob/main/README.md), [9B card](https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/README.md).

The choice is a practical starting hypothesis for 16 GB shared memory, not a claim these are the strongest available local models. Verify quantization provenance, runtime/API support, prompt formatting, context memory, and measured speed. Do not size by weight memory alone or assume the advertised context is practical alongside STT, embeddings, and the UI. Ollama, MLX-based serving, or another compatible runtime can be investigated without selecting one now.

GPT-OSS-20B is another self-hostable open-weight candidate under Apache-2.0; larger models can be self-hosted on separate hardware. It is not the first local baseline on this laptop. [Official OpenAI model documentation](https://developers.openai.com/api/docs/models/gpt-oss-20b). Keep open-weight availability and specific license terms distinct from a broad claim that all model development assets are open source.

### Groq free-plan comparison

Start with **openai/gpt-oss-120b** as the quality-oriented candidate and **openai/gpt-oss-20b** as the speed-oriented comparison. Include **qwen/qwen3.8-27b** as a challenger if necessary. This is a shortlist, not a claim that one has been proven best for Omnipresent. [Current models](https://console.groq.com/docs/models).

The public free-plan table lists each at 30 requests/minute, 1,000/day, 8,000 tokens/minute, and 200,000/day. Exact organization limits may differ; verify account access/limits before live trials. Free tier is quota-limited, not unlimited free hosting. [Rate limits](https://console.groq.com/docs/rate-limits). For intuition, an uncached 4,000-token request at 8,000 TPM leaves room for roughly two such requests per minute, before other limits; the actual token accounting and caching must be measured.

Important integration constraint: Groq’s [Structured Outputs documentation](https://console.groq.com/docs/structured-outputs) currently excludes streaming and tool use in that mode. Test complete schema-constrained responses separately from regular streamed output/tool calls. A streaming JSONL/OpenUI output path needs its own parsing, validation, and failure handling; provider schema guarantees cannot be assumed there.

## Model work and limits

Evaluate interview quality, useful follow-up questions, tool selection, coherent story preparation, artifact references, composition quality, live intent/no-change judgments, and recovery. Compare end-to-end behavior rather than advertised tokens per second. Test tool calling and composition separately where API modes require it.

These LLMs can orchestrate retrieval/generation tools and write text or composition instructions. They are not a complete image/video generation or artifact-ingestion pipeline. Those pieces remain open. Groq calls require connectivity and transmit supplied context to a hosted service; local STT/embeddings do not make that arrangement fully offline.

## Suggested experiments

1. Compare json-render and OpenUI on the same small presentation, adding A2UI when its renderer path is concrete. Test AG-UI integration as a separate question. Sequential runs are acceptable and avoid local resource contention.
2. Try Moonshine Small and Medium Streaming on the same audio; use sherpa-onnx as an alternative if fit is poor or broader engine comparison is useful.
3. Compare keyword/metadata lookup with EmbeddingGemma retrieval on labeled story/asset questions, including no useful match.
4. Compare local Qwen3.5-4B with Groq GPT-OSS-120B/20B on the same preparation and live-decision tasks. Record model versions, settings, context sizes, actual quotas, latency, failures, and memory.

Choose and revise a provisional baseline from these findings. These experiments are a proposal for learning, not a mandatory framework, fixed milestone sequence, or claim of implementation readiness.

## Provisional baseline summary

| Area | First experiment | Comparison / unresolved choice |
| --- | --- | --- |
| Generative presentation | Equivalent custom presentation components in json-render and Thesys OpenUI. | A2UI renderer path; no winner selected. |
| Agent/UI communication | Assess whether AG-UI simplifies the actual agent/frontend integration. | Independent of renderer selection; avoid adding it without a concrete benefit. |
| Local streaming speech | Moonshine Small Streaming. | Medium Streaming for accuracy; sherpa-onnx as an alternative engine. |
| Semantic retrieval | EmbeddingGemma 2 for preparation/live retrieval with the encoders needed by the corpus. | Original text model as fallback/comparison; validate improvement over keyword/metadata retrieval. |
| Local generation | Quantized Qwen3.5-4B on the verified presenter hardware. | 9B if warranted; compatible runtime and quantization remain to be verified. |
| Hosted free-plan generation | Groq GPT-OSS-120B and GPT-OSS-20B on equivalent tasks. | Account access, quotas, streaming/schema/tool mode combinations, and measured quality/speed. |

## Questions still open after this review

- Which language/accent and code-switching cases should the speech trial cover?
- Which renderer supports our emerging presentation vocabulary with the least compromise?
- Intended retrieval placements are now documented in the [focused decision](embeddinggemma_use_cases.md). Which configuration delivers enough improvement over lexical/metadata lookup to justify adoption?
- Which model performs best for interview, story preparation, and live decisions? One model need not win every task.
- Does a free Groq account sustain the intended request sizes and frequency for a whole presentation?
- What local context size and model combination leave enough memory and responsiveness for speech, embeddings, and rendering together?
- Which artifact retrieval/generation tools and ingestion capabilities are needed by the first experience?

## Next action and evidence boundary

Run small comparative probes, inspect their results, then assemble a first connected version using a revisable baseline. Choosing or installing every candidate is not a prerequisite to starting. The sequence can change as questions become clearer; sequential tests are acceptable even where parallel experimentation is possible.

This research does not establish a best renderer, lowest-latency STT, best model, free production capacity, or working end-to-end product. Preserve source links and review dates, and recheck version-sensitive claims when running the probes. Supporting [speech notes](local_stt_implementation_plan.md), [inference notes](local_llm_implementation_plan.md), and [presentation-language notes](presentation_model.md) remain open research documents.

### OpenUI 1.0 refresh — 17 October 2026

The [updated evaluation](research/openui_evaluation.md) examines custom presentation
components, incremental edits, local inference and host validation. Add its scoped
comparison to the next adaptive-composition experiment alongside json-render;
no framework adoption or performance claim follows from documentation alone.
