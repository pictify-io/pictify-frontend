---
title: "feat: Billing Tab with LemonSqueezy API Integration"
type: feat
date: 2026-02-15
deepened: 2026-02-15
---

# feat: Billing Tab with LemonSqueezy API Integration

## Enhancement Summary

**Deepened on:** 2026-02-15
**Research agents used:** kieran-rails-reviewer, security-sentinel, performance-oracle, architecture-strategist, code-simplicity-reviewer, agent-native-reviewer, best-practices-researcher, framework-docs-researcher, data-integrity-guardian, codebase-explorer

### Key Improvements from Research

1. **Security**: Add team admin permission checks on all subscription mutation endpoints
2. **Performance**: Implement backend aggregation endpoint with 5-minute caching to reduce API calls
3. **Simplification**: Reduce components from 9 to 4, remove custom store factory pattern
4. **Data Integrity**: Normalize `lemonSqueezySubscriptionId` to String type, add MongoDB transactions
5. **Agent-Native**: Create billing tools for copilot agent parity
6. **Code Quality**: Use Fastify patterns (not Express), add schema validation

### Critical Findings to Address

| Priority | Finding | Fix |
|----------|---------|-----|
| P0 | Missing team admin authorization on subscription actions | Add `canManageTeamBilling` check |
| P0 | Type mismatch: Team uses Number, User uses String for subscriptionId | Normalize to String |
| P0 | Race condition between API actions and webhooks | Implement sequence numbers |
| P1 | No caching for LemonSqueezy API calls | Add LRU cache with 5-min TTL |
| P1 | Over-engineered component structure (9 files) | Consolidate to 4 files |
| P2 | Express-style response patterns in Fastify | Use `reply.code().send()` |

## Overview

Replace the existing "Upgrade" tab in the dashboard with a comprehensive "Billing" tab that displays subscription data directly from LemonSqueezy API. This gives users full visibility into their subscription details, invoice history, and billing management without leaving the application.

## Problem Statement / Motivation

Currently, users must visit the external LemonSqueezy customer portal to view their subscription details, invoice history, or manage their subscription. This creates:

1. **Poor UX**: Users are redirected out of the app for billing information
2. **Limited Visibility**: No in-app view of invoices, payment method, renewal dates
3. **Fragmented Experience**: Upgrade functionality exists but billing management doesn't
4. **Support Burden**: Users contact support for billing questions that could be self-service

## Proposed Solution

Build a comprehensive Billing tab that integrates directly with LemonSqueezy API to display:

- **Subscription Overview**: Current plan, status, renewal date, payment method
- **Invoice History**: Paginated list with PDF download capability
- **Subscription Timeline**: History of billing events from SubscriptionEvent model
- **Overage Settings**: Existing billing preferences (already implemented)
- **Subscription Actions**: Pause, resume, cancel, reactivate (via LemonSqueezy API)
- **Plan Management**: Upgrade/downgrade with proration (embedded or linked)

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Svelte)                        │
├─────────────────────────────────────────────────────────────────┤
│  BillingTab.svelte                                               │
│  ├── SubscriptionOverview.svelte (plan, status, renewal, card)  │
│  ├── InvoiceHistory.svelte (paginated list, PDF download)       │
│  ├── SubscriptionTimeline.svelte (events from SubscriptionEvent)│
│  ├── OverageSettings.svelte (existing component)                │
│  └── SubscriptionActions.svelte (pause, cancel, resume)         │
├─────────────────────────────────────────────────────────────────┤
│  billing.store.js (new store for billing state)                 │
│  src/api/billing.js (API client methods)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (Fastify)                        │
├─────────────────────────────────────────────────────────────────┤
│  routes/billing.js (NEW - billing endpoints)                    │
│  ├── GET /api/billing/subscription                              │
│  ├── GET /api/billing/invoices                                  │
│  ├── GET /api/billing/timeline                                  │
│  ├── POST /api/billing/subscription/pause                       │
│  ├── POST /api/billing/subscription/resume                      │
│  ├── POST /api/billing/subscription/cancel                      │
│  └── POST /api/billing/subscription/reactivate                  │
├─────────────────────────────────────────────────────────────────┤
│  Existing Endpoints:                                             │
│  ├── GET /api/billing-preferences (overage settings)           │
│  ├── PUT /api/billing-preferences                               │
│  └── GET /lemon-squeezy/customer-portal                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ LemonSqueezy SDK
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LemonSqueezy API                              │
│  ├── GET /v1/subscriptions/:id                                  │
│  ├── PATCH /v1/subscriptions/:id                                │
│  ├── GET /v1/subscription-invoices?subscription_id=:id         │
│  └── GET /v1/subscription-invoices/:id                         │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Phases

