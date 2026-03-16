---
title: "feat: Template Layout Variants (Multi-Size Resize)"
type: feat
status: completed
date: 2026-03-15
deepened: 2026-03-15
---

# feat: Template Layout Variants (Multi-Size Resize)

## Enhancement Summary

**Deepened on:** 2026-03-15
**Agents used:** Architecture Strategist, Security Sentinel, Performance Oracle, Code Simplicity Reviewer, Frontend Races Reviewer, Best Practices Researcher

### Critical Fixes Applied (from multi-agent review)
1. **C1**: Replace `setTimeout(100)` with Promise-based `loadFromJSON` completion (prevents history corruption)
2. **C2**: Add `fabricJSDataOverride` param to `populateFabricTemplate` (layouts would silently render default without this)
3. **C3**: Add layout key to render cache + inflight coalescing map (prevents cross-layout cache collision)
4. **C4**: Add prototype pollution defenses (`Object.hasOwn()`, forbidden-key blocklist)
5. **C5**: Extract `layout` from URL param renderer before `...variables` spread (prevents bypass)

### Architectural Simplifications Applied
1. Eliminate `layouts.store.js` -- use `let currentLayoutKey` in EditorLayout.svelte directly (~50 LOC saved)
2. Inline layout resolution in renderer instead of adding Mongoose method (~18 LOC saved)
3. Canvas.svelte owns ALL `loadFromJSON` calls (prevents split-brain between EditorLayout and Canvas)
4. Clear auto-save timer on layout switch (prevents stale data serialization)
5. Disable layout tabs during switch (prevents rapid-click data corruption)

### New Edge Cases Addressed
- Undo/redo guarded during layout switch
- New layout gets base state pushed to history stack (prevents `isDirty` false positive)
- URL param renderer extracts `layout` before `...variables` spread
- Reject `outputFormat` change to PDF when layouts exist
- Exclude `-layouts` from list queries for performance

## Overview

Currently, resizing a template for a different platform (e.g., Twitter, YouTube) **overwrites** the original canvas state. Users lose their original design and cannot serve multiple sizes from one template.

This feature adds a `layouts` map to the Template model so one template stores multiple size variants. Each layout has its own `fabricJSData`, `width`, and `height`. Variable definitions are shared across all layouts. The render API supports `?layout=twitter-post` to serve a specific size.

**Architecture decisions (from CEO review):**
1. Layouts map on the same template (not fork to new template)
2. Root-level `fabricJSData` remains the default -- `layouts` is additive
3. Preserve element IDs in AI resize prompt for variable binding
4. Per-layout undo/redo isolation via `layoutHistoryMap` (reuses `pageHistoryMap` pattern)
5. Auto-save current layout in-memory on tab switch (no confirmation dialog)
6. Fallback to default layout on missing layout key with `X-Layout-Fallback: true` header
7. No migration needed -- lazy defaults (`template.layouts || {}`)
8. Layout key regex validation (`^[a-z0-9-]+$`)
9. Layouts are image-only in v1 (PDF templates do not support layouts)
10. Max 20 layouts per template

## Problem Statement

A user designs a template at 1080x1080 (Instagram Post). They want it for Twitter (1200x675) and YouTube (1280x720). Today:

1. User opens ResizeModal, selects Twitter, AI generates resized layout
2. User clicks "Use This" -- **original 1080x1080 layout is destroyed**
3. Only recoverable via undo history (50-step limit, per-session, not persisted)
4. To maintain both sizes, user must create separate templates -- no shared variables, no single API endpoint

## Proposed Solution

```
Template {
  uid: 'abc-123',
  fabricJSData: { ... },        // default layout (original size)
  width: 1080, height: 1080,
  layouts: {
    'twitter-post': {
      width: 1200, height: 675,
      fabricJSData: { ... },
      name: 'Twitter/X Post',
      createdAt: Date
    },
    'youtube-thumbnail': {
      width: 1280, height: 720,
      fabricJSData: { ... },
      name: 'YouTube Thumbnail',
      createdAt: Date
    }
  },
  variableDefinitions: [ ... ]  // shared across ALL layouts
}
```

**Render API:**
```
GET /image/abc-123                        -> default 1080x1080
GET /image/abc-123?layout=twitter-post    -> 1200x675 Twitter version
POST /templates/abc-123/render            -> default
POST /templates/abc-123/render  { layout: 'twitter-post' }  -> Twitter version
```

