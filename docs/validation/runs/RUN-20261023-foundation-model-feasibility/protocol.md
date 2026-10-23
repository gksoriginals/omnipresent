# Foundation Models provider feasibility

## Question

Can Apple's native Foundation Models API handle small, evidence-scoped preparation proposals well enough to justify a deeper provider adapter, while keeping source eligibility, factual validation, and commit in Omnipresent's TypeScript host?

## Frozen comparison

- Cases are synthetic and fixed in `cases.json` before inference.
- Run each exact case once with Apple's `SystemLanguageModel.default` using Foundation Models guided generation and once with the already-installed local `qwen3.5:4b` through the existing Ollama endpoint.
- The same instructions, prompt, JSON fields, and host-side structural checks apply to both. Foundation Models additionally uses its native guided output schema; Ollama uses JSON response mode.
- The probe has no tools, web access, private files, or evidence authority. It can only return source ID strings.
- No model weights are downloaded and no hosted or billed endpoint is called.

## Checks

Record availability and context size. For each response, check JSON shape, exactly three beats, all source IDs in the supplied allow-list, and use of every required source ID. Manually inspect whether claims are supported and whether the missing-evidence case abstains. Two authored cases are feasibility examples, not an independent benchmark or migration acceptance test.

## Decision boundary

Proceed to a provider adapter spike only if Foundation Models completes both cases, meets all host-side shape/reference checks, and does not invent unsupported factual claims. A passing result still does not establish full agent tool-loop compatibility, long-material fit, latency under load, cancellation, or production readiness. A failing result is retained as evidence and the current local path remains the default.

## Observed result

The native model passed output shape on both cases and exact references on the missing-evidence case. It changed all three IDs in the supported-story case to `source route-a`, `source route-b`, and `source survey-c`; these are unsupported references under the frozen allow-list and fail the host check. The two factual beats were otherwise grounded in the supplied text. The missing-evidence answer named absent ridership, comparison, and cost inputs and asked for them without inventing a result. This fails the stated integration gate, so the production adapter spike is deferred. See `comparison.json` for complete retained valid outputs and timings. The malformed first Qwen response was recorded as a parse failure; its raw text was not retained by the initial harness.
