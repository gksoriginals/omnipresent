# Practical policies for intelligent presentation composition

17 October 2026 · Research and repository gap assessment · Proposed experiments, not measured improvements.

## Recommendation

Build and benchmark a small presentation policy around prepared content before repeating the weaker System One model comparisons. The system should understand which content is eligible, choose a useful composition, and prefer the smallest sufficient change. System One can resolve ambiguity among feasible plans. No new framework, solver, hosted service or live-default migration is selected here.

A story is a preparation view and a narrative prior. It is not a fixed sequence that speech commands advance. The current canvas can retain, emphasize, reveal, combine or revisit prepared content independently of the planned order.

## What the repository already supplies

- [Adaptive composition schema](../../shared/adaptive.ts): focus/split/sequence layouts, one to four blocks, stable slots, emphasis and reveal. Host checks enforce known prepared references and unique slots. These are structural checks, not claim correctness or readable composition guarantees.
- [Controller prototype](../../server/controllers/presentation-policy.ts): unchanged-content holds, score/margin gates, dwell, confirmation, lifecycle/epoch/sequence checks and missing-evidence feedback. Its numerical thresholds are experimental, not validated presentation UX rules. These controllers are offline prototypes, not the current live default.
- [Coordinator](../../server/index.ts): only final nonempty transcript events enter the decision loop. [Adaptive agent](../../server/agents/adaptive.ts) bounds pending work and rejects stale results. Its prompts already encourage reuse and progressive reveal; prompt instructions do not establish reliable policy compliance.
- [Hybrid index](../../server/controllers/hybrid-components.ts): prepared references, BM25 plus dense retrieval, scoped exact-query caching and optional component-family facets. It does not establish that two relevant assets are appropriate together.
- [Forecast prototype](../../server/controllers/component-forecast.ts): bounded leases and prior-context hints. It sees aggregate family availability, not a complete topic-to-asset relationship map. A valid lease can still be semantically stale after a same-position topic change.

The [latest experiment](prediction_first_results.md) found full hybrid ranking around 0.090 ms median on nine components, versus about 27.4 ms for query embedding and hundreds of milliseconds for hosted decisions. Those fixture-specific results favor reducing unnecessary inference and visible disruption before optimizing tiny candidate scans. They do not establish performance at large catalog sizes.

## Techniques worth testing

| Technique | Concrete behavior | Current gap and priority |
| --- | --- | --- |
| Eligibility before relevance | An actual school-cost question cannot use a synthetic example or an unrelated roof survey, even if both retrieve highly. Check entity, metric, unit, time period, population, source and actual/illustrative status. | Known-reference validation exists; semantic eligibility contracts do not. P0. |
| Prepared cue bundles | Prepare a claim, approved evidence, useful visual partners, aliases and suitable layouts together. Record topic-to-available-family mappings and supports/contrast/prerequisite relationships. | Beats have references and prose directions, but no typed cue graph or reusable composition bundles. P0. |
| Small rhetorical grammar | An explanation may use a visual plus takeaway; a process uses a diagram; a comparison uses compatible partners; a recap uses a concise summary. Select from feasible templates using intent and evidence. | Layout enums exist; host-enforced content compatibility, duplicate suppression and readability budgets do not. P0. |
| Minimum sufficient change | Keep the battery diagram while discussing evening storage; reveal the battery or emphasize its existing slot instead of replacing the scene. | No-op and dwell exist. Semantic change cost and reliable hold/focus/reveal/replace selection remain unvalidated. P0. |
| Contextual cue fast paths | Resolve an unambiguous approved asset alias or “the left chart” against the current canvas. Preserve negation, numbers and corrections. | Exact query caching exists; discourse/reference resolution and safe inference bypass rules need development. P1. |
| Neighborhood plus escape | Prefer current/supporting/nearby material while reserving global hybrid candidates for detours and corrections. | A soft narrative graph prior and a diversity-aware shortlist are missing. Hard family exclusion has already lost relevant content in the prototype. P1. |
| Bounded next-asset warming | Warm a few likely support/comparison assets without authorizing a visible change. Invalidate on meaningful topic/entity/metric changes as well as revision and epoch. | Current reference-prefetch replay did not measure real asset loading or live resource contention. P1, after measuring actual load costs. |
| Presenter authority | Keep/pin, release, reject or undo a composition; a clear correction can outrank ordinary dwell while pause and revision safety remain authoritative. | Lifecycle cancellation exists; pinning, presentation undo and correction-priority policy are not established. P1; preserve the minimal UI. |

P0/P1 indicate proposed experiment order, not release requirements or an irreversible architecture.

## Composition needs more than relevance

Separate hard constraints from preferences. Hard constraints include approved evidence, valid references, compatible comparison scopes, available media and feasible renderer geometry. Preferences include relevance, complementary information, current anchors, recent exposure and the cost of moving attention. Unsupported combinations must not become acceptable merely because they score highly.

Use a small set of host-owned templates first. A comparison should state whether axes, units and time ranges align; if they do not, label the distinction or reject that template. Avoid repeating the same headline and the same visual in multiple slots. Preserve component positions when meaning is unchanged. Count meaningful information and check rendered dimensions rather than treating the existing four-block maximum as a readability guarantee. Device size, font size, visual complexity and audience conditions require visual validation.

