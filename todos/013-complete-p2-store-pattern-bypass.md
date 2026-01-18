---
status: pending
priority: p2
issue_id: "013"
tags: [code-review, architecture, svelte, state-management]
dependencies: []
---

# Store Pattern Bypass - Dynamic Page Uses Direct API Imports

## Problem Statement

The dynamic template page (`dynamic/+page.svelte`) imports and calls API functions directly instead of using the `binding.store.js` which was specifically created for this feature. This creates inconsistent state management patterns and bypasses the store's benefits.

**Why it matters**: Inconsistent patterns make the codebase harder to maintain, lose the benefits of centralized state (caching, optimistic updates), and confuse future developers about which pattern to follow.

## Findings

**Source**: architecture-strategist agent

### Evidence 1: Direct API imports in dynamic page
**Location**: `src/routes/dashboard/template/[uid]/dynamic/+page.svelte:1-15`

```javascript
import {
    getDataSources,
    createDataSource,
    testDataSource,
    getBindings,
    createBinding
} from '../../../../api/binding';
```

### Evidence 2: Store exists but unused
**Location**: `src/store/binding.store.js`

The store provides:
- `bindingState` - Centralized state
- `bindingActions` - CRUD operations with loading states
- Automatic caching and optimistic updates

### Evidence 3: Inconsistent with render page pattern
The render page similarly manages its own state instead of using a shared store.

## Proposed Solutions

### Solution A: Migrate to store pattern (Recommended)
**Pros**: Consistent architecture, enables caching, cleaner components
**Cons**: Requires refactoring page logic
**Effort**: Medium
**Risk**: Low

```javascript
// Instead of:
import { getBindings, createBinding } from '../../../../api/binding';
let bindings = [];
await bindings = await getBindings(uid);

// Use:
import { bindingState, bindingActions } from '$lib/store/binding.store';
$: bindings = $bindingState.bindings;
onMount(() => bindingActions.loadBindings(uid));
```

### Solution B: Accept hybrid approach, document it
**Pros**: No refactoring needed
**Cons**: Inconsistent, store becomes unused code
**Effort**: Small
**Risk**: Medium (tech debt)

### Solution C: Remove unused store
**Pros**: Removes dead code
**Cons**: Loses store benefits, may need it later
**Effort**: Small
**Risk**: Low

## Technical Details

**Affected Files**:
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte`
- `src/routes/dashboard/template/[uid]/render/+page.svelte`
- `src/store/binding.store.js`

## Acceptance Criteria

- [ ] Decision made: use store or remove it
- [ ] If using store: dynamic page migrated to use bindingActions
- [ ] If removing store: binding.store.js deleted, no unused code
- [ ] Pattern documented in CLAUDE.md for future features

## Recommended Action

Accept hybrid approach for now (Solution B). The direct API imports work correctly and provide clear, straightforward data flow. The store remains available for future caching/optimization needs.

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Created from review finding | - |
| 2026-01-18 | Decision: Accept hybrid approach | Direct API imports are simpler and work correctly. Store available for future use if caching needed |

## Resources

- PR branch: feat/frontend-template-modes
- Related: 004-complete-p2-store-bypass-in-routes.md (previously addressed)
