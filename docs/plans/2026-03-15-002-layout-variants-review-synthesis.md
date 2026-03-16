# Template Layout Variants -- Multi-Agent Review Synthesis

**Plan reviewed**: `docs/plans/2026-03-15-001-feat-template-layout-variants-plan.md`
**Date**: 2026-03-15
**Agents**: Architecture Strategist, Security Sentinel, Performance Oracle, Code Simplicity Reviewer, Frontend Races Reviewer, Best Practices Researcher

---

## CRITICAL -- Must Fix Before Implementation

### C1. `setTimeout(100)` for layout switch guard will corrupt history
**Source**: Architecture, Performance, Races (all three flagged this independently)
**Location**: Plan Phase 4c (~line 592); Canvas.svelte `isLayoutSwitching` guard

FabricJS v6 `loadFromJSON` returns a Promise and no longer supports callbacks. The plan uses a fixed 100ms `setTimeout` to clear `isLayoutSwitching`, but `loadFromJSON` routinely takes 200-800ms for complex layouts with images. After 100ms the guard drops, `object:added` events fire into `saveState()`, and the history stack fills with half-deserialized intermediate states. Cmd+Z then restores a canvas with 3 of 7 objects.

**Fix**: Use the Promise-based pattern already established in Canvas.svelte page-switching code (lines 762-786):
```javascript
isLayoutSwitching = true;
isLoadingCanvas = true;
fabricCanvas.loadFromJSON(target.fabricJSData).then(() => {
    fabricCanvas.renderAll();
    isLoadingCanvas = false;
    isLayoutSwitching = false;
    saveState();
}).catch(() => {
    isLoadingCanvas = false;
    isLayoutSwitching = false;
});
```

### C2. `populateFabricTemplate` is hardcoded to `this.fabricJSData` -- layouts will always render the default
**Source**: Architecture, Performance
**Location**: `/Users/suyashthakur/html-to-gif/models/Template.js` line 257-274; `template-renderer.js` line 160

The render pipeline calls `template.populateFabricTemplate(variables)` which reads `this.fabricJSData` directly. `resolveLayout()` returns a plain object, not a modified template instance. Layouts will silently render with the default canvas data.

**Fix**: Add an optional `fabricJSDataOverride` parameter:
```javascript
templateSchema.methods.populateFabricTemplate = function (variables = {}, fabricJSDataOverride) {
    const sourceFabricData = fabricJSDataOverride || this.fabricJSData;
    if (!sourceFabricData) throw new Error('Template does not have FabricJS data');
    let fabricData = structuredClone(sourceFabricData);
    // ...
}
```

### C3. Render cache key and inflight coalescing map do not include layout key
**Source**: Performance
**Location**: `/Users/suyashthakur/html-to-gif/routes/template.js` lines 53-55 (`getRenderCacheKey`), line 633 (`inflightTemplateRenders`)

Two concurrent requests for `?layout=twitter-post` and `?layout=youtube-thumbnail` with identical variables will coalesce, and one user silently gets the wrong layout image.

**Fix**: Add `layoutKey` parameter to `getRenderCacheKey` and normalize to `'default'` when absent.

### C4. Prototype pollution via layout keys
**Source**: Security (Finding 1, rated Critical)
**Location**: Plan Phase 1b -- route-level validation; `resolveLayout()` bracket access

The regex `^[a-z0-9-]+$` blocks `__proto__` today, but if ever loosened (e.g., to allow underscores for `linkedin_post`), the door opens. More importantly, `resolveLayout` uses `layouts[layoutKey]` bracket access without `Object.hasOwn()`.

**Fix** (defense-in-depth):
1. Add a forbidden-key blocklist: `__proto__`, `constructor`, `prototype`, `toString`, `valueOf`, `hasOwnProperty`
2. Use `Object.hasOwn(layouts, layoutKey)` in `resolveLayout`
3. Build layout objects with `Object.create(null)` when accepting from request body

