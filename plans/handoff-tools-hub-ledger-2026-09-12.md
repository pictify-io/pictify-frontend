# Handoff — Tools hub as a ledger (design → implementation)

Date: 2026-09-12. Approved by the user on Paper ("Looks good, pass to other session for implementation").
Supersedes the shelf-of-drawings hub from `plans/handoff-free-tools-page-2026-08-22.md` and the
three art cards at the foot of every tool page.

## Source of truth

Paper file `01KZQXXEZ2SNPWS5PN2FCF31PC` (Pictify — Landing Redesign, Repro Shop). Read the boards with
`get_jsx` / `get_computed_styles` for exact values; the numbers below are the intent.

| Board | Node | What it shows |
|---|---|---|
| Tools hub HB-01 — ledger at scale (1440) | `LWV-0` | The whole page: nav, hero, finder bar, wedge row, index rail + ledger (7 shelves, 62 rows), autopilot card, footer |
| Tools hub HB-02 — finder states | `MHV-0` | PDF chip active + "invoice" typed (3 results, rail dimmed, "also matches outside PDF" line, URL state) and the no-match state |
| Tools hub HB-03 — ledger at 390 | `MHW-0` | Mobile: chips scroll, category jump strip replaces the rail, four rows per shelf + "n more" |
| Tool page HB-04 — More from the counter | `MHX-0` | The tool-page foot as three derived rows; replaces `RelatedToolCards` |
| Tools hub HB — notes | `MHY-0` | Registry fields, computed counts, finder/rail behaviour, breakpoints, out of scope |

Key nodes inside HB-01: finder bar `LXS-0` (search `LXT-0`, chips `LY3-0`), wedge row `LYJ-0`
(HTML to image `LYK-0`, Certificate `LZL-0`), ledger body `M0C-0` (rail `M0D-0`, ledger `M1D-0`),
first shelf `M1F-0` with the canonical row anatomy in `M1M-0`.

The 62 tools on the board are illustrative. Ship with the real registry; counts are computed.

## Why

18 tools already need 18 hand-drawn SVGs and the hub is 2,000 px tall. The SEO plan adds 6–8 tools and
a video family, and the template gallery adds hundreds of pages behind them. A row costs one registry
entry and no art; the stamp is generated from the tool's output format. The user's other reason: the
drawings on the tool-page related cards "take a lot of attention".

## Target in codebase

Frontend `pictify-io/front-end-html-to-gif`, branch `worktree-redesign-v2`
(`/Users/suyashthakur/Developer/Personal/front-end-html-to-gif/.claude/worktrees/redesign-v2`).
Backend is not involved.

- `src/lib/pseo/tool-cards.js` — the registry. Grows fields (below). Stays the single source; nothing else is hand-kept.
- `src/routes/tools/+page.svelte` — the hub. Replace the four `sections` shelves with the ledger; keep the hero, the two wedge cards, the autopilot card, footer, ItemList structured data.
- `src/lib/components/tools/v2/ToolPageShell.svelte` + `RelatedToolCards.svelte` — the foot of every tool page becomes the HB-04 rows (rename the component to `RelatedToolRows`).
- Uncommitted on the branch already (this session, keep them): related lists folded into `related=[…]` on seven routes and `[usecase]`, footer `RelatedLinks` block removed, `ToolPageShell` `main` gets `pb-20` and `ClosingBand` loses `mt-20`. Build on top of those; do not re-add the footer link list.

## 1 · Registry (`tool-cards.js`)

Per entry, in addition to `slug · title · meta · href · desc`:

```
shelf      one of: markup | social | documents | capture | widgets | charts | video   (exactly one)
inputs[]   HTML · URL · CSV · JSON · MD · TEXT · IMAGES · LOTTIE
outputs[]  PNG · JPG · WEBP · SVG · PDF · GIF · MP4      (outputs[0] drives the stamp)
aliases[]  search-only words, e.g. invoice → ['receipt', 'bill', 'quote']
addedAt    ISO date; NEW pill while < 45 days old
related[]  optional slugs for the tool-page foot; else derived (see §5)
art        wedge cards only; remove from every other entry (delete the unused SVGs from static/landing/tools once nothing references them)
```

