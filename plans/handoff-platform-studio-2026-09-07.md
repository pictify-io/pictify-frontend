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
| PS-05 Logic in Design mode · if/else selected · helper chip | `KDV-0` | The Storylane-style welcome line on the canvas: `Welcome aboard` + logic wrapper (field tag `IF firstName`, then-branch content `, {{firstName}}`, dashed `ELSE · hidden` marker, royal outline + handles), helper chip `workspaceName · default “Acme Corp”`; context bar `Show else · Select parent · Duplicate · Delete`; tag `Logic · if firstName · then + else`; status `3 logic blocks · 2 helpers · Preview data renders them with the sample`. Right rail for a logic block: header `Logic · if`, CONDITION (mono field `firstName` · is set, Handlebars line), BRANCHES (then, selected, `2 ITEMS` / else · nested if userName · Show; note), SAMPLE (`firstName = “Priya” → then branch`, `Try with firstName empty`), MOVE OR STYLE note, footer Lock · Duplicate · Delete. Notes `KL2-0`. |
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

- [x] **PS-1 Context prop.** Add `context` to `StudioShell`/`StudioTopBarV2` (breadcrumb, buttons, tab set, status copy). Campaign route passes `campaign`; new platform route passes `template`. No behaviour change for `/campaign-studio`.
- [x] **PS-2 Code mode.** New `CodePane.svelte` in `studio/v2/` built from v1 `HtmlPane` (press palette, gutter, overlay, native textarea) with: selected-line highlight (field bar), error gutter marks, header (file label, LINE n · SELECTED, Format, Copy), footer (validity square + sentence, `n VARIABLES · m LINES`). `StudioStage` gains the split layout when `mode === 'code'`; the live canvas is selectable, not draggable. Keyboard 1–4.
- [x] **PS-3 Two-way sync + selection map.** `editor-store.js`: `setHtmlFromCode(html)` (debounced parse, id pass, keep selection by id) and `serialize()` after visual/AI edits; a `rangeForNode(id)` / `nodeForOffset(offset)` map computed on serialize. Tests: round-trip keeps ids and `{{tokens}}`; invalid HTML never replaces the last good document; cursor→node and node→range agree on the fixtures.
- [x] **PS-4 Inputs from tokens + "+ Variable".** Derive Inputs from HTML in both modes (reuse v1 `extractInputs`/`typeFor`); server AST override; `+ Variable ⌄` popover (existing list + New variable… name/type/sample); insert into selected text element or at cursor. Rename propagates; last-use removal after 2 s grace.
- [x] **PS-5 Render + Use it.** Top bar `Render` (primary, disabled on Start and while AI works) → production render → proof mode with URL/Download/Copy URL/caption; failure and quota states per `KD6-0`. `Use it` button focuses the USE IT tab; port `UseItCard` tabs (API · Agent · Zapier · Sheet) into the rail with the current sample values and the active key.
- [x] **PS-6 Start (template).** `StudioStart` in template context: Image/PDF format cards with size presets, Paste HTML → S3 report → Code mode, starters (OG image, Certificate, Invoice) from `src/lib/campaigns/starters/` + two new HTML files.
- [x] **PS-7 Route swap.** `/template-workspace/html/[uid]/+page.svelte` mounts the v2 shell in template context; keep v1 `TemplateStudio` importable behind `?studio=v1` for one release, then delete. `/dashboard/template/create` lands on PS-04. Legacy fabric templates unchanged.
- [x] **PS-9 Selection rail (properties inspector) — both contexts, do right after PS-7.** The Selection tab today renders only the Document summary; the inspector drawn on ST-01 (`FM8-0` right rail, platform copy on PS-01 `JL4-0`), ST-02 image rail (`GEN-0`) and ST-03 group rail (`GJE-0`) was never built. New `SelectionRail.svelte` in `studio/v2/`, fed by the stage's `describe()` payload and driving the stage API; every field commits ONE transaction on change/blur with a label the receipt can print ("Heading · 52 → 60 px"). Sections, from the board:
  - **Header**: element label ("Heading") + one line "Text · shows a variable · inside “Header group”" (or "Image · 2 of 3 in Header group", "Group · row · 3 children").
  - **CONTENT** (text with a binding): powder chip `title` + its label + **Change** (opens the variable picker); "Sample: … · edit samples in Inputs". Text without a binding: the text itself in a field, editable (same commit as inline edit).
  - **TEXT**: font family ⌄ (brand fonts + Inter/system list), weight ⌄, size px, line-height, align L/C/R segmented, colour swatch + hex + brand name when it matches a brand colour.
  - **POSITION**: header note "Flows with its group" / "Free" from `role`; offset x / offset y (flow, transform translate) or x / y (free, left/top); **Layout order n of m** with ↑ ↓ (reorder among siblings, uses `reorder`); the explanatory line under it verbatim from the board. Rotation control only for images/shapes without a binding, snapping 15°.
  - **SIZE**: w, h (h shows `auto` muted when not pinned); the fit line with a field/proof/alarm square ("Longest sample needs 2 lines · fits").
  - **Footer**: Lock · Duplicate · **Delete** (alarm), wired to `toggleLock`, `duplicateSelected`, `removeSelected`.
  - **Image selected** (`GEN-0`): file card + Replace, fit inside/cover, rotation, x/y/w/h, align, layer order.
  - **Group selected** (`GJE-0`): direction Row/Column/Free, gap, justify, align, padding, fill + radius, size Fill/Hug.
  - **Multi-select**: count, Align (6) and Distribute, Group; nothing else.
  - Stage API additions: `setStyle(id, patch, label)` (generalise `applyStyles`, whose "fix overflow" label is hard-coded), `setText(id, text)`, `setBinding(id, name)`, `setRotation(id, deg)`, `layoutIndex(id)` → `{ index, count }`. `describe()` gains `fontFamily`, `lineHeight`, `offset {x,y}`, `rotation`, `widthPinned/heightPinned`, `src` for images, and group props for containers.
  - Inputs are plain `<input>` / `<select>` in the v2 field style (34 px, rule border, radius 6, mono for numbers). No sliders. Keyboard: ↑↓ steps 1, shift 10 in numeric fields.
