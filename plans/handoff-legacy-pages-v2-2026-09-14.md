# Handoff — the last pre-redesign pages → v2 (design + implementation)

Date: 2026-09-14. User: "Do the redesign. Handoff to the other session."

Since 89f11a2 every marketing page mounts the v2 nav and footer, but eight routes still render
their BODY in the pre-redesign language (Manrope, coral display type, 3 px black card borders, cream
ground). Each is reachable from the footer or the sitemap. Bring them onto the Repro Shop system.

| # | Route | Today | Design authority |
|---|---|---|---|
| 1 | `/integrations` | old index, `src/routes/integrations/+page.svelte` | `plans/handoff-integrations-v2-2026-08-22.md` §Index spec |
| 2 | `/integrations/[slug]` | old detail, `src/routes/integrations/[slug]/+page.svelte` | Paper board **A62-0** "Integrations v2 — Zapier" + that handoff |
| 3 | `/solutions` | old index | §3 below (composition of v2 primitives) |
| 4 | `/solutions/[slug]` | `SolutionPageShell.svelte` → legacy `tools/scaffold/ToolPageShell.svelte` | §4 below |
| 5 | `/free-account` | old landing | §5 below |
| 6 | `/r/[id]` | old share page | §6 below |
| 7 | `/terms`, `/privacy` | old prose | §7 below |
| 8 | `src/lib/components/tools/scaffold/*`, `src/lib/components/landingPage/*` | dead after 1–7 | delete |

Rules that apply to all of them (same as every v2 handoff):

- **SEO copy is frozen.** `<title>`, meta description, canonical, H1 and the H2 outline of each page
  stay byte-identical unless the copy rule in the integrations handoff says otherwise. Run
  `scripts/seo-snapshot.mjs` (from the main checkout, not a worktree) before and after and diff.
- **No new components when a v2 one exists.** Build from `landing/*` (Nav, Footer, ClosingCta,
  CtaStrip, ProofSheet, RenderTile, PixelCluster, Capsule), `tools/v2/*` (ToolPageShell,
  ToolStamp, LedgerRow, RelatedToolRows, ToolSeoHead) and `tools/v2/longform/*` (HeroTitle,
  HeroSub, Lead, Prose, ProseGroup, LongformSection, LongformPair, StepCards, FeatureGrid,
  CheckList, ComparisonTable, FaqList, LinkCardGrid, RelatedLinks, TagList, JumpLink).
- **Tokens only** (`brand-*` in tailwind.config.js). No Manrope, no `#FFFDF8`, no 3 px borders,
  no coral. Bricolage for display, Inter for body, JetBrains Mono for eyebrows/ledgers.
- Decoration follows the site rule: every pixel cluster or capsule is cut by a section edge.
- Mobile 390 must hold; the tool pages are the reference for how longform collapses.

## 1 · `/integrations` index

Implement the "Index spec" section of the 2026-08-22 handoff as written. Short version: field-ground
hero (eyebrow `INTEGRATIONS`, H1 unchanged), then a ledger of integrations grouped by
`integrationCategories` from `src/lib/pseo/config.js`, each row = brand icon (from
`src/lib/config/brandIcons.js`) · name · one-line "what it does with Pictify" · format stamps ·
arrow. Same row anatomy as the tools hub rows (`RelatedToolRows` / HB ledger). The framework SDK
rows (node, python, ruby, go) already 301 to docs (`hooks.server.js`); do not list them.

## 2 · `/integrations/[slug]`

Board **A62-0** is the authority; read it with `get_jsx`. Structure: hero (brand pair mark ·
H1 unchanged · lead), "recipes" ledger (the `recipes[]` data field the handoff introduced in
`src/lib/pseo/integrations.js`; if a slug has none, show the three generic recipes from the
handoff), a setup `StepCards` block, an `AutomateSection`-style code/curl block where the
integration has an API surface, `FaqList` from existing FAQ data, `RelatedLinks` to two sibling
integrations, `ClosingCta`. Everything that is copy today stays copy; only the container changes.

## 3 · `/solutions` index