Shelf labels and one-line intros (from the board heads):

| shelf | label | intro |
|---|---|---|
| markup | Markup → image | Paste markup, get a file. Same renderer as the API. |
| social | Social & OG | Sized for the platform. Title and logo in, share image out. |
| documents | Documents & PDF | Real PDFs with page sizes. Point a sheet at any of them for one per row. |
| capture | Capture & screenshots | A URL in. Headless Chrome does the rest. |
| widgets | Widgets & cards | Small, branded, one per person or thing. |
| charts | Charts & data | Numbers in, a picture of them out. No charting library on your side. |
| video | Video & motion | CSS animation rendered frame by frame. Converters can't do this one. |

Empty shelves are not rendered and not listed in the rail. Assign the current 18 tools: html-to-image,
code-to-image, markdown, table → markup; og-image-generator, tweet-screenshot, linkedin-banner-generator,
social-proof-card → social; csv-to-pdf, online-invoice-generator, certificate-generator → documents;
url-to-image-generator → capture; badge, leaderboard, membership-card, portfolio-card, email-header,
barcode-generator → widgets. (Certificate moves off "wedge" into documents as a row; it is still a wedge card.)

## 2 · Everything on the page is computed

Hero count ("62 TOOLS" eyebrow, the sentence), chip counts, rail counts, shelf counts and the ItemList all
derive from the registry at build time. Stamp colour from `outputs[0]`:
PNG/JPG `brand-powder` · PDF `brand-rose` · MP4 `brand-field` · SVG/WEBP `brand-sky` · GIF `brand-subtle`.
Wedge cards stay editorial: two slugs chosen by hand (`html-to-image` with badge MOST USED,
`certificate-generator` with BATCH READY), the only entries with `art`.

## 3 · Ledger row (canonical anatomy, `M1M-0`)

Row = whole-row `<a>`, 440 px wide in two columns with a 40 px gutter (≥1200), `py-10px`, hairline
`border-b brand-rule`. Inside, left to right, fixed lanes:

- Stamp: 40×40, `border-[1.5px] border-brand-ink rounded-[4px]`, bg by output, mono 10px bold 0.06em label = `outputs[0]`.
- Text column (flex 1): title Inter 600 16/20 ink; meta mono 11px 0.06em mute (existing `meta` string).
- NEW pill (when `addedAt` < 45 d): mono 10px bold, `bg-brand-field`, 1px ink border, pill radius, `px-7px py-2px`.
- Arrow `→` mono 12px mute, fixed slot.

Hover: title underline + arrow turns ink. Focus ring on the row (`outline-brand-royal`, offset 2).
No description in the hub rows.

Shelf head: `border-t-2 border-brand-ink`, `pt-14px pb-6px`; Bricolage 700 22px −0.02em label, mono
11px "n TOOLS", intro Inter 14/18 slate right-aligned. Shelves stack with 40 px between.

## 4 · Finder bar (`LXS-0`)

Full-width white bar, `border-b-[1.5px] brand-ink`, `py-14px`, page gutters. Sticky under the nav once
the hero has scrolled off.

- Search: 440×44, 1.5px ink border, 4px radius, mono 12px placeholder "SEARCH n TOOLS · INVOICE, OG IMAGE, PDF…", `/` kbd hint on the right. `/` focuses, Esc clears. Focused state: 2px `brand-royal` border, Inter 15px query text, "ESC CLEARS" hint.
- "OUTPUT" mono label, then chips: ALL · n, PNG · n, PDF · n, MP4 · n, SVG · n, GIF · n (only formats with ≥1 tool). Chip = mono 11px, 1.5px ink border, pill, `px-12px py-7px`, bg = stamp colour; active = ink bg + white text + " ×"; when a filter is active the inactive chips drop to `border-brand-rule` + mute text.
- Right: mono "EVERY ROW IS ONE API CALL →" (links to docs). With a filter: "k OF n · ?FORMAT=PDF&Q=INVOICE".

