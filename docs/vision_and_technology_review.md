# Product Vision and Technology Review

16 October 2026 · Conversation record and documentation-based assessment; no implementation or integration validation

## Product direction as described

Starting a new presentation opens a conversation with an interview agent. It asks questions regarding the presentation. The user uploads artifacts, or the agent fetches or generates artifacts based on that conversation. At the end, the system shows a storyboard, teleprompter, or similar reviewable presentation guide; the exact name and form are unsettled.

During delivery, the assets and directions from preparation, user speech, and other insights inform what to show at a given time. A generative UI engine has a defined set of presentation components and ways of composing them. The UI is generated from the agent’s response using that vocabulary.

This clarifies the product without selecting a framework or fixing the catalog. The user’s ongoing direction is to build and research iteratively and discover suitable technology during that journey. Omnipresent’s components and UI are specific to presentations; Cerebro is a reference for architectural ideas, not a source of coding-agent components.

## Three distinct outputs

1. **Presentation/story plan:** the intended message, narrative progression, talking points, and visual directions.
2. **Artifacts:** the actual text, data, images, diagrams, media, or other supplied, fetched, or generated material.
3. **Live composition:** the presentation assembled for the current moment from that material and the supported visual vocabulary.

These distinctions explain responsibilities, not a mandatory database schema or service split. Preparation and live direction may use shared agent infrastructure.

**Story plan** is a provisional umbrella term. A storyboard previews visual progression; a teleprompter displays speaking text. Both could be views of one plan. Whether users need an outline, speaking notes, visual previews, a full script, or a combination requires exploration. The plan should support improvisation rather than require exact script matching.

## Technology mapping

| Product need | Documented technology fit | Omnipresent work still needed |
| --- | --- | --- |
| Interview and collaborative preparation | AI SDK documents conversational tool execution and associated UI rendering. | Interview strategy, context, adaptive questions, and readiness for review. |
| Upload, fetch, and generate artifacts | Agent tools can coordinate operations; the reviewed generative UI libraries are not artifact-generation services. | Upload handling, actual retrieval/generation tools, storage, attribution, and user review. |
| Reviewable storyboard/speaking guide | Structured content and application components can represent a plan. This is an engineering assessment, not a documented turnkey presentation feature. | Plan model, editing experience, links between narrative/assets/directions, and views. |
| Speech/context-driven live direction | Declarative UI and event mechanisms supply useful pieces, but no reviewed source establishes this complete experience. | Speech integration, intent tracking, deviation handling, context signals, selection, and timing. |
| Agent response → generated canvas | json-render directly supports catalog-constrained component selection, arrangement, bindings, and actions. | Presentation vocabulary, component implementation, visual quality, domain validation, and continuity. |

## Candidate roles and sources

### AI SDK: conversational and tool-driven interaction

The [generative UI guide](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces) demonstrates model tool calls with application execution and corresponding React UI. This supports the interview/tool pattern in principle. It does not supply an Omnipresent interviewer, artifact pipeline, or storyboard product. Its example maps tool results to UI; that alone does not establish freely generated whole-canvas composition.

### json-render: component-catalog composition

