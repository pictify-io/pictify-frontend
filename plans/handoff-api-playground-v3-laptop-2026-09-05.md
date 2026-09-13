# Handoff — API playground v4: Input / Result

Date: 2026-09-05 (third revision the same day; supersedes the two earlier layouts in this file). Branch `worktree-redesign-v2`, route `src/routes/dashboard/api-playground/+page.svelte` at f38f9c8. Replaces the **layout** section of `plans/handoff-api-playground-v2-2026-09-05.md`; calls, honest status, highlighting, snippets, error states and analytics there still apply.

## What the user said, in order

1. Three lanes are cluttered on a laptop.
2. A call-picker dropdown is worse: the API list must stay visible.
3. The tightened three-lane version is still cluttered; "polish it much".

So: the calls list stays, and the work area stops showing everything at once.

## References (Refero)

- **fal.ai model playground** (`46d2a747-9621-41f2-a07f-516cca8fd48f`). **Primary.** Two light panels, *Input* and *Result*. Labelled rows, one big run button at the foot of Input. Result header carries a status chip and a Preview | JSON toggle; actions sit under the preview. Code lives on its own tab, not in a competing pane.
- **Exa playground** (`1826092c-7da0-4380-beb2-4174fa2e2c81`): Code / Output toggle on the result pane, timing top-right.
- **Cohere request builder** (`25f2d3a5-9949-474d-b511-73df99dfe8ab`): method + path as a quiet label above the form.

Reference lock: Input/Result panels, labelled rows in sentence case, one Send, Preview | JSON | Code toggle, actions under the preview, the dark surface only inside Result for JSON and Code. Rejected: request bar, dark full-height pane, result strip box, meta footer, hairline group rules, mono-caps chips as controls.

## Source of truth (Paper)

File `01KZQXXEZ2SNPWS5PN2FCF31PC`:

| Board | Node | Shows |
|---|---|---|
| API playground v4 — laptop 1280 | `BBW-0` | Preview tab, 200 |
| API playground v4 — Code tab | `BF3-0` | Code tab with language row |

Keep `AU5-0` for the 422 copy (fix-hint card).

## Layout at 1280 (rail 220, page padding 32/28, content 996)

```
Title row       "API playground" 26px Bricolage 700 · right: pic_live_••••2c105 (mono 12) + "Copy key" (link)
Workbench       Calls 168 | gap 20 | Input 348 (card) | gap 20 | Result flex ≈ 440 (card)
```

At 1440 the panels grow: Calls 180, Input 384, Result the rest. Below 1200 Input and Result stack (Input first) with the calls list still on the left; below 900 the calls list becomes a horizontal chip row above Input. Never a dropdown.

### Calls (168px, no card, no rules)

Group labels mono 10px `--color-mute` (`RENDER HTML`, `RENDER A TEMPLATE`, `RENDER MANY`, `LOOK UP`). Rows 32px, Inter 13.5, `--color-slate`; active row Inter 600 ink on `--color-subtle` radius 6 with a 6px `--color-field` square at the right. No method chips in the list (the method shows in the Input header). Foot: "All endpoints in the docs ↗" as a plain link. Recent calls move out of the lane: they live behind the `Result` status chip (click shows the last five sends; pick one to restore).

### Input (card: 1px `--color-rule`, radius 12, padding 20, gap 16)

- Header row: **Input** (Inter 15 600) left, `POST /image` mono 11.5 mute right. Description goes in a tooltip on the path.
- **HTML** field: label Inter 13 500 left; links "Use a template" · "Expand" (Inter 12.5, `--color-blue`) right. Editor below fills the card (CodeMirror, pressTheme, line numbers, **no wrapping**). For template calls the field is **Variables** with "Refill from template"; batch calls get **Variable sets** / **CSV**; GET calls show only the id field.
- Validation line (pink square + message) sits under the editor when present.
- **Size** row: label left, `1200 × 630` two 84px mono inputs right.
- **Format** row: label left, segmented control right (`--color-subtle` track, paper thumb with 1px shadow, Inter 12.5): PNG JPG WebP (template: PNG JPG PDF; video: MP4 GIF). Template calls also get a **Layout** row with a select.
- "More options" link (selector, delay) opens an inline row, not a popover.
- **Send request ■** full-width ink button 44px, then a centred mono caption `COUNTS AS 1 RENDER · 1,000 LEFT · ⌘⏎`. While sending: "Sending…", disabled.

### Result (card, same chrome)

- Header row: **Result** + status chip (`--color-subtle`, 6px square proof-green/field/pink + `200 · 1.42 s` mono 11). Before the first send the chip reads `Idle`. Right: segmented **Preview | JSON | Code**.
- **Preview**: a `--color-subtle` stage filling the card; the render centred at its aspect ratio with a 4px ink offset shadow (PDF: first page; video: poster with play). Under the stage: meta line `PNG · 1200 × 630 · 142 KB · saved to your renders` (mono 11.5 slate), then buttons **Open** (ink outline) · Download · Save as template (rule outline). Idle: stage shows "Send the request to see the render here." in mute; error: the fix-hint card from `AU5-0` on the stage and the tab auto-switches to JSON.
- **JSON**: press-deep block filling the card, the response highlighted (`CodeBlock lang="json" wrap={false}`), a top row with `Copy` right and `Headers` left toggle. Errors show as returned.
- **Code**: press-deep block; top row language tabs Node · Python · curl · PHP (paper-on-dark pill for active), right `Key masked` toggle + `Copy`. Snippet regenerates from Input on every change; **no wrapping**.
- Auto-switch to Preview after a 2xx with a file, JSON otherwise.

## Keep from the parked v3 patch

Line wrapping off in every editor; `CodeBlock` `wrap` prop; auto-switch after send; result meta (dims, size, request id in the JSON `Headers` view). Drop: request bar, call-picker dropdown, RECENT lane column, meta footer.

## Acceptance

- 1280×720 with the rail open: all nine calls visible, no wrapped or clipped label, Send and the Result header visible without scrolling, both code surfaces scroll horizontally.
- Screenshots at 1280 against `BBW-0` (Preview) and `BF3-0` (Code); at 1440 the same boards with the width table above.
- Count the controls on screen in the default state: title, key, calls list, Input (header, one field, two rows, one link, one button, one caption), Result (header, toggle, stage, meta, three buttons). Anything beyond that is drift.
- Everything in the v2 acceptance list still passes.