- [x] **PS-10 Handlebars logic, document styles and fonts in the studio — BLOCKING, do before PS-2.** User 2026-09-07 on `/template-workspace/html/ELOMRRNOGP`: "This template is messed up now. Specially due to handlebar conditions and code being displayed weirdly." That template (`{{#if firstName}}, …{{else}}{{#if userName}}…{{/if}}{{/if}}`, `{{default planName "PRO TRIAL"}}`, `<html style>`, `<body style>` with the background gradient, a Google Fonts `<link>`) is the shape of most real platform templates. Board PS-05 `KDV-0`, notes `KL2-0`.
  - **Parse, don't regex.** `src/lib/components/studio/v2/logic.js`: use `handlebars` (already a dependency) `Handlebars.parse(html)` to walk `ContentStatement` / `MustacheStatement` / `BlockStatement` (+ `else` programs, `{{else if}}` chains). Build the stage HTML from the AST: content → as is; mustache with no params/hash → `{{name}}` text (existing chip behaviour); mustache with helper/params/hash → `{{…}}` text carrying the raw expression (`describe()` reports `expression` and `helper`; the rail shows the expression in a mono field with Change); block → wrapper `<pictify-logic data-hb-kind="if" data-hb-expr="firstName" data-hb-open="{{#if firstName}}" data-hb-close="{{/if}}">` containing `<pictify-branch data-hb-branch="then">…</pictify-branch><pictify-branch data-hb-branch="else" data-hb-open="{{else}}" hidden>…</pictify-branch>`. Inline vs block: `display:inline` when the block's content parses to phrasing content only, else `display:contents`. Custom elements so DOMPurify (add them to ALLOWED_TAGS) and the serializer can find them and nothing in a template can collide.
  - **Well-formedness gate.** Wrapping requires each block to open and close in the same parent element. Detect by parsing the block's inner content with the fragment parser and checking that the wrapper's parent's child list is unchanged; on failure, Design mounts read-only with the field strip `This template’s logic spans elements · edit it in Code` (state in `KL2-0`), Code/Preview/proof unaffected.
  - **Serializer** (`stage.js` `serialize`): unwrap `pictify-logic` back to `open + then + (else-open + else) + close`, strip editor attributes, keep ids. Test: parse → stage HTML → serialize equals the source byte for byte for ELOMRRNOGP's html and for the five OUT/starter fixtures; and after one text edit inside a branch only that text differs.
  - **Canvas chrome** (`stage.js`): wrapper tag chip (field bg, ink border, mono `IF firstName` / `EACH items` / `UNLESS paid` / `WITH order`) drawn as editor UI (`data-editor-ui`) at the start of the wrapper; hidden branch collapsed to a dashed mute `ELSE · hidden` marker; `Show else` / `Show then` in the context bar and rail swaps the `hidden` attribute (never a transaction). Which branch is shown initially = what the sample would take: evaluate the condition client-side for `if/unless` on plain paths (truthy per Handlebars rules) and default to the first branch otherwise. `each` shows one iteration with a `×n in sample` tag.
  - **Selection rail** (`SelectionRail.svelte`, PS-9): logic variant per the board — CONDITION (mono field, `is set` / `is empty` hint, edit commits `setLogicExpression(id, expr)` with label "if firstName → if user.firstName"), BRANCHES (then/else rows with item counts, Show link), SAMPLE (evaluated result + `Try with <var> empty` which sets the sample in Inputs), MOVE OR STYLE note, footer. `describe()` for a logic node returns `{ kind:'logic', helper, expression, branches:[{name, count, shown}], sampleResult }`.
  - **Layers**: `Logic · if firstName` row with `then` / `else` children; branch elements draggable, the block itself not.
  - **Preview data = server render.** For any template whose AST contains a block or a helper call, Preview data and the specimen call `POST /templates/preview` (v1 `previewTemplateHtml`, no quota) with the current sample values and mount the returned HTML read-only. Client-side `substitute()` stays only for bare-token designs. Debounce 350 ms, show the previous preview with a field square while the new one renders.
  - **Inputs from the AST**: variables = every `PathExpression` in mustaches, block params and helper params, de-duplicated, `this.x` inside `each items` reported as `items[].x`; unknown helpers (not in the backend safelist, mirror the list from `service/template-helpers.js` into `src/lib/utils/handlebars-autocomplete.js` if it is not already there) flagged alarm in the chip and counted in the status line.
  - **Document styles**: `writePreviewDocument` copies `style`/`class`/`lang` from the source `<html>` and `<body>` onto the frame's own `html`/`body` and `serialize` writes them back into the saved document (keep `WHOLE_DOCUMENT` shape when the source had one; bare fragments stay fragments). ELOMRRNOGP's body background and 1080×1080 sizing must show on the canvas.
  - **Fonts**: `cleanHtml` keeps `<link rel="stylesheet">` only when `href` is on `fonts.googleapis.com`; `PREVIEW_CSP` adds `style-src https://fonts.googleapis.com` and `font-src https://fonts.gstatic.com`. Everything else stays blocked (B06-1 stands). The renderer already loads these fonts, so the canvas and the file agree.
  - **Verify** on ELOMRRNOGP in the user's own session (tenancy: your dev cookie cannot open it, so use a copy of its html on a template your team owns): canvas shows the dark gradient, the fonts, the welcome line with the IF chip; Preview data shows "Welcome aboard, Priya"; a text edit inside the then branch saves and the saved html still contains the exact `{{#if firstName}} … {{else}}{{#if userName}} … {{/if}}{{/if}}`; Rendered proof matches Preview data.