Search is client-side over title, meta, desc and aliases; no request. Chips are single-select, tap again
to clear. State lives in the URL (`?format=pdf&q=invoice`), applied on load so a filtered link is
shareable; the page stays one canonical URL for search engines (no separate indexable pages).

Filtered view (HB-02): shelves with zero matches collapse; the rail keeps every shelf and shows 0 in
mute; results head reads "k tools for “q”" + mono "PDF ONLY · MATCHED ON TITLE, META, ALIASES" +
"CLEAR FILTERS". Under the rows, a mono line names matches hidden by the format chip:
"ALSO MATCHES OUTSIDE PDF · INVOICE GENERATOR · PNG · SHOW 1 MORE →".

No match: dashed 1.5px ink card, `?` stamp, Bricolage 22 "Nothing on the counter for “q”.", Inter 15
line naming the two nearest tools by alias distance, two buttons: nearest tool (outline) and
"Describe it in the studio" (ink, pink offset shadow) → the studio Start route.

## 5 · Index rail (`M0D-0`)

216 px, `border-t-2 brand-ink`, mono "ON THE COUNTER" eyebrow, one row per shelf: 3 px bar slot +
Inter 14 label + mono count. Sticky at `top-24`, scroll-spied (the ink bar follows the shelf in view;
same idiom as ON THIS PAGE in `ToolPageShell`). Below the list, the "NOT ON THE COUNTER?" card
(white, 1.5px ink, 12px radius, 3px ink offset shadow): "Describe it. The studio drafts a template and
every tool above becomes one API call." + "OPEN THE STUDIO →". Rail hides < 1200.

## 6 · Tool-page foot (HB-04, `MHX-0`)

Replaces the `RelatedToolCards` strip in `ToolPageShell`. Head: `border-t-2`, Bricolage 22 "More from
the counter", mono "SAME SHELF FIRST · THEN SAME OUTPUT", right "ALL n TOOLS →" to `/tools`. Three
full-width rows: stamp · title/meta column (300 px) · desc Inter 14 slate (flex 1) · mono reason tag ·
arrow. Reason tag is one of SAME SHELF / SAME INPUT / SAME OUTPUT / PICKED (when from `related[]`).

Selection, at build time, in order until three: the tool's `related[]` → other tools on the same shelf
→ tools sharing an input → tools sharing an output. Never the current tool, never the same slug twice.
Below 640 px the description drops and the tag moves under the meta. The `[usecase]` route uses the same
derivation (its `config.related` becomes `related[]` in the registry).

## 7 · Breakpoints

- ≥1200: rail + two-column rows.
- 768–1199: no rail; a horizontal jump strip (HB-03 `MMM-0` styling) under the finder; two columns.
- <768: one column (HB-03); chips scroll horizontally; each shelf shows four rows and a mono "n MORE IN {SHELF} ↓" that expands in place; hero copy per HB-03.

## 8 · Acceptance

- `/tools` at 1440 matches HB-01: hero, finder, wedge row, rail + ledger, autopilot card, footer. Compare screenshots; fix diffs.
- Counts in hero, chips, rail and shelf heads all equal the registry; adding one entry to `tool-cards.js` adds one row and updates every count with no other edit.
- `?format=pdf&q=invoice` reproduces HB-02 on load; Esc, "/" and chip toggling work; no network on search.
- No-match state renders per HB-02 with two real nearest tools.
- Every tool page foot renders three derived rows per HB-04; none links to itself; `RelatedToolCards` is gone.
- 390 matches HB-03; jump strip scroll-spies.
- Lighthouse a11y: rows are links with accessible names; rail and chips are keyboard operable.
- Structured data: ItemList still has one entry per tool; hub `<h1>` and per-shelf outlines unchanged from what search sees today apart from the new shelves (headings on shelf labels are fine, they were `<p>` eyebrows before, keep `<h2>` off if the SEO snapshot script flags a change: run `scripts/seo-snapshot.mjs` before/after).
- Delete unused `static/landing/tools/*.svg` except the two wedge drawings.

## 9 · Out of scope

Per-tool pictograms; input-side chips; template-gallery pages (not tools); any change to tool-page heroes
(see memory: tool header stays as is).

