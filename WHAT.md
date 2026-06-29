# What Changed

A running log of work done on Hiday — kept so anyone (including future us) can catch up on recent changes without digging through git history.

## 2026-06-29

### Todo timeline bug fixes
- Fixed an invalid `#gray` placeholder color (used when a session has no project) that broke block coloring — now a proper gray (`#6b7280`).
- Fixed the drag-over highlight on the project column: it was reading drag data that browsers only expose on drop, not during drag-over, so the drop-zone never lit up. It now checks the drag's advertised data type instead.
- Removed leftover debug `console.log` calls from the create/edit todo dialog.
- Investigated two other reported issues and found both already safe — no change needed:
  - `nowTimeForInput()` rounds minutes up to 60 in some cases, but JavaScript's `Date.setMinutes()` already rolls that over into the next hour correctly.
  - The duration calculation for unscheduled todos already guards against a missing start time, so it can't produce `NaN`.
- Noted, but not fixed: pausing and resuming a tracked todo restarts the elapsed timer from zero instead of continuing where it left off. There's already a `FIX_TODO` comment flagging this in `pausePlannedSession`.

### New logo
- Designed a sunrise mark (a sun rising over a horizon) in the app's existing violet/amber palette, matching the neo-brutalist style.
- Added `public/logo.svg` (full mark, used in the navbar) and `public/favicon.svg` (a simplified version for small sizes).
- Wired the navbar to use the new logo in place of the placeholder icon, and registered the favicon in the site metadata.

### New /plan route
- Built a "Today's Plan" page: a 24-hour timeline on the left and a synced markdown outline on the right.
- The timeline reuses the same drag-to-create, drag-to-move, and resize-to-adjust interactions as the Todos page.
- Plan blocks (scheduled todos) are fully editable — clicking one opens a dialog to change the title, project, time, or notes.
- Tracked time sessions show up as small, view-only tomato markers on the timeline; clicking one opens a read-only popup with the details (title, project, time, duration).
- The markdown pane regenerates automatically whenever the timeline changes, and edits typed into the markdown sync back to the timeline — creating, updating, or removing plan blocks — about a second after you stop typing.
- Added the supporting server actions and data-fetching hooks, and added "Plan" to the sidebar navigation.