- [x] **PS-8 Verify.** Round trip: create → Say it → visual edit → Code edit → Say it → Render on a real account; `?mode=html` deep link; paste of a script-bearing HTML shows the report and strips on save; keyboard-only pass on Code mode; `npm run lint`, `svelte-check`, unit tests; gstack `/browse` screenshots of PS-01…PS-04 against the boards.

Order (revised 2026-09-07 after the user opened `/template-workspace/html/…` expecting selection): PS-1 → **PS-7 first** (mount the v2 shell in template context with Design / Preview data / Rendered proof as they work today, Code off, `?studio=v1` fallback) → **PS-9 Selection rail** (done 5be4e6c) → **PS-10 Handlebars logic + document styles + fonts** (user 2026-09-07: "This template is messed up now… handlebar conditions and code being displayed weirdly") → PS-2 → PS-3 (report: does the id pass hold through code edits?) → PS-4 → PS-5 → PS-6 → PS-8. The route swap is what the user sees; Code mode follows it.

**PS-3 gate, answered 2026-09-07 (verified in Chrome, not reasoned about):** the
id pass holds through code edits ONLY BECAUSE IT DOES NOT RUN ON THAT PATH.
`ensureNodeIds` returns `doc.body.innerHTML`, so it round-trips through
DOMParser and rewrites the source — `<img />` loses its slash, `class='x'`
gains double quotes, `<DIV>` lowercases, bare `disabled` becomes
`disabled=""`. The ids themselves are stable and idempotent (a second pass
assigns none, and `{{tokens}}` and indentation survive); the TEXT is not.
Running it per keystroke would undo someone's formatting under their caret.

So the code buffer is the source of truth while typing — `setHtmlFromCode`
commits raw — and ids are assigned in `serialize()`, at a moment the document
changed by other means and a rewrite is expected. The cost is that an element
just typed has no id until then and is briefly not selectable. This is what
"missing ids are assigned on serialize" means in §3 decision 3, and
`code-map.js` is a scanner rather than a DOM parse for the same reason: the
offsets must index the user's text.

### 5a. What was built (2026-09-07)

All PS tasks are implemented on `worktree-redesign-v2` (frontend) and
`feat/campaigns-r1` (backend). Nothing is committed.

**New files** — `studio/v2/`: `logic.js` + test (Handlebars → stage → source,
byte-for-byte), `document-shell.js` + test (split/rejoin `<html>`/`<head>`/
`<body>`), `code-map.js` + test, `paste-report.js` + test, `CodePane.svelte`,
`SelectionRail.svelte`, `VariablePopover.svelte`, `TemplateStart.svelte`,
`fixtures/logic-template.html` (a real platform template, used as the
round-trip fixture); `src/lib/campaigns/starters/templates.js`.
**Rewritten**: `template-workspace/html/create/+page.svelte`,
`template-workspace/html/[uid]/+page.svelte`.
**Touched**: `stage.js`, `node-ids.js`, `preview-document.js`, `StudioShell`,
`StudioStage`, `LayersTree`, `ProofView`, `UseItCard`, `CardPreview`,
`campaign-studio/[uid]/+page.svelte`.

### 5b. Deviations from the spec

1. **Starters are one JS module**, `src/lib/campaigns/starters/templates.js`,
   not "two new HTML files". The existing starters keep HTML in template
   literals in a JS module and the build has no raw-html import configured; one
   starter loading differently from the others is a difference someone has to
   discover. Approved by the handoff author.
2. **Start is the whole page**, not the shell's left rail. A new template has no
   row, no revision and nothing to save, so the shell's top bar would be
   controls for a document that does not exist. All of the board's copy is
   present. Approved.
3. **No sample switcher on the proof.** Template context has a single
   `sampleValues` object rather than named samples, so the proof is keyed by
   revision alone. Approved.
4. **`RETURNS` and `ALSO` are opt-in props** on `UseItCard`. It is shared with
   the v1 studio and the video studio, neither of which has a Rendered proof to
   point at — "exactly what Rendered proof shows for rev n" is a claim they
   cannot back.
5. **Render passes the buyer's API key.** `POST /templates/:uid/render` is
   registered behind `verifyApiToken` and there is no cookie-authenticated
   render route (`renderTemplateProof`'s `/template-draft/:uid/proof` does not
   exist in the backend at all). Without a key the button is disabled and says
   `Render needs an API key · create one in Settings`. The v1 studio's
   `onRender` never passed a key, so v1 Render was 401ing too.
6. **Helper mustaches are chips, bare tokens are not.** `{{firstName}}` stays
   literal text so the existing binding path is untouched; anything with a
   helper, params or a hash becomes `<pictify-expr>` carrying its raw source.
7. **The paste report also flags relative paths.** `/logo.png` works on the site
   it was copied from and resolves against nothing in a render.

### 5c. Bugs found while building, and fixed

Every one of these was pre-existing and is unrelated to the feature that
surfaced it.

- **Backend, `service/template-node-ids.js`: `cheerio.load(html, null, false)`
  is FRAGMENT mode.** A whole document lost `<html>`, `<head>`, `<body>` and
  their attributes, and the head's contents were hoisted to the front — 105
  chars in, 45 out. It runs on every draft save (`routes/template-draft.js:73`)
  and every AI result (`routes/template-studio.js:405`), so the loss was written
  to the database. The load mode now follows the input; 6 regression tests.
  **20+ dev templates already carry the damage and a code fix does not undo it.**
  `ELOMRRNOGP` is intact. The file does not exist on `origin/master`, so
  production was never affected.
- **Frontend, `node-ids.js`: the same bug on the client**, for the same reason
  (`DOMParser` into a body, return `body.innerHTML`). `load()` and `commit()`
  both run it, so the studio never saw the real document.
- **The create route was completely broken.** It POSTed `html: ''` on mount,
  which the renderer's validation now rejects (422, "template source is
  required"), so every New Template click died on a red error page — and it
  spent a template slot on anyone who merely clicked New. Also
  `outputFormat: 'png'` is a 500; the model enum is `['image','pdf']`.
