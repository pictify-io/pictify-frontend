---
title: "refactor: Shared tool-page scaffold"
type: refactor
status: active
date: 2026-04-15
origin: "~/.claude/plans/fluttering-wondering-goose.md"
---

# Shared Tool-Page Scaffold — Refactor Plan

## Context

Three tool pages now live at ~1000 LOC each with ~60–70% shared structure:

- `src/routes/tools/certificate-generator/+page.svelte` (933 LOC)
- `src/routes/tools/tweet-screenshot/+page.svelte` (997 LOC)
- `src/routes/tools/online-invoice-generator/+page.svelte` (995 LOC)

Every SEO fix, CTA change, or layout tweak currently requires editing three files. Shipping a 4th tool page (twitter-carousel-generator, Wave 1 Orshot plan) would compound the drift. Commit `0fe1c32` already demonstrated this: the API-snippet-state-drift bug was fixed on cert-gen but had to be manually reasoned about again while building tweet-screenshot.

**Goal:** extract the shared scaffold into reusable pieces **without changing any existing page's visual output or behavior**. Each page after refactor must render pixel-identical HTML to what ships today.

## Non-goals

- Unifying the hero styles (cert-gen + invoice use a "skewed red GENERATOR" hero; tweet-screenshot uses a cleaner centered hero). Do NOT force one style on the other — preserve both.
- Unifying the editor area. Every tool has a different editor (MiniEditor / InvoiceTemplate / URL-fetch + custom form) and that stays tool-specific.
- Replacing `NextSteps` vs inline "Automate with API" — cert-gen and invoice use `NextSteps`, tweet-screenshot uses an inline section. Both patterns stay valid; the scaffold exposes slots for either.
- Unifying success-block contents — cert-gen has an extra "Edit in Full Editor" button, tweet-screenshot doesn't.

## What's actually shared (audited)

| Section | cert-gen | tweet-screenshot | online-invoice |
|---|---|---|---|
| `<Nav />` + outer `<section>` + 3 background blobs | identical | identical | identical |
| Breadcrumb markup | identical (only label differs) | identical | identical |
| `GenerationLimitBanner` call | present | present | present |
| Success banner (green `#4ade80`, rotated image, Download button) | present | present | absent |
| FAQ accordion (`<details>`/`<summary>`) + FAQPage JSON-LD | present | present | absent |
| `RelatedTools` call | present | present | absent |
| `<Footer />` | identical | identical | identical |
| `onMount` → `analytics.trackToolOpened({tool_name})` | identical | identical | identical |
| `trackImageGenerated` on successful render | identical | identical | identical |
| Schema: `WebApplication` JSON-LD | yes | yes | yes |
| Schema: `BreadcrumbList` JSON-LD | yes | yes | **no** |
| Schema: `FAQPage` JSON-LD | yes | yes | **no** |
| Schema: `HowTo` JSON-LD | no | **yes** | no |
| OG image width/height/alt tags | no | **yes** | no |
| `robots` meta tag | no | **yes** | no |

**Takeaway:** tweet-screenshot has the richest SEO stack. The scaffold should expose that as the default for new tools, while keeping cert-gen and invoice's current (weaker) SEO unchanged during the refactor so existing rankings don't churn.

## Approach — five composable primitives

No "big ToolScaffold component" — that would fight the divergent heroes and editors. Instead, five small primitives each tool page composes.

### 1. `src/lib/components/tools/scaffold/ToolPageShell.svelte`
Outer `<section>` + 3 background blobs + `<Nav />` + `<main>` + `<Footer />`. No props, default slot.

### 2. `src/lib/components/tools/scaffold/ToolBreadcrumb.svelte`
One prop: `label`. Home → Tools → {label}.

### 3. `src/lib/components/tools/scaffold/ToolSeoHead.svelte`
The biggest win. All meta tags + JSON-LD schemas driven by props.

Props: `title`, `description`, `canonical`, `ogImage`, `ogImageAlt?`, `ogImageWidth?`, `ogImageHeight?`, `schemaName`, `schemaDescription`, `schemaFeatures?`, `faqs?`, `breadcrumbLabel?`, `howToSteps?`.

Behavior:
- Always: `WebApplication`, `robots`, `og:site_name`, `twitter:site`/`creator`.
- Conditional: `FAQPage` (if faqs), `BreadcrumbList` (if breadcrumbLabel), `HowTo` (if howToSteps). OG image dimensions only emit when explicitly passed — cert-gen/invoice won't get silent upgrades.

### 4. `src/lib/components/tools/scaffold/ToolSuccessBanner.svelte`
Green `#4ade80` banner + rotated image + Download button. Named slot `extra-actions` for cert-gen's "Edit in Full Editor".

Props: `imageUrl`, `imageAlt?`, `heading?`, `downloadFileName?`.

