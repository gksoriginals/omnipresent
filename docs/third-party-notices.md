# Third-party software, models and fixtures

The project license covers original Omnipresent source. It does not relicense dependencies, downloaded model weights, voice datasets or public-source excerpts. Package environments and model weights are not distributed in Git. Future bundled/binary releases must carry their complete applicable upstream notices.

## JavaScript application

Direct runtime dependencies, checked against installed package metadata on 20 October 2026:

| Packages | Upstream license |
| --- | --- |
| `ai`, `@ai-sdk/openai-compatible` | Apache-2.0 |
| `officeparser`, `ws`, `zod` | MIT |
| `@huggingface/transformers` | Apache-2.0 |

Exact versions and transitive dependencies are recorded in package-lock.json. npm-installed packages include their own notices. Development tools and their transitive dependencies retain their respective licenses.

The app bundle contains the official Node.js 22.22.1 macOS arm64 runtime and includes its upstream `LICENSE` at `Contents/Resources/licenses/node-LICENSE`. Node.js is MIT-licensed with bundled third-party notices documented upstream; retain those terms in any redistributed binary.

## Local models and runtime

- Apple SwiftUI, AppKit, Speech, AVFoundation and Charts are system frameworks supplied by macOS. The current app requires on-device English speech recognition support.
- [Moonshine](https://github.com/moonshine-ai/moonshine/blob/main/LICENSE): used in historical browser-era speech experiments only; it is not an active runtime dependency.
- [EmbeddingGemma 2 ONNX](https://huggingface.co/onnx-community/embeddinggemma-2-ONNX): the app uses Transformers.js with the revision pinned in `runtime/retrieval-model.json`, CPU q8 text-only configuration. The model repository's upstream terms apply; confirm them for the pinned revision before redistributing weights.
- [Qwen3.5 4B](https://huggingface.co/Qwen/Qwen3.5-4B): preparation reference downloaded separately through the local model server. Check model/provider terms for any replacement. Ollama is a separate dependency; it and the weights are not bundled.
- [GLiNER2.5-Decide](https://huggingface.co/fastino/GLiNER2.5-Decide), [MiniLM reranker](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2), and [Laya](https://huggingface.co/convaiinnovations/laya): optional experimental model repositories declare Apache-2.0. Exact revisions and dependency locks are retained in runtime configuration and experiment snapshots. These are not normal live-selection dependencies.
- [Piper](https://github.com/OHF-Voice/piper1-gpl): the optional TTS experiment environment uses GPL-3.0 software and its upstream component notices. It is a separately installed test tool, not a bundled presentation dependency. Do not assume the repository's source license replaces Piper's obligations when redistributing it.
- [LJSpeech Piper voice card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/high/MODEL_CARD): synthetic validation speech uses this voice; the card identifies the training dataset as public domain. Pinned file hashes and tool versions are recorded in `runtime/tts-model.json` and experiment manifests. Recordings do not contain a user's microphone input.

Historical Python experiment environments and downloaded weights are not used by the active app and are not included in the app bundle. See each lockfile and installed distribution notices before redistributing research artifacts.

## Committed research material

Validation fixtures include authored synthetic narratives, charts, diagrams and generated speech; EIA/USGS source excerpts are attributed in source snapshots and review packets. Retain those source identities and hashes. US government sources can include separately credited third-party content; the cited text fixtures do not grant rights to unrelated imagery or marks.

Historical source snapshots reproduce earlier Omnipresent implementations for research provenance. They may contain retired credential-location logic, absolute development paths and earlier defaults. They are evidence artifacts, not current runtime configuration. Generated UI screenshots contain synthetic/public-source test presentations. No model weights, personal uploaded presentations or credential files are intentionally committed.