- **Saves in the template studio were throwing.** The route called
  `saveQueue?.schedule()`; the API is `{ nudge, flushNow, recover, discardLocal,
  stop }`. `?.` guards the queue, not the missing method, so no edit ever
  persisted. Five call sites.
- **The code buffer went stale after every visual or AI edit.** `commit()`
  updates `html` but deliberately not `codeBuffer`, and nothing called
  `serialize()` — so opening Code showed the document as it was at page load,
  and one keystroke committed that stale document over the real one. Measured on
  a fresh template: canvas 3,125 chars, code pane 182. Entering Code now
  serializes first, in **both** contexts.
- **Selection was dropped after every rail edit.** The edit round-tripped
  through the store and remounted the stage. `serialize()` now emits ids-complete
  html and the stage skips the remount when the incoming html is its own output;
  a genuine rebuild re-selects by id.
- **`StudioStage` dispatched an un-normalised selection.** A deselect is
  `{count: 0}` — truthy — so consumers doing `e.detail || null` kept a selection
  with nothing in it and `SelectionRail` read `one.blocked` off null.
- **`AiLock`'s Cancel was a dead button** on the template route: the component
  dispatches `cancel` and nothing listened, on the one control available while a
  run holds the document.
- **DOMPurify drops leading comments**, so a template opening with a section
  marker lost it on every save (619 bytes on the fixture).
- **The proof image raced the CDN.** An `<img>` requested milliseconds after the
  render returned got 403, the browser cached it, and a render that had in fact
  succeeded showed as broken for the life of the page. Retried with backoff;
  observed `403, 200` on the next render, image then displays.

## 6. Acceptance

A developer opens an existing HTML template, sees it in the v2 studio, presses 2 to open Code, edits an `<h1>` text and adds `{{subtitle}}`, sees the canvas and Inputs follow, clicks the heading on the live canvas and lands on its line, presses Render and gets the real PNG URL, opens Use it and copies a cURL carrying the same values. Nothing about `/campaign-studio` changes except that it also has Code mode.

### 6a. PS-8 verification pass (2026-09-07)

One continuous scripted run on the dev account against the live dev server,
Chrome at 1440 × 900. 21 checks, all passing; screenshots for PS-01…PS-04 in
the session scratchpad.

| # | Step | Result |
|---|------|--------|
| 1 | Start renders (PS-04) | pass |
| 2 | starter fills the description, nothing drawn | pass (133 chars) |
| 3 | Create → row made, navigated to the new uid | pass |
| 3.1–3.2 | `?draft=` runs the AI once, lock up then down | pass |
| 3.3 | canvas holds a document | pass (3,125 chars server-side, 13 elements) |
| 4 | click selects, inspector appears | pass |
| 4.1 | font-size 13px → 43px | pass |
| 4.2 | **selection survives the edit** | pass |
| 4.3 | saved | pass |
| 5–5.1 | Code pane populated, keeps the document shell | pass |
| 5.2 | **code pane reachable by Tab alone** (23 tabs) | pass |
| 5.3–5.4 | typing changes the buffer, no mouse used | pass |
| 6–6.1 | second AI run starts and finishes | pass |
| 7–7.1 | Render → real PNG URL + caption | pass |
| 8–8.1 | Use it: cURL with live key, RETURNS + ALSO | pass |

Render from the pass:
`https://media.pictify.io/template-renders/wxqhy2xe-1788753994232.png`
(200, image/png, 1200 × 630, 55,766 bytes). Both templates created by the pass
were deleted afterwards.

**Two defects the pass itself found**, both since fixed and re-verified: the
stale code buffer (§5c) — caught only because the run printed the buffer length
and 182 chars was the seed document, not the draft — and the proof image race
(§5c), caught because the run logged a 403 on the render URL that `curl`
returned 200 for.

**Not covered.** The `/browse` screenshots are Chrome screenshots from the
verification script, not a gstack `/browse` session, and they have not been
diffed against the boards pixel by pixel — they were read by eye. A paste of
script-bearing HTML was verified to produce the report (`paste-report` has 17
unit tests including scripts, handlers and `javascript:` urls) but the
strips-on-save half was verified through `cleanHtml`'s DOMPurify config rather
than by saving a script-bearing document end to end. (`/campaign-studio` is now covered — see §6b.)

### 6b. Campaign studio regression pass (2026-09-07)

`/campaign-studio/[uid]` takes a TEMPLATE uid with `?campaign=&edition=`. Run
against `UJY0FFD1DT?campaign=5VD1PBY8UR&edition=EI9FZW8226`. Nine items, all
passing, no failing requests and no page errors:

| # | Item | Result |
|---|------|--------|
| 1 | loads with a document (4 modes) | pass |
| 2 | click selects, inspector appears | pass |
| 3 | rail edit applies (→ 44px) | pass |
| 3.1 | **selection survives the edit** | pass |
| 4 | Layers lists rows (11) | pass |
| 5 | Brand tab opens | pass |
| 6 | Preview data renders | pass |
| 7 | Code pane populated (1,160 chars) | pass |
| 7.1 | **buffer carries the rail edit** (serialize-on-enter) | pass |
| 8 | Say it runs and finishes (receipt "changed · verified") | pass |
| 9 | Use this design present, correctly disabled | pass |

Item 9 is disabled by design, not broken: `useBlockedReason` is "Render a proof
of this revision before using it" because the edit moved the design past the
last proof.

**A third defect found here**, and the most subtle of the three: the
serialize-on-enter fix was ORDER-DEPENDENT. `codeBuffer` is derived from the
store in its own `$:` statement, and Svelte orders reactive statements by
dependency — that statement could run before the mode-change statement in the
same flush, so the pane rendered the pre-serialize value. It presented as
identical code passing with a `console.log` in the block and failing without
it, because the extra `$editor` read reordered the two. The fresh html is now
assigned to `codeBuffer` directly as well as into the store, so the outcome does
not depend on statement order. Verified in BOTH contexts afterwards (campaign
1,160 chars carrying the edit; template 13,908 chars carrying it).

