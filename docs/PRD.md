> Current implementation baseline: [evidence-first adaptive presentation](architecture/baseline.md), with Mermaid architecture diagrams, model interfaces, defaults and retired paths.

# Omnipresent — Product Requirements

Version 0.5 · 16 October 2026 · Living product direction

## Product vision

Omnipresent is a presentation canvas that understands the intent of a person communicating and generates or curates visual material in real time to help them explain it.

A speaker should be able to develop an idea, follow an unexpected question, compare alternatives, or demonstrate something without continually translating that intent into manual presentation operations. The canvas should feel like a capable visual co-presenter: attentive to the explanation, useful at the right moment, and easy to direct.

“Modern presentation” is an ambition for the quality of communication, visual craft, and interaction. We will discover its specific expression through design and use. The product is free to combine prepared material, generated explanations, visualizations, media, and live experiences.

## Problem to understand

Preparing and delivering a presentation involves several kinds of work: organizing an argument, finding supporting material, designing visuals, navigating them, and responding to the audience. These tasks can compete with the act of explaining.

Prepared sequences support rehearsal but can become awkward when the conversation changes. Improvisation supports responsiveness but makes finding and arranging useful material harder. Automatically changing a canvas introduces another risk: the system may misunderstand, distract, or reveal the wrong thing.

Our hypothesis is that intent-aware generation and curation can reduce this coordination burden while improving the audience’s understanding. This needs observation and testing; we do not yet know where automation helps most.

## People and situations

Promising situations include an educator explaining a concept, a presenter developing a data story, someone comparing choices, and a technical speaker moving between explanation and demonstration. These are research starting points, not fixed personas or exclusive markets.

We should learn from both sides of the experience:

- The presenter needs to think, communicate, improvise, and retain control.
- The audience needs to understand the point, see relevant evidence, and stay oriented.

The first experiments may deliberately narrow the setting. Their limitations should remain properties of those experiments rather than permanent product restrictions.

## Desired experience

### Start with an interview

Starting a new presentation opens a conversation with an interview agent. The agent asks about the presentation and develops an understanding of what the person wants to communicate. Questions may address purpose, audience, key ideas, duration, tone, and available evidence; their order and depth should adapt to the conversation rather than follow a fixed questionnaire.

The person can upload artifacts. Based on the conversation, the agent can also fetch or generate material. Preparation is a collaborative process: material and proposed direction can be inspected, corrected, and refined as the discussion develops. Specific tools, source access, generation providers, and supported file types remain open.

### Develop and review the presentation flow

A separate **presentation storyteller agent** uses the gathered context and assets to generate the presentation flow: the story arc, progression of ideas, talking points, and directions for visual material. It can identify missing material or context and request further preparation.

Omnipresent then shows a reviewable account of the presentation’s story and supporting material. **Story plan** is a working name. A storyboard could preview visual progression; a teleprompter could show speaking text. They may become different views of the same preparation, with the exact interface to be discovered.

The plan connects the intended message, narrative progression, talking points, artifacts, and visual directions. This is a product-level description, not a frozen schema or required script. The presenter should be able to shape it before going live. How much detail or review is useful remains a research question.

### While presenting

The person speaks naturally. The system uses prepared assets and directions, the story plan, current speech, and other relevant insights to decide what should appear at a given time. What those additional signals are, how they are obtained, and whether they are useful remain open research questions.

A live presentation agent directs the response. A generative UI engine turns that response into a composition using a defined set of presentation components and supported composition mechanisms. It may bring forward existing material, create a new visual arrangement, emphasize something already visible, connect ideas, or keep the current view. The specific catalog and component contracts will evolve through building and research.

The system should understand more than isolated keywords. It should account for the thread of the explanation, the material available, what is already visible, and corrections to earlier intent. It should support deliberate direction as well as implicit intent; hands-free operation is useful when it serves communication.

### When the conversation changes

