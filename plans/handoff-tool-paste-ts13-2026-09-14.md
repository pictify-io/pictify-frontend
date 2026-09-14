# Handoff — TS-13: paste and type must be visible again on the code-first tools

Date: 2026-09-14. User: "for the html to image tool the option to paste code is gone. It's just
upload option, we need both."

## What happens today (verified on production, `/tools/html-to-image`)

`ToolEditor.svelte` opens on `CodePane`'s `empty` slot (TS-07 B). The pane's design is right:
the empty state is `pointer-events-none` over a real `<textarea>` so a click lands in it and ⌘V
pastes. But the overlay is painted `bg-brand-press` (opaque) and fills the pane, so:

1. The textarea's own placeholder ("Paste or type your HTML…") is never visible.
2. After a click the caret is behind the overlay; nothing on screen changes, so the visitor
   concludes the pane is a drop zone only. The overlay only goes once a character exists.
3. The only visible words are "Drop your .html file here / or paste, or choose a file"; "paste"
   is not a control, and the header "Paste" button depends on `navigator.clipboard.readText()`,
   which Safari and Firefox refuse or do not have, so it falls to a toast.

Net effect: for most visitors the tool has one way in, upload. The hero even says "OR PASTE IT
BELOW", pointing at something they cannot see.

## What to build

### 1 · The editor is visible when empty

- `CodePane` empty overlay: `bg-transparent`, no full-pane dashed border. The textarea's
  placeholder shows through. Change the placeholder to two lines: `Paste or type your HTML here…`
  and, dimmed, `<div style="padding:48px"><h1>Hello</h1></div>`.
- The overlay becomes a **drop strip** pinned to the bottom of the pane (not a full cover):
  dashed 1.5 px `brand-field` border, `#D8F34A0F` fill, one line of mono:
  `DROP AN .HTML FILE HERE · CHOOSE A FILE · UP TO 2 MB` where "CHOOSE A FILE" is the existing
  `chooseFile()` button (`pointer-events-auto`). Height 44 px, 12 px inset.
- On textarea focus, hide the strip (`:focus-within` or a `focused` flag) so the caret and the
  full placeholder have the pane. It returns on blur while the buffer is still empty.
- While `dragging`, the current full-pane treatment comes back ("Drop it", whole pane dashed),
  so drop feedback is unchanged.

### 2 · Paste is a first-class control

- Header "Paste" keeps `pasteFromClipboard()`. In the fallback branch (no clipboard API or
  permission denied) it must focus the textarea AND select nothing, so the very next ⌘V lands in
  the pane; the existing toast copy stays.
- Add the same "Paste" affordance inside the empty pane, above the placeholder, as a small ink
  button on the field colour: `Paste HTML` — same handler. On touch devices (no `hover: hover`)
  this is the primary control, since there is no drag.

### 3 · Copy

- Hero mono line: `OR PASTE OR TYPE IT IN THE EDITOR BELOW · ONE FILE UP TO 2 MB · .ZIP NOT
  SUPPORTED YET`. (H1, subtitle and everything indexed stay frozen.)
- How-to step 1 already says "Paste your HTML code in the editor above, or upload your .html
  file." It is correct once the editor is visible.

### 4 · No starter

User 2026-09-09: no starter template for HTML to image. Do not add one; the placeholder is the
hint.

### 5 · Analytics

`tool_first_input` already fires; add `source: 'type' | 'paste-key' | 'paste-button' | 'upload' | 'drop'`
so the split between the four ways in is visible in PostHog.

## Acceptance

- `/tools/html-to-png` fresh: the pane shows the placeholder, the bottom drop strip and a
  "Paste HTML" button. Click anywhere in the pane: caret visible, strip gone. Type `<h1>Hi</h1>`:
  canvas renders within the existing debounce.
- ⌘V with HTML on the clipboard pastes into the pane without touching any button, in Chrome,
  Safari and Firefox.
- Header "Paste" works in Chrome; in Safari it focuses the pane and shows the toast.
- Drag a file over the pane: full-pane "Drop it" state; drop loads it. "Upload .html" in the
  hero and "choose a file" in the strip both open the picker. 2 MB / one-file checks unchanged.
- 390 wide: placeholder readable, "Paste HTML" button visible, strip shows only "CHOOSE A FILE".
- The same fix lands on every code-first tool that mounts `ToolEditor` with `leftPanel="code"`
  (html-to-[format], code-to-image if it uses it, certificate/invoice code modes) — it is the
  pane, not the page.
- svelte-check clean; existing `tools/*.test.js` pass; screenshots at 1440 and 390 in the reply.

## Worktree rules

Base on frontend master (be0b93c or later; today's hotfixes live there). Never `git stash`,
never `git add -A`; stage only your hunks. Commit and push, then tell this session to deploy.
