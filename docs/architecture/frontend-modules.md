# Frontend boundaries

19 October 2026 · Implemented modularization, preserving the existing product layout.

`App.tsx` remains the application composition view. It connects the services below and coordinates preparation updates, project selection, saving and removal. It no longer implements microphone acquisition, PCM buffering, WebSocket reconnection or renderer serialization.

| Module | Owns | Experiment boundary |
| --- | --- | --- |
| `app/src/services/workspace-store.ts` | Browser storage access, initial load failures, in-tab state after write failures | Injectable `StorageLike`; shared workspace functions still own story/session rules |
| `app/src/services/session-client.ts` | Socket lifecycle, reconnection, stale callback isolation, typed and validated consumed events | Injectable socket factory; unknown telemetry ignored, malformed consumed events reported |
| `app/src/services/audio-capture.ts` | Microphone/worklet resources and one-in-flight bounded audio queue | Capture independent of presentation UI; transport interface supports test/replay sources |
| `app/src/hooks/usePresentation.ts` | Start/stop, readiness, cancellation epochs, presentation state and worker events | Lifecycle separated from views and project persistence |
| `app/src/renderers/PresentationBlock.tsx` | Common prepared-reference rendering | Both renderers consume the same semantic block and preparation context |
| `app/src/renderers/openui.tsx`, `json-render.tsx` | Library-specific catalogs and serialization | Renderer registry in `AdaptiveCanvas.tsx`; provider-specific code stays in its adapter |
| `app/src/PresentationRoom.tsx` | Opening preview, start controls and audience canvas | View receives state and actions; it does not own sockets or microphone resources |
| `Preparation.tsx`, `StoryLibrary.tsx` | Existing preparation and library views | Existing side-by-side preparation and story-card behavior retained |

No state-management dependency, storage migration, API replacement or new UI settings were introduced. Resource acquisition is cancellation-aware; late microphone permission/worklet completion cannot overwrite a newer capture. Stop resets speech readiness so the next start reloads the worker instead of trusting stale readiness.

## Verification

Service tests cover draft persistence and storage failures, one-in-flight audio and overflow, cancelled microphone acquisition, typed event rejection and detached socket callbacks. Existing real-package renderer tests cover OpenUI/JSON-render parity.

Run the development server, then `npx tsx scripts/frontend-modularity-probe.ts` to launch the isolated `modularity-review` Playwright CLI session. It uses a seeded synthetic story; it replaces only that browser session's local workspace, never an attached user browser. The script checks 1440/900/600-pixel widths, independent story scrolling, visible composer/save controls, draft reload, session switching, sidebar persistence, library and ready view. It does not start a physical microphone or invoke preparation models. The wrapper requires the installed Playwright CLI skill and available browser.

Browser evidence is copied to `docs/validation/evidence/frontend-modularity-*`; diagnostic logs and intermediate failed fixture setup attempts remain in `output/playwright/frontend-modularity/`. A browser fixture is layout/persistence evidence, not an interview-to-live-model acceptance test.

Final software validation: [92/92 tests and successful TypeScript/production build](../validation/runs/RUN-20261019-frontend-replay-final-audit/run.json). [Browser report and frozen source manifest](../validation/runs/RUN-20261019-frontend-browser/browser.json).