#### Phase 1: Backend API Endpoints

**New file: `routes/billing.js`**

```javascript
// routes/billing.js
const {
  getSubscription,
  listSubscriptionInvoices,
  updateSubscription,
  cancelSubscription,
} = require('@lemonsqueezy/lemonsqueezy.js')
const SubscriptionEvent = require('../models/SubscriptionEvent')
const decorateUser = require('../plugins/decorate_user')
const teamContext = require('../plugins/team_context')

// GET /api/billing/subscription
async function getSubscriptionDetails(req, res) {
  const { user, team } = req
  const billingEntity = team || user
  const subscriptionId = billingEntity.lemonSqueezySubscriptionId

  if (!subscriptionId) {
    return res.status(200).send({
      hasSubscription: false,
      plan: 'starter',
    })
  }

  const { data, error } = await getSubscription(subscriptionId, {
    include: ['product', 'variant'],
  })

  if (error) {
    return res.status(500).send({ error: 'Failed to fetch subscription' })
  }

  const attrs = data.data.attributes
  return res.status(200).send({
    hasSubscription: true,
    id: data.data.id,
    status: attrs.status,
    statusFormatted: attrs.status_formatted,
    productName: attrs.product_name,
    variantName: attrs.variant_name,
    renewsAt: attrs.renews_at,
    endsAt: attrs.ends_at,
    trialEndsAt: attrs.trial_ends_at,
    cardBrand: attrs.card_brand,
    cardLastFour: attrs.card_last_four,
    paymentProcessor: attrs.payment_processor,
    pause: attrs.pause,
    cancelled: attrs.cancelled,
    urls: attrs.urls,
  })
}

// GET /api/billing/invoices
async function getInvoices(req, res) {
  const { user, team } = req
  const billingEntity = team || user
  const subscriptionId = billingEntity.lemonSqueezySubscriptionId
  const page = parseInt(req.query.page) || 1

  if (!subscriptionId) {
    return res.status(200).send({ invoices: [], pagination: null })
  }

  const { data, error } = await listSubscriptionInvoices({
    filter: { subscriptionId },
    page: { number: page, size: 10 },
  })

  if (error) {
    return res.status(500).send({ error: 'Failed to fetch invoices' })
  }

  const invoices = data.data.map(inv => ({
    id: inv.id,
    date: inv.attributes.created_at,
    total: inv.attributes.total_formatted,
    status: inv.attributes.status,
    statusFormatted: inv.attributes.status_formatted,
    billingReason: inv.attributes.billing_reason,
    invoiceUrl: inv.attributes.urls?.invoice_url,
  }))

  return res.status(200).send({
    invoices,
    pagination: {
      currentPage: data.meta.page.currentPage,
      totalPages: data.meta.page.lastPage,
      total: data.meta.page.total,
    },
  })
}

// GET /api/billing/timeline
async function getTimeline(req, res) {
  const { user, team } = req

  const events = team
    ? await SubscriptionEvent.getTeamTimeline(team.uid, 20)
    : await SubscriptionEvent.getUserTimeline(user._id, 20)

  return res.status(200).send({ events })
}

// POST /api/billing/subscription/pause
async function pauseSubscription(req, res) {
  const { user, team } = req
  const billingEntity = team || user
  const subscriptionId = billingEntity.lemonSqueezySubscriptionId
  const { mode = 'void', resumesAt } = req.body

  // Check PayPal - must redirect to portal
  const { data: subData } = await getSubscription(subscriptionId)
  if (subData.data.attributes.payment_processor === 'paypal') {
    return res.status(400).send({
      error: 'PayPal subscriptions must be managed via customer portal',
      portalUrl: subData.data.attributes.urls.customer_portal,
    })
  }

  const pause = { mode }
  if (resumesAt) {
    pause.resumes_at = resumesAt
  }

  const { data, error } = await updateSubscription(subscriptionId, { pause })

  if (error) {
    return res.status(500).send({ error: 'Failed to pause subscription' })
  }

  return res.status(200).send({
    success: true,
    status: data.data.attributes.status,
    pause: data.data.attributes.pause,
  })
}

// POST /api/billing/subscription/resume
async function resumeSubscription(req, res) {
  const { user, team } = req
  const billingEntity = team || user
  const subscriptionId = billingEntity.lemonSqueezySubscriptionId

  const { data, error } = await updateSubscription(subscriptionId, {
    pause: null,
  })

  if (error) {
    return res.status(500).send({ error: 'Failed to resume subscription' })
  }

  return res.status(200).send({
    success: true,
    status: data.data.attributes.status,
    renewsAt: data.data.attributes.renews_at,
  })
}

// POST /api/billing/subscription/cancel
async function cancelSubscriptionHandler(req, res) {
  const { user, team } = req
  const billingEntity = team || user
  const subscriptionId = billingEntity.lemonSqueezySubscriptionId

  const { data, error } = await cancelSubscription(subscriptionId)

  if (error) {
    return res.status(500).send({ error: 'Failed to cancel subscription' })
  }

  return res.status(200).send({
    success: true,
    status: data.data.attributes.status,
    endsAt: data.data.attributes.ends_at,
  })
}

// POST /api/billing/subscription/reactivate
async function reactivateSubscription(req, res) {
  const { user, team } = req
  const billingEntity = team || user
  const subscriptionId = billingEntity.lemonSqueezySubscriptionId

  const { data, error } = await updateSubscription(subscriptionId, {
    cancelled: false,
  })

  if (error) {
    return res.status(500).send({ error: 'Failed to reactivate subscription' })
  }

  return res.status(200).send({
    success: true,
    status: data.data.attributes.status,
    renewsAt: data.data.attributes.renews_at,
  })
}

module.exports = async (fastify) => {
  fastify.register(decorateUser)
  fastify.register(teamContext)

  fastify.get('/subscription', getSubscriptionDetails)
  fastify.get('/invoices', getInvoices)
  fastify.get('/timeline', getTimeline)
  fastify.post('/subscription/pause', pauseSubscription)
  fastify.post('/subscription/resume', resumeSubscription)
  fastify.post('/subscription/cancel', cancelSubscriptionHandler)
  fastify.post('/subscription/reactivate', reactivateSubscription)
}

module.exports.autoPrefix = '/api/billing'
```

