# Deployment Checklist: Storage Connector Feature

**Feature:** Storage Connector System (Automation Integration Layer)
**Date Created:** 2026-01-19
**Status:** NOT READY FOR PRODUCTION

---

## Executive Summary

This checklist covers the deployment of the storage connector feature which enables users to configure cloud storage destinations (S3, GCS, Cloudinary, ImageKit) and receive webhook notifications for render events. The feature includes encryption, SSRF protection, and circuit breaker patterns.

### Current Production Readiness

| Component                           | Status          | Blocker Level       |
| ----------------------------------- | --------------- | ------------------- |
| ConnectorConfig CRUD                | COMPLETE        | -                   |
| WebhookSubscription CRUD            | COMPLETE        | -                   |
| Credential Encryption (AES-256-GCM) | COMPLETE        | -                   |
| SSRF Protection                     | COMPLETE        | -                   |
| Webhook Delivery (BullMQ)           | COMPLETE        | -                   |
| Circuit Breaker                     | PARTIAL         | P2 (in-memory only) |
| Storage Upload Integration          | NOT IMPLEMENTED | P0 BLOCKER          |
| Event Emission (all codepaths)      | PARTIAL         | P0 BLOCKER          |
| Test Coverage                       | MINIMAL         | P1                  |
| Rate Limiting                       | NOT IMPLEMENTED | P2                  |

---

## P0 PRODUCTION BLOCKERS - Must Fix Before Deploy

### 1. Storage Upload Integration - NOT IMPLEMENTED

**Current State:** ConnectorConfigs can be created and tested, but NO CODE actually uploads rendered images to user-configured storage. The `binding-renderer.js` uploads to Pictify's S3 bucket only.

**Required Files to Implement:**

- `/Users/suyashthakur/html-to-gif/connectors/drivers/storage/S3Adapter.js`
- `/Users/suyashthakur/html-to-gif/connectors/drivers/storage/GCSAdapter.js`
- `/Users/suyashthakur/html-to-gif/connectors/drivers/storage/CloudinaryAdapter.js`
- `/Users/suyashthakur/html-to-gif/connectors/drivers/storage/ImageKitAdapter.js`
- `/Users/suyashthakur/html-to-gif/connectors/universal/actions/uploadAsset.js`

**Acceptance Criteria:**

- [ ] `UploadAsset` action implemented in Universal Core
- [ ] All 4 storage adapters implemented and tested
- [ ] Integration with render pipeline to optionally upload to user storage
- [ ] End-to-end test: render -> upload to user S3 -> verify file exists

### 2. Event Emission - INCOMPLETE

**Current State:** `render.completed` and `render.failed` events are ONLY emitted from:

- `/Users/suyashthakur/html-to-gif/service/binding-renderer.js` (binding.updated, binding.failed)

Events are NOT emitted from:

- Dashboard render endpoints (direct API)
- Template render routes (non-binding renders)
- Universal Core actions (these do emit but bypass main render routes)

**Required Changes:**

- Add `emitEvent('render.completed', payload)` to main render routes
- Add `emitEvent('render.failed', payload)` on render failures
- Include templateId, renderId, and output URL in payload

**Files to Modify:**

- `/Users/suyashthakur/html-to-gif/routes/media.js` (or equivalent render route)
- `/Users/suyashthakur/html-to-gif/service/template-renderer.js`

**Acceptance Criteria:**

- [ ] Events emit for dashboard renders
- [ ] Events emit for API renders
- [ ] Events emit for binding renders (already working)
- [ ] Events emit for Universal Core action renders

---

## Pre-Deployment Checklist

### 1. Environment Variables Required

```bash
# REQUIRED - Encryption key for connector credentials
CREDENTIAL_ENCRYPTION_KEY=<64-character-hex-string>
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# REQUIRED - Redis connection for BullMQ webhook queue
REDIS_URL=redis://localhost:6379

# OPTIONAL - Webhook configuration
WEBHOOK_SIGNING_SECRET=<fallback-secret-if-per-subscription-not-set>
WEBHOOK_MAX_RETRIES=10
WEBHOOK_TIMEOUT_MS=10000
```

**Pre-Deploy Verification:**

```bash
# Verify encryption key is set and correct length
echo $CREDENTIAL_ENCRYPTION_KEY | wc -c
# Expected: 65 (64 chars + newline)

# Verify Redis is accessible
redis-cli -u $REDIS_URL ping
# Expected: PONG
```

### 2. Database Indexes Required

The following indexes should be created by Mongoose on first model load, but verify they exist:

**ConnectorConfig Collection:**

```javascript
// Run in MongoDB shell
db.connectorconfigs.getIndexes();

// Expected indexes:
// - uid_1 (unique)
// - createdBy_1 (standard)
// - type_1 (standard)
// - createdBy_1_active_1 (compound)
// - createdBy_1_type_1_active_1 (compound)
```

**WebhookSubscription Collection:**

```javascript
// Run in MongoDB shell
db.webhooksubscriptions.getIndexes();

// Expected indexes:
// - uid_1 (unique)
// - createdBy_1 (standard)
// - event_1 (standard)
// - platform_1 (standard)
// - filters.templateId_1 (standard)
// - filters.bindingId_1 (standard)
// - event_1_status_1_active_1 (compound)
// - createdBy_1_active_1 (compound)
// - filters.templateId_1_event_1_status_1_active_1 (compound)
// - filters.bindingId_1_event_1_status_1_active_1 (compound)
```

### 3. Dependencies Verification

Verify all required packages are installed:

```bash
cd /Users/suyashthakur/html-to-gif
npm ls @aws-sdk/client-s3 @google-cloud/storage cloudinary imagekit bullmq ioredis zod
```

**Expected packages in package.json:**

```json
{
	"@aws-sdk/client-s3": "^3.500.0",
	"@aws-sdk/s3-request-presigner": "^3.500.0",
	"@google-cloud/storage": "^7.7.0",
	"cloudinary": "^2.0.0",
	"imagekit": "^5.0.0",
	"bullmq": "^4.0.0",
	"ioredis": "^5.0.0",
	"zod": "^3.22.0"
}
```

---

## MongoDB Verification Queries

### Pre-Deploy Baseline Queries

Run these queries BEFORE deployment and save the results:

```javascript
// 1. Count existing documents (should be 0 for new collections)
db.connectorconfigs.countDocuments();
db.webhooksubscriptions.countDocuments();

// 2. Check for any orphaned data
db.connectorconfigs.countDocuments({ createdBy: { $exists: false } });
db.webhooksubscriptions.countDocuments({ createdBy: { $exists: false } });
// Expected: 0

// 3. Verify soft delete works (no deleted records visible)
db.connectorconfigs.countDocuments({ active: false });
db.webhooksubscriptions.countDocuments({ active: false });
// Expected: 0 (or matches known deleted count)
```

### Post-Deploy Verification Queries

Run within 5 minutes of deployment:

```javascript
// 1. Verify indexes created
db.connectorconfigs.getIndexes().length;
// Expected: >= 5

db.webhooksubscriptions.getIndexes().length;
// Expected: >= 9

// 2. Test connector creation works (create test, then delete)
// This should be done via API, not direct DB insert

// 3. Check for encryption issues (encrypted field format)
db.connectorconfigs.findOne({}, { encryptedCredentials: 1 });
// Expected: encryptedCredentials matches format: "hex:hex:hex" (iv:authTag:ciphertext)

// 4. Verify webhook subscription secrets are generated
db.webhooksubscriptions.countDocuments({ secret: { $exists: false } });
// Expected: 0

db.webhooksubscriptions.countDocuments({ secret: null });
// Expected: 0
```

---

## Migration/Deployment Steps

### Step-by-Step Deployment

| Step | Command/Action               | Estimated Time | Rollback          |
| ---- | ---------------------------- | -------------- | ----------------- |
| 1    | Set environment variables    | 5 min          | Remove vars       |
| 2    | Deploy backend code          | 10 min         | `git revert HEAD` |
| 3    | Start webhook worker         | 1 min          | Stop worker       |
| 4    | Run index verification       | 2 min          | N/A (read-only)   |
| 5    | Deploy frontend code         | 10 min         | `git revert HEAD` |
| 6    | Enable feature flag (if any) | 1 min          | Disable flag      |

### Deployment Commands

```bash
# 1. Backend deployment
cd /Users/suyashthakur/html-to-gif
git pull origin main
npm install
npm run build  # if applicable

# 2. Start webhook worker (separate process or integrated)
# Worker is started via webhook-delivery.js startWorker()
# Verify in application startup code

# 3. Verify deployment
curl -X GET https://api.pictify.io/health
# Expected: {"status":"ok"}

# 4. Verify new endpoints exist
curl -X GET https://api.pictify.io/connector-configs/requirements/s3 \
  -H "Authorization: Bearer $TEST_API_KEY"
# Expected: {"type":"s3","credentials":{...},"configOptions":{...}}
```