A question or new idea can take the explanation in another direction. Omnipresent should help the presenter follow it and later recover useful context. Uncertainty should lead to understandable behavior rather than confident invention or disruptive visual churn.

### When the presenter intervenes

The presenter can stop, redirect, retain, change, or revisit material. The exact controls and their semantics are design questions. Whatever the interface, intervention should be quick and its effects predictable.

## Capabilities to develop

| Capability | Product outcome |
| --- | --- |
| Conduct a preparation interview | Develop presentation goals and direction through adaptive conversation. |
| Assemble artifacts | Combine uploaded, fetched, and generated material around the conversation. |
| Produce a reviewable story plan | Connect narrative, speaking guidance, artifacts, and visual directions. |
| Understand communicative intent | Recognize what the person is trying to explain and whether a visual response would help. |
| Generate useful presentation material | Create representations that clarify the current idea, with appropriate visual quality and detail. |
| Curate available material | Select, arrange, emphasize, and connect prepared or previously generated content. |
| Develop an explanation over time | Support progression, comparison, context, and meaningful transitions without requiring a fixed sequence. |
| Support preparation and improvisation | Let prepared and spontaneous communication work together. |
| Preserve presenter agency | Make it easy to influence the system and recover from misunderstanding. |
| Handle factual material responsibly | Preserve meaning, attribution, quantities, and distinctions between evidence and illustration. |
| Recover gracefully | Keep the experience usable through missing material, slow generation, misunderstanding, or technical failure. |

The interview → story plan and artifacts → live direction → generated canvas flow is the current product direction. A defined presentation component and composition vocabulary is part of that direction; its contents, protocol, libraries, and implementation remain open. The interview agent, presentation storyteller agent, and realtime presentation agent are distinct agents with separate responsibilities and context needs. Additional specialist agents may support them as the work demands. They may share models or runtime infrastructure; agent separation does not require separate OS processes.

## Agent responsibilities

| Agent | Purpose | Handoff |
| --- | --- | --- |
| Interview agent | Gather presentation context, goals, constraints, and assets through conversation; coordinate uploads and requests to fetch or generate material. | Presentation brief, available assets, user preferences, and unresolved questions. |
| Presentation storyteller agent | Turn the gathered material into a coherent presentation flow, including narrative progression, talking points, and visual directions. | A user-reviewable flow linked to supporting assets; missing-material requests when needed. |
| Realtime presentation agent | Follow the user’s speech, presentation flow, available assets, and relevant context to decide what to show as the user speaks. | Presentation decisions and composition instructions for the generative UI engine. |

The generative UI engine realizes the realtime agent’s directions using supported presentation components and compositions. Whether composition planning needs its own specialist agent remains open. Research, retrieval, extraction, asset generation, and review may also warrant specialist agents; their number and arrangement will follow actual needs.

These handoffs are conceptual outputs, not frozen schemas or a rigid one-way pipeline. User edits, missing evidence, and new goals can send work back to an earlier agent. Separate agents need not run concurrently, and the live path should not wait for every preparation agent on each speech update.

## Quality bar

**Canvas simplicity is a requirement.** The UI must feel like a clean, sleek canvas. Keep supporting controls unobtrusive and avoid dashboard layouts or permanent diagnostic panels competing with the presentation. This applies to prototypes as well as the eventual product; the exact visual language remains open.

**Communication first.** A response should make the intended point easier to understand. More visuals and more automation are not inherently better.

**Visual craft.** Typography, composition, imagery, motion, and information density should suit the audience and setting. The canvas should support rich expression without becoming cluttered or generic.

**Timing and continuity.** Useful material should arrive when it helps. Changes should preserve orientation and leave enough time to understand what is shown. Sometimes the best response is no change.

**Trust.** Factual content should be supportable and correctable. Generated illustration should not masquerade as verified evidence. The presenter should be able to understand what material the system is using.