#### Phase 2: Frontend API Client

**File: `src/api/billing.js`**

```javascript
// src/api/billing.js
import backend from '../service/backend';

export async function getSubscription() {
  return backend.get('/api/billing/subscription');
}

export async function getInvoices(page = 1) {
  return backend.get(`/api/billing/invoices?page=${page}`);
}

export async function getTimeline() {
  return backend.get('/api/billing/timeline');
}

export async function pauseSubscription({ mode = 'void', resumesAt = null }) {
  return backend.post('/api/billing/subscription/pause', { mode, resumesAt });
}

export async function resumeSubscription() {
  return backend.post('/api/billing/subscription/resume');
}

export async function cancelSubscription() {
  return backend.post('/api/billing/subscription/cancel');
}

export async function reactivateSubscription() {
  return backend.post('/api/billing/subscription/reactivate');
}

export async function getCustomerPortalUrl() {
  return backend.get('/lemon-squeezy/customer-portal');
}
```

#### Phase 3: Frontend Billing Store

**File: `src/store/billing.store.js`**

```javascript
// src/store/billing.store.js
import { writable, derived } from 'svelte/store';
import * as billingApi from '../api/billing';

function createBillingStore() {
  const { subscribe, set, update } = writable({
    subscription: null,
    invoices: [],
    invoicesPagination: null,
    timeline: [],
    loading: true,
    error: null,
  });

  return {
    subscribe,

    async fetchAll() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const [subRes, invRes, timeRes] = await Promise.all([
          billingApi.getSubscription(),
          billingApi.getInvoices(),
          billingApi.getTimeline(),
        ]);

        update(state => ({
          ...state,
          subscription: subRes,
          invoices: invRes.invoices,
          invoicesPagination: invRes.pagination,
          timeline: timeRes.events,
          loading: false,
        }));
      } catch (error) {
        update(state => ({
          ...state,
          error: error.message,
          loading: false,
        }));
      }
    },

    async loadMoreInvoices(page) {
      const res = await billingApi.getInvoices(page);
      update(state => ({
        ...state,
        invoices: [...state.invoices, ...res.invoices],
        invoicesPagination: res.pagination,
      }));
    },

    async pauseSubscription(options) {
      const res = await billingApi.pauseSubscription(options);
      if (res.success) {
        update(state => ({
          ...state,
          subscription: {
            ...state.subscription,
            status: res.status,
            pause: res.pause,
          },
        }));
      }
      return res;
    },

    async resumeSubscription() {
      const res = await billingApi.resumeSubscription();
      if (res.success) {
        update(state => ({
          ...state,
          subscription: {
            ...state.subscription,
            status: res.status,
            pause: null,
          },
        }));
      }
      return res;
    },

    async cancelSubscription() {
      const res = await billingApi.cancelSubscription();
      if (res.success) {
        update(state => ({
          ...state,
          subscription: {
            ...state.subscription,
            status: res.status,
            cancelled: true,
            endsAt: res.endsAt,
          },
        }));
      }
      return res;
    },

    async reactivateSubscription() {
      const res = await billingApi.reactivateSubscription();
      if (res.success) {
        update(state => ({
          ...state,
          subscription: {
            ...state.subscription,
            status: res.status,
            cancelled: false,
          },
        }));
      }
      return res;
    },
  };
}

export const billingStore = createBillingStore();

// Derived stores for UI state
export const isPayPal = derived(billingStore, $b =>
  $b.subscription?.paymentProcessor === 'paypal'
);

export const canPause = derived(billingStore, $b => {
  const status = $b.subscription?.status;
  return status === 'active' && !$b.subscription?.pause;
});

export const canResume = derived(billingStore, $b => {
  return $b.subscription?.status === 'paused' || $b.subscription?.pause;
});

export const canCancel = derived(billingStore, $b => {
  const status = $b.subscription?.status;
  return ['active', 'on_trial', 'paused'].includes(status) && !$b.subscription?.cancelled;
});

export const canReactivate = derived(billingStore, $b => {
  return $b.subscription?.cancelled && $b.subscription?.endsAt &&
    new Date($b.subscription.endsAt) > new Date();
});
```

