# Documentation

## Current product and architecture

- [Root README](../README.md): setup, defaults and honest product status.
- [Getting started](getting-started.md): complete local setup and runtime requirements.
- [Native macOS app](desktop-macos-alpha.md): SwiftUI runtime, model settings, local data paths and packaging limits.
- [Product images](images/README.md): identifies the archived browser-era captures in the demo.
- [Presentation harness](architecture/presentation-harness.md): responsibility map, first built-in story procedure and workflow diagram.
- [Current architecture](architecture/current.md): implemented boundaries and model decisions.
- [Product requirements](PRD.md): experience and product intent.
- [Roadmap](roadmap.md): next bounded work.
- [Environment configuration](configuration.md): `.env` setup, keys, precedence and ignored files.
- [Testing](testing.md): software versus model, speech and native-app evidence.

## Latest findings

- [Speech assembly ablation](research/speech-assembly.md): temporal assembly, removed signal index and remaining acceptance limits.
- [Domain architecture review](architecture/domain-review-20261019.md): recommendations with explicit implementation and cleanup follow-ups.

- [Distinct preference quality, small models, INT8 and actual audio failures](research/preference-quality.md).
- [Local-only selection and optional classifier lifecycle](architecture/local-selection.md).
- [Validation register](validation/test-register.md), [catalog](validation/catalog.json), and [evidence rules](validation/README.md).

## Historical design and research

Other files in this directory retain earlier proposals, experiments and decisions. Dated claims describe that version, not necessarily today's defaults. Historical browser, React, Electron and Moonshine records are evidence only and do not describe the active app. Source snapshots under validation runs are immutable research evidence and may contain superseded adapters or machine-specific paths. Follow the current SwiftUI architecture and model defaults before using historical setup commands.

## Project information

- [Roadmap](roadmap.md) and [changelog](changelog.md).
- [Governance](governance.md) and [third-party notices](third-party-notices.md).
- [Contributing](../.github/CONTRIBUTING.md), [support](../.github/SUPPORT.md), and [security reporting](../.github/SECURITY.md).