**Editor UX:**
```
[Default 1080x1080] [Twitter 1200x675] [YouTube 1280x720]  <-- tab bar
```

## Technical Approach

### Architecture

```
                          EDITOR (Frontend)
                          +----------------------------------+
                          |  TopBar                           |
                          |    [Resize] button                |
                          |        |                          |
                          |  ResizeModal                      |
                          |    select presets -> AI resize     |
                          |    "Use This" -> saves to layout  |
                          |        |                          |
                          |  EditorLayout                     |
                          |    [Default] [Twitter] [YT] tabs  |
                          |    switch layout -> loadFromJSON   |
                          |        |                          |
                          |  Canvas.svelte                    |
                          |    fabricCanvas state              |
                          |    undo/redo per layout            |
                          +----------------------------------+
                                     | save
                                     v
                          BACKEND (Fastify)
                          +----------------------------------+
                          |  PUT /templates/:uid              |
                          |    body: { fabricJSData,          |
                          |            layouts, width, ... }  |
                          |        |                          |
                          |  Template Model (MongoDB)         |
                          |    fabricJSData  <- default        |
                          |    layouts: {                     |
                          |      'twitter': { fabricJSData }  |
                          |      'youtube': { fabricJSData }  |
                          |    }                              |
                          |    variableDefinitions: [shared]  |
                          +----------------------------------+
                                     | render
                                     v
                          RENDER PIPELINE
                          +----------------------------------+
                          |  GET /image/:uid?layout=twitter   |
                          |    1. Load template               |
                          |    2. Pick layout or default      |
                          |    3. populateFabricTemplate()    |
                          |    4. Render -> CDN               |
                          +----------------------------------+
```

### Implementation Phases

#### Phase 1: Backend -- Schema + Resize Prompt (3 files)

**1a. Template Model** (`/Users/suyashthakur/html-to-gif/models/Template.js`)

Add `layouts` field to schema:

```javascript
// After the pages field (~line 124)
layouts: {
  type: Object,
  default: {}
  // Each value: { fabricJSData: Object, width: Number, height: Number, name: String, createdAt: Date }
}
```

Add validation in pre-save hook or route-level:
- Max 20 layouts per template
- Layout keys must match `^[a-z0-9-]{1,64}$` (length-capped)
- Each layout must have `fabricJSData`, `width`, `height`
- Layouts only allowed when `outputFormat === 'image'` (not PDF)
- Reject `outputFormat` change to `pdf` when `layouts` is non-empty

Update `populateFabricTemplate` to accept optional override (**CRITICAL -- C2**):

```javascript
// models/Template.js ~line 257
templateSchema.methods.populateFabricTemplate = function (variables = {}, fabricJSDataOverride) {
    const sourceFabricData = fabricJSDataOverride || this.fabricJSData;
    if (!sourceFabricData) throw new Error('Template does not have FabricJS data');
    let fabricData = structuredClone(sourceFabricData);
    // ... rest of method unchanged
}
```

> **Note (Simplification S3):** No `resolveLayout()` Mongoose method needed. Layout resolution is inlined in the renderer (4 lines). See Phase 2a.

**1b. Template Routes** (`/Users/suyashthakur/html-to-gif/routes/template.js`)

Update the update route (~line 517) to accept and validate `layouts`:

```javascript
// Forbidden keys to prevent prototype pollution (C4)
const FORBIDDEN_LAYOUT_KEYS = new Set([
  '__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty'
]);

// In the update handler, after existing field mapping
if (req.body.layouts !== undefined) {
  // Build clean object to prevent prototype pollution (C4)
  const rawLayouts = req.body.layouts || {};
  const layouts = Object.create(null);
  const keys = Object.keys(rawLayouts);

  // Validate max layouts
  if (keys.length > 20) {
    return reply.status(400).send({ error: 'Maximum 20 layouts per template' });
  }

  // Validate keys and values
  const keyPattern = /^[a-z0-9-]{1,64}$/;
  for (const key of keys) {
    if (FORBIDDEN_LAYOUT_KEYS.has(key) || !keyPattern.test(key)) {
      return reply.status(400).send({ error: `Invalid layout key: ${key}` });
    }
    const layout = rawLayouts[key];
    if (!layout.fabricJSData || !layout.width || !layout.height) {
      return reply.status(400).send({ error: `Layout '${key}' missing required fields` });
    }
    layouts[key] = {
      fabricJSData: layout.fabricJSData,
      width: layout.width,
      height: layout.height,
      name: layout.name || key,
      createdAt: layout.createdAt || new Date()
    };
  }

  // Reject layouts on PDF templates (W4)
  if (keys.length > 0 && template.outputFormat === 'pdf') {
    return reply.status(400).send({ error: 'Layouts not supported on PDF templates' });
  }

  updateData.layouts = layouts;
}
```

