---
status: complete
priority: p2
issue_id: "005"
tags: [code-review, performance, security]
dependencies: []
---

# Recursive Object Traversal Without Depth Limit

## Problem Statement

The `extractPaths` function in MappingEditor recursively traverses objects without a depth limit. Deeply nested or circular data could cause stack overflow or UI freeze.

**Why it matters:**
- Stack overflow with deeply nested data
- UI freeze with large objects
- Potential DoS via malicious data source response

## Findings

**Location:** `src/lib/components/dynamic/MappingEditor.svelte:14-32`

**Vulnerable code:**
```javascript
const extractPaths = (obj, prefix = '$') => {
  const paths = [];
  const traverse = (current, currentPath) => {
    // No depth limit!
    if (typeof current === 'object' && !Array.isArray(current)) {
      for (const key of Object.keys(current)) {
        traverse(current[key], newPath); // Unbounded recursion
      }
    }
  };
  traverse(obj, prefix);
  return paths.slice(0, 50); // Only limits output, not traversal
};
```

**Agent:** Performance Oracle

## Proposed Solutions

### Solution 1: Add depth limit parameter (Recommended)
**Pros:** Simple, effective, configurable
**Cons:** May miss deeply nested paths
**Effort:** Small
**Risk:** Low

```javascript
const extractPaths = (obj, prefix = '$', maxDepth = 10) => {
  const paths = [];
  const traverse = (current, currentPath, depth) => {
    if (depth > maxDepth) return;
    if (current === null || current === undefined) return;

    if (typeof current === 'object' && !Array.isArray(current)) {
      for (const key of Object.keys(current)) {
        const newPath = `${currentPath}.${key}`;
        paths.push({ path: newPath, value: current[key] });
        traverse(current[key], newPath, depth + 1);
      }
    }
    // ... rest
  };
  traverse(obj, prefix, 0);
  return paths.slice(0, 50);
};
```

### Solution 2: Use iterative approach with stack
**Pros:** No stack overflow possible
**Cons:** More complex code
**Effort:** Medium
**Risk:** Low

## Recommended Action

Use Solution 1 - add depth limit. 10 levels is sufficient for most API responses.

## Technical Details

**Affected files:**
- `src/lib/components/dynamic/MappingEditor.svelte`

**Components:** MappingEditor

**Database changes:** None

## Acceptance Criteria

- [ ] extractPaths has configurable depth limit (default 10)
- [ ] No stack overflow with deeply nested objects
- [ ] Still extracts paths up to reasonable depth
- [ ] Performance acceptable with large objects

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified by Performance Oracle | Recursive functions need depth limits |

## Resources

- PR: Current branch `feat/frontend-template-modes`
