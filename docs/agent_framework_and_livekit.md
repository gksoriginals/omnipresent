# Agent framework, communication, and LiveKit assessment

> **Historical design and prototype record.** Later implementation notes and screenshots below describe the earlier browser product. Omnipresent now uses a native SwiftUI interface; use the [current architecture](architecture/current.md) and [macOS guide](desktop-macos-alpha.md) for active behavior and setup.

16 October 2026 · Provisional implementation decision; separate agent roles remain product requirements

## Decision for the current slice

Use **Vercel AI SDK ToolLoopAgent** for the interview and storyteller agents in the existing TypeScript/Node application. Keep the realtime presentation agent as a distinct future implementation. Keep local speech processing isolated from model/tool loops. Do not select a generative UI renderer as part of this decision.

This is a revisable framework choice, not a claim that the SDK is universally fastest. The current slice needs separate instructions/tools/context, streamed responses, bounded tool execution, cancellation, and explicit handoffs. Those can be implemented without adding a full workflow platform. The user explicitly chose a **local model endpoint** for the trial.

## Libraries assessed

| Candidate | Relevant strengths | Current decision |
| --- | --- | --- |
| Vercel AI SDK | TypeScript tool-loop agents, streaming, provider integration, explicit application workflow patterns. | Implement the current agents and typed coordination here. |
| LangChain / LangGraph | Agent building and explicit stateful graph orchestration; LangGraph addresses durable execution, branching, and human intervention. | Strong alternative if resumable/durable or complex background coordination becomes a concrete need. |
| Mastra | TypeScript agents, workflows, broader integrated application tooling. | Viable alternative; avoid introducing its additional workflow/application surface before needed. |
| LiveKit Agents | Realtime voice/media sessions, turn handling, interruption, handoffs, and tasks/delegation. | Evaluate as a voice/media-session option separately from story-state coordination. |