**Control.** Automatic behavior should remain steerable. Recovery should not require the presenter to debug the system in front of an audience.

**Accessibility.** The experience should accommodate readable presentation at a distance, different abilities, and different display conditions. Specific interaction and visual requirements should be tested in the settings we pursue.

## Illustrative moments

- While explaining a process, the speaker introduces one relationship at a time and the canvas develops a coherent visual explanation.
- While discussing growth, the speaker shifts to retention and the canvas helps reveal how the two measures differ without implying unsupported causality.
- When asked to compare alternatives, the presenter brings relevant evidence together rather than navigating a prepared sequence.
- During a demonstration, the canvas helps connect what is happening to the explanation and preserves the ability to return to the broader story.

These examples help us discuss the product. They are neither mandatory templates nor a fixed development sequence.

## How we will judge progress

Look for evidence that presenters can communicate with less coordination effort, follow unexpected turns, and recover from errors. Look for evidence that audiences understand the intended point and remain oriented.

Observe relevance, timing, clarity, factual mistakes, unwanted changes, presenter interventions, and perceived control. Measure responsiveness and reliability in the actual experience. Define quantitative targets when experiments establish useful measurement boundaries and an acceptable baseline; previous latency and accuracy numbers are not release commitments.

A polished demo, schema-valid output, or technically successful generation does not by itself establish product usefulness. Separate prototype behavior, integrated behavior, and observations from real use.

## Open product questions

- Which situations benefit most from intent-aware presentation?
- How should the interview adapt, and when has it gathered enough information?
- How much preparation is useful, and what should users be able to edit?
- Which story-plan views help most: visual storyboard, outline, speaking notes, teleprompter, or a combination?
- How should edits to artifacts and narrative directions remain consistent?
- Which additional insights improve live decisions beyond speech and prepared material?
- How expressive should the component/composition vocabulary be, and how should it evolve?
- How should implicit understanding and explicit direction work together?
- When should the system generate, retrieve, rearrange, or remain still?
- What makes a visual response understandable and trustworthy?
- Which controls provide confidence without distracting the presenter?
- How should the experience work across displays and presentation settings?
- What privacy, connectivity, portability, and local-execution expectations matter to users?

Local-first operation remains a preference worth exploring. Exact offline guarantees, model hosting, supported devices, and acceptable data handling are unresolved product/technical decisions. An experiment using another arrangement should make that arrangement explicit rather than silently changing the product promise.

## Development posture

Build, use, research, and revise together. Choose the next experiment for what it can teach us or make useful. Elaborate technical PRDs when a concrete problem needs them, and adopt technology when its suitability is demonstrated.

The [vision and technology review](vision_and_technology_review.md) preserves the product clarification, technology mapping, limitations, and possible experiment.

Cerebro provides a reference for generative UI architecture, but Omnipresent’s presentation language and experience are its own. No coding-agent UI, component vocabulary, runtime, or layout is inherited.

## Semantic retrieval across the experience

EmbeddingGemma is the candidate semantic retrieval capability for finding useful material throughout the presentation journey. Its intended placements are:

- During the interview, suggest relevant uploaded or otherwise available artifacts as the conversation develops.
- During story preparation, associate narrative points with candidate artifacts and supporting passages.
- During delivery, retrieve material from the current explanation and shortlist relevant story points despite paraphrasing.
- During questions or deviations, find supporting evidence beyond the current visual or prepared sequence.
- Through presenter search, find earlier material by meaning, with media search for images, visual documents, and recording segments where useful.

These placements define the intended role, not separate required services or a fixed implementation sequence. EmbeddingGemma 2 is preferred for initial exploration of multimodal retrieval; its runtime, configuration, quality, and local performance remain to be validated. The original text model can serve as a comparison or fallback.

The live agent retains responsibility for interpreting intent and choosing a useful response; presentation timing and presenter control remain application responsibilities. Retrieval similarity does not verify facts, establish story coverage, or authorize a visual change. Clustering, near-duplicate suggestions, intent classification, preloading, and semantic caching remain secondary experiments.

