# Testing and evidence

## Model-free checks

Run `npm ci`, `npm test`, `npm run build`, `npm run macos:pack`, `npm run validate:evidence` and `npm run check:publication`. Tests use fixtures and do not call a hosted model or download model weights. The material extraction tests use the TypeScript OfficeParser adapter. Native packaging compiles the SwiftUI app and downloads a pinned Node runtime when it is not cached; it does not download model weights.

These checks do not establish model quality, native microphone behavior, speech recognition accuracy or end-to-end visual acceptance. The validation catalog ties current software tests and historical experiments to source hashes and reports.

## Source changes and native checks

Record a uniquely named software audit, regenerate the catalog and verify it. See `.github/CONTRIBUTING.md`. Do not overwrite historical runs or source snapshots. A successful `.app` build confirms compilation and packaging only; open the app and exercise the changed path for interaction-level evidence.

The current speech framework is Apple's on-device Speech framework when supported by the Mac. Older Moonshine/WASM and browser trials remain research history. A new microphone trial must record device/OS, permissions, recognizer on-device availability, inputs, transcript events, coordinator decisions, canvas changes and failures. Do not imply that scripted transcript tests validate acoustic recognition.

## Optional model experiments

Read each experiment protocol before running it. Some historical scripts can call paid providers when credentials are configured; they are not included in the default test suite. `OPENROUTER_API_KEY` is for explicit comparisons only. Do not make hosted calls a silent test dependency.

The app's optional EmbeddingGemma download happens after a presentation needs retrieval, not during installation or core tests. See [current architecture](architecture/current.md) and [speech assembly findings](research/speech-assembly.md) for evidence boundaries.

## Publication checks

`npm run check:publication` checks tracked content for forbidden local artifacts, oversized files, credential-discovery regressions and required project files. Review staged files and use Gitleaks on staged/full Git history with redacted reports before publishing. These checks do not prove that every sensitive item has been found.

## Historical alpha trial

[Browser-era release evidence](validation/runs/RUN-20261019-release-live-v1/browser.json) records the former React/Moonshine experience. Battery selection, missing-evidence retention, refresh and reconnect were observed; one spoken panel explanation split and failed selection. This predates the native SwiftUI app and is not current native speech acceptance. The automated coordinator regressions still cover evidence eligibility, cancellation, session ownership, audience payload privacy, persistence and portable image transfer.
