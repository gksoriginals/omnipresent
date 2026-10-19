# Adaptive presentation and spoken narrative trial

> **Archived browser-prototype record.** This preserves the earlier trial and its results. Standalone browser launch is retired; the supported product is the native SwiftUI macOS app. Do not use the old web URL or setup commands as current instructions.

17 October 2026

## Experience and implementation

The saved story remains narrative guidance, audience-facing content and prepared
assets. A new realtime adaptive director selects combinations of those references,
layout (focus, split, sequence), emphasis and progressive diagram node reveal.
It can revisit content or hold the current composition. It does not simply select
a next slide. The initial vocabulary is deliberately small and remains experimental.

`shared/adaptive.ts` validates stable slots and references. The host resolves exact
prepared text and visual data; the director cannot supply arbitrary HTML, URLs or
replacement chart measurements. Only a complete valid composition is committed.
Unknown assets, malformed tool output, cancellation and timeouts retain the last
valid canvas. There is one active inference and one bounded pending speech window;
pause/stop invalidates old responses. Explicit missing-content questions use the
existing origin-project feedback path. The earlier scene director remains available
for legacy protocol clients; normal presentation loads request the adaptive engine.

Both actual renderer packages share the same presentation React components:
OpenUI react-lang **1.0.1**, json-render core/react **0.21.1**. OpenUI is the provisional
normal-canvas adapter, not a concluded winner. The replay page exposes both.
Composition is currently generated through a neutral typed agent tool, then encoded
for each renderer. Therefore the replay comparison tests rendering and composition
behavior, not the speed of native OpenUI versus native JSON generation. The separate
`probe:renderers` smoke test directly generates each native format; its small sample
must not be presented as a statistical benchmark.

A nullable reveal prop was rejected by the OpenUI parser in this trial. The adapter
encodes no reveal limit as numeric zero; the domain contract still uses null. The
json-render adapter supplies its required context provider. A pinned OpenUI bootstrap
flag disables automatic development widgets on the audience canvas; this internal
integration point needs checking on upgrades. No hosted OpenUI gateway, repair API,
telemetry sink, queries or mutation tools have been enabled.

## Try it

With Ollama serving the configured model and the existing STT environment installed:

```sh
npm run trial:setup
npm run trial:prepare
npm run dev
```

Open [the spoken trial](http://127.0.0.1:5173/?trial=1).

1. Expand **Run the interview and storyteller live** and run the supplied-context
   interview. It creates a fresh trial brief, chart, diagram and story without
   modifying project chats. This test uses automatic review approval; inspect its
   story in the evidence section before playing. Normal projects retain Save/review.
2. Choose one of three narratives and a renderer, then press **Play spoken
   presentation**. The narration is audible while its PCM is streamed into STT.
3. Compare generation-first, storage-first and detour-and-return. Download replay
   evidence to inspect recognized passages, composition decisions and timings.

The page initially includes a previously generated real local-agent preparation,
so its voices can also run without rerunning preparation. Preparation failures leave
that prior trial available. Its source material is synthetic solar teaching data,
not a real project performance claim. Narratives share facts but vary order,
comparison, elaboration and off-topic remarks. This is a supplied-context agent test,
not an evaluation of a long open-ended interview.

## Voice and audio path

[Piper](https://github.com/OHF-Voice/piper1-gpl) 1.8.0 generates the voices locally,
in a separate Python 3.12 environment. Its GPL engine is an external test dependency.
The [LJ Speech voice card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/high/MODEL_CARD)
identifies public-domain training data. `runtime/tts-model.json` records voice hashes
and provenance; `runtime/tts-requirements.lock` pins the TTS environment. Review
voice distribution terms before packaging it in a product.

Generated WAVs are mono PCM16 at 16 kHz, with silence between passages for endpointing.
The browser plays and streams the same decoded samples, paced by AudioContext time,
in 250 ms acknowledged frames. It stops if transport falls more than two seconds
behind playback. Narrative text is never sent as presentation_speech or substituted
for recognized speech. This exercises real audio recognition, not a physical microphone
or room acoustics. Live TTS synthesis while presenting is not required: audio is
pre-generated and then streamed at speech speed.

## Evidence and limits

Initial browser traces are retained in `research/adaptive-baseline-validation.json`.
They showed multi-block compositions but also incorrect topic/visual selection and
opening-topic bias in the small local model. The director prompt was revised to give
the latest spoken passage priority and describe reference indices in its tool schema.
Follow-up results must be reported separately from that first run.

Neither schema validation nor renderer success proves relevance or narrative quality.
The current system composes prepared content; it does not yet generate new grounded
facts live, retrieve with embeddings, create novel graphics during speech, or implement
OpenUI statement-patch merging from native model output. Diagram node reveal is
supported; reliable timing and actual state continuity still require repeated testing.
Speech recognition errors and a few seconds of inference delay can produce late or
incorrect choices. Continue testing both formats rather than finalizing a framework
from one demo. Electron packaging remains a later step.


### Recorded follow-up results

All three follow-up narrations completed against one fresh browser-generated story:

| Narrative | Renderer | Decisions | Canvas changes | First topic |
| --- | --- | --- | --- | --- |
| Generation first | OpenUI | 8 | 5 | Panels |
| Storage first | json-render | 8 | 4 | Storage |
| Detour and return | OpenUI | 6 | 5 | Daily energy pattern |

Per-run inference medians were approximately 3.3 seconds; observed per-run p95 values
were 3.4–4.1 seconds. These exclude speech duration, endpointing, queued work and
rendering, and are exploratory samples, not latency guarantees. The storage run
had one rejected model response; its canvas stayed valid and later updates resumed.
The off-topic passage produced no canvas change, although the model returned the
same composition rather than explicit null. Some later visual choices still
mismatched the explanation. Progressive reveal support was not reliably exercised
in these follow-up runs. Initial preparation attempts also failed before the
successful browser run; preparation now uses temperature zero and the test allows
one retry when the interview returns no brief.

`research/adaptive-followup-validation.json` retains preparation, speech and
composition traces. The baseline used an earlier preparation as well as an earlier
prompt, so this is not a controlled measurement of prompt improvement alone.
`research/renderer-format-baseline.json` and `research/renderer-format-validation.json`
record two native-format requests per library before/after prompt clarification.
All four outputs in each smoke run failed domain/format validation. JSON generations
omitted the required elements envelope; OpenUI generations invented components,
misordered arguments or requested unavailable assets. Do not select a framework
from this result: it demonstrates that this small model/prompt pairing is not ready
for direct native-format canvas generation. The running demo uses validated tool
output and deterministic adapters instead.

39 automated tests and the production build pass. Native browser window widths
1280, 900, 700 and 1070 px were checked. Screenshot review found a Recharts zero-width
measurement ancestor interacting with a percentage max-width rule; that rule was
corrected and chart SVG width was rechecked across all four sizes. The final chart
screenshot is `output/playwright/adaptive-chart-fixed.png`. Existing optional
Mermaid bundle-size warnings remain.

The next useful iteration is better topic/asset relevance, stable hold/reveal
behavior, bounded correction and speech-window timing evidence. Compare model/prompt
choices on these saved replays before committing to native OpenUI, native JSON or
Electron packaging.