### C5. Missing layout key validation on URL param render path
**Source**: Security (Finding 2, rated High)
**Location**: `routes/template-render.js` line 58; `service/url-param-renderer.js`

The current destructuring `const { token, quality: qualityStr, ...variables } = request.query` will sweep `layout` into the `...variables` spread, passing it as a template variable instead of a layout selector. Even if extracted separately, the public render path has no regex validation for layout keys.

**Fix**: Extract `layout` before the spread and validate with `^[a-z0-9-]{1,64}$`.

---

## HIGH -- Should Address Before/During Implementation

### H1. Two components calling `loadFromJSON` -- split-brain orchestration
**Source**: Races (Issue 5)
**Location**: EditorLayout.svelte calls `$editor.loadFromJSON()`; Canvas.svelte manages guards, history, event handlers

When EditorLayout calls `$editor.loadFromJSON()`, Canvas sees `object:added` events but `isLoadingCanvas` is `false` because nobody told Canvas a load started. The `layoutSwitch` event is dispatched *after* `loadFromJSON` is called, creating a race.

**Fix**: Do not call `loadFromJSON` from EditorLayout. Dispatch an intent event with layout data; let Canvas.svelte own the entire load sequence (same as page switching).

### H2. Rapid tab switching corrupts layout data
**Source**: Races (Issue 7)
**Location**: `handleLayoutSwitch` in EditorLayout.svelte

Clicking Default -> Twitter -> YouTube in quick succession: the second click serializes a half-loaded Twitter canvas and saves that corrupted state as the "Twitter" layout. No debounce or cancellation exists.

**Fix**: Disable layout tab buttons while `isLayoutSwitching` is true. Requires exposing the switching state from Canvas to EditorLayout (via store or bound prop).

### H3. Auto-save timer fires during layout switch
**Source**: Races (Issues 2 and 8)
**Location**: Canvas.svelte line 112-121 (30-second `autoSaveTimer`)

The auto-save timer from the previous layout's last edit is still ticking during a switch. It fires, serializes a mid-transition canvas, and saves garbage data.

**Fix**: Clear `autoSaveTimer` at the start of every layout switch.

### H4. Undo/redo not guarded during layout switch
**Source**: Races (Issue 4)
**Location**: Canvas.svelte `performUndo()` / `performRedo()` (lines 131-186)

These functions check `isPerformingUndoRedo` but not `isLayoutSwitching`. Cmd+Z during a switch loads from the old layout's history stack onto a canvas mid-transition, producing a Frankenstein of objects from both layouts.

**Fix**: Add `if (isLayoutSwitching) return;` guard to both `performUndo()` and `performRedo()`.

### H5. Save flow writes active canvas to wrong slot
**Source**: Races (Issue 3)
**Location**: CreateTemplate.svelte line 495

`serializeCanvasWithCustomProps()` reads the live canvas and saves as `templateData.fabricJSData`. If viewing the Twitter layout, this overwrites the default 1080x1080 design with the Twitter canvas.

**Fix**: At save time, serialize the active canvas into the correct slot based on `currentLayoutKey`. For non-active layouts, read from the template store. Do not rely on store being current from a switch that happened minutes ago.

### H6. Incomplete render path coverage -- only 2 of 9 callers addressed
**Source**: Architecture (Concern 3d)
**Location**: Nine call sites of `renderTemplateWithVariables` across the backend

The plan only addresses `POST /templates/:uid/render` and `GET /r/:uid.:format`. Unaddressed callers include: `public-render.js`, `experiment-render.js`, `experiment-renderer.js`, `batch-processor.js`, `binding-renderer.js`, and two connector actions.

**Fix**: If `resolveLayout` is inside `renderTemplateWithVariables`, all callers get it transparently. But callers accepting user input must extract and validate the `layout` param at their own level. List all 9 callers in the plan with "v1 support" or "deferred" labels.

### H7. Public template layout exposure
**Source**: Security (Finding 3, rated High)
**Location**: `service/url-param-renderer.js` line 43

