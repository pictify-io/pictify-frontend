---
title: "feat: pSEO Tools Pages Overhaul — Top-of-Funnel Conversion"
type: feat
status: active
date: 2026-03-15
deepened: 2026-03-15
mode: SCOPE EXPANSION
---

# feat: pSEO Tools Pages Overhaul — Top-of-Funnel Conversion

## Enhancement Summary

**Deepened on:** 2026-03-15
**Agents used:** Performance Oracle, Frontend Races Reviewer, Security Sentinel, Code Simplicity Reviewer, Best Practices Researcher
**Framework docs:** FabricJS v6 (Context7), SvelteKit SSR patterns (Context7)

### Critical Fixes from Deepening

1. **MiniEditor must lazy-load FabricJS** — Dynamic `import('fabric')` inside `onMount()` is mandatory. FabricJS cannot run during SSR. Use SvelteKit `browser` check + `onMount` pattern from docs.
2. **Canvas SEO fallback** — `<canvas>` content is invisible to crawlers. Include `<noscript>` fallback with static image or descriptive HTML inside canvas container for SEO.
3. **Category tabs must keep filtered items in DOM** — Use CSS `display:none` (not Svelte `{#if}`) for filtered items so Google still sees all 46 internal links on the hub page.
4. **MiniEditor template swap race** — When user selects a new template from gallery, must dispose old canvas before creating new one. Use a generation counter to discard stale loads.
5. **FabricJS v5/v6 conflict** — Current [usecase] page loads FabricJS v5 from CDN (line 144). MiniEditor uses v6 via npm import. Both on same page = conflict. Must remove CDN v5 load.
6. **Scarcity messaging** — Soft nudges > hard gates (Spotify model). Frame as "4 free generations remaining" not "limit approaching". Position signup as opportunity, not restriction.
7. **Public canvas endpoint abuse** — MiniEditor sends user-edited FabricJS JSON to `/image/public/canvas`. Must validate object count (<100) and total data size (<2MB) server-side to prevent DoS.

## Overview

The pSEO tools pages are Pictify's primary top-of-funnel acquisition channel (46 use case pages + 6 dedicated tools + 1 hub). Audit revealed:
- 9 of 46 use case pages are broken (missing `useCaseDetails`)
- CTAs push "Run Test" (generates unimpressive generic card) over "Open Editor" (the actual product)
- No category navigation on 46-item hub
- Daily generation limit (5/day) invisible until exceeded
- Zero cross-linking between dedicated tools and use case pages
- Templates are generic placeholders, not polished per-use-case designs

This plan fixes the quick wins (Phase 1) and builds the cathedral — embedded mini-editor + template gallery on pSEO pages (Phase 2).

## Phase 1: Quick Wins (5 items)

### 1B. Swap CTA Emphasis — "Open Editor" Primary

**File**: `src/routes/tools/[usecase]/+page.svelte` (lines 425-475)

Currently "Run Test" has `bg-[#4ade80]` (green, primary) and "Edit Design" has `bg-white` (secondary). Swap them:

- **"Open in Canvas Editor"** → `bg-[#4ade80]` green, primary position (left), larger text
- **"Quick Preview"** → `bg-white` outline, secondary position (right), rename from "Run Test"

Also update the button copy to be more compelling:
- "Edit Design" → **"Open in Canvas Editor — Free"**
- "Run Test" → **"Quick Preview"**

```svelte
<!-- Primary CTA: Open Editor (was secondary) -->
<button
  type="button"
  on:click={openInCanvasEditor}
  class="flex-1 py-4 bg-[#4ade80] text-gray-900 border-[3px] border-gray-900 font-black text-lg uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 rounded-xl"
>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
  Open Editor — Free
</button>

<!-- Secondary CTA: Quick Preview (was primary) -->
<button
  type="button"
  on:click={handleQuickGenerate}
  disabled={isGenerating}
  class="flex-1 py-4 bg-white text-gray-900 border-[3px] border-gray-900 font-black text-lg uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
>
  Quick Preview
</button>
```

---

### 2A. Fix 9 Broken Use Case Pages

**File**: `src/lib/pseo/use-cases.js`

