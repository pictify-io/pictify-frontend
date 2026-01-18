---
status: pending
priority: p3
issue_id: "015"
tags: [code-review, architecture, imports, svelte]
dependencies: []
---

# Deep Relative Imports Instead of $lib Aliases

## Problem Statement

Components use deep relative imports like `../../../../api/binding` instead of SvelteKit's `$lib` alias, making imports fragile and harder to read.

**Why it matters**: Deep relative imports break when files are moved and are harder to scan for dependencies.

## Findings

**Source**: architecture-strategist agent

**Location**: Multiple files in `src/routes/dashboard/template/[uid]/`

```javascript
// Current (fragile):
import { getBindings } from '../../../../api/binding';
import Loader from '$lib/components/Loader.svelte';

// Inconsistent: some use $lib, some use relative
```

## Proposed Solutions

### Solution A: Move API to $lib and use alias (Recommended)
**Pros**: Consistent, IDE-friendly, resilient to moves
**Cons**: Requires moving files
**Effort**: Small
**Risk**: Low

```javascript
// After:
import { getBindings } from '$lib/api/binding';
```

### Solution B: Keep API outside $lib, use relative
**Pros**: No file moves
**Cons**: Deep relative paths remain
**Effort**: None
**Risk**: Low

## Technical Details

**Affected Files**:
- `src/routes/dashboard/template/[uid]/render/+page.svelte`
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte`
- `src/api/` → `src/lib/api/` (if moving)

## Acceptance Criteria

- [ ] Decision made on API file location
- [ ] If moving: API files moved to $lib/api/
- [ ] All imports use $lib alias where possible
- [ ] No deep relative imports (4+ levels)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Created from review finding | - |

## Resources

- PR branch: feat/frontend-template-modes
- SvelteKit alias docs: https://kit.svelte.dev/docs/modules#$lib
