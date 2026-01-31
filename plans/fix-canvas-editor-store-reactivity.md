# fix: Canvas Editor Store Reactivity Issues

## Enhancement Summary

**Deepened on:** 2026-01-26
**Sections enhanced:** 6 (all major sections)
**Review agents used:** architecture-strategist, performance-oracle, code-simplicity-reviewer, julik-frontend-races-reviewer, kieran-typescript-reviewer, pattern-recognition-specialist

### Key Improvements from Research
1. **Simplified architecture**: Keep `isPreviewActive` as single writable store in engine file (not a full new store file)
2. **Race condition mitigations**: Add operation locking, abort controllers, and proper cleanup
3. **Performance optimizations**: Batch rendering, RAF-aligned debouncing, version counter for Map updates
4. **Svelte 5 patterns**: Use `SvelteMap` for reactive Maps or version counter pattern

### Critical Findings
- The plan can be **significantly simplified** - only `isPreviewActive` needs to be reactive
- Race conditions identified in preview toggle, debounced updates, and page switching
- Map immutability fix is essential but should use version counter pattern for O(1) reactivity
- Preview clones may be serialized during page switch - must clear preview BEFORE `toJSON()`

---

## Overview

The canvas editor has store reactivity problems where variable changes are not reflected immediately throughout the editor (particularly in preview) without a manual page refresh. This issue stems from **non-reactive module-level state** in the preview engine and **inconsistent store update patterns** in the variables store.

## Problem Statement

**Symptoms:**
- Variable test value changes don't immediately update the preview
- Toggling preview mode doesn't always reflect current variable values
- Adding/modifying canvas objects with variables requires manual refresh to sync
- Preview state can become corrupted when switching pages or using undo/redo

**Root Causes Identified:**

1. **Module-level non-reactive state** in `canvas-preview-engine.js` (lines 14-17):
   ```javascript
   let originalStates = new Map();  // NOT a Svelte store
   let loopClones = [];              // NOT a Svelte store
   let isPreviewActive = false;      // NOT a Svelte store
   ```

2. **Dual `isPreviewActive` sources of truth**:
   - `VariablesPanel.svelte:62` has `let isPreviewActive = false` (local)
   - `canvas-preview-engine.js:17` has `let isPreviewActive = false` (module-level)

3. **Map mutation before copying** in `variables.store.js:267-269`:
   ```javascript
   variablesMap.update(map => {
       map.set(sanitizedName, variable);  // Mutates THEN copies
       return new Map(map);
   });
   ```

4. **Debouncing with local timeouts** instead of proper store subscriptions

5. **No canvas update notification** after preview operations complete

## Proposed Solution

### Architecture: Simplified Approach (Recommended by Code Simplicity Review)

**Instead of a full `preview.store.js`**, convert only `isPreviewActive` to a writable store in the engine file. The other module-level variables (`originalStates`, `loopClones`) don't need reactivity - they're internal implementation details.

```
+---------------------------+
| canvas-preview-engine.js  |
|---------------------------|
| export isPreviewActive    |  (writable store - REACTIVE)
| let originalStates        |  (Map - internal, not reactive)
| let loopClones            |  (Array - internal, not reactive)
+-------------+-------------+
              |
    +---------+---------+
    |                   |
+---v---------------+   |
| VariablesPanel    |   |
|-------------------|   |
| $isPreviewActive  |   |  (subscribes to store)
| testValues (local)|   |  (component state)
+-------------------+   |
                        |
              +---------v---------+
              | Canvas.svelte     |
              |-------------------|
              | get(isPreviewActive) (checks on page switch)
              +-------------------+
```

### Research Insights

**From simplicity review:** The plan was over-engineered. Only 1 of 3 module-level variables needs reactivity. Creating a full `preview.store.js` with 5 derived stores and 8 action methods is YAGNI.

**From architecture review:** Keep `canvas-preview-engine.js` stateless where possible. Pass canvas as parameter, don't couple engine to store.

**Total changes needed: ~30 lines across 3 files (down from ~250 lines across 6 files)**

## Technical Approach

### Phase 1: Convert isPreviewActive to Writable Store (SIMPLIFIED)

