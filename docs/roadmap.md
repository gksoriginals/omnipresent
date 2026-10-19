# Roadmap

This is an evidence-driven sequence, not a delivery schedule.

## Next: supported speech reaches selection

- Reproduce split final transcripts, corrections and timing boundaries with frozen audio fixtures.
- Temporal assembly now recovers the authored split case; expand acceptance beyond the four-recording development replay. The separate signal-index ablation gave no gain and was removed.
- Evaluate a local request/purpose proposal boundary only if the existing interpreter demonstrably needs it, without weakening evidence eligibility.
- Preserve missing facts, negation, hypothetical speech, source withdrawal and stale-turn behavior.
- Complete native SwiftUI layout and accessibility review across supported Mac window sizes.
- Run real microphone-to-canvas acceptance with Apple's on-device Speech framework; report failures and timing separately from transcript-replay tests.
- Define Intel/universal packaging, app icon, Developer ID signing and notarization before public binary distribution.

## Preference quality

- Independently review distinct preferred-asset expectations and collect natural utterances.
- Compare hybrid, small local rerankers and optional classifiers on that frozen set.
- Include startup, RAM, cold queries, refresh, cancellation and fallback costs; do not promote based on raw model quality alone.
- Keep hybrid default until a candidate demonstrates a repeatable quality gain within the latency budget.

## Public development

- Make setup and model licensing/platform support more portable and independently reproducible.
- Improve documentation, accessibility and presentation usability with representative users.
- Establish signed release/versioning and auto-update policy before wider macOS distribution.

Current evidence and known failures: `docs/research/preference-quality.md`. Completed experiments remain in the validation register; an unchecked research idea is not implemented behavior.
