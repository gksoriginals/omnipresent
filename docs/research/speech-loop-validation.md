# Speech-to-canvas trial — 16 October 2026

## What ran

`npm run probe:speech-loop` generates four speech clips using macOS local `say`,
converts them to mono 16 kHz PCM16, and replays them at realtime rate over the
application websocket. The real Moonshine Small Streaming worker transcribes them;
actual local Qwen3.5 4B selects the scene. A dedicated server on port 4329 is
started and cleaned up by the script. The reviewed two-scene story is a fixture.
No physical microphone, browser AudioWorklet, human review, or agent preparation
is involved in this particular probe. Local generated audio is in ignored
`output/probe/speech-loop`; measured results are in `speech-loop-validation.json`.

## Findings and corrections

Initial runs failed: the storage phrase was transcribed as “Butter East or solar
energy for later use after sunset.” The director chose generation; another run
returned an out-of-range index. Host validation prevented the invalid commit.
The director now gets explicitly indexed scene data, per-index descriptions in
the tool schema, valid index bounds, a compact context excluding visual directions,
and instructions to match the main concept despite ASR errors. Temperature is zero.
A forced-tool experiment was not retained. These changes improved this scripted
trial; they do not establish robustness across accents, topics, or noisy rooms.

The final four checks passed:

| Input | Expected and observed | Final transcript to direction |
| --- | --- | --- |
| Storage after sunset | Storage scene | 2,920 ms |
| Unrelated lunch comment | Hold storage scene | 2,688 ms |
| Generation while paused | No inference or stage update | Not applicable |
| Fresh generation speech after resume | Generation scene | 2,283 ms |

There were 26 partial transcripts, no reported errors, and websocket RTT p95 was
0.83 ms. The two scene changes occurred 7.25 and 5.62 seconds after audio replay
began; those values include speaking time and are not speech-end latency. The
probe appends silence and explicitly stops each clip, so endpointing is partly
controlled. Final-transcript-to-direction time excludes STT endpointing delay.
These are three inference samples, not a meaningful latency percentile or a
comparison benchmark. Compared with the prior 2.57-second typed trial, latency
has not improved. Model inference, rather than websocket transport, dominates
the measured post-transcription delay.

## Audience copy and pause correctness

Flow beats now have a separate optional `audienceText` field. The storyteller is
instructed to write it; the flow editor exposes it. Private `speakerNotes` remain
in preparation (under a disclosure) and are never used as audience text. Existing
saved flows without the new field render titles only until edited/regenerated
and reviewed. No implicit rewrite of old audience content is performed.

A manual-text transport action previously unpaused the canvas. It now respects
pause; when accepted while unpaused, manual text ends the active director session.
Server integration coverage exercises the paused manual action. Tests also check
legacy note privacy, separate audience copy, cancellation, and snapshot isolation.
Browser fixture verification confirmed audience text appears without private notes;
screenshot: `output/playwright/audience-text.png`.

## Next experiment

A human should rehearse with the physical microphone in the running app, especially
with natural pauses, corrections, and background noise. Further latency work should
compare a compact classifier/structured-output call and embedding-based beat
retrieval with the current tool agent using identical recorded speech. Require
selection/hold accuracy before accepting a faster approach. Neither streaming
partial transcripts into the audience stage nor adding a new framework is yet
justified by these results. Richer components/library comparisons remain subsequent
work; this slice still renders statement scenes only.

A separate fresh actual-model preparation probe also passed after the audience-copy
change: interview 9.83 s, story 27.79 s, director 2.89 s. All three generated beats
contained audience text. This checks the updated preparation contract; it is not
part of the audio timing run. Full evidence is retained in
`agent-audience-copy-validation.json`. Final automated validation: 15 tests pass;
TypeScript and Vite production build pass.

## Subsequent cache/workflow trial

The four-case results above describe the previous trial. The latest replay adds an
exact repeated-phrase cache check and uses the refined question-field contract.
See [workflow validation](workflow-redesign-validation.md) and
`speech-loop-cache-validation.json` for the five-case result and separate warm-cache
versus uncached timings. The physical microphone limitation remains.