---

## Post-Deploy Verification (Within 5 Minutes)

### API Endpoint Tests

```bash
# 1. Test connector config endpoints
curl -X GET https://api.pictify.io/connector-configs \
  -H "Authorization: Bearer $API_KEY"
# Expected: {"connectors":[],"pagination":{...}}

# 2. Test webhook subscription endpoints
curl -X GET https://api.pictify.io/webhook-subscriptions \
  -H "Authorization: Bearer $API_KEY"
# Expected: {"subscriptions":[]}

# 3. Test credential requirements endpoint (no auth needed)
curl -X GET https://api.pictify.io/connector-configs/requirements/s3
# Expected: {"type":"s3","credentials":{...}}

# 4. Test SSRF protection (should reject localhost)
curl -X POST https://api.pictify.io/webhook-subscriptions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event":"render.completed","targetUrl":"http://localhost:8080/webhook"}'
# Expected: 400 error with SSRF message
```

### Queue Health Check

```bash
# Check Redis queue status
redis-cli -u $REDIS_URL
> LLEN bull:webhook-delivery:wait
# Expected: 0 (empty initially)

> LLEN bull:webhook-delivery-dlq:wait
# Expected: 0 (no dead letters)
```

### Console Verification (Run 1 hour after deploy)

```javascript
// In Node.js REPL connected to production
const { getQueueStats } = require('./service/webhook-delivery');
const stats = await getQueueStats();
console.log(stats);
// Expected: { waiting: 0, active: 0, completed: >=0, failed: 0, delayed: 0, deadLetter: 0 }

// Test encryption service
const { encrypt, decrypt } = require('./service/encryption-service');
const test = encrypt('test-credential');
console.log(decrypt(test) === 'test-credential');
// Expected: true

// Test SSRF protection
const { validateUrl } = require('./service/ssrf-protection');
const result = await validateUrl('https://example.com');
console.log(result.valid);
// Expected: true

const blocked = await validateUrl('http://169.254.169.254/latest/meta-data/');
console.log(blocked.valid);
// Expected: false
```

---

## Rollback Plan

### Can We Roll Back?

| Scenario                            | Rollback Possible | Data Impact                           |
| ----------------------------------- | ----------------- | ------------------------------------- |
| Code deployment only                | YES               | None                                  |
| After connector configs created     | YES               | Connectors orphaned but harmless      |
| After webhook subscriptions created | YES               | Subscriptions orphaned but harmless   |
| After webhooks delivered            | PARTIAL           | Delivered webhooks cannot be recalled |

### Rollback Steps

1. **Disable Feature Flag** (if applicable)

   ```bash
   # Set environment variable or config
   FEATURE_CONNECTORS_ENABLED=false
   ```

2. **Deploy Previous Commit**

   ```bash
   cd /Users/suyashthakur/html-to-gif
   git revert HEAD
   # or
   git checkout <previous-commit-sha>
   npm install
   npm run build
   # Restart service
   ```

3. **Stop Webhook Worker**

   ```javascript
   const { stopWorker } = require('./service/webhook-delivery');
   await stopWorker();
   ```

4. **Data Cleanup (if needed)**

   ```javascript
   // Soft-delete all connector configs (preserves data for debugging)
   db.connectorconfigs.updateMany({}, { $set: { active: false, deletedAt: new Date() } });

   // Soft-delete all webhook subscriptions
   db.webhooksubscriptions.updateMany({}, { $set: { active: false, deletedAt: new Date() } });
   ```

5. **Verify Rollback**
   ```bash
   curl -X GET https://api.pictify.io/connector-configs
   # Expected: 404 (endpoint not found) or 503 (feature disabled)
   ```

---

## Monitoring and Alerting

### Metrics to Monitor (First 24 Hours)

| Metric                      | Alert Condition  | Dashboard             |
| --------------------------- | ---------------- | --------------------- |
| Webhook delivery error rate | > 5% for 5 min   | /dashboard/webhooks   |
| Queue depth (waiting)       | > 100 for 10 min | /dashboard/queues     |
| Dead letter queue count     | > 0              | /dashboard/queues     |
| Connector test failures     | > 20% for 5 min  | /dashboard/connectors |
| Encryption errors           | > 0              | /dashboard/errors     |
| SSRF blocked requests       | Log only         | /dashboard/security   |

### Log Patterns to Watch