The URL param renderer allows any authenticated user to render any public template's layouts. If layouts contain different branding, this could be unintended data exposure.

**Fix**: Get product decision on whether public templates expose all layouts. Document the choice explicitly.

---

## WARNINGS -- Should Address

### W1. Layout key length not capped
**Source**: Security (Finding 4)
**Fix**: Change regex to `^[a-z0-9-]{1,64}$`.

### W2. Cache poisoning via fallback behavior
**Source**: Security (Finding 8), Architecture (Concern 3h)
Requesting `?layout=nonexistent1`, `?layout=nonexistent2`, etc. each creates a separate cache entry for the same default render, evicting legitimate entries.
**Fix**: Normalize cache key to `'default'` when fallback is used. Also consider defaulting to 400 error instead of silent fallback.

### W3. `layout` property missing from Fastify body schema
**Source**: Security (Finding 6)
**Fix**: Add `layout: { type: 'string', pattern: '^[a-z0-9-]{1,64}$' }` to `renderTemplateSchema`.

### W4. No guard preventing `outputFormat` change to PDF when layouts exist
**Source**: Architecture (Concern 3i)
If a template with layouts changes `outputFormat` to `pdf`, layouts silently become unreachable without being cleaned up.
**Fix**: Add validation in update route: reject `outputFormat` change to `pdf` when `layouts` is non-empty.

### W5. Preset ID = storage key = public API key -- tight coupling
**Source**: Architecture (Concern 3g)
Renaming `twitter-post` to `x-post` in frontend presets makes existing stored layouts unreachable.
**Fix**: Document that preset IDs are part of the public API contract. Add a comment in `ResizeModal.svelte`.

### W6. Empty history for new layouts -- no base state
**Source**: Races (Issue 10)
After switching to a new layout, `historyStack = []` and `historyIndex = -1`. There is no base state to undo to. `isDirty` will be wrong.
**Fix**: After `loadFromJSON` completes for a new layout, push the initial state:
```javascript
historyStack = [fabricCanvas.toJSON(CUSTOM_PROPS)];
historyIndex = 0;
savedHistoryIndex = 0;
```

---

## SIMPLIFICATIONS -- Reduce Scope by ~20% (~125 LOC)

### S1. Eliminate `layouts.store.js` entirely
**Source**: Simplicity
The 4 derived stores (`layoutKeys`, `isDefaultLayout`, `currentLayoutData`, `currentLayoutKey`) are trivially inlined. Use `let currentLayoutKey = null` in `EditorLayout.svelte` and operate on `$template.layouts` directly. **Saves ~50 LOC and 1 file.**

### S2. Merge `layoutHistoryMap` into existing `pageHistoryMap`
**Source**: Simplicity
Instead of two parallel history maps, key the existing map by `${layoutKey || 'default'}:${pageIndex}`. Reuses existing swap/guard mechanism. **Saves ~30 LOC and eliminates a class of "forgot to swap the other history" bugs.**

### S3. Inline `resolveLayout()` in the renderer instead of adding a Mongoose method
**Source**: Simplicity
The method is called exactly once. A 4-line inline const does the same job:
```javascript
const layout = layoutKey && template.layouts?.[layoutKey];
const fabricData = layout ? layout.fabricJSData : template.fabricJSData;
const w = layout ? layout.width : (template.width || 1080);
const h = layout ? layout.height : (template.height || 1080);
```
**Saves ~18 LOC.**

### S4. Remove YAGNI items
| Item | Reason | Savings |
|------|--------|---------|
| `X-Layout-Fallback` / `X-Layout-Requested` headers | No consumer exists | ~5 LOC |
| Post-resize ID validation logging | Cannot act on it at runtime | ~12 LOC |
| `clearLayoutHistory()` export | Layout deletion is deferred | ~5 LOC |
| Overwrite confirmation scaffolding | Plan says "overwrite silently in v1" | ~5 LOC |

