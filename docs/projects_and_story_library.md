# Project chats and the story library

Implemented 16 October 2026.

## Prepare

Each project has a stable ID, its own interview/story conversation, brief, material
references, prepared visuals, working story, and unsent composer text. **New project**
opens a fresh interview without replacing previous work. A project gets its title
from the brief/topic or first user message. Select an earlier project to resume it.
Desktop uses a compact project list; mobile uses a project selector and New project.
The attachment paperclip remains inside the chat composer.

Switching projects closes the previous websocket, cancelling its in-flight agents
and stopping any presentation capture. The new connection restores only the chosen
project. Client handlers ignore messages from old sockets, and upload requests are
aborted when their conversation unmounts. A project-scoped send guard prevents a
late upload from attaching to the newly selected conversation. Uncommitted model
output is discarded on switch; the submitted composer text is retained until its
turn successfully commits. Completed conversations and source material persist.

## Canvas

Clicking Canvas opens **Your stories**, a gallery of saved, reviewed snapshots
across projects. Each card has an opening-scene thumbnail (an uploaded opening
image when available, otherwise the opening title/copy), story title, originating
project, scene count and saved time. These are real content previews, not generated
placeholder artwork. Card grids exist here because the story picker requires them;
the live canvas remains clean.

Selecting a card opens a dedicated presentation surface with an opening-scene
preview and **Start presentation**. No microphone/model work starts merely from
browsing cards. Start performs the existing automatic speech setup and uses that
exact saved snapshot, independently of the project currently open in Prepare.
**All stories** returns to the gallery; End returns to the selected story preview.
Pause/Resume and End remain the only live presentation controls.

Saving again updates the project’s current gallery story, retaining its stable ID.
Draft edits do not change it until Save. Previous changed snapshots and pre-existing
duplicate cards are retained in local `storyHistory`, outside the gallery; the latest
saved snapshot per project is displayed. Different projects remain distinct even
when their story titles match. No automatic history trimming occurs.

## Persistence and migration

`shared/workspace.ts` defines a versioned browser-local workspace under
`omnipresent-workspace-v1`. The previous single draft and saved-story keys are
imported on first use and left untouched as a recoverable legacy copy. All valid
legacy saved stories are retained and associated with the imported project.
Questions from a live story are routed to its originating project, even when another
chat is currently selected; returning to Prepare restores that context for the agents.
The active project, unsent message and all project state survive reload/reconnect.
Unreadable versioned data is preserved instead of overwritten by an empty workspace.
Storage failures are reported; the current tab can retain in-memory changes, but
those changes are not claimed saved.

This preserves the prototype's current local storage architecture. It does not
provide accounts, cross-device sync, multi-tab conflict resolution, or server-side
chat durability. Browser quota still limits capacity. Images remain local files on
the server and must stay available for their thumbnails/presentations. Project
renaming and export management have not been added. Removal is reversible as described below.

## Validation

Five new unit tests cover legacy migration (including more than twelve snapshots),
project/material/composer isolation through serialization, immutable saved story
snapshots, unreadable-storage preservation, and presentation-feedback routing to its originating project. Browser checks cover two real UI
projects with different unsent text, PDF attachment isolation, reload persistence,
story cards, card-to-preview navigation and automatic start with synthetic audio.
See the latest validation record for exact scope; physical microphone behavior is
not established by synthetic browser capture.


Final checks: **27 automated tests pass**, with no skipped material checks on this
machine; TypeScript and Vite production build pass. Existing Mermaid optional-bundle
size warnings remain. Browser validation included one actual local-model interview
turn committed in its project. Gallery/preview testing used explicitly seeded story
snapshots (one from the earlier visual-agent trial and one synthetic ocean story),
then saved an additional snapshot through the real UI and verified gallery retention
after reload. Synthetic silent browser audio verified startup of the selected ocean
snapshot while the solar project was open; physical microphone testing was not done.
Desktop/mobile screenshots were inspected, with no horizontal gallery overflow.
The application component was separated from the root entry to prevent duplicate
React roots during development hot reload.

## Composer and resizing correction — 16 October 2026

Prepare now occupies the available viewport height. Chat and story have independent
scroll areas; the composer floats in a bottom dock and remains visible while either
pane scrolls. Attachments and the interview-completion action stay with that dock.
Long messages do not shrink inside the scrolling flex container. Story headings,
visuals and grid tracks can shrink/wrap without horizontal overflow.

Below 980 CSS pixels, Chat and Story use a view switch rather than stacking long
panes or squeezing columns; the composer remains available in either view. Short
windows use a smaller composer field. A header sidebar icon hides/shows project
sessions (including the mobile project selector), with its preference remembered
in browser storage. This change does not remove or alter any project data.

Browser geometry checks passed at 1440×900, 1100×720, 900×700, 700×700, 390×844 and
800×500: composer/Send stayed within the viewport and no document-level horizontal
overflow appeared. Additional checks verified story scrolling with the composer
stationary, sidebar hiding, and persistence of the hidden preference after reload.
Screenshots: `output/playwright/floating-composer-desktop.png` and
`output/playwright/floating-composer-narrow.png`. Existing 27 automated tests pass;
production TypeScript/Vite build passes. Viewport checks used the explicit story
fixture from earlier UI validation, not newly generated model content.

