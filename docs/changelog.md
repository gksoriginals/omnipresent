# Changelog

## 0.1.0-alpha.1 — 2026-10-19

First public alpha of the local-first adaptive presentation prototype.

- Local Qwen interview and storyteller, material uploads, saved projects/stories and an interview web-search tool.
- Local hybrid live selection and deterministic synthesis; host-owned evidence eligibility, abstention, final validation and commit. No automatic hosted inference.
- Optional native GLiNER and MiniLM preference experiments with bounded local fallback.
- SQLite workspace persistence with guarded startup hydration and ordered browser saves.
- Presenter console, evidence-checked manual cues, read-only audience display and shared-session reconnection with microphone recapture.
- Portable story import/export with content-hashed image files and validation before import.
- Responsive preparation UI, readable audience canvas, community policies, Apache-2.0 license, CI and reproducible validation records.

[Live release test](validation/runs/RUN-20261019-release-live-v1/browser.json): battery selection, missing-evidence retention, presenter refresh, fresh-session recovery and audience behavior passed. Three initial storyteller drafts failed tool validation; refining the brief produced a reviewable fourth draft. Panel narration split into two final STT segments and was held. General spontaneous speech acceptance remains failed. Recordings use a virtual microphone, not a physical microphone.

This is a single-user local alpha. Concurrent editing in multiple tabs and multi-user authorization are not supported. Historical experiments, including failed speech and INT8 trials, remain chronological research records rather than released product guarantees.
