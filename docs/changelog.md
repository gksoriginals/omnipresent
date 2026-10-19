# Changelog

## Unreleased — native macOS app direction

- Replaced the active Electron and React product UI with a native SwiftUI macOS workspace and audience display.
- Added an in-app OpenAI-compatible model settings form with connection test and owner-only credential storage.
- Kept the TypeScript coordinator, host-owned evidence authority, local hybrid selection and SQLite persistence inside the app bundle.
- Replaced renderer Moonshine capture with Apple's on-device Speech framework, gated on macOS on-device recognition support; native speech acceptance remains pending.
- Removed browser renderer packages and source from the active product and updated setup, architecture, CI and contribution documentation.

## 0.1.0-alpha.1 — 2026-10-19

First public alpha of the local-first adaptive presentation prototype.

- Local Qwen interview and storyteller, material uploads, saved projects/stories and an interview web-search tool.
- Local hybrid live selection and deterministic synthesis; host-owned evidence eligibility, abstention, final validation and commit. No automatic hosted inference.
- Optional native GLiNER and MiniLM preference experiments with bounded local fallback.
- SQLite workspace persistence with guarded startup hydration and ordered renderer-cache sync; Electron was the supported app shell at alpha release.
- Presenter console, evidence-checked manual cues, read-only audience display and shared-session reconnection with microphone recapture.
- Portable story import/export with content-hashed image files and validation before import.
- Responsive preparation UI, readable audience canvas, community policies, Apache-2.0 license, CI and reproducible validation records.

[Live release test](validation/runs/RUN-20261019-release-live-v1/browser.json): battery selection, missing-evidence retention, presenter refresh, fresh-session recovery and audience behavior passed. Three initial storyteller drafts failed tool validation; refining the brief produced a reviewable fourth draft. Panel narration split into two final STT segments and was held. General spontaneous speech acceptance remains failed. Recordings use a virtual microphone, not a physical microphone.

This is a single-user local alpha. Concurrent editing in multiple windows and multi-user authorization are not supported. Historical browser-prototype experiments, including failed speech and INT8 trials, remain chronological research records rather than released product guarantees.