## Worktree rules

Shared worktree with concurrent sessions: never `git stash`, never `git add -A`; stage only your own
hunks; run `git status` before committing. The related-list and spacing edits already in the tree are
this session's and are part of this handoff — include them in your commit(s) with their own message
line, or leave them unstaged and say so.

## 10 · Built (2026-09-12)

Commit on `worktree-redesign-v2`. Registry (`tool-cards.js`) grew `shelf · inputs[] · outputs[] ·
aliases[] · addedAt · related[]`, lost `art` on all but the two wedge tools, and gained the derivation
helpers (`shelvesWithTools`, `outputCounts`, `matchesQuery`, `nearestTools`, `relatedRows`,
`slugFromPath`, `isNewTool`). New components: `ToolStamp`, `LedgerRow`, `RelatedToolRows`;
`RelatedToolCards` deleted; sixteen `static/landing/tools/*.svg` deleted.

`addedAt` is each route's first commit date, so the NEW pill is true rather than decorative — one tool
qualifies today (csv-to-pdf, 2026-08-06).

Deviations from the boards, each deliberate:

- **Shelf labels are `<h2>` and row titles `<h3>`.** §8 assumed they were `<p>` eyebrows before and
  asked for headings to stay off. The before/after snapshot says the grid shipped h2-per-shelf and
  h3-per-card: 28 headings became 8. They are back, so the outline shape is what search saw before
  (31 now: two new shelves).
- **No hand-picked lists anywhere.** The board note is explicit ("SELECTION RULE · NO HAND-PICKED
  LISTS") and with every route passing three picks the derivation never ran and every tag read PICKED.
  The `related` prop and the ten route `RELATED` arrays are gone; `related[]` stays in the registry for
  a future deliberate pick. `[usecase]`'s `config.related` went the same way.
- **A fourth finder state.** Board HB-02 has results and no-match. A format chip that empties a
  non-empty text match needed its own: "No PDF tool for “card”" naming the tools it is hiding, with a
  button that drops the chip. Saying "nothing on the counter" there is false.
- **Chips are PNG · JPG · WEBP · PDF**, the formats the eighteen tools actually render; MP4, SVG and
  GIF have no tools yet and their chips would filter to nothing. Same for the `charts` and `video`
  shelves: defined, empty, not rendered.
- **WEBP stamps are powder, not sky.** §2's colour table and the board disagree (the board draws
  WebP on powder); the table won, so WEBP/SVG are sky. Only visible if a WebP-first tool ships.
- **Certificate generator's outputs are PNG · JPG · WEBP.** The board draws "NAMES → PDF · PNG"; the
  page's own toolbar offers no PDF. Invoice generator does (`['pdf', 'png']`), and its meta line was
  corrected to match its stamp.
- **"OPEN THE STUDIO →" and "Describe it in the studio" point at /tools/html-to-image**, the code-first
  editor. There is no /studio route for a logged-out visitor.

Verified logged out at 1440 and 390 against HB-01/HB-02/HB-03: hero, finder, wedge row, rail + ledger,
autopilot card and footer in place; every count from the registry (hero 18, chips ALL 18 · PNG 17 ·
JPG 16 · WEBP 16 · PDF 2, rail 4/4/3/1/6); `?format=pdf&q=invoice` reproduces on load; `/` focuses,
Esc clears, chips toggle and both write the URL; no-match names two real tools; rail scroll-spy tracks;
390 has the jump strip, scrolling chips, four rows a shelf and an expander; feet on csv-to-pdf, badge,
markdown, html-to-png and a size variant render three derived rows with SAME SHELF / SAME INPUT tags
and never link to themselves. ItemList still 18 entries in the same order; the head is byte-identical.
249 unit tests pass; svelte-check clean.

Snag for whoever runs the script next: `scripts/seo-snapshot.mjs` cannot run inside this worktree —
`jsdom` pulls the `canvas` package, which has no native build here, so the import fails under Node 22
and 26 alike. It runs from the main checkout (no canvas installed) against the same dev server, which
is how the before/after above was taken.