This also invalidated an earlier claim of mine: the template-route check that
"the buffer is 3,125 chars" only proved `load()` populates it, not that entering
Code refreshes it. Both are now tested by making an edit first.

## 9. TS — the template editor as a free tool (2026-09-08, user: "expose it in tools so that TOFU get a good experience")

Boards in the same Paper file: **TS-01 `KM0-0`** (guest editor: top bar `Tools / Untitled OG image · DRAFT · KEPT IN THIS BROWSER`, undo/redo, format chip, guest quota squares `4 FREE TODAY · NO WATERMARK`, secondary **Save to Pictify**, primary **Download PNG**; Say it composer with `2 AI EDITS LEFT TODAY · Sign up for more` and the privacy line; right rail USE IT with `YOUR_API_KEY` / `saved after sign-up` placeholders and the "Keep this template and call it from anywhere" card; footer `Guest · downloads free · saving needs an account`) and **TS-02 `KUK-0`** (hub card, result-card "Open in editor", zero-quota top bar, save handoff steps).

Model (Excalidraw / CodePen / Carbon): fully usable with no account, the draft lives in the browser, downloads are free on the existing guest ladder, and an account gates only saving, more AI edits and the API.

Decisions (locked):
1. **Route `/tools/template-editor`**, public, SSR head + longform via `ToolPageShell` conventions (ToolSeoHead, breadcrumb Tools / Template editor, facts, related), but the editor itself is full-bleed below the hero: the v2 shell in a third context `context="tool"`. `?draft=<id>` restores a local draft; `?html=<key>` opens HTML handed over from a tool result (sessionStorage key, never a URL payload).
2. **No server row for guests.** The document lives in `localStorage` (`pictify.tool-draft.<id>`: html, width, height, format, sampleValues, updatedAt). The editor store's save queue is replaced by a local writer in tool context; the top bar shows `DRAFT · KEPT IN THIS BROWSER` (field square) instead of SAVED · REV n. Undo/redo, Layers, Selection rail, Inputs, Code mode, Preview data all work unchanged.
3. **Download is the primary** and uses the guest render path the tools already use (`createImagePublic` in src/api/image.js; PDF via the public PDF equivalent) with the current sample values substituted server-side (same `/templates/preview`-style engine, no Handlebars sent to the public image route unsubstituted — if the public route cannot take variables, substitute through the preview endpoint first and render the result). Quota = the existing `QuotaMeter` / `GUEST_DAILY_LIMIT` (5/day) ladder; at zero the primary swaps for the signup button exactly as `GenerateButton` does; editing keeps working. Rendered proof mode shows the downloaded file as the proof.
4. **AI edits for guests: 3 per day**, counted client-side AND enforced server-side on `POST /template-studio/edit` for anonymous callers (new guest variant of the route keyed the same way the guest image quota is keyed; no template uid, the html travels in the body and comes back in the response). Counter under the composer (`2 AI EDITS LEFT TODAY · Sign up for more`); at zero the composer is replaced by `RailSignupCard` (location `say_it_zero`). Receipts, scope chips and the AI lock are unchanged.
5. **Use it tab teases, never lies.** Snippets render with `YOUR_API_KEY` and `saved after sign-up` placeholders; the card "Keep this template and call it from anywhere" lists the free plan facts from plan-features (no hard-coded numbers in the final build) and its button is the same signup handoff as Save.
6. **Save to Pictify = signup with the draft.** `/signup?intent=template-editor&draft=<id>` (login too). After auth: create the template from the local draft (name from the document title or "Untitled <format>"), redirect to `/template-workspace/html/<uid>`, toast "Saved as rev 1", clear the local draft. A draft older than 30 days is offered on return, not restored silently. This uses the FE-1 safe-intent allowlist from the campaigns handoff: add `template-editor`.
7. **Entry points.** (a) `/tools` hub: a new first card "Template editor" with the `NEW · NO SIGN-UP` tag and `5 FREE DOWNLOADS A DAY`; (b) every v2 `ResultCard` gets a third action **Open in editor** that stores the tool's HTML under a sessionStorage key and opens `/tools/template-editor?html=<key>`; (c) the Start page copy in tool context says "No account needed" under the heading.
8. **Analytics:** `tool_editor_opened` (source: hub | result_card | direct), `tool_editor_download`, `tool_editor_ai_edit` (remaining), `tool_editor_save_click`, `tool_editor_signup_completed` (draft restored yes/no). All masked, never the html.
9. **SEO copy** for the page follows the tool-page rules (frozen shape: H1 "Free online template editor: describe it, edit it, download it", facts line, longform, FAQ) and the `/writing-aeo-content` skill; write it in the handoff report, do not invent product claims beyond what ships.

Tasks:
- [ ] **TS-1** `context="tool"` in StudioShell/TopBar: draft status, Download primary, Save to Pictify secondary, QuotaMeter in the bar, no revision/versions, Say it counter, USE IT placeholders + signup card, footer line. Start page in tool context.
- [ ] **TS-2** Local draft store (`src/lib/tools/editor-draft.js`): write-through on every commit, restore on load, 30-day offer, `?html=` handoff key. Tests.
- [ ] **TS-3** Guest download through the public render path with server-side substitution; quota ladder; zero state; proof mode shows the file. Guest AI edit route + client counter + zero state.
- [ ] **TS-4** Signup/login handoff (`intent=template-editor&draft=`), template creation from the draft, redirect, toast, cleanup; allowlist entry.
- [ ] **TS-5** Hub card, ResultCard "Open in editor", analytics events, SEO head + longform for `/tools/template-editor`, sitemap-tools entry.
- [ ] **TS-6** Verify as a logged-out visitor in a fresh profile: land from the hub, draft with AI, edit visually, Code, Preview, download twice, hit the AI counter, reload and get the draft back, Save → signup → template exists at rev 1 with the same html. Then as a logged-in user: `/tools/template-editor` still works and Save goes straight to a template.

