# Replay runner and trace sinks

19 October 2026 · Shared experiment infrastructure.

The runner in `server/experiments/replay.ts` accepts named arm factories and frozen replay cases with speech, expected action/reference and scheduled refreshes. Each pass constructs fresh arms and records initialization separately. It rotates/reverses paired execution order, retains initialization/provider/validation failures in case denominators, and produces overall and per-pass median/p95 plus positive, negative and unsupported-show counts.

A turn timer starts before its scheduled refresh and finishes after the arm's decision and final validation. Nested stage times overlap: do not add them to the turn total. Model adapters and other asynchronous work must honor `AbortSignal`; cancellation cannot forcibly terminate an uncooperative plugin. Current replay is sequential, not a concurrency stress test.

`TraceSink` has in-memory, JSONL-file and live WebSocket implementations. Policy traces cover refresh, eligibility, retrieval, grounding, final evidence validation and decision outcome. Live grounding now emits attempt timing, usage cost availability and attempt number through the sink; live commit emits a correlated event. Model calls, fallbacks and stage durations are attributed to each replay case. Missing billing is recorded as unavailable; existing grounding validation/spending rules are unchanged. Default live tracing sends metadata to the connected client; it does not persist private transcripts or raw provider responses. The UI ignores optional trace events.

## Reproduce the wiring check

```sh
npm run replay:baseline -- RUN-your-unique-id
```

The command creates a new directory under `docs/validation/runs` and refuses to overwrite one. It freezes input hashes and source snapshots before running, then writes `start-manifest.json`, `inputs.json`, `trace.jsonl`, `steps.jsonl` and `replay.json`. Source files and inputs can be hash-verified. File trace writes are synchronous and included in observed diagnostic turn time; row-file serialization happens after the measured turn.

This supplied profile compares default hybrid construction with explicitly injected hybrid retrieval, using 438 authored/source-backed fixture assets and 37 authored cases across three passes per arm. Embeddings are synthetic and grounding deterministically uses the evidence predicate. This is deliberately a wiring/parity check: its perfect expected decisions are not independent model quality evidence, and its timing cannot establish production latency or a speedup. It exercises refresh/retrieval/guards; it makes zero real model calls. Fallback accounting and error retention are additionally exercised by deterministic runner tests.

To add a real experiment, implement `ReplayArm` and use the same runner, with a versioned profile containing real embedding/model identities, prompts, cache policy and budgets. Record raw provider requests/responses separately in a controlled artifact if needed; the generic metadata sink should not collect them automatically. Keep final evidence and revision checks inside every arm. Hosted budget enforcement remains a responsibility of the profile's model-call boundary; this synthetic profile cannot spend money.

## Executed evidence

[Latest parity run](../validation/runs/RUN-20261019-replay-parity-v4/replay.json): 111/111 expected decisions in each arm (37 cases repeated three times), 15 scheduled refreshes per arm, zero errors, identical selected actions/references. Initial indexing is recorded separately. Earlier v1/v2/v3 wiring runs are retained with their own source snapshots. v1 executed before a script-only TypeScript action-union annotation was fixed; later runs reflect the corrected typed script. These are repeated development cases, not 222 independent quality samples.

No new hosted-model benchmark, physical microphone, STT, media-loading or browser-paint latency measurement is implied. Independent source review and natural-speech acceptance remain pending.

Infrastructure validation: [92-test software audit](../validation/runs/RUN-20261019-frontend-replay-final-audit/run.json), including failed initialization, fallback attribution, frozen expectations, trace correlation and existing cancellation/evidence invariants.
