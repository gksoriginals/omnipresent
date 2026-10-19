# Domain architecture review

19 October 2026. Review of the current working tree, including temporal transcript assembly. Recommendations below are proposed changes, not an implemented replacement architecture.

## Assessment

The core direction is sound: local preparation, immutable prepared evidence, host-owned eligibility/abstention, pluggable retrieval and preference, deterministic composition, and interchangeable renderers. The strongest rework opportunities are ownership and domain representation. More models, agents, registries or infrastructure would not address these issues.

Review validation: 160 automated tests passed and the production build passed. A separate model-free probe reproduced an opening-policy inconsistency: with independent-review mode enabled and a presenter-approved but independently pending fixture, `AdaptiveController.start()` committed one opening stage; `cue(0)` then held the same content. This is a confirmed uncovered case, not a claim that the passing suite validates all architecture invariants. No inference or live microphone experiment was run for this review.

## 1. Creating executable components

### Live runtime ownership — first priority

`server/index.ts` owns HTTP serving, WebSocket parsing, session lookup, audience fan-out, preparation orchestration, Python speech processes, readiness, cancellation and reconnect grace. The live-session record duplicates mutable connection-local references, which are reassigned during presenter replacement. Resource behavior remains distributed across closures.

Turn the existing live-session concept into an executable `PresentationSession` that owns its lifecycle, prepared snapshot, speech resources, decision cancellation and current canvas. A small `PresentationSessions` collection should handle lookup and expiry. Socket handlers should validate commands and delegate; replacing a socket should replace a transport attachment, not transfer worker/controller closures. Keep one in-process TypeScript coordinator.

Extract a `SpeechTranscriptionSession` around the existing worker adapter: start/stop/dispose, PCM acknowledgement and decoded transcript events. Keep `TranscriptAssembler` as the existing pure, bounded component. It already supplies a useful independently testable boundary.

### Presentation component definitions

Executable visual components already exist as registered OpenUI/JSON-render components, but both end in one `Block` function branching over kinds. Distinguish:

- **Definition:** trusted application renderer and input/view-state validation.
- **Prepared instance:** particular statement, chart, diagram or image with evidence links.
- **Placement:** component reference, slot, emphasis and reveal state in a scene.

Initially split the existing renderer into straightforward statement/chart/diagram/image implementations sharing the existing schema contracts. Add a registry only where dispatch or experimentation actually requires one. Agents continue proposing validated data and references; executable components do not mean executing arbitrary generated JavaScript. Interactive components, if introduced, will need explicit state/action contracts.

## 2. Data representations that preserve essential information

### Separate authoring, prepared runtime and audience data

`Preparation` currently includes conversations, brief, narrative, artifacts, visuals, review flags and events. Saved stories, live decision inputs and audience rendering all use this type. `audienceState()` has to fill private fields with placeholders such as `speakerNotes: "Audience view"` to satisfy an authoring schema.

Evolve the existing types toward three explicit contracts:

| Contract | Essential information |
| --- | --- |
| `PresentationDraft` | Brief, conversation, editable story/assets, pending questions and review state. |
| `PreparedPresentation` | Immutable story references, prepared components, evidence/source identities, policy-relevant revisions and catalog. |
| `AudienceScene` | Validated placements and the public content required to render them. |

Keep presenter notes available through a presenter projection. Audience data should omit private fields by construction, rather than populate a valid-looking preparation object. Extend the existing `PreparedPresentation` compilation boundary instead of creating a second compiler.

### Separate component identity from narrative position

`AdaptiveComposition` references a numeric beat and a generic kind; `preparedComponents()` derives IDs such as `chart:0` from that position. These references are safe within a frozen snapshot, but they couple asset identity to narrative order and constrain a beat to one selected visual/image reference per kind.

Use stable component IDs for scene placements. Story beats can refer to reusable components without defining their identity. Keep snapshot/revision checks: a stable ID alone never proves unchanged content or valid evidence. This supports a presentation canvas that can compose assets independently of a fixed slide sequence.

### Make lifecycle, outcomes and revisions explicit

Server `started`/`disposed` fields, speech status strings and client `active`/`starting`/`paused` booleans spread the lifecycle across several objects. Introduce explicit lifecycle states and validated transitions, keeping connection attachment and microphone status as separate dimensions. Type shared commands/events once and validate at transport boundaries; internal APIs should not depend on `Record<string, unknown>` or `any` snapshots.

Decision results should distinguish `present`, `retain`, `request-context` and `cancelled`, carrying structured reasons and missing obligations. A null composition plus optional question/metadata currently encodes several different outcomes.

`preparationIdentity()` hashes the whole flow, including speaker notes. Separate authoring revision, prepared-content identity and evidence/policy identity before optimizing invalidation. Notes-only edits should not necessarily rebuild retrieval; evidence changes must always invalidate applicable decisions. Measure actual rebuilds before claiming latency savings.

## 3. Coherent module decomposition

Retain the useful existing interfaces: `CompositionPlanner`, `AssetSelector`, retrieval snapshots, model adapters, trace sinks and replay arms. Do not replace them with a universal pipeline framework.

Recommended responsibility boundaries:

| Boundary | Responsibility |
| --- | --- |
| Preparation application | Apply material, brief, story proposal and review commands; agents are callers. |
| Prepared presentation compiler | Validate/freeze reviewed content, build catalog and revision identities. |
| Presentation session | Own live lifecycle, cancellation, speech assembly and commit ordering. |
| Decision pipeline | Interpret complete speech, assess evidence, select and propose a composition. |
| Rendering adapters | Render the same validated audience-scene contract in either library. |
| Workspace persistence | Store authoring/saved data; browser cache and portability are explicit adapters. |

