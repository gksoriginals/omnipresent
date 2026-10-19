# Getting started

Omnipresent is a native macOS presentation app. SwiftUI provides the interface; the app launches a local TypeScript coordinator for interview, story preparation, material extraction, retrieval and live presentation decisions.

## Requirements

- macOS 14 or later
- Xcode Command Line Tools (Swift compiler and macOS SDK)
- Node.js 22.13+ and npm
- [Ollama](https://ollama.com/) for local interview and storyteller inference

Install dependencies and prepare a local model:

```sh
git clone https://github.com/gksoriginals/omnipresent.git
cd omnipresent
npm ci
npm run setup:env
ollama pull qwen3.5:4b
```

Start the Ollama service, then launch the app:

```sh
npm run dev
```

This type-checks the TypeScript coordinator, builds the native macOS app bundle and opens it. Source changes require a rebuild and relaunch; there is no React renderer or browser UI.

## Configure a model

Open **Omnipresent → Settings…** or click the sliders control in the main window. Enter an OpenAI-compatible base URL and model identifier; Ollama defaults to `http://127.0.0.1:11434/v1` and `qwen3.5:4b`. Add an API key only when the endpoint requires one. **Save & test connection** checks the endpoint's model list. The key is stored in a user-only settings file and never returned to the interface. New preparation turns use saved settings.

Live presentation selection remains local: hybrid retrieval, host evidence checks and deterministic composition. It does not call a paid decision model. Speech capture requests macOS permissions and requires Apple's English recognizer to report on-device support; the app does not silently send microphone audio to a network service.

## Use the app

In Prepare, talk with the interview agent, attach relevant files from the composer and use the adjacent story panel to review the storyteller's flow. Ask for revisions in chat, then save the reviewed story. In Canvas, select a saved story and start presenting. An optional audience display opens in a second macOS window.

The SQLite workspace, settings, uploaded image assets and Hugging Face cache live under `~/Library/Application Support/Omnipresent`. The app does not import old browser-local drafts automatically. Exported story bundles include private preparation context, so share them deliberately.

## Build without launching

```sh
npm run build
npm run macos:pack
open output/macos/Omnipresent.app
```

The bundle currently targets Apple Silicon and macOS 14+. It is ad-hoc signed for local testing. Public distribution requires a universal or Intel build strategy, Developer ID signing and notarization. First use may fetch the pinned EmbeddingGemma ONNX model; that download is not part of dependency installation or tests.

See [model and environment configuration](configuration.md), [architecture](architecture/current.md), [testing](testing.md) and [third-party notices](third-party-notices.md).
