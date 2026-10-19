# Bounded multi-component synthesis

> **Renderer experiment record.** The archived geometry comparison used a standalone React/browser harness. Keep its results as historical renderer evidence; the active product interface is now native SwiftUI.

19 October 2026 · Opt-in experiment; default focus baseline retained.

`OMNIPRESENT_COMPOSITION_PLANNER=synthesis` selects a deterministic planner that can assemble one to four prepared components, including references from different beats. It uses the existing model-selected or cue-selected primary component; synthesis itself makes no model calls. The example combines a bar chart, image, explanatory text and a cross-beat line chart.

## Coverage and compatibility

`componentClaims` now accepts `beat` for the local claim and `beat:0` through `beat:11` for an explicit existing beat reference. Host preparation resolves and deduplicates references, rejects missing targets, generates component-specific snapshots and resets approval. An explicit cross-beat declaration must still be reviewed and saved. It does not infer support from adjacency, family, or a shared file.

Every displayed component must independently cover **all** current request obligations. Entity, time, provenance, units, review requirements and current source/content hashes remain host checks. This implementation does not combine partially supported fragments into a new claim, sum chart values, infer comparisons, or synthesize new prose. Cross-beat links are coverage declarations, not semantic verification.

Explicit form requests remain focused. When form was inferred from prepared context, synthesis considers only explicitly covered references. It prioritizes family diversity, retained references and same-beat proximity, with deterministic ID tie-breaking. It tries at most 36 additions (the prepared story has at most 12 beats and three references per beat) and accepts at most four components. Every tentative addition passes the same final host guard. An incompatible companion is skipped; an unsupported primary prevents a new composition.

Exact rendered-content duplicates are rejected across different beat IDs. Retained companions preserve slot identity, including when another companion disappears or the primary changes. New synthesis uses full component content rather than partial diagram reveals: node-level coverage is not modeled yet. The host still checks diagram reveal bounds for other planners.

## Layout and readability

One component uses focus, two use split, and three/four use sequence. The host validates layout/count agreement and the four-slot limit. Three/four-component plans have bounded text (360 characters per statement, 720 total) and image heading length (160). The planner skips verbose companions rather than truncating them. These are initial readability constraints, not a viewport-aware layout solver.

Sequence rendering uses two columns on desktop and one on narrow widths, with compact headings, bounded chart/image heights and wrapping. Visuals use their own titles and images their descriptions, reducing repeated beat headings. OpenUI and JSON-render consume the same plan and prepared references. Narrow layouts may scroll vertically for larger content; horizontal clipping is not accepted.

## Tests and retained evidence

[Replay results](../validation/runs/RUN-20261019-synthesis-v2/replay.json): 15 authored scenarios × three passes for focus and synthesis, **45/45 expected outcomes in each arm**, zero unsupported shows in those fixtures. Assertions inspect actual plan counts, layouts and retained slots, not only selection IDs. Scenarios include four/three/two/one components, explicit form, duplicates, wrong entity/time/unit, withdrawn sources, unknown claims, rejected primary approval, verbose text, retained slots and primary switches. Refresh events rebuild fixture context; they do not measure embedding-index refresh. Primary selections are authored. Model, STT, independent semantic quality and production latency are not measured.

The synthesis arm performs more validation work than focus; these diagnostic timings are not a speedup claim. Earlier v1 is retained with its source snapshot. Unit tests additionally exercise invalid cross-beat references, duplicate declaration normalization, cancellation, excessive component counts, unsupported additional claim obligations, and a real `BaselinePresenter` exact-cue path that produces four components with zero model calls using a fake embedder.

[Browser renderer evidence](../validation/runs/RUN-20261019-synthesis-browser/browser.json) uses both actual rendering packages, real Recharts SVGs and a generated synthetic PNG, at 1440, 900 and 600 pixels. All four references render, two chart SVGs and the image load, no horizontal overflow occurs, and desktop content stays within the test canvas. The temporary review page is removed after the probe; no debug route is added to the product. This renderer harness is not microphone or interview-to-live acceptance evidence.

## Retained renderer evidence

The historical browser renderer comparison is retained at [the validation record](../validation/runs/RUN-20261019-synthesis-browser/browser.json). Its standalone review page and launch script have been removed. Reproduce the domain replay with `npx tsx scripts/synthesis-replay.ts RUN-your-unique-id`; to compare the planner inside the Electron development app, set `OMNIPRESENT_COMPOSITION_PLANNER=synthesis` in the local `.env` before running `npm run dev`.

The replay captures frozen inputs/source hashes, JSONL stage traces, rows and per-pass summaries. Synthetic artwork used by the retired renderer probe remains in its original validation record; no standalone browser app is supported.

Next acceptance work: independently review cross-beat coverage, prepare real stories with component declarations, replay natural speech, and evaluate narrative usefulness/change cost. Complementary-claim union reasoning, inferred relations, viewport-driven selection and node-level reveal coverage remain outside this experiment.

Final software audit: [113/113 tests, TypeScript and production build passed](../validation/runs/RUN-20261019-richer-synthesis-audit/run.json). Validation catalog, frozen source snapshots and input hashes verified.
