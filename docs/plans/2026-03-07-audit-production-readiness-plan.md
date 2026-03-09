---
title: "audit: Full Platform Production Readiness"
type: audit
status: active
date: 2026-03-07
---

# Full Platform Production Readiness Audit

## Overview

Comprehensive audit of Pictify.io (frontend + backend) treating the platform as built from scratch. Covers every feature flow, security posture, infrastructure readiness, and product completeness before production deployment.

## Platform Inventory

- **Frontend**: 79+ routes, 120+ components, 21 stores, 26 API clients
- **Backend**: 54 route files, 66 services, 10 middleware plugins, 28 MongoDB models, 8 BullMQ queues
- **Architecture**: SvelteKit + Tailwind (frontend), Fastify + MongoDB + Redis + BullMQ (backend)

---

## User Flow Status

| Flow | Status | Notes |
|------|--------|-------|
| Signup/Login | COMPLETE | OAuth + email + password reset + verification + abuse monitoring |
| Template Editor | COMPLETE | Fabric.js v6, multi-page, auto-save, undo/redo |
| API Usage | COMPLETE | Token management + playground + batch rendering |
| Billing/Subscription | COMPLETE | LemonSqueezy, plan tiers, overages, portal |
| Team/Collaboration | COMPLETE | Invitations, RBAC, seat limits, team switching |
| Experiments (A/B) | COMPLETE | Create, manage, analytics, public URL routing |
| Experiments (Smart Links) | COMPLETE | Rule engine, context extraction, rule builder |
| Experiments (Scheduled) | COMPLETE | Schedule resolver, pre-rendering, expiry |
| Experiments (Bandit) | TODO | Thompson Sampling not yet implemented |
| Dashboard | COMPLETE | Home, templates, analytics, activity logs |
| CDN/Share | COMPLETE | Public URLs, embed codes, view tracking |
| Brand Assets | COMPLETE | Upload, manage, library |
| Integrations | COMPLETE | Webhooks, storage connectors |
| PLG System | COMPLETE | Feature gating, milestones, usage prompts, overage billing |

**All critical user flows are complete end-to-end with no dead ends.**

---

## CRITICAL Issues (Must Fix Before Production)

### CRITICAL-1: Passwords Hashed with SHA-256 (No bcrypt)

**File**: `/Users/suyashthakur/html-to-gif/util/hash.js`

```js
// CURRENT - VULNERABLE
const hash = async (password) => {
  const { sha256 } = await import('crypto-hash')
  return await sha256(password)
}
```

SHA-256 is fast, unsalted, and vulnerable to rainbow tables. Must replace with bcrypt (cost 12+) or argon2id.

**Fix**: Replace with bcrypt, add migration path to re-hash on next login.

```js
// FIXED
const bcrypt = require('bcrypt')
const SALT_ROUNDS = 12

const hash = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

const verify = async (password, storedHash) => {
  // Support migration from SHA-256
  if (!storedHash.startsWith('$2b$')) {
    const { sha256 } = await import('crypto-hash')
    const sha256Hash = await sha256(password)
    if (sha256Hash === storedHash) {
      // Re-hash with bcrypt on successful login
      return { match: true, needsRehash: true }
    }
    return { match: false }
  }
  return { match: await bcrypt.compare(password, storedHash) }
}
```

### CRITICAL-2: Cookie Missing `sameSite` Attribute

**File**: `/Users/suyashthakur/html-to-gif/plugins/common/decorate_reply.js`

No `sameSite` attribute on the auth cookie enables CSRF attacks.

**Fix**: Add `sameSite: 'Lax'` to cookie options.

### CRITICAL-3: CORS Reflects Any Origin with Credentials

**File**: `/Users/suyashthakur/html-to-gif/server.js` (lines 126-136)

Any website can make authenticated requests to the backend.

**Fix**: Whitelist specific origins:
```js
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'https://pictify.io',
  'https://www.pictify.io',
].filter(Boolean)

fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, origin || true)
    } else {
      cb(new Error('Not allowed'), false)
    }
  },
  credentials: true,
})
```

### CRITICAL-4: /metrics and /admin/queues Exposed Without Auth

**File**: `/Users/suyashthakur/html-to-gif/server.js`

Prometheus metrics and Bull Board queue dashboard accessible to anyone.

**Fix**: Add admin secret header check or IP whitelist to both endpoints.

---

## HIGH Issues (Fix Within 1 Week)

### HIGH-1: Admin Secret Comparisons Vulnerable to Timing Attacks

**Files**: `routes/admin-abuse.js`, `routes/admin/dashboard.js`, `routes/admin/email.js`, `routes/auth.js` (impersonate)

