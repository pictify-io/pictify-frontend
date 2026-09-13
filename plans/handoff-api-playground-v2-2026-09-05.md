# Handoff — API playground v2 (workbench)

Date: 2026-09-05. Branch: `worktree-redesign-v2` (worktree at `.claude/worktrees/redesign-v2`). Route: `src/routes/dashboard/api-playground/+page.svelte`. Build on the 447-line rewrite already on that branch (commit 448d3ce + 66b172c), not on master's 3.9k-line v1.

## Why

Reviewed both versions in a local run on 2026-09-05 (backend :3100, frontends :5198 master / :5197 redesign-v2, unverified test user). Neither is a playground a developer can work in:

| | master (live) | redesign-v2 (unmerged) |
|---|---|---|
| Model | reference index of 18 endpoints | six task-first calls (right idea) |
| Request | forms per endpoint, editor small, Run below the fold | **nothing editable**: fixed sample HTML, no size, no variable editing after picking a template |
| Code | curl only, real key in plaintext | node / python / curl, key masked, real key on copy (keep) |
| Response | replaces the curl; "200 OK" shown over an error body | honest status in the JSON, but no status badge, latency, size or image preview |
| Layout | request and response never visible together | CODE and RESPONSE are tabs, so one always hides the other |
| Chrome | v1 brutalist | v2 tokens (keep) |

## Source of truth (Paper)

File **Pictify — Landing Redesign (Repro Shop)**, fileId `01KZQXXEZ2SNPWS5PN2FCF31PC`.

| Board | Node | Shows |
|---|---|---|
| API playground v2 — workbench | `AOW-0` | HTML → Image call, 200 response with image preview |
| API playground v2 — template call, 422 error | `AU5-0` | Template → Image with variables editor, 422 error + fix hint |
| API playground (previous board, superseded) | `6DU-0` | what the current v2 code was built from; keep only for diffing |

Read exact values with `get_jsx` / `get_computed_styles`. All colours are the file's tokens; no new palette.

## Layout — three lanes, one screen (1440)

```
Rail 220 (as built) │ Main 1220, padding 36/44
                    │ Header: "API playground" 44px Bricolage 700 · mono eyebrow
                    │         REAL CALLS · YOUR KEY · LANDS IN RENDERS · key pill (masked · COPY · ROTATE)
                    │ Workbench, gap 16, height = viewport − header:
                    │   Calls 216 │ Request 372 (card, rule border, r16) │ Output flex (press-deep, r16)
```

Below 1200px the Output lane drops under the Request lane; below 900px the Calls lane becomes a select at the top of the Request lane. Both code panes keep their own scroll; the page does not scroll.

### Calls lane

Groups with a mono eyebrow and hairline, rows 40px, method in a fixed 36px slot, active row on `--color-field`:

- **RENDER HTML**: HTML → Image `POST /image` · HTML → PDF `POST /pdf/multi-page`
- **RENDER A TEMPLATE**: Template → Image · Template → PDF (same endpoint, `format:'pdf'`) · Template → Video / GIF `POST /video/templates/:uid/render`
- **RENDER MANY**: Batch from rows · Batch from CSV (`POST /templates/:uid/batch-render`)
- **LOOK UP**: Template variables `GET /templates/:uid/variables` · Batch results `GET /templates/batch/:id/results`

`/gif` stays out (deprecated). No `DELETE`, no template CRUD: the studio owns those.

Foot of the lane: **RECENT · THIS BROWSER**, last five sends from `localStorage` (`path · status · latency`, time, proof-green square for 2xx, pink for anything else; click restores that request body). Then `MORE ENDPOINTS IN THE DOCS →` to docs.pictify.io.

### Request lane (card)

1. **Header**: `METHOD path` mono, `DOCS ↗` deep link to that endpoint's docs page, one-line description.
2. **Body field** (fills remaining height):
   - HTML calls: tabs `HTML | URL`, actions `SAMPLE` (reload the sample) · `FROM TEMPLATE` (pick a template, paste its HTML) · `⤢` (expand to a modal editor). Editor = CodeMirror.
   - Template calls: `TEMPLATE · FROM YOUR ACCOUNT` picker (existing `TemplateSelector`), then tabs `VARIABLES | FORM` with `REFILL FROM TEMPLATE`. VARIABLES = CodeMirror JSON. FORM = one input per variable from `GET /templates/:uid/variables`, the same object under both tabs.
   - Batch rows: VARIABLE SETS editor (JSON array). Batch CSV: a textarea plus `UPLOAD .CSV`.
   - GET calls: only the id field; body area shows "This call has no body."
   - Under the editor, one validation line: pink square + `signature_url is required · line 5`. Comes from client-side checks (JSON parse errors, required variables from the variables endpoint, width/height range). Send stays enabled; the line tells, it does not block.