On the frontend, move project/draft/save coordination out of `App` into a focused workspace hook. Give `usePresentation` a typed lifecycle model. Keep page components concerned with interaction and rendering. This does not require a new state-management library.

The SQLite implementation currently writes a complete workspace JSON plus replaces normalized project/story rows; reads use the JSON. Clarify the canonical storage representation and synchronization ownership before expanding storage behavior. Do not change database architecture as part of an initial lifecycle refactor.

## 4. Translating business policy into program logic

### One rule for every canvas commit — confirmed gap

Speech proposals pass through `validatePlannedComposition`; manual cues separately construct and check an evidence intent; startup commits `openingComposition()` before decision preparation. The strict-review probe above demonstrates policy divergence.

Define one final host authorization/commit operation used by opening, manual and speech-driven proposals. It must check content/evidence identity, eligibility, rendering constraints, the current session generation and cancellation. If opening content is ineligible, show a fact-free standby view. Models and planners cannot obtain commit authority. Typed authorized results can make the boundary visible, while runtime validation still protects external proposals.

Do not collapse the early eligibility guard and final validation into one check: they serve different purposes. Centralize the policy implementation and route callers consistently while retaining early cost avoidance and final protection against stale/invalid work.

### Separate rules from AI tool adapters

Preparation tools currently mutate drafts and emit events directly. Extract the repeated domain operations for material addition, story proposal and approval, and have both AI tools and manual commands call them. Preserve presenter approval versus independent review as separate concepts.

Keep speech interpretation separate from evidence support. `EvidenceIntent` currently includes request intent alongside missing/clarify outcomes derived from the available catalog. Evolve `RequestFrame` and evidence assessment deliberately; do not assume this structural separation solves natural-language understanding or justifies another inference call.

## 5. Names that express domain meaning

Rename only alongside an ownership change, avoiding a repository-wide cosmetic rewrite.

| Current | Proposed meaning/name |
| --- | --- |
| `Flow` | `StoryPlan` |
| `AdaptiveComposition` | `CanvasComposition` or `ScenePlan` |
| `Stage` | `CanvasState` |
| generic `Session` | `CanvasCommitter` if it retains only canvas state/commit duties |
| `AdaptiveController` | live coordination owned by `PresentationSession` |
| `BaselinePresenter` | `PresentationDecisionPipeline` |
| `PresentationBlock` / `Block` | `PreparedComponentView`, dispatching typed renderers |
| `state` across all stages | `draft`, `preparedPresentation`, `canvasState` as appropriate |
| decision `context` | `request-context` with explicit missing-evidence details |

Keep `TranscriptAssembler`, `CompositionPlanner`, `AssetSelector` and `EvidenceContract`: these already describe their responsibilities. Keep historic experiment/profile names stable at external boundaries until explicitly deprecated.

## Order of work and acceptance

1. **Unify final authorization/commit and cover the opening gap.** Strict-review, withdrawn-source, manual, opening, invalid-layout and stale-proposal tests must agree on eligibility and retain behavior.
2. **Extract session resource ownership and typed lifecycle commands/events.** Re-run active-owner replacement, disconnect/expiry, readiness, microphone resumption, pause/stop, and audience privacy tests. No extra worker or model startup on the default path.
3. **Evolve prepared component identity and audience contracts.** Reordering story beats must not change component identity or redirect content; content/evidence revisions must still invalidate stale proposals. Both renderer adapters should render equivalent scenes without private fields.
4. **Share preparation domain operations, simplify frontend coordination, then rename.** Verify equivalent command behavior for agent/manual callers, draft persistence, approval invalidation, and save/import/export.

Stages 1–2 can start within current contracts. Stage 3 changes serialized/public contracts and needs an explicit schema and compatibility decision before implementation. Database redesign, microservices, new agent orchestration, another VAD and another signal repository are not justified by this review.

Refactoring success means preserved or improved behavior with clearer ownership. Compare default worker/model startup, index refresh counts, software regressions and the existing real-audio replay; do not infer a latency improvement from smaller files or new names.

## Implementation follow-up

Implemented the common host commit authority and the first session ownership extraction. See `server/presentation/authorization.ts`, `server/agents/adaptive.ts` and `server/presentation/live-session.ts`. Opening authorization now honors strict independent review; blocked openings use a fact-free standby. Automatic experimental proposals independently face full request/evidence/layout validation immediately before commit. Failure preserves the canvas and returns feedback to Prepare.

The resumable session owns teardown and expiry, with loaded/preparing/ready/disposed lifecycle states. Existing WebSocket reconnect and audience privacy tests remain in place. This is a bounded stage 2 extraction: command routing, speech transport callbacks and frontend pause/microphone coordination still require further decomposition. No persisted schema or model default changed. Later stages above remain proposed, not implemented.

Validation: `RUN-20261019-session-authority-audit-v1` records software checks for this change. No new model benchmark, live microphone acceptance or measured speedup is claimed.

## Cleanup follow-up

Removed unused controller speech history, repeated controller authorization passes, redundant disconnect cleanup, unread preparation response state/prop and compiler-confirmed unused imports and stored constructor fields. The controller now authorizes exactly once for each attempted composition at its commit boundary, including unchanged views; manual navigation tries existing prepared representations through that same boundary. The presenter still validates its own proposals before returning them, and the host independently validates them before publication. These distinct authority boundaries remain intentional.

Retained alternative selectors, renderer implementations and benchmark scripts with existing callers; they remain reproducible experiment paths. Historical source snapshots were not changed. The regression for unchanged manual views verifies both suppression of duplicate stage events and reauthorization when independent review policy changes. `RUN-20261019-runtime-cleanup-audit-v1` records this cleanup's software validation. No latency improvement or new live speech acceptance is claimed.