The following 9 use cases have entries in the `useCases` array but NO `useCaseDetails` entry, causing `{#each}` crashes on `painPoints`, `workflow`, `overview`, and `faqs`:

1. `markdown` — Markdown to Image
2. `certificate` — Certificate from HTML
3. `code` — Code to Image
4. `receipt` — Receipt Generator
5. `badge` — Badge Generator
6. `leaderboard` — Leaderboard Card
7. `testimonial` — Testimonial Card
8. `infographic` — Infographic Generator

**Note**: Some of these (code, certificate, receipt, badge) already have FabricJS templates in `useCaseTemplates.js` but are missing the marketing copy in `useCaseDetails`.

For each, add a full entry matching the schema (17 fields):
- `label`, `description`, `seoKeywords` (10 keywords)
- `longDescription` (2-3 paragraphs)
- `useCaseScenarios` (5 scenarios)
- `features` (6-8 features)
- `dimensions` (default width/height)
- `overview` (2 paragraphs)
- `painPoints` (4-6 points)
- `workflow` (3 steps with title + detail)
- `faqs` (3-5 Q&A pairs)
- `related` (2-3 related use case IDs)
- `templateHtml` (use `simpleCardTemplate()` or existing template function)

**Pattern to follow**: Copy structure from `html-email` entry (lines 181-296) — it's the most complete.

---

### 3A. Category Filter Tabs on Tools Hub

**File**: `src/routes/tools/+page.svelte` (lines 173-228)

Add category tabs above the workflows grid. Categories derived from `useCaseDetails`:

```javascript
const CATEGORIES = [
  { id: 'all', label: 'All Tools' },
  { id: 'social', label: 'Social Media' },
  { id: 'documents', label: 'Documents' },
  { id: 'data', label: 'Data & KPIs' },
  { id: 'developer', label: 'Developer' },
  { id: 'creative', label: 'Creative' },
  { id: 'marketing', label: 'Marketing' }
];

// Map use case IDs to categories
const USE_CASE_CATEGORIES = {
  'youtube-thumbnail': 'social',
  'linkedin-banner': 'social',
  'instagram-story': 'social',
  'twitter-header': 'social',
  'og-image-generator': 'social',
  'podcast-cover': 'social',
  'blog-featured-image': 'social',
  'certificate': 'documents',
  'receipt': 'documents',
  'invoice': 'documents',
  'resume-snapshot': 'documents',
  'menu-card': 'documents',
  'real-estate-flyer': 'documents',
  'event-ticket': 'documents',
  'event-invitation': 'documents',
  'membership-card': 'documents',
  'discount-coupon': 'documents',
  'kpi-card': 'data',
  'leaderboard': 'data',
  'status-update': 'data',
  'stock-chart': 'data',
  'weather-widget': 'data',
  'sports-score-card': 'data',
  'html-email': 'developer',
  'table': 'developer',
  'markdown': 'developer',
  'code': 'developer',
  'json-to-image': 'developer',
  'api-response-card': 'developer',
  'meme-generator': 'creative',
  'quote-card': 'creative',
  'infographic': 'creative',
  'testimonial': 'creative',
  'badge': 'creative',
  'product-banner': 'marketing',
  'pricing-card': 'marketing',
  'webinar-promo': 'marketing',
  'job-post': 'marketing',
  'changelog-card': 'marketing',
  'release-notes-card': 'marketing',
  'feature-flag-banner': 'marketing',
  'report-cover': 'marketing',
  'roadmap-card': 'marketing',
  'responsive-image-generator': 'social',
  // Remaining uncategorized → 'all' only
};
```

**UI**: Horizontal scrollable pill tabs above the grid. "All Tools" selected by default.

**CRITICAL SEO insight**: Do NOT use `{#if}` to remove filtered items from DOM. Use CSS `class:hidden` so Google still crawls all 46 internal links on the hub page. Removing links from DOM loses internal link equity.

