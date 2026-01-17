---
status: complete
priority: p2
issue_id: "006"
tags: [code-review, security, credentials]
dependencies: []
---

# Flawed Header Masking Logic in DataSourceConfig

## Problem Statement

The header masking logic in DataSourceConfig.svelte has issues that could expose sensitive credentials:
1. Masking only applied to value field display, not the actual stored value
2. Credentials stored in client-side Svelte store
3. API code generation exposes raw header values

**Why it matters:**
- Credentials could be logged or captured
- Browser extensions could read store
- Copy-to-clipboard exposes secrets

## Findings

**Location:** `src/lib/components/dynamic/DataSourceConfig.svelte`

**Issues:**
1. Headers with sensitive values are stored in plain text
2. "Copy API Code" button in RenderPreview exposes credentials
3. Store persists credentials in memory

**Agent:** Security Sentinel

## Proposed Solutions

### Solution 1: Server-side header storage (Recommended)
**Pros:** Credentials never sent to client after initial setup
**Cons:** Requires backend changes
**Effort:** Medium
**Risk:** Low

- Store headers server-side only
- Use reference IDs on client
- Mask display in UI

### Solution 2: Encrypt headers in client store
**Pros:** Adds protection layer
**Cons:** Key management complexity, still in memory
**Effort:** Medium
**Risk:** Medium

## Recommended Action

For now, improve masking logic and add warnings. Full fix requires backend changes to store credentials server-side.

**Quick fix:**
```javascript
const maskSensitiveHeaders = (headers) => {
  const sensitiveKeys = ['authorization', 'api-key', 'x-api-key', 'bearer', 'token'];
  return headers.map(h => ({
    ...h,
    displayValue: sensitiveKeys.some(k => h.key.toLowerCase().includes(k))
      ? '••••••••'
      : h.value
  }));
};
```

## Technical Details

**Affected files:**
- `src/lib/components/dynamic/DataSourceConfig.svelte`
- `src/lib/components/render/RenderPreview.svelte`

**Components:** DataSourceConfig, RenderPreview

**Database changes:** Future - store credentials server-side

## Acceptance Criteria

- [ ] Sensitive header values masked in UI
- [ ] API code generation shows placeholder for secrets
- [ ] Warning shown when copying code with credentials
- [ ] Future: Credentials stored server-side only

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified by Security Sentinel | Credentials should never be in client state |

## Resources

- PR: Current branch `feat/frontend-template-modes`
