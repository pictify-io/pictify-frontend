---
title: "fix: Billing Integration Bugs & Missing Tests"
type: fix
status: active
date: 2026-02-16
deepened: 2026-02-16
---

# fix: Billing Integration Bugs & Missing Tests

## Enhancement Summary

**Deepened on:** 2026-02-16
**Review agents used:** performance-oracle, code-simplicity-reviewer, data-integrity-guardian, security-sentinel

### Key Improvements from Review
1. **Bug 2 simplified**: Use `initBilling({ refresh: true })` instead of optimistic updates — backend already clears cache, so this fetches fresh data with 1 roundtrip
2. **Bug 3 kept simple**: Atomic insert-first pattern is YAGNI — webhook retries are 5s+ apart, findOne pattern is sufficient
3. **New finding**: Add cache invalidation to webhook handlers (stale data served up to 5 min after webhook updates)
4. **Removed**: Billing store tests (testing implementation details, not behavior)

---

## Overview

The comprehensive billing system with LemonSqueezy integration is substantially implemented across both repos (35 files frontend, 27 files backend). However, code review reveals **3 critical bugs** that would cause production failures and **missing test coverage** for security-critical webhook handling.

## Problem Statement

### Bug 1: `lemonSqueezySubscriptionId` Not Stored for Individual Users (CRITICAL)

**File:** `html-to-gif/routes/lemon-squeezy.js:84-97`

The `updateBillingPlan` function only stores `lemonSqueezySubscriptionId` for teams, not individual users.

**Impact:** Individual users' `lemonSqueezySubscriptionId` is never set, so:
- Overage billing reporting fails (`service/overage-billing.js:137` returns null)
- Billing API routes (`routes/billing.js:174`) return no subscription data
- Users see "No subscription" despite having a paid plan

### Bug 2: Billing Store Actions Set `subscription: undefined` (CRITICAL)

**File:** `front-end-html-to-gif/src/store/billing.store.js:180-246`

The store actions reference `result.subscription` but the backend returns `{ success, status, pause }` without a `subscription` object. `result.subscription` is undefined, wiping the UI state.

**Impact:** After any subscription action (pause/resume/cancel/reactivate), the SubscriptionCard shows empty state until page refresh.

### Bug 3: TOCTOU Race in Webhook Idempotency (LOW — Downgraded)

**File:** `html-to-gif/routes/lemon-squeezy.js:122-128`

**Downgraded from HIGH to LOW** based on simplicity review: LemonSqueezy webhook retries happen at 5s/25s/125s intervals (not concurrent). The TOCTOU window is milliseconds vs seconds between retries. Keep current findOne pattern.

### Missing: Test Coverage for Security-Critical Code

No tests exist for webhook signature verification or idempotency handling.

---

## Technical Approach

### Phase 1: Fix Critical Bugs

#### 1.1 Store `lemonSqueezySubscriptionId` for Individual Users

**File:** `html-to-gif/routes/lemon-squeezy.js`

Move `entity.lemonSqueezySubscriptionId = subscriptionId` outside the `if (isTeam)` block:

```javascript
const updateBillingPlan = async ({ entity, isTeam, planName, customerId, subscriptionId }) => {
  const oldPlan = entity.currentPlan
  entity.currentPlan = planName
  entity.lemonSqueezyCustomerId = customerId
  entity.lemonSqueezySubscriptionId = subscriptionId ? String(subscriptionId) : null

  if (isTeam) {
    entity.seatLimit = getSeatLimitForPlan(planName)
  }

  await entity.save()
  return oldPlan
}
```

**Note:** Existing users need backfill. Script exists at `scripts/populate-subscription-ids.js`.

#### 1.2 Fix Billing Store — Remove Broken `result.subscription` References

**File:** `front-end-html-to-gif/src/store/billing.store.js`

Remove the broken `billingState.update((s) => ({ ...s, subscription: result.subscription }))` lines. Instead, call `initBilling({ refresh: true })` to fetch fresh data after each action:

```javascript
export const doPauseSubscription = async ({ resumesAt } = {}) => {
  billingActions.update((a) => ({ ...a, pausing: true }));
  try {
    await pauseSubscription({ resumesAt });
    await initBilling({ refresh: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to pause subscription' };
  } finally {
    billingActions.update((a) => ({ ...a, pausing: false }));
  }
};
```

Apply same pattern to `doResumeSubscription`, `doCancelSubscription`, `doReactivateSubscription`.

#### 1.3 Add Cache Invalidation to Webhook Handlers (NEW)

**File:** `html-to-gif/routes/lemon-squeezy.js`

After webhook processing updates the database, invalidate the billing cache so the next dashboard request returns fresh data:

```javascript
// After updating billing entity in each webhook case
const billingRoutes = require('./billing')
const entityId = team?.uid || user.uid || user._id.toString()
billingRoutes.billingCache?.delete(`billing:${entityId}`)
```

Export `billingCache` from `routes/billing.js` for cross-module access.

---

### Phase 2: Add Test Coverage

#### 2.1 Webhook Signature Verification Tests

**File:** `html-to-gif/test/webhook-signature.test.js`

```javascript
describe('verifyWebhookSignature', () => {
  test('returns true for valid signature')
  test('returns false for invalid signature')
  test('returns false for empty signature')
  test('returns false for empty body')
  test('returns false for empty secret')
})
```

#### 2.2 Webhook Idempotency Tests

**File:** `html-to-gif/test/webhook-idempotency.test.js`

```javascript
describe('webhook idempotency', () => {
  test('processes first webhook event')
  test('rejects duplicate webhook with same idempotencyKey')
  test('idempotencyKey format: eventName:subscriptionId:updatedAt')
})
```

---

## Acceptance Criteria

### Bugs Fixed

- [ ] `lemonSqueezySubscriptionId` stored for individual users in `updateBillingPlan`
- [ ] Billing store calls `initBilling({ refresh: true })` after subscription actions (no `result.subscription`)
- [ ] Webhook handlers invalidate billing cache after processing

### Tests Added

- [ ] Unit tests for `verifyWebhookSignature` function
- [ ] Tests for webhook idempotency handling

---

## Files to Modify

### Backend (html-to-gif)

| File | Changes |
|------|---------|
| `routes/lemon-squeezy.js` | Fix `updateBillingPlan` to store subscriptionId for users; add cache invalidation |
| `routes/billing.js` | Export `billingCache` for cross-module access |
| `test/webhook-signature.test.js` | NEW - signature verification tests |
| `test/webhook-idempotency.test.js` | NEW - idempotency tests |

### Frontend (front-end-html-to-gif)

| File | Changes |
|------|---------|
| `src/store/billing.store.js` | Fix subscription action handlers to refresh instead of using `result.subscription` |

---

## References

- Existing plan: `docs/plans/2026-02-15-fix-lemonsqueezy-billing-integration-plan.md`
- Backend billing routes: `html-to-gif/routes/billing.js`
- Backend webhook handler: `html-to-gif/routes/lemon-squeezy.js`
- Frontend billing store: `front-end-html-to-gif/src/store/billing.store.js`
- Overage service: `html-to-gif/service/overage-billing.js`
- Backfill script: `html-to-gif/scripts/populate-subscription-ids.js`
