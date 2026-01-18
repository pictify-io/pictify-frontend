---
status: pending
priority: p2
issue_id: "012"
tags: [code-review, performance, svelte, optimization]
dependencies: []
---

# MappingEditor Performance - Excessive Recalculations

## Problem Statement

The MappingEditor component recalculates suggested paths on every render and doesn't memoize filtered results, causing unnecessary CPU usage and potential UI lag with large data sources.

**Why it matters**: Users with complex data sources (hundreds of paths) will experience sluggish typing and delayed UI updates in the mapping interface.

## Findings

**Source**: performance-oracle agent

### Finding 1: extractPaths runs on every update
**Location**: `src/lib/components/dynamic/MappingEditor.svelte:90-120`

```javascript
// Current: Recalculates every time component updates
$: suggestedPaths = sampleData ? extractPaths(sampleData) : [];
```

The `extractPaths` function recursively traverses the entire data object on every reactive update, even when the data hasn't changed.

### Finding 2: filteredPaths not memoized
**Location**: `src/lib/components/dynamic/MappingEditor.svelte:125-135`

```javascript
// Current: Filters on every keystroke
$: filteredPaths = query
    ? suggestedPaths.filter(p => p.path.toLowerCase().includes(query.toLowerCase()))
    : suggestedPaths;
```

Combined with the above, this creates O(n*m) operations on every keystroke where n = paths and m = query length.

### Finding 3: Object spread creates new references
**Location**: `src/lib/components/dynamic/MappingEditor.svelte:150-160`

```javascript
// Creates new object on every keystroke
mappings = { ...mappings, [variable]: value };
```

## Proposed Solutions

### Solution A: Memoization with proper dependencies (Recommended)
**Pros**: Svelte-idiomatic, minimal refactoring
**Cons**: Requires careful dependency tracking
**Effort**: Small
**Risk**: Low

```javascript
// Store the previous sampleData reference
let cachedData = null;
let cachedPaths = [];

$: {
    if (sampleData !== cachedData) {
        cachedData = sampleData;
        cachedPaths = sampleData ? extractPaths(sampleData) : [];
    }
    suggestedPaths = cachedPaths;
}
```

### Solution B: Web Worker for extraction
**Pros**: Non-blocking, handles huge datasets
**Cons**: Adds complexity, async handling
**Effort**: Large
**Risk**: Medium

### Solution C: Debounced filtering
**Pros**: Simple, reduces filter operations
**Cons**: Slight UI delay
**Effort**: Small
**Risk**: Low

```javascript
let filterTimeout;
$: {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        filteredPaths = query ? suggestedPaths.filter(...) : suggestedPaths;
    }, 150);
}
```

## Technical Details

**Affected Files**:
- `src/lib/components/dynamic/MappingEditor.svelte`

**Performance Impact**:
- Current: O(n) recursive traversal on every render
- After fix: O(n) only when data changes

## Acceptance Criteria

- [ ] extractPaths only runs when sampleData reference changes
- [ ] Typing in search field feels responsive (<50ms delay)
- [ ] Mapping changes don't trigger path recalculation
- [ ] Memory usage stays stable during extended use

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Created from review finding | - |

## Resources

- PR branch: feat/frontend-template-modes
- Svelte reactivity docs: https://svelte.dev/docs#component-format-script-3-$-marks-a-statement-as-reactive
