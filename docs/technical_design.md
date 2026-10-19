# Potential Technical PRDs

> **Historical exploration map.** The active product is a native SwiftUI macOS app with a TypeScript/Node coordinator. Questions below record earlier exploration; architecture defaults and current implementation are documented in [current architecture](architecture/current.md).

16 October 2026 · Exploration map; no architecture or stack selected

The [product PRD](PRD.md) defines the desired experience. This document identifies technical questions that may deserve their own PRDs as we build. It replaces the earlier prescribed architecture, wire contracts, persistence choices, and renderer-first implementation sequence.

These areas may be combined, split, or discarded. They are not a list of services we must build.

## Interview and asset gathering

How should an interview agent elicit purpose, audience, narrative, and material needs through conversation? How does it coordinate uploads, retrieval, and artifact generation, and hand a usable brief and assets to the storyteller?

## Presentation storyteller and flow generation

A distinct presentation storyteller agent develops the flow from the interview brief and assets. A potential PRD should examine the reviewable story plan: narrative progression, talking points, artifacts, and visual directions. Storyboard and teleprompter are possible views, not settled names or required formats. Preserve the presenter’s ability to refine preparation and depart from it during delivery.

## Realtime presentation agent and conversational context

How can the system infer what someone wants to communicate from speech, the story plan, prepared assets/directions, other relevant insights, and the ongoing explanation? Investigate ambiguity, references to earlier content, corrections, topic changes, and the choice to do nothing.

A useful technical PRD would describe observed failure cases, required context, candidate approaches, and how we will assess useful decisions. It need not assume an agent framework or a particular transcript pipeline.

## Presentation generation and curation

How can we generate expressive visuals and manipulate existing material consistently? Explore the balance between reusable presentation primitives, generated layouts, richer generated content, and curated assets.

The current direction is an agent-driven generative UI engine with defined presentation components and composition mechanisms. json-render directly matches this pattern; A2UI is another declarative approach. They remain candidates rather than selected dependencies. Artifact generation may use other tools; it is distinct from generating the UI composition. Explore the mechanisms needed by a concrete experience before choosing a representation. See the [technology review](vision_and_technology_review.md) for sources and boundaries.

The [presentation-language notes](presentation_model.md) frame domain questions. They do not define an implementation catalog.

## Canvas behavior and continuity

How should visuals develop over time? Investigate spatial organization, transitions, attention, persistence, revisiting, and preservation of interactive content. Explore how much change audiences can follow and what kinds of presenter intervention feel natural.

A technical PRD should connect its state/lifecycle choices to observed interaction needs. A generic scene graph, event log, or surface manager should not be required before those needs are understood.

## Material and factual grounding

How should supplied and discovered material become usable presentation content? Explore extraction, retrieval, attribution, data transformations, source correction, and the boundary between illustration and factual claims.

Choose formats and storage from the material needed by experiments. Avoid requiring a Markdown narrative guide, a database, or a universal resource schema in advance.

## Speech and multimodal input

What inputs and timing enable useful adaptation? Explore live speech alongside explicit direction and contextual signals. [Speech research notes](local_stt_implementation_plan.md) identify questions for prototype work.

## Inference, responsiveness, and deployment

Which model/runtime arrangements deliver the required quality at an acceptable speed and cost? What benefits from preparation, prediction, caching, or local execution? How do generation and curation behave under real device constraints?

[Inference research notes](local_llm_implementation_plan.md) outline how to investigate. Language, framework, provider, process boundaries, and local/cloud placement remain open.

## Presenter control and audience output

What belongs in the presenter’s view, and what belongs in the audience’s view? Explore direct manipulation, voice direction, suggestions, recovery, display arrangements, and accessibility. Control names and state transitions should emerge from interaction testing.

## Reliability and external capabilities

As experiments add web content, media, or apps, define their availability, data exposure, execution boundaries, and failure behavior. The ability to display something does not imply permission to operate it. Decisions affecting privacy, paid services, or execution authority require explicit treatment when they become relevant.