**File:** `src/lib/utils/canvas-preview-engine.js`

```javascript
// BEFORE (lines 14-17)
let originalStates = new Map();
let loopClones = [];
let isPreviewActive = false;

// AFTER - Only isPreviewActive becomes reactive
import { writable, get } from 'svelte/store';

export const isPreviewActive = writable(false);

// Keep these as module-level (they don't need reactivity):
let originalStates = new Map();
let loopClones = [];

// Update applyPreview to use store
export async function applyPreview(canvas, testValues) {
    if (get(isPreviewActive)) {
        await clearPreview(canvas);
    }

    // ... existing logic for storing original states ...

    isPreviewActive.set(true);  // Use store.set()
    canvas.requestRenderAll();
}

// Update clearPreview to use store
export function clearPreview(canvas) {
    if (!get(isPreviewActive)) return;

    // ... existing cleanup logic ...

    originalStates.clear();
    loopClones = [];
    isPreviewActive.set(false);  // Use store.set()
    canvas.requestRenderAll();
}

// Update the check function
export function isPreviewModeActive() {
    return get(isPreviewActive);
}
```

### Research Insights: Race Condition Mitigations

**From julik-frontend-races-reviewer:** Add operation locking to prevent overlapping async operations:

```javascript
// In canvas-preview-engine.js
let previewOperationInProgress = false;

export async function applyPreview(canvas, testValues) {
    if (previewOperationInProgress) {
        console.warn('Preview operation already in progress');
        return { success: false, reason: 'operation_in_progress' };
    }

    previewOperationInProgress = true;
    try {
        // ... existing logic ...
        isPreviewActive.set(true);
        return { success: true };
    } finally {
        previewOperationInProgress = false;
    }
}
```

### Research Insights: Batch Rendering

**From performance-oracle:** Disable auto-render during batch operations:

```javascript
export async function applyPreview(canvas, testValues) {
    // CRITICAL: Disable auto-render during batch operations
    const originalRenderOnAddRemove = canvas.renderOnAddRemove;
    canvas.renderOnAddRemove = false;

    try {
        // ... all loop clone creation and visibility changes ...
    } finally {
        canvas.renderOnAddRemove = originalRenderOnAddRemove;
        canvas.requestRenderAll();  // Single render at end
    }
}
```

**Expected improvement:** 10 loop clones = 10 renders -> 1 render (90% reduction)

### Phase 2: Fix Variables Store Immutability

**File:** `src/store/variables.store.js`

### Research Insights: Version Counter Pattern

**From performance-oracle:** Instead of creating `new Map()` on every update (O(n)), use a version counter for O(1) reactivity:

```javascript
// BETTER APPROACH - Version counter for reactivity
let version = 0;
const variablesStore = writable({ map: new Map(), version: 0 });

// For updates - O(1) reactivity trigger
function updateVariable(name, variable) {
    variablesStore.update(state => {
        state.map.set(name, variable);  // Mutate in place
        return { map: state.map, version: ++version };  // New version triggers reactivity
    });
}

// Derived stores use version to know when to recompute
export const variables = derived(variablesStore, $s => {
    // $s.version change triggers this
    return Array.from($s.map.values()).sort((a, b) => a.name.localeCompare(b.name));
});
```

### Alternative: Copy-Before-Mutate (Simpler but O(n))

If version counter is too complex, use copy-before-mutate:

```javascript
// BEFORE (line 267-269) - Mutate THEN copy (wrong order)
variablesMap.update(map => {
    map.set(sanitizedName, variable);
    return new Map(map);
});

// AFTER - Copy THEN mutate (correct order)
variablesMap.update(map => {
    const newMap = new Map(map);
    newMap.set(sanitizedName, variable);
    return newMap;
});
```

**Apply to ALL locations:**
- `create()` function (line ~267)
- `update()` function (line ~295)
- `delete()` function (line ~320)
- `syncFromCanvas()` function (line ~467)

### Research Insights: Svelte 5 SvelteMap

**From Context7 Svelte docs:** Svelte 5 provides `SvelteMap` for reactive Maps:

```javascript
import { SvelteMap } from 'svelte/reactivity';

const variables = new SvelteMap();
variables.set('foo', value);  // Automatically triggers reactivity
```

Consider migrating to `SvelteMap` for cleaner reactivity (Svelte 5+ only).

### Phase 3: Update VariablesPanel.svelte

**File:** `src/lib/components/editor/VariablesPanel.svelte`

Changes:
1. Remove local `isPreviewActive` state (line 62)
2. Import `isPreviewActive` store from engine
3. Use `$isPreviewActive` in template and reactive statements
4. Add inline debounce with cleanup

```svelte
<script>
// BEFORE
let isPreviewActive = false;  // LOCAL - causes dual source of truth

// AFTER
import { isPreviewActive } from '../../utils/canvas-preview-engine';
// Remove local variable - use $isPreviewActive from store

// Inline debounce (no separate utility file needed)
let debounceTimer;

function updatePreviewDebounced() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        if ($isPreviewActive && $editor) {
            await applyPreview($editor, testValues);
        }
    }, 300);
}

// React to test value changes
$: if ($isPreviewActive && testValues) {
    updatePreviewDebounced();
}

// Cleanup on destroy
onDestroy(() => {
    clearTimeout(debounceTimer);
    if ($isPreviewActive && $editor) {
        clearPreview($editor);
    }
});
</script>
```

### Research Insights: Cancelable Debounce with Abort Controller

**From julik-frontend-races-reviewer:** For robust race condition handling, use AbortController:

```javascript
let previewUpdateAbortController = null;
let debounceTimer = null;

function schedulePreviewUpdate() {
    // Cancel pending timeout
    if (debounceTimer) clearTimeout(debounceTimer);

    // Signal any in-flight operation to abort
    if (previewUpdateAbortController) {
        previewUpdateAbortController.abort();
    }

    previewUpdateAbortController = new AbortController();
    const signal = previewUpdateAbortController.signal;

    debounceTimer = setTimeout(async () => {
        if (signal.aborted) return;
        if (!$isPreviewActive || !$editor) return;

        try {
            await applyPreview($editor, testValues, signal);
        } catch (e) {
            if (e.name !== 'AbortError') throw e;
        }
    }, 300);
}

onDestroy(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (previewUpdateAbortController) previewUpdateAbortController.abort();
});
```

### Phase 4: Add Preview Cleanup on Page Switch

**File:** `src/lib/components/editor/Canvas.svelte`

### Research Insights: Critical Bug - Preview Clones in Serialization

**From julik-frontend-races-reviewer:** When switching pages, `toJSON()` serializes the canvas INCLUDING preview clones. Must clear preview BEFORE serialization:

```javascript
// In Canvas.svelte page subscription
pagesUnsubscribe = currentPageIndex.subscribe(async (newIndex) => {
    if (fabricCanvas && previousPageIndex !== newIndex) {
        // CRITICAL: Clear preview BEFORE serialization
        // Preview clones have _isPreviewClone=true but it's not in serialization list
        if (isPreviewModeActive()) {
            clearPreview(fabricCanvas);
        }

        // NOW safe to serialize
        const currentData = fabricCanvas.toJSON([
            'id', 'name', 'isVariable', 'variableBindings',
            // ... other custom properties
        ]);
        pageActions.updateCurrentPageData(currentData, previousPageIndex);

        // Load new page
        // ...
    }
});
```

### Research Insights: Undo/Redo Integration

**From architecture review:** Clear preview before undo/redo to prevent state corruption:

```javascript
import { isPreviewModeActive, clearPreview } from '../../utils/canvas-preview-engine';

function performUndo() {
    // Clear preview FIRST - undo will load historical state
    // that doesn't include current preview modifications
    if (isPreviewModeActive()) {
        clearPreview(fabricCanvas);
    }

    isPerformingUndoRedo = true;
    historyIndex--;
    // ... existing undo logic
}

function performRedo() {
    if (isPreviewModeActive()) {
        clearPreview(fabricCanvas);
    }

    isPerformingUndoRedo = true;
    historyIndex++;
    // ... existing redo logic
}
```

