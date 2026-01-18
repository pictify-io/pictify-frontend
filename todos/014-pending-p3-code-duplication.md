---
status: pending
priority: p3
issue_id: "014"
tags: [code-review, architecture, refactoring, dry]
dependencies: []
---

# Code Duplication Across Template Mode Pages

## Problem Statement

The render and dynamic pages share significant duplicated code including mode tabs navigation, header layout, back button patterns, and CSS utility classes.

**Why it matters**: Duplicated code increases maintenance burden and risk of inconsistent updates across pages.

## Findings

**Source**: architecture-strategist agent

### Finding 1: Mode tabs duplicated
**Location**:
- `src/routes/dashboard/template/[uid]/render/+page.svelte:60-85`
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte:70-95`

Both pages have nearly identical tab navigation markup for Edit/Render/Dynamic modes.

### Finding 2: Header navigation pattern duplicated
Back button + template name + actions pattern repeated in both pages.

### Finding 3: CSS utility classes duplicated
Neo-brutalist button styles, card styles, input styles repeated.

## Proposed Solutions

### Solution A: Extract shared components (Recommended)
**Pros**: DRY, easier maintenance, consistent styling
**Cons**: More files to navigate
**Effort**: Medium
**Risk**: Low

Create:
- `TemplateModeNav.svelte` - Mode tabs component
- `TemplatePageHeader.svelte` - Header with back/title/actions

### Solution B: Extract to shared CSS classes
**Pros**: Simple, no new components
**Cons**: Still has markup duplication
**Effort**: Small
**Risk**: Low

### Solution C: Accept current duplication
**Pros**: No change needed
**Cons**: Ongoing maintenance burden
**Effort**: None
**Risk**: Low (tech debt)

## Technical Details

**Affected Files**:
- `src/routes/dashboard/template/[uid]/render/+page.svelte`
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte`
- New: `src/lib/components/template/TemplateModeNav.svelte`
- New: `src/lib/components/template/TemplatePageHeader.svelte`

## Acceptance Criteria

- [ ] Mode tabs extracted to shared component (if Solution A)
- [ ] Header pattern extracted to shared component (if Solution A)
- [ ] Both pages use shared components
- [ ] Visual appearance unchanged

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Created from review finding | - |

## Resources

- PR branch: feat/frontend-template-modes
