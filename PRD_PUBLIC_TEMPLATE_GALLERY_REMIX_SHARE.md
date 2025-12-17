## PRD: Public Template Gallery + Remix + Shareable Result Pages

### Owner / Stakeholders
- **Owner**: Growth PM / Product
- **Stakeholders**: Engineering (FE/BE), Design, Marketing/SEO, Data/Analytics, Support

### Status
- Draft v1

---

## 1) Problem statement
Today we generate a lot of value in one-off tool sessions (HTML→image, code→image, URL→image, invoice generator), but the product does not consistently convert that value into repeatable adoption of the core platform (templates → variables → API/batch automation).

Symptoms observed in product surface area:
- Users can generate assets but lack a **share/remix loop** that turns outputs/templates into distribution.
- Templates exist, but there is no first-class **public gallery + template detail pages** with “Use/Remix” CTAs.
- Post-generation flows are inconsistent; some TOFU pages route users into gated dashboards or unclear next steps.
- PLG state is split across FE inference and BE truth (risk of incorrect prompts/limits).

---

## 2) Goals (what success looks like)
### Primary goal
- Turn TOFU traffic into **Activated Workspaces**: users who **create or fork a template** and **render ≥3 variants** (API or batch) within 7 days.

### Secondary goals
- Create a durable distribution engine where:
  - Each template becomes an SEO-able landing page.
  - Each generated output can be shared as a branded, trackable page.
  - “Remix” creates compounding template growth (parent/child lineage).

---

## 3) Non-goals (explicitly out of scope for v1)
- Full marketplace with payments/rev-share for template creators.
- Team/org permissions (workspaces, roles) beyond basic ownership.
- Full-blown community moderation tooling.
- PDF support (separate initiative).

---

## 4) Target users / personas
- **Indie maker / developer**: wants OG images, docs cards, API response images; values copy-paste + SDK examples.
- **Marketing ops**: needs many variants of campaign creatives; values batch rendering + brand assets.
- **Content team**: wants consistent social assets; values gallery + remix.
- **Growth teams**: want programmatic visual production; values integrations + share pages.

---

## 5) Key concepts / definitions
- **Template**: reusable design with variables/conditions; can be rendered via API.
- **Public template**: template visible to anyone (read-only preview), with remix capability.
- **Remix/Fork**: user creates a copy of a public template into their account (sets lineage).
- **Result page**: a public, shareable page that renders and displays a generated output with metadata and CTAs.

---

## 6) User journeys (end-to-end)

### Journey A: Visitor → Template discovery → Remix → Render
1. Visitor lands on `/templates` (gallery).
2. Clicks a template card → `/templates/[uid]` (detail).
3. Clicks **Remix**.
4. If logged out: creates account or logs in (post-auth returns to remix).
5. Template opens in editor (prefilled). User tweaks and saves.
6. User renders 1 variant (preview) → sees **Batch render** and **Copy API**.

### Journey B: Visitor → Tool → Output → Share → Remix
1. Visitor uses `/tools/html-to-png/...` and generates output.
2. After generation, user sees:
   - Copy URL / Download
   - **Share** (creates result page)
   - **Save as template** (draft → editor)
3. Visitor shares result page; recipients click **Remix this template**.

---

## 7) Scope (v1 deliverables)

### 7.1 Public Template Gallery (SEO index)
- `/templates` becomes a real gallery:
  - Featured templates (curated)
  - Filters (category/type/tags)
  - Search
  - Sorting (featured/new/popular)
- Template cards show:
  - Thumbnail
  - Name
  - Category/type
  - Example use-case

### 7.2 Template Detail Page
- `/templates/[uid]` shows:
  - Large preview image / interactive preview (v1 can be static thumbnail)
  - Description + tags
  - Variables list (name/type/default/required)
  - “Copy API example” (render endpoint)
  - Primary CTA: **Remix**

### 7.3 Remix / Fork flow
- When user clicks Remix:
  - If authenticated → fork template into user account
  - If not → route to `/signup` with return URL; post-auth continues
- Fork behavior:
  - Creates new Template owned by user
  - Sets `parentTemplate` to original template UID
  - Increments usage metrics for source template

### 7.4 Shareable Result Pages
- After any generation in tools (and later: from dashboard):
  - Create a result record and return a URL like `/r/[id]` or `/results/[id]`
- Result page shows:
  - Rendered image/GIF
  - Basic metadata (format, size, createdAt)
  - Optional watermarking rules for guests (keep consistent with pricing policy)
  - CTAs: “Remix template”, “Create yours”, “Get API key”