3. **Options** (per call): WIDTH · HEIGHT (mono inputs, PX suffix) · FORMAT pills (PNG JPG WEBP for image; PNG JPG PDF for template; MP4 GIF for video) · LAYOUT select for templates (`default · 1600×1131`) · `+ MORE` opens a popover with `selector`. The board shows a SCALE field; **omit it**, `/image` does not accept one (`routes/image.js` reads html, url, width, height, selector, fileExtension).
4. **Send bar** (pinned, `--color-subtle`): left `COUNTS AS 1 RENDER · 1,000 LEFT` (real quota from the user store) + `⌘⏎ TO SEND`; right ink button `Send ■` (field square). ⌘/Ctrl+Enter sends from anywhere in the lane. While sending: label `Sending…`, button disabled, output pane shows a pulsing status line, never a spinner over the editor.

### Output lane (press-deep)

Two stacked regions, **both always visible**:

1. **Code strip** (44px): `REQUEST AS` + language pills `NODE PYTHON CURL PHP` (field pill = active, remembered in localStorage) · right: `KEY: MASKED` toggle (click shows the real key for 10 s, tracks `playground_key_reveal`) · `COPY` (copies the snippet with the real key, existing `copyValue` behaviour).
2. **Code** block: the request as it will be sent, regenerated from the request lane on every keystroke (debounced 150 ms). Max height 45% of the lane, own scroll.
3. **Status line** (44px, hairline above): `RESPONSE` · status square + code (proof-green 2xx, field-yellow 3xx/202 pending, pink 4xx/5xx) · latency `1.42 s` · `2400×1260 · 142 KB` (from the returned image, HEAD is not needed: read `naturalWidth/Height` off the preview and `content-length` if present) · right `HEADERS` (toggles a small table of response headers + `requestId`) · `COPY JSON`.
   Before the first send the line reads `RESPONSE · send the call to see its answer` in mute.
4. **Response body**: two columns when the response carries an image/pdf/video URL: 196px preview (image; PDF shows first page thumbnail if cheap, else a file tile; video shows a poster tile) with `OPEN ↗` `DOWNLOAD` `SAVE AS TEMPLATE` and `ALSO IN YOUR RENDERS` under it; JSON on the right. One column (JSON only) otherwise.
   - **Error**: JSON as returned, plus a **fix hint card** under it: title from the error (`The template needs signature_url.`), body `Nothing was rendered and nothing was counted.` for 4xx (drop that sentence for 5xx, say `Try again; if it repeats, the request id above is what support needs.`), action `JUMP TO LINE 5 →` when the error names a field the editor contains, else `OPEN DOCS ↗`.
   - **Batch (202)**: status line shows `202 · queued`, body shows the batch id and polls results (existing `pollBatch`), `CANCEL` in the fix-hint slot, status flips to 200 when complete with the first three thumbnails in the preview column.
   - **Unverified email (403 EMAIL_NOT_VERIFIED)**: normal error path; the hint card says `Verify your email to render.` with `RESEND LINK`. The rail card already nags; do not add a second banner.

## Syntax highlighting — required everywhere code appears

One theme, `src/lib/utils/press-highlight.js` (already on the branch). Nothing in this page paints code with ad-hoc colours.

| Surface | Component | Language mode |
|---|---|---|
| HTML editor (request lane, and the ⤢ modal) | `svelte-codemirror-editor` with `extensions: [...pressTheme, html()]` from `@codemirror/lang-html` | html |
| VARIABLES / VARIABLE SETS editor | CodeMirror with `pressTheme`, `json()` from `@codemirror/lang-json`, and `linter(jsonParseLinter())` from `@codemirror/lint` so a bad comma is underlined and named in the validation line | json |
| Request-as-code block | `CodeBlock` (`highlightToHtml`) | per language, see below |
| Response JSON | `CodeBlock` with a `lang="json"` hint | json |
| Response headers table values | plain mono, no highlighting | — |
| RECENT rows, status line, key pill | plain mono | — |