```svelte
<div class="flex gap-2 overflow-x-auto pb-2 mb-8">
  {#each CATEGORIES as cat}
    <button
      on:click={() => activeCategory = cat.id}
      class="px-4 py-2 text-sm font-bold border-2 whitespace-nowrap transition-all
        {activeCategory === cat.id
          ? 'border-gray-900 bg-[#ffc480] shadow-[3px_3px_0_0_#1f2937]'
          : 'border-gray-200 hover:border-gray-400 bg-white'}"
    >
      {cat.label}
      <span class="ml-1 text-xs opacity-60">
        {cat.id === 'all' ? useCases.length : useCases.filter(uc => USE_CASE_CATEGORIES[uc.id] === cat.id).length}
      </span>
    </button>
  {/each}
</div>

<!-- Use class:hidden NOT {#if} — keeps all links in DOM for SEO -->
{#each useCases as uc}
  <div class:hidden={activeCategory !== 'all' && USE_CASE_CATEGORIES[uc.id] !== activeCategory}>
    <!-- existing card markup -->
  </div>
{/each}
```

---

### 4A. Show Remaining Generation Count

**Files**:
- `src/lib/components/tools/GenerationLimitBanner.svelte`
- `src/routes/tools/[usecase]/+page.svelte`

Currently the banner only shows when `isExhausted` (remaining <= 0) or `isLow` (remaining <= 2). Change to **always show for guests after first generation**:

```javascript
// In GenerationLimitBanner.svelte
$: hasGenerated = ($generationLimits?.count || 0) > 0;
$: showBanner = !isLoggedIn && hasGenerated; // Show after first generation
```

Update banner copy for the normal state (remaining > 2):
```svelte
{#if isExhausted}
  <!-- existing red "limit reached" banner -->
{:else if isLow}
  <!-- existing orange "running low" banner -->
{:else if hasGenerated}
  <div class="bg-white border-[3px] border-gray-900 rounded-xl p-4 shadow-[4px_4px_0_0_#1f2937]">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-sm font-bold text-gray-700">
          {remaining} free generation{remaining !== 1 ? 's' : ''} remaining today
        </span>
        <!-- dot counter -->
      </div>
      <a href="/signup" class="text-xs font-black text-[#4ade80] hover:underline uppercase tracking-wider">
        Get Unlimited →
      </a>
    </div>
  </div>
{/if}
```

---

### 5A. Related Tools Section on Dedicated Pages

**Files** (add before Footer/ExitIntentPopup in each):
- `src/routes/tools/code-to-image/+page.svelte`
- `src/routes/tools/html-to-[format]/+page.svelte`
- `src/routes/tools/og-image-generator/+page.svelte`
- `src/routes/tools/url-to-image-generator/+page.svelte`
- `src/routes/tools/online-invoice-generator/+page.svelte`
- `src/routes/tools/linkedin-banner-generator/+page.svelte`

Create a reusable component `src/lib/components/tools/RelatedTools.svelte`:

```svelte
<script>
  import { useCaseDetails } from '$lib/pseo/config.js';
  export let tools = []; // Array of use case IDs to display
</script>

<section class="py-16 px-4 border-t-[3px] border-gray-900 bg-[#FFFDF8]">
  <div class="max-w-5xl mx-auto">
    <h3 class="text-2xl font-black uppercase tracking-widest text-gray-400 mb-8">
      More Tools You'll Love
    </h3>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each tools as toolId}
        {#if useCaseDetails[toolId]}
          <a
            href="/tools/{toolId}"
            class="p-5 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all block"
          >
            <h4 class="font-black text-gray-900 mb-1">{useCaseDetails[toolId].label}</h4>
            <p class="text-xs text-gray-500 line-clamp-2">{useCaseDetails[toolId].description}</p>
          </a>
        {/if}
      {/each}
    </div>
    <div class="mt-6 text-center">
      <a href="/tools" class="text-sm font-bold text-gray-500 hover:text-gray-900 underline">
        View all 46+ tools →
      </a>
    </div>
  </div>
</section>
```

**Per-page tool lists** (hand-picked for relevance):
- **code-to-image**: `['json-to-image', 'markdown', 'api-response-card', 'changelog-card']`
- **html-to-[format]**: `['html-email', 'table', 'og-image-generator', 'certificate']`
- **og-image-generator**: `['youtube-thumbnail', 'linkedin-banner', 'twitter-header', 'responsive-image-generator']`
- **url-to-image**: `['html-email', 'og-image-generator', 'blog-featured-image']`
- **invoice-generator**: `['receipt', 'certificate', 'membership-card', 'event-ticket']`
- **linkedin-banner**: `['twitter-header', 'youtube-thumbnail', 'og-image-generator', 'responsive-image-generator']`

