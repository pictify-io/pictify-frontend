---
status: pending
priority: p2
issue_id: "011"
tags: [code-review, race-condition, ui, svelte]
dependencies: []
---

# Double-Click Protection Missing on Multiple Actions

## Problem Statement

Several buttons in the render and dynamic pages lack protection against double-clicks, which could lead to duplicate API calls, resource waste, and inconsistent UI states.

**Why it matters**: Users rapidly clicking buttons could create duplicate API keys, bindings, or data sources, leading to confusion and potential data integrity issues.

## Findings

**Source**: julik-frontend-races-reviewer agent

### Finding 1: Create API Key Button
**Location**: `src/routes/dashboard/template/[uid]/render/+page.svelte:152-167`

The "Create API Key" button has `disabled={creatingKey}` but the flag is set after async operation starts, allowing double-clicks before state updates.

### Finding 2: Test Data Source Button
**Location**: `src/lib/components/dynamic/DataSourceConfig.svelte:80-95`

Test button uses `disabled={testing}` but there's a window between click and state change.

### Finding 3: Create Binding Button
**Location**: `src/routes/dashboard/template/[uid]/dynamic/+page.svelte:180-200`

Publishing flow has `creating` state but could benefit from early guard.

## Proposed Solutions

### Solution A: Early Guard Pattern (Recommended)
**Pros**: Simple, effective, no visual flicker
**Cons**: Requires adding guard to each handler
**Effort**: Small
**Risk**: Low

```javascript
async function handleCreate() {
    if (creating) return;  // Early guard - first line
    creating = true;
    try {
        // ... async operation
    } finally {
        creating = false;
    }
}
```

### Solution B: Debounce Wrapper Utility
**Pros**: Reusable across all handlers
**Cons**: Adds abstraction, may not fit all use cases
**Effort**: Medium
**Risk**: Low

```javascript
function debounceAsync(fn) {
    let running = false;
    return async (...args) => {
        if (running) return;
        running = true;
        try { return await fn(...args); }
        finally { running = false; }
    };
}
```

## Technical Details

**Affected Files**:
- `src/routes/dashboard/template/[uid]/render/+page.svelte`
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte`
- `src/lib/components/dynamic/DataSourceConfig.svelte`

## Acceptance Criteria

- [ ] Rapid double-clicks on "Create API Key" only creates one key
- [ ] Rapid double-clicks on "Test Connection" only makes one request
- [ ] Rapid double-clicks on "Publish" only creates one binding
- [ ] Button disabled states update synchronously with click handlers

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Created from review finding | - |

## Resources

- PR branch: feat/frontend-template-modes