`highlightToHtml` today has one rule set tuned for curl/HTML. Extend it with a `lang` argument (`'html' | 'json' | 'js' | 'python' | 'shell' | 'php'`) and per-language rule lists that read the same `PRESS` palette:

- **json**: property names `--rose` (`PRESS.property`), strings/numbers/booleans/null `--field` (`PRESS.string`), punctuation inherits. URL strings are not links; the preview column is the link.
- **js**: keywords (`const await fetch async return import`) and called functions `PRESS.keyword`; strings `PRESS.string`; object keys before `:` `PRESS.property`; comments `PRESS.comment`.
- **python**: `import requests r = requests.post print` keywords `PRESS.keyword`; strings `PRESS.string`; dict keys `PRESS.property`.
- **shell** (curl): `curl -X POST -H -d` `PRESS.keyword`; quoted strings `PRESS.string`; header names `PRESS.property`; line continuations inherit.
- **php**: `<?php $ch curl_setopt curl_exec json_encode` `PRESS.keyword`; strings `PRESS.string`; array keys `PRESS.property`.
- All languages: `{{token}}` `PRESS.token` pink 500, matched first, so a variable inside a string stays pink. The masked key `pic_live_••••2c105` is a string (field).

`CodeBlock` gains `lang` and passes it through. The line height in read-only blocks is 19px at 12px mono (board value); the editor keeps 21px from `pressEditorTheme`. Gutter line numbers on every editor (`lineNumbers()`), none on read-only blocks.

Snippet generators live in one module, `src/lib/dashboard/playground-snippets.js`: `toNode(req)`, `toPython(req)`, `toCurl(req)`, `toPhp(req)`, all fed by the same `{ method, url, headers, body }` object the send function uses, so the snippet can never drift from what is sent. Tests: one fixture per call × language, snapshot the output.

## Behaviour and data

- **Honest status.** Keep the raw `fetch` in `send()` (it already bypasses the cookie session and uses the API key). `response = { status: raw.status, headers: Object.fromEntries(raw.headers), latencyMs, body }`. Never route through `src/api/*` wrappers; they return null on failure and produced v1's fake "200 OK".
- **Latency** = `performance.now()` around the fetch, shown to two decimals in seconds under 10 s, whole seconds above.
- **Quota text** reads the same store the sidebar meter uses; decrement optimistically on 2xx.
- **Recent** = last five `{ callId, body, options, status, latencyMs, at }` in `localStorage['pictify.playground.recent']`; restoring one re-fills the lane and selects the call.
- **Key reveal** is per page load, never persisted.
- **Template pick** (existing `pickTemplate`) fills VARIABLES with the template's sample values; `REFILL FROM TEMPLATE` re-runs it after edits with a confirm if the editor is dirty.
- **Validation** runs on change: JSON parse (from the linter), required variables vs `/templates/:uid/variables`, width/height 1–4000. The first problem is the one line under the editor.
- **⤢ modal editor** is the same CodeMirror instance moved into a full-height dialog; closing returns it. No second copy of the state.
- **Analytics**: `playground_call_sent { call_id, status, latency_ms, lang_shown }`, `playground_snippet_copied { call_id, lang, key_revealed }`, `playground_result_action { action: open|download|save_template }`, `playground_key_reveal`. Keep the existing `tool_signup_click` untouched; this page has no signup CTA.

## Out of scope

Template CRUD, `/gif`, the video generate-from-prompt endpoint, PDF presets endpoint, a mobile layout beyond the two breakpoints above, dark/light toggling (the output lane is always press-deep by design).

## Acceptance

- Screenshot at 1440 next to boards `AOW-0` and `AU5-0`: same lanes, same rhythm, request code and response visible together with no tab switching.
- Send `POST /image` with edited HTML and 800×400: response shows `200`, latency, `800×400 · N KB`, the image, and the render appears on the Renders page.
- Send a template render with a variable removed: status `422` in pink, fix hint names the field, `JUMP TO LINE` focuses the editor at that line.
- Unverified account: `403` path renders the hint card, no duplicate banner.
- Break the JSON: linter underline, validation line names the position, Send still enabled, server error still shown honestly.
- Every code surface uses `pressTheme` or `highlightToHtml(lang)`: `grep -n "color:" src/routes/dashboard/api-playground` returns no literal hex for code colours.
- Snippet snapshot tests pass for 9 calls × 4 languages; the curl snippet pasted into a terminal with a real key returns the same status as the page did.
- `npx svelte-check --threshold error` clean; prettier clean on touched files.