---

## Phase 2: Cathedral — Mini-Editor + Template Gallery

### 6. Embedded Mini-Editor on pSEO Pages

**Files**:
- `src/lib/components/tools/MiniEditor.svelte` — NEW component
- `src/routes/tools/[usecase]/+page.svelte` — replace static preview with MiniEditor

**Concept**: Instead of a read-only FabricJS `StaticCanvas` preview, embed a lightweight interactive canvas where users can click on text elements and edit them in-place. This gives visitors a taste of the Pictify editor without leaving the pSEO page or signing up.

**Architecture**:

```
CURRENT FLOW:
  [usecase] page → StaticCanvas (read-only) → "Run Test" (generates generic image)
                                              → "Edit Design" (goes to full editor)

NEW FLOW:
  [usecase] page → MiniEditor (interactive) → User edits text inline
                                             → "Generate This Design" (renders their edits)
                                             → "Open Full Editor" (still primary CTA)
```

**MiniEditor.svelte** — Stripped-down interactive canvas (with deepening fixes):

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  export let fabricJSData = null;
  export let width = 1200;
  export let height = 630;

  let canvasEl;
  let fabricCanvas;
  let selectedText = null;
  let canvasReady = false;
  let loadGeneration = 0; // Race condition guard for template swaps

  const MAX_DISPLAY_WIDTH = 640;

  // CRITICAL: Dynamic import inside onMount — FabricJS cannot run during SSR
  onMount(() => {
    if (fabricJSData) loadCanvas(fabricJSData);
  });

  // Watch for template changes (gallery selection)
  $: if (browser && fabricJSData && canvasEl) {
    loadCanvas(fabricJSData);
  }

  async function loadCanvas(data) {
    const thisGeneration = ++loadGeneration;

    // Dispose previous canvas if exists (template swap)
    if (fabricCanvas) {
      fabricCanvas.dispose();
      fabricCanvas = null;
      canvasReady = false;
    }

    const fabric = await import('fabric');
    if (thisGeneration !== loadGeneration) return; // Stale — user switched again

    const scale = Math.min(1, MAX_DISPLAY_WIDTH / width);
    const displayWidth = Math.round(width * scale);
    const displayHeight = Math.round(height * scale);

    canvasEl.width = displayWidth;
    canvasEl.height = displayHeight;

    fabricCanvas = new fabric.Canvas(canvasEl, {
      width: displayWidth,
      height: displayHeight,
      selection: false,
      defaultCursor: 'default',
      hoverCursor: 'pointer'
    });

    fabricCanvas.setZoom(scale);
    await fabricCanvas.loadFromJSON(data);
    if (thisGeneration !== loadGeneration) { fabricCanvas.dispose(); return; }

    // Lock non-text, enable text editing
    fabricCanvas.getObjects().forEach(obj => {
      const isText = obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox';
      obj.set({
        selectable: isText,
        evented: isText,
        hasControls: false,
        hasBorders: isText,
        lockMovementX: true, lockMovementY: true,
        lockScalingX: true, lockScalingY: true, lockRotation: true,
        borderColor: '#4ade80', borderScaleFactor: 3
      });
      if (isText) obj.set({ editable: true });
    });

    fabricCanvas.renderAll();
    canvasReady = true;

    fabricCanvas.on('selection:created', (e) => {
      const obj = e.selected?.[0];
      if (obj && (obj.type === 'i-text' || obj.type === 'textbox')) selectedText = obj;
    });
    fabricCanvas.on('selection:cleared', () => { selectedText = null; });
  }

  onDestroy(() => {
    loadGeneration++; // Invalidate any in-flight loads
    if (fabricCanvas) fabricCanvas.dispose();
  });

  export function getEditedFabricData() {
    if (!fabricCanvas) return null;
    return fabricCanvas.toJSON();
  }
</script>