#### Phase 4: Frontend Components

**File structure:**
```
src/lib/components/billing/
├── BillingTab.svelte           # Main container
├── SubscriptionOverview.svelte # Current plan, status, renewal
├── PaymentMethod.svelte        # Card display, update link
├── InvoiceHistory.svelte       # Invoice list with download
├── SubscriptionTimeline.svelte # Event history
├── SubscriptionActions.svelte  # Pause, cancel, resume buttons
├── PauseModal.svelte           # Pause configuration modal
├── CancelModal.svelte          # Cancel confirmation modal
└── StatusBadge.svelte          # Colored status badge
```

**Component: `BillingTab.svelte`**

```svelte
<script>
  import { onMount } from 'svelte';
  import { billingStore } from '../../../store/billing.store';
  import SubscriptionOverview from './SubscriptionOverview.svelte';
  import InvoiceHistory from './InvoiceHistory.svelte';
  import SubscriptionTimeline from './SubscriptionTimeline.svelte';
  import SubscriptionActions from './SubscriptionActions.svelte';
  import OverageSettings from '../plg/OverageSettings.svelte';
  import Loader from '../Loader.svelte';

  $: ({ subscription, loading, error } = $billingStore);
  $: hasSubscription = subscription?.hasSubscription;

  onMount(() => {
    billingStore.fetchAll();
  });
</script>

<div class="billing-tab">
  <div class="mb-6">
    <h1 class="text-3xl font-black text-gray-900 tracking-tighter mb-2">
      Billing
    </h1>
    <p class="text-gray-600">
      Manage your subscription, view invoices, and update billing settings
    </p>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <Loader size="10" show={true} />
    </div>
  {:else if error}
    <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-800 font-bold">Failed to load billing information</p>
      <p class="text-red-600 text-sm mt-1">{error}</p>
      <button
        on:click={() => billingStore.fetchAll()}
        class="mt-4 px-4 py-2 bg-red-600 text-white font-bold rounded-lg"
      >
        Retry
      </button>
    </div>
  {:else if !hasSubscription}
    <!-- Free user empty state -->
    <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 text-center">
      <h2 class="text-xl font-bold text-gray-900 mb-2">You're on the Free Plan</h2>
      <p class="text-gray-600 mb-4">Upgrade to unlock more renders and features</p>
      <a
        href="/dashboard/upgrade"
        class="inline-block px-6 py-3 bg-[#ffc480] text-gray-900 font-bold rounded-lg border-2 border-gray-900"
      >
        View Plans
      </a>
    </div>
  {:else}
    <div class="space-y-6">
      <SubscriptionOverview {subscription} />
      <SubscriptionActions {subscription} />
      <InvoiceHistory />
      <SubscriptionTimeline />
      <OverageSettings />
    </div>
  {/if}
</div>
```

