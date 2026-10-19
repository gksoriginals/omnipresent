# Full spoken rich-presentation demo

19 October 2026 · Actual local preparation and Chrome audio replay, with disclosed presenter edits.

This demo uses the current local Qwen interviewer/storyteller, source-backed synthetic teaching artifacts, Piper-generated voice, browser-clock-paced PCM, local streaming STT and the evidence-gated synthesis presenter. The displayed narrative text is not injected as recognized speech. The runtime was started with `OMNIPRESENT_COMPOSITION_PLANNER=synthesis`; the code's default remains focus.

## What happened

A fresh interviewer committed a brief for teachers. The storyteller generated three charts and a three-beat narrative. It then omitted the chart/image reference fields from the flow and assigned storage visual coverage to generation. A requested agent correction returned prose instead of the required tool call. The presenter review step explicitly bound the existing chart/image IDs and corrected storage coverage through `editFlow`, then approved the declarations. This was a real preparation run with human review intervention, not an autonomous success.

The first voice pass exposed recognition/endpointing failures: the generation sentence became separate fragments and "Morning output" was later recognized as "Morning outdoors." These are retained failures. A constrained demonstration narration was adjusted to speak the existing "Daily curve" heading, followed by explanatory speech. No incorrect transcript was replaced with the expected text.

The reviewed generation-first audio then produced a four-component generation canvas, two-component storage canvas, and four-component generation canvas again, with incidental and fragmented passages retaining current content. A storage-first variant tests the reversed order separately. Whole-request claim/source validation remains active; all displayed coverage declarations still have independent review pending.

The run also exposed two implementation gaps now addressed: an inferred form should be a preference rather than a spoken constraint for synthesis, and declared visual/image coverage must not silently omit an actual visual/image reference. Regression tests cover both. Explicit user form constraints remain intact.

## Limits and reproduction

This is synthetic, supplied-context demonstration data, not an independently reviewed speech/semantic benchmark. Some utterances still fail recognition. There is no physical microphone/room-acoustics test. Narration headings were tuned after observed failures; do not present this as untouched speech acceptance. The generation sentence still fragments and safely holds the canvas. No claim of general spontaneous-speech understanding follows.

Preparation artifacts and narrated variants are under `output/full-demo` and `output/adaptive-trial`. `scripts/prepare-full-demo.ts` runs actual local preparation; `scripts/review-full-demo.ts` records the explicit presenter corrections; `scripts/synthesize-trial.py` generates local Piper WAVs. The existing `/?trial=1` page plays and streams the samples into STT, rendering decisions as they complete. The Chrome tab is kept open for replay. The trial page's old one-click preparation prompt is a separate, older experiment and does not reproduce this reviewed rich preparation.

Frozen run evidence, actual transcripts, stage decisions, generated audio hashes, preparation/correction events, Chrome screenshots and software validation are registered under the full-demo validation run. These distinguish failed attempts, reviewed preparation, successful audible replay and remaining recognition failures.

## Recorded evidence

- [Frozen demo, transcripts and audio](../validation/runs/RUN-20261019-full-spoken-demo/demo.json)
- [Software audit: 115 tests passed; build passed](../validation/runs/RUN-20261019-full-spoken-demo-audit/run.json)
- [Generation-first Chrome capture](../validation/evidence/full-spoken-demo-chrome-generation-complete.png)
- [Storage-first Chrome capture](../validation/evidence/full-spoken-demo-chrome-storage-complete.png)

The validation catalog verifies 53 experiment/plan records, 115 tests and 33 screenshots, including this run.
