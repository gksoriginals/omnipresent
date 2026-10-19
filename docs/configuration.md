# Environment configuration

From the repository root:

```sh
npm run setup:env
# Edit .env locally, then:
npm run dev
```

`npm run setup:env` never overwrites an existing `.env`; it creates a new file with owner-only permissions on Unix. Alternatively, copy `.env.example` manually for a fresh setup.

`.env.example` contains safe defaults and empty optional keys; `.env` contains your local settings and must never be committed. On Unix, use `chmod 600 .env` to restrict access. Restart the development process after changes. Do not paste actual keys into issues, screenshots or logs.

## Loading and precedence

`npm run dev`, `npm run dev:server` and `npm start` load the root `.env` with Node's built-in environment-file support. Existing shell variables take precedence. The main dev command loads it before spawning retrieval, server and UI processes, so Python override/download settings also reach child processes.

Software tests deliberately do not load `.env`, keeping local provider credentials out of tests. Direct `tsx`, Python and arbitrary shell commands do not automatically read this file. Run a Node experiment explicitly with:

```sh
node --env-file-if-exists=.env --import tsx scripts/local-only-live-probe.ts output/my-local-check
```

For a direct Python tool, export only the variables it needs in your shell, or use its local model-cache authentication. Do not source an untrusted env file as shell code. Existing npm experiment commands vary; inspect the command before enabling a paid provider.

## Application settings

| Variable | Default | Use |
| --- | --- | --- |
| `OMNIPRESENT_LLM_BASE_URL` | `http://127.0.0.1:11434/v1` | Preparation endpoint. A remote endpoint receives preparation context. |
| `OMNIPRESENT_LLM_MODEL` | `qwen3.5:4b` | Locally available preparation model; download it separately. |
| `OMNIPRESENT_LLM_API_KEY` | Empty | Optional authentication for that endpoint. |
| `OMNIPRESENT_COMPOSITION_PLANNER` | `synthesis` | Validated composition; comparisons: `focus`, `paired`, `stable`. |
| `OMNIPRESENT_REQUIRE_INDEPENDENT_REVIEW` | `false` | Only exact `true` enables stricter review eligibility. Saving a story is not independent review. |
| `PORT` | `4317` | Coordinator loopback port. If changed, also update the Vite proxy; UI remains at 5173. |
| `OMNIPRESENT_DB_PATH` | `output/omnipresent.db` | Local SQLite workspace, including private preparation context. `:memory:` is for isolated tests. |
| `OMNIPRESENT_MATERIALS_PATH` | `output/materials` | Uploaded image storage and portable bundle media. Back up with the database. |
| `OMNIPRESENT_PYTHON` | `.venv/bin/python` | Speech/material-processing Python executable. |
| `OMNIPRESENT_RETRIEVAL_PYTHON` | `output/retrieval-venv/bin/python` | Retrieval worker Python executable used by the dev launcher. |
| `OPENROUTER_API_KEY` | Empty | Explicit hosted comparison profiles only; may incur cost. No automatic hosted fallback. |
| `HF_TOKEN` | Unset | Optional upstream model download authentication. Local Hugging Face login/cache can be used instead. |

There is no environment switch that silently replaces normal selection with a billed model. Experimental profiles are selected explicitly by presentation load/trial controls. Embedding model/revision and CPU settings are pinned in `runtime/retrieval-model.json`; STT model selection is in `runtime/worker.py`, not an undocumented env override.

## Optional probe controls

These are script-specific, not normal product configuration. Leave them unset unless following the relevant experiment protocol:

- `DECISION_PROVIDERS`, `DECISION_RESULT_FILE`: decision comparison shortlist and output path.
- `SHORTLIST_METHODS`, `SHORTLIST_PROVIDERS`: retrieval benchmark arms/providers.
- `OMNIPRESENT_UI_PROBE_OUTPUT`, `OMNIPRESENT_UI_PROBE_SESSION`, `OMNIPRESENT_UI_PROBE_KEEP_OPEN`: browser probe output/session handling.

`HOME` is an operating-system variable, not a project setting. Python workers set `USE_TF` and `TOKENIZERS_PARALLELISM` internally; do not copy them into app configuration just because they appear in source.

## Files kept out of Git

The ignore rules cover `.env` and `.env.*` (except `.env.example`), virtual environments, node_modules, output/uploads/models, dist, caches, logs except recorded validation logs, private-key formats and local database files. They also ignore `.npmrc`, `.netrc` and `.pypirc`, which can contain registry credentials. Do not place real keys in the example file or documentation.

Verify without printing secrets:

```sh
git check-ignore .env .env.local .venv output/materials/example.pdf
npm run check:publication
```

If a secret is accidentally committed, revoke it before requesting history cleanup. Ignore rules do not remove already tracked files. Use redacted Gitleaks reports and inspect the staged file list before publishing changes.