Backend (html-to-gif, campaigns-r1) — **enforcement is server-side, and today it is not.** Measured 2026-09-08: `POST /image/public` (what `createImagePublic` calls) is guarded only by `@fastify/rate-limit` at 10 requests/minute per IP; the 5-a-day guest ladder (`GUEST_DAILY_LIMIT`) is counted in the browser only. That is the existing state for every tool, and it is not acceptable for an endpoint that runs an agent. Named tasks:
- [ ] **TS-B1 Guest identity + daily counters.** One helper `guestQuota(req, bucket)` keyed on a salted hash of client IP + UA (what the request already carries; no fingerprinting script), stored with a UTC-midnight TTL (Redis if the deployment has it, else a small `GuestQuota` Mongo collection with a TTL index). Buckets: `render` (5/day) and `ai_edit` (3/day). Returns `{ remaining, resetsAt }` and is the source of truth the client meters display; the client counter becomes a cache of the server answer (`X-Guest-Remaining` header on every guest response).
- [ ] **TS-B2 Guest AI edit route.** `POST /template-studio/guest/edit` — body `{ html, instruction, width, height, sampleValues }`, response `{ html, receipt, remaining }`; no template row, no history; same safelisted helpers and the same `ensureNodeIds` (document-mode fix); hard caps on html size (256 KB) and instruction length; per-IP burst limit 3/minute on top of TS-B1; refuses when `remaining === 0` with 429 + `resetsAt`. Cost is the reason for the cap, so log spend per guest bucket.
- [ ] **TS-B3 Apply TS-B1 to `/image/public` and the PDF equivalent** so the render ladder is real for every tool, not just the editor. 429 with `resetsAt`; the frontend `QuotaMeter` reads the header and the zero state comes from the server. This closes a pre-existing gap and should be called out in the report as such.
- Confirm the public image route accepts substituted html at 1200×630 / A4 sizes without an account (it does for the tools today); substitution itself runs through the preview engine server-side so raw Handlebars never reaches the public renderer.
Frontend TS-3 and TS-5 depend on TS-B1/B2; build them against the server headers, never against localStorage alone.

Built 2026-09-08 (backend fac5336, verified against a running server: 403 without an allowed origin, 400 without an instruction, 413 over 256 KB, five renders then 429 + `resetsAt`, `X-Guest-Remaining/Limit/Resets-At` on every public render response, 18 unit tests). Two findings from the build, for the owner:
- The counter keys on `getClientIP`, not `req.ip`: behind the proxy `req.ip` is the proxy, so a counter on it puts the whole internet in one bucket. The existing `keyGenerator: (req) => req.ip` rate limits in `routes/auth.js`, `routes/oauth.js` and `routes/public-render.js` have exactly that shape and may be doing much less than intended in production. **Separate fix, not done.**
- `POST /gif/public` has no origin allowlist where `/image/public` does. Left as is rather than narrowing access silently. **Separate decision.**
- Behaviour change on deploy: the 5/day guest limit is now enforced for every tool, matching what the tool components already promise; anyone quietly exceeding it will hit a ceiling.

## 9a. REVISION 2026-09-08 — embedded in the tool page, OG image generator first (supersedes §9's full page)

User: *"Can we bring this experience in tools page itself rather than a full page. Check how canva and other tools do it."*, then *"We will design tools one at a time. This is good for the OG image generator. We need list of pre-made template and input box for user to add the url and ai will create OG image"*, then *"TS-03 is good. We need 2 things there. 1. A panel of pre-made templates 2. An input for url that will automatically prompt the AI in say it panel"*.

References: Canva's and Figma's free tools keep the tool working inside the marketing page with expand as a second step; Slite's /editor embeds a live editor above the fold; Pictify's own tool pages already run the tool inline. So: **no `/tools/template-editor` page and no separate start state.** The editor is embedded in each tool page in place of the code-pane + static-preview block, one tool at a time, starting with `/tools/og-image-generator`. TS-01 `KM0-0` is superseded (keep its chrome for the Expand overlay). TS-02's hub card and result-card "Open in editor" are dropped; the result card stays as on `8R0-0`.

**Board: TS-03 `KW3-0`** (one state), notes **`L12-0`**.

Embed anatomy (1200 wide in the tool page content column, 1.5 px ink border, radius 12, 6 px offset shadow):
- **Top strip 44 px**: Design · Code · Preview segmented; `DRAFT · KEPT IN THIS BROWSER` (field square); undo/redo (SVG icons); **Expand ⤢**.
- **Body 560 px, three zones.** Left: **TEMPLATES panel 232 px** — `TEMPLATES · 19`, filter chips ALL · BLOG · PRODUCT · DOCS · EVENT, vertical thumbnails (108 px, name + category, `IN USE` on the current one, the in-use card carries a 1.5 px ink border + 2 px field offset), scrolls; foot "Click one to swap the layout. Your text and colours stay." Centre: canvas (add tools top-left, zoom top-right, artboard at fit, selection chrome, status bottom-left). Right: **side panel 340 px** with tabs **SAY IT · SELECTION · INPUTS**. The SAY IT tab opens with **FROM A PAGE URL**: a field + ink **Make it** button and the line "Writes the instruction below from the page's title, description, logo and colours, then runs it."; then the receipts and the composer with the 3/day AI counter.
- **Toolbar 64 px**, identical to every tool: PNG · JPG · WEBP, size ⌄, `Sample: title = “…” · Edit`, quota squares `4 FREE TODAY · NO WATERMARK`, outlined **Save to Pictify**, ink **Download PNG** with the pink offset shadow. One primary.
- Below the embed: three one-line steps (Describe or paste · Click to change · Download). Result card, Automate it, long-form, FAQ, related and closing band continue exactly as on `8EP-0`.

