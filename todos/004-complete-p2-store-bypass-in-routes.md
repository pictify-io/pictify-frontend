---
status: complete
priority: p2
issue_id: "004"
tags: [code-review, architecture, svelte-stores]
dependencies: []
---

# Store Bypass - Route Pages Call API Directly

## Problem Statement

Route pages (`render/+page.svelte`, `dynamic/+page.svelte`) bypass the store layer and call API functions directly. This creates architectural inconsistency and loses the benefits of centralized state management.

**Why it matters:**
- Inconsistent patterns across codebase
- No caching or deduplication benefits
- Duplicate loading state management
- Harder to maintain and reason about

## Findings

**Location:**
- `src/routes/dashboard/template/[uid]/render/+page.svelte`
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte`

**Current pattern:**
```javascript
// Route page calls API directly
import { getTemplate, renderTemplate } from '$api/template';
import { getDataSources, createBinding } from '$api/binding';

const loadTemplate = async () => {
  template = await getTemplate(templateId); // Direct API call
};
```

**Expected pattern:**
```javascript
// Route page uses store actions
import { loadTemplateAction, renderTemplateAction } from '$store/template.store';
import { binding, loadBindingsAction } from '$store/binding.store';

await loadTemplateAction(templateId);
// Components react to store changes
```

**Agent:** Architecture Strategist

## Proposed Solutions

### Solution 1: Refactor to use store actions (Recommended)
**Pros:** Consistent architecture, caching, deduplication
**Cons:** Requires refactoring route pages
**Effort:** Medium
**Risk:** Low

### Solution 2: Keep current pattern, document as intentional
**Pros:** No changes needed
**Cons:** Inconsistent with other parts of app
**Effort:** None
**Risk:** Medium (technical debt)

## Recommended Action

Use Solution 1 - refactor to use stores. The store layer already exists and has loading state management.

## Technical Details

**Affected files:**
- `src/routes/dashboard/template/[uid]/render/+page.svelte`
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte`
- `src/store/binding.store.js`

**Components:** Render page, Dynamic page

**Database changes:** None

## Acceptance Criteria

- [ ] Route pages import from stores, not API layer
- [ ] Loading states use store's loading stores
- [ ] Store subscriptions properly cleaned up
- [ ] Caching benefits realized

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified by Architecture Strategist | Keep consistent layering: Route -> Store -> API |

## Resources

- PR: Current branch `feat/frontend-template-modes`
