# Cloudflare Clef comparison protocol

EXP-027/028/029 · 17 October 2026 · Extension of the existing offline decision experiment.

## Design frozen before quality runs

Use the unchanged prepared corpus, 12 calibration queries, 24 evaluation cases, prompts, menu construction and scoring from EXP-024/025. Evaluate Cloudflare Clef, Clef-flash and Clef-omni using the same existing OpenRouter Decisions endpoint/credential; rerun Jev as a contemporary reference. Do not add Cloudflare credentials, deploy Workers, install model weights or change the application default.

Run both `semantic` (development-calibrated presence gate) and `semantic-raw` (no gate). Each provider/method gets one attempt on every evaluation case. This gives 48 requests per provider, 192 quality requests total. Three earlier single-case connectivity calls are retained separately and do not count as independent quality cases. Cap each benchmark invocation at 96 hosted requests and $0.02 recorded usage; stop subsequent hosted requests if cost metadata is unavailable. Cases, labels and prior failures have already been seen during development: this remains a synthetic development screen, not a new independent holdout.

Primary metrics: full action-plus-topic-set correctness over all 24 cases, validity, wrong shows, missed context requests, all-attempt request median/p95, and provider-reported cost. Keep invalid/timeouts/errors in denominators. Preserve exact source snapshots and raw requests/responses, report response model IDs and paired errors. No prompt/threshold tuning from these results. Sequential provider ordering is not randomized; one sweep cannot establish a universal latency or quality winner.

All inputs here are text. Cloudflare's documented media support and open weights remain researched capabilities, not tested local/media integrations. Hosted results do not measure self-hosted Clef or direct Cloudflare Workers AI latency/cost. Vendor published compute timings are not equivalent to our OpenRouter network-inclusive timings.

## Reproduce

```sh
# Existing embedding runner must be running; the benchmark does not require local Laya.
SHORTLIST_PROVIDERS=clef,clef-flash SHORTLIST_METHODS=semantic,semantic-raw npm run benchmark:retrieval -- RUN-unique-clef
SHORTLIST_PROVIDERS=clef-omni,jev SHORTLIST_METHODS=semantic,semantic-raw npm run benchmark:retrieval -- RUN-unique-omni-reference
```

Cloudflare's current family is documented in its [launch post](https://blog.cloudflare.com/clef-decision-models/), [Clef model page](https://developers.cloudflare.com/workers-ai/models/clef/), [Clef-flash model page](https://developers.cloudflare.com/workers-ai/models/clef-flash/) and [October 9 update](https://developers.cloudflare.com/changelog/post/2026-10-09-clef-omni-workers-ai/). OpenRouter lists [Clef](https://openrouter.ai/cloudflare/clef), [Clef-flash](https://openrouter.ai/cloudflare/clef-flash) and [Clef-omni](https://openrouter.ai/cloudflare/clef-omni). Verify availability and pricing at rerun time; recorded usage in our run is authoritative only for those requests.
