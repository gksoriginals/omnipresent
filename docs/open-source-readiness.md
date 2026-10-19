# Public development readiness

> **Historical readiness record** from the initial public snapshot. The current product uses native SwiftUI on macOS; use the root README and [macOS app guide](desktop-macos-alpha.md) for supported setup. Readiness checks recorded below describe the earlier web/Python prototype.

Prepared 19 October 2026. Repository: `gksoriginals/omnipresent`.

## Scope

This initial public snapshot contains source, locked dependency specifications and scoped research evidence. It is an early prototype, not a stable release or a claim of solved spontaneous-speech understanding. No weights, virtual environments, credential files, personal material uploads, build outputs or browser storage exports belong in Git.

## Project essentials

- Root README with honest status, current defaults, setup, data locations and validation commands.
- Current architecture and documentation index separating live guidance from historical records.
- Roadmap, changelog, contribution process and maintainer governance.
- Code of conduct, support and private security-reporting policy.
- Issue forms, PR template, CODEOWNERS and scheduled dependency updates.
- Model/dependency/voice notices; optional GPL TTS test runtime is not bundled.
- Locked npm/Python dependencies, Node/Python version hints and editor/Git conventions.
- Read-only-permission CI using commit-pinned actions; software tests, typecheck/build, evidence verification, publication-content checks, Python syntax and npm audit.
- Source-scoped software audit, preserved model/audio failures and reproducible experiment records.

[GitHub community-file guidance](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) informed the community setup. License selection is an explicit project-owner decision; see [license comparison](https://choosealicense.com/licenses/).

## Publication checks

Run `npm run check:publication`, redacted Gitleaks on staged content and committed history, `npm audit`, tests, build and evidence verification. Validate a clean source checkout without local environments. Review the tracked file list rather than relying solely on ignore patterns or scanners. Historical reports contain authored/public-source fixtures, generated speech and machine metadata such as absolute development paths; their evidence snapshots are preserved rather than silently rewritten.

## Remote completion

Before declaring publication complete, verify the selected LICENSE/package metadata, public visibility, remote main commit matching local HEAD, a clean worktree, CI status and private vulnerability reporting. GitHub protection/security settings depend on API availability; report any failed setting instead of claiming it is enabled.

## Deliberate limits

There is no stable release, npm publication, binary bundle, hosted service, telemetry deployment, funding program, CLA or production security claim. Packaging and stable release policy are future work. Model/audio benchmarks are explicit opt-in actions, not CI prerequisites. The failed positive speech acceptance remains a documented open problem.

## Recorded pre-publication checkpoint

- Current source: 136/136 software tests pass, TypeScript/production build passes, evidence catalog verifies (66 experiment/plan records).
- Clean staged-source checkout: 135 pass, zero failures, one explicitly skipped optional extraction test because the checkout has no Python environment; build and evidence verification pass. CI installs parsing packages to exercise that test.
- Staged Gitleaks scan: zero findings across approximately 37.85 MB of text. npm audit: zero known vulnerabilities at this checkpoint. These are bounded scanner observations, not guarantees.
- Live coordinator after normal restart: local hybrid default, four-component synthesis, missing-evidence retention and zero provider attempts. Actual audio acceptance remains failed as previously recorded.
- Git initialized on main; private GitHub repository created. No public publication or remote CI success is claimed at this checkpoint.
- Publication check correctly blocks on the absent owner-selected LICENSE and package license metadata. Apply the selected license, refresh the package lock/audit/catalog, rerun checks and publish only after that decision.

## License decision

The project owner selected Apache-2.0 on 19 October 2026. LICENSE and npm package metadata now record that decision. The earlier pre-publication checkpoint above remains a historical record.

## Public publication verified

The repository is public at https://github.com/gksoriginals/omnipresent under Apache-2.0. Initial licensed commit `c6c7862422aa1c6298a19bc1211b8901364a747b` matched remote main. [The first GitHub CI run](https://github.com/gksoriginals/omnipresent/actions/runs/39228380521) completed successfully, including Linux document extraction, tests/build, evidence/publication checks, Python syntax and npm audit.

Private vulnerability reporting, dependency security alerts/updates, secret scanning and push protection were enabled and read back through the GitHub API. No model or inference credentials were configured in GitHub Actions.

Local environment setup is documented in `docs/configuration.md`. `npm run setup:env` creates the ignored `.env` without overwriting an existing one; the root dev command loads it before launching child workers. The local file uses safe defaults and blank optional keys. Git ignore checks confirmed environment files, registry credentials, environments and output/model/material paths remain untracked. Public source includes only `.env.example`.
