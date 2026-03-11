---
title: 'feat: Implement Overage Pricing Per Render'
type: feat
date: 2026-02-03
deepened: 2026-02-03
---

# feat: Implement Overage Pricing Per Render

## Enhancement Summary

**Deepened on:** 2026-02-03
**Research agents used:** security-sentinel, performance-oracle, architecture-strategist, code-simplicity-reviewer, data-integrity-guardian, pricing-strategy, paywall-upgrade-cro, frontend-design

### Key Improvements from Research

1. **Security**: Added HMAC-SHA256 webhook verification, input sanitization, rate limiting
2. **Performance**: Target <5ms overage check latency, consider Redis for high-frequency counters
3. **Architecture**: Event-driven pattern with separation of concerns
4. **Simplicity**: Flatten schema from 7 fields to 3, skip batching for MVP
5. **Data Integrity**: Atomic increments with reconciliation jobs

### Critical Findings (Must Address)

- 🔴 **Webhook signature verification missing** - Required for billing security
- 🔴 **Non-atomic usage increments** - Race condition risk at scale
- 🟡 **Spending cap validation** - Must validate positive numbers, handle edge cases
- 🟡 **LemonSqueezy API resilience** - Need retry logic with exponential backoff

---

## Overview

Implement usage-based overage billing that allows users to continue rendering beyond their plan limits for an additional per-render fee. This transforms the current hard-limit system into a flexible soft-limit system where users can opt-in to pay for overages rather than being blocked.

## Problem Statement / Motivation

**Current State:**

- Users hit a hard limit (429 response) when they exceed their plan's render quota
- No option to continue working - only upgrade to a higher tier
- Lost revenue from users who would pay for occasional overages
- Poor UX when users are mid-project and suddenly blocked

**Desired State:**

- Users can opt-in to allow overages with per-render pricing
- Seamless experience for users who occasionally exceed limits
- Additional revenue stream without forcing tier upgrades
- Clear visibility into overage costs before they occur

## Proposed Solution

### Pricing Model

| Plan           | Monthly Renders | Overage Rate  | Overage Eligibility   |
| -------------- | --------------- | ------------- | --------------------- |
| Starter (Free) | 50              | N/A           | **No** - Must upgrade |
| Pro (Standard) | 10,000          | $0.005/render | Yes                   |
| Business       | 40,000          | $0.003/render | Yes                   |
| Enterprise     | Custom          | Custom        | Yes (negotiated)      |

### Key Features

1. **Soft Limit Toggle**: Users can enable/disable overage billing in settings
2. **Spending Cap**: Optional maximum overage spend per billing cycle
3. **Multi-Tier Alerts**: Warnings at 50%, 80%, 95%, 100% usage
4. **Real-Time Cost Display**: Show projected overage costs before render
5. **Usage Dashboard**: Historical overage tracking and reporting

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐│
│  │ Billing     │  │ Usage Widget │  │ Overage Warning Modal   ││
│  │ Settings    │  │ (overage-    │  │ (pre-render cost        ││
│  │ Toggle      │  │  aware)      │  │  confirmation)          ││
│  └─────────────┘  └──────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐│
│  │ Quota Guard │  │ Usage        │  │ LemonSqueezy            ││
│  │ (soft/hard  │  │ Increment    │  │ Usage Reporting         ││
│  │  limit)     │  │ + Overage    │  │ Service                 ││
│  └─────────────┘  └──────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LemonSqueezy                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Usage-Based Billing: Track overage renders, bill at cycle   ││
│  │ end via usage records API                                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Phases

#### Phase 1: Backend Foundation

- [x] Add billing preferences to User model (`allowOverages`, `spendingCap`)
- [x] Add billing preferences to Team model (same fields)
- [x] Add overage pricing config to `planLimits.js`
- [x] Create billing preferences API endpoints
- [x] Modify `quota_guard.js` to check soft/hard limit preference

**Files to modify:**

- `/Users/suyashthakur/html-to-gif/models/User.js`
- `/Users/suyashthakur/html-to-gif/models/Team.js`
- `/Users/suyashthakur/html-to-gif/config/planLimits.js`
- `/Users/suyashthakur/html-to-gif/plugins/quota_guard.js`

**New files:**

- `/Users/suyashthakur/html-to-gif/routes/billing-preferences.js`

#### Phase 2: Overage Tracking & LemonSqueezy Integration

