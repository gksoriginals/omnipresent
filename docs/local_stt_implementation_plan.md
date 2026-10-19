# Speech Understanding — Research Notes

16 October 2026 · Potential technical PRD input; no backend plan selected

## Product question

How can speech help the canvas follow the presenter’s meaning at a useful pace?

Speech participates in the preparation interview and in live presentation. The live system combines it with the story plan, prepared assets/directions, and other useful insights. Live transcription is one possible ingredient. The experience also depends on context, explicit direction, corrections, pauses, and whether changing the visual is useful at all. Speech infrastructure should serve those interactions.

## Questions to investigate

- How much speech is needed to understand a useful visual intention?
- How should the system respond to incomplete phrases, corrections, negation, and topic changes?
- Which names, quantities, and relationships must be recognized accurately for an experiment?
- What delay feels acceptable for different visual responses?
- How should listening, pausing adaptation, stopping capture, and recovery be communicated?
- Which local or remote approaches suit actual device, privacy, language, and connectivity needs?

There is no required STT engine, streaming architecture, adapter interface, language restriction, or full backend comparison before canvas work begins. Manual text, recorded speech, simulated events, and live audio can each answer different questions. Label the input used so a replay demonstration is not mistaken for live speech understanding.

## Evidence to collect when relevant

Observe when meaningful intent becomes available, how recognition revisions affect the canvas, and whether users can recover from mistakes. Assess important entities and quantities as well as transcript accuracy. Measure timing in the integrated experience when testing responsiveness; first-token latency alone does not establish presentation usefulness.

When evaluating engines, verify current capabilities on the intended hardware and record versions, settings, inputs, and failures. Compare alternatives only to the extent needed for a decision. Make microphone activity and recording/storage behavior explicit in experiments involving people.

## Path to a technical PRD

Write a focused PRD when a prototype exposes a specific input or recognition problem. Describe the experience, assumptions, approaches, test conditions, and findings. Establish a reusable speech interface when integration experience justifies it, rather than designing broad infrastructure in advance. See [potential technical PRDs](technical_design.md).

## Current candidate research

The [baseline technology review](baseline_technology_research.md) records current candidates, sources, limitations, and proposed comparisons. See its “Local streaming STT” section. These are documentation-based recommendations pending experiments, not finalized technology choices.

## Speech as a retrieval query

Speech-derived context can query the prepared artifact and story material through EmbeddingGemma. Test paraphrases, ambiguous references, changed quantities/periods, and corrections; a transcript revision may make an earlier candidate irrelevant. Retrieval does not itself decide what reaches the audience.

EmbeddingGemma 2 also permits experiments with direct audio-to-media matching. Treat this separately from STT-text queries: audio similarity does not provide an inspectable transcript or replace the speech understanding needed by the broader product. No continuous recording is implied. See the [use-case decision](embeddinggemma_use_cases.md).
