---
status: complete
priority: p3
issue_id: "008"
tags: [code-review, duplication, refactor]
dependencies: []
---

# Duplicate Default Binding State Objects

## Problem Statement

The default binding state object is repeated 3 times across the codebase. Changes to the default structure require updates in multiple places.

**Why it matters:**
- Maintenance burden
- Risk of inconsistency
- Violates DRY

## Findings

**Locations:**
- `src/store/binding.store.js` (initial store value)
- `src/store/binding.store.js` (reset function)
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte` (local state)

**Agent:** Code Simplicity Reviewer, Pattern Recognition Specialist

## Proposed Solutions

### Solution 1: Create factory function (Recommended)
**Pros:** Single definition, always fresh object
**Cons:** Minor indirection
**Effort:** Small
**Risk:** Low

```javascript
// src/store/binding.store.js
export const createDefaultBinding = () => ({
  templateId: null,
  dataSourceId: null,
  mapping: {},
  defaults: {},
  refreshPolicy: { ttlSeconds: 300, onError: 'serve_stale' },
  outputConfig: { format: 'png', quality: 90 }
});

export const binding = writable(createDefaultBinding());

export const resetBindingAction = () => {
  binding.set(createDefaultBinding());
};
```

## Recommended Action

Create `createDefaultBinding()` factory function and use everywhere.

## Technical Details

**Affected files:**
- `src/store/binding.store.js`
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte`

**Components:** binding store, Dynamic page

**Database changes:** None

## Acceptance Criteria

- [ ] Factory function created for default binding
- [ ] All usages updated to use factory
- [ ] No hardcoded default objects
- [ ] Reset function uses factory

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified by Code Simplicity Reviewer | Use factory functions for default objects |

## Resources

- PR: Current branch `feat/frontend-template-modes`