**1c. Resize Prompt** (`/Users/suyashthakur/html-to-gif/routes/copilot-simple.js`)

Add ID preservation rule to the resize prompt (~line 224):

```javascript
const resizePrompt = `Resize this FabricJS canvas from ${sourceWidth}x${sourceHeight} to ${targetWidth}x${targetHeight}.

Rules:
- CRITICAL: Preserve all object \`id\` fields exactly as they appear in the source canvas. Do not rename or regenerate IDs.
- Maintain relative visual hierarchy (largest element stays largest)
- Keep text readable (minimum font size 12px)
- Maintain padding/margins proportionally
- Center-align elements that were centered
- Stack elements vertically if horizontal space is insufficient
- Scale images proportionally, never stretch
- Keep elements within canvas bounds with at least 5% padding
- Return ONLY valid FabricJS JSON canvas state`;
```

Add post-resize validation after `runSimpleCopilot` returns (~line 250):

```javascript
// Validate element ID preservation
const sourceIds = (canvasState.objects || []).map(o => o.id).filter(Boolean);
const resizedIds = (result.canvasState?.objects || []).map(o => o.id).filter(Boolean);
const missingIds = sourceIds.filter(id => !resizedIds.includes(id));
if (missingIds.length > 0) {
  logger.warn({
    type: 'resize_id_mismatch',
    templateUid,
    missingIds,
    sourceCount: sourceIds.length,
    resizedCount: resizedIds.length
  });
}
```

#### Phase 2: Backend -- Render Pipeline (3 files)

**2a. Template Renderer** (`/Users/suyashthakur/html-to-gif/service/template-renderer.js`)

Update `renderTemplateWithVariables` to accept optional `layoutKey` with inline resolution (**C2 + S3**):

```javascript
// ~line 111, add layoutKey to options
async function renderTemplateWithVariables(template, variables, options = {}) {
  const { format, quality, uploadToStorage, width: widthOverride, height: heightOverride, layoutKey } = options;

  // Inline layout resolution (S3 -- no Mongoose method needed)
  const layout = layoutKey && Object.hasOwn(template.layouts || {}, layoutKey)
    ? template.layouts[layoutKey]
    : null;
  const fabricDataSource = layout ? layout.fabricJSData : template.fabricJSData;
  const baseWidth = layout ? layout.width : (template.width || 1080);
  const baseHeight = layout ? layout.height : (template.height || 1080);

  // CRITICAL (C2): Pass override to populateFabricTemplate so layouts don't
  // silently render the default canvas
  const fabricData = template.populateFabricTemplate(variables, fabricDataSource);

  // Apply dimension overrides (widthOverride/heightOverride take precedence)
  fabricData.width = widthOverride || baseWidth;
  fabricData.height = heightOverride || baseHeight;

  // ... rest of render pipeline unchanged
}
```

**2b. Render Route** (`/Users/suyashthakur/html-to-gif/routes/template.js`)

Update render endpoint (~line 584) to accept `layout` parameter:

```javascript
// Add layout to Fastify body schema (W3)
const renderTemplateSchema = {
  body: {
    type: 'object',
    properties: {
      // ... existing properties ...
      layout: { type: 'string', pattern: '^[a-z0-9-]{1,64}$' }
    }
  }
};

// In render route handler
const layoutKey = req.body.layout || req.query.layout || null;

// Validate layout key (defense-in-depth beyond schema)
if (layoutKey && !/^[a-z0-9-]{1,64}$/.test(layoutKey)) {
  return reply.status(400).send({ error: 'Invalid layout key' });
}