- [x] Add overage tracking fields to User/Team models
- [x] Create LemonSqueezy usage reporting service
- [x] Implement batched usage reporting (every 10 overages or 5 min)
- [ ] Add webhook handlers for usage billing events
- [x] Implement spending cap enforcement

**Files to modify:**

- `/Users/suyashthakur/html-to-gif/util/usage.js`
- `/Users/suyashthakur/html-to-gif/routes/lemon-squeezy.js`

**New files:**

- `/Users/suyashthakur/html-to-gif/service/overage-billing.js`

#### Phase 3: Frontend - Configuration UI

- [x] Add overage pricing to `plan-features.js`
- [x] Create billing settings section in upgrade page
- [x] Add soft limit toggle component
- [x] Add spending cap input component
- [x] Create overage cost display component

**Files to modify:**

- `/Users/suyashthakur/front-end-html-to-gif/src/config/plan-features.js`
- `/Users/suyashthakur/front-end-html-to-gif/src/routes/dashboard/upgrade/+page.svelte`

**New files:**

- `/Users/suyashthakur/front-end-html-to-gif/src/lib/components/plg/OverageSettings.svelte`
- `/Users/suyashthakur/front-end-html-to-gif/src/api/billing.js`

#### Phase 4: Frontend - Usage Awareness

- [x] Update `plg.store.js` with overage state management
- [x] Update `UsageBanner.svelte` with overage-aware messaging
- [x] Update `UsageWidget.svelte` with overage display
- [x] Add overage warning modal before rendering when near/over limit
- [x] Update pricing page with overage information

**Files to modify:**

- `/Users/suyashthakur/front-end-html-to-gif/src/store/plg.store.js`
- `/Users/suyashthakur/front-end-html-to-gif/src/lib/components/plg/UsageBanner.svelte`
- `/Users/suyashthakur/front-end-html-to-gif/src/lib/components/plg/UsageWidget.svelte`
- `/Users/suyashthakur/front-end-html-to-gif/src/routes/pricing/+page.svelte`

**New files:**

- `/Users/suyashthakur/front-end-html-to-gif/src/lib/components/plg/OverageWarningModal.svelte`

## Acceptance Criteria

### Functional Requirements

- [x] Users on Pro/Business plans can enable/disable overage billing
- [x] Free tier users cannot enable overages (must upgrade)
- [x] Overage rate displayed clearly in pricing and settings
- [x] Users can set optional spending cap
- [x] Renders continue when limit exceeded if overages enabled
- [x] Renders blocked when spending cap reached
- [x] Usage alerts shown at 50%, 80%, 95%, 100% thresholds
- [x] Overage charges appear on LemonSqueezy invoice (via usage reporting)

### Non-Functional Requirements

- [x] Overage tracking is atomic (no race conditions) - Fixed with MongoDB $expr conditional updates
- [x] Usage reported to LemonSqueezy with idempotency
- [x] API responses include overage information when relevant
- [ ] Dashboard shows historical overage data

### Quality Gates

- [ ] Unit tests for overage calculation logic
- [ ] Integration tests for LemonSqueezy usage reporting
- [ ] E2E tests for complete overage flow
- [ ] No regressions in existing quota enforcement

## Technical Considerations

### Database Schema Changes

**Research Insights (code-simplicity-reviewer):**

> "Flatten the schema. You don't need nested objects for 3-4 fields. Simpler = fewer bugs."

**User Model Addition (Simplified):**

```javascript
// Billing preferences - flat structure (recommended)
allowOverages: { type: Boolean, default: false },
spendingCapCents: { type: Number, default: null }, // null = unlimited, stored in cents
currentCycleOverages: { type: Number, default: 0 },
// Note: Cost calculated on-demand from overages * rate, not stored
// Note: Cycle resets handled by existing billing cycle logic
```

**Alternative: Original Nested Structure** (if you need more fields later)

```javascript
billingPreferences: {
  allowOverages: { type: Boolean, default: false },
  spendingCap: { type: Number, default: null }, // null = unlimited
  spendingCapReachedAt: { type: Date, default: null }
},
overageTracking: {
  currentCycleOverages: { type: Number, default: 0 },
  currentCycleOverageCost: { type: Number, default: 0 },
  lastReportedToLemonSqueezy: { type: Date, default: null },
  cycleStartDate: { type: Date }
}
```

