# Testing and evidence

## Model-free checks

Run `npm ci`, `npm test`, `npm run build`, and `npm run validate:evidence`. These are CI checks, with no model credentials or weight downloads required. CI installs the locked Python package environment to exercise document extraction; without that environment, the optional material-extraction test explicitly skips. Build includes TypeScript checking. Python files can be syntax-checked with `python3 -m compileall -q runtime scripts`.

The test suite uses explicit fixtures and adapters. It does not establish model quality, physical-microphone performance or browser paint latency. The committed validation catalog ties historical experiments and current cases to source hashes and reports.

## New source changes

Record a uniquely named software audit, regenerate the catalog and verify it. See `.github/CONTRIBUTING.md`. Do not overwrite historical runs or their snapshots. The generated catalog verifies hashes and current test mappings; it is not a certification.

## Optional inference experiments

Model and audio tests require separate environments, pinned model files and sufficient resources. Default setup needs speech and retrieval runtimes, plus a preparation endpoint. Optional classifier comparisons use `scripts/setup-compact-local.mjs`; the small reranker has a pinned downloader at `scripts/setup-preference-reranker.py`. These references are opt-in and not installed by CI.

Read each experiment's protocol before running it. Some historical scripts deliberately call paid providers when configured; do not run the entire scripts folder as a test suite. `OPENROUTER_API_KEY` is used only for explicit hosted comparisons. No new live benchmark should quietly spend a contributor's credentials.

Latest distinct-preference and real-audio commands and scope are documented in `research/preference-quality.md`. TTS tests use generated Piper recordings, not physical microphone input. Browser rendering needs an independent check once the positive speech-to-composition path succeeds.

## Publication checks

`npm run check:publication` checks tracked content for forbidden local artifacts, oversized files, credential-discovery regressions and required project files. Use Gitleaks on staged/full Git history with redacted reports before pushing. Neither a scanner nor this script proves absence of all sensitive content; review the actual file list and uploaded fixtures.

## 0.1.0-alpha.1 release check

[Release live evidence](validation/runs/RUN-20261019-release-live-v1/browser.json) records the actual local Qwen interview, material upload, reviewed story save/reload, virtual-microphone Piper audio, Moonshine transcription, local hybrid selection, browser rendering and audience window. Microphone recapture on refresh and fresh-session startup after a coordinator restart passed. The battery explanation selected its content; the unsupported cost request held and requested evidence. The panel explanation split into separate STT finals and failed selection. Three initial storyteller attempts failed tool validation; explicit brief refinement preceded the successful fourth UI attempt. This is mixed integration evidence, not general speech acceptance.

Automated regressions separately cover active presenter replacement, audience payload privacy/read-only commands, interrupted-load recovery, concurrent startup edits and ordered saves, retained failed saves, evidence eligibility/cancellation for manual cues, and portable image transfer with tamper rejection. The coordinator test explicitly preloads deterministic embedding vectors; it does not call or score a real model. Real model services are used only in the optional live check.