// Pass to renderer
const result = await renderTemplateWithVariables(template, variables, {
  format, quality, uploadToStorage, layoutKey
});
```

Update render cache key AND inflight coalescing map to include layout (**CRITICAL -- C3**):

```javascript
// ~line 53, update getRenderCacheKey to accept layoutKey
function getRenderCacheKey(uid, variables, format, quality, width, height, version, layoutKey) {
  // Normalize: missing layout = 'default' (prevents cache poisoning via fallback -- W2)
  const normalizedLayout = (layoutKey && Object.hasOwn(template.layouts || {}, layoutKey))
    ? layoutKey : 'default';
  return crypto.createHash('sha256')
    .update(`${uid}:${normalizedLayout}:${JSON.stringify(variables)}:${format}:${quality}:${width}:${height}:${version}`)
    .digest('hex');
}

// ~line 633, update inflightTemplateRenders key similarly
const inflightKey = `${template.uid}:${layoutKey || 'default'}:${variablesHash}`;
```

**2c. URL Param Renderer** (`/Users/suyashthakur/html-to-gif/service/url-param-renderer.js`)

**CRITICAL (C5):** Extract `layout` BEFORE the `...variables` spread to prevent it being treated as a template variable:

```javascript
// ~line 58, BEFORE the destructuring spread
const { token, quality: qualityStr, layout: layoutKey, ...variables } = request.query;
//                                   ^^^^^^^^^^^^^^^ extract layout explicitly

// Validate layout key
if (layoutKey && !/^[a-z0-9-]{1,64}$/.test(layoutKey)) {
  return reply.status(400).send({ error: 'Invalid layout key' });
}

// Pass through to renderTemplateWithVariables
const result = await renderTemplateWithVariables(template, variables, {
  format, quality, uploadToStorage, layoutKey
});
```

#### Phase 3: Frontend -- Store + API (3 files)

**3a. Template Store** (`/Users/suyashthakur/front-end-html-to-gif/src/store/template.store.js`)

Add `layouts` to the template writable default:

```javascript
export const template = writable({
  uid: null,
  name: null,
  html: null,
  fabricJSData: null,
  width: null,
  height: null,
  variables: null,
  createdAt: null,
  type: null,
  outputFormat: 'image',
  pdfPreset: 'A4',
  pages: [],
  layouts: {}  // NEW
});
```

Also reset `layouts: {}` in `getTemplateAction` error paths.

**3b. ~~Layouts Store~~ -- ELIMINATED (Simplification S1)**

> No separate `layouts.store.js` needed. The 4 derived stores are trivially inlined.
> Use `let currentLayoutKey = null` as a local variable in EditorLayout.svelte.
> Operate on `$template.layouts` directly. Saves ~50 LOC and 1 file.
>
> Layout mutations go through `template.update()` directly:
> ```javascript
> // Save a layout
> template.update(t => ({
>   ...t,
>   layouts: { ...t.layouts, [key]: { fabricJSData, width, height, name, createdAt: new Date() } }
> }));
> ```

**3c. Template API** (`/Users/suyashthakur/front-end-html-to-gif/src/api/template.js`)

Ensure `updateTemplate` passes `layouts` through:

```javascript
// In updateTemplate function, the existing code should already pass
// the full template object. Verify that layouts is included.
export const updateTemplate = async (template) => {
  const response = await backend.put(`/templates/${template.uid}`, {
    ...template,
    layouts: template.layouts || {}  // ensure layouts is always sent
  });
  return response;
};
```

Update `renderTemplate` to support layout parameter:

```javascript
export const renderTemplate = async (uid, variables, options = {}) => {
  const { format, quality, layout } = options;
  const response = await backend.post(`/templates/${uid}/render`, {
    variables,
    format,
    quality,
    layout  // NEW - pass layout key to backend
  });
  return response;
};
```

#### Phase 4: Frontend -- Editor UX (3 files)

**4a. ResizeModal.svelte** (`/Users/suyashthakur/front-end-html-to-gif/src/lib/components/editor/ResizeModal.svelte`)

Change `useResult` to dispatch a `saveLayout` event instead of `resize`:

```javascript
function useResult(result) {
  dispatch('saveLayout', {
    key: result.preset.id,       // e.g., 'twitter-post'
    canvasState: result.canvasState,
    width: result.preset.width,
    height: result.preset.height,
    name: result.preset.label    // e.g., 'Twitter/X Post'
  });
  // Don't close modal -- user may want to save multiple layouts
}
```

Add visual feedback: mark "Use This" as "Saved" after dispatch, disable re-click.

Handle existing layout overwrite: check if `template.layouts[key]` already exists, show confirmation.

**4b. EditorLayout.svelte** (`/Users/suyashthakur/front-end-html-to-gif/src/lib/components/editor/EditorLayout.svelte`)

Replace `handleResizeApply` with `handleSaveLayout`. **Remove old `on:resize` binding (edge case #2).**

**CRITICAL (H1):** EditorLayout does NOT call `loadFromJSON` directly. It dispatches an intent event; Canvas.svelte owns the entire load sequence.

```javascript
import { template } from '../../../store/template.store';