All use direct `!==` comparison. Use `crypto.timingSafeEqual()` instead.

### HIGH-2: NoSQL $regex Injection in Search Endpoints

**Files**: `routes/public-templates.js`, `routes/template.js`, `routes/admin/contacts.js`

User search input passed directly to `$regex`. Escape special characters:
```js
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
```

### HIGH-3: Impersonation Endpoint Lacks Rate Limiting and Audit Logging

**File**: `routes/auth.js` - `/auth/impersonate`

No rate limiting, no audit logging, plain string comparison, no IP restriction.

### HIGH-4: No Rate Limiting on Auth Endpoints

Login, signup, forgot-password, reset-password have zero rate limiting. Add `@fastify/rate-limit` (10 attempts/min/IP).

### HIGH-5: AuthToken `validTill` Uses Static Default

**File**: `models/AuthToken.js`

`Date.now()` called at schema definition time, not document creation time.

**Fix**: `default: () => Date.now() + 1000 * 60 * 60 * 24 * 7`

---

## MEDIUM Issues (Fix Within 2 Weeks)

### MEDIUM-1: No Global Security Headers

Missing HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

**Fix**: Install and register `@fastify/helmet`.

### MEDIUM-2: Error Responses Leak Internal Details

Several routes return `error.message` and one returns `error.stack` (`copilot-swarm.js`).

**Fix**: Return generic errors to clients, log details server-side.

### MEDIUM-3: Frontend `{@html}` Without Sanitization

Multiple Svelte files use `{@html}` with potentially user-influenced data. DOMPurify is available but used in only one place.

**Fix**: Audit all `{@html}` usages and add DOMPurify where data could be user-influenced.

### MEDIUM-4: Template Variable Injection Without Sanitization

**File**: `routes/front-end.js` - User values injected into HTML templates via `.replaceAll()` without escaping.

### MEDIUM-5: Email Preview Route Active in Non-Production

**File**: `routes/email-preview.js` - No auth, enabled when `NODE_ENV !== 'production'`.

### MEDIUM-6: Forgot Password Reveals User Existence

Returns "User not found" vs. success, enabling email enumeration.

### MEDIUM-7: OAuth State Stored in Memory

`global._oauthStates = new Map()` - Lost on restart, doesn't work across instances. Move to Redis.

### MEDIUM-8: 161 console.log Statements in Frontend

Should be removed or made dev-only for production builds.

### MEDIUM-9: ~1200 console.log Statements in Backend

Should use Pino logger (`config/logger.js`) instead.

---

## LOW Issues (Fix Within 1 Month)

### LOW-1: Backup Files in Repository
- `Hero.svelte.bak`, `PropertiesPanel.svelte.bak` - Remove.

### LOW-2: Weak Email Validation
`/\S+@\S+\.\S+/` accepts many invalid inputs. Use a robust validator.

### LOW-3: No API Versioning
No `/api/v1/` prefix. Breaking changes affect all clients.

### LOW-4: No OpenAPI/Swagger Documentation
Routes have no machine-readable API docs.

### LOW-5: No Integration Tests
Jest configured but no test files visible.

### LOW-6: Missing Request Tracing
No request IDs for log correlation across services.

### LOW-7: Incomplete TODO Routes (Non-Critical)
- `tools/code-to-image` - Placeholder
- `tools/url-to-image-generator` - Placeholder
- `tools/online-invoice-generator` - Placeholder
- These can be removed from navigation if not shipping.

### LOW-8: API Token Scoping Missing
All tokens have full permissions. Consider read-only or template-only scopes.

### LOW-9: Missing File Upload Size Limits
CSV upload and template creation accept multipart with no explicit size limit.

---

## Frontend-Specific Findings

### Production Ready
- All 79+ routes have proper page files
- Dashboard layout with SideNav consistent across all pages
- PLG system fully integrated (feature gates, upgrade prompts, milestones)
- Pricing page with 3 paid tiers + free tier in comparison table
- Comparison pages (34 competitors) with accurate pricing data
- SEO: Sitemaps, meta tags, structured data, breadcrumbs

### Needs Attention
- 3 new components (ExperimentsShowcase, IntegrationsEcosystem, SocialProofBar) - verify integration
- `pattern-fill.js` utility - verify usage
- `.env.local` contains `PUBLIC_ADMIN_SECRET` (PUBLIC_ prefix exposes to client)

---

## Backend-Specific Findings

### Production Ready
- Authentication: JWT sessions + API tokens + OAuth2
- Authorization: Role-based access, team context, quota guard
- Rate limiting on public render endpoints (30/min/IP)
- Webhook signature verification (HMAC)
- Credential encryption (AES-256-GCM)
- SSRF protection service
- Abuse monitoring with risk scoring
- Error tracking (GlitchTip/Sentry)
- Prometheus metrics collection
- BullMQ queues with proper scheduling

