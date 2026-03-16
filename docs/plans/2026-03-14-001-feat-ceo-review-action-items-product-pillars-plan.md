---
title: "feat: CEO Review Action Items — Product Pillars, Cuts & Delight Features"
type: feat
status: completed
date: 2026-03-14
deepened: 2026-03-14
---

## Enhancement Summary

**Deepened on:** 2026-03-14
**Sections enhanced:** 6 (ESP guides, Gmail caching, AI resize, security, performance, copy-as-code)
**Research agents used:** best-practices-researcher (x3), security-sentinel, performance-oracle, code-simplicity-reviewer

### Key Improvements
1. **ESP Integration Guides** — Added verified merge tag syntax for Mailchimp, SendGrid, Klaviyo, HubSpot with gotchas
2. **Gmail Image Proxy** — Documented caching behavior, geolocation limitations, and workarounds
3. **Copy-as-Code Security** — Added XSS sanitization requirements for user-controlled variable values
4. **Performance Insights Caching** — Specified LRU cache with 5-min TTL for experiment data query

### New Considerations Discovered
- Gmail proxy breaks IP-based geolocation — must pass city via merge tags, not rely on request IP
- Mailchimp has no built-in CITY tag — requires custom merge field creation
- Copy-as-code must HTML-entity-encode variable values to prevent XSS in generated `<img>` tags
- AI resize should parallelize LLM calls for multiple target sizes (not sequential)

---

# CEO Review Action Items — Product Pillars, Cuts & Delight Features

## Overview

Implement all 9 action items from the CEO product review of Pictify.io's feature deck. These changes sharpen product positioning from "dynamic image generation platform" toward "visual content operating system for growth teams" by elevating core pillars, cutting distractions, and adding delight features.

## Problem Statement / Motivation

Pictify has 27+ feature areas but no clear product hierarchy. Video rendering dilutes focus, Dynamic Links are buried as a sub-tab, email personalization is an unrealized use case, and the AI copilot doesn't leverage performance data. The CEO review identified concrete actions to sharpen positioning and create competitive moats.

## Action Items Summary

| # | Action | Type | Priority | Effort |
|---|--------|------|----------|--------|
| 1 | Cut Video Rendering (Remotion) | CUT | P1 | S |
| 2 | Dynamic Links Landing Page | BUILD | P1 | M |
| 3 | Email Personalization Pillar | BUILD | P1 | L |
| 4 | Copy as Code Snippets | BUILD | P2 | S |
| 5 | AI-Powered Multi-Platform Resize | BUILD | P2 | L |
| 6 | Evolve AI Copilot (Performance-Aware) | BUILD | P2 | L |
| 7 | Hide Background Removal from Marketing | CUT | P3 | XS |
| 8 | Instrument Experiment Usage Tracking | BUILD | P2 | M |
| 9 | Preview in Context (Backlog) | BACKLOG | P3 | M |

---

## Phase 1: Cuts & Quick Wins (Items 1, 4, 7)

### 1.1 CUT Video Rendering (Remotion)

**Why:** Video is a different product for a different buyer. Every hour on video is an hour not on the image moat. Remotion adds significant backend complexity (separate queue, renderer, bundler, compositions directory).

**Frontend Changes:**

- `src/routes/+page.svelte` / `src/lib/components/landingPage/HowItWorks.svelte`:
  - Remove "video" from format lists (change "PNG, JPG, WebP, GIF, PDF, or video" to "PNG, JPG, WebP, GIF, or PDF")

- `src/lib/components/landingPage/IntegrationsEcosystem.svelte`:
  - Remove any video-related integration mentions

- `src/lib/seo/metadata/templates.js`:
  - Remove video format references from SEO metadata

- Search all frontend files for "video", "remotion", "mp4", "webm" references and remove/update

**Backend Changes:**

