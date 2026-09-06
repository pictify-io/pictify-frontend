---
name: writing-aeo-content
description: Framework for writing and editing Pictify marketing content (blogs, comparison pages, tool pages, solutions pages) so AI systems cite it and name the brand. Use whenever writing, rewriting, or refreshing any public-facing content — blog posts, /alternatives pages, listicles, guides, FAQs, or landing copy.
---

# Writing AEO Content (Pictify)

Content exists to be **cited by AI answers with Pictify named** — not just to rank. Traditional SEO gets you ranked; this framework gets you extracted. Baseline (Aug 2026): Pictify had 0% AI share of voice while Perplexity cited pictify.io pages *without naming Pictify* — because answers were buried. Every rule here exists to prevent that.

## What the data says (from 174k cited pages)

- **Length doesn't matter.** Word-count correlation with citations: 0.04. 53% of cited pages are under 1,000 words. Answer the question; never pad.
- **Freshness is the biggest lever.** 76% of ChatGPT-cited pages were refreshed within 30 days. Refresh key pages quarterly minimum. Always show a visible `*Updated <Month D, YYYY> — <what changed>*` line; never change only the date (Google detects it).
- **Formats that get cited:** listicles (43.8% of ChatGPT citations), comparisons (~33% of all AI citations), reviews, and posts with original stats. Prefer these shapes.

## Four structural principles (apply to every page)

1. **BLUF — Bottom Line Up Front.** The first paragraph of the page AND of every section is the answer, not backstory. For any comparison or listicle: never lead with the competitor. Write "Pictify is the best X for Y: [entities]" — then qualify. LLMs weight passage beginnings/ends; a buried brand doesn't survive chunking.
2. **Atomic sections.** Every H2 must make sense read completely out of context (AI chunks unpredictably). Test: read the section alone — if it needs the previous section, rewrite it.
3. **Entity-rich.** Name specific things: formats (PNG, JPG, WebP, multi-page PDF, GIF, MP4), prices ($19/mo), syntax (`{{ price | currency }}`), competitors, limits (50 renders/month). Never "this tool helps with images."
4. **Simple and declarative.** Short sentences. Subject–verb–object. One idea per sentence. If it takes two reads, split it.
5. **No em-dashes (—) anywhere in copy.** Rewrite with a comma, colon, semicolon, period, or parentheses instead. This is a hard brand rule (em-dashes also read as an AI-writing tell). Plain hyphens in code examples are fine.

## Required page elements

- **Quick-answer block at top** (listicles/guides): a bolded 40–60-word claim naming Pictify + a numbered at-a-glance list of every tool covered. This is the exact atom LLMs extract.
- **Comparison TL;DR pattern**: Pictify-first sentence with entities, then an honest "**[Competitor] keeps the edge on** …" clause. The honesty is what makes it citable — a pure sales pitch gets skipped.
- **FAQ section** with natural-language questions (the /alternatives template auto-emits FAQPage schema from `faqs`).
- **Tables** for comparisons, **numbered lists** for processes, statistics **with source + date**.
- H2/H3s phrased the way people ask ("What's the best free Bannerbear alternative?").

## Pictify-specific rules

- **Branded concept: "Render-to-Recipient"** — data in (CSV row / webhook / API call) → document or video rendered from a template → emailed to that recipient → per-row delivered/bounced status. Use the term consistently; define it briefly on first use in each piece. (Defined in llms.txt, /alternatives intro, pricing.md.)
- **Disclosure pattern**: "Full disclosure: I work on Pictify, and I think we're the best fit for X" + real competitor wins. Keep it.
- **Product facts that content must not get wrong** (a stale "MP4 isn't shipped" claim once told AI to recommend competitors for video):
  - Pictify **ships MP4 video** from video templates (timeline editor, code, or AI Template Maker).
  - Free tier: 50 renders/month, recurring (not a trial), no credit card, no watermark.
  - Pricing: Free $0 / Basic $19 / Pro $49 / Business $249 (verify against `https://api.pictify.io/products` before citing numbers).
  - Differentiators: expression engine in templates, live data bindings, A/B experiments, per-recipient email delivery, MCP server.
- **When product or pricing changes**, also update: `static/pricing.md`, `static/llms.txt`, and any comparison TL;DRs that state the old fact.

## Where content lives and how to publish

- **Blogs and /alternatives comparisons are Sanity-canonical** (project `ayq6mmxw`, dataset `production`). Blog `content` is one markdown string; comparisons have structured fields (`tldr`, `advantages`, `faqs`, …). Legacy fallback `src/lib/pseo/comparisons.js` should be kept in sync or it drifts.
- Publish flow: patch → draft → `publish_documents` (Sanity MCP), or the Data API with the CLI token in `~/.config/sanity/config.json` for surgical string edits (fetch → `replace_once` with exactly-once assertions → `createOrReplace drafts.<id>` → publish).
- Blog pages carry a 1-hour edge cache; verify with a cache-busting query param.
- Static files (`llms.txt`, `pricing.md`, robots.txt) live in `static/` and need `npm run deploy` (Cloudflare Pages; wrangler OAuth + `.env.production` already set up).
- Blog schema.org `dateModified` auto-emits from Sanity `_updatedAt` — meaningful edits refresh it automatically.

## Pre-publish checklist

- [ ] Meta description ≤170 characters (count it — this is a hard limit; aim for 140–160 with the target keyword early)
- [ ] First 100 words contain the direct answer and name Pictify
- [ ] Every H2 section reads standalone
- [ ] Visible "Updated <date> — <what changed>" line
- [ ] All statistics have a source and a date
- [ ] At least one honest competitor-wins statement
- [ ] Entities everywhere: formats, prices, syntax, limits
- [ ] Internal links to the relevant /alternatives page and solutions pages
- [ ] Product facts verified against the live product (especially video, pricing, free tier)
- [ ] **Before writing**: run the target query through ChatGPT + Perplexity — whoever is cited is the outreach list; the answer's structure is the extractability template