**Recommendation**: Start with flat structure for MVP, migrate to nested if needed.

**Plan Limits Addition:**

```javascript
const OVERAGE_PRICING = {
	starter: { eligible: false, ratePerRender: null },
	standard: { eligible: true, ratePerRender: 0.005 },
	professional: { eligible: true, ratePerRender: 0.005 },
	business: { eligible: true, ratePerRender: 0.003 },
	enterprise: { eligible: true, ratePerRender: null } // custom
};
```

### LemonSqueezy Integration

**Usage Reporting:**

```javascript
// Report overage usage to LemonSqueezy
await lemonsqueezy.usageRecords.create({
	data: {
		type: 'usage-records',
		attributes: {
			quantity: overageCount,
			action: 'increment'
		},
		relationships: {
			'subscription-item': {
				data: { type: 'subscription-items', id: subscriptionItemId }
			}
		}
	}
});
```

### Security Considerations

**Research Insights (security-sentinel):**

- Validate spending cap is a positive number (sanitize input, reject negative/NaN)
- Ensure only account owner/admin can modify billing preferences
- Rate limit billing preference changes (max 10/hour per user)
- **CRITICAL**: Verify webhook signatures using HMAC-SHA256:

  ```javascript
  const crypto = require('crypto');

  function verifyWebhookSignature(payload, signature, secret) {
  	const hmac = crypto.createHmac('sha256', secret);
  	hmac.update(payload, 'utf8');
  	const digest = hmac.digest('hex');
  	return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }
  ```

- Implement idempotency keys for all billing operations
- Log all billing preference changes for audit trail
- Sanitize all user inputs before database operations

### Performance Considerations

**Research Insights (performance-oracle):**

- **Target latency**: <5ms for overage check on render endpoint
- Batch usage reporting to reduce API calls (every 10 overages OR 5 min, whichever first)
- Use atomic MongoDB operations for overage tracking:
  ```javascript
  // Atomic increment with spending cap check
  const result = await User.findOneAndUpdate(
  	{
  		_id: userId,
  		'overageTracking.currentCycleOverageCost': { $lt: spendingCap }
  	},
  	{
  		$inc: {
  			'overageTracking.currentCycleOverages': 1,
  			'overageTracking.currentCycleOverageCost': overageRate
  		}
  	},
  	{ new: true }
  );
  ```
- Cache overage pricing config in memory (already in planLimits.js pattern)
- **Consider Redis**: For very high-frequency renders (>100/min), use Redis counters with periodic MongoDB sync
- Add monitoring for overage check latency (alert if >10ms p95)

## Success Metrics

| Metric                          | Target                                           |
| ------------------------------- | ------------------------------------------------ |
| Overage adoption rate           | 20% of Pro/Business users enable within 3 months |
| Overage revenue                 | $X additional MRR                                |
| Support tickets about limits    | 50% reduction                                    |
| User upgrade rate after overage | Track as secondary metric                        |

## Dependencies & Risks

### Dependencies

- LemonSqueezy usage-based billing feature (available)
- Frontend build pipeline (existing)
- MongoDB transactions for atomic operations (available)

### Risks

| Risk                               | Mitigation                                              |
| ---------------------------------- | ------------------------------------------------------- |
| Users surprised by overage charges | Clear warnings, spending caps, confirmation modals      |
| Race conditions in usage tracking  | Atomic MongoDB operations                               |
| LemonSqueezy API failures          | Retry with exponential backoff, local tracking fallback |
| Billing disputes                   | Detailed audit logs, clear invoice line items           |

## References & Research

### Internal References

- Pricing config: `/Users/suyashthakur/front-end-html-to-gif/src/config/plan-features.js`
- Plan limits: `/Users/suyashthakur/html-to-gif/config/planLimits.js`
- Quota guard: `/Users/suyashthakur/html-to-gif/plugins/quota_guard.js`
- Usage tracking: `/Users/suyashthakur/html-to-gif/util/usage.js`
- LemonSqueezy webhooks: `/Users/suyashthakur/html-to-gif/routes/lemon-squeezy.js`
- PLG store: `/Users/suyashthakur/front-end-html-to-gif/src/store/plg.store.js`

### External References

