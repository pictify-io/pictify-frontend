---
status: pending
priority: p1
issue_id: "010"
tags: [code-review, race-condition, svelte, routing]
dependencies: []
---

# Route Parameter Reactivity Issue - Stale Data on Same-Template Navigation

## Problem Statement

When navigating from one template's render/dynamic page to another template's page (e.g., `/dashboard/template/abc123/render` to `/dashboard/template/xyz789/render`), the data may become stale because SvelteKit reuses the component instance when only the route parameter changes.

**Why it matters**: Users could see data from a previous template or make changes to the wrong template, leading to data corruption and confusion.

## Findings

**Source**: julik-frontend-races-reviewer agent

**Location**:
- `src/routes/dashboard/template/[uid]/render/+page.svelte`
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte`

**Evidence**:
Both pages use `$page.params.uid` and call `loadTemplate()` in `onMount()`, but there's no reactive statement to reload when the UID parameter changes.

```javascript
// Current implementation (problematic)
onMount(async () => {
    await loadTemplate();
});
```

When SvelteKit reuses the same component for a different route parameter, `onMount` doesn't re-run, causing stale data.

## Proposed Solutions

### Solution A: Reactive Statement with $page.params (Recommended)
**Pros**: Idiomatic Svelte, minimal code change, handles all navigation patterns
**Cons**: Need to manage load version to prevent race conditions
**Effort**: Small
**Risk**: Low

```javascript
$: if ($page.params.uid) {
    loadTemplate();
}
```

### Solution B: Use SvelteKit's invalidate/load pattern
**Pros**: Uses SvelteKit's built-in data loading
**Cons**: Requires restructuring to use +page.js load function
**Effort**: Medium
**Risk**: Medium

### Solution C: Key block to force remount
**Pros**: Guarantees fresh component state
**Cons**: Destroys all state including scroll position
**Effort**: Small
**Risk**: Low

```svelte
{#key $page.params.uid}
  <!-- page content -->
{/key}
```

## Technical Details

**Affected Files**:
- `src/routes/dashboard/template/[uid]/render/+page.svelte:23-47`
- `src/routes/dashboard/template/[uid]/dynamic/+page.svelte:38-65`

**Components Affected**: Template loading, form state, preview state

## Acceptance Criteria

- [ ] Navigating between different template render pages loads correct template data
- [ ] Navigating between different template dynamic pages loads correct binding data
- [ ] No race conditions when rapidly switching templates
- [ ] Loading states display correctly during transitions
- [ ] Previous template's data is cleared before new data loads

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Created from review finding | - |

## Resources

- PR branch: feat/frontend-template-modes
- SvelteKit routing docs: https://kit.svelte.dev/docs/routing
- Related finding: 002-complete-p1-race-condition-load-template.md