The [introduction](https://json-render.dev/docs) describes defining typed components/actions, generating a constrained specification, and rendering through registered implementations. It supports composition, state bindings, conditional visibility, and standalone as well as inline generated UI. This is the closest direct match among the reviewed sources for the proposed presentation engine.

The [streaming guide](https://json-render.dev/docs/streaming) documents incremental JSONL patch updates. Streaming availability does not decide when a change should appear to an audience. Omnipresent must still validate and schedule meaningful changes and preserve ongoing interaction.

A defined vocabulary need not mean fixed slides or moving complete prewritten panels. It can allow varied content selection, grouping, representation, emphasis, and supported interactions. The inventory should evolve through the presentations we build. Exact package/API compatibility remains to be checked in a real prototype.

### A2UI: alternative declarative representation

The [architecture overview](https://a2ui.org/concepts/overview/) separates streaming UI messages, declarative components, and application data binding. It is an alternative worth evaluating if client interoperability becomes relevant. It does not establish an optimal presentation layout, factual correctness, or timing policy.

### AG-UI: optional agent/frontend communication

The [overview](https://docs.ag-ui.com/introduction) describes an agent/user interaction protocol. Its potential role is communication of agent activity and state, distinct from the presentation component renderer. It is not required merely because the product uses agents. These technologies are not a bundle we must adopt together.

## Assessment and limitations

The envisioned flow is technically plausible and aligns with documented building blocks. The generative canvas pattern has direct support; the interview-to-plan workflow and live judgment remain application/product development. This is documentation-based fit, not a tested end-to-end architecture or a claim about local performance.

Important distinctions to preserve while building:

- Fetching or generating an artifact differs from composing its presentation.
- A valid component tree does not prove that data, quotations, comparisons, or interpretations are correct.
- Incremental output does not guarantee good audience-facing timing. A candidate may need to wait, remain private, or be discarded when intent changes.
- A fixed vocabulary can support varied presentations; the vocabulary itself need not be permanently frozen.
- A story plan supplies direction but should not prevent departure from the prepared narrative.
- “Other insights” is intentionally open. No particular sensing, audience monitoring, or data collection is implied.
- Agent responsibilities do not dictate a multi-agent framework or process architecture.
- Renderer support does not demonstrate accessible visual craft, seamless live media continuity, useful local latency, or audience comprehension.

## Possible experiment

Connect a short interview to a small set of artifacts and a reviewable story plan, then use that preparation and speech to direct a small generated canvas. Test whether preparation supplies enough direction while allowing improvisation. Manual/replayed inputs can isolate parts of this question, provided the demonstration identifies them accurately.

This was recommended as a revealing experiment, not approved as a rigid first milestone. Frameworks, speech technology, providers, catalog contents, deployment, and quantitative targets remain open. Record actual versions, conditions, and results when implementation begins.

## Outstanding questions

- What should the interview ask, and how does it know enough has been gathered?
- How does the user review and revise fetched/generated artifacts and story direction?
- What should the plan contain, and which views make it useful?
- How do plan/artifact edits remain consistent with each other and live delivery?
- What signals help the live agent beyond speech and prepared context?
- Which components and combinations provide expressive, high-quality presentations?
- How should live decisions balance relevance, timing, continuity, and control?
- What local, remote, privacy, connectivity, and cost arrangements suit actual use?

The [PRD](PRD.md) carries the current product direction. The [technical exploration map](technical_design.md) identifies potential focused PRDs, and the [working approach](implementation_plan.md) preserves iterative building and research.

## Subsequent EmbeddingGemma placement decision

Further research using the user-supplied notes identified semantic retrieval placements across the interview, story plan, and live explanation. These include artifact discovery, story-to-asset linking, contextual retrieval, candidate story alignment, question-driven evidence lookup, and presenter search, with direct visual/media retrieval where relevant.

The [focused decision](embeddinggemma_use_cases.md) preserves the original notes, primary sources, examples, qualifications, exclusions, and experiment proposal. EmbeddingGemma 2 is preferred for multimodal exploration, pending runtime and quality validation. Secondary classification, clustering, deduplication, preloading, and caching remain experiments; the agent and stage retain judgment and timing responsibilities.

## Agent separation clarification

The user clarified that the interview agent gathers context/assets, a separate presentation storyteller generates the flow, and a separate realtime presentation agent directs the generative UI as the user speaks. More agents may be needed between these stages. This supersedes any implication that one preparation agent owns both interviewing and storytelling, or that the product is a single agent spanning preparation and presentation.

Agent responsibility is distinct from model choice or process isolation. Extra specialists, orchestration, feedback loops, and handoff formats remain to be discovered through implementation. See the [PRD agent responsibilities](PRD.md#agent-responsibilities).
