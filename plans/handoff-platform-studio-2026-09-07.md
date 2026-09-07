# Handoff — Platform studio: the campaign editor becomes the main template editor, with Code mode

**Date:** 2026-09-07 · **For:** implementing session `front-end-html-to-gif-e1` · **From:** design/orchestration session
**Parent:** [`handoff-studio-b-2026-09-05.md`](handoff-studio-b-2026-09-05.md) (studio v2 boards, contracts B00–B06) and [`handoff-ai-native-2026-09-05.md`](handoff-ai-native-2026-09-05.md). Everything there stands; this doc adds the platform context and the Code mode.

**Mandate (unchanged):** do not ask the user. Take the recommended path written here and record deviations in your report. The user reviews when it is done.

---

## 1. What changes

The user's instruction: *"We have a much better template editor in campaigns, bring that to the main product too. Use that in the main editor with HTML editor."*

`/template-workspace/html/[uid]` (v1 `TemplateStudio`: Say it | HTML pane, ProofStage, InputsRail, UseItCard) is replaced by the v2 studio shell that `/campaign-studio/[uid]` runs on (`src/lib/components/studio/v2/*`), plus a **Code** stage mode the campaign context does not have yet (it gets it too, for free). The v1 `HtmlPane` becomes the code pane inside Code mode. `/dashboard/template/[uid]` keeps redirecting to the workspace route; `?mode=html` opens Code.

## 2. Paper boards (file `01KZQXXEZ2SNPWS5PN2FCF31PC`)

All 1440×900, top −999. Read exact values with `get_jsx` / `get_computed_styles`.

