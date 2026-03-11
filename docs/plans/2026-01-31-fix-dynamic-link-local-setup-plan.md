---
title: 'fix: Dynamic Link Functionality Not Working in Local Setup'
type: fix
date: 2026-01-31
deepened: 2026-01-31
---

# fix: Dynamic Link Functionality Not Working in Local Setup

## Enhancement Summary

**Deepened on:** 2026-01-31
**Research agents used:** Frontend Debugger, Backend Analyzer, Julik Frontend Races Reviewer, Security Sentinel, Performance Oracle, Git History Analyzer

### Key Issues Discovered

1. **CRITICAL: `binding.userId` is undefined** - The binding-renderer.js uses `binding.userId` in 8 places, but the model uses `createdBy`
2. **CRITICAL: Logic error in decorate_user.js** - Authentication check uses `&&` instead of `||`
3. **HIGH: Frontend credentials not being sent** - Cookie credentials detection may fail
4. **HIGH: Type mismatch in `createdBy` field** - Inconsistent ObjectId vs String usage
5. **MEDIUM: Promise.all fails entirely on any error** - No graceful degradation
6. **MEDIUM: Missing CREDENTIAL_ENCRYPTION_KEY** - Required for credential storage

---

## Overview

The Dynamic Link functionality in the frontend template modes is not working in the local development environment. After comprehensive investigation using multiple research agents, **six critical issues** were identified that prevent the feature from working.

## Problem Statement

The Dynamic Link feature (internally called "Bindings") enables dynamic image generation by connecting templates to external data sources. The feature requires:

1. A running backend server with `/bindings` and `/data-sources` endpoints
2. MongoDB connection for storing binding configurations
3. Redis for caching and queue management
4. Environment variables properly configured
5. Correct authentication flow between frontend and backend

The frontend is attempting to call these API endpoints:

- `GET /templates/{uid}` - Get template details
- `GET /templates/{uid}/variables` - Get template variables
- `GET /bindings?templateId={uid}` - Get existing bindings
- `GET /data-sources` - List user's data sources
- `POST /data-sources/test` - Test data source connection
- `POST /data-sources` - Create new data source
- `POST /bindings` - Create new binding

---

## Root Causes (Comprehensive)

### Issue 1: CRITICAL - `binding.userId` is undefined

**File:** `/Users/suyashthakur/html-to-gif/service/binding-renderer.js`
**Lines:** 127, 179, 182, 227, 252, 262, 280, 291

The binding-renderer.js service references `binding.userId` in **8 places**, but the `Binding` model schema uses `createdBy` instead:

```javascript
// BROKEN - binding.userId is undefined
userId: binding.userId,  // Lines 127, 182, 227, 252, 280
const hasUserStorage = await hasActiveStorageConnector(binding.userId)  // Line 179
logBindingRender(binding.userId, { ... })  // Lines 262, 291
```

**Impact:**

- All webhook events (`binding.failed`, `binding.updated`, `render.completed`) have `userId: undefined`
- User storage uploads fail with undefined userId
- Audit logging receives undefined userId

**Fix Required:** Replace all `binding.userId` with `binding.createdBy`

---

### Issue 2: CRITICAL - Logic Error in Authentication Check

**File:** `/Users/suyashthakur/html-to-gif/plugins/decorate_user.js`
**Line:** 27

```javascript
// BROKEN - uses && when it should use ||
if (!authTokens && !authTokens['auth-token']) {
```

**Problem:** This condition uses AND (`&&`) when it should use OR (`||`). The expression `!authTokens && !authTokens['auth-token']` will:

- Never enter the block if `authTokens` is truthy (because `!authTokens` is false)
- Throw an error if `authTokens` is falsy (can't access property of null/undefined)

**Fix Required:** Change to `if (!authTokens || !authTokens['auth-token'])`

---

### Issue 3: HIGH - Frontend Credentials Detection Bug

**File:** `/Users/suyashthakur/front-end-html-to-gif/src/service/backend.js`
**Line:** 3

```javascript
const isCredentialsSupported = 'credentials' in Request.prototype;
```

**Problem:** This check happens at **module load time**, not at runtime. If `Request.prototype` doesn't have `credentials` support when the module is evaluated (e.g., during SSR or in certain browser contexts), it will be `false` forever.

**Line 24:** `credentials: isCredentialsSupported ? 'include' : undefined,`

**Impact:** When `credentials` is `undefined`, cookies won't be sent with cross-origin requests, causing 401 errors.

**Fix Required:** Always use `credentials: 'include'` or check at runtime.

---

### Issue 4: HIGH - Type Mismatch in `createdBy` Field

**Files:**

- `/Users/suyashthakur/html-to-gif/routes/bindings.js` (uses `user._id` directly)
- `/Users/suyashthakur/html-to-gif/routes/data-sources.js` (uses `user._id.toString()`)

**Examples:**

```javascript
// bindings.js line 264 - ObjectId
createdBy: user._id,

// data-sources.js line 106 - String
createdBy: user._id.toString(),
```

**Impact:** Documents created via bindings have an ObjectId, but queries in data-sources match against a string. This breaks cross-route data retrieval.

**Fix Required:** Consistently use `user._id.toString()` in both files.

---

### Issue 5: MEDIUM - Promise.all Fails Entirely on Any Error

**File:** `/Users/suyashthakur/front-end-html-to-gif/src/routes/dashboard/template/[uid]/dynamic/+page.svelte`
**Lines:** 99-104

```javascript
const [templateRes, variablesRes, bindingsRes, dataSourcesRes] = await Promise.all([
	getTemplateById(uid),
	getTemplateVariables(uid),
	getBindingsForTemplate(uid),
	getDataSources()
]);
```

**Problem:** If ANY of these four API calls fails, the ENTIRE `Promise.all` rejects. Users see "Failed to load data" even if 3 out of 4 calls succeeded.

**Fix Required:** Use `Promise.allSettled` for graceful degradation.

---

### Issue 6: MEDIUM - Missing CREDENTIAL_ENCRYPTION_KEY

**File:** `/Users/suyashthakur/html-to-gif/service/encryption-service.js`
**Line:** 14

```javascript
const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;
if (!keyHex) {
	throw new Error('CREDENTIAL_ENCRYPTION_KEY environment variable is required');
}
```

**Impact:** Creating bindings with credentials (API keys, bearer tokens) will crash without this env var.

---

### Issue 7: MEDIUM - Silent Error Swallowing

**File:** `/Users/suyashthakur/front-end-html-to-gif/src/service/backend.js`
**Lines:** 31-40 (and similar in all HTTP methods)

```javascript
try {
	const data = await response.json();
	if (data && data.message) {
		message = data.message;
	}
} catch (e) {
	// ignore  <-- SILENTLY SWALLOWS ERRORS!
}
```

**Impact:** If backend returns non-JSON error (common for CORS failures or 401), the actual error is lost.

---

### Issue 8: MEDIUM - Missing `active` Filter in List Queries

**Files:**

- `/Users/suyashthakur/html-to-gif/routes/data-sources.js` (line 126)
- `/Users/suyashthakur/html-to-gif/routes/bindings.js` (line 311)

```javascript
const dataSources = await DataSource.find(query); // NO active filter
const total = await DataSource.countDocuments({ ...query, active: true }); // HAS active filter
```

**Impact:** Soft-deleted items appear in list results but aren't counted accurately. Pagination is broken.

---

## Proposed Solution

### Phase 1: Critical Fixes (Backend)

#### Step 1.1: Fix binding.userId → binding.createdBy

**File:** `/Users/suyashthakur/html-to-gif/service/binding-renderer.js`

Replace all 8 occurrences:

- Line 127: `userId: binding.createdBy,`
- Line 179: `await hasActiveStorageConnector(binding.createdBy)`
- Line 182: `userId: binding.createdBy,`
- Line 227: `userId: binding.createdBy,`
- Line 252: `userId: binding.createdBy,`
- Line 262: `logBindingRender(binding.createdBy, {`
- Line 280: `userId: binding.createdBy,`
- Line 291: `logBindingRender(binding.createdBy, {`

#### Step 1.2: Fix Authentication Logic Error

**File:** `/Users/suyashthakur/html-to-gif/plugins/decorate_user.js`
**Line 27:**

```javascript
// Before (BROKEN)
if (!authTokens && !authTokens['auth-token']) {

// After (FIXED)
if (!authTokens || !authTokens['auth-token']) {
```

#### Step 1.3: Add Missing Environment Variable

```bash
cd /Users/suyashthakur/html-to-gif
echo "CREDENTIAL_ENCRYPTION_KEY=$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")" >> .env
```

#### Step 1.4: Fix createdBy Type Consistency

**File:** `/Users/suyashthakur/html-to-gif/routes/bindings.js`
**Line 264:**

```javascript
// Before
createdBy: user._id,

// After
createdBy: user._id.toString(),
```

### Phase 2: Critical Fixes (Frontend)

#### Step 2.1: Fix Credentials Detection

**File:** `/Users/suyashthakur/front-end-html-to-gif/src/service/backend.js`

```javascript
// Before (Line 3)
const isCredentialsSupported = 'credentials' in Request.prototype;

// After - Always include credentials for same-site requests
// Remove the check entirely and always use 'include'
```

For all HTTP methods (get, post, put, delete, patch), change:

```javascript
credentials: isCredentialsSupported ? 'include' : undefined,
// To:
credentials: 'include',
```

#### Step 2.2: Use Promise.allSettled for Graceful Degradation

**File:** `/Users/suyashthakur/front-end-html-to-gif/src/routes/dashboard/template/[uid]/dynamic/+page.svelte`
**Lines 99-150:**

```javascript
const loadData = async () => {
	const thisLoad = ++loadVersion;
	isLoading = true;

	try {
		const [templateRes, variablesRes, bindingsRes, dataSourcesRes] = await Promise.allSettled([
			getTemplateById(uid),
			getTemplateVariables(uid),
			getBindingsForTemplate(uid),
			getDataSources()
		]);

		if (!mounted || thisLoad !== loadVersion) return;

		// Template is required
		if (templateRes.status === 'rejected' || !templateRes.value?.template) {
			toast.set({ message: 'Template not found', type: 'error', duration: 3000 });
			goto('/dashboard/template');
			return;
		}

		template = templateRes.value.template;
		variables = variablesRes.status === 'fulfilled' ? variablesRes.value?.variables || [] : [];
		existingBindings = bindingsRes.status === 'fulfilled' ? bindingsRes.value?.bindings || [] : [];
		dataSources =
			dataSourcesRes.status === 'fulfilled' ? dataSourcesRes.value?.dataSources || [] : [];

		// Warn about partial failures
		if (dataSourcesRes.status === 'rejected') {
			console.error('Failed to load data sources:', dataSourcesRes.reason);
		}

		// ... rest of initialization
	} catch (error) {
		if (!mounted || thisLoad !== loadVersion) return;
		console.error('Error loading data:', error);
		toast.set({ message: 'Failed to load data', type: 'error', duration: 3000 });
	} finally {
		if (mounted && thisLoad === loadVersion) {
			isLoading = false;
		}
	}
};
```

### Phase 3: Fixes for Better Error Handling

#### Step 3.1: Fix Silent Error Swallowing

**File:** `/Users/suyashthakur/front-end-html-to-gif/src/service/backend.js`

Add better error logging in catch blocks:

```javascript
} catch (e) {
  console.error('Failed to parse error response:', e);
  // Keep original statusText as fallback
}
```

#### Step 3.2: Add Missing `active` Filter

**File:** `/Users/suyashthakur/html-to-gif/routes/data-sources.js`
**Line 126:**

```javascript
// Before
const dataSources = await DataSource.find(query);

// After
const dataSources = await DataSource.find({ ...query, active: true });
```

Same for `/Users/suyashthakur/html-to-gif/routes/bindings.js` line 311.

---

## Technical Considerations

### Architecture

```
Frontend (SvelteKit @ localhost:5173)
    |
    v (credentials: 'include' for cookies)
Backend (Fastify @ localhost:3000)
    |
    +-- MongoDB (localhost:27017) - Stores bindings, data sources, templates
    +-- Redis (localhost:6379) - Caching, queues
    +-- Browser Pool (Puppeteer) - Renders images
```

### Key Files

| Component                   | File Path                                                  | Issues Found                   |
| --------------------------- | ---------------------------------------------------------- | ------------------------------ |
| Frontend Dynamic Page       | `src/routes/dashboard/template/[uid]/dynamic/+page.svelte` | Promise.all issue              |
| Frontend API Client         | `src/api/binding.js`                                       | No issues                      |
| Frontend Backend Service    | `src/service/backend.js`                                   | Credentials bug, silent errors |
| Backend Bindings Routes     | `/html-to-gif/routes/bindings.js`                          | createdBy type, active filter  |
| Backend Data Sources Routes | `/html-to-gif/routes/data-sources.js`                      | createdBy type, active filter  |
| Backend Auth Plugin         | `/html-to-gif/plugins/decorate_user.js`                    | Logic error line 27            |
| Backend Binding Renderer    | `/html-to-gif/service/binding-renderer.js`                 | userId → createdBy (8 places)  |
| Backend Encryption Service  | `/html-to-gif/service/encryption-service.js`               | Missing env var                |

### Authentication Flow

The Dynamic Link endpoints require cookie-based authentication:

1. User must be logged in via Google OAuth
2. Session cookie must be present
3. Frontend must send `credentials: 'include'` with requests
4. Both `decorateUser` and `teamContext` plugins are registered for these routes

---

## Acceptance Criteria

### Must Fix (Critical)

- [x] Replace `binding.userId` with `binding.createdBy` in binding-renderer.js (8 places)
- [x] Fix `&&` to `||` in decorate_user.js line 27
- [x] Add `CREDENTIAL_ENCRYPTION_KEY` to backend `.env`
- [x] Always use `credentials: 'include'` in frontend backend.js

### Should Fix (High Priority)

- [x] Use `user._id.toString()` consistently in bindings.js
- [x] Use `Promise.allSettled` in dynamic page loadData
- [x] Add `active: true` filter to list queries

### Nice to Have (Medium Priority)

- [ ] Add better error logging instead of silent catch
- [ ] Add request timeout to frontend fetch calls
- [ ] Parallelize sequential DB queries in list endpoints

---

## MVP Implementation

### Quick Start Fix Script

```bash
# 1. Fix backend issues
cd /Users/suyashthakur/html-to-gif

# Add encryption key
echo "CREDENTIAL_ENCRYPTION_KEY=$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")" >> .env

# 2. Start dependencies (if not running)
# MongoDB
mongosh --eval "db.version()" || brew services start mongodb-community

# Redis
redis-cli ping || brew services start redis

# 3. Start backend
node server.js

# 4. In separate terminal, start frontend
cd /Users/suyashthakur/front-end-html-to-gif
npm run dev
```

### Manual Code Fixes Required

After starting services, the following code fixes are required for the feature to work:

1. **decorate_user.js line 27:** Change `&&` to `||`
2. **binding-renderer.js:** Replace all 8 `binding.userId` with `binding.createdBy`
3. **backend.js:** Change credentials to always use `'include'`

---

## Security Considerations

### Research Insights from Security Sentinel

**Well Implemented:**

- SSRF protection with comprehensive IP range blocking
- AES-256-GCM encryption for credentials
- Proper toJSON transforms to hide sensitive data
- Webhook signature validation with timing-safe comparison

**Recommendations:**

- Add URL format validation in JSON schemas
- Implement key rotation mechanism for encryption
- Add rate limiting to `/data-sources/test` endpoint

---

## Performance Considerations

### Research Insights from Performance Oracle

**Issues Found:**

- DNS resolution blocks sequentially (both IPv4 and IPv6)
- No timeout on frontend fetch calls
- Sequential DB queries in list endpoints
- Browser pool initialization blocks server startup

**Recommendations:**

- Use Promise.allSettled for DNS resolution with timeout
- Add AbortController with timeout to frontend fetch
- Parallelize count and find queries
- Make browser pool initialization non-blocking

---

## References

- Backend CLAUDE.md: `/Users/suyashthakur/html-to-gif/CLAUDE.md`
- Frontend env config: `/Users/suyashthakur/front-end-html-to-gif/.env.local`
- Backend env config: `/Users/suyashthakur/html-to-gif/.env`
- Binding Model: `/Users/suyashthakur/html-to-gif/models/Binding.js`
- Auth Plugin: `/Users/suyashthakur/html-to-gif/plugins/decorate_user.js`
