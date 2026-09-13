# Handoff — Tool page consistency: one long-form system for all ten routes

Date: 2026-09-04. Branch: `worktree-redesign-v2` (worktree at `.claude/worktrees/redesign-v2`). Supersedes the long-form half of `plans/handoff-tool-page-v2-2026-08-22.md`; the PLG/quota/result-card half of that doc still stands and is already shipped on every route.

## Why

All ten `/tools/*` routes sit on `ToolPageShell` (hero, tool card, result card, related cards, closing band), but only `html-to-[format]` (`/tools/html-to-jpg`, `-png`, `-webp`, `-image`) uses the v2 long-form system underneath. The other nine each hand-roll their SEO content with their own heading classes, section wrappers, FAQ markup and `<head>` mechanism. Reading down any two tool pages side by side, the top third matches and everything below the result card doesn't.

**`html-to-[format]` is the reference.** Every other route must read like it. The way to get there is not nine more hand-migrations: it is a small set of shared long-form components that own all styling, so a route only supplies copy and data.

## Non-negotiables (carried over)

- Heading **text** and **order**, FAQ Q+A text, body copy, `<title>`, meta description, canonical, and every internal link href + anchor text are frozen. See "Deliberate outline changes" for the four exceptions this doc authorises.
- No email-delivery / "emailed per recipient" copy anywhere.
- Never blur, watermark, or gate a completed render.
- Analytics `cta_location` keys stay as they are (`api_code_section`, `rail_card`, `closing_band`, `related_tool_click`, …).

## Audit — what is inconsistent today (2026-09-04, redesign-v2 @ 5076ee6)

| Route | Long-form build | FAQ | API block | Head | Internal-link block |
|---|---|---|---|---|---|
| `html-to-[format]` **(reference)** | 13 × `LongformSection`, `longform="rail"`, `toc` 8 items | raw `<details>` inside section 07 | `AutomateSection` *inside* the reading column after 01 | raw `<svelte:head>` + 2 hand-rolled JSON-LD | none (has "Try Other Formats" section instead) |
| `[usecase]` | 0 × LongformSection; `<section class="py-20">` + `h2 text-3xl md:text-5xl`, hand-rolled step cards with `border-[3px] border-gray-900` | raw `<details>` from `config.faqs` | hand-rolled "dark Mac window" CTA, no snippet | raw head, 3 JSON-LD | pill links inside long-form |
| `certificate-generator` | 0; one banner `<h2>LEARN MORE ABOUT CERTIFICATES</h2>` then 7 boxed `<section bg-brand-paper border p-10>` with `<h3>` | raw `<details>` | `AutomateSection` in `automate` slot | raw head, 5 JSON-LD incl. ItemList | `RelatedTools` (v1 brutalist) |
| `code-to-image` | 0; banner `<h2>LEARN MORE ABOUT CODE TO IMAGE</h2>` then 8 boxed sections with `<h3>` | raw `<details>` ×5 (+1 inside tool card) | `AutomateSection` | `SEOHead` (`$lib/seo`) | `RelatedTools` + a second pill list |
| `csv-to-pdf` | 2 × LongformSection (28px h2 variant) | raw `<details>` | **none** | raw head | `RelatedTools` |
| `linkedin-banner-generator` | 2 × LongformSection + trailing `ApiPromptSection` | **none** | `AutomateSection` **and** `ApiPromptSection` | raw head, no FAQPage | `RelatedTools` |
| `og-image-generator` | 1 × LongformSection, then `ApiPromptSection`, a two-up `<h3>` block, `h2 text-3xl` FAQ | raw `<details>` ×3 | `AutomateSection` **and** `ApiPromptSection` | `SEOHead` | `RelatedTools` |
| `online-invoice-generator` | 1 × LongformSection, then `<h2>LEARN MORE ABOUT INVOICING</h2>` (`md:text-5xl`) + 4 boxed `<h3>` sections | raw `<details>` | `AutomateSection` | raw head | `RelatedTools` |
| `tweet-screenshot` | 1 × LongformSection holding 5 inline `<h3>` | `ToolFaq` (scaffold; emits its own 28px h2) | `AutomateSection` | `ToolSeoHead` (scaffold) — the only one | `RelatedTools` |
| `url-to-image-generator` | 0; 5 × `<section max-w-5xl>` with centred `h2 text-3xl` | raw `<details>` ×4 | `AutomateSection` + a hand-rolled dark `<pre>` curl block | `SEOHead` | none |

