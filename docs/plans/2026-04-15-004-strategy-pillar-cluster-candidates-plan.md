---
title: "strategy: Pillar + cluster candidates"
type: strategy
status: active
date: 2026-04-15
origin: "DataForSEO keyword cluster analysis (2026-04-15 session)"
---

# Pillar + cluster candidates

## Context

We planned the **automated-image-generation** pillar cluster. But a pillar+cluster model is expensive to build (10+ pages each) — we need to pick the right topics, in the right order, to maximize ROI.

This plan surveys Pictify's potential pillar opportunities and ranks them by **defensibility × volume × fit with existing assets**. Each candidate is evaluated on: total cluster SV, KD distribution, existing page coverage (do we already rank?), SERP intent match, and competitive landscape.

**Goal:** decide which 2–3 clusters to build next, and which to deprioritize.

## Candidates evaluated

### 1. Automated image generation (already planned — reference baseline)

- **Head keyword:** "automated images" — 8,100 SV, KD 0.
- **SERP intent:** Mixed (stock photos dominate top 5; dev API sits #4, #6, #7).
- **Cluster SV:** ~2,000–3,000/mo addressable (dev intent).
- **Status:** Plan written (`2026-04-15-003`), ready to build.
- **Fit:** anchors Pictify's "Programmable Image Engine" positioning. Cluster is greenfield.
- **Verdict:** **P0 — build first.**

### 2. HTML to image

- **Head keyword:** "html to image" — **5,400 SV, KD 8** (and 18 variant keywords at 4,400 SV each around "how to add image in html" tutorials — combined cluster SV ~50,000+).
- **SERP intent:** informational ("how to"), mixed with dev tool landing pages. MDN + w3schools own the tutorial slots; Pictify, htmlcsstoimage, urlbox, and Bannerbear sit underneath.
- **Cluster SV:** ~10,000–15,000/mo realistically addressable.
- **Existing Pictify coverage:** **STRONG.** `/tools/html-to-png` ranks #9 for "html to png" (2,400 SV). `/tools/html-to-jpg` ranks #11–14 for "html to jpg" (2,400 SV). `/tools/url-to-image-generator` ranks for 35 variants. Already doing well but no unifying pillar.
- **Competitive landscape:** crowded — htmlcsstoimage, apiflash, urlbox all compete. But we already rank, so topical authority is partly built.
- **Gap:** **no dedicated `/blog/html-to-image-the-complete-developer-guide`** — wait, that exists as a blog post. But there's no `/solutions/html-to-image` pillar linking the tool pages together. Internal linking graph is weak.
- **Cluster shape:** pillar `/solutions/html-to-image` → links to `/tools/html-to-png`, `/tools/html-to-jpg`, `/tools/html-to-webp`, `/tools/url-to-image-generator`, `/blog/html-to-image-the-complete-developer-guide`, plus new supporting blog posts (`html-to-image-puppeteer`, `html-to-image-headless-chrome`, `html-to-image-react`, etc.).
- **Verdict:** **P0 — highest-leverage opportunity.** We already rank for the long-tail but lack a pillar to lift the head term. A 2,000-word pillar + 3–5 new blog posts could push `/tools/html-to-png` from #9 to #1–3 (6,000+ extra visitors/mo potential).

### 3. OG image (Open Graph image)

- **Head keyword:** "og image" — **2,400 SV, KD 40**. Harder than it looks because backlink count averages 7,800 on page 1.
- **Cluster includes:**
  - "og image size" — 1,000 SV, KD 39
  - "og image dimensions" — 1,000 SV, KD 15
  - "og image sizes" — 1,000 SV, KD 14
  - "og image checker" — 390 SV, KD 13 (tool intent — we don't have this tool)
  - "og image test" / "og image tester" — 320 SV, KD 29–42
  - "og image generator" — 260 SV, KD 18
  - "og image examples" — 210 SV, KD 9
  - "og image example" — 210 SV, KD 12
  - "what is an og image" — 170 SV, KD 12
  - "og image preview" — 110 SV, KD 14
- **Total cluster SV:** ~8,000+/mo.
- **SERP intent:** informational (size/dimensions), commercial (generator/checker), transactional (generator).
- **Existing Pictify coverage:** `/tools/og-image-generator` ranks #19 for "og image generator" (260 SV). Weak.
- **Competitive landscape:** Nico Bachner's og-image.dev, Vercel's `/og`, opengraph.xyz, metatags.io. Many are free dev tools.
- **Gap:** we don't have a `/tools/og-image-checker` or `/tools/og-image-tester` despite 700+ SV in those terms. We don't have a pillar page explaining OG images with linked sub-pages for sizes, examples, generator, checker, etc.
- **Cluster shape:** pillar `/solutions/og-images` (or `/og-image-guide`) → new tools `/tools/og-image-checker` + `/tools/og-image-preview` → supporting pages `/guides/og-image-dimensions`, `/guides/og-image-examples`, `/guides/what-is-an-og-image`. Blog post(s) on implementation.
- **Verdict:** **P1 — high leverage, moderate difficulty.** Strong volume, lots of supporting-page opportunities, we already have one ranking tool. Needs 2 new mini-tools (checker + preview) + pillar + 4 guides. Larger scope than automated-images but meaningful traffic.

### 4. Certificate generator (cluster partially exists)

- **Head keyword:** "certificate generator" — 2,900 SV, KD 23.
- **Cluster** (from Orshot gap analysis):
  - 7 variants at 2,900 SV each (certificate generator / maker / builder / make a certificate etc.)
  - "free certificate generator" — 590 SV, KD 38
  - "certificate generator online" — 480 SV, KD 49
  - "gift certificate generator" — 1,300 SV, KD 4 (adjacent vertical)
  - "wedding / marriage certificate generator" — 320 SV, KD 8
  - "medical certificate generator" — 320 SV
- **Total cluster SV:** ~20,000+/mo.
- **SERP intent:** commercial/transactional (generators).
- **Existing Pictify coverage:** `/tools/certificate-generator` shipped 2026-04-13. Too recent to know rankings.
- **Gap:** no supporting pages yet. Each certificate vertical (gift / wedding / medical / award / attendance / course / participation) could be its own landing page driving traffic to the shared tool.
- **Cluster shape:** hub `/tools/certificate-generator` → vertical pages `/tools/gift-certificate-generator`, `/tools/wedding-certificate-generator`, `/tools/award-certificate-generator`, `/tools/attendance-certificate-generator`, `/tools/course-completion-certificate-generator`. Plus `/blog/how-to-create-certificates` (already exists as `how-to-create-certificate-from-html.md`).
- **Note on SSL certificates:** "csr certificate generator", "ssl certificate generator", "https certificate generator" (~3,900 SV combined) are a DIFFERENT vertical (crypto/TLS, not design certificates). **Do not pursue** — wrong audience, wrong SERP.
- **Verdict:** **P1 — wait 30 days.** Let cert-gen establish initial rankings first, then layer on vertical-specific landing pages. Building the cluster BEFORE the main tool has ranked muddies the signal.

### 5. Social media images

- **Head keyword:** "social media images" — 1,900 SV, KD 5.
- **Cluster:**
  - "images for social media" — 1,900 SV, KD 5
  - "social media image sizes" — 880 SV, KD 15–46 (multiple variants)
  - "social media stock images" — 720 SV, KD 32 (wrong intent)
  - "social media marketing images" — 210 SV
- **Total cluster SV:** ~5,000–6,000/mo.
- **SERP intent:** **mostly photo-seeker or stock-site intent.** SERP looks like "automated images" — dominated by stock libraries. Similar trap.
- **Existing Pictify coverage:** none directly. `/tools/linkedin-banner-generator` exists but not positioned in this cluster.
- **Gap:** "social media image sizes" — 880 SV, KD 15 — is actually a winnable dev-ish query (people looking for dimension guides). Pair with a free checker tool.
- **Cluster shape:** Rather than build a full pillar, **ship one tool + one guide** → `/tools/social-media-image-sizes` (interactive reference) + `/guides/social-media-image-dimensions-2026`. Test if it ranks; expand only if it does.
- **Verdict:** **P2 — defer.** Stock-photo SERP risk is high. Lower ROI than OG-image cluster with similar effort.

### 6. Invoice generator

- **Head keyword:** "invoice generator" — ~9,900 SV (per historic Pictify data), KD high.
- **Cluster:** "free invoice generator", "online invoice generator", "invoice template", "invoice maker", verticals by industry.
- **Existing Pictify coverage:** `/tools/online-invoice-generator` exists. Unknown current ranking.
- **SERP intent:** transactional (tool).
- **Competitive landscape:** brutal. Wave, Zoho, Square, Stripe, PayPal all run dedicated free invoice-generator pages. Domain authority mismatch is the issue.
- **Gap:** Pictify's invoice tool is niche-positioned (developer / template-rendering angle) but SERP rewards SaaS-billing-adjacent brands.
- **Verdict:** **P3 — do not build a cluster.** Let the existing tool rank on its own merits. The ROI of 10 supporting pages here is lower than in any other candidate because domain authority is the real constraint.

## Prioritized cluster roadmap

| Priority | Cluster | Total SV | Existing coverage | Effort | Order |
|---|---|---:|---|---|---|
| **P0** | Automated image generation | ~3,000 addressable | None | 4 weeks | **1st** (plan already written) |
| **P0** | HTML to image | ~10,000 addressable | Strong (multiple ranking tools) | 3 weeks | **2nd** (or parallel) |
| P1 | OG image | ~8,000 | One weak tool | 5 weeks (2 new mini-tools + pillar + guides) | 3rd |
| P1 | Certificate generator vertical cluster | ~5,000 (verticals) | Head tool exists, no verticals | 4 weeks | 4th — wait 30 days first |
| P2 | Social media images | ~3,000 (risky intent) | None | 2 weeks (test only) | 5th — single tool + guide, not full cluster |
| P3 | Invoice generator | Large but DR-bound | Head tool exists | — | Skip |

## Key strategic insights

### 1. HTML-to-image is the hidden leader

It has the largest addressable cluster AND we already partially rank. Most other candidates require us to build from zero. Pushing `/tools/html-to-png` from #9 to #1 alone captures more SV than the entire automated-images cluster at steady state. **If forced to choose one cluster to build first, this is it** — ignoring sunk planning cost on automated-images.

### 2. Two parallel clusters beats three sequential ones

Automated-images and html-to-image share overlapping supporting content (both reference `/tools/html-to-png`, `/compare/*`, `/blog/html-to-image-developer-guide`). Building them in the same 4-week sprint is ~30% cheaper than serial because each new page links into both pillars.

### 3. Don't build a cluster until the hub tool ranks

Certificate generator shipped 2 days ago. Zero rank data. Building 5 supporting vertical pages now ties their fate to an un-indexed hub. **Wait 30 days, confirm the main tool ranks, then expand.** Cheap lesson.

### 4. Stock-photo intent is a persistent hazard

"Automated images", "social media images" both have stock-photo-dominated SERPs. Even with strong content, Pictify can't displace Adobe/Getty/iStock for a photo-seeker query. **Mitigation:** the supporting cluster pages target dev-intent keywords with clean SERPs (`image generation api`, `bulk image generation`, etc.) — where we can actually rank top 5. The pillar earns residual traffic from the long tail of its own supporting pages.

### 5. OG-image is the biggest "build mini-tools + cluster" opportunity

Two tool gaps sit unserved: `/tools/og-image-checker` (390 SV, KD 13) and `/tools/og-image-preview` (110 SV, KD 14). Shipping both is ~3 days each. Combined with an OG-image pillar, this is the cluster with the strongest tool-driven conversion story — OG checkers have high signup intent because users paste their URL, see the preview, and want to fix it (our tool).

## Recommended order

1. **Week 1–4:** Build the **automated-image-generation** pillar + 11 supporting pages (plan `2026-04-15-003`).
2. **Week 3–5 (parallel):** Build the **html-to-image** pillar + 5 supporting pages (reuse the scaffold).
3. **Week 5–6:** Evaluate cert-gen rankings. If top 20 on "certificate generator", layer on 4 vertical cert pages.
4. **Week 7–11:** Build the **OG-image** cluster (pillar + 2 new mini-tools + 4 guides).
5. **Week 12+:** Test `/tools/social-media-image-sizes` as a single-page probe. If it ranks, expand. If not, abandon.

## Scope boundaries

- **Do not build SSL/CSR certificate content** — wrong audience, wrong domain.
- **Do not build an invoice-generator cluster** — domain-authority-bound, low ROI.
- **Do not target "image generator" head term alone** — it's dominated by AI image tools (Midjourney, DALL-E) and we can't compete there. Target "image generation API" instead (done in automated-images plan).
- **Do not build a cluster until the hub tool has 30 days of rank data.**

## Verification

Monthly DataForSEO re-run. Cluster succeeds when:
- Pillar page ranks somewhere for its head term within 60 days of launch.
- Combined cluster impressions > 10,000/mo within 90 days (Search Console).
- At least 30% of supporting pages rank top 30 for their primary keyword within 90 days.
- Organic cluster ETV > 500/mo within 120 days (DataForSEO).

Abandon criteria:
- Zero pages rank top 50 after 120 days → cluster is wrong-shaped; post-mortem before building another.
- Pillar ranks but no supporting page does → links from pillar aren't flowing; fix internal linking.

## Critical files reference

**Existing clusters / reference:**
- `docs/plans/2026-04-15-003-strategy-automated-images-cluster-plan.md` — pillar template.
- `docs/plans/2026-04-15-001-strategy-orshot-competitive-plan.md` — overall competitive context.
- `src/lib/components/tools/scaffold/` — shared primitives every cluster reuses.

**Pages that already rank (html-to-image cluster seeds):**
- `src/routes/tools/html-to-png/+page.svelte` (ranks #9 for "html to png")
- `src/routes/tools/html-to-jpg/+page.svelte` (ranks #11–14)
- `src/routes/tools/url-to-image-generator/+page.svelte` (ranks for 35 variants)
- `src/routes/tools/og-image-generator/+page.svelte` (ranks #19)

**Blog content that would anchor clusters:**
- `pictify-blog/blogs/html-to-image-the-complete-developer-guide.md` (anchors html-to-image cluster)
- `pictify-blog/blogs/how-to-create-certificate-from-html.md` (anchors certificate cluster)
- `pictify-blog/blogs/canva-alternatives-for-developers.md` (cross-cluster link target)

## Deferred

- Revisit "invoice generator" cluster after domain authority grows (6+ months).
- Revisit "social media images" if content industry shifts away from stock photos (unlikely 2026).
- Consider an `/industries/*` sub-hierarchy (ecommerce, saas, newsletters, agencies) once solution clusters mature.