Flow:
- The page opens **already drawn**: the tool's default template (Editorial dark) with sample text, one element pre-selected, so no panel is ever empty.
- **URL → Say it.** Submitting the URL calls `GET /api/tools/website-info` (exists: title, description, logo/favicon, colours), WRITES an instruction into the composer as the first receipt tagged `YOU · WRITTEN FROM THE PAGE · EDIT IT` (e.g. "Make an OG image for “Templated media for developers” by Pictify. Use the Pictify logo, navy #1B3A6B and lime #D8F34A, and the description as a subtitle."), then runs it on the template in use through the guest AI edit route (TS-B2; counts 1 of the 3 daily edits). The visitor can edit that text and run again. Unreachable page → alarm line under the field, instruction still written from the URL alone so the visitor can fill it in.
- **Templates.** Clicking a thumbnail swaps the layout and keeps the current values (title, logo, colours, variables) — a re-render of the chosen template with the same sample/values, not a new AI run; the URL field stays filled so Make it re-runs on the new layout. Gallery = the 19 files in `templates/og-image/` (served by `GET /api/tools/templates/og-image/all`), each with a name, category and a 1200×630 thumbnail rendered once at build time.
- Expand ⤢ opens the full studio (PS-01 chrome in tool context, with Layers, Rendered proof and USE IT) as an overlay on the same page, `#editor` in the URL, Esc collapses with nothing lost.
- Download = the tool's public render with sample values substituted server-side (TS-3); guest rules, quota ladder, save-with-draft signup (TS-4) and server enforcement (TS-B1…B3) unchanged.
- Narrow: <1024 the templates panel becomes a horizontal strip above the canvas and the side panel a bottom sheet; <768 canvas preview + Say it (with the URL field) + Download, plus "Open the full editor".

Tasks (replace TS-1/TS-5/TS-6; TS-2, TS-3, TS-4 and TS-B1…B3 stand):
- [ ] **TS-1a** `context="tool"` shell chrome for the Expand overlay + **EmbeddedStudio.svelte** (top strip · templates panel · StudioStage · side panel · tool toolbar) with a `templates` prop and a `urlPrompt` slot.
- [ ] **TS-5a** OG image generator page: replace the current tool block with EmbeddedStudio; default template drawn on load; URL field → website-info → instruction written into the Say it composer → guest AI run; templates panel from the templates endpoint with names/categories/thumbnails and swap-keeping-values; result card, analytics (`tool_editor_*` with tool_name og_image_generator, plus `tool_editor_url_prompt` and `tool_editor_template_pick`) and SEO copy unchanged except the hero facts line.
- [ ] **TS-6a** Verify logged-out in a fresh profile on /tools/og-image-generator: page opens drawn; URL → instruction appears in Say it and the card re-renders with the page's title/logo/colours in ≈20 s; edit the instruction and re-run; pick two templates and values persist; select/edit/say it; Code; Preview; Download twice; AI counter; reload restores the draft; Expand and Esc; Save → signup → template at rev 1. Then the same page logged in. Mobile at 390.
- Next tools follow one at a time on the same embed: certificate, invoice, html-to-*. Do not touch them in this pass.

## 9b. Roll-out to the other tools (2026-09-08) — user: "Implement these as well. Design the sections that need redesign"

Boards: **TS-05 `LBP-0`** (the "From a …" block at the top of Say it, nine variants: LinkedIn banner, social proof, certificate, invoice, email header, badge, membership/portfolio/leaderboard, markdown/table, html/code) and **TS-06 `LGX-0`** (four embed variants: A Code-first with THEMES panel, B STYLES panel with auto-height canvas, C certificate with landscape A4 + INPUTS-first + bulk lead-in, D invoice with portrait A4 + line-item table). Everything else is TS-03 unchanged.

**Matrix.** One `EmbeddedStudio` with four props: `leftPanel` (templates | styles | themes), `source` (the Say it input variant), `opensIn` (design | code), `canvas` (fixed WxH | auto-height | A4 landscape | A4 portrait), plus `defaultTab` and `bulkLeadIn`.

| Tool (slug) | Left panel | Source block (TS-05) | Opens in | Canvas | Default tab | Notes |
|---|---|---|---|---|---|---|
| og-image-generator | templates (19) | page URL | design | 1200×630 | Say it | TS-03, first |
| linkedin-banner-generator | templates | profile URL or name + headline | design | 1584×396 | Say it | photo-safe zone left 20 % drawn as a dashed guide |
| social-proof-card | templates by platform look | review URL or quote + author | design | 1200×630 | Say it | platform mark from the URL host |
| certificate-generator | templates | course + recipient + issuer | design | A4 landscape | **Inputs** | recipient = `{{name}}`; bulk lead-in card "One certificate is also a thousand → Bulk from CSV" (goes to /dashboard/template/[uid]/bulk-render after save) |
| online-invoice-generator | templates | company URL + invoice meta | design | A4 portrait, PDF primary | Inputs | line items as a small table in Inputs (`items[]` each variable); totals via helpers |
| email-header | templates | site URL + campaign line | design | 600×200 | Say it | |
| badge | templates | name + role + event | design | 1000×1400 | Say it | role picks the colour band |
| membership-card / portfolio-card | templates | 2–3 fields | design | card sizes | Inputs | |
| leaderboard | templates | pasted table | design | 1200×auto | Inputs | table → `rows[]` |
| markdown / table | **styles** (6) | pasted text | design | 1200×auto | Say it | height follows content; tables keep column alignment |
| html-to-[format] (png · jpg · webp · pdf) | **starters** (6: card, quote, receipt, table, banner, email block) | paste **or upload .html** (TS-07) | **code** | from the format chip; PDF = page size | **Inputs** when a template proposal exists, else Say it | See §9c / TS-07 `LMJ-0` |
| code-to-image | **themes** (8) | "your code is in the Code tab" | **code** | fixed | Say it | Code pane 330 px between themes and canvas (TS-06 A) |
| csv-to-pdf, tweet-screenshot, url-to-image-generator | — | — | — | — | — | not on this layout; leave as they are |

