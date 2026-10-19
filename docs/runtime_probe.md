# Runtime probe

> **Archived prototype record.** This first runtime probe used a standalone browser UI and optional Python workers. It is retained for historical measurements only; the active product is now a SwiftUI macOS app with a TypeScript coordinator. The old launch commands and Moonshine WASM measurements below are not current setup instructions or speech acceptance.

16 October 2026 · First working implementation, not the complete product

## Implemented

A TypeScript/React canvas, a Node.js session coordinator, and isolated Python workers establish the starting runtime. The canvas is deliberately simple: a white presentation surface, compact controls, and details hidden by default. This follows the user’s requirement that the UI remain a clean, sleek canvas. The probe’s diagnostic and input controls are development aids, not a settled product layout.

Manual text can update the stage. Moonshine Small Streaming can transcribe browser-captured speech locally; final phrases update the stage directly. This behavior tests transport and processing, not semantic understanding or generative presentation. Audio is captured only after Start listening and is not saved by the application. The model is downloaded on first load and cached by Moonshine outside this repository.

A separate eight-second synthetic CPU worker tests process isolation and cancellation. It is explicitly not an LLM. Pending stage updates are versioned, superseded by newer updates, cancelled on pause, and never replayed on resume. Each connection has an independent ephemeral session. Reconnection starts a new session; persistence is not implemented.

## Run locally

Requires Node >=22.12 and npm, plus uv for the optional local Python setup. The tested Node version is 22.22.1 and Python is 3.12.7. Dependencies are pinned in package-lock.json and runtime/requirements.lock. No global packages need changing.

```sh
npm ci
npm run setup:speech
npm run dev
```

Open http://127.0.0.1:5173. Manual text works without speech setup. For local speech, load the model, then press Start listening and grant browser microphone access. Pause stops stage changes while listening continues; Stop listening stops capture. Closing the tab stops capture and its workers.

For a built client served by the local coordinator:

```sh
npm run build
npm start
```

Open http://127.0.0.1:4317. The application binds to loopback; this is not a deployment recipe. Browser sessions have bounded websocket messages and audio backpressure, and foreign browser origins are rejected. There is no internet-facing authentication or production hardening.

## Reproduce the runtime measurements

With the session server running:

```sh
npm test
npm run probe:audio
npm run probe
```

The audio command downloads a checksum-checked fixture from the upstream Moonshine repository. Probe reads a 16 kHz mono PCM16 WAV and feeds 250 ms frames at real-time rate over the same socket/worker path. It sends pings concurrently, starts synthetic load, and checks stale-update rejection, pause, cancellation, partial transcripts, and final transcripts. Machine-readable detailed output is saved to output/probe/results.json; output is ignored by version control.

The retained [measurement summary](research/runtime-probe-results.json) records an actual run on the Apple M5/16 GB machine:

| Measure | Observed value |
| --- | --- |
| Audio duration / replay wall time | 44.37 s / 44.63 s |
| Warm speech worker initialization | 337 ms |
| Session round trip p50 / p95 / maximum | 0.23 / 0.67 / 4.25 ms |
| Audio-frame processing p50 / p95 / maximum | 38.5 / 129.6 / 154.0 ms |
| Synthetic-load cancellation acknowledgement | 11.3 ms |
| Partial / final transcript events | 73 / 13 |

These are one-run observations, not a benchmark distribution across sessions. Per-frame processing excludes audio acquisition/phrase finalization and is not speech-to-scene latency. Cancellation measures the application acknowledgement, not exact OS process-reaping latency. Warm model initialization excludes the first model download. Node RSS and event-loop measurements exclude the Python workers and browser; event-loop sampling uses 10 ms resolution. Synthetic stress overlaps part of the speech replay, not its full duration. No LLM/embedding contention was measured.

## Verification and limits

Type checking and production build pass. Four tests cover delayed/stale stage updates, pause/resume, cancellation, session isolation, malformed/oversized text, and foreign origins. An actual speech worker produced partial and final transcripts during recorded-audio replay. An initial probe exposed transcript events redirected to stderr along with library output; the worker now keeps its JSON protocol on a dedicated stdout reference, and the rerun passed.

Playwright exercised manual text, pause/resume, model loading, and the browser AudioWorklet path using an explicitly simulated microphone fed from the recording. Desktop and narrow-window previews were inspected. The first browser run exposed over-aggressive single-frame backpressure; a bounded jitter queue replaced it, and a follow-up browser run produced the expected first final phrase without errors. This follow-up was not another full 44-second benchmark. This verifies browser audio plumbing with synthetic input, not the user’s physical microphone, accent, or room. A real microphone walkthrough remains necessary.

Current capture uses simple averaged downsampling and 250 ms chunks. The final incomplete chunk may be discarded when capture stops; robust flush and higher-quality resampling remain follow-ups before treating capture as production-ready. The browser holds at most four pending audio frames (one second), plus one in flight, to absorb scheduling jitter. If processing falls further behind, listening stops with a visible message instead of queuing delayed speech indefinitely. Long text can scroll inside the probe stage; projector composition and readable-content limits remain product work.

At the initial runtime-probe milestone, no interview agent, story-plan editor, artifact ingestion, EmbeddingGemma, local LLM, Groq integration, or generative UI renderer was connected. A subsequent [agent preparation slice](agent_framework_and_livekit.md) adds interview/storyteller agents, bounded text upload, and brief/flow review; the measurements above did not exercise those agents. Renderer comparison remains open. The probe establishes a measurable starting boundary, not evidence that the final model combination meets latency or memory requirements.
