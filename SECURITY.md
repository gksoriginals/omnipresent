# Security policy

## Reporting

Use [GitHub private vulnerability reporting](https://github.com/gksoriginals/omnipresent/security/advisories/new) for suspected vulnerabilities. Do not post credentials, private materials or exploit details in public issues. Provide affected commit, reproduction steps, impact and a minimal synthetic example. No response-time SLA or bounty is promised.

## Supported scope

Only the current main branch is maintained. This is a local development prototype; it has no hardened hosted deployment, authentication layer or multi-user isolation. Keep coordinator/model services bound to loopback. Do not expose them directly to the internet.

Uploaded documents, generated diagram specifications, model responses and transcripts are untrusted. File parsing and model runtimes add their own attack surface. Restrict use to materials you are permitted to process, keep dependencies updated, and do not infer safety from a passing preference benchmark.

## Secrets and data

Use local `.env` configuration. Never commit keys, model authentication files, browser storage exports or personal uploads. Hosted comparison inference is explicit and may transmit the bounded request/menu to the selected provider. Default live selection uses local retrieval. Configuring a remote preparation endpoint sends preparation context there.

The repository ignores environments, downloaded weights, generated output and uploads. Historical validation artifacts contain synthetic/public-source fixtures and machine metadata; do not add private client data to future public traces. If a credential is exposed, revoke it first, then notify the maintainers privately.