let currentLayoutKey = null;  // local var, no separate store (S1)
let isLayoutSwitching = false; // exposed from Canvas via bind

function handleSaveLayout(event) {
  const { key, canvasState, width, height, name } = event.detail;
  if (!canvasState) {
    toast.set({ message: 'Failed to save layout', type: 'error' });
    return;
  }

  // Save layout to template store (direct mutation, no store needed -- S1)
  template.update(t => ({
    ...t,
    layouts: { ...t.layouts, [key]: { fabricJSData: canvasState, width, height, name, createdAt: new Date() } }
  }));
  toast.set({ message: `Saved ${name} layout`, type: 'success' });
}

function handleLayoutSwitch(key) {
  if (isLayoutSwitching) return; // Prevent rapid clicks (H2)

  // Resolve target layout data
  const target = key === null
    ? { fabricJSData: $template.fabricJSData, width: $template.width, height: $template.height }
    : $template.layouts?.[key];

  if (!target?.fabricJSData) {
    toast.set({ message: 'Layout data not found', type: 'error' });
    return;
  }

  // Dispatch intent to Canvas -- Canvas owns serialization, loadFromJSON, and history swap (H1)
  dispatch('layoutSwitch', {
    fromLayoutKey: currentLayoutKey,
    toLayoutKey: key,
    targetData: target
  });

  currentLayoutKey = key;
}
```

Add layout tab bar to template (before or after the PageNavigator):

```svelte
<!-- Layout Tabs (only show when layouts exist) -->
{#if Object.keys($template.layouts || {}).length > 0}
  <div class="flex items-center gap-1 px-4 py-2 border-b-[3px] border-gray-900 bg-gray-50 overflow-x-auto">
    <!-- Default tab -->
    <button
      on:click={() => handleLayoutSwitch(null)}
      disabled={isLayoutSwitching}
      class="px-3 py-1.5 text-xs font-bold border-2 whitespace-nowrap transition-all
        {currentLayoutKey === null
          ? 'border-gray-900 bg-[#ffc480]/20 shadow-[2px_2px_0_0_#1f2937]'
          : 'border-gray-200 hover:border-gray-400'}
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Default {$template.width}x{$template.height}
    </button>

    <!-- Layout tabs -->
    {#each Object.entries($template.layouts || {}) as [key, layout]}
      <button
        on:click={() => handleLayoutSwitch(key)}
        disabled={isLayoutSwitching}
        class="px-3 py-1.5 text-xs font-bold border-2 whitespace-nowrap transition-all
          {currentLayoutKey === key
            ? 'border-gray-900 bg-[#ffc480]/20 shadow-[2px_2px_0_0_#1f2937]'
            : 'border-gray-200 hover:border-gray-400'}
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {layout.name || key} <span class="text-gray-400 ml-1">{layout.width}x{layout.height}</span>
      </button>
    {/each}
  </div>
{/if}
```

Update the ResizeModal event binding:

```svelte
<ResizeModal bind:show={showResizeModal} on:saveLayout={handleSaveLayout} />
```

**4c. Canvas.svelte** (`/Users/suyashthakur/front-end-html-to-gif/src/lib/components/editor/Canvas.svelte`)

Canvas.svelte owns ALL layout switching logic (**H1 -- single orchestrator, no split-brain**).

```javascript
// After line 55
let layoutHistoryMap = {};
let currentLayoutKey = null;
export let isLayoutSwitching = false; // Exposed via bind: to disable tabs in EditorLayout (H2)

// Canvas owns the FULL layout switch sequence (H1)
async function handleLayoutSwitch(event) {
  const { fromLayoutKey, toLayoutKey, targetData } = event.detail;
  if (isLayoutSwitching) return;

  isLayoutSwitching = true;
  isLoadingCanvas = true; // Prevents saveState during load

  // (H3) Clear auto-save timer to prevent stale data serialization
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }

  // 1. Serialize current canvas state and save to template store
  const currentState = fabricCanvas.toJSON(CUSTOM_PROPS);
  // (H5) Save to correct slot based on fromLayoutKey
  if (fromLayoutKey === null) {
    template.update(t => ({ ...t, fabricJSData: currentState }));
  } else {
    template.update(t => ({
      ...t,
      layouts: { ...t.layouts, [fromLayoutKey]: { ...t.layouts[fromLayoutKey], fabricJSData: currentState } }
    }));
  }

  // 2. Save current layout's undo history
  const historyKey = currentLayoutKey || '__default__';
  layoutHistoryMap[historyKey] = {
    historyStack: [...historyStack],
    historyIndex,
    savedHistoryIndex
  };

  // 3. Restore target layout's undo history
  const targetKey = toLayoutKey || '__default__';
  const saved = layoutHistoryMap[targetKey];
  if (saved) {
    historyStack = saved.historyStack;
    historyIndex = saved.historyIndex;
    savedHistoryIndex = saved.savedHistoryIndex;
  } else {
    // (W6) Fresh layout -- will push initial state AFTER loadFromJSON completes
    historyStack = [];
    historyIndex = -1;
    savedHistoryIndex = -1;
  }

  currentLayoutKey = toLayoutKey;

  // 4. Load target canvas -- CRITICAL (C1): use Promise, not setTimeout
  try {
    fabricCanvas.setWidth(targetData.width);
    fabricCanvas.setHeight(targetData.height);

    // FabricJS v6 loadFromJSON returns a Promise
    await fabricCanvas.loadFromJSON(targetData.fabricJSData);
    fabricCanvas.renderAll();

    // (W6) Push initial state for new layouts so undo has a base state
    if (!saved) {
      historyStack = [fabricCanvas.toJSON(CUSTOM_PROPS)];
      historyIndex = 0;
      savedHistoryIndex = 0;
    }
  } catch (err) {
    showToast('Failed to load layout', 'error');
  } finally {
    isLoadingCanvas = false;
    isLayoutSwitching = false;
    updateHistoryFlags();
  }
}
```

Add `isLayoutSwitching` guard to `saveState()`, `performUndo()`, and `performRedo()`:

```javascript
// In saveState() (~line 64), add to the guard conditions
if (!fabricCanvas || isPerformingUndoRedo || isLoadingCanvas || isBatchingActive || isPageSwitching || isLayoutSwitching) {
  return;
}

// (H4) In performUndo() (~line 131) and performRedo() (~line 160), add:
if (isLayoutSwitching) return;
```

#### Phase 5: Frontend -- Save Flow Integration (1 file)

**5a. CreateTemplate.svelte** (`/Users/suyashthakur/front-end-html-to-gif/src/lib/components/dashboard/template/CreateTemplate.svelte`)

Update save flow to include layouts and current layout state (**H5 -- write to correct slot**):

```javascript
// In saveTemplate() / updateTemplate(), after serializing current canvas
// (~line 495-665)

// The live canvas contains whichever layout is currently active.
// Serialize it and place it in the correct slot.
const activeLayoutKey = /* get from EditorLayout via prop or store */;
const currentFabricData = serializeCanvasWithCustomProps();

// Build save payload: active layout gets live canvas, others from store
const templateStoreData = get(template);
let layoutsForSave = { ...(templateStoreData.layouts || {}) };
let defaultFabricData = templateStoreData.fabricJSData;

if (activeLayoutKey === null) {
  // Viewing default -- live canvas IS the default
  defaultFabricData = currentFabricData;
} else if (layoutsForSave[activeLayoutKey]) {
  // Viewing a layout -- live canvas goes to that layout's slot
  layoutsForSave[activeLayoutKey] = {
    ...layoutsForSave[activeLayoutKey],
    fabricJSData: currentFabricData
  };
  // Default stays as-is from store (was saved on last layout switch)
}

const templateData = {
  ...existingFields,
  fabricJSData: defaultFabricData,
  layouts: layoutsForSave,
  width: activeLayoutKey === null ? fabricCanvas.width : templateStoreData.width,
  height: activeLayoutKey === null ? fabricCanvas.height : templateStoreData.height,
  // ... other fields
};
```

## System-Wide Impact

### Interaction Graph
- ResizeModal "Use This" -> `dispatch('saveLayout')` -> EditorLayout `handleSaveLayout` -> `layoutActions.saveLayout()` -> template store update
- Layout tab click -> EditorLayout `handleLayoutSwitch` -> Canvas `handleLayoutSwitch` (history swap) -> `loadFromJSON` (canvas swap)
- Template save -> CreateTemplate merges active layout's live state -> `PUT /templates/:uid` with `layouts` map
- Render API -> `template.resolveLayout(layoutKey)` -> `populateFabricTemplate()` -> render

### Error Propagation
- AI resize failure: caught in `resizeSingle()` -> shows "Failed" badge per-platform -> no layout created
- Invalid FabricJS from AI: `loadFromJSON` error caught in `handleLayoutSwitch` try/catch -> toast error, stay on current layout
- Layout key validation: 400 error from backend -> frontend shows error toast
- Missing layout on render: silent fallback to default with `X-Layout-Fallback` header + backend warn log

### State Lifecycle Risks
- **Auto-save race**: `isLayoutSwitching` guard prevents `saveState()` from capturing wrong layout's state during switch
- **Dirty tracking**: `isDirty` remains a single boolean -- true if ANY layout has unsaved changes. This matches the existing page-switching behavior.
- **Layout delete with unsaved changes**: `clearLayoutHistory()` cleans up undo history. Template store update removes the layout. No orphan state.

### API Surface Parity
All render paths need the `layout` parameter:
- `POST /templates/:uid/render` -- body `{ layout }` (Phase 2b)
- `GET /r/:uid.:format` (URL param renderer) -- query `?layout=` (Phase 2c)
- `POST /templates/:uid/multi-size-render` -- already renders multiple sizes, no change needed
- `POST /templates/:uid/batch` -- add optional `layout` column (deferred to TODO)

## Acceptance Criteria

### Functional Requirements
- [x] Resize "Use This" saves result as a layout variant, does NOT overwrite default canvas
- [x] Layout tab bar appears when template has 1+ layouts
- [x] Clicking layout tabs switches canvas state, dimensions, and undo/redo history
- [x] Saving template persists all layouts to backend
- [x] Render API `?layout=twitter-post` returns the Twitter-sized image
- [x] Render API without `?layout` returns the default image (backward compatible)
- [x] Missing layout key falls back to default (inline resolution in renderer)
- [x] Layout keys validated: `^[a-z0-9-]{1,64}$`, max 20 per template
- [x] Element IDs preserved across AI resize for variable binding
- [x] Variables render correctly on all layouts (via populateFabricTemplate override)

### Non-Functional Requirements
- [x] Zero migration needed -- existing templates unaffected
- [x] Render cache includes layout key (no cross-layout cache collision)
- [x] Log `resize_id_mismatch` warnings when AI drops element IDs

### Quality Gates
- [x] Backend: validate layout key format and max count on save
- [x] Frontend: layout switch protected by `isLayoutSwitching` guard (no race conditions)
- [x] Frontend: error handling for `loadFromJSON` failure during layout switch

## Files Changed

| # | File | Repo | Change |
|---|------|------|--------|
| 1 | `models/Template.js` | backend | Add `layouts: Object` field, update `populateFabricTemplate` with override param (C2) |
| 2 | `routes/copilot-simple.js` | backend | Add ID preservation to resize prompt, post-resize validation |
| 3 | `routes/template.js` | backend | Accept/validate `layouts` on update (C4 prototype pollution), support `?layout` on render, update cache key + inflight map (C3), add `layout` to Fastify schema (W3), add `-layouts` exclusion to list queries (P1) |
| 4 | `service/template-renderer.js` | backend | Accept `layoutKey` option, inline layout resolution (S3), pass override to `populateFabricTemplate` (C2) |
| 5 | `service/url-param-renderer.js` | backend | Extract `layout` before `...variables` spread (C5), validate, pass to renderer |
| 6 | `src/store/template.store.js` | frontend | Add `layouts: {}` to default template state |
| 7 | ~~`src/store/layouts.store.js`~~ | frontend | **ELIMINATED** (S1) -- use local variable in EditorLayout |
| 8 | `src/api/template.js` | frontend | Pass `layouts` in update, add `layout` param to render |
| 9 | `src/lib/components/editor/ResizeModal.svelte` | frontend | Change `useResult` to dispatch `saveLayout` event |
| 10 | `src/lib/components/editor/EditorLayout.svelte` | frontend | Layout tab bar, `handleSaveLayout`, layout switch intent dispatch, disable tabs during switch (H2) |
| 11 | `src/lib/components/editor/Canvas.svelte` | frontend | Full layout switch orchestration (H1), Promise-based loadFromJSON (C1), `layoutHistoryMap`, auto-save timer clear (H3), undo/redo guard (H4), base state for new layouts (W6) |
| 12 | `src/lib/components/dashboard/template/CreateTemplate.svelte` | frontend | Correct-slot save flow (H5) |

**Total: 11 files** (down from 12 -- layouts store eliminated)

## Performance Considerations (from Performance Oracle)

### P1. Exclude layouts from list queries (CRITICAL)
Template list queries (`GET /templates`) load full documents including all layout data. Add `-layouts` projection:
```javascript
// routes/template.js -- list/search queries
Template.find({ team: teamId }).select('-layouts -fabricJSData').lean();
// Only load layouts when fetching a single template for editing/rendering
```

### P2. FabricJS load optimization
During layout switch, prevent per-object re-renders:
```javascript
fabricCanvas.renderOnAddRemove = false;
await fabricCanvas.loadFromJSON(targetData.fabricJSData);
fabricCanvas.renderOnAddRemove = true;
fabricCanvas.renderAll();
```

### P3. Memory budget
| Component | 5 layouts | 20 layouts |
|-----------|-----------|------------|
| Active canvas | 10MB | 10MB |
| History (current, 50 entries) | 4MB | 4MB |
| History (other layouts) | 16MB | 76MB |
| **Total** | **~30MB** | **~95MB** |

Consider capping `MAX_HISTORY` to 30 for non-default layouts on templates with >8 layouts.

## Render Path Coverage (H6)

All callers of `renderTemplateWithVariables` -- layout support status:

| Caller | File | Layout support | Status |
|--------|------|---------------|--------|
| Template render route | `routes/template.js:584` | Extract from body/query | **v1** |
| URL param renderer | `service/url-param-renderer.js` | Extract before spread | **v1** |
| Public render | `routes/public-render.js` | Extract from body | **v1** |
| Experiment render | `routes/experiment-render.js` | N/A (uses template directly) | Deferred |
| Experiment renderer service | `service/experiment-renderer.js` | N/A | Deferred |
| Batch processor | `service/batch-processor.js` | Add CSV column | Deferred |
| Binding renderer | `service/binding-renderer.js` | N/A (internal) | Deferred |
| Connector actions | Various | N/A | Deferred |

> **Note:** Since layout resolution happens inside `renderTemplateWithVariables`, ALL callers get layout support transparently once they pass `layoutKey`. The only requirement is extracting and validating the key at the route level.

## Dependencies & Risks

- **AI non-determinism**: LLM may not always preserve element IDs despite prompt instruction. Mitigated by post-resize validation + warning log. Variables will still work for layouts where IDs are preserved.
- **Document size**: 8 layouts x 50KB = 400KB. Well within MongoDB 16MB limit. Cap at 20 layouts as safety.
- **Editor memory**: 8 layouts x 50 history entries x 50KB = 20MB for 5 layouts. Up to 95MB for 20 layouts -- consider reducing history depth for non-default layouts.
- **Prototype pollution**: Mitigated by `Object.create(null)`, forbidden-key blocklist, and `Object.hasOwn()` checks (C4).
- **Cache poisoning**: Mitigated by normalizing cache key to `'default'` when layout not found (W2).

## NOT in Scope (Deferred)

| Item | Rationale | Priority |
|------|-----------|----------|
| Auto-resize stale layouts when base changes | V2 -- requires re-running AI, expensive | P2 |
| Layout preview thumbnails in tabs | Polish item | P3 |
| Layouts on PDF templates | Pages x layouts = N*M complexity | P3 |
| Custom dimension layouts (non-preset) | V2 feature | P3 |
| Layout-aware experiments | Current experiment model works independently | P3 |
| Batch render `layout` CSV column | Low demand, easy to add later | P3 |
| Layout deletion UI | Users can re-resize to overwrite. Delete via API if needed | P2 |

## Success Metrics

- Users can resize without losing original design
- Templates with layouts serve correct size via `?layout=` parameter
- Zero backward compatibility issues for existing templates
