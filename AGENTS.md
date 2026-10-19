# Working on Omnipresent

Read README.md, docs/architecture/current.md, CONTRIBUTING.md and the latest evidence register before changing defaults. Historical research snapshots are not current runtime guidance.

## Commands

- `npm ci`
- `npm test`
- `npm run build` (includes TypeScript checking)
- `npm run validate:evidence`
- `npm run check:publication`

Python/model environments are optional for core software checks; the material extraction test skips without `.venv`. CI installs locked parsing packages so it runs. Never download model weights or invoke hosted inference as an implicit test dependency.

## Invariants

Host code owns full evidence eligibility, abstention, final validation, cancellation and commit. Models propose references; they cannot approve their own evidence. Keep the default local hybrid path independent of billed models and experimental worker startup. Preserve missing-evidence feedback and the existing audience canvas on invalid/stale proposals.

Use existing model/selector/planner interfaces for focused experiments. Do not weaken the interpreter or drop unknown factual obligations to improve benchmark scores. Distinguish proposed architecture from implemented behavior and role-only tests from actual speech acceptance.

## Evidence

Do not edit historical inputs, reports or source snapshots in docs/validation/runs. New changes need a uniquely named audit and refreshed generated catalog; see CONTRIBUTING.md. Preserve failed experiments and report what checks actually ran. Paid comparisons need explicit authorization and a bounded budget.

Keep credentials, private materials, browser storage, model files, environments and generated build/output directories out of Git. Explicit provider credentials come from environment configuration only. Do not inspect another application's auth files.
