# OpenUI 1.0 evaluation for Omnipresent

17 October 2026 · Documentation/source review; not installed or benchmarked here.

## Decision

Add Thesys OpenUI 1.0 to the next adaptive-composition experiment alongside
json-render. It was already a candidate in baseline research; this refresh gives
it a concrete trial. No renderer winner is selected. This is
[thesysdev/openui](https://github.com/thesysdev/openui), the MIT-licensed generative
UI framework, distinct from wandb/openui. Its current repository describes a
model-independent language/runtime and separate parser, React renderer and chat
packages. Start with lang-core/react-lang rather than importing a new chat shell.
Existing AI SDK agents, local inference and websocket transport can remain.

## Fit

OpenUI lets us register our own React components with Zod contracts and generate
instructions from that library. That matches a presentation-specific vocabulary,
not Cerebro components or a stock dashboard. Trial candidates: Statement,
AssetImage, PreparedChart, ProcessDiagram, Comparison and a composition container.
These are experiment scope, not a finalized catalog. Chart/image/diagram props
should reference prepared assets; the host resolves data and verifies provenance.
See [component definitions](https://www.openui.com/docs/openui-lang/defining-components).

The [1.0 changes](https://www.openui.com/docs/openui-lang/whats-new) include custom
functions/actions, library extension and a stored-message format. They may support
future presenter interaction; they are not required for our first passive audience
canvas. The docs warn that action restrictions expressed in prop schemas are not
runtime-enforced yet: our host must validate any actions it exposes. React supports
these language features; other framework runtimes have a different compatibility
window. Pin and verify the exact package pair before implementing.

[Incremental editing](https://www.openui.com/docs/openui-lang/incremental-editing)
merges changed statements by name, allowing an existing composition to evolve.
The example waits until streaming completes before merging: incomplete roots can
otherwise discard reachable content. Build the edit-mode prompt in our backend;
the documented Gateway path drops that option. Maintain stable statement identity,
validate the complete candidate and commit it at a meaningful presentation moment.
Test actual React state continuity; statement merging alone does not prove it.

## What it does not solve

Speech interpretation, narrative intent, retrieval/ranking, asset generation,
factual grounding, attention management and update scheduling remain Omnipresent
responsibilities. The saved story is a narrative plan and asset context; live
presentation must be able to compose/reveal/reorder content, not merely select
prepared slides. Existing scene selection is a baseline/fallback.

[Reliability documentation](https://www.openui.com/docs/openui-lang/reliability)
acknowledges malformed and incomplete generations. Hosted Gateway/Autofix repair
services are separate integration paths, not guarantees supplied by a local parser.
Our local trial uses validation, bounded repair, stale-response rejection and the
last valid composition. Do not enable external data fetching, mutations or hosted
repair implicitly. Keep diagnostic UI out of the audience surface.

Token savings in the [repository benchmark](https://github.com/thesysdev/openui/tree/main/benchmarks)
are a vendor result on selected examples, not measured Omnipresent latency. Compare
with our tokenizer/model, prompt overhead, repairs and total speech-to-visible time.

## Next experiment and backlog

- [ ] Define a small shared presentation vocabulary and asset-reference contract.
- [ ] Build a replayable intent-to-composition trial: speech context + narrative plan
  + retrieved/prepared assets + current composition -> validated composition update.
- [ ] Implement OpenUI 1.0 and json-render adapters against the same components,
  assets, local model and replay inputs. Sequential runs avoid resource contention.
- [ ] Exercise paraphrases, elaboration, comparison, gradual diagram reveal,
  revisiting evidence, corrections, unrelated speech and deliberate hold decisions.
- [ ] Test invalid references, malformed/truncated patches, overlapping requests,
  cancellation, overflow and restoration of the last valid composition.
- [ ] Record p50/p95 useful-visible-update latency, output/prompt tokens, retries,
  invalid output, grounding errors, layout readability and unnecessary changes.
  Report transcript-ready-to-visible separately from full speech latency.
- [ ] Repeat representative prompts before deciding. Wire the preferred approach
  into live STT only after replay behavior is useful and visually stable.
- [ ] Keep Electron packaging after this product experiment unless desktop runtime
  management or separate presenter/audience windows become necessary to test it.

Deliverable: one presentation that adapts its composition to an explanation using
existing assets, with a reproducible comparison report. This is a proposed next
slice, not a claim that either library has been integrated.

## Implementation follow-up

The [adaptive spoken trial](../adaptive_presentation_trial.md) implements the small
shared vocabulary, both actual renderer adapters, Piper audio replays and validated
composition updates. Neutral tool output is encoded for each renderer; native-format
generation has a separate smoke probe. No library winner has been selected. See
that document and the recorded validation traces for tested scope and failures.