Rules that hold for every tool: the page opens already drawn (default template/theme + sample), the source block writes the instruction into the composer tagged `YOU · WRITTEN FROM THE INPUT · EDIT IT` and runs it (one of the 3 daily guest AI edits), templates/styles/themes swap the layout and keep values, Download is the tool's public render on the guest ladder, Save to Pictify carries the draft, Expand opens the full studio overlay. Copy per tool follows the frozen SEO shape and the `/writing-aeo-content` skill; only the hero facts line changes.

Tasks:
- [ ] **TS-7** EmbeddedStudio props (`leftPanel`, `source`, `opensIn`, `canvas`, `defaultTab`, `bulkLeadIn`) + the three left-panel kinds + the nine source blocks as one `SourceBlock.svelte` with a `kind` prop (fields per TS-05) and a `writeInstruction(kind, values)` helper with unit tests per kind.
- [ ] **TS-8** Roll-out, one PR per tool, in this order: linkedin-banner → social-proof → certificate → invoice → email-header → badge → membership/portfolio/leaderboard → markdown/table → html-to-[format]/code-to-image. Each PR: template/style/theme set with names, categories and build-time thumbnails; source block; hero facts line; TS-6a-style verification logged out and logged in; screenshots against TS-03/TS-06.
- [ ] **TS-9** Backend per tool where needed: LinkedIn/G2 fetchers reuse website-info's shape (title, description, image, colours) with per-host extractors; `items[]`/`rows[]` variables accepted by the guest AI route and the public render; A4 PDF through the public PDF route on the same guest counter (TS-B3).

## 9c. html-to-[format] routes (2026-09-09) — board TS-07 `LMJ-0`

User: *"What can we do for HTML to Image routes?"* → *"Yes, draw TS-07. Also we need option for user to upload the HTML file as well."*

The visitor brings finished HTML, so the embed differs from OG in four ways and is otherwise TS-03:
1. **Opens in Code**, code pane 400 px between the Starters panel and the live canvas; click-to-select works on their own elements; Say it acts on the markup ("centre the card", "transparent background", "fit to A4").
2. **STARTERS panel (200 px)** instead of templates: Card, Quote block, Receipt, Table, Banner, Email block. A starter replaces the code; the visitor's own HTML stays in undo. The page opens with Card drawn so the tool is seen working before any paste.
3. **Source = paste or upload.** Code pane header: `CARD.HTML · LINE 9 · SELECTED` · Paste · **Upload .html** · Format. The pane is also the drop target (TS-07 B): "Drop your .html file here · or paste, or choose a file · .HTML · .HTM · UP TO 2 MB · ONE FILE". After a file lands: `INVOICE.HTML · 14 KB · Replace`, "Loaded · 214 lines · styles kept", then the S3 compatibility report as `WHAT WE CHANGED · n` (relative image paths flagged with a field square, `<script>` removed with alarm, Google Fonts kept with proof) and **Continue** / **Upload the images**. "Upload the images" opens a picker that rewrites each relative `src` to a data URL (≤ 1 MB each) so the render matches what they see locally. File is read in the browser; nothing is sent until download. .zip of a page is not supported in this pass; the hero says so. The hero also gets an **Upload .html** secondary next to the paste CTA.
4. **Per-format toolbar (TS-07 A and C).** All routes: format segmented PNG · JPG · WEBP · PDF (route sets the default; switching updates the URL so the SEO page they landed on is the one they use), size ⌄, **Capture: whole document / a selector** (`.card ⌄`), quota, Save to Pictify, Download. PNG adds scale 1× 2× 3× and a **Transparent background** toggle. JPG/WebP swap the toggle for `QUALITY 90 ⌄`. PDF replaces scale/transparency with page size ⌄ (A4, Letter, custom), PORTRAIT / LANDSCAPE, `MARGINS 20 MM ⌄`, and a field-square note `3 pages · overflows one page` when content exceeds a page.

**"This could be a template" (TS-07 A, Inputs tab).** When the pasted/uploaded HTML contains literal `{{tokens}}`, or text that looks per-instance (numbers with currency, dates, an ALL-CAPS code, a name after "Bill to" / "Dear"), Inputs opens with a proposal card: field square, "This could be a template", one sentence, the candidate texts each with a suggested variable chip (`invoice_no`, `client`, `total`), **Make variables** (ink) · Not now. Nothing changes until accepted; on accept the texts become `{{name}}` in Code and chips on the canvas, and Save to Pictify keeps it as a template callable by API. Heuristics run client-side, no AI call; cap at 6 candidates; never propose on a starter.

Code pane footer: validity square + one sentence (`1 relative path · logo.svg won't load in the file`) and `n LINES`. Canvas status: `Editing line 9 · price · double-click to edit text`.

Tasks:
- [ ] **TS-10** html-to-[format] page on EmbeddedStudio: Starters panel + six snippets; open-in-Code; upload path (drop target, button, hero secondary, file read in browser, size/type checks, S3 report with the three finding kinds, "Upload the images" data-URL rewriter); per-format toolbar with the route setting the default and URL sync; capture selector picker (click on the canvas or type).
- [ ] **TS-11** Template proposal: `proposeVariables(html)` heuristic with unit tests (tokens, currency numbers, dates, codes, names after Bill to/Dear; cap 6; no proposal for starters), the Inputs card, accept → tokens + chips + Inputs rows, decline remembered per draft.
- [ ] **TS-12** Verify logged out on /tools/html-to-png and /tools/html-to-pdf: page opens with Card; paste → canvas follows, select on canvas → line highlighted; upload a 14 KB file with a script and two relative images → report shows all three, Continue, canvas renders; upload the images → they appear; PNG 2× transparent download; PDF A4 landscape 3-page download; template proposal on an invoice-like file → accept → Save → template at rev 1 with the variables.

