> **Historical plan.** This browser-era plan is retained for context; the product now uses native SwiftUI on macOS. For active setup and architecture, use the [macOS guide](desktop-macos-alpha.md), [current architecture](architecture/current.md) and [roadmap](roadmap.md).

> Latest testing direction: [preference quality and real speech failures](research/preference-quality.md). Small reranker latency is viable, preference quality does not improve, and split final transcripts/intent recognition block the positive audio path. Keep hybrid default; address that boundary before promotion or browser latency acceptance.

> Current local selection runtime: [host eligibility and bounded local preference](architecture/local-selection.md). Default remains local hybrid; native classifier preference is an explicit, deadline-bounded experiment with local fallback and feedback to Prepare.

> Current implementation baseline: [evidence-first adaptive presentation](architecture/baseline.md), with Mermaid architecture diagrams, model interfaces, defaults and retired paths.

> Evidence gate: [EXP-037](research/evidence_gate_results.md) passed authored development quality and repeated decision-path latency gates. [Evidence contracts](evidence_contracts.md) now validate complete claims and scope; [selected source starter](research/source_backed_review.md) awaits independent review/natural speech before live integration.

> Cue policy experiment: [EXP-035](research/cue_policy_results.md) reduced inference and repeated median/p95 on constructed exact-cue cases, but exposed four shared grounding failures. Absolute evidence quality blocks live promotion; claim coverage and natural-speech review come next.

> Larger-library result: [EXP-033](research/large_library_results.md) preserved authored selection/missing-evidence labels on 432 constructed assets, but failed repeatable p95 improvement. [Next direction](research/library_policy_direction.md): grounded cue bundles and minimum-change policy; no live-default promotion.

> Composition research: [practical presentation policies](research/common_sense_composition.md) identifies eligibility, cue bundles, compatible templates and minimum-change composition as the next baseline to benchmark before expanding model comparisons. Research/planned only.

> Pipeline experiment update: [EXP-031/032](research/prediction_first_results.md) compare hybrid-first exact selection, current-context family routing and prior-context prefetch. Clef remains on OpenRouter per user storage preference; priors do not authorize visible changes.

> Decision-model update: [Cloudflare Clef evaluation](research/cloudflare_clef_results.md) promotes raw semantic shortlisting plus Clef-omni as the next integration candidate. Independent labels, repeated timing and asynchronous FSM/feedback validation precede live-default migration.

> Retrieval update: [EXP-024/025](research/semantic_retrieval_results.md) now measure EmbeddingGemma 2 plus bounded Jev/Laya selection. Explicit missing-content handling and independent labels precede live integration.

> Controller comparison update: [EXP-022](research/controller_comparison.md) is complete offline. Candidate retrieval and independent validation remain the next gates; no live-default migration occurred.

> Current test evidence and component selection status: [validation and decision records](validation/README.md) (audited 17 October 2026). Historical milestones below are not independent current validation.

# Building and Researching Omnipresent

16 October 2026 · Working approach; no fixed milestone sequence

Develop the product through making, using, research, and revision. The [PRD](PRD.md) supplies direction; the next useful experiment supplies concrete scope. Research and implementation can happen together rather than in separate prerequisite phases.

## Choose the next useful question

An iteration may explore a visual interaction, build a usable capability, compare technical approaches, or observe someone presenting. Favor work that produces something reviewable and resolves a meaningful uncertainty.

Possible starting points include a compelling canvas interaction with manual input, a speech-driven reveal, generation from supplied material, or a presenter walkthrough using a rough prototype. A data story is one option, not the prescribed first slice. We do not need a complete speech, inference, storage, and rendering stack to start learning.

A newly clarified possible experiment connects a short interview to uploaded/fetched/generated material and a reviewable story plan, then uses that preparation and speech to drive a small generated canvas. It would test whether preparation gives live presentation enough direction without preventing improvisation. This is a recommendation to consider, not an imposed milestone or selected stack.

## Keep each iteration concrete

State the experience or question, make the smallest useful implementation, try it under relevant conditions, and record what happened. Use mocked or replayed inputs when they help isolate a question, while labeling them clearly. Bring in real inputs and integrations when the question depends on them.