No board exists; compose it. Ground: field hero (eyebrow `SOLUTIONS`, H1 "Data in. Branded
documents out." unchanged, the existing lead). Body: one `LongformSection` "Use-case guides"
holding a `LinkCardGrid` of the Sanity solutions (`getSanitySolutions`), each card = ToolStamp
of the output format · title · one line · arrow, canvas-ground cards with 1.5 px rule border and
the offset ink shadow on hover (same as tool cards). Empty state when Sanity returns nothing: a
single row "Guides are being written" in mono, never a blank section (today the section is
empty on production, see the 2026-09-14 screenshot).

## 4 · `/solutions/[slug]`

Replace `SolutionPageShell.svelte`'s use of the legacy scaffold with `tools/v2/ToolPageShell`.
Map the solution's blocks onto longform primitives: intro → `Lead` + `Prose`, steps →
`StepCards`, checklist → `CheckList`, FAQ → `FaqList`, related → `RelatedLinks`, closing →
`ClosingCta` pointing at the matching free tool (`/tools/<slug>`) when one exists, else `/signup`.
Then delete `src/lib/components/tools/scaffold/`.

## 5 · `/free-account`

Keep the page (it has its own OG card, `static/og/v2/free-account.png`, and inbound links). It is
the free tier's landing: hero on field ground (eyebrow `FREE TIER`, H1 unchanged, lead, ink
"Create free account" button + "Log in" text link, mono line "50 renders a month · no card"),
then "What you get" as a three-column `FeatureGrid` (watermark-free images, API key, saved
templates: same three items, v2 cards), then the FAQ as `FaqList`, then `ClosingCta`. Numbers
come from `src/config/plan-features.js`, never typed in.

## 6 · `/r/[id]` (public render share page)

Purpose: someone opens a link to one render. Nav + Footer v2. Body: a `ProofSheet`-style frame
centred on canvas ground showing the render at its native aspect (max 1200 wide), a mono ledger
under it (FORMAT · SIZE · CREATED · from template "…" when present), a `Download` ink button
with the existing format menu (keep `downloadAsset()` and the `/public/results/:uid/download`
call untouched), and the existing "Turn this design into a template" card restyled as a
`RailSignupCard`. No decoration clusters here; the render is the picture.

## 7 · `/terms`, `/privacy`

Prose pages. `ToolPageShell` with a 720 px reading column: eyebrow mono (`LEGAL · TERMS OF
SERVICE`, `LEGAL · PRIVACY POLICY`), H1 unchanged, "Last updated" as a mono line, then the
existing text through `ProseGroup`/`Prose` with H2s from the existing numbered sections. No
cards, no colour. The support address is `support@pictify.io` (fixed in 89f11a2).

## 8 · Deletions

After 1–7 nothing imports `src/lib/components/landingPage/*` or `src/lib/components/tools/scaffold/*`
(`grep -rn "landingPage/\|tools/scaffold/" src` must return nothing). Delete both folders in the
same commit as the last page that used them.

## Acceptance

- Crawl: every `<footer>` link and every sitemap URL returns 200 and none contains
  `border-b-[3px] border-gray-900` or `font-['Manrope']` (the crawl script from 2026-09-14 is
  described in memory `pictify-footer-and-legacy-chrome-2026-09`).
- SEO snapshot diff is empty for title/description/canonical/H1/H2 on all eight routes.
- `npm run build` clean; `svelte-check` clean.
- 1440 and 390 screenshots of each route attached to the commit message or the reply.
- Deploy: `npm run build && npx wrangler pages deploy .svelte-kit/cloudflare/ --project-name pictify --branch master`
  (the Pages project is `pictify`, not `pictify-frontend`). Edge cache is 10 minutes since
  4b25809, so no purge is needed.

## Worktree rules

Frontend master is 4b25809 and is what production runs. Branch from it (or merge it into
`worktree-redesign-v2` first: it has diverged from master by today's hotfixes). Never `git stash`,
never `git add -A`; stage only your own hunks. Commit and push when done, then tell this session
so master can be deployed.
