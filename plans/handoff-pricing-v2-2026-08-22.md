# Handoff — Pricing page v2 ("Pay by the render")

Date: 2026-08-22. Design approved. Implement after the tool page v2; same worktree, same shell pieces.

## Source of truth
Paper file **Pictify — Landing Redesign (Repro Shop)** (`01KZQXXEZ2SNPWS5PN2FCF31PC`), board **"Pricing v2 — by the render"** = `8WN-0`. Read values with `get_jsx` / `get_computed_styles`.

```
91T-0  Nav
91J-0  Hero (field): breadcrumb PRICING · BY THE RENDER, H1 "Pay by the render.", sub, mono facts. Deco = the shared "Pixel Resolve" blocks (9BT-0 top-right bleed, 9D3-0 bottom-left) — same component the landing hero and Guides hero use; reuse that, do not draw capsules.
92D-0  Plans block (1200 col)
  92E-0  Toggle row: mono line + Monthly/Annual pill (annual active, −20% chip)
  92N-0  Cards row (3 × 386): Basic 93N-0 · Pro 94I-0 (ink bg, pink 6px shadow, MOST TEAMS) · Business 95F-0
  9M5-0  Free strip (white card, three lanes): "Free" + $0 · FOREVER · NO CARD, inclusions line, outlined "Start on Free"
  96J-0  "What a month of renders actually buys" — 3 tinted tiles (powder / field / rose)
96Z-0  01 Compare plans — table 973-0: header 975-0 (sticky), header 9FZ-0 (sticky; plan columns centre-aligned; name + price + CTA per plan on the same 360 + 4×flex grid as the body rows, 24px gutters; Pro = ink button w/ pink shadow + MOST TEAMS chip), groups Renders · Build & automate · Team (seats, brand assets, audit logs). No bottom CTA row.
8YI-0  02 FAQ (760 col)
9BJ-0  Closing band (ink): "Start on Free. Nothing to cancel."
8WP-0  Footer
```

## Target
`src/routes/pricing/+page.svelte` (1,014 lines). Keep: `getProducts()` fetch for purchase URLs, `PLAN_PRICING` / `PLAN_FEATURES` / `OVERAGE_PRICING` from `src/config/plan-features.js` as the only source of numbers, annual/monthly state, `selectPlanHandler` routing (`/signup?redirect=/dashboard/upgrade` for guests, `/dashboard/upgrade` for users), analytics calls, `<svelte:head>` + JSON-LD. Replace all markup.

**Numbers on the board are from plan-features.js as of today** (Free 50 · Basic 1,000 @ $19/$15 · Pro 10,000 @ $49/$39 · Business 40,000 @ $249/$199; overage $0.02 / $0.01 / $0.005; AI credits 25/300/1,000/4,000; seats 1/2/5/10; templates 3/25/∞/∞). Never hard-code — render from config so the board and the page can't drift.

## Behaviour
- **Free is a full-width strip directly below the three paid cards** (the live page hides it in the comparison table — that's the main change). Strip: name + `$0 · FOREVER · NO CARD` + one inclusions line (50 renders · full API · formats · 3 templates · 25 AI credits) + outlined "Start on Free" → `/signup?redirect=/dashboard`. Free also stays as the first column of the comparison table. Logged-in Free user: strip button becomes a `YOU'RE ON THIS` chip; logged-in paid user: their card shows `CURRENT PLAN`, lower tiers show "Downgrade".
- Card hierarchy: render count is the big number (Bricolage 50/52), price second (Inter 24), overage sentence third. Under annual the price shows the annual rate with "/mo billed annually"; under monthly, the monthly rate with "/mo". Toggle default = annual.
- Pro is the highlighted plan (ink card, pink shadow, field CTA). `popularPlanNames` stays `['Pro']`.
- **No Enterprise surface for now** (owner decision 2026-08-22): no band, no row, no table row for SSO/SLA/DPA. If an enterprise lead needs a path, the footer contact link is enough. Drop the live page's "Enterprise Needs?" section.
- "What a month buys" tiles are static marketing copy (not from config) — keep copy exactly; they're there to make render volumes concrete.
- Comparison table rows are exactly the live page's `comparisonFeatures` set plus "Rows per batch request" (BATCH_ITEMS_PER_REQUEST) — every row maps to a FEATURES key. Retired / unsupported features must NOT appear anywhere on the page: experiments (A/B testing, smart links, scheduled images, auto-optimisation), dynamic links, **storage connectors (retired)**, **white-label media URLs (not supported)**; no support-tier row (none in config). Brand assets = Basic+, audit logs = Business. No SSO/SLA/DPA row. Remove `STORAGE_CONNECTORS` and `WHITE_LABEL` rows from `comparisonFeatures` in the route.
- Comparison table: header row is `position: sticky; top: 88px` (under the nav) and carries plan name + price + a compact CTA per plan (Arcade pattern) so the buy action travels with the reader; the header uses the identical column grid as the body rows and the same centre alignment so names/prices/buttons sit over their values; the Pro cell has the ink button with pink shadow and a field MOST TEAMS chip (no column tint); there is NO separate CTA row at the bottom of the table; groups RENDERS / BUILD & AUTOMATE / TEAM; plan columns are centre-aligned (label column left); filled green square = included, outlined square = not, text for limits; last row SSO/audit/SLA shows `ENTERPRISE` in every column.
- FAQ: reuse the existing `FAQs` array verbatim (it already includes the overage rate interpolation) — the board shows five of them; render all.
- Closing band: "Start on Free. Nothing to cancel." + "Start rendering free" (field button, pink shadow) + "OR READ THE DOCS FIRST →". Heading is marketing copy — `<p>`, not `<h2>`.
- Analytics: `pricing_plan_click` with `{ plan, billing_interval, cta_location }` where cta_location ∈ `card`, `free_strip`, `table_header`, `closing_band`.
- Responsive: ≥1200 three cards; 768–1199 three narrow cards or 2+1 with Pro first; <768 single column, Pro first; the Free strip stacks its three lanes vertically; comparison table scrolls horizontally inside its own container with the feature column sticky-left; "what a month buys" tiles stack.

## Reference grounding (Refero, 2026-08-22)
Dub (link API, free tier + usage pricing), Linear, Arcade. Adopted: Free shown as a strip under the cards rather than a fourth card (owner preference: keep the stage for the paid tiers) with "Everything in Free, plus" ladders (Dub), plain H1 + one-line sub (all three), annual toggle with "Save 20%" (Dub/Arcade), grouped comparison with repeated CTAs (Arcade/Linear), closing CTA band (Linear). Rejected: hiding Free, rhetorical hero copy ("Stop overpaying"), any Enterprise surface (deferred).

## Acceptance
- Numbers on the page === `plan-features.js` for every cell (write a quick test that renders the config through the same formatter used in the table).
- Toggle switches every price and the "/mo" suffix; annual default.
- Logged-in states verified for Free, Pro and Business accounts.
- Screenshot at 1440 vs board `8WN-0`.

## Copy constraint (2026-08-22)
No email-delivery claims anywhere on the page (cards, tiles, FAQ answers). Webhooks and batch are fine; "delivered to recipients" is not.
