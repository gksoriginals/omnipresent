# Component coverage and bounded pairing

19 October 2026 · Implemented as an opt-in composition experiment. Focus remains default.

New preparations now have separate `componentEvidence.statement`, `.visual` and `.image` contracts for components that exist. Each contract binds an evidence declaration to a canonical hash of the rendered component content. Source-backed contracts bind specific artifact snapshots; changed or withdrawn artifacts and changed rendered content invalidate coverage. Statement text, diagram/chart specification and image references have separate identities. Private speaker notes are excluded.

## Drafting and approval

The storyteller may propose `componentClaims` with `statement`, `visual` or `image` arrays containing the local claim reference `beat`. This bounded vocabulary currently represents coverage of the complete beat claim, not partial coverage or arbitrary claim synthesis. Text defaults to its own beat claim. A visual/image does **not** inherit it automatically: absent an explicit declaration, it receives a separate component claim based on its own title/description. A declared shared claim includes the component title as a recognition alias.

The host generates hashes, source snapshots and evidence contracts. These host-owned fields are excluded from the storyteller tool schema. A generated diagram without source binding remains illustrative even when adjacent narrative cites a file. Charts bind their declared source artifact; images bind their own uploaded artifact. Diagrams do not yet have explicit source-artifact bindings.

Preparation shows a collapsed **Component coverage** disclosure per beat, identifying text/visual/image claim aliases, provenance and approval status. Save validates all present component snapshots before approving the declarations together. If one is stale, approval fails without partially approving the rest. Verification remains unknown and independent review pending. Presenter approval is an acceptance of declared coverage, **not proof of semantic entailment or an independent audit**.

## Paired planner

Set `OMNIPRESENT_COMPOSITION_PLANNER=paired` before starting the coordinator to opt in. The planner can propose one selected component plus one companion from the same beat, using existing split-layout rendering. It does not change retrieval or ask an LLM to generate layouts.

A companion is allowed only when:

- The presenter did not explicitly constrain the visual form; form was resolved from prepared context.
- Both references have explicit component contracts and independently cover every requested claim obligation.
- Entity, timeframe and provenance agree; nonempty units do not conflict; review requirements hold.
- The current content and source snapshots match the approved contracts.

The selected component must satisfy the complete request, including requested form. A companion may differ in form only for an inferred form; it must still satisfy claim, entity, timeframe, provenance, audit and unit obligations. Existing valid pairs can be retained. Missing or incompatible companion coverage falls back to one focused component. Invalid selected evidence holds the existing audience canvas. The host revalidates the proposed plan against its own context; a planner's cloned context cannot approve evidence.

Legacy beat-only contracts remain usable for the existing focus path. They do not earn multi-component eligibility and are not automatically converted. Newly generated contracts are recreated on story edits and require Save again. This slice does not introduce a storage migration or silently remove working stories.

## Executed checks

[Component replay](../validation/runs/RUN-20261019-component-coverage-v3/replay.json) uses eight authored scenarios and three passes for focus and paired planners. Scenarios cover compatible pairing, explicit form, undeclared companion, incompatible scope, withdrawn companion, changed visual content, unsupported claim and withdrawn primary coverage. Selection is authored; the runner is testing composition and evidence invariants, not retrieval/model/speech quality. Refresh events reconstruct synthetic context rather than indexing real documents. No latency winner is claimed.

Unit tests also cover absent shared coverage, legacy gating, mutations after catalog creation, source withdrawal before approval, canonical hashing and preserved pending verification status. The existing agent/schema, storage, cancellation and renderer tests are included in the software audit.

Browser validation uses a seeded synthetic text/diagram story and the actual local coordinator, checking coverage disclosures and 1440/900/600 geometry, reload, sessions, scrolling, library and preview. Earlier attempts exposed an invalid visual UUID in the test fixture and saturation of the existing three-connection limit by test browsers. The fixture now parses through the real preparation schema and the probe closes its owned browser on completion. These are retained diagnostic failures, not silently counted as passing runs. No physical microphone or real model generation is exercised.

## Remaining work

Independent component-claim review and a natural-speech holdout are still required. Coverage is presently a whole-beat declaration; finer claim sets, explicit diagram source binding, partial visual coverage/reveal obligations, cross-beat composition and semantic compatibility reasoning remain future work. Pairing does not justify promoting this experiment to the default baseline.

Final validation: [104/104 tests and successful TypeScript/production build](../validation/runs/RUN-20261019-component-coverage-audit/run.json), plus the [browser report](../validation/runs/RUN-20261019-component-coverage-browser/browser.json). Validation catalog, input hashes and frozen source manifests verified.

## Richer synthesis follow-up

[Bounded synthesis](richer-synthesis.md) extends declarations with explicit existing-beat references and supports up to four compatible components across beats. Focus is still default. Each displayed component must independently cover the whole request; semantic union of partial claims is not implemented. The original paired planner remains available.