Other findings that the spec resolves:

- Three `<head>` mechanisms in play: raw `<svelte:head>` (6 routes), `$lib/seo/SEOHead.svelte` (3), `scaffold/ToolSeoHead.svelte` (1). FAQ copy is duplicated between the visible accordion and the FAQPage JSON-LD on every route that has both, so they can drift.
- `RelatedTools.svelte` is v1 chrome (`border-t-[3px] border-gray-900`, `font-black uppercase`, `shadow-brutal-lg`) and renders on 7 routes **directly under** the v2 "More from the counter" art cards, so those pages show two related-tools blocks in two design languages.
- Each route keeps its own `const RELATED = [{title, meta, href, art}]`, duplicating strings that also live in the hub's `wedge`/`sections` arrays in `src/routes/tools/+page.svelte`.
- Even the reference page has three checklist styles (pink stroke check, ink-box check, square bullet) and repeats the 32px h2 class string 13 times through `slot="heading"` instead of using `LongformSection`'s `title` prop.
- Tool cards on `certificate-generator` (3), `csv-to-pdf` (3) and `online-invoice-generator` (1) emit `<h2>` for chrome labels ("_ INVOICE DETAILS", step names). The reference tool card emits no headings.
- Dead files: `NextSteps.svelte`, `ShareResultButton.svelte`, `ApiCodeSection.svelte`, `scaffold/ToolBreadcrumb.svelte` (zero imports). `TemplateGallery.svelte` is only used by `[usecase]`.
- Brutalist residue in tool cards: `og-image-generator` 7 × `border-[3px]`, `certificate-generator` 2, `online-invoice-generator` 1, `[usecase]` 1 (+ `border-[4px] border-gray-900` in its not-found state).

## Canonical page anatomy (what every route renders, top to bottom)

```
ToolPageShell
  hero            breadcrumb · <h1> · sub · mono facts line        (shell)
  tool            <ToolCard> …editor/preview… toolbar: QuotaMeter + GenerateButton
  result          <ResultCard>                                       (only when hasResult)
  automate        <AutomateSection>                                  (all routes except html-to-[format], see D3)
  longform        <LongformSection 01 …> … <LongformSection NN …>    numbered, ids match toc
                    section bodies built ONLY from the primitives below
  rail / inline   TOC + RailSignupCard                               (shell; rail when toc ≥ 6)
  related         "More from the counter" + 3 art cards              (shell, from related slugs)
  footer-links    <RelatedLinks>                                     (v2 replacement for RelatedTools)
  ClosingBand · Footer                                               (shell)
```

Rules the shell and primitives enforce, so routes cannot drift:

