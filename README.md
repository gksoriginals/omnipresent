<p align="center">
  <img src="docs/assets/logo.svg" width="112" height="112" alt="Omnipresent logo">
</p>
<h1 align="center">Omnipresent</h1>
<p align="center"><strong>Prepare a story. Let the canvas follow your explanation.</strong></p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-355f4c" alt="License: Apache-2.0"></a>
  <a href="https://github.com/gksoriginals/omnipresent/actions/workflows/ci.yml"><img src="https://github.com/gksoriginals/omnipresent/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="docs/roadmap.md"><img src="https://img.shields.io/badge/status-native_macos_prototype-e8c65a" alt="Status: native macOS prototype"></a>
</p>
<p align="center"><a href="#demo">Demo</a> · <a href="#get-started">Get started</a> · <a href="docs/README.md">Documentation</a> · <a href=".github/CONTRIBUTING.md">Contributing</a></p>

Omnipresent is a native macOS app for presentations that adapt to what the speaker is explaining. Prepare a story with an interview agent, attach source material, review the generated narrative and start the canvas. During a presentation, local speech recognition and a grounded selection system decide which prepared content to compose on screen. The story guides the presentation; it is not a fixed slide sequence.

## Demo

![A local spoken replay on a synthetic solar-energy story](docs/images/live-presentation.png)

*Synthetic example. The archived browser capture demonstrates the presentation concept; the current interface is being rebuilt natively with SwiftUI.*

## How it works

1. **Prepare together.** Talk through the audience, purpose and material. Upload documents, images or data in the conversation.
2. **Shape the story.** Review the storyteller's flow beside the chat, request edits and save the story.
3. **Present on a canvas.** Start the story and explain it in your own words. The live system composes relevant prepared text and visuals. Unsupported claims keep the current view and ask for more evidence.

The native app uses SwiftUI for the macOS interface and a bundled TypeScript coordinator for preparation, evidence checks, retrieval and presentation lifecycle. The model configuration window accepts local or OpenAI-compatible endpoints. Live selection defaults to local hybrid retrieval and deterministic composition; no billed model is needed to move the canvas. Speech uses Apple's on-device English recognition when the Mac supports it.

**Prototype status.** The native app and model settings are implemented, and core coordinator behavior is covered by automated tests. Native microphone acceptance, spontaneous-speech quality and visual review on physical Mac displays remain in progress. Earlier browser and Moonshine trials are retained as historical evidence, not current native-app acceptance.

## Get started

Requires macOS 14 or later, Xcode Command Line Tools with Swift, Node.js 22.13+, npm and [Ollama](https://ollama.com/) for local interview and story generation.

```sh
git clone https://github.com/gksoriginals/omnipresent.git
cd omnipresent
npm ci
npm run setup:env
ollama pull qwen3.5:4b
npm run dev
```

`npm run dev` builds and launches the SwiftUI app with the local TypeScript coordinator. Set the model endpoint, model name and optional key in the app's Model Settings window. To build the app bundle without launching it, run `npm run build && npm run macos:pack`; the result is `output/macos/Omnipresent.app`.

[Full setup and model configuration](docs/getting-started.md) · [Environment settings](docs/configuration.md)

## Development

```sh
npm test
npm run build
npm run macos:pack
npm run validate:evidence
```

The checks use fixtures and do not download model weights or call hosted inference. Native app packaging requires macOS and Swift. See [current architecture](docs/architecture/current.md), [testing and evidence](docs/testing.md), and the [roadmap](docs/roadmap.md).

## Project

Omnipresent is a single-user local prototype. Workspace content, uploaded files, model settings and downloaded model files stay in the user's Application Support directory. The app does not provide a web interface or multi-user service. Read the [contribution guide](.github/CONTRIBUTING.md), [support policy](.github/SUPPORT.md), [security policy](.github/SECURITY.md) and [governance](docs/governance.md).

## License

[Apache-2.0](LICENSE). Dependencies, models and research fixtures retain their [upstream terms](docs/third-party-notices.md). The repository does not distribute model weights, provider credentials or personal presentation uploads.
