# Workflow, materials and visual generation validation

16 October 2026. These are bounded prototype checks, not production readiness.

## Automated checks

22 tests pass, including two interview-to-story orchestration cases, real SDK
visual-tool execution with deterministic model streams, invalid node/source/flow
references, source-label/number checks, exact decision-cache reuse and invalidation,
legacy audience-note privacy, pause/cancellation, and transport isolation.

The material integration test starts a separate server, creates clearly synthetic
PDF/DOCX/PPTX/XLSX/image fixtures, uploads and extracts them with actual local
MarkItDown/Pillow, checks local image serving, and rejects unsupported file types
and foreign upload origins. This test requires the documented Python setup and
skips if `.venv/bin/python` is absent. It ran without skipping on this machine.

TypeScript and production Vite build pass. Mermaid's optional renderer bundles
include large chunks; importing chart/diagram renderers is lazy. Bundle size and
first-render latency should be measured before broader deployment.

## Actual local model

`npm run probe:visuals` used Qwen3.5 4B, a synthetic CSV source and a fixture brief.
It prepared a diagram and bar chart, then a three-beat flow referencing both
returned IDs, in 34.69 seconds. No agent errors in the successful run. See
`visual-agent-validation.json`. Earlier attempts failed; a redundant literal `kind`
field was removed from the agent tool inputs because models supplied descriptions
such as “process flow” rather than the discriminator. The host now supplies the
kind based on the invoked tool. Failed draft changes were not committed.
This is one successful scripted tool-use trial, not a chart factual-quality study.

## Recorded speech and cache

The five-case replay (`npm run probe:speech-loop`) passed: storage selection,
off-topic hold, exact repeated off-topic hold, pause, and resume with fresh
speech. Actual Moonshine and Qwen were used. Uncached final-text-to-direction times
were 1,792 ms, 1,592 ms and 1,887 ms. The repeated phrase at the same beat was a
cache hit, 0.10 ms after final transcription, without model inference. Websocket
RTT p95 was 0.79 ms. These few samples do not establish latency percentiles or
causal improvement. Cache-hit and uncached timings are deliberately separated.
The earlier four-case baseline/report is historical; current evidence is in
`speech-loop-cache-validation.json`.

An initial cache replay did not hit because the model populated the missing-context
question field with explanations/rationale. Those requests were intentionally not
cached. The field description now requires an empty string for known concepts and
unrelated remarks, and permits only genuine questions about explicitly requested
missing presentation content. That corrected replay passed. Semantic decision
caching, embedding retrieval and physical microphone behavior remain unvalidated.

## Browser and visual checks

Using a separate browser profile and an explicitly seeded story fixture:

- Attached a PDF using the composer file input and saw its filename in conversation.
- Confirmed no material/agent tabs or manual brief/flow editors.
- Rendered both a Mermaid diagram and a Recharts chart in the story preview.
- Saved a story and loaded it in Canvas; no composer/details/model-loader controls.
- Started automatically with a synthetic silent browser MediaStream: actual
  AudioWorklet, server speech loading and presentation startup completed.
- End stopped the presentation. This did not request a physical microphone.
- Checked desktop and 390-pixel mobile layouts; no horizontal overflow.
- Inspected screenshots: `redesign-interview.png`, `redesign-story.png`,
  `redesign-canvas.png`, `redesign-canvas-mobile.png`, `redesign-story-mobile.png`
  under `output/playwright`.

## Remaining work

Physical microphone rehearsal, more accents and room noise, broad file/OCR
coverage, true multimodal image understanding, semantic retrieval and candidate
ranking, multi-asset ordering/reveal compositions, project/library management,
and renderer-framework comparisons remain open. The implemented upload/visual
and workflow changes should not be presented as filling all future product gaps.