### Needs Attention
- `.env` may contain real secrets (rotate all immediately)
- Admin routes use header-only auth (no user verification)
- Cache invalidation incomplete for experiments and templates
- No deep health check (DB, Redis, S3 connectivity)

---

## Acceptance Criteria

### Phase 1: Critical Security (Before Any Production Deploy)
- [ ] Replace SHA-256 password hashing with bcrypt (CRITICAL-1)
- [ ] Add `sameSite: 'Lax'` to auth cookie (CRITICAL-2)
- [ ] Whitelist CORS origins (CRITICAL-3)
- [ ] Protect /metrics and /admin/queues endpoints (CRITICAL-4)
- [ ] Rotate all secrets if .env was ever committed

### Phase 2: High Priority (Week 1)
- [ ] Use `timingSafeEqual` for admin secret comparisons (HIGH-1)
- [ ] Escape regex in search queries (HIGH-2)
- [ ] Add rate limiting + audit logging to impersonation (HIGH-3)
- [ ] Add rate limiting to auth endpoints (HIGH-4)
- [ ] Fix AuthToken validTill default (HIGH-5)

### Phase 3: Medium Priority (Week 2)
- [ ] Add global security headers via @fastify/helmet (MEDIUM-1)
- [ ] Fix error response leaking, especially stack traces (MEDIUM-2)
- [ ] Audit and fix all {@html} usages with DOMPurify (MEDIUM-3)
- [ ] Sanitize template variable injection (MEDIUM-4)
- [ ] Fix email preview route production guard (MEDIUM-5)
- [ ] Fix forgot-password user enumeration (MEDIUM-6)
- [ ] Move OAuth state to Redis (MEDIUM-7)
- [ ] Remove console.log statements from both codebases (MEDIUM-8, MEDIUM-9)

### Phase 4: Low Priority (Month 1)
- [ ] Remove .bak files from repository (LOW-1)
- [ ] Improve email validation (LOW-2)
- [ ] Add API versioning strategy (LOW-3)
- [ ] Generate OpenAPI/Swagger docs (LOW-4)
- [ ] Add integration test suite (LOW-5)
- [ ] Add request ID tracing (LOW-6)
- [ ] Remove or complete placeholder tool pages (LOW-7)
- [ ] Add API token scoping (LOW-8)
- [ ] Add file upload size limits (LOW-9)

---

## Production Deployment Checklist

| Category | Status | Action Required |
|----------|--------|-----------------|
| User Flows | PASS | All complete (except Bandit - optional) |
| Authentication | PASS | OAuth, sessions, API tokens all working |
| Authorization | WARN | Fix admin route auth |
| Password Security | FAIL | Replace SHA-256 with bcrypt |
| CSRF Protection | FAIL | Fix cookie sameSite + CORS |
| Input Validation | WARN | Fix regex injection, template injection |
| Error Handling | WARN | Stop leaking error details |
| Rate Limiting | WARN | Add to auth endpoints |
| Security Headers | FAIL | Add via @fastify/helmet |
| Secrets Management | WARN | Rotate if .env was committed |
| Monitoring | PASS | GlitchTip + Prometheus configured |
| Logging | WARN | Replace console.log with Pino |
| Feature Completeness | PASS | All major features shipped |
| Billing | PASS | LemonSqueezy fully integrated |
| Team Management | PASS | Invites, roles, seats working |
| Experiments | PASS | A/B, Smart Links, Scheduled complete |
| SEO | PASS | Sitemaps, meta, schema, comparisons |
| PLG | PASS | Feature gating, milestones, prompts |

---

## Verdict

**The platform is feature-complete and architecturally sound.** All critical user flows work end-to-end. The main blockers for production are **4 critical security issues** that can be fixed in 1-2 days of focused work. After those, the high/medium issues should be addressed over the following 2 weeks.

**Recommended deployment path:**
1. Fix CRITICAL-1 through CRITICAL-4 (1-2 days)
2. Fix HIGH-1 through HIGH-5 (2-3 days)
3. Deploy to staging, smoke test all flows
4. Fix MEDIUM issues in parallel
5. Production deploy

## Sources & References

### Internal References
- Frontend config: `src/config/plan-features.js`
- Backend plan limits: `config/planLimits.js`
- Backend PLG: `config/plg.js`
- Auth middleware: `plugins/decorate_user.js`
- Quota guard: `plugins/quota_guard.js`
- Password hashing: `util/hash.js`
- Cookie config: `plugins/common/decorate_reply.js`
- CORS config: `server.js:126`