### 7.5 Analytics + measurement
- Standardize PostHog events for:
  - `template_gallery_viewed`, `template_clicked`, `template_remix_clicked`, `template_fork_succeeded`
  - `tool_generation_succeeded`, `result_share_created`, `result_page_viewed`, `result_remix_clicked`
  - `template_render_succeeded`, `batch_started`, `batch_completed`

---

## 8) Requirements

### 8.1 Functional requirements
**Gallery**
- Public list endpoint supports pagination and filters.
- Gallery supports featured ordering.

**Detail**
- Public template detail endpoint returns metadata + variables + preview assets.

**Remix**
- Must be idempotent per click (avoid duplicates on double-click).
- Must preserve template content (fabric data + html + variables + tags).

**Result pages**
- Must be publicly accessible by URL.
- Must not leak private user data.
- Must support both images and gifs.

### 8.2 Non-functional requirements
- **Performance**: gallery and detail pages should be fast enough for SEO crawl.
- **Security**: public templates must not expose private templates; only `isPublic=true`.
- **Abuse prevention**: basic rate limiting for share creation; block list if needed.
- **Reliability**: share page must not break if the CDN asset is temporarily unavailable (show retry/fallback).

---

## 9) API & data model changes (backend)

### 9.1 Template model
Existing fields already present that enable this:
- `isPublic`, `isFeatured`, `featuredOrder`, `parentTemplate`, `version`, `usageCount`

**Add/clarify (if missing in schema or routes):**
- `publicDescription` (string)
- `publicSlug` (string, optional)
- `previewImageUrl` (string, optional; can reuse `thumbnail`)

### 9.2 New public template endpoints
- `GET /public/templates` (filters: tag, category, type, sort, page, limit)
- `GET /public/templates/:uid`
- `POST /public/templates/:uid/fork` (auth required)

### 9.3 Result pages
Create a `Result` model (or reuse existing Image/Gif with a “share token”):
- `uid`
- `contentType` (image|gif)
- `assetUrl`
- `width`, `height`, `format`
- `source` (tool|template|api)
- `templateUid` (optional)
- `createdBy` (nullable for guest)
- `createdAt`

Endpoints:
- `POST /public/results` (create share)
- `GET /public/results/:uid` (fetch metadata)

---

## 10) Frontend changes

### 10.1 Routes
- Update `/templates/+page.svelte` to real gallery UI.
- Add `/templates/[uid]/+page.svelte` template detail page.
- Add `/r/[id]/+page.svelte` (or `/results/[id]`) share result page.

### 10.2 Tool pages
- Ensure each public tool page includes:
  - `NextSteps` module
  - “Share result” CTA after generation
  - “Save as template” consistently

---

## 11) UX requirements (acceptance criteria)

### Gallery
- Users can browse featured templates without login.
- Gallery pages are crawlable, have title/description, and structured data where appropriate.

### Template detail
- Shows preview + variable list + Remix CTA.
- Remix requires login and returns user to editor with forked template.

### Share result
- After generation, user can create a share link in ≤1 click.
- Share page loads asset reliably and includes CTA to remix/create.

---

## 12) Metrics & targets

### Primary KPI
- **Activated Workspaces / week**: template fork/create + ≥3 renders in 7 days.

### Supporting KPIs
- Template gallery CTR → detail
- Detail → Remix click-through rate
- Remix success rate
- Tool generation → share link creation rate
- Share page views → signup conversion
- 7-day retention for users who forked a template

---

## 13) Experiment plan (quick wins)
- A/B: On tool completion, show “Share result” vs “Copy URL” first.
- A/B: Template detail page hero CTA “Remix” vs “Use template”.
- A/B: Gallery default sort featured vs popular.

---

## 14) Rollout plan
- **Phase 0 (internal)**: enable `isPublic` for a small curated set of templates; verify fork and share flows.
- **Phase 1 (public)**: launch `/templates` and share pages; add site links from homepage/tools.
- **Phase 2 (scale)**: expand template set, add more filters, improve previews.

---

## 15) Dependencies / risks

### Dependencies
- Backend endpoints for public templates + fork
- Result-share model/endpoints
- Analytics events defined and implemented consistently

### Risks
- Public templates could be abused for spam; mitigate with rate limits and featured-only v1.
- Share pages could leak sensitive content if created from private templates; mitigate by requiring explicit share creation and sanitizing metadata.
- Misaligned plan/PLG logic reduces trust; ensure PLG truth comes from backend.

---

## 16) Open questions
- URL structure preference: `/r/[id]` vs `/results/[id]` vs `/share/[id]`?
- Do we allow sharing outputs generated via API by default, or only through explicit action in dashboard?
- Do we allow guest share links? If yes, what rate limits and watermark policy?
