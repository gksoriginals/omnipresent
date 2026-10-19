# Real-library acceptance gate

17 October 2026 · Planned; no independent corpus accepted yet.

The constructed library is a stress fixture, not evidence that the policy generalizes to actual presentations. Neither repeated timing passes nor model-generated labels create independent quality evidence. Keep live defaults unchanged until the following inputs and checks exist.

## Corpus and review

Use source-backed presentations covering several narrative styles: explanatory processes, numerical comparisons, a persuasive proposal and an exploratory talk with detours. Preserve asset IDs, source versions, units, dates, entities and actual/illustrative/unknown provenance. Include unavailable facts and withdrawn or corrected assets. Preserve the distinction between an asserted claim and evidence sufficient to support it. Do not silently label unknown evidence “actual” or “audited.”

Record each source path or URL and checksum, extraction method/version, any transformations and whether the asset is approved for presentation. Maintain claim-level source references for evidence that may appear together. Build cue bundles from approved preparation before freezing evaluation transcripts. Cue strings should be reviewed as bindings, not harvested from expected answers.

Use natural presenter transcripts with repairs, hedging, pronouns, comparisons and incidental mentions; include raw STT output where permitted. A reviewer other than the policy author must check acceptable selections, must-not-show constraints, missing-evidence outcomes and allowed operations. Keep development and untouched selection sets separate by source/story, not just paraphrases of the same case. Do not count repeated requests as independent observations.

No current user session or private uploaded material is automatically sent to a hosted model by these experiments. The included benchmarks use constructed content. A real-material run must explicitly select a reviewed corpus and respect its sharing restrictions.

## Absolute quality before comparative speed

Require both preserved comparative quality and an absolute missing-evidence gate. Shared baseline failures are still failures. A quoted mention is not automatically a request; matching an entity or topic does not establish every requested fact. Unsupported provenance, unknown timeframe and extra facts require abstention or clarification rather than an arbitrary substitute. Record ambiguity explicitly instead of inventing a single correct asset where several are acceptable.

Score acceptable selected sets/operations and forbidden shows, not only aggregate accuracy. Every paired regression needs inspection. Report positive selection, missing-evidence/irrelevance behavior and explicit corrections separately. Freeze acceptance thresholds and label policy before evaluating the selection set.

## Complete latency and resilience

Measure repeated per-session median/p95 from final transcript to validated decision and separately to audience-visible paint. Counterbalance run order and include successes, errors, retries, fallback queries, final grounding, cache refresh and cancellation. Report cold startup separately and also in an amortized session budget. Maintain separate arm caches so one arm does not inherit the other's background work.

Exercise content addition/removal, changed units or dates, superseded sources, expired cues, long-running inference during refresh, and semantic topic changes without moving the planned story position. Ensure speculative work cannot commit and that invalidated work cannot overwrite the latest canvas. Include resource contention from actual image/diagram rendering and STT when testing the live system.

Record calls per minute, expected and wasted preloading, unavailable-evidence shows, distracting replacements, retained anchors, and human readability judgments. A fast exact-command path does not establish low latency for spontaneous explanatory speech. Repeat weaker System One comparisons only once the candidate/grounding policy earns this gate.