A provisional plan utility can combine intent fit, evidence coverage and complementarity, with penalties for redundancy, scene disruption and loading cost. Do not assume universal weights or interpret raw retrieval scores as calibrated decision probabilities. Measure and tune on development cases, then freeze before holdout evaluation.

## Speech is contextual, not a keyword command language

“Compare generation with evening use” can justify a compatible pair; “I am not asking for the generation chart” must not trigger it. Quoted instructions, hypothetical statements and self-corrections require different handling from direct intent. A unique title match is useful evidence, not sufficient authorization by itself.

Maintain a compact discourse frame: active topic/claim, relevant entities and quantities, current canvas references, unresolved contrast and recent corrections. Prefer a trusted exact mapping only when context and eligibility agree. Ambiguous pronouns or competing claims should retain the current canvas or use a bounded decision step. Unknown evidence should produce private preparation feedback; unrelated speech normally warrants a hold. Neither requires inventing audience content.

The existing final-transcript gate reduces partial-text churn but does not solve clause boundaries, speech corrections or topic tracking. Further segmentation must be evaluated with real STT output before changing the speech pipeline.

## Current composition and next preparation are different jobs

Current composition must be grounded in what the presenter has actually said. Future warming is speculative and must never show content by itself. Start with deterministic neighbors and a small beam of support/contrast alternatives. Keep a global escape path for a detour.

Prioritize speculative work by estimated probability of use before expiry multiplied by blocking latency saved, accounting for wasted computation, memory, network and cancellation. This is an engineering hypothesis, not a calibrated formula. Resident text references offer little loading benefit; images, diagram rendering, video decoding and fonts may have meaningful costs that must first be measured. Background work must not delay STT or the current render.

The prior-context experiment prefetched the exact next reference in only 4/12 positive cases with two-family forecasts. Both positive reused forecasts missed the next family. TTL and story position alone are insufficient freshness signals. Do not repeat low-performing model comparisons until the proposed routing/availability improvements demonstrate useful quality and latency.

## Research basis and limits

[Draco, University of Washington Interactive Data Lab](https://idl.uw.edu/draco/) represents visualization design knowledge as constraints and uses a solver to explore chart designs. The transferable idea is to distinguish valid designs from preferred designs. Applying it to presentation composition is our inference; installing Draco/Clingo is unnecessary for the first small template baseline.

[Carbonell and Goldstein, MMR, SIGIR 1998](https://www.cs.cmu.edu/~jgc/publication/MMR_DiversityBased_Reranking_SIGIR_1998.pdf) combine relevance with novelty to reduce redundant retrieval results. Test an analogous diversity term after eligibility filtering so near-duplicate components do not consume the shortlist. This paper evaluates documents and summaries, not live presentation quality; it does not prove that diversity improves our canvas.

[Horvitz, Principles of Mixed-Initiative User Interfaces, CHI 1999](https://www.microsoft.com/en-us/research/publication/principles-mixed-initiative-user-interfaces/) examines coupling automation with direct manipulation. Our application is a conservative assistant with presenter control and recoverable changes. Its relevance is interaction design, not a measured latency benefit for Omnipresent.

The remaining proposals above are engineering deductions from our code, failure cases and product intent. They are not findings that these papers tested our architecture.

## Next experiment: policy before model expansion

Status: planned, no new benchmark executed for this document.

1. Create a small versioned preparation manifest with claims, evidence scopes, aliases, composition partners and layout options. Validate metadata against sources; unknown fields remain unknown. Keep existing preparation compatibility while prototyping.
2. Freeze labeled development and untouched holdout scenarios. Include paraphrases, negation, quotations, pronouns, explicit corrections, actual versus illustrative data, incompatible comparisons, repeated explanations, detours, missing evidence and same-position topic changes. Include natural speech transcripts in addition to synthetic cases.
3. Compare the existing hybrid baseline with incremental eligibility, cue/template and minimum-change policies. Keep retrieval and prepared content fixed where possible; report any metadata changes as an explicit experimental factor. Test graph-based preloading separately from visible decisions.
4. Record candidate recall, unsupported shows/pairings, useful holds, unnecessary replacements, correction responsiveness, complete composition quality and human readability judgments. Track inference calls per presentation minute, final-transcript-to-visible-paint median/p95, cache hits, preload hit/waste and resource contention. Report failures and denominators. Offline decision timings cannot establish paint latency.
5. Run deterministic replay first. For changed geometry, scheduling or speech integration, follow with browser/audio validation and stale-work/cancellation checks. Preserve input/source hashes, raw traces, versions and reproduction commands under the existing validation workflow.
6. Only after quality and latency gates are met, compare System One candidates on the remaining ambiguous feasible plans. Predeclare gates and noninferiority margins using product needs and baseline evidence; do not choose thresholds after seeing the holdout.

The first implementation should prove that prepared evidence plus a small composition policy improves useful decisions without extra inference. A finite state machine can own lifecycle and timing, while an ordered rule set or behavior tree evaluates eligibility, templates and change operations. These responsibilities can be composed; their comparative value still needs an ablation rather than another framework selection.