### Phase 5: Performance Optimizations (Optional)

### Research Insights: RAF-Aligned Debouncing

**From performance-oracle:** Align updates with requestAnimationFrame to prevent visual tearing:

```javascript
function rafDebounce(fn, delay) {
    let timeoutId = null;
    let rafId = null;

    return function(...args) {
        if (timeoutId) clearTimeout(timeoutId);
        if (rafId) cancelAnimationFrame(rafId);

        timeoutId = setTimeout(() => {
            rafId = requestAnimationFrame(() => fn.apply(this, args));
        }, delay);
    };
}
```

### Research Insights: Debounce Timing Recommendations

| Operation | Recommended | Current | Rationale |
|-----------|-------------|---------|-----------|
| Preview updates | 150ms | 300ms | Fast enough to feel responsive |
| Canvas sync | 250ms | 200ms | Longer to avoid thrashing |
| History save | 500ms | N/A | Infrequent, heavy operation |

### Research Insights: Canvas Event Batching

**From performance-oracle:** Multiple paste = multiple `object:added` events. Use single debounced sync:

```javascript
let pendingSyncCount = 0;
let syncTimeout = null;

function setupCanvasListeners() {
    const handleChange = () => {
        pendingSyncCount++;

        if (syncTimeout) clearTimeout(syncTimeout);

        syncTimeout = setTimeout(() => {
            console.log(`Syncing after ${pendingSyncCount} canvas events`);
            pendingSyncCount = 0;
            refreshTrigger++;
        }, 200);
    };

    $editor.on('object:added', handleChange);
    $editor.on('object:removed', handleChange);
    $editor.on('object:modified', handleChange);
}
```

## Acceptance Criteria

### Functional Requirements

- [ ] Variable test value changes reflect immediately in preview (within 300ms debounce)
- [ ] Toggling preview mode on immediately shows variable values applied to canvas
- [ ] Toggling preview mode off immediately restores original canvas state
- [ ] Adding new canvas objects while preview is active re-applies preview correctly
- [ ] Modifying canvas objects syncs variables within 200ms
- [ ] Page switching clears preview state cleanly (no corrupted state)
- [ ] Undo/Redo operations work correctly with preview (auto-disable if needed)
- [ ] Preview state is consistent across all subscribing components

### Non-Functional Requirements

- [ ] No memory leaks from orphaned subscriptions or timeouts
- [ ] Preview toggle completes within 100ms for canvases with < 100 objects
- [ ] Debounce prevents excessive re-renders during rapid typing
- [ ] All preview state changes trigger proper Svelte reactivity

### Quality Gates

- [ ] Existing tests pass (if any)
- [ ] Manual testing of all 8 user flows documented in spec analysis
- [ ] No console errors or warnings during normal operation
- [ ] Code review approval

## Files to Modify (SIMPLIFIED)

| File | Action | Description |
|------|--------|-------------|
| `src/lib/utils/canvas-preview-engine.js` | MODIFY | Convert `isPreviewActive` to writable store, add operation lock |
| `src/store/variables.store.js` | MODIFY | Fix Map immutability (copy-before-mutate) |
| `src/lib/components/editor/VariablesPanel.svelte` | MODIFY | Remove local `isPreviewActive`, use store, inline debounce |
| `src/lib/components/editor/Canvas.svelte` | MODIFY | Clear preview before page switch and undo/redo |

**Files NOT needed (simplified from original plan):**
- ~~`src/store/preview.store.js`~~ - Not needed, store lives in engine
- ~~`src/lib/utils/debounce.js`~~ - Inline in component instead

## Risk Analysis & Mitigation (Enhanced)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing preview functionality | Medium | High | Thorough manual testing of all flows |
| Performance regression from Map copies | Medium | Medium | Use version counter pattern or SvelteMap |
| Race conditions - overlapping preview operations | High | High | Add `previewOperationInProgress` lock |
| Race conditions - debounced updates during toggle | Medium | High | Use AbortController for cancelable operations |
| Preview clones serialized on page switch | High | High | Clear preview BEFORE `toJSON()` in subscription |
| Memory leaks from timeouts | Medium | Medium | Clear all timeouts in onDestroy |
| Undo loads state without preview awareness | High | Medium | Clear preview before undo/redo |

