# Evidence contracts for prepared presentation content

17 October 2026 · Experimental technical boundary; no live schema migration.

The presentation runtime may select only content that supports the complete active explanation. Retrieval relevance and a valid asset ID are insufficient. An asset must have approved claim coverage and appropriate entity, timeframe, unit, provenance and verification scope. Unknown values remain unknown.

## Contract and preparation responsibility

The experimental schema is [evidence-contract.ts](../server/controllers/evidence-contract.ts). Each contract declares version, approval, provenance (source-backed/illustrative/unknown), audit verification, entity, timeframe and unit, source summary snapshots with hashes, covered claim IDs/aliases, and independent-review status. Source-backed describes the declared evidence origin; it does not automatically imply an audit or real measured numerical data.

The storyteller/preparation stage should propose these fields from actual source material. Claim entailment and cue bindings require review. Do not infer claim coverage from title overlap or mark assets accepted merely because a model generated metadata. Hashes identify the retained summary snapshot, not an independently authenticated full remote document. Review and source-withdrawal/version changes must invalidate dependent cue bindings and decisions.

The existing live Preparation schema is unchanged. Evidence contracts currently apply to the isolated prepared-library experiment; broader stable asset IDs and migration of existing stories need a separately tested compatibility path.

## Runtime responsibility

Interpret the active request into obligations. If its meaning or required scope is ambiguous, retain the canvas and ask privately for clarification. If requested claims or evidence are absent, retain it and request preparation context privately. For a selected asset, verify approval, review policy, all claims, scope, form and source references again before commit. A cue or model proposal cannot override the check.

The current interpreter is a bounded prepared-alias implementation. Unrecognized obligations fail closed, mixed quoted speech is conservatively held, and only a clear corrective active clause is resolved. It must not be described as general conversational understanding. Track useful positive coverage alongside unsupported-show rates so excessive abstention does not masquerade as quality.

Presenter feedback carries `audience: presenter`, missing-evidence/clarification kind, reason, claim IDs and unrecognized terms. The canvas is retained; missing facts are not fabricated or exposed as audience content. The host still owns epoch/revision cancellation and latest-result authority. In this experiment only identical-asset retention is implemented; intelligent reveal, emphasis and compatible multi-asset composition remain later policy work.

## Evidence and integration gate

[EXP-037](research/evidence_gate_results.md) records development quality and complete text-decision timing with changed-content refreshes, fallbacks and final validation. [The selected starter/review packet](research/source_backed_review.md) remains pending independent review. Default gating requires accepted review; benchmarks explicitly opt into pending-review material and label that exception.

Before live adoption, validate independently reviewed source-backed presentations and natural speech, media/renderer behavior, visible-paint latency and resource contention. Passing this isolated policy does not migrate or validate the live app.