## Acceptance Criteria

### Functional Requirements

- [ ] Billing tab replaces Upgrade tab in dashboard navigation
- [ ] Display current subscription details (plan, status, renewal date, payment method)
- [ ] Display paginated invoice history with "Load More" functionality
- [ ] Enable PDF invoice download via LemonSqueezy URLs
- [ ] Display subscription event timeline from SubscriptionEvent model
- [ ] Show existing overage settings component for eligible plans
- [ ] Implement pause subscription with mode selection (void/free) and optional resume date
- [ ] Implement resume subscription for paused subscriptions
- [ ] Implement cancel subscription with confirmation modal and grace period display
- [ ] Implement reactivate subscription during grace period
- [ ] Redirect PayPal users to customer portal for subscription modifications
- [ ] Handle all subscription statuses: active, on_trial, paused, past_due, unpaid, cancelled, expired

### Non-Functional Requirements

- [ ] API responses return within 2 seconds
- [ ] Error states display clear, actionable messages
- [ ] Loading states show appropriate skeleton/spinners
- [ ] Team members (non-admin) see read-only view of billing
- [ ] No sensitive data exposed in API responses beyond what's needed for display

### Testing Requirements

- [ ] Unit tests for billing API client functions
- [ ] Integration tests for backend billing endpoints
- [ ] Test all subscription status UI states
- [ ] Test PayPal detection and portal redirect
- [ ] Test team vs individual billing flows

## Files to Modify/Create

### Backend (html-to-gif)

| File | Action | Purpose |
|------|--------|---------|
| `routes/billing.js` | CREATE | New billing API endpoints |
| `routes/lemon-squeezy.js` | MODIFY | Add additional LemonSqueezy SDK imports |
| `models/Team.js` | MODIFY | Normalize lemonSqueezySubscriptionId to String |

