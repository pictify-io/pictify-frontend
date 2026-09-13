# Handoff — Free tools hub page (design → implementation)

Date: 2026-08-22. Design is final and approved. This doc is the single source for the implementing session.

## Source of truth

- Paper file: **Pictify — Landing Redesign (Repro Shop)**, fileId `01KZQXXEZ2SNPWS5PN2FCF31PC`
  https://app.paper.design/file/01KZQXXEZ2SNPWS5PN2FCF31PC/1-0
- Board to implement: **"Tools hub — open counter"** — artboard `7K0-0` (1440 wide, fit-content height)
- Companion board (per-tool page, already designed): **"Tool page — csv to pdf"** — `7R7-0`. Not in this handoff's scope unless explicitly asked.
- Spec board "Art prompts — tools cards (superseded by inline SVG)" `833-0` — reference only; the image-generation prompts on it are dead. Do NOT generate images.

Export values with `get_jsx` / `get_computed_styles` on the nodes below. Never eyeball from screenshots.

## Target in codebase

- Route: `src/routes/tools/+page.svelte` (current page is the old icon-grid hub; replace its markup with the v2 layout, keep the route and any SEO `<svelte:head>`/schema the page already has).
- Reuse redesign-v2 shell pieces where they already exist on the `redesign-v2` worktree (Nav, Footer, riso tokens in `DESIGN.md` / tailwind). Check that worktree first; if this work lands on `master`, port the tokens you need rather than the whole shell.
- Per-tool routes already exist under `src/routes/tools/*` — cards link to them (see mapping).

## Board structure (node IDs)

```
7K0-0  Tools hub — open counter
  7K2-0  Nav (1440×88)
  7KK-0  Hero (field/chartreuse ground) — eyebrow 7KL-0, H1 7KM-0 "Free tools", sub 7KN-0, decorative pills 7QY-0/7QZ-0/7R0-0, CMYK dots 7R2-0
  7L4-0  Wedge row (2 featured cards)
    7L5-0  CSV to PDF  — text 7L6-0, art pane 81D-0 → SVG "Art — CSV to PDF" 8CZ-0 (190×195)
    7LI-0  Certificate generator — text 7LJ-0, art pane 830-0 → SVG "Art — Certificate" 8DT-0 (190×195)
  7LW-0  Section "MARKUP → IMAGE"   grid 7X2-0
  7MK-0  Section "SOCIAL & OG"      grid 7YI-0
  7N7-0  Section "CAPTURE & DOCUMENTS" grid 7ZX-0
  7NU-0  Section "WIDGETS & CARDS"  grid 82A-0
  7OH-0  CTA card "This, but on autopilot." (7OI-0)
  7PP-0  Footer (7PR-0 inner, 7QV-0 wordmark bleed)
```

Category card anatomy (288×183): art strip frame (286×116, SVG inside) + text block (286×65: title 22px + mono meta 12px).

## Tool → card → art SVG → route

| Section | Card node | Title | Meta line | Art SVG node | Route |
|---|---|---|---|---|---|
| Wedge | 7L5-0 | CSV to PDF (badge MOST USED) | CSV → PDF | 8CZ-0 | /tools/csv-to-pdf |
| Wedge | 7LI-0 | Certificate generator (badge BATCH READY) | NAMES → CERTIFICATES | 8DT-0 | /tools/certificate-generator |
| Markup | 7X3-0 | HTML to image | HTML → PNG · JPG · WEBP | 83V-0 | /tools/html-to-image |
| Markup | 7XI-0 | Code to image | SNIPPET → PNG | 84G-0 | /tools/code-to-image |
| Markup | 7XV-0 | Markdown to image | MD → PNG | 855-0 | /tools/markdown |
| Markup | 7Y7-0 | Table to image | CSV · HTML → PNG | 85V-0 | /tools/table |
| Social | 7YJ-0 | OG image generator | TITLE · LOGO → 1200×630 | 86O-0 | /tools/og-image-generator |
| Social | 7YU-0 | Tweet screenshot | TWEET URL → PNG | 86Z-0 | /tools/tweet-screenshot |
| Social | 7Z7-0 | LinkedIn banner | TEMPLATE → 1584×396 | 886-0 | /tools/linkedin-banner-generator |
| Social | 7ZK-0 | Social proof card | REVIEW → PNG | 87Q-0 | /tools/[usecase] (social-proof) — verify slug in `src/lib/pseo/config.js` |
| Capture | 7ZY-0 | URL to image | ANY URL → SCREENSHOT | 88J-0 | /tools/url-to-image-generator |
| Capture | 80A-0 | Invoice generator | LINE ITEMS → PNG | 891-0 | /tools/online-invoice-generator |
| Capture | 80M-0 | Email header | TEXT · BRAND → PNG | 89M-0 | /tools/[usecase] — verify slug |
| Capture | 80X-0 | Barcode & QR | VALUE → PNG | 89Y-0 | /tools/[usecase] — verify slug |
| Widgets | 82B-0 | Badge maker | TEXT → PNG | 8EC-0 | /tools/[usecase] — verify slug |
| Widgets | 82H-0 | Leaderboard | ROWS → PNG | 8BJ-0 | /tools/[usecase] — verify slug |
| Widgets | 82N-0 | Membership card | MEMBER → PNG | 8C8-0 | /tools/[usecase] — verify slug |
| Widgets | 82T-0 | Portfolio card | PROFILE → PNG | 8CK-0 | /tools/[usecase] — verify slug |

