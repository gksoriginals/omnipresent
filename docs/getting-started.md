# Getting started

Requirements: Node.js **22.13+**, npm, [uv](https://docs.astral.sh/uv/), Python **3.12** managed by uv, and a local model server for preparation. Development has been exercised on macOS/Apple Silicon; CI checks portable software behavior on Linux. Other platforms' model runtimes remain unverified.

```sh
git clone https://github.com/gksoriginals/omnipresent.git
cd omnipresent
npm ci
npm run setup:env
```

For local preparation, install [Ollama](https://ollama.com/), start its service and download the configured model:

```sh
ollama pull qwen3.5:4b
```

Install speech and retrieval runtimes separately; these download packages and model weights and require additional disk/RAM:

```sh
npm run setup:speech
npm run retrieval:setup
npm run dev
```

Open **http://127.0.0.1:5173**. The coordinator listens on loopback port 4317 and the embedding service on 4332. `npm run dev` starts retrieval when installed; model initialization may take time. The speech model loads when presentation starts. Some Hugging Face models may require accepting upstream terms and local authentication; do not put tokens in source control. Read [third-party and model notices](third-party-notices.md) before downloading or redistributing runtimes.

The UI can start without model environments; preparation, retrieval and voice features need their respective running dependencies. There is no fake-model success fallback. Use Prepare to chat and attach materials, finish the interview, review the generated story, and save it. Canvas lists saved stories; select one and start. Projects and stories are cached in this browser and saved to local SQLite; uploaded material files are stored under ignored `output/materials/`. This is a single-user local app, not a hosted multi-user service.

Configuration, optional keys, loading precedence and ignored files: [environment setup](configuration.md).


## Storage and scope

Projects and stories are cached in browser storage and saved to `output/omnipresent.db`. Startup restores the server workspace before opening the preparation session. Saves from one tab are ordered; simultaneous editing from multiple tabs is not supported. Export a story from Canvas to transfer its reviewed snapshot and referenced image files to another installation. Bundles contain private preparation context as well as audience content, so share them deliberately. Uploaded files are stored under ignored `output/materials/`. The app is a single-user local prototype; it is not a hosted multi-user service. See [configuration](configuration.md), [security policy](../.github/SECURITY.md), and [current architecture](architecture/current.md).