<div class="relative">
  {#if canvasReady && !selectedText}
    <div class="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
      Click any text to edit it
    </div>
  {/if}

  <div class="border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] bg-white overflow-hidden">
    <!-- SEO fallback: canvas content invisible to crawlers, so include descriptive text -->
    <canvas bind:this={canvasEl}>
      <p>Interactive template preview — edit text elements directly</p>
    </canvas>
  </div>

  {#if selectedText}
    <div class="mt-2 text-xs text-[#4ade80] font-bold">
      Double-click text to edit
    </div>
  {/if}
</div>
```

### Research Insights — MiniEditor

**SSR Safety (from SvelteKit docs):**
- `onMount` guarantees browser environment — safe for dynamic `import('fabric')`
- SvelteKit tree-shakes `onMount` on server, replacing with no-op
- The `browser` check in reactive statement prevents SSR-time canvas operations

**Template Swap Race (from Frontend Races Reviewer):**
- `loadGeneration` counter prevents stale canvas loads when user clicks gallery fast
- Old canvas is disposed before new one is created (prevents memory leak)
- If `loadFromJSON` is mid-flight when user switches, the generation check discards it

**FabricJS v5/v6 Conflict (CRITICAL):**
- Current `[usecase]/+page.svelte` line 144 loads FabricJS v5 from CDN: `https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js`
- MiniEditor uses v6 via `import('fabric')` from npm
- **Must remove the CDN v5 script tag** from the [usecase] page when adding MiniEditor
- The CDN load was only needed for StaticCanvas preview — MiniEditor replaces it entirely

**Canvas SEO (from web research):**
- `<canvas>` content is NOT indexable. Include fallback text inside `<canvas>` tag
- Also add descriptive `<noscript>` text for crawlers with JS disabled
- The marketing copy sections (overview, painPoints, workflow, faqs) below the canvas carry the SEO weight — canvas is supplementary

**Integration in [usecase]/+page.svelte** — replace the StaticCanvas preview:

```svelte
<!-- Replace lines 393-422 -->
{#if template?.fabricJSData}
  <MiniEditor
    fabricJSData={template.fabricJSData}
    width={templateWidth}
    height={templateHeight}
    bind:this={miniEditorRef}
  />
{:else}
  <!-- fallback placeholder -->
{/if}
```

Update "Quick Preview" to use the edited canvas data:
```javascript
async function handleQuickGenerate() {
  // Get edited data from mini-editor if available
  const editedData = miniEditorRef?.getEditedFabricData?.() || template?.fabricJSData;
  if (!editedData) return;

  // Use edited data for generation
  const response = await backend.post('/image/public/canvas', {
    fabricJSData: editedData,
    width: templateWidth,
    height: templateHeight,
    fileExtension: 'png',
    watermark: !isUserLoggedIn
  });
  // ... rest unchanged
}
```

---

### 7. Template Gallery Per Use Case (1A + Gallery)

**Files**:
- `src/lib/components/tools/TemplateGallery.svelte` — NEW component
- `src/lib/pseo/useCaseTemplates.js` — add 3-5 templates per use case
- `src/routes/tools/[usecase]/+page.svelte` — add gallery above mini-editor

**Concept**: Instead of showing ONE generic template, show 3-5 polished designs per use case. User picks one, it loads into the mini-editor, they customize and generate.

**TemplateGallery.svelte**:

```svelte
<script>
  import { createEventDispatcher } from 'svelte';

  export let templates = []; // Array of { id, name, thumbnail, fabricJSData, width, height }
  export let selectedId = null;

  const dispatch = createEventDispatcher();

  function selectTemplate(tmpl) {
    selectedId = tmpl.id;
    dispatch('select', tmpl);
  }
</script>

{#if templates.length > 1}
  <div class="mb-6">
    <div class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
      Choose a starting design
    </div>
    <div class="flex gap-3 overflow-x-auto pb-2">
      {#each templates as tmpl}
        <button
          on:click={() => selectTemplate(tmpl)}
          class="flex-shrink-0 border-2 rounded-lg overflow-hidden transition-all
            {selectedId === tmpl.id
              ? 'border-gray-900 shadow-[3px_3px_0_0_#4ade80] scale-105'
              : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'}"
        >
          {#if tmpl.thumbnail}
            <img src={tmpl.thumbnail} alt={tmpl.name} class="w-28 h-20 object-cover" />
          {:else}
            <div class="w-28 h-20 bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
              {tmpl.name}
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </div>
{/if}
```

**Template data structure**: Each use case gets a `templates` array in `useCaseDetails`:

```javascript
'youtube-thumbnail': {
  // ... existing fields ...
  templates: [
    {
      id: 'yt-bold',
      name: 'Bold & Clean',
      fabricJSData: { /* FabricJS JSON */ },
      width: 1280,
      height: 720
    },
    {
      id: 'yt-gradient',
      name: 'Gradient Pop',
      fabricJSData: { /* FabricJS JSON */ },
      width: 1280,
      height: 720
    },
    {
      id: 'yt-photo',
      name: 'Photo Overlay',
      fabricJSData: { /* FabricJS JSON */ },
      width: 1280,
      height: 720
    }
  ]
}
```

**Template creation approach**: Use the existing AI copilot to generate initial templates, then hand-tune. For each of the top 20 use cases, generate 3-5 variants. The remaining 26 use cases get the generic template as a single option.

**Priority order for polished templates** (by search volume / value):
1. youtube-thumbnail (1280x720)
2. og-image-generator (1200x630)
3. linkedin-banner (1584x396)
4. instagram-story (1080x1920)
5. twitter-header (1500x500)
6. certificate (1920x1080)
7. invoice/receipt (1080x1920)
8. product-banner (1200x628)
9. blog-featured-image (1200x630)
10. pricing-card (1080x1080)

---

## Files Changed

### Phase 1

| # | File | Change |
|---|------|--------|
| 1 | `src/routes/tools/[usecase]/+page.svelte` | Swap CTA button emphasis + copy |
| 2 | `src/lib/pseo/use-cases.js` | Add full useCaseDetails for 9 broken use cases |
| 3 | `src/routes/tools/+page.svelte` | Add category filter tabs + filter logic |
| 4 | `src/lib/components/tools/GenerationLimitBanner.svelte` | Show remaining count after first generation |
| 5 | `src/lib/components/tools/RelatedTools.svelte` | NEW — reusable related tools section |
| 6 | `src/routes/tools/code-to-image/+page.svelte` | Add RelatedTools section |
| 7 | `src/routes/tools/html-to-[format]/+page.svelte` | Add RelatedTools section |
| 8 | `src/routes/tools/og-image-generator/+page.svelte` | Add RelatedTools section |
| 9 | `src/routes/tools/url-to-image-generator/+page.svelte` | Add RelatedTools section |
| 10 | `src/routes/tools/online-invoice-generator/+page.svelte` | Add RelatedTools section |
| 11 | `src/routes/tools/linkedin-banner-generator/+page.svelte` | Add RelatedTools section |

### Phase 2

| # | File | Change |
|---|------|--------|
| 12 | `src/lib/components/tools/MiniEditor.svelte` | NEW — lightweight interactive canvas |
| 13 | `src/lib/components/tools/TemplateGallery.svelte` | NEW — template picker strip |
| 14 | `src/routes/tools/[usecase]/+page.svelte` | Replace StaticCanvas with MiniEditor + Gallery |
| 15 | `src/lib/pseo/useCaseTemplates.js` | Add 3-5 template variants per top-20 use case |
| 16 | `src/lib/pseo/use-cases.js` | Add `templates` array to useCaseDetails entries |

**Total: 16 files** (14 existing + 2 new)

## Acceptance Criteria

### Phase 1
- [x] "Open Editor — Free" is the primary (green) CTA on all [usecase] pages
- [x] "Quick Preview" is the secondary (white/outline) CTA
- [x] All 46 use case pages load without errors (8 broken pages fixed)
- [x] Each broken page has full marketing copy (painPoints, workflow, overview, faqs)
- [x] Tools hub has category filter tabs (All, Social, Documents, Data, Developer, Creative, Marketing)
- [x] Filtering works correctly — selecting a category shows only matching use cases (CSS hidden, not DOM removal)
- [x] "All Tools" tab shows all 46 use cases
- [x] After first anonymous generation, remaining count banner appears (e.g., "4 free generations remaining today")
- [x] Banner includes "Get Unlimited →" link to /signup
- [x] Each dedicated tool page has "Related Tools" section with 3-4 relevant links
- [x] Related tools link to valid [usecase] pages
- [x] All pages pass vite build with no errors

### Phase 2
- [x] MiniEditor renders on all [usecase] pages with interactive text editing
- [x] Users can click text elements and edit them in-place (double-click to type)
- [x] Non-text elements are locked (no move, resize, or selection)
- [x] "Click any text to edit" hint appears on first load
- [x] "Quick Preview" uses the edited canvas data (not the original template)
- [ ] Template gallery shows 3-5 options for top-20 use cases (templates to be created — design work)
- [ ] Selecting a template loads it into the MiniEditor (TemplateGallery component ready, needs template data)
- [x] Default template is pre-selected on page load
- [x] Gallery is horizontally scrollable on mobile (component ready)
- [x] Canvas disposes correctly on component destroy (generation counter + onDestroy)

## Success Metrics

- **Phase 1**: Bounce rate on [usecase] pages decreases by 15%+. Click-through to editor increases by 25%+.
- **Phase 2**: Time-on-page increases by 2x (users editing templates). Signup conversion from [usecase] pages increases by 30%+.

## Research Insights (from Deepening)

### Freemium Scarcity UX (Best Practices Research)
- **Spotify model**: Progressive warnings before hard limit. "4 remaining" → "2 remaining" → "You've used all 5 — sign up for unlimited"
- **Soft nudge > hard gate**: Frame as opportunity ("You've discovered a powerful feature — unlock unlimited") not restriction ("Limit reached")
- **Dropbox pattern**: Dismissible banners that don't interrupt workflow. Alternate copy to maintain attention
- **Key insight**: Show the limit counter AFTER first successful generation, not before. Let them succeed first, then show scarcity.
- Sources: [Appcues Freemium Upgrade Prompts](https://www.appcues.com/blog/best-freemium-upgrade-prompts), [Kinde Freemium Conversion](https://www.kinde.com/learn/billing/conversions/freemium-to-premium-converting-free-ai-tool-users-with-smart-billing-triggers/)

### Canvas SEO on Public Pages
- Google does NOT index `<canvas>` pixel content — only fallback text inside the tag
- Include descriptive HTML inside `<canvas>` element as fallback for crawlers
- The pSEO page's SEO value comes from the text sections (overview, painPoints, FAQs), not the canvas preview
- Interactive JS tools on SEO pages are fine — Google renders JS. But keep critical content in HTML, not canvas.
- Source: [HTML Canvas Accessibility Notes](https://stevefaulkner.github.io/Articles/Notes%20on%20accessibility%20of%20text%20replacement%20using%20HTML5%20canvas.html)

### FabricJS Interactive Canvas Performance
- `fabric.Canvas` creates upper (interaction) + lower (render) canvas = 2 DOM elements + full event system
- `fabric.StaticCanvas` creates 1 canvas element with no events — 3-5x lighter
- **Recommendation for MiniEditor**: Use `fabric.Canvas` but with minimal event listeners. Disable group selection, restrict to text-only interaction.
- Set `renderOnAddRemove: false` during `loadFromJSON`, re-enable after
- Source: [FabricJS StaticCanvas API](https://fabricjs.com/api/classes/staticcanvas/)

### SvelteKit SSR + Dynamic Imports
- `onMount` is tree-shaken to no-op on server — safe for `import('fabric')`
- `$app/environment` `browser` check is compile-time constant — safe for reactive guards
- Use `{#await}` pattern for showing loading state while FabricJS imports
- Source: [SvelteKit FAQ - Client-side libraries](https://svelte.dev/docs/kit/faq)

### Category Filtering SEO
- CSS `display:none` items remain in DOM and are crawlable by Google
- Svelte `{#if false}` removes items from DOM entirely — links disappear for crawlers
- **Must use `class:hidden`** for category filtering to preserve internal link equity across all 46 pages
- Tab counts (e.g., "Social Media (12)") improve discoverability and scannability

## NOT in Scope

| Item | Rationale |
|------|-----------|
| AI tool concierge on hub | Phase 3 — requires AI API integration on public page |
| Social proof counters | Phase 3 — requires analytics aggregation pipeline |
| User-submitted templates | Phase 3 — requires moderation system |
| Redesign dedicated tool pages | These already convert well — focus on [usecase] pages |
| A/B testing framework for CTAs | Ship the change, measure with analytics, iterate |
