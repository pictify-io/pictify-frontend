# Handoff — Individual tool page v2 (SEO-safe redesign + PLG)

Date: 2026-08-22. Design approved. Implement after the Free tools hub (`plans/handoff-free-tools-page-2026-08-22.md`) — they share nav/footer/tokens.

## Non-negotiable: SEO copy is frozen

These pages already rank (html-to-image 18k/mo). Do **not** change:
- `<h1>` text, every `<h2>`/`<h3>` text and order, FAQ questions + answers, body paragraphs
- `<svelte:head>` title/description, canonical, JSON-LD (FAQPage, SoftwareApplication, etc.)
- URL structure, internal links to other tools/formats

Everything below is layout, hierarchy, components and CTA surfaces. Where the Paper board shows shortened body copy, that is a *placeholder for layout* — pour the existing copy from the route into the new layout unchanged. If a board section text differs from the live page's text, the live page wins.

## Source of truth (Paper)

File: **Pictify — Landing Redesign (Repro Shop)**, fileId `01KZQXXEZ2SNPWS5PN2FCF31PC`
https://app.paper.design/file/01KZQXXEZ2SNPWS5PN2FCF31PC/1-0

| Board | Node | Purpose |
|---|---|---|
| Tool page v2 — html to png (SEO template) | `8EP-0` | Full-page layout, the template for every tool route |
| Tool page v2 — PLG states | `8R0-0` | Toolbar quota ladder (A) + result card ×3 (B1 guest / B2 last free / B3 logged in) with behaviour notes |
| Tool page — csv to pdf | `7R7-0` | Short-form variant (tools with little SEO copy) — same system |

Read values with `get_jsx` / `get_computed_styles`. Tokens via `get_basic_info`.

### Node map — `8EP-0`
```
8JV-0  Nav
8JL-0  Hero (field ground): breadcrumb 8JR-0, H1 8JQ-0, sub 8JP-0, mono facts 8JO-0
8I9-0  Tool card  (1200, ink border, 6px ink shadow, radius 16)
  8IM-0   body: Editor 8KF-0 (778×340, press bg; tabs 8KG-0, code 8KN-0) + Live preview 8KQ-0 (420)
  8IA-0   toolbar: format pills 8IF-0 (+ Size 8LB-0), Quota meter 8L2-0, Generate 8IC-0
8HX-0  Result card (proof-green border) — see PLG states board for 3 states
8H9-0  "Automate it in one request": copy 8HR-0 + tabbed code 8HA-0
8LN-0  Long-form: Reading column 8LO-0 (760) + Sticky rail 8LP-0 (360; TOC 8PF-0, signup card 8QF-0)
  8LR-0 01 Key Features · 8M9-0 02 Choosing the Right Format (table) · 8MZ-0 03 How to Convert
  8NP-0 04 Best Practices · 8O7-0 05 FAQ · 8OR-0 06–09 two-up prose (Why Choose / vs Others / Use Cases / Tech Specs)
8FZ-0  More from the counter (3 related tools, art-strip cards 8TX-0 reusing hub SVGs)
8W1-0  Closing CTA band (blue): headline + "Start rendering free" + Guest-vs-Free-account strip 8WB-0 + live stat
8ER-0  Footer
```

## Target routes

Primary: `src/routes/tools/html-to-[format]/+page.svelte` (2.4k lines — most of it is the 11 boxed SEO sections; they become reading-column sections).
Then apply the same shell to: `tools/[usecase]`, `tools/csv-to-pdf`, `code-to-image`, `og-image-generator`, `tweet-screenshot`, `linkedin-banner-generator`, `online-invoice-generator`, `url-to-image-generator`, `certificate-generator`.

Recommended: build a `ToolPageShell.svelte` (hero · tool slot · result slot · automate slot · long-form with rail · related · footer) and migrate routes one at a time. Keep each route's existing `<svelte:head>` block verbatim.

## Two long-form modes (pick by H2 count)

