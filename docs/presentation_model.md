# Exploring Omnipresent’s Presentation Language

16 October 2026 · Defined-vocabulary direction; catalog contents remain open

Omnipresent’s generative UI engine will use a defined vocabulary of presentation components and supported compositions. An agent response directs how that vocabulary is used for the current explanation. We will discover the actual components, combinations, and behavior contracts by designing, building, and observing presentations. This note replaces the earlier fixed catalog and predetermined behavior semantics.

## What might the canvas express?

Useful forms may include text, images, charts, diagrams, quotations, media, code, and live experiences. Useful relationships may include comparison, sequence, connection, hierarchy, annotation, and focus. Useful behaviors may include reveal, emphasis, rearrangement, zoom, transition, and revisiting.

These are possibilities, not an exhaustive vocabulary or required component list. The defined catalog can include reusable primitives and richer surfaces that display generated media or specialized visualizations. Generating an artifact and composing its presentation are distinct capabilities. We should retain freedom to find better forms within an evolving, explicitly supported vocabulary.

## Questions to investigate through making

- What visual form clarifies a particular idea for a particular audience?
- What should be composed in advance, and what benefits from being created live?
- How should an explanation develop without losing its context?
- How can comparison be clear without forcing everything into the same template?
- How can the presenter retain or change something naturally?
- When does motion help, and when does it distract?
- How do the same ideas work at different scales, densities, and viewing distances?
- How should evidence, uncertainty, and illustrative content appear?

## Examples to sketch and try

A process explanation might unfold through a diagram, a sequence of illustrations, an animation, or another representation. Try alternatives and observe what the audience understands.

A data story might move between a chart, a focused detail, and a comparison. Explore how a spoken correction changes the material without implying certainty about ambiguous quantities or periods.

A live demonstration might coexist with explanatory context or temporarily take over the canvas. Learn what needs to persist and what the presenter needs to recover.

None of these examples selects the first milestone. Choose an example that is useful and exposes an important uncertainty in the current work.

## How a vocabulary becomes established

Capture successful and unsuccessful compositions, the speaker’s intention, what the audience saw, and the resulting observations. Introduce reusable components when repeated needs or implementation experience justify them. Define contracts as those components become real, and revise them when they restrict useful expression.

Cerebro’s architectural research can inform how generation and application behavior interact. Its coding components and workspace conventions do not define Omnipresent’s presentation language.

## Current candidate research

The [baseline technology review](baseline_technology_research.md) records current candidates, sources, limitations, and proposed comparisons. See its “Generative UI: compare the right layers” section. These are documentation-based recommendations pending experiments, not finalized technology choices.

## Retrieval and visual expression

EmbeddingGemma can help find an artifact for the current explanation or connect a story point to useful material. With v2, the candidate may be an image, a visual document page, or a moment in a recording. The generative UI engine still chooses and renders supported presentation components and compositions; the embedder does not design the layout.

A visually similar chart or diagram may contain different facts. Keep source references, periods, units, and interpretation available to the agent and relevant validators rather than treating visual similarity as correctness. The [EmbeddingGemma use-case decision](embeddinggemma_use_cases.md) separates intended retrieval uses from experimental classification and organization features.
