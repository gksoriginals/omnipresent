# Third-party software, models and fixtures

The project license covers original Omnipresent source. It does not relicense dependencies, downloaded model weights, voice datasets or public-source excerpts. Package environments and model weights are not distributed in Git. Future bundled/binary releases must carry their complete applicable upstream notices.

## JavaScript application

Direct runtime dependencies, checked against installed package metadata on 19 October 2026:

| Packages | Upstream license |
| --- | --- |
| `ai`, `@ai-sdk/openai-compatible`, `@json-render/core`, `@json-render/react` | Apache-2.0 |
| `@openuidev/react-lang`, `mermaid`, `react`, `react-dom`, `recharts`, `ws`, `zod` | MIT |

Exact versions and transitive dependencies are recorded in package-lock.json. npm-installed packages include their own notices. Development tools and their transitive dependencies retain their respective licenses.

## Local model and Python runtimes

- [Moonshine](https://github.com/moonshine-ai/moonshine/blob/main/LICENSE): upstream code and the selected English streaming model have their upstream MIT terms; third-party components and other model variants may differ. Speech dependencies are in `runtime/requirements.lock`.
- [EmbeddingGemma 2](https://huggingface.co/google/embeddinggemma-2): selected revision is pinned in `runtime/retrieval-model.json`. The model repository currently declares Apache-2.0. Verify the selected revision's terms rather than inferring licensing from another Gemma release. Retrieval environment is separately locked.
- [Qwen3.5 4B](https://huggingface.co/Qwen/Qwen3.5-4B): preparation reference downloaded separately through the local model server. Check model/provider terms for any replacement. Ollama is a separate dependency; it and the weights are not bundled.
- [GLiNER2.5-Decide](https://huggingface.co/fastino/GLiNER2.5-Decide), [MiniLM reranker](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2), and [Laya](https://huggingface.co/convaiinnovations/laya): optional experimental model repositories declare Apache-2.0. Exact revisions and dependency locks are retained in runtime configuration and experiment snapshots. These are not normal live-selection dependencies.
- [Piper](https://github.com/OHF-Voice/piper1-gpl): the optional TTS experiment environment uses GPL-3.0 software and its upstream component notices. It is a separately installed test tool, not a bundled presentation dependency. Do not assume the repository's source license replaces Piper's obligations when redistributing it.
- [LJSpeech Piper voice card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/high/MODEL_CARD): synthetic validation speech uses this voice; the card identifies the training dataset as public domain. Pinned file hashes and tool versions are recorded in `runtime/tts-model.json` and experiment manifests. Recordings do not contain a user's microphone input.

Python packages such as PyTorch, Transformers, NumPy and document parsers retain their own licenses. See each lockfile and installed distribution notices. Downloading a package is not a blanket redistribution review for a future desktop bundle.

## Committed research material

Validation fixtures include authored synthetic narratives, charts, diagrams and generated speech; EIA/USGS source excerpts are attributed in source snapshots and review packets. Retain those source identities and hashes. US government sources can include separately credited third-party content; the cited text fixtures do not grant rights to unrelated imagery or marks.

Historical source snapshots reproduce earlier Omnipresent implementations for research provenance. They may contain retired credential-location logic, absolute development paths and earlier defaults. They are evidence artifacts, not current runtime configuration. Generated UI screenshots contain synthetic/public-source test presentations. No model weights, personal uploaded presentations or credential files are intentionally committed.