- **Headings.** `<h1>` only in the hero. Every long-form section title is an `<h2>` rendered by `LongformSection` (32/42 display; 24/30 when `compact`). Sub-points inside a section are `<h3>` 18/24 sans medium via `ProseGroup`. Nothing in the tool card, result card, automate block or shell emits a heading; chrome labels are `<p class="font-mono text-xs tracking-[0.06em]">`.
- **No page-level wrappers in routes.** No `max-w-5xl mx-auto`, `py-20`, `text-center`, boxed `<section bg-brand-paper border p-10>`. The reading column is the shell's; a section is `LongformSection` and nothing else.
- **One body type scale.** Body `font-sans text-[15px] leading-[23px] text-brand-slate`; lead paragraph `text-lg leading-[27px] text-brand-ink`. Owned by the primitives.
- **One checklist style** (ink box check, the reference's "Best Practices" section 08). The pink stroke check and the square bullet go.
- **Numbering** is `01`, `02` … in reading order, `first` on 01. The `AutomateSection` is not numbered and does not appear in the TOC.
- **Two long-form modes** stay: `rail` (toc ≥ 6) and `column`. Both use identical primitives; only the aside differs.

## Components to build

All new files under `src/lib/components/tools/v2/longform/`. Each is presentational, takes data, emits the frozen text verbatim. Class strings live here and nowhere else.

| Component | Props | Renders | Replaces |
|---|---|---|---|
| `LongformSection` (exists, move here) | `index, id, title, first, compact` + `heading` slot for inline markup only | numbered `<section>` + `<h2>` | the 13 repeated `slot="heading"` h2s on the reference; every hand-rolled `<section>` elsewhere |
| `LongformPair` | slot | two-up grid (`min-[900px]:grid-cols-2 gap-10`) for `compact` sections; single column below | the reference's `<div class="flex flex-col gap-10">` around 10–13 |
| `Lead` | slot | lead paragraph 18/27 ink | ad-hoc `<p class="text-lg …">` intros |
| `Prose` | slot | body paragraphs + inline links (`a` underline ink) | ad-hoc `<p class="text-brand-slate font-bold leading-relaxed">` |
| `ProseGroup` | `items: [{ heading, body?, bullets? }]` | stack of `<h3>` + `<p>` / `<ul>` | reference 10–13 bodies; cert/code/invoice `<h3>` sections that become subsections |
| `FeatureGrid` | `items: [{ title, body? }]`, `columns=3` | numbered tiles, `bg-brand-subtle border border-brand-ink p-6` | reference 01 Key Features; "Benefits" sections on cert/code/invoice/url |
| `StepCards` | `steps: [{ title, body }]`, `jumpTo='#input'` | numbered cards + `JUMP TO EDITOR ↑` mono link | reference 05; `[usecase]` workflow; cert "6 Steps"; code/invoice "How to Use"; linkedin 01 |
| `CheckList` | `items: string[]` | ink-box check list | reference 06/08/09 (three styles → one); url "Pro Tips" |
| `ComparisonTable` | `columns: string[]`, `rows: string[][]`, `highlightRow?` | table on hairline rules, highlighted row `bg-brand-field/30` | reference 02 + 11; code-to-image "Code Screenshot Tools Compared"; cert "vs" card grid |
| `FaqList` | `faqs: [{ q, a }]` | `<details>` accordion, **no heading** (the section h2 is `LongformSection`'s) | raw `<details>` on 8 routes and `scaffold/ToolFaq` (delete it) |
| `RelatedLinks` | `links: [{ href, label }]` | `border-t border-brand-rule` + eyebrow `<p>ALSO ON THE COUNTER</p>` + inline mono links | `RelatedTools.svelte` (delete it), the pill lists on `[usecase]` and `code-to-image` |
| `HeroTitle` / `HeroSub` | slot | the h1 / sub classes from the reference hero | the h1 + sub class strings repeated in every route (`<HeroTitle slot="h1">`) |

The FAQ and steps data passed to `FaqList` / `StepCards` **must be the same constant** passed to `ToolSeoHead` (`faqs`, `howToSteps`), so the visible accordion and the FAQPage/HowTo JSON-LD cannot drift.

### `ToolSeoHead` becomes the only head

Standardise on `src/lib/components/tools/scaffold/ToolSeoHead.svelte` (move it to `v2/`). Reasons: it already builds FAQPage, HowTo and BreadcrumbList from data, it is opt-in per tag so nothing gets silently added, and it is the one head that takes the FAQ constant directly. Add what the migration needs:

- `extraSchemas: object[]` — for schemas it does not build (cert's ItemList of templates, og-image's rich WebApplication graph). Passed through verbatim.
- `webApplicationSchema` stays "pass the whole object" so each route's existing WebApplication block is emitted byte-identically.

Delete `$lib/seo/SEOHead.svelte` usage from the three tool routes (leave the component for non-tool pages). Delete the six raw `<svelte:head>` blocks once their output is verified identical (see Acceptance).

### Shared tool-card registry

New `src/lib/pseo/tool-cards.js`:

```js
export const TOOL_CARDS = {
  'html-to-image':  { title: 'HTML to image', meta: 'HTML → PNG · JPG · WEBP', href: '/tools/html-to-image', art: '/landing/tools/html-to-image.svg', desc: '…' },
  'code-to-image':  { … },
  // one entry per hub card (18 today, see static/landing/tools/*.svg)
};
```

- `ToolPageShell` `related` prop accepts slugs (`related={['table-to-image','code-to-image','og-image-generator']}`) and resolves through the registry; the object form keeps working during migration.
- `src/routes/tools/+page.svelte` `wedge` / `sections` reference the registry by slug; its `ItemList` JSON-LD reads `desc` from there. Title/meta/art strings exist once.

## Per-route migration

Every route: swap head to `ToolSeoHead`; wrap `<h1>`/sub in `HeroTitle`/`HeroSub`; rebuild long-form from the primitives; move `RELATED` to slugs; replace `RelatedTools` with `RelatedLinks` (same hrefs, same anchor text); demote tool-card headings to `<p>`; strip the brutalist residue listed in the audit. Then the route-specific notes:

| Route | Sections (`01`…) | Notes |
|---|---|---|
| `html-to-[format]` | keep the 13 as they are; switch the 12 plain-text headings to `title=` (keep the `heading` slot only for the two with `{#if hasSize}` interpolation, or move that into `title` as a template string); 06/08/09 → `CheckList`; 01 → `FeatureGrid`; 05 → `StepCards`; 02/11 → `ComparisonTable`; 07 → `FaqList`; 10–13 → `ProseGroup` inside `LongformPair` | Head: replace raw `<svelte:head>` with `ToolSeoHead` (WebApplication object passed through; its nested `mainEntity` HowTo/FAQPage stays inside that object). `AutomateSection` stays inside the column after 01 (D3). |
| `[usecase]` | 01 Why teams choose this workflow (`Lead` + `Prose`) · 02 Problems Solved (`ProseGroup` from `painPoints`) · 03 Step-by-step workflow (`StepCards` from `config.workflow`) · 04 Frequently Asked Questions (`FaqList` from `config.faqs`) · "Related Workflows" `<h3>` block → `RelatedLinks` from `config.related` | The hand-rolled "Automate with API" h2 section becomes the real `AutomateSection` in the `automate` slot with a snippet built from the use case's template (there is an h2 "Automate with API" today; `AutomateSection` renders "Automate with the API" — accept this one-word change, D5). Kill the `border-[3px] border-gray-900` step cards and the `border-[4px]` not-found box. `TemplateGallery` stays (tool card, not long-form). This is the data-driven route, so it is the proof that the primitives are sufficient: migrate it **first**. |
| `certificate-generator` | 01 What is a Certificate Generator? · 02 Why Use Our Certificate Generator? (`FeatureGrid`) · 03 How to Make a Certificate Online in 6 Steps (`StepCards`) · 04 Bulk Certificate Generator for Events: Delivered, Not Downloaded (`Prose`) · 05 Frequently Asked Questions (`FaqList`) · 06 Certificate Templates: Choose from 5 Free Designs · 07 Use Our Online Certificate Maker for Free · 08 Need Them Delivered, Not Just Downloaded? — 06–08 `compact` in `LongformPair` | Drop the `LEARN MORE ABOUT CERTIFICATES` banner h2 (D1). Sections 04 and 08 say "Delivered": check both against the no-email-delivery rule and cut any "emailed" wording (heading text stays). Head: keep the ItemList via `extraSchemas`. toc = 8 → rail mode. |
| `code-to-image` | 01 Code Screenshot Tools Compared (`ComparisonTable`) · 02 What is a Code to Image Generator? · 03 Benefits of Using Our Code to Image Generator (`FeatureGrid`) · 04 How to Use Our Code to Image Generator (`StepCards`) · 05 Real-World Use Cases · 06 Best Practices for Creating Code Images (`CheckList`) · 07 Frequently Asked Questions (`FaqList`) · 08 Supported Programming Languages | Drop the `LEARN MORE ABOUT CODE TO IMAGE` banner h2 (D1). The `<details>` inside the tool card stays (it is UI, not FAQ). Merge the two footer link lists into one `RelatedLinks` with the union of hrefs. Delete the tweet-intent share function. toc = 8 → rail. |
| `csv-to-pdf` | 01 A CSV to PDF converter that understands rows are people · 02 Frequently Asked Questions (`FaqList`) | Fix the 28px h2 variant to the standard 32px by using `title=`. Add `AutomateSection` in the `automate` slot with the multi-page PDF call (D3). Tool-card step `<h2>`s → `<p>`. |
| `linkedin-banner-generator` | 01 How to Add Your Banner to LinkedIn (`StepCards`) · 02 LinkedIn Banner Size Guide (`ComparisonTable`) | Delete `ApiPromptSection` (D4). No FAQ exists; do not add one (copy scope). |
| `og-image-generator` | 01 Templates for {platform} / Choose Template · 02 FAQ (`FaqList`) — the two-up `<h3>` block ("Why Use This Tool?" etc.) becomes `ProseGroup` inside 01 or its own `compact` 02 with FAQ as 03; keep the live heading order | Delete `ApiPromptSection` (D4). Strip 7 × `border-[3px]` in the editor. Head: `SEOHead` → `ToolSeoHead`, rich WebApplication graph via `webApplicationSchema`. Applies to `[platform]` sub-routes too. |
| `online-invoice-generator` | 01 INVOICE TEMPLATES (existing) · 02 What is an Online Invoice Generator? · 03 Benefits of Using Our Invoice Generator (`FeatureGrid`) · 04 How to Use Our Invoice Generator (`StepCards`) · 05 Frequently Asked Questions (`FaqList`) | Drop the `LEARN MORE ABOUT INVOICING` banner h2 (D1). Tool-card `_ INVOICE DETAILS` h2 → `<p>`. Delete the tweet-intent share function. |
| `tweet-screenshot` | 01 The fastest way to screenshot a tweet (`ProseGroup` for its 5 `<h3>`s) · 02 Frequently asked questions (`FaqList`) | Already on `ToolSeoHead`; replace `ToolFaq` with `LongformSection 02` + `FaqList` so the heading is rendered by the section, not the FAQ component. |
| `url-to-image-generator` | 01 What You Can Build (`FeatureGrid`) · 02 Why Use This Tool? / Pro Tips (`ProseGroup` + `CheckList`, `compact` pair) · 03 Comparing Screenshot APIs? (`RelatedLinks`-style link grid inside the section, hrefs frozen) · 04 FAQ (`FaqList`) — today "Why Use This Tool?" and "Pro Tips" are `<h3>`; keep them `<h3>` inside 01 if the outline must not change, otherwise promote (D1) | Delete the hand-rolled dark `<pre>` curl block; the `AutomateSection` already carries the live snippet — if the live URL interpolation matters, pass it into `AutomateSection`'s `codeExamples`. Add a `RelatedLinks` block only if it reuses links already on the page (no new links). |

## Deliberate outline changes (need the user's sign-off before merge)

- **D1 — Promote section `<h3>`s to `<h2>` on cert / code / invoice / url and delete the `LEARN MORE ABOUT …` banner h2s.** Text and order stay verbatim; only the level changes. The banner headings carry no query terms (same category as the `_ SYSTEM_CONFIG` h3 already dropped). Fallback if declined: keep one `LongformSection` per route with `ProseGroup` `<h3>`s inside, which matches the reference's 10–13 bodies but loses the numbered spine.
- **D2 — Tool-card chrome `<h2>`s → `<p>`** on cert, csv-to-pdf, invoice. These are UI labels, not content. Recommend without discussion.
- **D3 — `AutomateSection` position.** Every route uses the `automate` slot (directly under the result card) except `html-to-[format]`, where it stays inside the column after 01 because that page's heading order is frozen. Same component, same look; only the scroll position differs. Also adds `AutomateSection` to `csv-to-pdf`, which is the one route without an API block (new h2 "Automate with the API" on that page).
- **D4 — Delete `ApiPromptSection`** on linkedin-banner and og-image. It duplicates `AutomateSection` in v1 styling. Its heading "Automate this workflow with our API" disappears from those two pages.
- **D5 — `[usecase]`** "Automate with API" → "Automate with the API" (component heading).

## Sequencing

1. **Primitives + registry** (one PR): `longform/*`, `tool-cards.js`, `ToolSeoHead` move + `extraSchemas`, shell `related` slug support. No route changes. Storybook-free: verify by pointing `html-to-[format]` at them (step 2) in the same PR if that is faster.
2. **Reference route** `html-to-[format]` onto primitives + `ToolSeoHead`. This is the visual baseline; screenshot it at 1440 and 390 and keep the PNGs for the diffs below.
3. **`[usecase]`** (data-driven, proves the primitives cover the general case).
4. **Rail-mode routes**: `certificate-generator`, `code-to-image`.
5. **Column-mode routes**: `csv-to-pdf`, `linkedin-banner-generator`, `og-image-generator` (+ `[platform]`), `online-invoice-generator`, `tweet-screenshot`, `url-to-image-generator`.
6. **Hub** `src/routes/tools/+page.svelte` onto the registry.
7. **Delete**: `RelatedTools.svelte`, `scaffold/ToolFaq.svelte`, `scaffold/ToolBreadcrumb.svelte`, `ApiPromptSection.svelte`, `NextSteps.svelte`, `ShareResultButton.svelte`, `ApiCodeSection.svelte`, `$lib/seo/SEOHead.svelte` imports from tool routes.

One commit per route, prefixed `redesign(<route>):`, matching the branch's existing history.

## Acceptance

Automate the two things that protect rankings; eyeball the rest.

- **Head snapshot diff.** Before touching a route, run the dev server and save, per route (including `/tools/html-to-jpg`, `-png`, `-webp`, `-image`, one `[usecase]`, one `og-image-generator/[platform]`): `<title>`, `meta[name=description]`, `link[rel=canonical]`, `meta[name=robots]`, every `og:*` / `twitter:*`, and every `application/ld+json` block parsed and sorted by `@type`. Script lives at `scripts/seo-snapshot.mjs`, output in `scripts/seo-snapshots/<route>.json`. After migration the diff must be empty except for whitespace and key order.
- **Outline diff.** Same script also dumps `h1, h2, h3` `textContent` in document order. Diff against the snapshot must be empty except for the D1–D5 changes listed above, per route.
- **Residue grep** returns nothing in `src/routes/tools` and `src/lib/components/tools`:
  `grep -rnE 'border-\[3px\]|border-\[4px\]|shadow-brutal|font-black|rounded-none|border-gray-900|bg-black|max-w-5xl|text-5xl|text-center' …`
  (allowed exceptions: strings inside generated document HTML, e.g. the csv-to-pdf PDF template).
- **No route imports** `RelatedTools`, `ToolFaq`, `ApiPromptSection`, `SEOHead`, or defines a local `h2`/`h3` class string in the long-form slot.
- `npx svelte-check --threshold error` clean; `npx prettier --check` clean on every touched file (several are already unformatted: format them in the same commit).
- Screenshots at 1440 and 390 of every route stacked next to `/tools/html-to-jpg`: same rules, same numbering, same h2 size, same FAQ chrome, one related block, no centred headings.
- Guest flow unchanged: 5 renders → chip at 2 → button swap at 0 → signup → lands back on the tool.

## Out of scope

Copy changes for AEO (separate `/writing-aeo-content` pass), new FAQ or sections on routes that lack them, tool-card/editor redesigns beyond stripping brutalist classes, the `/tools/[usecase]` template gallery, mobile artboards, the closing-band live stat.
