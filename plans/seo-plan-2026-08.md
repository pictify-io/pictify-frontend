# Pictify SEO plan — approved 2026-08-22

Single source for all SEO work decided on 2026-08-22. Diagnosis and raw numbers live in `seo-gap-strategy-2026-08-22.md`; this doc is the plan. Sources: Google Search Console (sc-domain:pictify.io) and DataForSEO Labs (US/en). Owner decisions are marked **[approved]** or **[rejected]**.

## 0. Where we are
- Clicks: Jul 2,023/mo → Aug ≈1,650 (projected). 93% of clicks come from `/tools/*`.
- The drop is one page: `/tools/url-to-image-generator` (−218 of −273), sliding on image-*hosting* queries ("pic url", "image url generator") that Google is re-sorting toward upload sites.
- **[rejected]** Image hosting / `image-to-url` tool — not Pictify's business (that's Cloudinary). The hosting-intent clicks will keep falling; accepted.

## 1. Workstreams

### W1 — URL tool: win the screenshot cluster **[approved]**
Target: screenshot entire webpage 2,400 · screenshot an entire webpage 2,400 · full webpage screenshot 1,600 · website screenshot 2,400 · how to screenshot whole webpage 1,000 · how to screenshot entire webpage 880 · how to take a screenshot of a full webpage 480 (~11k/mo, KD 15–61). Held today by screenshotone.com with one tool page.
- Design: done — Paper board `ALG-0` ("URL tool — full-page mode (spec)").
- Frontend: capture-mode pills (Viewport / Full page / Element), options column, tall preview, PDF format, four FAQs appended + FAQPage JSON-LD, "full page" in title/meta. H1 frozen.
- Backend: expose `fullPage` on the render + public-render endpoints; add lazy-scroll step. (`puppeteer-browser-adapter.screenshot` already supports it; `html-renderer.js:196` hard-codes false.)
- Success: URL tool ≥800 clicks/mo on screenshot-intent queries by week 8.