Sources consulted: [AI SDK agents](https://ai-sdk.dev/docs/agents/overview), [ToolLoopAgent reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent), [workflow patterns](https://ai-sdk.dev/docs/agents/workflows), [LangGraph overview](https://docs.langchain.com/oss/javascript/langgraph/overview), [Mastra agents](https://mastra.ai/docs/agents/overview). These establish documented features; comparative engineering fit is our judgment. No cross-framework latency benchmark was performed. Deep Agents was considered through the framework-selection guidance; its managed planning/filesystem/subagent surface is unnecessary for this bounded preparation slice.

## What agents communicate

Agents should exchange scoped, structured work products and requests rather than one shared unbounded conversation. Current application types are in shared/preparation.ts:

- **Interview brief:** topic, audience, outcome, duration, key points, constraints, and open questions.
- **Artifact references:** exact IDs and names, with text read through a bounded tool. Keep original material separate from model-written claims.
- **Story flow:** title/summary and narrative beats with speaking notes, visual directions, artifact IDs, and open questions.
- **Feedback events:** sender, recipient, kind, revision, ID, and summary for brief updates, proposed flows, missing context, and presenter corrections.
- **Presenter review:** a separately recorded review revision; model tool calls cannot approve their own output.

Each agent has its own conversation history and role-specific tools. The interviewer can read material and update the brief. The storyteller can read material, propose a flow, and request missing context. It cannot alter the interview brief or operate the live canvas. Supporting agents can later consume/produce the same kinds of referenced work products without receiving all private chat history by default.

These initial schemas serve a testable slice, not a permanent exhaustive product ontology. Correlation/causation IDs, durable event replay, specialist dispatch, and richer artifact types remain possible extensions as coordination becomes real.

## Continuous feedback, not an endless model loop

Two interacting loops are needed:

1. **Preparation/revision:** context and assets → storyteller proposal → missing-context request or presenter feedback → revised brief/assets → revised flow → presenter review.
2. **Live presentation:** speech/context → intent and retrieved material → proposed visual response → host validation/timing → canvas → new speech/corrections. Background agents may prepare missing material and return candidates without freezing the live stage.

A continuous product loop should wait for meaningful events rather than call models constantly. Bounded tool loops are different from the product’s long-lived event loop. Do not rerun every preparation agent on each transcript update.

The current implementation supports feedback through typed events and presenter-mediated return to the interviewer. It does **not** implement an autonomous supervisor, background specialist network, or the realtime reasoning loop. Missing-context requests are visible and answerable; they do not recursively spawn unbounded agent turns. Cancellation, deadline limits, and revision checks reject stale results; brief/material edits invalidate flow review. An incomplete, cancelled, or failed model run does not commit its draft mutations.

## Do we need LiveKit?

**Not as a dependency of the current local preparation slice.** It becomes valuable to test when we need a spoken interviewer with interruption handling, remote clients, multiparty audio/video, or screen sharing. It could replace parts of our audio/session plumbing rather than act as a generic agent message bus.

LiveKit’s [Agents overview](https://docs.livekit.io/agents/) documents Python/Node realtime agents and a media pipeline. Its [workflow guide](https://docs.livekit.io/agents/logic/workflows/) distinguishes conversational agents, tasks, handoffs, and background delegation. Its [handoff guide](https://docs.livekit.io/agents/logic/agents-handoffs/) explains that handoff transfers session control with explicit context preservation. That is different from keeping a live presenter agent active while a researcher or storyteller works in the background.

Audio output can be disabled: a silent visual co-presenter is compatible with the documented [text/transcription controls](https://docs.livekit.io/agents/multimodality/text/). LiveKit also supports [local console startup](https://docs.livekit.io/agents/server/startup-modes/) for development and a [self-hosted local server](https://docs.livekit.io/transport/self-hosting/local/). Cloud is not inherently required, but a browser/room deployment still introduces media/session infrastructure and operational choices. Console mode alone is not the browser integration.

LiveKit does not decide our brief/flow schemas, evidence ownership, revision semantics, visual composition, or when a scene should change. Custom Moonshine integration and local model support must be verified for the chosen SDK/version; no plug-and-play Moonshine adapter is claimed by this review.

**Revisit with a bounded voice experiment** when spoken interviewing or remote media is in scope. Compare it against our current local path on interruption, transcript behavior, speech-to-response latency, recovery, and deployment burden. No LiveKit packages, Cloud project, or credentials were added here.

## Current implementation and configuration

Pinned packages are recorded in package-lock.json. Agents run through the configured OpenAI-compatible endpoint; this is a protocol adapter, not a requirement to use a hosted OpenAI API. The model endpoint/key stays on the server. See [provider compatibility](https://ai-sdk.dev/providers/openai-compatible-providers) and [Ollama compatibility](https://docs.ollama.com/api/openai-compatibility).

Default local configuration:

```sh
ollama serve
ollama pull qwen3.5:4b
npm run dev
```

If Ollama is already running, do not start another instance. Copy .env.example to .env to override the endpoint/model; restart the server after changing it. No provider key is needed by a default local Ollama server. Endpoint availability and cached model availability are separate; failures are visible and do not fall back to fixtures. Ollama thinking is disabled through the compatible request setting for the default local port; other endpoints retain their own behavior.

The UI now offers Prepare and Canvas views, with distinct Interview and Story conversations. Text uploads are limited to .txt/.md/.csv/.json, eight files, and 24,000 characters per file. Tool reads return bounded chunks. Other file extraction, web fetching, and image/video generation are not yet implemented. The review editor uses ordinary labeled fields for the brief and narrative parts; its design remains provisional.

Preparation is saved to this browser’s localStorage and restored into an independent websocket session. It is a single working presentation per browser origin, not a server-side project database, collaboration system, or durable workflow checkpoint. Concurrent tabs can overwrite the shared browser copy; do not treat it as collaborative persistence. Uploaded text and conversation may be sent to the configured endpoint on explicit agent runs. A remote endpoint changes that data boundary.

## Validation boundaries

SDK-level tests use an explicitly mocked language model with the real ToolLoopAgent and tools. They cover brief production, separate storyteller flow, feedback requests, invalid artifact references, presenter corrections invalidating review, and cancellation preventing stale writes. These establish application/SDK behavior, not real-model quality.

Build/type checks and existing runtime transport tests remain required. Actual local-provider results, model download status, browser checks, and limitations are recorded separately as implementation progresses. No synthetic fixture is substituted for real user-facing generation. The realtime presentation agent and generative UI comparison are still pending.

## Implementation result for this iteration

AI SDK 7.0.142, openai-compatible 3.0.70, and Zod 4.6.7 were pinned. Build/type checks and all nine tests pass. Five agent tests exercise the actual SDK with an explicitly mocked provider; four existing tests cover session/transport behavior. No mock provider is reachable through the user-facing application.

Ollama 0.34.0 was available locally, but no models were cached. Attempts to fetch qwen3.5:4b failed with EOF/interrupted transfer errors. The application’s actual local endpoint path returned “model not found,” retained the user’s message, and did not fabricate a response. Live interview/story generation is therefore unvalidated and blocked by model availability. The installed Ollama application was not upgraded; partial downloaded artifacts may remain in its cache for resumption.

Browser checks use the explicit tests/fixtures/preparation.json state to inspect story rendering, review/edit behavior, and browser persistence separately from generation. Fixture previews are not model-authored output. An npm run probe:agents command is available to exercise the actual local interviewer → storyteller path and save output/probe/agent-live-results.json once the configured model is available.

The [retained validation record](research/agent-preparation-validation.json) distinguishes SDK tests, fixture-driven browser checks, actual local-provider failure, and unimplemented features. Desktop/mobile story rendering, flow review, brief editing, persistence after reload, and review invalidation were checked in the browser.

## Realtime loop implementation and validation — 16 October 2026

The third, separate AI SDK agent is implemented in `server/agents/realtime.ts`.
After a current story is reviewed, **Present reviewed story** creates an immutable
snapshot for the live session. The opening beat appears immediately. Final local
STT phrases (or typed rehearsal speech) reach the director, which calls
`directCanvas` to select a zero-based approved beat, hold the current scene, and/or
request missing context. Only validated tool output can update the canvas.
The renderer currently composes the approved title and speaker notes as supporting
text. This is a deliberately limited vertical slice: visual directions, image/media
assets, chart generation, and competing generative UI renderers remain unimplemented.
Speaker notes need a separate audience-facing copy field before broader use.

Communication: interview → brief → storyteller → reviewed flow snapshot → realtime
director → canvas commit → next speech window. Director context requests return as
`context.requested` events addressed to the interviewer and appear in preparation.
The presenter answers there, regenerates/reviews the story, then ends/restarts the
presentation to adopt it. Specialist agents do not automatically rewrite a live
story or recursively invoke one another. This is an event-driven speech loop,
not a free-running autonomous agent loop.

Concurrency: one inference at a time per presentation, with at most one pending
speech window bounded to the latest 6,000 characters; a 30-second inference timeout.
Pause, end, reconnect and cancellation invalidate prior generations and discard
queued speech. Resume waits for fresh input. Model errors preserve the current
scene. Preparation edits do not mutate the active story. Manual canvas text pauses
the director. Session state remains ephemeral and local browser preparation storage
has the previously documented limitations. Raw final speech no longer goes straight
to the audience canvas; it requires an active reviewed presentation.

Validation: all 14 automated tests pass and the production TypeScript/Vite build
passes. Five new realtime tests use the actual SDK tool loop with deterministic
model streams: review gating/scene selection, hold/context feedback, invalid beat
rejection, pause cancellation/resume, and snapshot isolation. Browser verification
using the explicitly seeded preparation fixture confirmed reviewed-story startup
and the opening scene (`output/playwright/realtime-reviewed-story.png`). These are
fixture-based checks, not local inference results. The live probe was extended
through approval and realtime direction (`npm run probe:agents`), but its execution
fails at the first interviewer request: Ollama `/api/tags` returns no installed
models and `qwen3.5:4b` returns 404. Actual model quality, physical microphone use,
and speech-to-scene latency under concurrent inference are still unvalidated.


### Local model retry succeeded — 16 October 2026

The previous missing-model blocker is resolved. `ollama pull qwen3.5:4b`
again failed with EOF, but a direct HTTPS download of the registry model blob
completed. Its SHA-256 matched the registry digest
`a9d0a3e1d8c91732a3812becd31f8d4a8ff57414903f226306069f0437e2ac50`.
After placing that verified blob in Ollama's cache, a normal `ollama pull`
completed digest verification and manifest registration. No Ollama upgrade,
hosted service, or application endpoint change was needed.

`npm run probe:agents` then passed with actual local Qwen3.5 4B Q4_K_M:
interviewer 13,408 ms; storyteller 21,962 ms; realtime director 2,568 ms.
The model produced a brief and three beats with valid artifact references, and
selected beat 1, “Batteries: Storing Energy for Later”, from the phrase about
storing energy after sunset. No agent errors were reported. The probe now
separately records storyteller and realtime timings and checks completion events
after the direction request. Evidence: `docs/research/agent-live-validation.json`.

This is one scripted trial, not a model-quality benchmark. The probe supplied a
typed rehearsal phrase and programmatically approved the story for handoff; it
did not measure human review or microphone/STT-to-scene latency. The generated
story contains wording that needs editing (including a circular battery analogy
and an overly broad generation/storage conclusion). Passing protocol validation
does not establish factual or editorial quality. The measured 2.57-second
single direction latency still needs improvement and repeated testing for live
presentation use. The installed model uses the existing default endpoint
`http://127.0.0.1:11434/v1`, so the running application can now use it.

### Speech-to-canvas and audience-copy follow-up — 16 October 2026

See [speech-loop validation](research/speech-loop-validation.md) and its JSON
results. Actual local STT + Qwen inference now passes the four recorded-audio
checks: storage selection, off-topic hold, pause, and resume with fresh speech.
This supersedes the earlier statement that only typed rehearsal input was tested;
physical microphone capture remains untested. Initial trials exposed transcription
and beat-selection errors, described in the report. The revised director prompt
and bounded schema passed the final trial. Post-final-transcript directions took
2.28–2.92 seconds; that is not a demonstrated latency improvement.

The canvas now renders `audienceText`, never `speakerNotes`. Legacy flows without
audience text show titles only. The storyteller prompt and editor support the new
field. Earlier descriptions of rendering notes apply only to the previous slice.

### Workflow and prepared visuals — 16 October 2026

The interview and storyteller now appear as one preparation conversation. The
presenter finishes the interview to trigger the handoff, revises by chat, and saves
snapshots for Canvas. Mermaid and Recharts tools prepare reusable visuals, while
local MarkItDown extraction handles PDF/Office attachments. Speech setup is
behind Start presentation. Product diagnostics/manual canvas controls and separate
material/agent tabs are removed. Exact repeated-speech caching is implemented;
semantic retrieval remains experimental. Current architecture and validation:
[materials](materials_and_visual_tools.md), [latency](latency_and_prepared_content.md),
[validation](research/workflow-redesign-validation.md). These supersede the earlier
UI description while preserving the underlying separate agent roles.