### Gallery right-edge correction

The gallery and card grid now have explicit container widths and zero minimum
intrinsic widths on cards, preventing content from expanding the gallery past its
viewport. Cards wrap to new rows as space decreases. Browser checks now inspect
`#workspace.scrollWidth` and **every card's right edge**, not only document width:
an inner scrolling container can overflow without increasing document width.
All card bounds passed at 1728, 1440, 1100, 1024, 900, 700, 390 and 320 CSS pixels.
Desktop screenshot inspected: `output/playwright/gallery-width-fix.png`.
Production build passes.

### Side-by-side requirement and inner overflow — 16 October 2026

The presenter explicitly requires chat and story side by side; the temporary
narrow-screen Chat/Story tabs described above have been removed. Both panes now
use shrinkable, equal grid tracks at all widths, retaining independent vertical
scrolling and the bottom composer. The sessions sidebar remains hideable.

Width constraints apply to every enclosing Prepare container and the inner chart
wrapper/SVG. Recharts can briefly retain its previous pixel width while its
ResizeObserver updates; constraining only the page did not catch this case.
Validation now checks both pane and visual `scrollWidth`, viewport edges, side-by-side
geometry and composer visibility after layout settles. All checks passed at 1728,
1440, 1200, 1100, 1024, 981, 900, 700, 390 and 320 CSS pixels, with sidebar shown and
hidden. Production build passes. Screenshot inspected:
`output/playwright/prepare-side-by-side.png`. These are fixture-based layout checks.

### Floating Save and native-window verification

Save story is now in a bottom action dock outside the story's scrollable content,
so it remains visible alongside the floating chat composer. Chat/story stay side
by side. The story content has a constrained inner scroll area; horizontal overflow
is not concealed as a substitute for fitting content.

A second cause of the reported clipping was confirmed in the test browser: its
fixed Playwright viewport remained 1440 px while its native outer window was resized
to 1100 px. Earlier viewport-only screenshots could therefore pass while the real
window still cropped the page. Clearing metrics from a separate CDP session did
not remove Playwright's context-owned viewport. The test browser was reopened with
`browser.contextOptions.viewport: null`, importing a saved state backup to preserve
the two project chats and three story snapshots. The old emulated window was closed.
The new page and native window both measured 1070 px wide.

Native-window (not emulated viewport) resizing was checked at 1280, 1070, 900 and
700 px: page/native widths matched, inner workspace/story widths did not overflow,
and Save remained within the viewport and stationary while story content scrolled.
Screenshot inspected: `output/playwright/native-floating-save.png`.
27 automated tests and the production build pass. Further manual browser tests
should use a null viewport; avoid leaving fixed viewport emulation in a user-facing
window after responsive checks.

The app shell also prevents document-level scrolling; workspace/chat/story regions
own scrolling. Visual figures establish a containing block for offscreen accessible
chart tables, so those tables cannot expand the outer document. Native-window
checks additionally require `scrollY`/main top to remain zero and both floating
controls to stay against the viewport bottom. The final screenshot was recaptured
after those checks.

### Wheel-scroll containment correction

The frame is now fixed to the viewport and Prepare disables outer-workspace
scrolling. Chat/story/project lists contain overscroll, so reaching their ends does
not pass wheel gestures into the outer page. Canvas retains its own scrollable
workspace for the story gallery. Header, composer and Save remain stationary.

Validation used actual wheel input (±4000 px, twice each direction) over story,
chat, composer, save dock and header. After all 20 gestures, page/main/header and
outer Prepare scroll offsets remained zero, document height matched viewport
height, and both controls stayed in bounds. A screenshot at the bottom of both
content panes was inspected: `output/playwright/prepare-scroll-locked.png`.
Production build passes. This replaces the earlier insufficient check that only
inspected initial scroll positions without exercising scroll chaining.

### Story updates and reversible removal — 16 October 2026

Each story card and project-session row has a remove control. Removing a story
keeps its preparation session. Removing a session preserves its saved story, and
removing the last session opens a fresh blank session. Active-session removal
closes its socket and cancels pending work before switching, preventing late agent
responses from recreating the removed session.

Undo restores the most recently removed item. **Removed items**, available from
the header in both modes, restores older removals after reload. These are local
soft removals, not permanent erasure. Restoring a story makes that snapshot current;
any newer replacement remains in history. History is retained in browser storage
but has no browsing UI yet. Existing duplicate snapshots are consolidated on load;
the original legacy storage keys remain untouched.

Validation: 31 automated tests pass, including stable-ID repeated saves, changed
snapshot retention, per-project uniqueness, removal/reload/restore, last-session
replacement and independent chat/story lifetimes. Browser checks on the sample
Solar/Ocean workspace verified two gallery cards after consolidation, story
remove/Undo, session remove/reload/restore and saved-story preservation. Native
window widths 1280, 900, 700 and 1070 px had no document-width overflow. Screenshot:
`output/playwright/story-removal.png`. Production build passes; existing optional
Mermaid chunk-size warnings remain.
