# Handoff — Alternatives page v2 (`/alternatives/[slug]`)

Date: 2026-08-22. Design approved. Queue after Pricing v2. Same worktree, same shell pieces (Nav, Footer, closing band, FAQ accordion, section headers from the tool page / pricing work).

## Source of truth
Paper file **Pictify — Landing Redesign (Repro Shop)** (`01KZQXXEZ2SNPWS5PN2FCF31PC`), board **"Alternatives v2 — vs HTML/CSS to Image"** = `9MF-0`. Template competitor is HCTI (`pictify-vs-htmlcsstoimage`); every other slug renders from the same template with its own data.

```
9YJ-0  Nav
9WN-0  Hero (field, Pixel Resolve deco): breadcrumb ALTERNATIVES · {COMPETITOR}, H1, sub, mono line "{COMPETITOR} ALTERNATIVE · {year} · UPDATED {month}"
  9Z3-0   row: TL;DR card 9Z4-0 (white, 4px ink shadow; TL;DR label, tldr text, "Start on Free" ink + "Read the migration guide" outlined) · Lockup card 9ZC-0 (Pictify ink chip VS competitor outlined chip + competitorDescription)
9ZN-0  01 Why Switch from {Competitor}? — score table 9ZR-0 (label col 480 + two centred columns; each score = five 12px squares, filled ink for score, outlined mute for remainder) + assessment footnote
A2E-0  Choose Pictify if… (ink card, pink shadow, field bullets) / Stay with {Competitor} if… (white card, outlined bullets, honesty footnote) — these are the live H3s
A3H-0  02 Pricing Comparison — two side-by-side ladders (Pictify header field with ANNUAL tag; competitor header subtle with "PUBLIC PRICING, {MON YYYY}")
A4N-0  03 Switching is Easy — difficulty + time chips top-right; 3 numbered step cells in one bordered row
9NY-0  04 Frequently Asked Questions (760 col accordion)
9NP-0  Closing band (ink): eyebrow "SAME HTML IN. BETTER THINGS OUT." · H2 "Ready to Switch?" · sub · "Start on Free" (field, pink shadow) · "OR READ THE MIGRATION GUIDE →"
A5G-0  Other alternatives — 4 cards + "ALL 29 COMPARISONS →"
9MH-0  Footer
```

## Copy rule (same as tool pages)
All headings come from the live route and the data file and stay byte-identical: H1 "The Best {competitor} Alternative {audienceLabel}", H2s "Why Switch from {competitor}?", "Pricing Comparison", "Switching is Easy", "Frequently Asked Questions", "Ready to Switch?", and the H3 pair "Choose Pictify if…" / "Stay with {competitor} if…". TL;DR, advantages, competitorAdvantages, bestFor, pricing, features, migration and faqs all render from `src/lib/pseo/comparisons.js` unchanged. The only new strings are the hero mono line, the score-table footnote, the honesty footnote, the band eyebrow, and "Read the migration guide" — all non-heading.

## Target
`src/routes/alternatives/[slug]/+page.svelte` (517 lines). Keep `+page.js` loading, `<svelte:head>` + JSON-LD, the not-found state (restyle to the system), and the related-comparisons logic. Replace markup.

## Behaviour
- Score table renders `features[key].pictify` / `.competitor` (1–5) as five squares; label text from the existing feature-label map. Columns centre-aligned, label column left, same grid rule as the pricing table.
- Pricing ladders render `pricing.pictify` and `pricing.competitor` rows in data order; Pictify side shows annual prices from `plan-features.js` (not the hard-coded strings in comparisons.js — fix the data so it reads from config, or at least assert equality in a test). Competitor side is data as-is with the "PUBLIC PRICING, {month year}" tag driven by a `pricingCheckedAt` field you add to each entry (fallback: build date).
- Migration: `migration.difficulty` and `migration.timeEstimate` → the two chips; `migration.steps` → numbered cells (step 1 may include the small code chip when the competitor is an API product; omit otherwise).
- "Other alternatives": 4 cards, pick by category affinity if `related` exists in data, else first 4 other slugs; link "ALL COMPARISONS →" to `/alternatives` (count from data, not hard-coded).
- **Correction (GSC check 2026-08-22):** `/alternatives` index EXISTS (`src/routes/alternatives/+page.svelte`) and data comes from **Sanity first** (`getSanityComparisons`), `comparisons.js` only as fallback — live slugs are `html-css-to-image`, `puppeteer-self-hosted`, etc., 38 entries per `sitemap-alternatives.xml`, not 29. Restyle the existing index to the tools-hub section pattern (grouped 4-up "PICTIFY VS {name}" cards); do not create a second one. Copy edits (email-delivery scrub, pricing-from-config) must be made in Sanity, not only in comparisons.js.
- **Redirect bug to fix in the same PR:** `/alternatives/hcti-io` is the top-clicking alternatives URL in GSC (position 7.3) and currently 301s to the index; point it at `/alternatives/html-css-to-image`. Audit the other legacy slugs in the 301 map the same way.
- CTAs: "Start on Free" → `/signup?redirect=/dashboard` (cta_location `alt_hero`, `alt_band`); "Read the migration guide" → docs migration page if one exists for the competitor, else the generic API quickstart.
- Analytics: `alternative_cta_click { competitor, cta_location }`.
- Responsive: hero row stacks (lockup under TL;DR); score table scrolls horizontally below 900 with the label column sticky; choose/stay cards stack; pricing ladders stack; migration cells stack; other-alternatives 2-up then 1-up.

## Reference grounding (Refero, 2026-08-22)
FeedHive (Agorapulse alternative), Reclaim.ai (vs Google Calendar), Cake Equity (vs Carta). Adopted: logo lockup in the hero, two-column comparison table immediately under the headline (Reclaim), honest "stay with X if" pairing, 3-step migration block with effort/time (Cake), switching CTA band, other-comparison cards at the foot (FeedHive). Ours differs by scoring both sides 1–5 instead of tick/cross, which the data already supports.

## Acceptance
- Headings + FAQ `textContent` identical to live for 3 slugs (htmlcsstoimage, bannerbear, puppeteer).
- Every competitor slug renders without layout breakage (long names like "Cloudflare Images", "HTML/CSS to Image" in the lockup and table header).
- Screenshot at 1440 vs board `9MF-0`.

## Copy constraint (owner decision 2026-08-22): no email-delivery claims
Do not lean on "workflow runs that email each document to its recipient" / "emailed per recipient" / delivery-status language anywhere in the v2 surfaces — the product does not surface that today and it is undecided. `src/lib/pseo/comparisons.js` carries ~75 such mentions in `tldr`, `advantages`, `bestFor` and `faqs`. Frozen-copy applies to headings; body strings from the data file may be edited by the owner. Do a data pass replacing email-delivery claims with what exists: batch render from CSV/webhook, per-item results + webhooks, PDF/GIF/video output, shareable CDN links. The board's TL;DR and "Choose Pictify if…" bullets show the corrected register. Flag any entry where removing the claim leaves the TL;DR empty of a real differentiator.