- `routes/video-render.js` — Remove entirely
- `routes/video-template.js` — Remove entirely
- `service/video-renderer.js` — Remove entirely
- `service/video-render-queue.js` — Remove entirely
- `models/VideoTemplate.js` — Remove entirely
- `remotion/` directory — Remove entirely
- `server.js` — Remove video route registration
- `package.json` — Remove `@remotion/bundler`, `@remotion/renderer`, `@remotion/cli` dependencies

**Worktree cleanup:**
- The `dynamic-video` worktree at `.claude/worktrees/dynamic-video/` contains unreleased video editor UI. Leave the worktree as-is (it's git-managed) but do not merge it.

**Acceptance Criteria:**
- [x] No references to "video", "remotion", "mp4", "webm" in frontend marketing/landing pages
- [x] Backend video routes, services, models, and remotion directory removed
- [x] Backend starts cleanly without video dependencies
- [x] Frontend builds without errors

---

### 1.2 BUILD "Copy as Code" Snippets

**Why:** Developers need ready-to-paste integration code. Currently they manually construct URLs. This is a 1-hour delight feature with massive DX impact.

**Location:** `src/routes/dashboard/template/[uid]/render/+page.svelte` (render results area)

**Implementation:**

Create new component `src/lib/components/render/CopyAsCode.svelte`:

```svelte
<!-- Props: imageUrl, templateUid, variables, format -->
<!-- Dropdown with copy-to-clipboard for each format -->
```

**Code snippet formats to support:**

1. **HTML `<img>` tag:**
```html
<img src="https://api.pictify.io/v1/render/TEMPLATE_UID?title=Hello" alt="Generated image" />
```

2. **React / Next.js:**
```jsx
<Image src="https://api.pictify.io/v1/render/TEMPLATE_UID?title=Hello" alt="Generated image" width={1200} height={630} />
```

3. **Markdown:**
```markdown
![Generated image](https://api.pictify.io/v1/render/TEMPLATE_UID?title=Hello)
```

4. **curl:**
```bash
curl -X POST https://api.pictify.io/api/template/TEMPLATE_UID/render \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"variables": {"title": "Hello"}}' \
  --output image.png
```

5. **JavaScript (fetch):**
```javascript
const response = await fetch('https://api.pictify.io/api/template/TEMPLATE_UID/render', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ variables: { title: 'Hello' } })
});
const blob = await response.blob();
```

6. **Python:**
```python
import requests
response = requests.post(
    'https://api.pictify.io/api/template/TEMPLATE_UID/render',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={'variables': {'title': 'Hello'}}
)
with open('image.png', 'wb') as f:
    f.write(response.content)
```

**UI Design (neobrutalist):**
- Dropdown button labeled "Copy as..." with `border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937]`
- Each option shows language icon + label
- On click: copies to clipboard + shows toast "Copied {format} snippet!"
- Track via `analytics.trackCopy({ type: 'code_snippet', format: 'react' })`

**Security — XSS Prevention in Generated Snippets:**
- Variable values are user-controlled and could contain `<script>`, `"`, `'`, etc.
- For HTML snippets: HTML-entity-encode all variable values in the generated `<img>` tag
- For URL params: use `encodeURIComponent()` on all variable values
- For JS/Python/curl snippets: JSON-stringify variable values (handles escaping)
- For Markdown: URL-encode the full src URL
- Implementation: create a `sanitizeForSnippet(value, format)` utility function

**Acceptance Criteria:**
- [ ] CopyAsCode component renders on render results page
- [ ] All 6 formats generate correct, working code with actual template UID and variables
- [ ] Copy to clipboard works with toast confirmation
- [ ] Analytics event fires on copy
- [ ] Neobrutalist design consistent with rest of app

---

### 1.3 HIDE Background Removal from Marketing

**Why:** AI background removal is a commodity. Keep it as an in-editor utility but stop marketing it.

**Changes:**

- `src/lib/components/landingPage/IntegrationsEcosystem.svelte`:
  - Remove "Background Removal" from the AI integrations grid

- `src/routes/+page.svelte` (or structured data):
  - Remove "Background removal" from schema.org featureList

- Keep untouched:
  - `src/lib/components/editor/PropertiesPanel.svelte` (in-editor button stays)
  - `src/lib/config/background-remover.js` (config stays)
  - Backend `routes/background-removal.js` (API stays)

**Acceptance Criteria:**
- [ ] Background removal not mentioned on landing page or marketing pages
- [ ] Background removal still works inside editor on image elements
- [ ] No broken references

---

## Phase 2: Product Pillars (Items 2, 3)

### 2.1 BUILD Dynamic Links Landing Page

**Why:** Dynamic Links is infrastructure-grade — images that auto-update from data sources. Elevating it to a pillar with its own landing page creates a standalone acquisition channel for e-commerce and dashboard use cases.

**Route:** `/dynamic-images` (new page)

**File:** `src/routes/dynamic-images/+page.svelte`

**Page Structure (follows landing page patterns from `src/lib/components/landingPage/`):**

1. **Hero Section** — "Images That Update Themselves"
   - Headline: "Connect your data. Your images stay fresh."
   - Subhead: "Dynamic Links pull live data from any API, database, or spreadsheet — and render a new image on every request. No cron jobs. No stale content."
   - Live demo: show a Pictify image URL updating in real-time (product price changing, dashboard metric updating)
   - CTA: "Try Dynamic Links Free" → signup

2. **Use Cases Grid** (3-4 cards):
   - **E-commerce**: Live product pricing, stock indicators, personalized recommendations
   - **Dashboards**: KPI snapshots for Slack/email, live metric images
   - **Email**: Open-time personalization (city, weather, countdown timers)
   - **Social Media**: Auto-updating social cards with live stats

3. **How It Works** (3 steps):
   - Step 1: Design your template in the visual editor
   - Step 2: Connect a data source (HTTP API, webhook, or static JSON)
   - Step 3: Get a live URL — every request renders fresh data

4. **Data Source Connectors** section:
   - REST APIs (any HTTP endpoint)
   - Webhooks (push-based updates)
   - Static JSON (manual data)
   - "Coming soon: Shopify, Airtable, Google Sheets"

5. **Live Demo / Interactive Example**:
   - Show a template with `{{product_name}}`, `{{price}}`, `{{discount}}`
   - Let user change the JSON data source
   - Render preview updates in real-time

6. **Pricing CTA** — "Included in Standard plan and above"

7. **FAQ Section** — How often do images refresh? What data sources are supported? Is there caching?

**SEO:**
- Title: "Dynamic Image Links — Auto-Updating Images from Live Data | Pictify"
- Description: "Create images that update automatically from APIs, databases, and webhooks. Perfect for e-commerce, dashboards, and personalized email."
- Add to sitemap
- Schema.org SoftwareApplication markup

**Landing Page Nav Update:**
- Add "Dynamic Images" to the main nav (`src/lib/components/landingPage/Nav.svelte`)
- Add to footer links

**Design:** Full neobrutalist — thick borders, shadows, `#ffc480` accent, `#FFFDF8` background, consistent with existing landing page sections.

**Acceptance Criteria:**
- [ ] `/dynamic-images` page renders with all sections
- [ ] Live demo/interactive example works
- [ ] SEO metadata, sitemap entry, schema markup
- [ ] Nav and footer links added
- [ ] Mobile responsive
- [ ] Analytics: page view tracking, CTA click tracking

---

### 2.2 BUILD Email Personalization Pillar

**Why:** Dynamic Links + Smart Links enable a magical email use case: embed a Pictify URL in any email, and the image personalizes at open-time based on recipient device, location, and time. This is a high-value wedge into e-commerce and SaaS marketing.

**Route:** `/email-personalization` (new page)

**File:** `src/routes/email-personalization/+page.svelte`

**Page Structure:**

1. **Hero Section** — "Personalized Images in Every Email"
   - Headline: "Each recipient sees a different image — personalized at open time"
   - Subhead: "Embed a single Pictify URL. When the email opens, the image renders with the recipient's name, city, device, local time, or live data. No ESP plugins needed."
   - Visual: animated mockup showing same email → different images for different recipients
   - CTA: "Start Personalizing Free"

2. **How It Works** (3 steps):
   - Step 1: Design your email image template with variables (`{{name}}`, `{{city}}`, `{{offer}}`)
   - Step 2: Build the image URL with merge tags from your ESP: `https://api.pictify.io/v1/render/TEMPLATE?name={{contact.first_name}}&city={{contact.city}}`
   - Step 3: Paste the URL as an `<img src="...">` in your email. Each open renders a unique image.

3. **Use Case Showcase** (4 cards):
   - **Personalized Greetings**: "Hey {{name}}, check out deals in {{city}}"
   - **Countdown Timers**: Live countdown to sale end (renders current time at open)
   - **Live Pricing**: Product price/availability at moment of email open
   - **Weather-Based**: Show weather-appropriate products based on recipient location

4. **ESP Integration Guides** (tabbed):

   ### Research Insights — Verified ESP Merge Tag Syntax

   | ESP | First Name | City | Example Image URL |
   |-----|-----------|------|-------------------|
   | **Mailchimp** | `*\|FNAME\|*` | `*\|CITY\|*` (custom field required) | `https://api.pictify.io/v1/render/TPL?name=*\|FNAME\|*&city=*\|CITY\|*` |
   | **SendGrid** | `{{ first_name }}` | `{{ city }}` | `https://api.pictify.io/v1/render/TPL?name={{ first_name }}&city={{ city }}` |
   | **Klaviyo** | `{{ first_name }}` | `{{ person.location.city }}` | `https://api.pictify.io/v1/render/TPL?name={{ first_name }}&city={{ person.location.city }}` |
   | **HubSpot** | `{{ contact.firstname }}` | `{{ contact.city }}` | `https://api.pictify.io/v1/render/TPL?name={{ contact.firstname }}&city={{ contact.city }}` |
   | **Generic** | ESP-specific | ESP-specific | Works with any ESP that supports merge tags in image URLs |

   **ESP-specific gotchas to document on page:**
   - **Mailchimp**: No built-in CITY tag — users must create a custom merge field in Audience settings
   - **SendGrid**: Double braces `{{ }}` are safe in HTML attributes (auto HTML-escaped). Variable names = keys in `dynamic_template_data` JSON
   - **Klaviyo**: `first_name` is a shorthand; all other profile properties need `person.` prefix. Use `|default:'Friend'` for fallback
   - **HubSpot**: Internal property names are always lowercase no-spaces (e.g., `firstname` not `first_name`). Must edit source code directly for img src personalization

   **Critical: Gmail Image Proxy Caching**
   - Gmail caches images per-URL via `googleusercontent.com` proxy
   - Personalized URLs (with merge tags) are unique per recipient = safe (each gets its own cache entry)
   - Same recipient opening twice = stale image (countdown timers show time of first open)
   - **IP-based geolocation is broken** — Gmail proxy IP != recipient IP. Always pass city via merge tags, never rely on request IP
   - Render must complete in <2-3 seconds or Gmail proxy times out → broken image icon

   Each guide shows:
   - Merge tag syntax for that ESP
   - Example Pictify URL with merge tags
   - Step-by-step: where to paste in the ESP's email builder
   - Screenshot/mockup of the ESP UI
   - Default/fallback value syntax for that ESP

5. **Email-Specific Templates** section:
   - Countdown timer template
   - Personalized banner template
   - Live pricing card template
   - Weather widget template
   - "Recommended for you" product grid template

   Each with "Use this template" CTA → editor

6. **Technical Details**:
   - "No JavaScript required — works in every email client"
   - "Images are rendered server-side as PNG/JPG"
   - "Caching: first render cached for 60s, then re-renders with fresh data"
   - "Fallback: if a variable is missing, shows default value"

7. **Pricing CTA** — "Free plan: 50 personalized images/month. Standard+: unlimited."

8. **FAQ**:
   - Does this work in all email clients? (Yes — it's just an `<img>` tag)
   - How fast is the rendering? (<500ms for most templates)
   - Can I A/B test email images? (Yes — use Experiments with Smart Links)
   - What about image caching by email clients? (We set appropriate cache headers)

**Backend Support:**
- Public render endpoint already supports URL query params as variables (`routes/public-render.js`)
- Smart Links already extract geo + device context (`service/request-context.js`)
- No new backend work needed — this is a marketing/education page leveraging existing infrastructure

**SEO:**
- Title: "Email Image Personalization — Dynamic Images for Email Marketing | Pictify"
- Description: "Personalize email images at open time. Show each recipient their name, city, countdown timer, or live pricing — no ESP plugins needed."
- Add to sitemap
- Schema.org markup

**Nav/Footer:** Add "Email Personalization" to nav and footer

**New email-specific starter templates (backend):**
- Create 5 public templates optimized for email use cases:
  - `email-countdown-timer` — Shows hours:minutes:seconds until a configurable end date
  - `email-personalized-banner` — "Hey {{name}}!" with city-based background
  - `email-live-pricing` — Product card with {{price}}, {{discount_pct}}, {{product_name}}
  - `email-weather-widget` — Weather icon + temp for {{city}}
  - `email-product-recommendation` — Grid of 3 product images with names/prices

**Acceptance Criteria:**
- [ ] `/email-personalization` page renders with all sections
- [ ] ESP integration guides show correct merge tag syntax for 4+ ESPs
- [ ] Email-specific templates exist and are accessible from the page
- [ ] Live demo showing personalization in action
- [ ] SEO metadata, sitemap entry
- [ ] Nav and footer links added
- [ ] Mobile responsive
- [ ] Analytics tracking

---

## Phase 3: Intelligence Features (Items 5, 6, 8)

### 3.1 BUILD AI-Powered Multi-Platform Resize

**Why:** Users design for one platform (e.g., Instagram 1080x1080) then need the same design for LinkedIn, Twitter, OG, etc. Naive resizing breaks layouts. AI-powered resize understands element relationships and repositions intelligently.

**Architecture:**

This leverages the existing copilot infrastructure. The flow:

1. User clicks "Resize for..." button in editor TopBar
2. Modal shows target platform presets (Instagram, LinkedIn, Twitter/X, YouTube, OG, Pinterest, Facebook, Custom)
3. User selects one or more target sizes
4. For each target size, the system:
   a. Takes current canvas state (FabricJS JSON)
   b. Sends to copilot with a specialized resize prompt
   c. AI analyzes element positions, sizes, and relationships
   d. AI returns modified canvas state with repositioned elements
   e. Creates a new template with the resized layout (or offers to replace current)

**Frontend:**

New component: `src/lib/components/editor/ResizeModal.svelte`

```
Props: currentCanvasState, currentWidth, currentHeight
Events: on:resize (newCanvasState, newWidth, newHeight)
```

Platform presets (from existing render page):
```
Instagram Post: 1080x1080
Instagram Story: 1080x1920
Facebook Post: 1200x630
LinkedIn Post: 1200x627
Twitter/X Post: 1200x675
YouTube Thumbnail: 1280x720
OG Image: 1200x630
Pinterest Pin: 1000x1500
Custom: user-defined
```

UI flow:
1. Grid of platform cards with checkbox selection
2. "Resize with AI" button (shows copilot loading state)
3. Preview of each resized version
4. "Save as new template" or "Replace current"

**Backend:**

New endpoint or extend existing copilot:

`POST /copilot-simple/resize` (or add a `mode: 'resize'` to existing generate-stream)

System prompt for resize:
```
You are a design-aware layout engine. Given a FabricJS canvas state at {currentWidth}x{currentHeight},
intelligently reposition and resize all elements to fit {targetWidth}x{targetHeight}.

Rules:
- Maintain relative visual hierarchy (largest element stays largest)
- Keep text readable (minimum font size 12px)
- Maintain padding/margins proportionally
- Center-align elements that were centered
- Stack elements vertically if horizontal space is insufficient
- Scale images proportionally, never stretch
- Keep elements within canvas bounds with at least 5% padding
- Return complete FabricJS JSON
```

**Feature Gating:** Gated behind `FEATURES.AI_COPILOT` (same as copilot). Counts toward copilot quota.

**Acceptance Criteria:**
- [ ] ResizeModal component with platform preset grid
- [ ] AI resize produces usable layouts for all presets
- [ ] Generated layouts maintain visual hierarchy and readability
- [ ] Can save as new template or replace current
- [ ] Feature-gated behind AI copilot plan limits
- [ ] Loading state shows resize progress
- [ ] Analytics: track resize usage per platform

---

### 3.2 EVOLVE AI Copilot — Performance-Aware Generation

**Why:** The copilot currently generates templates from scratch. The 10-star version understands your brand assets AND your winning experiment data to suggest designs that will perform. This creates a flywheel: more experiments → smarter AI → better images → more experiments.

**Architecture:**

Extend the copilot's context with two new data sources:

1. **Brand Assets Context** (already partially implemented):
   - `CopilotPanel.svelte` already fetches brand assets and passes to copilot
   - Enhance: include color palette, font preferences, logo URLs in system prompt

2. **Performance Data Context** (new):
   - Fetch top-performing experiment variants for the team
   - Extract winning patterns: colors, layouts, font sizes, CTAs
   - Include as "performance insights" in system prompt

**Backend Changes:**

`service/copilot-simple.js` — Extend system prompt context:

```javascript
// New: Fetch team's experiment performance data
async function getPerformanceInsights(teamId) {
  const experiments = await Experiment.find({
    teamId,
    status: 'completed',
    'variants.impressions': { $gt: 100 }
  }).sort({ updatedAt: -1 }).limit(10);

  const insights = experiments.map(exp => {
    const winner = exp.variants.reduce((a, b) =>
      (a.clicks / a.impressions) > (b.clicks / b.impressions) ? a : b
    );
    return {
      experimentName: exp.name,
      winningVariantName: winner.name,
      conversionRate: (winner.clicks / winner.impressions * 100).toFixed(1) + '%',
      // Extract design patterns from winning variant's template
      templateUid: winner.templateUid
    };
  });

  return insights;
}
```

Add to system prompt:
```
## Performance Insights from Your A/B Tests
Your team has run experiments. Here are patterns from winning variants:
{{performanceInsights}}

Use these patterns to inform your design choices. Prefer colors, layouts,
and styles that have proven to convert well for this team.
```

**Frontend Changes:**

`src/lib/components/editor/CopilotPanel.svelte`:
- Add a toggle: "Use performance insights" (default: on)
- When enabled, pass `includePerformanceData: true` to the API
- Show a small badge: "AI enhanced with your experiment data"

`src/api/copilot-simple.js`:
- Add `includePerformanceData` param to `streamCopilotGenerate()`

**Acceptance Criteria:**
- [ ] Backend fetches team's experiment performance data
- [ ] Performance insights included in copilot system prompt when enabled
- [ ] Frontend toggle to enable/disable performance insights
- [ ] Badge indicates when AI is using performance data
- [ ] Copilot suggestions visibly influenced by winning patterns
- [ ] Feature-gated: performance insights only for teams with completed experiments
- [ ] No performance regression on copilot response time (insights fetched in parallel)

---

### 3.3 INSTRUMENT Experiment Usage Tracking

**Why:** Experiments could be Pictify's flagship differentiator. We need detailed usage data to know when to pull the trigger on repositioning.

**Frontend Tracking Events (via `src/lib/analytics.js`):**

Add these new tracking helpers:

```javascript
// Experiment lifecycle
trackExperimentCreated: (type, variantCount) => track('experiment_created', { type, variant_count: variantCount }),
trackExperimentStarted: (type, uid) => track('experiment_started', { type, uid }),
trackExperimentPaused: (type, uid) => track('experiment_paused', { type, uid }),
trackExperimentCompleted: (type, uid, winnerDeclared) => track('experiment_completed', { type, uid, winner_declared: winnerDeclared }),

// Experiment engagement
trackExperimentViewed: (type, uid) => track('experiment_viewed', { type, uid }),
trackExperimentAnalyticsViewed: (uid) => track('experiment_analytics_viewed', { uid }),
trackExperimentVariantAdded: (type) => track('experiment_variant_added', { type }),
trackExperimentRuleAdded: (ruleType) => track('experiment_rule_added', { rule_type: ruleType }),

// Feature discovery
trackExperimentFeatureDiscovered: (source) => track('experiment_feature_discovered', { source }), // nav, dashboard, landing_page, nudge
trackAutoOptimizeEnabled: (uid) => track('auto_optimize_enabled', { uid }),
trackSmartLinkRuleConfigured: (ruleType) => track('smart_link_rule_configured', { rule_type: ruleType }),

// Experiment wizard
trackExperimentWizardStep: (step, type) => track('experiment_wizard_step', { step, type }),
trackExperimentWizardAbandoned: (step, type) => track('experiment_wizard_abandoned', { step, type }),
trackExperimentWizardCompleted: (type) => track('experiment_wizard_completed', { type }),
```

**Where to add tracking calls:**

| Event | File | Location |
|-------|------|----------|
| `experiment_created` | `src/routes/dashboard/experiments/create/+page.svelte` | On successful creation |
| `experiment_created` (smart_link) | `src/routes/dashboard/experiments/create/smart-link/+page.svelte` | On creation |
| `experiment_created` (scheduled) | `src/routes/dashboard/experiments/create/scheduled/+page.svelte` | On creation |
| `experiment_started` | `src/routes/dashboard/experiments/[uid]/+page.svelte` | On status change to running |
| `experiment_viewed` | `src/routes/dashboard/experiments/[uid]/+page.svelte` | On page load |
| `experiment_analytics_viewed` | `src/routes/dashboard/experiments/[uid]/+page.svelte` | On analytics tab click |
| `experiment_feature_discovered` | `src/lib/components/dashboard/SideNav.svelte` | On experiments nav click |
| `experiment_wizard_step` | All create pages | On step transitions |
| `auto_optimize_enabled` | A/B test create page | On toggle |

**Backend Tracking (optional, for server-side events):**

Add to `routes/experiments.js`:
- Log experiment creation/start/pause/complete to audit log (already exists via audit middleware)
- Add experiment type to audit metadata

**Acceptance Criteria:**
- [ ] All experiment lifecycle events tracked in PostHog
- [ ] Wizard funnel trackable (step progression + abandonment)
- [ ] Feature discovery sources identified
- [ ] Auto-optimize and smart link rule configuration tracked
- [ ] No duplicate events
- [ ] Events follow existing snake_case naming convention

---

## Phase 4: Backlog (Item 9)

### 4.1 BACKLOG — Preview in Context

**Why:** When users render an image, show it embedded in mock LinkedIn posts, Twitter cards, email inboxes, or OG previews. Makes the product feel polished and helps users evaluate their images.

**Deferred rationale:** Good delight feature but lower impact than pillars. Queue for a future sprint.

**When to build:** After Dynamic Links and Email Personalization pillars ship.

**Sketch:**
- New component: `src/lib/components/render/PreviewInContext.svelte`
- Tab on render results page: "Preview in context"
- Mock frames: LinkedIn post, Twitter card, Email inbox (Gmail), OG preview (Google search result, Slack unfurl)
- Pure CSS mockups — no actual API calls

---

## Technical Considerations

### Architecture Impact
- **No new backend services** for phases 1-2 (cuts + landing pages are frontend-only)
- **Phase 3** adds minimal backend: resize endpoint (extension of copilot), performance insights query, and tracking events
- **No new database models** required
- **No migrations** required

### Performance
- Landing pages are static marketing pages — no performance concerns
- Copilot performance insights query should be cached (5-min TTL LRU, keyed by teamId) to avoid hitting DB on every copilot call
- Resize operations use copilot quota — existing rate limiting applies
- **AI resize parallelization**: When user selects multiple target sizes, fire LLM calls in parallel (Promise.all), not sequentially. Expected latency: ~3-5s per resize, parallelized = ~5s total for any number of sizes
- **PostHog event volume**: 15+ new events is fine — PostHog handles millions of events. Use `analytics.track()` wrapper which already batches client-side
- **Email personalization page**: No heavy client deps needed. Interactive demo can use a simple fetch to public render endpoint with debounced input

### Security
- No new attack surfaces (landing pages are public, copilot already authenticated)
- Performance insights endpoint must scope to team — no cross-team data leakage
- Copy-as-code snippets must sanitize template UIDs and variable values to prevent XSS

### Deployment
- All changes can ship incrementally — no feature flags needed
- Phase 1 (cuts) ships first to reduce codebase complexity
- Phase 2 (pillars) can ship in parallel
- Phase 3 (intelligence) depends on phase 1 copilot cleanup

---

## Implementation Order

```
Week 1: Phase 1 — Cuts & Quick Wins
├── Day 1-2: Cut Video Rendering (backend + frontend cleanup)
├── Day 2: Hide Background Removal from marketing
└── Day 2-3: Build Copy as Code snippets

Week 2: Phase 2 — Product Pillars
├── Day 1-3: Dynamic Links Landing Page
└── Day 3-5: Email Personalization Landing Page + ESP guides

Week 3: Phase 3 — Intelligence Features
├── Day 1-2: Instrument Experiment Usage Tracking
├── Day 2-4: AI-Powered Multi-Platform Resize
└── Day 4-5: Evolve AI Copilot (Performance-Aware)
```

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Video code removed | 0 references | grep for remotion/video |
| Dynamic Links page traffic | >100 visits/week within 30 days | PostHog page views |
| Email Personalization page traffic | >100 visits/week within 30 days | PostHog page views |
| Copy-as-code usage | >50 copies/week | PostHog `copy` events with `type: code_snippet` |
| AI resize adoption | >20 uses/week | PostHog resize events |
| Experiment tracking coverage | 100% of lifecycle events | PostHog event audit |

---

## Sources & References

### Internal References
- Landing page patterns: `src/lib/components/landingPage/` (27 components)
- Tool page patterns: `src/routes/tools/[usecase]/+page.svelte`
- Render page: `src/routes/dashboard/template/[uid]/render/+page.svelte`
- Copilot: `src/api/copilot-simple.js`, `src/lib/components/editor/CopilotPanel.svelte`
- Dynamic Links: `src/routes/dashboard/template/[uid]/dynamic/+page.svelte`
- Analytics: `src/lib/analytics.js`
- Video routes: `routes/video-render.js`, `routes/video-template.js`
- Background removal landing ref: `src/lib/components/landingPage/IntegrationsEcosystem.svelte`
- Experiments: `src/routes/dashboard/experiments/`

### Plans
- Copilot plan: `docs/plans/2026-02-02-feat-state-of-the-art-canvas-copilot-plan.md`
- Experiments plan: `docs/plans/2026-02-28-feat-experiments-ab-test-smart-links-scheduling-auto-optimization-plan.md`
- Production readiness: `docs/plans/2026-03-07-audit-production-readiness-plan.md`
- Dynamic Links fixes: `docs/plans/2026-01-31-fix-dynamic-link-local-setup-plan.md`