See [EmbeddingGemma use-case decision](embeddinggemma_use_cases.md) for source evidence, examples, technical qualifications, and the proposed evaluation. This adds a candidate technology placement without fixing the rest of the stack.

## Continuous agent collaboration

Preparation and presentation are interacting feedback loops rather than a one-way sequence. The storyteller can request missing context or material from preparation; presenter corrections can revise the brief and flow. During delivery, the realtime agent should be able to request background help while continuing from a coherent reviewed flow. Updated material or flow is a candidate revision, not permission to overwrite what is currently being presented.

Communication must preserve who requested work, which context/revision it used, artifact references, unresolved questions, and the recipient expected to act. User review, cancellation, stale-result rejection, and visible progress matter alongside the agents’ prompts. Continuous listening does not imply continuous model calls or running every agent on every speech update.

The [agent framework and LiveKit review](agent_framework_and_livekit.md) records the current implementation boundary and media/orchestration distinction.


## Accepted workflow and latency direction — 16 October 2026

The latest user direction supersedes earlier agent/material tabs and manual editor
wireframes: one interview conversation with a paperclip attachment icon inside its
composer; complete the interview, generate the story, and revise the flow only by
chatting to the agent for now. Separate agents remain an implementation detail.
Canvas offers loading a previously saved story and a Start presentation action.
Speech-model loading is automatic, with essential Pause/Resume/End controls while
running. No canvas composer, model loader or diagnostics drawer belongs in this
presentation experience.

Non-text materials (PDF/Office/images) and agent-generated diagrams/charts use
existing conversion/rendering libraries. Expensive source processing and visual
generation belong primarily in preparation. The live path should retrieve approved
content, decide ordering/composition/reveals, and use generative UI to display it.
Caching and semantic retrieval over prepared assets are core optimization directions;
not every spoken phrase should require a new large-model generation. Do not equate
semantic similarity with permission, factual reliability, or narrative timing.

Implementation details and current limits:
[materials and visuals](materials_and_visual_tools.md),
[latency strategy](latency_and_prepared_content.md).


## Project sessions and story selection — 16 October 2026

Multiple preparation projects each retain their own chat and materials. A new
project starts with the prepare agent. Canvas opens a card gallery of saved stories
from those projects. Selecting a card opens an opening-scene preview or blank
presentation surface; only Start begins presentation and microphone capture.
Saved snapshots remain independent of later project edits. See
[project sessions](projects_and_story_library.md) for implementation and limits.

## Implementation clarification — 17 October 2026

The story preview is a view of the prepared narrative plan and its assets. Delivery
should compose and curate content according to speech and context, including
comparisons, emphasis, progressive explanation, revisits and deliberate holds.
Prepared-scene selection is a useful fallback, not the intended product boundary.
The [adaptive spoken trial](adaptive_presentation_trial.md) tests a small version
of that behavior; its current components and renderer choice remain experimental.

## Local presentation economics

19 October 2026: ordinary live retrieval, selection and composition should run locally without requiring per-change API payments. Hosted decisions may be an explicit optional enhancement or comparison, never a silent paid fallback. Small models and quantization are evaluated against decision quality, total device memory and full-path latency; an always-hold or inaccurate local model does not satisfy this goal. See [candidate research and actual local probe](research/local_decision_direction.md). This is product direction; the hosted development default has not yet been replaced by a quality-qualified local candidate.

### Local-selection implementation checkpoint

19 October 2026: the [local selection baseline](architecture/local-selection.md) is implemented as the normal presentation default. Host eligibility, local EmbeddingGemma/BM25 preference and deterministic composition operate without required billed LLM/System One calls. Hosted models remain explicit experiment profiles with no automatic fallback. Development replay quality is preserved; independent natural-speech acceptance remains open.
