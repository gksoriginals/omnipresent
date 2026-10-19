# Omnipresent

**Prepare your story through conversation. Present it on a canvas that follows your explanation.**

Omnipresent helps you turn an idea, your notes and supporting materials into a visual presentation. You talk with an interview agent about your audience and what you want to communicate. A storyteller then helps shape the flow, and you refine it through chat.

When you present, Omnipresent uses your speech and the prepared story to decide which text, charts, diagrams and images to show together. The aim is to let you concentrate on explaining your ideas while the canvas brings up the right visual support.

For example, a teacher preparing a short lesson on solar energy can bring a spreadsheet, shape a story about generation and storage, then explain it with a canvas that combines the relevant charts and illustrations.

**Status: early prototype, developed in public.** You can prepare and review stories, save separate projects, and try the presentation canvas. Natural-speech understanding still needs work; see [what works today and what needs improvement](#what-works-today).

## From an idea to a presentation

1. **Talk it through.** Describe your topic, audience and goal. Add documents, images, spreadsheets or notes in the same conversation.
2. **Shape the story.** Review the suggested flow beside your chat. Ask for changes, review the supporting materials, and save the story when you are ready.
3. **Start presenting.** Choose a saved story from Canvas and start. Omnipresent uses the prepared content to compose visuals as you speak. When it cannot support a request, it keeps the current canvas and asks for more context in Prepare.

### Prepare and refine your story

Keep the conversation and story side by side, with materials attached inside the chat.

![Omnipresent Prepare: a presentation conversation beside a story preview with a chart and illustration](docs/images/prepare-story.png)

### Present with visual support

The canvas can bring a statement, an illustration and multiple charts together for the current explanation.

![Omnipresent presentation canvas showing a solar-energy explanation with two charts, a statement and an illustration](docs/images/live-presentation.png)

*Screenshots from the running app using a public solar-energy teaching example with synthetic data. The Prepare conversation is an authored demonstration; the presentation screenshot was captured during the actual local spoken replay. [Capture details](docs/images/README.md).*

## What works today

- Separate preparation chats for multiple presentations, with saved stories in Canvas.
- Material uploads, conversational story editing, and prepared charts and diagrams.
- A presentation canvas that combines supported components and retains the current view when evidence is missing.
- Local speech recognition, retrieval and presentation selection. The normal live path does not require a paid decision-model API.

The live experience remains experimental. In the latest dedicated audio check, speech recognition split a supported explanation into fragments and the presenter held the canvas. The pictured replay demonstrates an example that composes successfully; it does not establish reliable handling of spontaneous speech. [Read the tests and known limitations](docs/research/preference-quality.md).

## Try it locally

Requirements: Node.js **22.12+**, npm, [uv](https://docs.astral.sh/uv/), Python **3.12** managed by uv, and a local model server for preparation. Development has been exercised on macOS/Apple Silicon; CI checks portable software behavior on Linux. Other platforms' model runtimes remain unverified.

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

Open **http://127.0.0.1:5173**. The coordinator listens on loopback port 4317 and the embedding service on 4332. `npm run dev` starts retrieval when installed; model initialization may take time. The speech model loads when presentation starts. Some Hugging Face models may require accepting upstream terms and local authentication; do not put tokens in source control. Read [third-party and model notices](THIRD_PARTY_NOTICES.md) before downloading or redistributing runtimes.

The UI can start without model environments; preparation, retrieval and voice features need their respective running dependencies. There is no fake-model success fallback. Use Prepare to chat and attach materials, finish the interview, review the generated story, and save it. Canvas lists saved stories; select one and start. Projects and stories persist in this browser; uploaded material files are stored under ignored `output/materials/`. This is a single-user local app, not a hosted multi-user service.

Configuration, optional keys, loading precedence and ignored files: [environment setup](docs/configuration.md).

## For developers

The product uses TypeScript/React, a Node coordinator and isolated Python workers. Preparation defaults to local Qwen, speech recognition to Moonshine, and retrieval to BM25 plus EmbeddingGemma. Application code checks evidence and validates a composition before changing the canvas. Experimental preference models are opt-in; there is no automatic paid fallback.

See the [current architecture and model defaults](docs/architecture/current.md), [configuration guide](docs/configuration.md), and [documentation index](docs/README.md) for technical details.

```sh
npm test
npm run build
npm run validate:evidence
```

Core software checks need no model credentials or weight downloads. The optional extraction test needs its Python environment; CI installs it. Model, audio and browser experiments are separate: [testing guidance](docs/testing.md).

## Build with us

We are continuing development in public. The next priority is helping supported natural speech reach the right presentation decision consistently. We welcome reproducible bug reports, usability feedback and focused contributions.

Start with [CONTRIBUTING](CONTRIBUTING.md), the [roadmap](ROADMAP.md), [product requirements](docs/PRD.md), and the [test and experiment register](docs/validation/test-register.md). Report vulnerabilities privately through [SECURITY](SECURITY.md). Community participation follows our [code of conduct](CODE_OF_CONDUCT.md).

No model weights, environments, credentials or personal presentation uploads are distributed in this repository. Dependencies, models and public research fixtures retain their [upstream terms](THIRD_PARTY_NOTICES.md).

## License

Original Omnipresent source is licensed under [Apache-2.0](LICENSE).