### 5. `src/lib/components/tools/scaffold/ToolFaq.svelte`
`<details>`/`<summary>` accordion with neo-brutalist card styling. Takes `faqs: {q,a}[]`. Does NOT emit JSON-LD (that's in `ToolSeoHead`).

### NOT extracted

- **Hero** — two incompatible styles exist; stays inline per page.
- **API snippet** — `NextSteps` vs tweet-screenshot's inline version; keep both.
- **Editor area** — tool-specific.
- **RelatedTools / GenerationLimitBanner** — already shared.

## Rollout order (safety-first, one PR per step)

**Step 1 — Land scaffold primitives (no consumer changes).** Create the 5 new files. No imports from them yet. Validates compilation.

**Step 2 — Refactor tweet-screenshot.** Replace outer wrapper, breadcrumb, `<svelte:head>`, success banner, FAQ. Hero + editor + inline API section stay.

**Step 3 — Refactor certificate-generator.** Same swaps. Hero stays. `<svelte:fragment slot="extra-actions">` with "Edit in Full Editor" button. Pass the SAME (weaker) SEO props cert-gen emits today.

**Step 4 — Refactor online-invoice-generator.** Only shell + breadcrumb + SEO head swap.

**Step 5 — Normalize cert-gen + invoice SEO (separate PR).** Opt both into the richer SEO stack. Kept separate so ranking regressions are diagnosable.

## Scope boundaries

- Do NOT change any page's visible rendered output in Steps 1–4. Visual parity is the correctness criterion.
- Do NOT add new SEO tags to cert-gen/invoice in Steps 1–4 (deferred to Step 5).
- Do NOT unify the two hero styles.
- Do NOT touch `NextSteps` or replace it on cert-gen/invoice.
- Do NOT touch the tool-specific editor area on any page.
- Do NOT change `/tools/+page.svelte` (the tools index).
- Do NOT add tests in this pass — existing tool pages have none; backfill separately.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Subtle HTML drift (extra `<div>`, attribute order) breaks pixel layout | Save built HTML of all 3 current pages. Diff after each step's refactor. |
| JSON-LD rendering differs and Google Rich Results flags warnings | Run each page through Rich Results Test before/after. Schema count must be same or higher. |
| Cert-gen's skewed red title depends on wrapper | Hero stays inline on cert-gen. `ToolPageShell` emits the same `<section>` tag as today. |
| Lighthouse regresses due to component boundaries | Svelte compiles flat; no perf delta expected. If score drops >2 points, revert. |
| `ToolSeoHead` defaults contradict cert-gen's actual OG image | Dimensions are opt-in props. Not passed → tag not emitted. |
| Someone ships a new tool page before Step 1 lands | Ship Step 1 first; non-breaking (pure addition). |

## Per-page LOC budget after refactor

- `tweet-screenshot/+page.svelte`: 997 → ~600 (−397).
- `certificate-generator/+page.svelte`: 933 → ~600 (−333).
- `online-invoice-generator/+page.svelte`: 995 → ~750 (−245).
- New shared scaffold: ~350 LOC across 5 files.

Net savings: ~625 LOC. More important: one place to fix future SEO/CTA changes.

## Critical files reference

**Create:**
- `src/lib/components/tools/scaffold/ToolPageShell.svelte`
- `src/lib/components/tools/scaffold/ToolBreadcrumb.svelte`
- `src/lib/components/tools/scaffold/ToolSeoHead.svelte`
- `src/lib/components/tools/scaffold/ToolSuccessBanner.svelte`
- `src/lib/components/tools/scaffold/ToolFaq.svelte`

**Refactor (in order):**
- `src/routes/tools/tweet-screenshot/+page.svelte` (Step 2)
- `src/routes/tools/certificate-generator/+page.svelte` (Step 3)
- `src/routes/tools/online-invoice-generator/+page.svelte` (Step 4)

**Reuse (no change):**
- `src/lib/components/landingPage/Nav.svelte`
- `src/lib/components/landingPage/Footer.svelte`
- `src/lib/components/tools/GenerationLimitBanner.svelte`
- `src/lib/components/tools/NextSteps.svelte`
- `src/lib/components/tools/RelatedTools.svelte`
- `src/lib/analytics.js`

## Verification (per step)

1. **HTML diff.** `npm run build`. Compare built `.html` against `master`. Character-identical except for JSON-LD whitespace.
2. **Visual diff.** Dev server at 1440×900 and 375×812. Compare screenshots.
3. **Google Rich Results Test.** Schema count same or higher post-refactor.
4. **OpenGraph debugger** (opengraph.xyz). Title, description, image identical.
5. **Route 200.** Every tool URL returns 200 with same `content-length` (±100 bytes).
6. **Tool functionality.** Generate flow, Download, success banner, FAQ accordion, GenerationLimitBanner all work.
7. **Analytics.** `analytics.trackToolOpened` fires once per page load with correct `tool_name`.
8. **Sitemap.** `/sitemap-tools.xml` still lists all three URLs.

## Deferred follow-ups

- Backfill component tests for `ToolSeoHead` (prop → emitted tags).
- Consider a shared `<ToolHero>` if a third hero style appears.
- Migrate cert-gen + invoice to inline "Automate with API" if `NextSteps` is deprecated.