For "verify slug" rows: check `useCases` in `src/lib/pseo/config.js`. If a tool has no live route yet, still render the card but link to the closest existing page or `/signup` — do not drop the card (the grid is 4×4 by design).

## Art assets — how to ship

1. Export each `Art — …` SVG node (ids above) with `get_jsx` (or Paper's export) and save as `static/landing/tools/<slug>.svg`. Strips are `286×116`, wedges `190×195`; keep those viewBoxes.
2. Render with `<img src="/landing/tools/<slug>.svg" alt="" aria-hidden="true">` inside the art strip, `object-fit: cover`, top corners clipped by the card's `border-radius`. Inline `<svg>` is also fine if you want token-driven fills; the files use literal hex that equal the tokens.
3. Art rules (if you must tweak/add one): fills only from tokens — blue `#0078BF`, royal `#0054A6`, powder `#D3E7F6`, sky `#A9D7F2`, pink `#FF48B0`, rose `#FFD3E8`, field `#D8F34A`, subtle `#F4F6F4`, ink `#000`, mute `#8A8A85`, white. 2px ink outlines. 4px hard offset ink shadow on the main object. One flat ground colour per card from {powder, rose, subtle, field}. No letters/text inside art (the `#`/`##` glyphs in Markdown are the only exception).
4. (Resolved 2026-08-22: the interim placeholders lived only in the Paper asset library; nothing to delete in the repo.)

## Visual system (read from tokens, not from this list)

Paper design tokens are the canonical values (`get_basic_info` → tokens). Key ones: display font Bricolage Grotesque, body Inter, mono JetBrains Mono; `--color-field` hero ground; `--color-canvas #E2E4DD` page ground; `--radius-card 16px`; card border 2px ink; featured wedge cards carry a 4px offset shadow in blue (CSV) / pink (Certificate).

## Behaviour / acceptance

- Hero: eyebrow "OPEN COUNTER · NO SIGNUP", H1 "Free tools", sub copy as on the board. No form in the hero.
- Two featured wedge cards, then four labelled 4-up sections, then the CTA card, then the footer. Section labels are mono 12px uppercase with the arrow.
- Cards are whole-card links (`<a>` wrapping), keyboard focus ring visible, hover = shadow offset grows 2px (match the landing v2 card hover already in the codebase).
- Responsive: ≥1200 4-up, 768–1199 2-up, <768 1-up; wedge cards stack and the art pane moves to the top at 100% width (art `object-fit: cover`, 140px tall).
- CTA card buttons: "Start rendering" → /signup, "Read the docs" → docs URL used elsewhere in landing v2.
- Keep existing JSON-LD / meta on the route; update `<title>`/description only if the page copy changed.
- Screenshot the built page at 1440 and compare against artboard `7K0-0`; fix diffs before calling it done.

## Out of scope

Per-tool page redesign (board `7R7-0`), Sanity-hosted art, mobile artboard (none exists for this page — derive from the rules above).
