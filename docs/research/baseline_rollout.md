# Baseline rollout and product UI validation

17 October 2026 · EXP-039/040 · Integration and browser observations, not production acceptance.

## Change

[ADR-016](../decisions/ADR-016.md) adopts the [modular evidence-first architecture](../architecture/baseline.md) as the default local runtime. The coordinator uses local text EmbeddingGemma 2, BM25/RRF, evidence/intent gates, useful registered decision-model classes and default hosted Clef-omni. The old general-LLM canvas director and old slide/beat director are removed. Preparation and storytelling still use the configured local language model; speech remains isolated Moonshine Small Streaming.

The user authorized discarding incompatible stories instead of migrations. Old story snapshots without approved evidence contracts are filtered out; uncontracted story drafts are cleared while conversation/material sessions remain. New generation creates contracts on the host and presenter save records approval. Source identity and declared coverage do not establish independent review or audit status. The local default permits presenter-reviewed pending-independent-review contracts; strict independent review remains configurable.

Useful registered decision adapters: Clef-omni, Clef-flash, Clef, Jev and local Laya. Microsoft/Kev IDs and their prior evidence remain documented without active registrations. Both bounded renderer adapters remain useful. Native model-generated UI syntax is not reintroduced. Historical failed provider/model screens are not deleted or relabeled.

## Actual coordinator test

[Latest websocket replay](../validation/runs/RUN-20261017-baseline-live-v3/live-baseline.json) and its input/source snapshots exercise the real coordinator, local EmbeddingGemma and hosted Clef-omni with public-source text. [The first integration replay](../validation/runs/RUN-20261017-baseline-live-v1/live-baseline.json) remains a separate initial observation.

The default load reports evidence-v1/Clef-omni. A supported water-cycle explanation selects the correct prepared reference. An unsupported audit request keeps that reference and sends feedback only to the originating preparation project. A quoted microphone-check request holds. Pause/stop complete without stale commits. Inference timing is retained per observation; a cold first decision includes catalog encoding and hosted transport. This is a three-case integration check, not a repeated latency benchmark. Per-request provider billing/raw model response was not separately retained in this coordinator probe; do not infer zero cost or compare it as a model-selection benchmark.

## Actual browser flow

An in-app browser session at localhost was used for an actual local-Qwen interview and story generation. The conceptual demo asks for a five-minute teacher introduction to solar generation/storage with no numerical claims. The user supplies a water-container analogy. The storyteller ultimately produces two beats and a reusable conceptual diagram. The host creates illustrative contracts with independent review pending. Save succeeds; reload retains the story, session and unsent composer draft; the test draft is then cleared. Canvas shows one story card; selecting it opens a clean preview and Start presentation action.

No physical microphone permission was requested or audio captured. The start-ready view is observed, while actual presentation decisions are tested separately over the websocket. The browser data is synthetic demonstration content, not the user's real material acceptance set.

Preparation trials exposed real failures before the successful run:

- An empty-material session exposed a readArtifact tool, allowing the model to invent a material ID. That tool is now absent when there are no materials; otherwise its schema enumerates supplied IDs.
- The storyteller was asked to serialize host-owned evidence fields. The tool now accepts a lean story draft; the host constructs hashes/contracts. Artifact references are enumerated, or constrained to an empty array when no materials exist.
- Tool-only successful completions were rejected for lacking conversational text. A committed flow now gets a deterministic concise confirmation; empty no-action output remains an error.
- Optional material/analogy questions could be repeated without seeing the interview answer. Storytelling now receives bounded user interview context, and duplicated requests are suppressed in the UI.
- Storytelling must invoke a preparation tool and stops after a flow or explicit context request. It cannot simply print a purported flow instead of saving it.

[Schema failure log](../validation/runs/RUN-20261017-baseline-ui-v1/preparation-schema-failure.log), [reference failure log](../validation/runs/RUN-20261017-baseline-ui-v1/preparation-reference-failure.log) and [successful direct-model diagnostic](../validation/runs/RUN-20261017-baseline-ui-v1/preparation-success.log) retain bounded synthetic evidence from these local trials. Some browser attempt details remain observations rather than complete provider traces. The final UI success followed a later host-schema fix; do not treat earlier logs as identical source runs or independent holdout data.

## Product design and geometry

The workspace has one fixed app shell, optional session sidebar, a conversation and story side by side, an anchored composer with in-box attachment control, and an anchored Save action. Story evidence is available in expandable details. The library uses consistent cards with contextual removal. The presentation room contains only navigation, the selected content and Start. Model selectors remain in the separate experimental trial view, not the normal product flow.

Rendered geometry checked at 1280×800, 900×700 and 600×700:

- No document horizontal overflow. At 600px, the story pane's scroll width equals its client width.
- Desktop composer/save bottoms: 780px in an 800px viewport. At 900×700 both remain at 680px.
- Actual wheel scrolling moves story content to scrollTop 598.5px while body scroll remains zero and composer/save bottoms stay 680px.
- At 600×700, chat spans x12–294 and story spans x306–588; both remain visible side by side, with composer bottom 688px.
- Sidebar visibility and an unsent draft survive reload. The test draft was cleared after verification.

[Desktop Prepare](../validation/evidence/baseline-prepare-desktop.png), [900px Prepare](../validation/evidence/baseline-prepare-900.png), [600px Prepare](../validation/evidence/baseline-prepare-600.png), [library](../validation/evidence/baseline-library.png), and [presentation-ready canvas](../validation/evidence/baseline-presentation-ready.png) are screenshots of the observed demo, not semantic or latency judgments.

## Mermaid and software verification

All four diagrams in the baseline document rendered successfully in a temporary browser preview using the installed Mermaid package: four SVGs, no diagram error icons. Direct Node parsing initially failed because DOMPurify required a DOM; that environment error was resolved by browser rendering, not by weakening runtime sanitization. The temporary app preview page was removed afterward; the source artifact remains under output/baseline-review.

The final software audit records tests, type checking, build output and source hashes. Obsolete director tests were retired and new default selection, model registry, evidence generation, no-migration behavior, invalid references and tool-boundary tests added. This audit does not rerun hosted models, natural-speech capture or independent source review.

## Remaining limits

The newly integrated story-local scope resolver and generated contract metadata have new integration coverage, not an independent quality study. The bounded alias interpreter can over-abstain; compatible multi-component composition, intelligent reveal and spontaneous speech need further work. Generated source bindings are declared coverage, not proof that every statement follows from an uploaded source. Natural speech, independent claim review, real media and audience-visible timing remain the [acceptance gate](real_library_acceptance.md).