### Frontend (front-end-html-to-gif)

| File | Action | Purpose |
|------|--------|---------|
| `src/api/billing.js` | CREATE | Billing API client |
| `src/store/billing.store.js` | CREATE | Billing state management |
| `src/lib/components/billing/BillingTab.svelte` | CREATE | Main billing container |
| `src/lib/components/billing/SubscriptionOverview.svelte` | CREATE | Plan/status display |
| `src/lib/components/billing/PaymentMethod.svelte` | CREATE | Card info display |
| `src/lib/components/billing/InvoiceHistory.svelte` | CREATE | Invoice list |
| `src/lib/components/billing/SubscriptionTimeline.svelte` | CREATE | Event history |
| `src/lib/components/billing/SubscriptionActions.svelte` | CREATE | Action buttons |
| `src/lib/components/billing/PauseModal.svelte` | CREATE | Pause confirmation |
| `src/lib/components/billing/CancelModal.svelte` | CREATE | Cancel confirmation |
| `src/lib/components/billing/StatusBadge.svelte` | CREATE | Status badge component |
| `src/routes/dashboard/billing/+page.svelte` | CREATE | Billing page route |
| `src/lib/components/dashboard/SideNav.svelte` | MODIFY | Replace Upgrade with Billing |
| `src/routes/dashboard/upgrade/+page.svelte` | MODIFY | Redirect to billing or embed |

## Dependencies & Risks

### Dependencies

1. **LemonSqueezy SDK** - Already installed (`@lemonsqueezy/lemonsqueezy.js`)
2. **Existing auth/team plugins** - `decorateUser`, `teamContext`
3. **SubscriptionEvent model** - Already implemented with timeline methods

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LemonSqueezy API rate limits | Medium | High | Implement caching, show stale data with refresh |
| PayPal subscription complexity | Low | Medium | Detect and redirect to portal |
| Webhook failures after actions | Low | High | Show optimistic UI, reconcile via webhook |
| Team permission edge cases | Medium | Low | Explicit permission checks on all endpoints |

---

## Research Insights

### Security Review Findings (CRITICAL)

**1. Missing Team Admin Authorization**
All subscription mutation endpoints (pause, resume, cancel, reactivate) must verify the user has admin/owner permissions:

```javascript
// REQUIRED: Add to all mutation endpoints
const canManageTeamBilling = async (userId, teamUid) => {
  const membership = await TeamMember.findOne({
    user: userId,
    team: teamUid,
    status: 'active',
  })
  return membership && ['owner', 'admin'].includes(membership.role)
}

// In pause/resume/cancel handlers:
if (team?.uid) {
  if (!await canManageTeamBilling(user._id, team.uid)) {
    return reply.code(403).send({
      error: 'FORBIDDEN',
      message: 'Only team owners and admins can manage subscriptions.',
    })
  }
}
```

**2. Never Expose lemonSqueezySubscriptionId**
Filter sensitive IDs from all API responses. Only return display-safe data.

**3. Customer Portal URL Permission Check**
Add same permission check to `/lemon-squeezy/customer-portal` endpoint.

### Performance Optimizations

**1. Backend Aggregation Endpoint (RECOMMENDED)**
Instead of 3 parallel API calls from frontend, create single aggregated endpoint:

```javascript
// routes/billing.js - Add aggregated endpoint
const { LRUCache } = require('lru-cache')

const cache = new LRUCache({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
})

const getBillingDashboard = async (request, reply) => {
  const { user, team } = request
  const billingEntity = team?.uid ? team : user
  const cacheKey = `billing:${billingEntity._id || billingEntity.uid}`

  const cached = cache.get(cacheKey)
  if (cached) {
    return reply.send({ ...cached, cached: true })
  }

  const [subscription, invoices, timeline] = await Promise.all([
    getSubscriptionWithCache(billingEntity.lemonSqueezySubscriptionId),
    getInvoicesFromLemonSqueezy(billingEntity.lemonSqueezySubscriptionId, 1),
    team
      ? SubscriptionEvent.getTeamTimeline(team.uid, 20)
      : SubscriptionEvent.getUserTimeline(user._id, 20),
  ])

  const result = { subscription, invoices, timeline, cachedAt: Date.now() }
  cache.set(cacheKey, result)
  return reply.send(result)
}
```