| Board | Node | Shows |
|---|---|---|
| PS-01 Design mode · text selected (template context) | `JL2-0` | ST-01 shell in platform context: breadcrumb `Templates / Blog OG image · SAVED · REV 4`; top-bar right = undo/redo · `PNG · 1200 × 630` chip · **Use it** (secondary) · **Render** (plum primary); stage modes **Design · Code · Preview data · Rendered proof**; `+ Text + Image + Shape + Variable ⌄`; right rail tabs **SELECTION · INPUTS · USE IT**; selection tag `Heading · variable: title · 300 × 34`; status `Saved · 4 variables · Render makes the real file` |
| PS-02 Code mode · HTML left, live canvas right | `JQS-0` | Stage split: code pane 432 px on `#242628` (header `TEMPLATE.HTML` + `LINE 14 · SELECTED` in field, Format · Copy; line numbers; `{{tokens}}` in rose; selected line 14 has a field left bar + `#383A42` fill; footer `Valid · canvas follows as you type` · `4 VARIABLES · 21 LINES`) and the live canvas (subtle ground, `LIVE · CLICK TO SELECT`, artboard at fit with the `<h1>` outlined royal, bottom `Editing line 14 · Heading · variable: title`, top-right `25% · 1200 × 630`). Right rail still Selection (synced). |
| PS-03 Rendered proof after Render · Use it rail | `JZI-0` | Proof mode: strip `CURRENT · REV 4` + sample switcher + Download PNG + Copy URL; the real render with caption `RENDERED REV 4 · PNG 1200 × 630 · 96 KB · 1.4 S · media.pictify.io/…`; footer `This is the real file the API returns for these sample values.` Right rail **USE IT** active: heading, API · AGENT · ZAPIER · SHEET tabs, CURL block with the current sample values, RETURNS, ALSO links (bulk CSV, SDK snippets, docs), footer `Live key selected · pk_live_…c41d` |
| PS-04 Start · empty | `K7R-0` | ST-08 in platform context: heading "Describe the template. AI drafts it. You make it yours."; FORMAT cards **Image · PNG or JPG** / **PDF**; DESCRIBE IT textarea with `VARIABLES: AI PROPOSES, YOU CONFIRM`; **Create first draft · about 20 s**; starters OG image · Certificate · Invoice; foot **Paste HTML** · Choose an existing template; empty dashed artboard; right rail = document panel (`Document · New template`, brand kit from Brand assets rev 3, Edit in Brand assets · Don't use brand) |
| Notes | `KCI-0` decisions · `KD6-0` code-mode states | Below PS-01/02 |

Refero references: Resend broadcast editor (code left, live preview right, autosave), Lovable (design/code toggle on one project), Webflow/Framer (canvas primary, code as a mode not a separate product). No reference was copied; the shell is ours from ST-01.

## 3. Locked decisions

1. **One studio, two contexts.** `StudioShell` + `StudioStage` + rails are shared. A `context: 'campaign' | 'template'` prop (or two thin route components) changes only: breadcrumb, top-bar buttons, right-rail tab set, Inputs source, status copy. No second shell.
2. **Code is a fourth stage mode** (`design | code | preview | proof`, keys 1–4), not a page and not a rail tab. Split stage: code pane 432 px fixed left, live canvas fills the rest. Both contexts get it.
3. **Two-way, one source.** Code → document: re-parse after 350 ms idle (the v1 `PREVIEW_DEBOUNCE_MS`), only when the HTML parses; document → Code: serialize on every visual/AI edit. `data-pictify-id` survives both directions; elements without one get an id on the next serialize (B00-4 rule). Undo history is one stack across modes.
4. **Selection is the same thing in both panes.** Click on the live canvas → line range highlighted + cursor placed; cursor inside an element's range → that element outlined on the canvas and shown in the Selection rail. The live canvas in Code mode is selectable but not draggable (no handles); editing there is by typing.
5. **Variables are the contract.** Inputs rail is derived from the tokens in the HTML on every change (existing v1 rule, `extractInputs` from `$lib/utils/template-tokens.js`; server AST wins when it answers). `+ Variable ⌄` lists existing variables and **New variable…**; inserting puts `{{name}}` into the selected text element (Design) or at the cursor (Code). Types guessed by the v1 `typeFor` heuristic, editable in Inputs. Copy says "variable", never "field" (fields are a campaign word).
6. **Primary is Render.** It renders the real file with current sample values through the production path and switches to Rendered proof with URL, Download, Copy URL and size/time caption. **Use it** is a secondary top-bar button that opens the USE IT rail tab; the tab is always reachable on its own too. In campaign context the primary remains "Use this design".
7. **Right rail tabs: SELECTION · INPUTS · USE IT.** Brand is not a tab in template context; nothing selected shows the document panel (dimensions, format, background) with the brand-kit block (`Brand assets · rev n`, Edit in Brand assets · Don't use brand). Campaign context keeps SELECTION · INPUTS · BRAND.
8. **Start = describe, paste HTML, or a starter.** Formats: Image (PNG/JPG, free size, presets OG 1200×630, square 1080, banner 1584×396) or PDF (A4, Letter, custom). **Paste HTML** opens Code mode after the S3 compatibility report; nothing is drawn before the user accepts the report. Starters fill the description only.
9. **Unsupported markup is honest, not silent.** In Code, blocked constructs (script, iframe, form, event handlers, remote CSS/fonts) stay visible with an alarm gutter mark and a one-line reason; save strips them and shows the S3 report. Field square in the footer: "2 items will be removed on save".
10. **Copy rules** as before: design/template, revision, sample, variable. Never "DOM", "node", "preset", "engine".

## 4. Contracts

- Existing template API stays: `PATCH /templates/:uid` (html, width, height, outputFormat, pdfPreset, sampleValues, expectedRevision → revision or 409), `POST /template-studio/:uid/edit` (Say it), `POST /templates/:uid/proof` → **Render** uses the production render path (`renderTemplate` in `src/api/template.js`) and records the result as the proof for `{ revision, sampleId }`.
- **Compatibility** `POST /templates/import/check` (S3) is called by Paste HTML and by Code mode on every parse (client-side rules mirror it; server is the authority on save).
- **Variables**: `GET /templates/:uid` returns `variableDefinitions` + `sampleValues`; the client never stores a variable list that is not derivable from the HTML.
- `/dashboard/template/[uid]` → `/template-workspace/html/[uid]` unchanged; `?mode=html` → Code; `?mode=say` → Design with Say it focused.

## 5. Tasks (PS)

- [ ] **PS-1 Context prop.** Add `context` to `StudioShell`/`StudioTopBarV2` (breadcrumb, buttons, tab set, status copy). Campaign route passes `campaign`; new platform route passes `template`. No behaviour change for `/campaign-studio`.
- [ ] **PS-2 Code mode.** New `CodePane.svelte` in `studio/v2/` built from v1 `HtmlPane` (press palette, gutter, overlay, native textarea) with: selected-line highlight (field bar), error gutter marks, header (file label, LINE n · SELECTED, Format, Copy), footer (validity square + sentence, `n VARIABLES · m LINES`). `StudioStage` gains the split layout when `mode === 'code'`; the live canvas is selectable, not draggable. Keyboard 1–4.
- [ ] **PS-3 Two-way sync + selection map.** `editor-store.js`: `setHtmlFromCode(html)` (debounced parse, id pass, keep selection by id) and `serialize()` after visual/AI edits; a `rangeForNode(id)` / `nodeForOffset(offset)` map computed on serialize. Tests: round-trip keeps ids and `{{tokens}}`; invalid HTML never replaces the last good document; cursor→node and node→range agree on the fixtures.
- [ ] **PS-4 Inputs from tokens + "+ Variable".** Derive Inputs from HTML in both modes (reuse v1 `extractInputs`/`typeFor`); server AST override; `+ Variable ⌄` popover (existing list + New variable… name/type/sample); insert into selected text element or at cursor. Rename propagates; last-use removal after 2 s grace.
- [ ] **PS-5 Render + Use it.** Top bar `Render` (primary, disabled on Start and while AI works) → production render → proof mode with URL/Download/Copy URL/caption; failure and quota states per `KD6-0`. `Use it` button focuses the USE IT tab; port `UseItCard` tabs (API · Agent · Zapier · Sheet) into the rail with the current sample values and the active key.
- [ ] **PS-6 Start (template).** `StudioStart` in template context: Image/PDF format cards with size presets, Paste HTML → S3 report → Code mode, starters (OG image, Certificate, Invoice) from `src/lib/campaigns/starters/` + two new HTML files.
- [ ] **PS-7 Route swap.** `/template-workspace/html/[uid]/+page.svelte` mounts the v2 shell in template context; keep v1 `TemplateStudio` importable behind `?studio=v1` for one release, then delete. `/dashboard/template/create` lands on PS-04. Legacy fabric templates unchanged.
- [ ] **PS-8 Verify.** Round trip: create → Say it → visual edit → Code edit → Say it → Render on a real account; `?mode=html` deep link; paste of a script-bearing HTML shows the report and strips on save; keyboard-only pass on Code mode; `npm run lint`, `svelte-check`, unit tests; gstack `/browse` screenshots of PS-01…PS-04 against the boards.

Order: PS-1 → PS-2 → PS-3 (report before PS-4: does the id pass hold through code edits?) → PS-4 → PS-5 → PS-6 → PS-7 → PS-8.

## 6. Acceptance

A developer opens an existing HTML template, sees it in the v2 studio, presses 2 to open Code, edits an `<h1>` text and adds `{{subtitle}}`, sees the canvas and Inputs follow, clicks the heading on the live canvas and lands on its line, presses Render and gets the real PNG URL, opens Use it and copies a cURL carrying the same values. Nothing about `/campaign-studio` changes except that it also has Code mode.