Only `html-to-[format]` is content-heavy (14 H2s). Every other tool route has 2–5 H2s (`[usecase]`/csv-to-pdf 5, certificate/tweet 4, invoice 3, code/url/og/linkedin 2). So the shell has two long-form modes, same components:
- **rail mode** (≥6 H2s) — board `8EP-0`: 760px reading column + 360px sticky rail with TOC + signup card.
- **column mode** (≤5 H2s) — board `7R7-0`: single 760px column, no TOC, signup card rendered once inline after the "Automate" section. Closing CTA band and art-strip related tools still apply.
Expose it as a `longform="rail" | "column"` prop on `ToolPageShell`; default by counting sections passed in.

## Layout rules

- Page ground `--color-canvas`; hero on `--color-field` with breadcrumb `TOOLS / <TOOL>` mono 12px, H1 50/56 Bricolage 700, sub Inter 18/27 max 640px, mono facts line.
- Tool card sits 40px below the hero (no overlap), 1200 wide. Editor = dark pane (`--color-press`) with file tabs; preview = `--color-subtle` pane with 2px ink left rule, render thumbnail with 4px ink shadow.
- Toolbar: format pills (ink pill = active), size input + scale, quota meter, Generate (ink, 2px pink shadow).
- Result card only renders after first generation; green border; three states (below).
- "Automate it in one request" directly under result card — keep existing `ApiCodeSection` content, restyle to board (curl/node/python tabs, ink code pane, "Get your API key" button w/ pink shadow).
- Long-form: 760px reading column + 360px sticky rail (`position: sticky; top: 96px`). Sections use numbered mono index (`01`) + H2 32/42. Section 01 top rule 2px ink, others 1px `--color-rule`. "How to Convert" steps get a `JUMP TO EDITOR ↑` anchor to `#input`.
- Sections 06–09 (Why Choose / vs Others / Use Cases / Technical Specs) render two-up with H2 at 24px — still real `<h2>` elements.
- Related tools: 3 art-strip cards (384 wide, SVG from `static/landing/tools/<slug>.svg` scaled to 384×156, title + mono meta). Pick tools relevant to the route (html-to-*: Table to image, Code to image, OG image generator). These are also internal links — keep the existing `RelatedTools` link set in the footer area for SEO.
- Closing CTA band (after related tools, before footer): full-width `--color-blue`, H2-sized headline "Same press. Fifty a month. Your renders kept." (this is marketing copy, not an SEO heading — render as `<p>`/`<div>`, NOT `<h2>`, so the heading outline stays identical), "Start rendering free" (cta_location `closing_band`), then a 3-cell strip: HERE AS A GUEST / FREE ACCOUNT (field ground) / PRESSED THIS MONTH stat. The stat must be a real number from the backend (monthly render count across tools + API, cached hourly); if no endpoint exists, hide the third cell rather than fake it.
- Responsive: <1200 rail collapses under the tool card as a single signup card; TOC becomes a horizontal scroll chip row under the hero; <900 editor/preview stack (preview first on mobile? no — editor first, preview collapsible "Preview" toggle); section two-ups go single column.

## PLG spec (board `8R0-0`)

One CTA voice everywhere: **"50 renders a month. No card."** Signup links always `/signup?redirect=<current tool path>` and the user lands back on the tool (B3 state).

### A · Quota ladder (guest)
| Renders left | Toolbar | Button |
|---|---|---|
| 5–3 | 5 filled squares + `N FREE TODAY · NO WATERMARK` | Generate |
| 2–1 | squares + `N LEFT TODAY` + field chip `SIGN UP → 50/MO` (link, cta_location `toolbar_chip`) | Generate |
| 0 | empty squares + `0 LEFT · RESETS 00:00 UTC` | Generate is **replaced** by blue "Sign up · keep rendering / 50/MO FREE · NO CARD" (cta_location `toolbar_limit`) |

Never blur, watermark, or hide a completed render. `GenerationLimitBanner` is retired (its logic moves here). Keep `GUEST_DAILY_LIMIT` source of truth.

