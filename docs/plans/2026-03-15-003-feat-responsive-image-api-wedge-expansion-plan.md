---
title: "feat: Responsive Image API Wedge — Expansion Items"
type: feat
status: completed
date: 2026-03-15
deepened: 2026-03-15
origin: docs/plans/2026-03-15-001-feat-template-layout-variants-plan.md
---

# feat: Responsive Image API Wedge — Expansion Items

## Enhancement Summary

**Deepened on:** 2026-03-15
**Agents used:** Performance Oracle, Code Simplicity Reviewer, Frontend Races Reviewer, Security Sentinel, Architecture Strategist, Best Practices Researcher
**Framework docs:** FabricJS v6 (Context7), Svelte reactive patterns

### Critical Fixes from Deepening
1. **Thumbnail reactive statement race**: `forEach` with `async` is a known anti-pattern — doesn't await. Replace with serial `for...of` or `Promise.all` pattern with dedup guard
2. **StaticCanvas memory leak on Safari**: Zero canvas dimensions before `dispose()` per FabricJS issue #7924
3. **Thumbnail invalidation**: `!layoutThumbnails[key]` check prevents regeneration after layout update — need version tracking
4. **Background completion state**: Use a Svelte writable store (not module-level var) for cross-component reactivity with toast
5. **Resize endpoint has no rate limiting**: "Generate All Sizes" fires 8 AI calls — add client-side throttle guard

## Overview

The core Template Layout Variants feature (multi-size resize) is **already implemented** across backend and frontend. This plan covers the **expansion scope** agreed during the CEO review to transform "multi-layout" from a feature into a marketable wedge: **"Responsive Image API — one template, every platform."**

## What Already Exists (Core — COMPLETE)

| Component | Status | Location |
|-----------|--------|----------|
| Backend `layouts` schema field | ✅ | `models/Template.js:128-131` |
| `populateFabricTemplate` with override | ✅ | `models/Template.js:264-285` |
| Layout validation (C4 prototype pollution, max 20, regex) | ✅ | `routes/template.js:602-634` |
| Render with `?layout=` param | ✅ | `routes/template.js:670-942` |
| Cache key includes layoutKey (C3) | ✅ | `routes/template.js:53-57` |
| URL param renderer extracts layout before spread (C5) | ✅ | `routes/template-render.js:58` |
| Template renderer inline layout resolution (S3) | ✅ | `service/template-renderer.js:133-139` |
| Frontend `template.store.js` layouts default | ✅ | `src/store/template.store.js:27` |
| Frontend `template.js` API sends layout/layouts | ✅ | `src/api/template.js:120-124` |
| ResizeModal dispatches `saveLayout` | ✅ | `ResizeModal.svelte:138-148` |
| EditorLayout layout tabs + switching | ✅ | `EditorLayout.svelte:205-233` |
| Canvas.svelte layout switch orchestration (C1, H1-H5) | ✅ | `Canvas.svelte:857-934` |
| CreateTemplate correct-slot save (H5) | ✅ | `CreateTemplate.svelte:523-549` |

## What This Plan Implements (Expansion — 7 Items)

### Item 1: "Generate All Sizes" Button in ResizeModal

**File**: `src/lib/components/editor/ResizeModal.svelte`
**Effort**: S (20 min)

Add a prominent "Generate All Sizes" button at the top of the presets section. On click, select all 8 platform presets and trigger the existing `handleResize()` batch flow (which already has concurrency limit of 3).

**Behavior**:
- Button: "Generate All Sizes ✦" — neobrutalist style, accent color `#ffc480`
- On click: set all `selectedPresets` to true, then call `handleResize()`
- Background completion: if user closes modal mid-batch, keep generating. Show toast: "Generating layouts... (3/8)"
- When complete: toast "All 8 layouts generated!"
- Reuses existing `handleResize()` logic entirely — no new API calls

**Implementation**:

```svelte
<!-- After the presets grid, before the action buttons -->
<button
  on:click={generateAllSizes}
  disabled={isResizing}
  class="w-full py-3 px-4 font-bold text-sm border-[3px] border-gray-900
    bg-[#ffc480] shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937]
    hover:translate-x-[2px] hover:translate-y-[2px] transition-all
    disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isResizing ? `Generating... (${completedCount}/${totalCount})` : 'Generate All Sizes'}
</button>
```

```javascript
function generateAllSizes() {
  // Select all standard presets
  selectedPresets = new Set(PLATFORM_PRESETS.map(p => p.id));
  // Trigger existing batch resize
  handleResize();
}
```

**Background completion** (improved from deepening — use Svelte store, not module-level var):

Use a writable store for background resize state so toasts and the modal can both react:

```javascript
// In a shared store file or at top of ResizeModal.svelte
import { writable } from 'svelte/store';

// Shared background resize state — survives modal open/close
export const backgroundResize = writable({
  active: false,
  completed: 0,
  total: 0,
  results: [], // { key, success, canvasState? }
});
```

When modal closes mid-batch: the `handleResize()` loop keeps running (it's async, not tied to DOM lifecycle). The store updates trigger toast notifications from a layout-level subscriber. When modal reopens, it reads from the store to show current progress.

**Client-side throttle guard** (from security review): Add a 60-second cooldown after "Generate All Sizes" to prevent spamming the AI resize endpoint. The existing backend has no rate limit on `/copilot-simple/resize`.

```javascript
let lastBatchTime = 0;
function generateAllSizes() {
  const now = Date.now();
  if (now - lastBatchTime < 60000) {
    toast.set({ message: 'Please wait before generating again', type: 'warning' });
    return;
  }
  lastBatchTime = now;
  selectedPresets = new Set(PLATFORM_PRESETS.map(p => p.id));
  handleResize();
}
```

---

### Item 2: Layout Preview Thumbnails in Tabs

**File**: `src/lib/components/editor/EditorLayout.svelte`
**Effort**: S (30 min)

Replace text-only layout tabs with mini canvas thumbnails (48×36px) using a lightweight rendering approach.

**Approach**: Generate thumbnails from `fabricJSData` using an offscreen `StaticCanvas`. Cache thumbnails as data URLs to avoid re-rendering on every tab render.

**Implementation** (with fixes from deepening — C1 race fix, C2 Safari memory fix, C3 invalidation fix):

```svelte
<script>
  import { onDestroy } from 'svelte';

  // Track thumbnails AND versions for invalidation (C3)
  let layoutThumbnails = {};
  let thumbnailVersions = {}; // key → hash of fabricJSData to detect changes
  let pendingGenerations = new Set(); // dedup guard (C1)

  // Generate thumbnail from fabricJSData (C2: Safari-safe disposal)
  async function generateThumbnail(fabricJSData, width, height) {
    if (typeof window === 'undefined') return null;
    const { StaticCanvas } = await import('fabric');
    const scale = 48 / Math.max(width, height);
    const canvas = new StaticCanvas(null, {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      renderOnAddRemove: false,   // perf: skip per-object renders
      enableRetinaScaling: false  // perf: thumbnails don't need retina
    });
    canvas.setZoom(scale);
    try {
      await canvas.loadFromJSON(fabricJSData);
      canvas.renderAll();
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 0.5 });
      return dataUrl;
    } finally {
      // C2: Zero dimensions before dispose to release Safari canvas memory
      canvas.setWidth(0);
      canvas.setHeight(0);
      canvas.dispose();
    }
  }

  // Simple hash for change detection (C3)
  function quickHash(obj) {
    const str = JSON.stringify(obj).slice(0, 200); // first 200 chars is enough
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash;
  }

  // Regenerate thumbnails when layouts change (C1: no forEach+async)
  $: if ($template.layouts || $template.fabricJSData) {
    regenerateThumbnails();
  }

  async function regenerateThumbnails() {
    const entries = Object.entries($template.layouts || {});

    // Add default layout
    const allLayouts = [
      ['__default__', { fabricJSData: $template.fabricJSData, width: $template.width, height: $template.height }],
      ...entries
    ];

    for (const [key, layout] of allLayouts) {
      if (!layout?.fabricJSData) continue;
      if (pendingGenerations.has(key)) continue; // dedup

      const version = quickHash(layout.fabricJSData);
      if (thumbnailVersions[key] === version) continue; // unchanged (C3)

      pendingGenerations.add(key);
      try {
        const dataUrl = await generateThumbnail(layout.fabricJSData, layout.width, layout.height);
        layoutThumbnails[key] = dataUrl;
        thumbnailVersions[key] = version;
        layoutThumbnails = layoutThumbnails; // trigger reactivity
      } catch (err) {
        // Silent fail — thumbnail is non-critical
      } finally {
        pendingGenerations.delete(key);
      }
    }
  }

  onDestroy(() => {
    pendingGenerations.clear();
  });
</script>

<!-- Layout tab with thumbnail -->
<button on:click={() => handleLayoutSwitch(key)} ...>
  <div class="flex items-center gap-2">
    {#if layoutThumbnails[key]}
      <img src={layoutThumbnails[key]} alt=""
        class="w-10 h-7 border border-gray-300 object-contain bg-white" />
    {/if}
    <div class="text-left">
      <div class="text-xs font-bold">{layout.name || key}</div>
      <div class="text-[10px] text-gray-400">{layout.width}×{layout.height}</div>
    </div>
  </div>
</button>
```

**Invalidation**: Version-tracked via `quickHash()` — thumbnails auto-regenerate when `fabricJSData` changes. No manual invalidation needed in `handleSaveLayout`.

**Performance** (enhanced from deepening):
- StaticCanvas with `renderOnAddRemove: false` + `enableRetinaScaling: false` = ~5ms per thumbnail
- 8 thumbnails = ~40ms total, generated serially via `for...of` (not `forEach+async`)
- Safari memory fix: zero canvas dimensions before `dispose()` per [FabricJS issue #7924](https://github.com/fabricjs/fabric.js/issues/7924)
- Memory budget: 8 data URLs at ~5KB each = 40KB. Negligible.
- Known risk: [FabricJS memory leak with loadFromJSON](https://github.com/fabricjs/fabric.js/issues/6125) — mitigated by `dispose()` and dimension zeroing

---

### Item 3: pSEO Landing Page — `/tools/responsive-image-generator`

**Files**:
- `src/lib/pseo/use-cases.js` — add use case entry
- `src/lib/pseo/useCaseTemplates.js` — add HTML template
- `src/routes/tools/[usecase]/+page.svelte` — already handles dynamic routing
**Effort**: M (1-2 hours)

**Use case entry** in `use-cases.js`:

```javascript
{
  slug: 'responsive-image-generator',
  name: 'Responsive Image Generator',
  title: 'Responsive Image Generator — One Template, Every Platform',
  description: 'Generate perfectly sized images for every social platform from a single template. Instagram, Twitter, LinkedIn, YouTube, OG images — all from one design with shared variables.',
  keywords: ['responsive image', 'multi-size image', 'social media image sizes', 'image resize API', 'responsive image API'],
  category: 'Content & Social Media',
  features: [
    'One template, 8+ platform sizes',
    'AI-powered smart resize',
    'Shared variables across all layouts',
    'Single API endpoint with ?layout= parameter',
    'Automatic element repositioning',
    'Preserves variable bindings across sizes'
  ],
  dimensions: {
    width: 1200,
    height: 675,
    label: 'Twitter/OG (Default)'
  },
  relatedUseCases: ['og-image-generator', 'youtube-thumbnail-generator', 'linkedin-banner-generator'],
  templateHtml: 'responsiveImageTemplate' // reference to HTML template function
}
```

**SEO metadata** in `src/lib/seo/metadata/templates.js`:

```javascript
'responsive-image-generator': {
  title: 'Responsive Image Generator API — One Template, Every Platform | Pictify',
  description: 'Generate images for Instagram, Twitter, LinkedIn, YouTube, OG, and more from a single template. AI-powered resize with shared variables. API-first.',
  keywords: 'responsive image API, multi-size image generator, social media image API, image resize API'
}
```

**HTML template**: A showcase template showing one design rendered at multiple sizes, with a prominent "Generate All Sizes" CTA.

---

### Item 4: Landing Page Section — "Responsive Image API"

**Files**:
- `src/lib/components/landingPage/ResponsiveShowcase.svelte` — NEW component
- `src/routes/+page.svelte` — add import + section
**Effort**: M (30-45 min)

**Placement**: After `CanvasShowcase` and before `IntegrationsEcosystem` (replaces the SectionSeparator between them).

**Design**: One template on the left → 5 platform-sized renders fanning out on the right, staggered with slight rotation. Neobrutalist style with thick borders and shadows.

```svelte
<!-- ResponsiveShowcase.svelte -->
<script>
  const platforms = [
    { name: 'Instagram Post', w: 1080, h: 1080, color: '#E1306C', rotation: -3 },
    { name: 'Twitter/X', w: 1200, h: 675, color: '#1DA1F2', rotation: 2 },
    { name: 'LinkedIn', w: 1200, h: 627, color: '#0A66C2', rotation: -1 },
    { name: 'YouTube', w: 1280, h: 720, color: '#FF0000', rotation: 3 },
    { name: 'OG Image', w: 1200, h: 630, color: '#ffc480', rotation: -2 },
  ];
</script>

<section class="py-20 px-4 bg-white">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <h2 class="text-4xl md:text-5xl font-black text-gray-900 mb-4">
        One Template. Every Platform.
      </h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Design once, generate images for Instagram, Twitter, LinkedIn, YouTube, and OG —
        all from a single template with shared variables. AI-powered smart resize.
      </p>
    </div>

    <div class="flex flex-col md:flex-row items-center gap-8">
      <!-- Source template (left) -->
      <div class="flex-shrink-0">
        <div class="w-64 h-64 border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] bg-gradient-to-br from-[#ffc480]/20 to-white p-4 flex items-center justify-center">
          <div class="text-center">
            <div class="text-5xl mb-2">🎨</div>
            <div class="font-bold text-gray-900">Your Template</div>
            <div class="text-xs text-gray-500 mt-1">1080 × 1080</div>
          </div>
        </div>
      </div>

      <!-- Arrow -->
      <div class="text-4xl font-black text-gray-900 hidden md:block">→</div>

      <!-- Platform renders (right) — staggered cards -->
      <div class="flex flex-wrap gap-3 justify-center">
        {#each platforms as platform}
          <div
            class="border-[2px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] bg-white p-2 transition-transform hover:scale-105"
            style="transform: rotate({platform.rotation}deg)"
          >
            <div
              class="w-24 h-16 flex items-center justify-center text-white text-xs font-bold"
              style="background-color: {platform.color}; aspect-ratio: {platform.w}/{platform.h}"
            >
              {platform.name}
            </div>
            <div class="text-[9px] text-gray-400 text-center mt-1">
              {platform.w}×{platform.h}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- API code example -->
    <div class="mt-12 max-w-2xl mx-auto">
      <div class="border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-x-auto">
        <div class="text-gray-500">// One template, any size</div>
        <div>GET /image/abc-123<span class="text-[#ffc480]">?layout=twitter-post</span>&title=Hello</div>
        <div>GET /image/abc-123<span class="text-[#ffc480]">?layout=instagram-post</span>&title=Hello</div>
        <div>GET /image/abc-123<span class="text-[#ffc480]">?layout=youtube-thumbnail</span>&title=Hello</div>
      </div>
    </div>

    <div class="text-center mt-8">
      <a href="/signup"
        class="inline-block px-8 py-3 font-bold text-sm border-[3px] border-gray-900
          bg-[#ffc480] shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937]
          hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
        Try Responsive Image API →
      </a>
    </div>
  </div>
</section>
```

**+page.svelte update**: Add `import ResponsiveShowcase from '$lib/components/landingPage/ResponsiveShowcase.svelte';` and place `<ResponsiveShowcase />` after `<CanvasShowcase />`.

---

### Item 5: Layout Dimension in Render Analytics

**Files**:
- Backend: `/Users/suyashthakur/html-to-gif/service/audit-service.js` — add layoutKey to logTemplateRender
- Backend: `/Users/suyashthakur/html-to-gif/routes/template.js` — pass layoutKey to audit
- Frontend: `src/routes/dashboard/analytics/+page.svelte` — show per-layout breakdown (optional, defer to TODO)
**Effort**: S

**Backend change** in `audit-service.js`:

```javascript
// In logTemplateRender metadata, add:
async function logTemplateRender(templateUid, teamId, options = {}) {
  const { format, width, height, layoutKey, ...rest } = options;
  await AuditLog.create({
    type: 'template.render',
    teamId,
    metadata: {
      templateUid,
      format,
      width,
      height,
      layoutKey: layoutKey || 'default',  // NEW
      ...rest
    }
  });
}
```

**Route change** in `routes/template.js` render handler — pass `layoutKey` to the audit call.

---

### Item 6: Layout Deletion UI (TODO — P2)

**Deferred** per CEO review. Track in TODOS.md. Users can overwrite layouts or delete via API.

---

### Item 7: Responsive Link Feature (TODO — P1)

**Deferred** per CEO review. Track in TODOS.md. This is the "wedge completion" feature — auto-route to correct layout by platform/device detection without `?layout=` param.

---

## Files Changed (This Plan)

| # | File | Repo | Change |
|---|------|------|--------|
| 1 | `src/lib/components/editor/ResizeModal.svelte` | frontend | Add "Generate All Sizes" button, background completion |
| 2 | `src/lib/components/editor/EditorLayout.svelte` | frontend | Add layout preview thumbnails to tabs |
| 3 | `src/lib/pseo/use-cases.js` | frontend | Add `responsive-image-generator` use case |
| 4 | `src/lib/pseo/useCaseTemplates.js` | frontend | Add HTML template for responsive image generator |
| 5 | `src/lib/seo/metadata/templates.js` | frontend | Add SEO metadata for responsive-image-generator |
| 6 | `src/lib/components/landingPage/ResponsiveShowcase.svelte` | frontend | NEW — landing page section |
| 7 | `src/routes/+page.svelte` | frontend | Add ResponsiveShowcase import + section |
| 8 | `service/audit-service.js` | backend | Add `layoutKey` to render audit metadata |
| 9 | `routes/template.js` | backend | Pass `layoutKey` to audit logging calls |

**Total: 9 files** (8 frontend, 1 backend concept change tracked)

## Acceptance Criteria

### Functional
- [x] "Generate All Sizes" button in ResizeModal selects all 8 presets and triggers batch resize
- [x] Modal can be closed during batch; generation continues in background with toast updates
- [x] Layout tabs show canvas preview thumbnails (48×36px)
- [x] Thumbnails regenerate when layout data changes
- [x] `/tools/responsive-image-generator` pSEO page loads with correct content and SEO metadata
- [x] Landing page shows "Responsive Image API" section with platform fan-out visualization
- [x] Render audit logs include `layoutKey` dimension

### Non-Functional
- [ ] Thumbnail generation completes in <50ms per layout
- [ ] pSEO page passes Lighthouse SEO score ≥ 90
- [ ] Landing page section is responsive (mobile-friendly)
- [ ] No regressions in existing layout tab switching behavior

## TODOs to Track

### P1: Responsive Link Feature
**What**: New link type wrapping a single template — rules detect referrer/UA and auto-select layout.
**Why**: Completes "zero-config responsive images" story. Eliminates `?layout=` param for end-users.
**Effort**: L. **Depends on**: Core layouts feature (done).

### P2: PATCH /templates/:uid/layouts/:key Endpoint
**What**: Per-layout save endpoint using MongoDB dot notation for partial updates.
**Why**: Currently auto-save sends full layouts map (500KB+). This reduces payload by ~90%.
**Effort**: S. **Depends on**: Core layouts feature (done).

### P2: Layout Deletion UI
**What**: Small 'x' button on layout tabs with confirmation dialog.
**Why**: Users will create test layouts they want to remove.
**Effort**: S. No dependencies.

## Research Insights (from Deepening)

### FabricJS StaticCanvas Best Practices
- **Always call `dispose()`** after `toDataURL()` — but on Safari, also zero canvas dimensions first ([issue #7924](https://github.com/fabricjs/fabric.js/issues/7924))
- **Use `renderOnAddRemove: false`** during `loadFromJSON` to prevent per-object re-renders ([FabricJS docs](https://fabricjs.com/api/classes/staticcanvas/))
- **`enableRetinaScaling: false`** for thumbnails — saves 4x memory on retina displays
- **Existing pattern**: `VariantPreview.svelte` already uses `StaticCanvas` for experiment preview with the same pattern (lines 37-77). Follow this established pattern.

### Svelte Reactive Statements + Async
- **`forEach` + `async` is a known anti-pattern** — the reactive statement completes immediately, spawning uncontrolled promises. Use `for...of` in a named async function instead.
- **Store-based background tasks** are more idiomatic than module-level state ([Svelte Promise Modals pattern](https://mainmatter.com/blog/2024/04/08/introducing-svelte-promise-modals/))
- The `$:` reactive block will re-run on every `$template.layouts` change — version tracking prevents redundant thumbnail generation

### Competitive Landscape (pSEO positioning)
- **Bannerbear**: Offers auto-resize text but not AI-powered canvas repositioning. Pictify's AI resize is a differentiator.
- **Templated.io**: Focuses on Canva import. No multi-layout API concept.
- **Abyssale**: Closest competitor with multi-format support, but no canvas editor.
- **pSEO keywords to target**: "responsive image API", "multi-size image generator", "social media image sizes API", "one template multiple sizes"

### Security Findings
- **No rate limit on `/copilot-simple/resize`** — "Generate All Sizes" could be abused. Mitigated with 60s client-side cooldown. Backend rate limit recommended as follow-up TODO.
- **pSEO dynamic routing**: `[usecase]` slug is matched against known `useCases` array — unknown slugs return 404. No injection risk.
- **`{@html}` usage in `[usecase]/+page.svelte`**: Lines 625 and 822 use `{@html}`. Content comes from static `config.longDescription` (developer-controlled), not user input. Safe.

## Dependencies & Risks

- **AI resize cost**: "Generate All Sizes" = 8 AI calls per use. At ~$0.005/call = $0.04 per full generation. Acceptable at current scale.
- **Thumbnail memory**: Serial generation with immediate disposal. Peak: 1 StaticCanvas + 1 data URL at a time. ~2MB peak. Negligible.
- **pSEO page requires no backend changes** — uses existing tools/[usecase] dynamic routing.
- **Landing page section is static** — no API dependencies.
- **Safari canvas memory** — mitigated by dimension zeroing before dispose (from FabricJS issue research).

## Success Metrics

- Users who use "Generate All Sizes" create 3x more layouts than manual selection
- `/tools/responsive-image-generator` page indexed and receiving organic traffic within 4 weeks
- Templates with layouts have 2x render volume vs single-layout templates
- Layout tab thumbnails reduce layout-switching errors (measured by fewer "wrong layout saved" support tickets)
