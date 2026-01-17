---
status: complete
priority: p3
issue_id: "007"
tags: [code-review, duplication, refactor]
dependencies: []
---

# Duplicate formatTtl Function

## Problem Statement

The `formatTtl` function is duplicated in two files with identical logic. This violates DRY principles and creates maintenance burden.

**Why it matters:**
- Changes need to be made in multiple places
- Risk of implementations diverging
- Unnecessary code

## Findings

**Locations:**
- `src/lib/components/dynamic/RefreshStrategy.svelte:34-39`
- `src/lib/components/dynamic/PublishPanel.svelte:42-48`

**Duplicate code:**
```javascript
const formatTtl = (seconds) => {
  if (!seconds) return 'N/A';
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
};
```

**Agent:** Code Simplicity Reviewer

## Proposed Solutions

### Solution 1: Extract to shared utility (Recommended)
**Pros:** Single source of truth, reusable
**Cons:** Need to create/find utility file
**Effort:** Small
**Risk:** Low

```javascript
// src/lib/utils/format.js
export const formatTtl = (seconds) => {
  if (!seconds) return 'N/A';
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
};
```

## Recommended Action

Extract to `src/lib/utils/format.js` and import in both components.

## Technical Details

**Affected files:**
- Create: `src/lib/utils/format.js`
- Modify: `src/lib/components/dynamic/RefreshStrategy.svelte`
- Modify: `src/lib/components/dynamic/PublishPanel.svelte`

**Components:** RefreshStrategy, PublishPanel

**Database changes:** None

## Acceptance Criteria

- [ ] formatTtl extracted to shared utility
- [ ] Both components import from utility
- [ ] Function behavior unchanged
- [ ] No duplicate code

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified by Code Simplicity Reviewer | Extract duplicates early |

## Resources

- PR: Current branch `feat/frontend-template-modes`
