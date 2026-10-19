# Configuration

Omnipresent is a native macOS app with a local TypeScript coordinator. Model connection settings are managed in the app; `.env` is for development overrides and explicit research runs.

## Development setup

```sh
npm run setup:env
# Edit .env locally, then:
npm run dev
```

The setup command never overwrites an existing `.env` and creates it with owner-only permissions on Unix. Existing shell variables take precedence over values loaded from `.env`. Packaged app settings live under `~/Library/Application Support/Omnipresent` and are configured in **Omnipresent → Settings…**.

## Model configuration in the app

The settings window stores the preparation model's OpenAI-compatible base URL, model identifier and optional API key. Defaults target local Ollama at `http://127.0.0.1:11434/v1` with `qwen3.5:4b`. The saved key is not returned to the UI; the settings file has owner-only permissions. A remote model endpoint receives preparation messages and attached-material text when used. Live presentation selection is local and does not use this endpoint.

## Environment variables

| Variable | Default | Use |
| --- | --- | --- |
| `OMNIPRESENT_LLM_BASE_URL` | `http://127.0.0.1:11434/v1` | Development fallback for preparation endpoint. App settings override it. |
| `OMNIPRESENT_LLM_MODEL` | `qwen3.5:4b` | Development fallback for preparation model. |
| `OMNIPRESENT_LLM_API_KEY` | Empty | Optional development endpoint authentication. |
| `OMNIPRESENT_COMPOSITION_PLANNER` | `synthesis` | Validated composition; comparisons: `focus`, `paired`, `stable`. |
| `OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW` | `false` | Exact `true` enables stricter evidence review eligibility. Saving a story is not independent review. |
| `PORT` | `4317` | Local coordinator port in development. Packaged app chooses a free loopback port. |
| `OMNIPRESENT_DB_PATH` | `output/omnipresent.db` | SQLite workspace path; `:memory:` is for isolated tests. |
| `OMNIPRESENT_MATERIALS_PATH` | `output/materials` | Local uploaded image and portable bundle media path. |
| `OMNIPRESENT_SETTINGS_PATH` | Under application data | Settings-file override for isolated tests and development. |
| `OPENROUTER_API_KEY` | Unset | Explicit hosted comparison experiments only; may incur cost. No automatic hosted fallback. |
| `HF_TOKEN` | Unset | Optional model-download authentication. |

The EmbeddingGemma model, revision, quantization and text-only configuration are pinned in `runtime/retrieval-model.json`. The app's voice path uses Apple's on-device Speech framework. Older Moonshine/WASM experiments remain in historical research records and are not current runtime dependencies.

## Files kept out of Git

Ignore rules cover `.env`, credentials, model caches and weights, virtual environments, uploaded materials, SQLite files, build outputs and logs. `.env.example` contains only safe defaults. Do not paste real keys into issues or test logs.

```sh
git check-ignore .env .env.local .venv output/materials/example.pdf
npm run check:publication
```