```bash
# Webhook delivery failures
grep "Webhook delivery failed" /var/log/app.log | tail -20

# Encryption errors
grep "CREDENTIAL_ENCRYPTION_KEY" /var/log/app.log

# SSRF blocks (expected for security)
grep "SSRF protection" /var/log/app.log

# Circuit breaker opens
grep "Circuit breaker open" /var/log/app.log
```

### Monitoring Checkpoints

| Time      | Actions                                      |
| --------- | -------------------------------------------- |
| +15 min   | Check error rates, verify queue processing   |
| +1 hour   | Run console verification queries             |
| +4 hours  | Review webhook delivery success rate         |
| +24 hours | Full metrics review, close deployment ticket |

---

## Go/No-Go Criteria

### HARD NO-GO (Must be fixed before any production deployment)

- [ ] **P0:** Storage upload integration implemented
- [ ] **P0:** Event emission from all render codepaths
- [ ] CREDENTIAL_ENCRYPTION_KEY environment variable set
- [ ] REDIS_URL environment variable set and accessible
- [ ] All database indexes created
- [ ] Encryption service verified working
- [ ] SSRF protection verified working

### RECOMMENDED (Should be fixed, can deploy with risk acceptance)

- [ ] **P1:** Test coverage > 80% for connector/webhook routes
- [ ] **P2:** Circuit breaker state persisted to Redis
- [ ] **P2:** Rate limiting implemented for connector endpoints
- [ ] All 4 storage providers tested with real credentials
- [ ] Webhook delivery tested end-to-end

### Nice to Have (Can deploy without)

- [ ] OAuth2 routes implemented
- [ ] Additional platform drivers (Make, n8n, Pipedream)
- [ ] Webhook secret regeneration endpoint

---

## Security Checklist

| Item                                        | Status | Notes                                                           |
| ------------------------------------------- | ------ | --------------------------------------------------------------- |
| Credentials encrypted at rest (AES-256-GCM) | PASS   | `/Users/suyashthakur/html-to-gif/service/encryption-service.js` |
| SSRF protection for webhook URLs            | PASS   | `/Users/suyashthakur/html-to-gif/service/ssrf-protection.js`    |
| HMAC-SHA256 signed webhook payloads         | PASS   | `/Users/suyashthakur/html-to-gif/service/webhook-delivery.js`   |
| Timing-safe signature comparison            | PASS   | Uses `crypto.timingSafeEqual` with length padding               |
| Soft delete support                         | PASS   | Active flag filtering in models                                 |
| No hardcoded secrets                        | PASS   | Environment variables used                                      |
| Credentials never logged                    | VERIFY | Check log statements                                            |
| Credentials never in API response           | PASS   | Transform in toJSON removes encryptedCredentials                |

---

## Final Go/No-Go Decision

### Current Status: NO-GO

**Blocking Issues:**

1. Storage upload integration not implemented (P0)
2. Event emission incomplete (P0)

**Recommendation:** Do not deploy to production until P0 blockers are resolved.

### After P0 Resolution: CONDITIONAL GO

Once P0 blockers are fixed, deployment can proceed with:

- Risk acceptance for P1/P2 items
- Enhanced monitoring during first 24 hours
- On-call engineer available for rollback

---

## References

- Assessment Document: `/Users/suyashthakur/front-end-html-to-gif/plans/assessment-storage-connector-production-readiness.md`
- Feature Plan: `/Users/suyashthakur/front-end-html-to-gif/plans/feat-automation-connectors-universal-layer.md`
- Backend Repo: `/Users/suyashthakur/html-to-gif`
- Frontend Repo: `/Users/suyashthakur/front-end-html-to-gif`

### Key Implementation Files

| Component                  | File Path                                                       |
| -------------------------- | --------------------------------------------------------------- |
| Connector Config Model     | `/Users/suyashthakur/html-to-gif/models/ConnectorConfig.js`     |
| Webhook Subscription Model | `/Users/suyashthakur/html-to-gif/models/WebhookSubscription.js` |
| Connector Config Routes    | `/Users/suyashthakur/html-to-gif/routes/connector-configs.js`   |
| Webhook Delivery Service   | `/Users/suyashthakur/html-to-gif/service/webhook-delivery.js`   |
| Encryption Service         | `/Users/suyashthakur/html-to-gif/service/encryption-service.js` |
| SSRF Protection            | `/Users/suyashthakur/html-to-gif/service/ssrf-protection.js`    |
| Binding Renderer           | `/Users/suyashthakur/html-to-gif/service/binding-renderer.js`   |
| Universal Core             | `/Users/suyashthakur/html-to-gif/connectors/universal/index.js` |
