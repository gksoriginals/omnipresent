# Roadmap

This is an evidence-driven sequence, not a delivery schedule.

## Next: supported speech reaches selection

- Reproduce split final transcripts, corrections and timing boundaries with frozen audio fixtures.
- Introduce bounded speech-context handling and a local request/purpose proposal boundary without weakening evidence eligibility.
- Preserve missing facts, negation, hypothetical speech, source withdrawal and stale-turn behavior.
- Repeat real audio-to-commit tests, then measure browser paint and actual microphone behavior.

## Preference quality

- Independently review distinct preferred-asset expectations and collect natural utterances.
- Compare hybrid, small local rerankers and optional classifiers on that frozen set.
- Include startup, RAM, cold queries, refresh, cancellation and fallback costs; do not promote based on raw model quality alone.
- Keep hybrid default until a candidate demonstrates a repeatable quality gain within the latency budget.

## Public development

- Make setup and model licensing/platform support more portable and independently reproducible.
- Improve documentation, accessibility and presentation usability with representative users.
- Establish supported release/versioning policy before packaging a desktop app.

Current evidence and known failures: `docs/research/preference-quality.md`. Completed experiments remain in the validation register; an unchecked research idea is not implemented behavior.