- [LemonSqueezy Usage-Based Billing](https://docs.lemonsqueezy.com/guides/developer-guide/usage-based-billing)
- [LemonSqueezy Usage Records API](https://docs.lemonsqueezy.com/api/usage-records)
- [Kinde - Usage Caps, Alerts, and Spend Limits](https://kinde.com/learn/billing/pricing/integrating-usage-caps-alerts-and-spend-limits-in-billing-ux/)

### Key Learnings from Codebase

- Atomic quota operations prevent race conditions (use `findOneAndUpdate` with `$lt`)
- Webhook idempotency keys prevent double-billing
- Team vs User billing requires fallback logic during migration
- Alert thresholds currently at 50/65/75/85/95/100% (adjust to 50/80/95/100)

### Architecture Insights (architecture-strategist)

**Event-Driven Pattern Recommended:**

```
RenderRequest → QuotaCheck → OverageDecision → UsageIncrement → BillingReport
                    ↓
              [If over limit]
                    ↓
          OverageWarningEvent → UI Modal → UserConfirmation
```

**Separation of Concerns:**

1. `quota_guard.js` - Only checks limits, returns allow/deny + reason
2. `overage-billing.js` - Handles all overage logic (tracking, reporting, caps)
3. `usage.js` - Generic usage increment (delegates overage to billing service)

### Data Integrity Insights (data-integrity-guardian)

**Critical Requirements:**

- All usage increments must be atomic (use `$inc` with conditions)
- Never read-modify-write for counters (race condition)
- Add reconciliation job to sync local counts with LemonSqueezy
- Store billing events in audit log for dispute resolution:
  ```javascript
  // BillingEvent model for audit trail
  {
    userId: ObjectId,
    eventType: 'overage_increment' | 'overage_report' | 'cap_reached',
    quantity: Number,
    timestamp: Date,
    metadata: Object,
    idempotencyKey: String
  }
  ```

### UI/UX Insights (paywall-upgrade-cro)

**Toggle Placement:**

- Place overage toggle in upgrade modal, visible after plan comparison
- Use progressive disclosure: "Allow overages" → expand to show rate + cap options
- Show real cost impact: "Based on last month, overages would cost ~$X"

**Spending Cap Presets:**

- Offer quick-select buttons: $10, $25, $50, Custom
- Default to $25 for Pro, $50 for Business (psychological anchoring)
- Show as "Safety cap" not "Spending limit" (positive framing)

**Warning Modal Design:**

- Show at 95% usage AND before each overage render
- Include: current usage, overage rate, projected cost this session
- Two buttons: "Continue ($0.005)" and "Upgrade Plan (save 40%)"

### Frontend Component Patterns (frontend-design)

**OverageSettings.svelte Structure:**

```svelte
<script>
	export let allowOverages = false;
	export let spendingCap = null;
	export let overageRate = 0.005;

	const presets = [10, 25, 50];
	let customCap = '';
</script>

<!-- Neobrutalist toggle with thick borders -->
<div class="border-2 border-gray-900 p-4 bg-white shadow-[4px_4px_0_0_#1f2937]">
	<label class="flex items-center gap-3 cursor-pointer">
		<input type="checkbox" bind:checked={allowOverages} class="w-5 h-5 accent-blue-500" />
		<span class="font-bold">Allow overages at ${overageRate}/render</span>
	</label>

	{#if allowOverages}
		<div class="mt-4 pl-8">
			<p class="text-sm text-gray-600 mb-2">Monthly safety cap:</p>
			<div class="flex gap-2">
				{#each presets as amount}
					<button
						class="px-3 py-1 border-2 border-gray-900
                         {spendingCap === amount ? 'bg-blue-500 text-white' : 'bg-white'}"
					>
						${amount}
					</button>
				{/each}
				<input
					type="number"
					bind:value={customCap}
					placeholder="Custom"
					class="w-20 px-2 border-2 border-gray-900"
				/>
			</div>
		</div>
	{/if}
</div>
```

### Pricing Strategy Validation (pricing-strategy)

**Current pricing is competitive:**

- $0.005/render (Pro) = $5 per 1,000 overages - reasonable for occasional use
- $0.003/render (Business) = 40% discount - good volume incentive
- Consider: Volume discounts at 1000+ overages ($0.004 for Pro, $0.0025 for Business)

**Risk mitigation:**

- Spending caps prevent bill shock
- Clear pre-render warnings prevent surprise charges
- Monthly cap reset prevents runaway costs