### B · Result card
- **B1 guest, renders left** — Download (green, ungated) · `COPY API REQUEST` (copies curl with `$PICTIFY_KEY` placeholder, then inline toast "Paste your key — get one free →" linking signup; cta_location `result_card_api`) · `SAVE AS TEMPLATE` (writes `NextSteps.templateDraft` shape to localStorage, then `/signup?redirect=…&draft=1`; cta_location `result_card_template`). Shareable link shown inline (existing `ShareResultButton` logic).
- **B2 guest, last free render used** — headline "Pressed — and that was your last free one today." Primary = blue "Sign up · keep rendering" (cta_location `result_card_limit`), Download demoted to outlined secondary, three mono chips NO WATERMARK / API KEY INCLUDED / KEEPS THIS RENDER. This state replaces `StickySignupBar`: keep the PostHog flag `tool-sticky-signup-bar` but its `sticky-bar` arm now renders this card variant, so existing experiment reads stay comparable.
- **B3 logged in / just signed up** — headline "Your PNG is pressed. Saved to your renders.", monthly counter, inline curl with the real API key (reuse `PostSignupWelcome` key fetch — then delete that component), `SAVE AS TEMPLATE` creates directly, `OPEN IN STUDIO` deep-links the template editor with this HTML. Rail signup card hidden in this state; TOC stays.

### Rail signup card
Heading "50 renders a month. No card.", three proof rows, button "Start rendering free" (cta_location `rail_card`), footnote "COMES BACK TO THIS PAGE AFTER SIGNUP". Hidden when logged in.

### Reference grounding (Refero, 2026-08-22)
Benchmarked against Grammarly paraphrasing-tool + grammar-check, Clipchamp GIF maker, Coolors font generator, Artboard Studio mockup generator, Base44 usage-limit state, Tella tools hub. Patterns adopted: tool-as-hero with quiet surroundings; conversion CTA living inside the tool surface (Grammarly); inline non-blocking limit state (Base44); closing full-width CTA band with social proof (Grammarly/Clipchamp); free-vs-account comparison on the tool page (Grammarly); illustrated related tools (Grammarly/Artboard). Patterns rejected: modal paywalls, blurred results, sticky bottom bars.

### Analytics
Keep `analytics.track('tool_signup_click', { tool_name, cta_location })` and add the new locations: `toolbar_chip`, `toolbar_limit`, `result_card_api`, `result_card_template`, `result_card_limit`, `rail_card`, `closing_band`, `automate_section` (rename of `api_code_section` — or keep the old key; don't double-fire). Fire `tool_generate` with `remaining_before` so the ladder can be analysed.

## Acceptance
- Run the live page and the new page through a diff of extracted text (`innerText` of `main`) — headings and FAQ must be identical; only CTA strings may differ.
- Lighthouse SEO ≥ current; no CLS from the result card appearing (reserve height or animate in below the toolbar).
- Screenshot at 1440 vs board `8EP-0`; state screenshots vs `8R0-0`.
- Guest flow manually: 5 renders → chip at 2 → button swap at 0 → signup → lands back with B3 card and key.

## Out of scope
Mobile artboard (derive from rules above), per-tool illustration art, changing copy for AEO (separate `/writing-aeo-content` pass later).

## Implementation notes (agreed 2026-08-22)
- "Automate with the API" keeps its live H2 text and its live position (inside the reading column after 01 Key Features). The board's placement above the column and its "Automate it in one request" wording are superseded by the frozen-copy rule.
- "More from the counter" renders as a `<p>`, not an `<h2>`.
- Copy checks use `textContent`, not `innerText` (v1 uppercases headings via CSS).
- The one intentionally dropped heading is the v1 window-chrome H3 "_ SYSTEM_CONFIG".
- Closing-band render-count cell stays hidden until a public monthly-count endpoint exists in pictify-io/html-to-gif.
- Known external blocker: media.pictify.io returns `access-control-allow-origin: *, *`; fix at the CDN/worker, not in the frontend.
- Copy constraint (2026-08-22): no email-delivery / "emailed per recipient" language in any v2 copy, including result cards, rail cards and closing bands. Batch + shareable link is the furthest the copy goes.