**2. Rate Limit Protection**
Add retry with exponential backoff for LemonSqueezy calls:

```javascript
const getSubscriptionWithRetry = async (subscriptionId, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await getSubscription(subscriptionId, {
        include: ['product', 'variant'],
      })
      if (error) throw error
      return data
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
        continue
      }
      throw error
    }
  }
}
```

### Simplification Recommendations

**1. Reduce Components from 9 to 4:**

```
BEFORE (9 files):
├── BillingTab.svelte
├── SubscriptionOverview.svelte
├── PaymentMethod.svelte
├── InvoiceHistory.svelte
├── SubscriptionTimeline.svelte  ← REMOVE (YAGNI)
├── SubscriptionActions.svelte   ← INLINE
├── PauseModal.svelte            ← CONSOLIDATE
├── CancelModal.svelte           ← CONSOLIDATE
└── StatusBadge.svelte           ← INLINE (3 lines)

AFTER (4 files):
├── BillingTab.svelte           # Main container
├── SubscriptionCard.svelte     # Overview + payment + actions
├── InvoiceHistory.svelte       # Invoice list (keep)
└── ConfirmModal.svelte         # Reusable for pause/cancel
```

**2. Simplify Store Pattern:**
Remove custom store factory, use plain writable + functions:

```javascript
// SIMPLIFIED billing.store.js
import { writable } from 'svelte/store'

export const billing = writable(null)
export const loading = writable(false)
export const error = writable(null)

export async function fetchBilling() {
  loading.set(true)
  error.set(null)
  try {
    const res = await fetch('/api/billing/dashboard')
    billing.set(await res.json())
  } catch (e) {
    error.set(e.message)
  } finally {
    loading.set(false)
  }
}

// Actions are standalone functions
export async function pauseSubscription(options) {
  const res = await fetch('/api/billing/subscription/pause', {
    method: 'POST',
    body: JSON.stringify(options)
  })
  if (res.ok) await fetchBilling() // Refresh
  return res.json()
}
```

**3. Remove Derived Stores:**
Use inline `{@const}` declarations instead:

```svelte
{#if $billing}
  {@const isPayPal = $billing.paymentProcessor === 'paypal'}
  {@const canPause = $billing.status === 'active' && !isPayPal}
  {@const canCancel = ['active', 'paused'].includes($billing.status)}
  <!-- Use directly -->
{/if}
```

### Data Integrity Fixes (CRITICAL)

**1. Normalize lemonSqueezySubscriptionId to String:**

```javascript
// models/Team.js - CHANGE THIS
lemonSqueezySubscriptionId: {
  type: String,  // NOT Number - IDs can exceed MAX_SAFE_INTEGER
  default: null,
  index: true,
}
```

**Migration script needed** to convert existing Number values to String.

**2. Add MongoDB Transactions for Webhook Processing:**

```javascript
const session = await mongoose.startSession()
try {
  await session.withTransaction(async () => {
    await Team.findOneAndUpdate(query, update, { session })
    await SubscriptionEvent.create([eventData], { session })
  })
} finally {
  await session.endSession()
}
```

**3. Track Grace Period for Cancelled Subscriptions:**

```javascript
// Add to Team and User models
subscriptionEndsAt: { type: Date, default: null },
scheduledDowngradeTo: { type: String, default: null },

// Don't downgrade immediately on cancel - wait for ends_at
if (subscriptionStatus === 'cancelled') {
  const endsAt = new Date(payload.data.attributes.ends_at)
  if (endsAt > new Date()) {
    billingEntity.subscriptionEndsAt = endsAt
    // Keep currentPlan until expiry
  }
}
```