### W2 — Certificate cluster **[approved]**
Bannerbear's `/generators/free-online-certificate-generator/` ranks #1–6 for 32 keywords: certificate maker 1,900 · make a certificate 1,900 · certificates maker 1,900 · certificate creator 720 · create a certificate 720 · certificate generator 590 (#1) · free certificate maker 590 · online certificate maker 390 (#1) · generate certificate 480 (#1). Ours: pos 30–45. ~10k/mo, KD 22–49.
- Content: rewrite `/tools/certificate-generator` SEO copy around "certificate maker / make a certificate" (H2s + FAQ — this page's headings are ours to change since it doesn't rank yet); template-first above the fold (5 visible template previews, Bannerbear's pattern).
- Off-site: 3–5 links from the existing AEO off-site tracker targets.
- Success: ≥100 clicks/mo by week 8.

### W3 — Canonical fixes on the HTML cluster **[approved]**
- html to png 2,900 KD0: ranks pos 11 via `/tools/html-to-png/1080x1920`. Make `/tools/html-to-png` the head page (internal links, title), keep size pages for size queries.
- html to image 5,400 KD8 / html-to-image 5,400: pos 25–30 on html-to-png. Give `/tools/html-to-image` its own title/H1 and stop html-to-png absorbing it.
- code to image 2,400 KD52 / code image 2,400 KD27: pos 16–20; add the "code image" phrasing to `/tools/code-to-image` H2/FAQ.
- Success: html-to-image + html-to-png ≥1,200 clicks/mo combined.

### W4 — Video: `/tools/html-to-mp4` **[approved]**
Target set ~3.4k/mo against file-converter SERPs that cannot render CSS animation: html to video 1,300 KD36 · html to mp4 880 KD14 · html to gif 590 KD0 · html to animated gif 590 KD0 · html to mp4 converter 210 KD23.
- Product: free tool on the video-studio renderer — paste HTML/CSS animation → MP4 / GIF / WebM; guest 5/day; result card "Copy API request" with `format: "mp4"`.
- Design: board to do (same ToolPageShell, column mode; editor + preview with a play scrubber instead of a static preview).
- Routes: `/tools/html-to-mp4` primary; `/tools/html-to-video` and `/tools/html-to-gif` as H1 variants on the same template (like html-to-[format]) so each head term has its own URL.
- Later: `/tools/lottie-to-mp4` (70/mo, KD0) if Lottie rendering exists.

### W5 — Developer video head terms **[approved]**
video generation api 90/mo $48.73 CPC · programmatic video 140/mo $33.95 · ai video generation api 260/mo $18.76 · video api 210 KD62 · json to video 90 KD0 · text to video api 70 KD12.
Low volume, very high intent and CPC. Not tool pages — own them through:
- Docs: a "Video generation API" overview page on docs.pictify.io (H1 = the keyword), with "programmatic video" and "JSON to video" as H2s; link from the video studio and pricing.
- One long-form blog post: "Programmatic video: generating MP4s from HTML templates with an API" (use the `/writing-aeo-content` skill; BLUF block; no email-delivery claims).
- Landing: the existing Video section on the landing v2 gets the phrase "video generation API" in its H2/meta.

### W6 — Hygiene **[approved]**
- `/alternatives/hcti-io` (pos 7.3, top alternatives URL) 301s to the index → point at `/alternatives/html-css-to-image`; audit the other legacy alternative slugs. (Sent to implementation.)
- Brand query "pictify ai" fell 4 → 0 clicks: confirm the v2 homepage title keeps "Pictify" prominent.
- No email-delivery claims anywhere (constraint outranks the copy freeze on ranked surfaces).

### Deferred / not pursued
- image-to-html 2,400 KD7, picture to html code 1,000 KD8 (nobody owns it) — cheap blog/tool page, not approved yet.
- generate banner 6,600 KD14 (Bannerbear pos 16 only) — possible `/tools/banner-generator`; not approved yet.
- **Don't chase:** wayback/archive (urlbox), Chrome-extension screenshots, video→mp3/downloaders (shotstack), "image to video" AI animation (27k, Adobe/Canva), Santa/celebrity personalized video, Claude/ffmpeg install content.

## 2. Sequence
1. W6 hcti-io redirect (minutes) — with the /alternatives restyle already queued.
2. W1 full-page mode (frontend + one-line backend) — queued after pricing/alternatives/integrations in the implementation session.
3. W3 canonical split (config + internal links; no design).
4. W2 certificate copy + templates + links (content).
5. W4 html-to-mp4 tool (backend capability check → board → route).
6. W5 docs page + blog post + landing H2.
7. W7 MCP docs page, skills page, Puppeteer MCP post.
8. W8 Tier 1 use-case pages (batch of 6), then receipt + bar chart.

## 3. Measurement
Weekly GSC, page level: url-to-image-generator, certificate-generator, html-to-image, html-to-png, html-to-mp4 (once live), docs video page. Review at week 4 and week 8 against the success numbers above. Re-run the DataForSEO competitor pull monthly (≈$0.50).

## W7 — AI-agent / MCP cluster (researched 2026-08-22, awaiting approval)

**Finding:** there is no demand-side "use case" cluster yet — "ai agent pdf generation", "agent generate pdf", "ai agent screenshot", "html to image mcp", "mcp server for images", "ai generate og image" all return 0–30 searches/month. The demand sits one layer up, at the *tooling* keywords, and Pictify ranks for none of them today:

| Keyword | Vol | KD | CPC | Who owns it |
|---|---|---|---|---|
| claude skills | 40,500 | 34 | $6.92 | Anthropic docs, Reddit, listicles (dev.to, Medium, welcomedeveloper) |
| playwright mcp | 14,800 | 19 | — | Microsoft's product — not ours |
| agent skills | 8,100 | 72 | — | too hard |
| best mcp servers | 880 | 14 | $8.86 | mcpservers.org, Medium, Reddit, Red Hat, GitHub awesome-list |
| mcp servers list | 880 | 34 | $21 | same |
| puppeteer mcp | 880 | 11 | $7.96 | pptr.dev, a GitHub server, pulsemcp, mcp.so |
| mcp server examples | 720 | 24 | $6.61 | — |
| cursor mcp server | 720 | 15 | $19 | — |
| claude agent skills | 720 | 50 | $6.24 | — |
| n8n ai agent | 1,900 | 37 | $17 | n8n itself (4 of top 5) |
| zapier ai agent | 390 | 21 | $10 | Zapier |
| how to build mcp server | 320 | 3 | $7.76 | modelcontextprotocol.io, Medium, builder.io |
| mcp server tutorial | 210 | 2 | $4.88 | — |
| claude generate image | 210 | — | $7.31 | — |
| image generation api / ai image generation api | 170 / 140 | 20 / 14 | — | — |
| mcp image / pdf mcp server / mcp pdf | 140 / 50 / 50 | 5 / 1 / 7 | — | — |

Pictify has assets that fit: a hosted MCP server (PostHog-instrumented, both transports), the `pictify-agent-skills` repo, and the agents hub (`/tools` MCP agents picker from PR #35).

**Plays (cheapest first):**
1. ~~Directory listings~~ — already done (Pictify is listed on the major MCP/skills directories; mcpservers.org's skills category already ranks for "pictify skills"). Keep the listings current when the MCP tool list changes; nothing else to do.
2. **One docs page per keyword the docs can own outright** (KD ≤ 7): "Pictify MCP server — render images, PDFs and screenshots from Claude, Cursor and n8n" targeting *mcp image · pdf mcp server · mcp pdf · screenshot mcp*, with setup blocks for Claude Desktop, Claude Code, Cursor (cursor mcp server 720) and n8n. Plus a "How to build an MCP server that renders images" tutorial (how to build mcp server 320 KD3, mcp server tutorial 210 KD2) — Pictify's own server as the worked example.
3. **Skills page for the 40k term** — a `/skills` page (or docs section) titled "Claude skills for images, PDFs and video" listing the `pictify-agent-skills` skills with install commands. "claude skills" KD34 is winnable for a *specific* angle, not the head term; target "claude skills for …" long-tails and let the head term come via AI citation.
4. **Puppeteer MCP angle** — "Puppeteer MCP server for screenshots and PDFs — self-hosted vs hosted (Pictify)" as a blog post; the ranking GitHub server is archived (Reddit #3 says so), which is the opening.

**Not pursued:** playwright mcp (Microsoft), agent skills (KD72), n8n/zapier ai agent (platform-owned), generic "ai automation tools"/"ai workflow automation" (software listicles, $24–43 CPC but not our product).

Success: docs MCP page ≥150 clicks/mo by week 8; "claude skills for images" family ≥100 clicks/mo by week 12.

## W8 — Use-case generator cluster (researched 2026-08-22) **[approved]**
Most of these are KD 0–10 and fit the existing `[usecase]` template route + template agent. Pictify ranks for almost none today.

**Tier 1 (KD ≤10; do first):**
- quotation generator 3,600 KD0 / quote generator 3,600 KD20 — new `/tools/quotation-generator`, sibling of invoice.
- badge maker 2,900 KD0 — `/tools/badge` exists: retitle H1/title to "Badge Maker", add "badge maker" to H2/FAQ.
- name tag generator 1,900 KD0 — new.
- id card maker 1,600 KD2 / id card generator 1,600 KD10 / student id card generator 210 KD0 — new `/tools/id-card-generator`.
- ticket maker 880 KD0 / ticket generator 390 KD6 / event ticket generator 50 KD1 — new `/tools/ticket-generator`.
- gift card generator 720 KD0 · coupon generator 260 KD5 — new.
- linkedin banner maker 260 KD9 / generator 260 KD8 — page exists at pos 51: fix title/H2 phrasing.
- membership card maker 110 KD1 — retitle existing page.
- tweet to image 210 KD0 — add phrasing to tweet-screenshot.
- diploma generator 110 KD13 · award certificate maker 90 KD22 — fold into W2 certificate page as H2s or variant URLs.

**Tier 2 (volume, moderate KD):**
- receipt maker 12,100 KD35 / receipt generator 6,600 KD28 / fake receipt generator 720 KD28 — resurrect `/tools/receipt-generator` (was purged → 301 to invoice in Aug). Own page, own copy.
- bar chart generator 18,100 KD25 / chart generator 880 KD50 — new `/tools/bar-chart-generator` (HTML + Chart.js rendered to PNG/SVG); cheap on our stack, no SERP incumbent renders to a URL.
- label generator 1,900 KD21 / label maker online 1,000 KD19 — new.

**Tier 3 (big, hard — after Tier 1–2 prove out):**
- invoice generator 135,000 KD50 / free invoice generator 33,100 KD50 / invoice maker 14,800 KD62 — `/tools/online-invoice-generator` does not rank; consumer SERP (Invoice Simple, Zoho, Wave). Needs a template-first page + links; revisit in Q4.

**Skip:** youtube thumbnail maker (KD44, Canva), menu maker (KD43), pricing card (KD58), social media image generator (KD64).

Execution pattern per new page: one `useCases` entry (copy via `/writing-aeo-content`, no email-delivery claims) + 3–5 templates from the template agent + tools-hub card + related-tool links. Each Tier 1 page is ~half a day. Hub: the tools hub grows by 6–8 cards — add a fifth section "DOCUMENTS & CARDS" rather than widening rows.

Success: Tier 1 pages ≥30 clicks/mo each by week 8; receipt ≥150/mo; bar chart ≥200/mo by week 12.
