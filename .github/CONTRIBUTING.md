# Contributing

Omnipresent is an early research prototype developed in public. Small, evidence-backed changes are welcome. Start with the README, current architecture, roadmap and open issues.

## Local workflow

1. Fork and clone the repository; create a focused branch.
2. Run `npm ci`. Product tests/build need no Python environment or model-weight download. `npm run dev` builds and opens the native SwiftUI app; no browser renderer is part of the product.
3. Make a focused change and add meaningful regression coverage for changed behavior.
4. Run `npm test`, `npm run build`, `npm run macos:pack`, and `npm run validate:evidence`.
5. Open a PR explaining the problem, resulting behavior, validation and remaining limits.

Discuss major architecture changes, new external services, paid dependencies, changes to evidence authority or data formats before implementing them. Preserve local-first operation and explicit experimental opt-in. Keep credentials and private presentations out of issues, fixtures and traces.

## Architecture invariants

- Host code owns eligibility, missing-evidence decisions, final validation and commit.
- Model output is a proposal over stable, eligible references; it never approves evidence.
- Cancellation, changed stories and withdrawn sources invalidate stale work.
- No error path silently invokes a billed provider.
- Interview and storytelling are separate preparation roles; live presentation does not regenerate the story on each utterance.
- The audience canvas stays clean; experiment details belong in the inspector.

## Tests and research

See `docs/testing.md`. Freeze new benchmark inputs and expectations before inference. Record failed runs, source hashes, model revisions, startup, fallback costs and final checks. Repeated authored cases are not independent acceptance examples. Never tune on an evaluation set and relabel it a holdout. Do not rewrite immutable historical evidence to make a current change pass.

When source/tests change, create a new software audit and regenerate the evidence catalog:

```sh
node scripts/audit-validation.mjs RUN-YYYYMMDD-unique-slug
python3 scripts/build-validation-catalog.py
npm run validate:evidence
```

This is a software audit, not permission to run paid or large model benchmarks. Note unrun optional checks in your PR. CI runs software checks only.

Use SwiftUI for macOS interface code and TypeScript for coordinator and model/material modules. Historical research scripts may retain their original runtime. `npm run build` type-checks the coordinator; `npm run macos:pack` compiles the native app. There is no separate formatter/linter mandate today. Keep lockfiles in sync and justify new dependencies. Write docs for user-visible or architecture changes. Commit only scoped work and never include environments, downloads or uploads.

## Contribution terms

Contributions use the repository's license. You must have the right to submit the code or assets. Identify external sources and preserve their notices. There is no CLA or mandatory sign-off process. Follow the code of conduct.
