# Materials and prepared visual tools

Implemented prototype changes, 16 October 2026.

## The user experience

Preparation is one interview conversation. A paperclip icon **inside the composer**
opens the attachment picker; attached filenames stay with the conversation.
There is no material tab, agent-role switcher, brief editor, or manual flow editor.
**Finish interview & create story** gathers a brief if necessary and hands it to
the storyteller. If essential context is missing, the interviewer asks for it.
The storyteller's proposed story appears next to the same conversation. Revisions
are requested in chat. The interview and storyteller remain separate agents.

**Save story** marks the current proposal reviewed and stores a snapshot. Canvas
provides **Load story** and **Start presentation**. Start requests microphone access,
loads speech automatically, loads the saved snapshot and starts listening. The
only extra controls while running are Pause/Resume and End. No manual canvas
composer, speech-model loader, details/metrics drawer or synthetic-load controls
remain in the product UI. Debug/test transport actions remain available to probes.

Saved stories and project drafts use local browser storage. Multiple project chats
and a story-card gallery supersede the original single-draft/twelve-snapshot limit;
see [project sessions](projects_and_story_library.md). Saving again creates another snapshot. There is no
server database, account-based storage, deletion manager or cross-device sync.
Image content is stored separately on this local server under `output/materials`;
its file lifetime is independent of browser snapshots. No existing saved draft is
silently rewritten. The project/session and saved-story library workflow is now implemented; cross-device
and multi-tab synchronization remain future work.

## Uploads

The server accepts files up to 8 MB each: PDF, DOCX, PPTX, XLSX, UTF-8 TXT/Markdown,
CSV/JSON, and PNG/JPEG/WebP. Eight materials per working presentation remain the
prototype limit. The paperclip picker accepts these types; extraction errors appear
in the conversation. Files are processed locally, not sent to a hosted converter.

[MarkItDown](https://github.com/microsoft/markitdown) extracts PDF and Office content
in a separate Python subprocess with a 30-second timeout. Extraction is bounded to
24,000 characters per file, with a visible truncation notice. Large documents must
be split for complete coverage. Office archive expansion is bounded. This is source
extraction, not visual slide reproduction; tables/layouts can need review. Scanned
PDF OCR, password-protected sources, audio/video uploads, URLs, and legacy binary
DOC/PPT/XLS are not supported. Do not describe them as implemented.

[Pillow](https://pillow.readthedocs.io/en/stable/reference/Image.html) validates images.
Images get digest-addressed local URLs and can be included in story beats. The agent
receives the filename and a note to ask what the image shows; automatic image
understanding/OCR is not wired into the model conversation. Users should describe
important images in chat. No generated photographs or remote stock-media fetching
is implemented. Non-image upload bytes are removed after extraction; image bytes
remain local for presentation use. Extracted text follows the existing browser-draft
and model-context path; users must review it before relying on source completeness.

## Agent tools and renderer libraries

- `readArtifact`: bounded source excerpts using exact uploaded IDs.
- `createDiagram`: prepares a title, node labels and directed edges. The host
  validates node references and generates Mermaid flowchart syntax from escaped
  labels; the model does not supply executable code or arbitrary Mermaid directives.
- `createChart`: prepares bar/line data, title, units and a source artifact ID. The
  source must exist, and supplied labels/numbers must occur in it. This is a useful
  provenance guard, not proof of correct label/value pairing, units or interpretation;
  the presenter still reviews the chart.
- `proposeFlow`: references returned `visualId`s and uploaded `imageArtifactId`s.
  Unknown references reject the draft. Visual tool changes commit only with a
  successful preparation turn; failure/cancellation leaves the old state intact.

[Mermaid](https://mermaid.js.org/config/schema-docs/config-properties-securitylevel.html)
renders diagrams with strict security and disabled HTML labels; SVG output is
memoized with a bounded component/spec cache.
[Recharts](https://recharts.github.io/en-US/api/ResponsiveContainer/) renders prepared
bar/line data responsively with animation disabled and an accessible data table.
Both libraries load on demand. Preview and live canvas use the same validated
specifications. Neither is the chosen generative UI framework; component/catalog
experiments remain open. Runtime scene commits now carry optional prepared visual
and image references. The realtime agent only selects scenes; it does not generate
new charts/diagrams in the speech critical path.

Initial tools deliberately expose small schemas. A local-model test returned
`kind: "process flow"` despite a literal diagram field; the redundant `kind` input
was removed because the tool name already specifies it. The host adds the correct
discriminator. This is a concrete integration correction, not a reason to loosen
validation of arbitrary visual output.

Validation evidence: [workflow/visual validation](research/workflow-redesign-validation.md).
22 automated tests and the production build pass. An actual local-model trial
successfully generated and linked both visual types; browser rendering and
synthetic-stream presentation startup were checked separately.