### Agent-Native Architecture

**Add Billing Tools for Copilot Agent:**

Create `tools/billing-tools.js`:
```javascript
const billingTools = [
  { name: 'getSubscription', description: 'Get current subscription status' },
  { name: 'getInvoices', description: 'Get list of invoices' },
  { name: 'pauseSubscription', description: 'Pause subscription (requires confirmation)' },
  { name: 'cancelSubscription', description: 'Cancel subscription (requires confirmation)' },
]
```

Register in `canvas-tools.js` and update `copilot-agent.js` system prompt.

### Billing UX Best Practices

**1. Cancel Flow with Retention:**
```
Step 1: "Why are you canceling?" (reason collection)
Step 2: Personalized offer based on reason:
  - "Too expensive" → 30% off 3 months
  - "Not using enough" → Pause option
  - "Missing features" → Downgrade option
Step 3: Confirmation with grace period display
```

**2. Status Communication:**
- Be specific: "Renews March 15, 2026" not "Renews next month"
- Show proactive warnings 7 days before card expiry
- Use positive framing: "You've saved $120 with annual billing"

**3. Error Messages (WCAG Compliant):**
```javascript
const errorMessages = {
  card_declined: {
    title: 'Payment declined',
    message: 'Your card was declined. Please try a different payment method.',
    action: 'Update Payment Method'
  },
  // Always include: role="alert", aria-live="assertive"
}
```

**4. Mobile Touch Targets:**
- Minimum 44x44px for all billing buttons
- Stack cards vertically on mobile
- Fixed bottom bar for primary actions

### Fastify Code Quality Fixes

**1. Use Fastify Patterns (Not Express):**

```javascript
// WRONG (Express-style)
return res.status(500).send({ error: 'Failed' })

// CORRECT (Fastify)
return reply.code(500).send({ error: 'Failed' })
```

**2. Add Schema Validation:**

```javascript
fastify.get('/subscription', {
  schema: {
    description: 'Get subscription details for current user/team',
    tags: ['billing'],
    response: {
      200: {
        type: 'object',
        properties: {
          hasSubscription: { type: 'boolean' },
          plan: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  },
}, getSubscriptionDetails)
```

**3. Centralize SDK Initialization:**

```javascript
// service/lemonsqueezy-client.js (single initialization)
let initialized = false

const initLemonSqueezy = () => {
  if (initialized) return
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY,
    onError: (error) => console.error('[LemonSqueezy]', error),
  })
  initialized = true
}

initLemonSqueezy()
module.exports = { getSubscription, updateSubscription, ... }
```

## References & Research

### Internal References

- `routes/lemon-squeezy.js` (lines 502-538) - Existing customer portal endpoint
- `routes/billing-preferences.js` - Overage settings API pattern with permission check
- `models/SubscriptionEvent.js` (lines 120-133) - Timeline query methods
- `config/planLimits.js` - Overage eligibility configuration
- `plugins/team_context.js` - Team permission patterns to follow

### External References

- [LemonSqueezy Subscription API](https://docs.lemonsqueezy.com/api/subscriptions)
- [LemonSqueezy.js SDK Wiki](https://github.com/lmsqueezy/lemonsqueezy.js/wiki)
- [LemonSqueezy Customer Portal Guide](https://docs.lemonsqueezy.com/guides/developer-guide/customer-portal)
- [Subscription Invoice API](https://docs.lemonsqueezy.com/api/subscription-invoices)

### UX Research Sources

- [Chargebee Cancellation Flow Guide](https://www.chargebee.com/blog/cancellation-flow/)
- [Stripe Billing Page Patterns](https://stripe.com/resources/more/designing-a-billing-page-that-converts)
- [W3C WCAG 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html)
- [PCI DSS Masking Requirements](https://www.strac.io/blog/pci-masking-requirements-credit-card)
