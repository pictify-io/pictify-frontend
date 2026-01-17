---
status: complete
priority: p3
issue_id: "009"
tags: [code-review, duplication, refactor]
dependencies: []
---

# pauseBindingAction and resumeBindingAction are 95% Identical

## Problem Statement

The `pauseBindingAction` and `resumeBindingAction` functions share 95% of their code, differing only in the API function called.

**Why it matters:**
- Code duplication
- Maintenance burden
- Unnecessary complexity

## Findings

**Location:** `src/store/binding.store.js`

**Current code (both functions nearly identical):**
```javascript
export const pauseBindingAction = async (bindingId) => {
  bindingLoading.set(true);
  try {
    const data = await pauseBinding(bindingId);
    bindings.update(items => items.map(b => b.uid === bindingId ? data : b));
    return data;
  } catch (error) {
    console.error('Failed to pause binding:', error);
    throw error;
  } finally {
    bindingLoading.set(false);
  }
};

export const resumeBindingAction = async (bindingId) => {
  // Identical except calls resumeBinding()
};
```

**Agent:** Code Simplicity Reviewer

## Proposed Solutions

### Solution 1: Create generic action factory (Recommended)
**Pros:** DRY, extensible
**Cons:** Slightly more abstract
**Effort:** Small
**Risk:** Low

```javascript
const createBindingStatusAction = (apiFunc, actionName) => async (bindingId) => {
  bindingLoading.set(true);
  try {
    const data = await apiFunc(bindingId);
    bindings.update(items => items.map(b => b.uid === bindingId ? data : b));
    return data;
  } catch (error) {
    console.error(`Failed to ${actionName} binding:`, error);
    throw error;
  } finally {
    bindingLoading.set(false);
  }
};

export const pauseBindingAction = createBindingStatusAction(pauseBinding, 'pause');
export const resumeBindingAction = createBindingStatusAction(resumeBinding, 'resume');
```

## Recommended Action

Use factory function pattern to eliminate duplication.

## Technical Details

**Affected files:**
- `src/store/binding.store.js`

**Components:** binding store

**Database changes:** None

## Acceptance Criteria

- [ ] Factory function created for status change actions
- [ ] pauseBindingAction and resumeBindingAction use factory
- [ ] Behavior unchanged
- [ ] No duplicate code

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-18 | Identified by Code Simplicity Reviewer | Use factories for similar functions |

## Resources

- PR: Current branch `feat/frontend-template-modes`