## When to write a technical PRD

Create one when a concrete experience exposes a material technical decision or when work needs a shared problem definition. Keep it proportional to the decision:

- What user outcome or observed problem motivates it?
- What constraints are established, and which are assumptions?
- What alternatives could work, and what evidence is missing?
- What small implementation or research activity can resolve the uncertainty?
- What did we learn, what did we choose, and what would make us revisit it?

Record actual versions and test conditions when evaluating libraries. Keep claims about documentation, prototype behavior, integrated behavior, and user usefulness distinct. We do not need to complete every technical PRD before building.

## Current technology investigation

See [baseline technology research](baseline_technology_research.md) for the user-requested comparison of generative UI, local streaming STT, EmbeddingGemma, and self-hosted/Groq models. These findings refine the exploration map without selecting a final stack.

## Semantic retrieval and EmbeddingGemma

The [focused use-case decision](embeddinggemma_use_cases.md) establishes intended retrieval placements: interview material discovery, story-to-asset linking, live artifact retrieval, candidate story alignment, question-driven evidence lookup, and presenter search. Multimodal retrieval extends these to visual documents and recording segments. These entry points may share one implementation; no service topology is implied.

Prefer evaluating EmbeddingGemma 2 with only the required encoders. Compare against lexical/metadata lookup and the original text model where useful. Preserve artifact identity, revision, provenance, and page/time locations outside the vector representation. Combine semantic ranking with exact entity, date, unit, and access constraints. Use bounded document/media segments; the context window does not permit unlimited-file ingestion.

Model/runtime choice, precision, dimensions, chunking, score handling, and index storage remain implementation questions. Measure combined resource use with STT, inference, and rendering. A local embedding step does not make hosted downstream inference offline. Keep candidate retrieval separate from reasoning, factual verification, and stage commits.

Clustering, near-duplicate suggestions, intent routing, predictive preloading, and semantic caching require targeted evidence before adoption. The dedicated use-case document records exclusions and source-backed caveats, including precision and deployment-specific memory measurements.

## First runtime implementation

The user agreed to begin with TypeScript/React, Node coordination, and isolated Python/native model execution. The [runtime probe](runtime_probe.md) records the implementation, process-isolation measurements, setup, and limits. Rust/Go are not initial dependencies; native integration or measured bottlenecks could justify revisiting them. Desktop host, generative renderer, and complete AI stack remain open.

## Agent orchestration and handoffs

The interview, storyteller, and realtime presentation agents are separate agents. Additional specialists remain possible. Define each agent’s responsibility, relevant context, tools, and output as it becomes concrete. Shared model/runtime infrastructure is compatible with that separation; OS process boundaries should follow isolation and workload needs.

Explore feedback between agents, user revisions, missing-asset requests, handoff freshness, and background preparation during live delivery. Preserve a coherent active presentation when preparation changes. Avoid calling the whole agent chain for every transcript update or loading every model concurrently by default. The runtime probe contains no agent implementation yet and does not validate this orchestration.

## Agent implementation and LiveKit review

The [framework and LiveKit assessment](agent_framework_and_livekit.md) records the provisional AI SDK choice, typed messages, two feedback loops, local endpoint setup, alternatives, and limits. Interview/storyteller preparation is implemented as a bounded slice. Realtime reasoning and autonomous background coordination remain pending. LiveKit is a candidate media/session layer, not adopted infrastructure. This refines earlier open framework notes without locking future orchestration.


## Prepared content and simplified workflow update — 16 October 2026

See [latency/prepared content](latency_and_prepared_content.md) for cache layers,
revision invalidation, EmbeddingGemma candidate retrieval and experimental latency
budgets. See [materials/visual tools](materials_and_visual_tools.md) for the local
MarkItDown ingestion boundary, Mermaid/Recharts tool schemas, snapshot loading and
UI changes. Exact repeated-speech caching is implemented; semantic retrieval and
semantic decision caching remain experiments, not silently enabled defaults.