Test proportionally to the change. Interaction explorations need visual and hands-on review; stateful integrations need failure and recovery checks; model or speech choices need representative inputs. Avoid building generalized infrastructure merely to support a disposable experiment.

## Let research serve decisions

Consult current primary documentation when a library or API becomes relevant. Inspect or prototype where documentation cannot answer the question. Observe presenters and audiences when the uncertainty concerns usefulness, control, timing, or understanding.

Research can redirect a design, simplify the implementation, or show that a capability is not useful yet. A technology comparison is valuable when it changes a decision, not simply because alternatives exist.

## Evolve the documents

Update the PRD when product understanding changes. Write a focused technical PRD when a real decision needs explanation. Capture observed behavior, limitations, and reasons for choices alongside the work. Retire assumptions that no longer hold instead of preserving obsolete constraints for consistency.

No component catalog, framework, repository layout, deployment model, backend coverage target, numerical latency gate, or comprehensive acceptance checklist is imposed by this document. Material decisions still need evidence and the user’s input where the product direction does not resolve them.

## Progress worth keeping

An iteration should leave useful code, a testable design, a documented finding, or a clearer decision. Over time, connect these into an increasingly capable presentation experience. Distinguish what is proposed, what works in isolation, what works together, and what helps people in use.

## Retrieval experiment to consider

The [EmbeddingGemma use-case decision](embeddinggemma_use_cases.md) proposes a presentation-sized corpus of narrative points, passages, images, and a short demonstration recording. Compare semantic retrieval with lexical/metadata lookup using interview queries, live paraphrases, corrections, questions, and no-match inputs.

Observe top-k recall, top-choice usefulness, false matches, retrieval latency, indexing cost, memory, and downstream agent errors. Include similar-looking but factually different material. Test the v2 encoders needed by the corpus and retain the original text model as an optional comparison. This experiment can begin at whichever point retrieval becomes useful; it is not a prerequisite for all canvas work or a fixed next milestone.

## Agent implementation boundary

Build toward separate interview, presentation storyteller, and realtime presentation agents. Preparation should expose an interview-to-storyteller handoff before the realtime agent consumes the reviewed flow and assets. A narrow experiment may exercise one handoff first, while labeling unimplemented stages. Keep room for additional specialists; shared models and runtime do not collapse the agent responsibilities. The initial speech-to-text canvas probe implemented none of these agents. The subsequent [preparation slice](agent_framework_and_livekit.md) now implements distinct interview and storyteller agents with a presenter-mediated feedback path; the realtime agent remains pending.

## Next concrete experiment — 17 October 2026

Build adaptive presentation composition, moving beyond prepared-scene selection.
Treat the saved story as narrative guidance and asset context. First define a small
presentation vocabulary, then compare OpenUI 1.0 and json-render using identical
speech replays, prepared assets and components. Evaluate useful update latency,
grounding, failure recovery and visual continuity before choosing a renderer or
connecting the winner to live speech. Keep the current scene path as a fallback.

The [OpenUI evaluation and task checklist](research/openui_evaluation.md) records
current primary sources, limitations and trial scope. OpenUI was already listed;
this refresh turns that entry into an actionable comparison. Neither candidate is
selected or installed by this documentation update. Continue in the browser;
desktop packaging follows validation unless a concrete experiment needs it sooner.

### Adaptive trial implemented — 17 October 2026

The [spoken presentation trial](adaptive_presentation_trial.md) now includes a
small validated composition vocabulary, actual OpenUI/json-render adapters,
local-model preparation, and three Piper audio narratives streamed through STT.
The replay UI can rerun interview/story preparation, switch voices/renderers and
export decisions. The first runs exposed opening-topic bias and mismatched asset
choices; the prompt/reference descriptions were revised and follow-up runs are
recorded separately. This is usable experimental behavior, not a finalized engine.
Next work should follow the observed relevance, timing and continuity failures;
native-format smoke results alone cannot select a framework. Keep broader embedding
retrieval and Electron packaging open until their concrete trial needs arise.