---

## PERFORMANCE CONCERNS

### P1. Template list queries will load all layout data without `-layouts` exclusion
**Source**: Performance (Critical-1)
**Location**: `/Users/suyashthakur/html-to-gif/routes/template.js` lines 510, 594, 1336, 1571

Several queries use no projection at all, meaning they will load 300KB-1.2MB documents. The `regenerate-thumbnails` route (line 1571) with no projection and no `.lean()` could load 25MB+ into Node.js heap for 50 templates.

**Fix**: Add `'-layouts'` to all queries that don't need layout data. For render routes, consider projecting only the needed layout.

### P2. Auto-save sends full `layouts` map (500KB+) every 30 seconds
**Source**: Performance (OPT-3)
Even when only the active layout changed, every Cmd+S sends all layouts.

**Fix** (P2 priority): Add `PATCH /templates/:uid/layouts/:key` endpoint using MongoDB dot notation: `{ $set: { 'layouts.twitter-post.fabricJSData': data } }`.

### P3. Browser memory budget: up to 95MB for 20 layouts
**Source**: Performance

| Component | 5 layouts | 20 layouts |
|-----------|-----------|------------|
| Active canvas | 10MB | 10MB |
| History (current layout, 50 entries) | 4MB | 4MB |
| History (other layouts) | 16MB | 76MB |
| Template store | 300KB | 1.2MB |
| **Total** | **~30MB** | **~95MB** |

95MB is concerning for mobile/low-end devices. Consider capping `MAX_HISTORY` to 30 for non-default layouts.

### P4. FabricJS optimization for layout switching
**Source**: Best Practices research
- Set `renderOnAddRemove = false` during `loadFromJSON` to prevent per-object re-renders
- Consider `fabric.FabricObject.ownDefaults.objectCaching = false` during load, re-enable after
- Use `StaticCanvas` for layout preview thumbnails (already done in `VariantPreview.svelte`)

---

## EDGE CASES DISCOVERED

1. **Pages x Layouts interaction**: If someone switches layouts while on page 0 of a multi-page template, history entries could contain snapshots from the wrong page. Guard: refuse layout switch if `outputFormat === 'pdf'`.

2. **Old `handleResizeApply` not removed**: If `on:resize={handleResizeApply}` binding on `ResizeModal` (EditorLayout.svelte line 157) is left alongside the new `on:saveLayout`, both fire. Clean up during refactor.

3. **Undo after layout switch with no base state**: First edit on a new layout creates `historyStack[0]` but `savedHistoryIndex` is -1, so `isDirty` is always true even with no real changes.

4. **MongoDB document size with rich layouts**: 20 layouts at 50KB each = 1MB. With images embedded as data URIs in fabricJSData, individual layouts could be much larger. Consider adding a per-layout size limit (~1MB).

5. **Mongoose document mutation risk**: If `resolveLayout` is implemented by setting `template.fabricJSData = resolved.fabricJSData`, a downstream `save()` call could persist the layout data into the root `fabricJSData` field, destroying the original design.

---

## IMPLEMENTATION PRIORITY ORDER

1. Fix `populateFabricTemplate` to accept override (C2) -- feature is broken without this
2. Add layout key to render cache + inflight map (C3) -- silent data corruption without this
3. Use Promise-based `loadFromJSON` completion, not `setTimeout` (C1) -- history corruption
4. Move all `loadFromJSON` calls into Canvas.svelte (H1) -- split-brain prevention
5. Add prototype pollution defenses (C4) and render path validation (C5) -- security
6. Add auto-save timer clearing (H3) and undo/redo guards (H4) -- data integrity
7. Disable tabs during switch (H2), fix save flow (H5) -- UX correctness
8. Add `-layouts` exclusion to queries (P1) -- performance at scale
9. Apply simplifications S1-S4 -- reduce scope by ~125 LOC
10. Enumerate all 9 render callers (H6), document public template decision (H7) -- completeness