### Research Insights: Testing Race Conditions

**From julik-frontend-races-reviewer:** How to reproduce races:
1. Double-click the preview button as fast as you can
2. Type rapidly in test value input while preview is active
3. Paste 10+ objects at once while preview is active
4. Switch pages rapidly while preview is active
5. Press Cmd+Z repeatedly while preview is active
6. Navigate away while preview is updating (throttle network to 3G to make easier)

## Testing Plan

### Manual Testing Checklist

1. **Variable Creation Flow**
   - [ ] Create text element, mark as variable
   - [ ] Verify appears in VariablesPanel immediately
   - [ ] Enable preview, verify value applied

2. **Test Value Update Flow**
   - [ ] Enable preview
   - [ ] Type in test value input
   - [ ] Verify canvas updates within 300ms
   - [ ] Rapid typing doesn't cause multiple renders

3. **Preview Toggle Flow**
   - [ ] Enable preview - canvas shows test values
   - [ ] Disable preview - canvas restores originals
   - [ ] Re-enable preview - values applied correctly

4. **Page Switch Flow**
   - [ ] Enable preview on page 1
   - [ ] Switch to page 2
   - [ ] Verify preview state cleared
   - [ ] Switch back to page 1, verify clean state

5. **Undo/Redo Flow**
   - [ ] Enable preview
   - [ ] Make canvas change
   - [ ] Undo - verify preview cleared
   - [ ] Re-enable preview, verify works

6. **Object Addition Flow**
   - [ ] Enable preview
   - [ ] Add new element with variable
   - [ ] Verify preview re-applies correctly

## References

### Internal References
- `src/store/editor.store.js` - XState + Svelte store pattern (good example)
- `src/store/binding.store.js` - Action object pattern reference
- `plans/feat-frontend-template-modes-refactor.md` - Race condition handling patterns

### External References
- [Svelte Stores Documentation](https://svelte.dev/docs/svelte/stores)
- [Svelte #15152: $derived not updating with Map()](https://github.com/sveltejs/svelte/issues/15152)
- [XState Svelte Integration](https://stately.ai/docs/xstate-svelte)

### Related Issues
- `/todos/013-complete-p2-store-pattern-bypass.md` - Store pattern decisions
- `/todos/002-complete-p1-race-condition-load-template.md` - Race condition patterns

---

## Research Agent Outputs Summary

### Architecture Strategist
- Keep `canvas-preview-engine.js` stateless where possible
- Proposed pattern matches `variableActions`, `editorActions`, `copilotActions`
- Recommended: Pass canvas as parameter, don't couple engine to store
- Consider XState for preview only if race conditions prove difficult to manage

### Performance Oracle
- Map immutability: O(n) per update could cause frame drops with 100+ variables
- Recommend version counter pattern for O(1) reactivity triggers
- Batch rendering: disable `renderOnAddRemove` during preview operations
- Expected improvement: 80-90% fewer renders with batching

### Code Simplicity Reviewer
- Plan was over-engineered: 250 lines -> 30 lines possible
- Only `isPreviewActive` needs reactivity (not `originalStates`, `loopClones`)
- No separate `preview.store.js` or `debounce.js` files needed
- YAGNI violations identified in 5 derived stores and 8 action methods

### Frontend Races Reviewer (Julik)
- 7 race conditions identified with specific code locations
- Critical: Preview toggle race, debounced update overlap, page switch serialization
- Mitigations: Operation lock, AbortController, cleanup ordering
- Test strategies provided for reproducing each race

### TypeScript/JavaScript Reviewer (Kieran)
- Recommended JSDoc types for all exports
- Named function exports preferred over object pattern
- Guard clauses for validation
- Error boundaries with result objects

### Pattern Recognition Specialist
- Proposed pattern consistent with `variableActions`, `editorActions`, `pageActions`
- Anti-patterns in current code: module-level mutable state, hidden dependencies
- Debounce utility is a good addition (first in codebase)
- Default export bundle follows `variables.store.js` convention
