# Presentation view

19 October 2026

The spoken demo opens on a presentation canvas, with a compact story header and playback bar. Narration selection, start/stop and playback status are the only always-visible controls. Renderer and decision model selection, preparation, recognized speech, decision counts, interview, source references, trace and evidence download live behind the Experiment button.

The inspector uses a native modal dialog: focus is contained while open, Escape closes it, and opening/closing does not recreate the audio session or canvas. Runtime selections remain disabled during playback. Errors remain visible outside the inspector. Long canvases scroll inside the stage; the page and playback bar remain bounded to the viewport. Narrow screens wrap playback controls and use a single component column.

This changes presentation layout and the placement of experiment controls, not evidence policy or decision behavior. Build and regression validation: `../validation/runs/RUN-20261019-presentation-ui-audit/run.json`. Chrome checks cover inspector opening/closing and actual narrated replay.
