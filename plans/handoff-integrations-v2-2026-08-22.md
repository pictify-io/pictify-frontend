# Handoff — Integrations v2 (`/integrations` + `/integrations/[slug]`)

Date: 2026-08-22. Design approved. Queue after Alternatives. Same worktree and shell pieces.

## Source of truth
Paper file **Pictify — Landing Redesign (Repro Shop)** (`01KZQXXEZ2SNPWS5PN2FCF31PC`), board **"Integrations v2 — Zapier"** = `A62-0`. Template integration is Zapier; Make, n8n, WordPress, Shopify render from the same template with their own `integrations.js` entry.

```
AGS-0  Nav
AED-0  Hero (field, Pixel Resolve deco): breadcrumb INTEGRATIONS · {NAME}, H1 "{name} + Pictify", description, mono line "{CATEGORY} · NO CODE · {estimatedTime} SETUP"
  AEE-0   row: About card AEP-0 (label ABOUT INTEGRATION, longDescription, "Start on Free" ink + "Read the docs" outlined → docsUrl) · Lockup card AEF-0 (Pictify ink chip + {name} outlined chip, line "Trigger in any app → render in Pictify → use the URL")
AHB-0  01 Key Capabilities (360 col, ruled list from features[]) · 02 Common Use Cases (recipe rows AHX-0 from useCases[]: trigger tile → render tile (ink, pink mark) → use text → USE TEMPLATE chip)
AJ2-0  03 Integration Guide: chips "ABOUT {estimatedTime}" + "{n} STEPS"; Steps card AJD-0 (numbered rows: title, description, optional code block with COPY, optional TIP bar in rose w/ pink left rule); Guide rail AKN-0 (BEFORE YOU START = prerequisites[], IF SOMETHING BREAKS = troubleshooting[], ink "Skip step one." signup card w/ blue shadow)
A7W-0  Closing band (ink): eyebrow NO CODE REQUIRED · H2 "Ready to build with {name}?" · sub · "Start on Free" · "OR OPEN THE {NAME} DOCS →"
A7B-0  Related Integrations — 4 cards (category label, name, one-liner) + "ALL INTEGRATIONS →"
A64-0  Footer
```

## Copy rule
Headings frozen from the live route: H1 "{name} + Pictify", H3 "About Integration" (keep as H3 in the about card label), H2s "Key Capabilities", "Common Use Cases", "Integration Guide", "Ready to build with {name}?", "Related Integrations". **"Fast Install" section is dropped** — its H2 goes too (it was install boilerplate; for WordPress/Shopify fold the install command into Integration Guide step 1 as the code block). Body strings render from `src/lib/pseo/integrations.js`. No email-delivery claims; step 6 on Zapier currently says "or send via email" in the data — change to "update a CMS".

The recipe rows need a `{trigger, render, use}` triple per use case. `useCases[]` today is one string each ("Auto-generate OG images for new blog posts"). Add a `recipes[]` field per integration (3 items) and fall back to rendering `useCases[]` as a plain ruled list when absent. Recipe tiles are colour-coded by trigger category (powder = CMS/content, rose = events/learning, field = data/sheets, sky = commerce).

## Target
- `src/routes/integrations/[slug]/+page.svelte` (576 lines) — replace markup, keep `<svelte:head>` + JSON-LD (HowTo schema from tutorial steps — keep it, it's valuable) and the not-found state.
- `src/routes/integrations/+page.svelte` (329 lines) — index. No board; spec below.

## Index spec (`/integrations`)
- Hero (field): breadcrumb INTEGRATIONS, H1 keep live text, sub keep live text. Deco: the Pixel Resolve blocks.
- Two labelled sections in the tools-hub pattern (mono label + 4-up cards): **AUTOMATION** (Zapier, Make, n8n) and **PLATFORMS** (WordPress, Shopify). Card = category label, name, `description`, "{estimatedTime} setup" mono meta. Reuse the related-integration card.
- Third section **BRING YOUR OWN**: three cards that link to docs — REST API, Webhooks, MCP server — so the page doesn't look thin with five integrations.
- Closing band: "Anything that can fill a template." + Start on Free.
- Keep any JSON-LD on the index.

## Behaviour
- Code blocks: mono 12/19 on `--color-press`, header bar with label + COPY (copies `step.code`). Tip bar only when `step.tip` exists.
- Guide rail is `position: sticky; top: 96px`. Hidden prerequisites/troubleshooting cards when the arrays are empty.
- "Skip step one." card → `/signup?redirect=/integrations/{slug}`; cta_location `guide_rail`. Hero "Start on Free" `int_hero`; band `int_band`. Logged-in users see "Open dashboard" instead on the rail card.
- USE TEMPLATE chips link to the template gallery filtered to the use case (or `/templates` if no filter exists yet).
- Responsive: hero row stacks; capabilities above use cases at <1100; recipe rows wrap tiles to two lines; steps card + rail stack (rail after steps, not sticky) at <1000.

## Reference grounding (Refero, 2026-08-22)
Zapier app-integration pages (both-logo header, templates as trigger→action rows, triggers/actions lists, about block, signup band), Descript integrations directory (floating icons hero, grouped sections). Adopted: lockup header, recipe rows, grouped index. Rejected: search/filter UI (five integrations don't need it), embedded signup form in the band.

## Acceptance
- Headings `textContent` identical to live for all five slugs except the dropped "Fast Install" H2 (intentional).
- HowTo JSON-LD still validates with the same step count.
- Screenshot at 1440 vs `A62-0`.
