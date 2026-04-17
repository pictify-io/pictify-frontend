---
title: "feat: Add tweet screenshot free tool page"
type: feat
status: active
date: 2026-04-14
deepened: 2026-04-14
origin: "conversational CEO-mode plan review (2026-04-14 session)"
---

# feat: Add tweet screenshot free tool page

## Overview

Add a dedicated interactive tweet-screenshot generator at `/tools/tweet-screenshot` targeting the Twitter/tweet-screenshot keyword cluster (~2,000 SV/mo combined, head term "twitter screenshot" at 720 SV / KD 5, orshot.com ranks #20). The tool lets a visitor paste a tweet URL, auto-populates editable fields via Twitter's undocumented public syndication endpoint (`cdn.syndication.twimg.com/tweet-result`), and renders a live canvas preview. Download via the existing public render pipeline. API snippet panel on the page calls a new seeded system template `tweet_v1` through `POST /template/:uid/render` — the conversion hook that shows developer visitors the programmatic path in-context.

This is Wave 1 of the Orshot competitive plan (`project_orshot_competitive.md`). It establishes two reusable patterns: (a) **tool-page-as-API-demo** (system template + visible API snippet + signup CTA) and (b) **canary-for-undocumented-upstream** (hourly health check on a non-contractual external service).

**Target repos:**
- Frontend: `front-end-html-to-gif` (SvelteKit)
- Backend: `html-to-gif` (Fastify, Node 22, MongoDB)

## Problem Frame

The "twitter screenshot" keyword cluster (head term 720 SV / KD 5) is a low-difficulty gap where orshot.com sits at rank #20 on a 22-keyword cluster, and Pictify ranks nowhere. From the Orshot gap analysis: ~2,000 SV/mo total across 9 variants, all KD ≤20. This plan captures that cluster while converting dev-ICP visitors via an in-page programmatic demo.

The deeper product problem: every Pictify tool page so far has been a copy-paste scaffold without a first-class "here's the API call that produced what you just saw" hook. This plan makes the API snippet a real, runnable `POST /template/:uid/render` call — closing the loop between "free consumer tool" and "programmable engine for developers."

## Requirements Trace

- **R1.** Dedicated route at `/tools/tweet-screenshot` with keyword-optimized SEO (title, meta, OG, FAQ + breadcrumb schema).
- **R2.** URL input + "Fetch tweet" action that calls the backend `/tools/tweet-screenshot/fetch` endpoint and prefills editable fields.
- **R3.** Editable fields for every tweet surface (avatar URL, display name, handle, verified badge, body text, date, likes, retweets, replies, media URLs up to 4).
- **R4.** Live canvas preview (FabricJS) that updates within 150ms of any edit (debounced).
- **R5.** API snippet panel showing a real `curl -X POST https://api.pictify.io/template/tweet_v1/render` with the user's current edited variables (NOT the initial props — guards the 0fe1c32 regression class).
- **R6.** Download button that produces PNG via existing public render pipeline; anon + over-quota users hit the signup CTA modal.
- **R7.** Anonymous `/tools/tweet-screenshot/fetch` endpoint with SSRF-safe URL parsing (ID-only), abuse-monitor integration, 30 req/5min per-IP rate limit.
- **R8.** Twitter syndication client in `service/twitter-syndication.js` with strict response-shape validation and named error classes per failure mode (rate-limit, not-found, upstream, parse, schema).
- **R9.** Hourly canary job (`service/tweet-canary.js`) that runs the full `fetchTweet` pipeline against tweet id `20` (Jack's permanent first tweet) — detects both availability and schema drift.
- **R10.** Seed a system Template document `tweet_v1` with the tweet layout and variable schema; accessible via `public-render` for anonymous Download and for the API snippet's `curl` example.
- **R11.** Feature flag `tools.tweet_screenshot.enabled` + env kill-switch `TWEET_SYNDICATION_ENABLED` for independent rollback of the page and the external dependency.
- **R12.** Inline overwrite-confirm when the user clicks Fetch while any field has been edited (no silent data loss).
- **R13.** Entity-driven tokenizer for tweet body rendering — splices structured entities from syndication's `entities` object, auto-escaped per token. No regex on user input.
- **R14.** PostHog events for page views, fetch clicks, download clicks, signup conversions, with `source=tweet_screenshot`.
- **R15.** Runbook `docs/runbooks/tweet-syndication.md` committed in this PR.

## Scope Boundaries

- No `/tools/twitter-carousel-generator` in this PR (Wave 1 follow-up; shares 80% of the scaffold).
- No shared `<ToolScaffold/>` / `<ApiSnippet/>` / `<SignupCta/>` component extraction in this PR (TODO item — do before 4th tool).
- No migration path to oEmbed or Twitter API v2 as a fallback — skip entirely per user decision; revisit reactively if the canary fires.
- No Slack alerts — canary is log-only.
- No failure caching on `/fetch` — per user decision (low traffic).
- No media attachments beyond still images (video, GIFs in tweets, polls) — still images cover the dominant intent.
- No quote-tweet rendering (nested tweet inside a tweet).
- No theme variants (light/dark Twitter) — ship default theme.
- No avatar upload from disk — URL input + manual entry only.
- No "fetch latest N tweets from a handle" bulk mode — different keywords, different tool.

### Deferred to Separate Tasks

- Extract `<ToolScaffold/>` / `<ApiSnippet/>` / `<SignupCta/>` shared components: TODO before `/tools/twitter-carousel-generator` ships.
- Remove `tools.tweet_screenshot.enabled` flag 2 weeks post-100%-rollout if no rollback occurred: TODO with trigger condition.

## Context & Research

### Relevant Code and Patterns

**Frontend (SvelteKit):**
- **Primary pattern:** `src/routes/tools/certificate-generator/+page.svelte` (933 LOC, post-0fe1c32 fix) — interactive canvas editor, live preview, API snippet panel with edited-data-correctness, debounced renders, subscription cleanup.
- **SEO pattern:** `src/routes/tools/online-invoice-generator/+page.svelte` — WebApplication + FAQPage schema, meta tags, OG tags, canonical URL, breadcrumbs.
- **Anon-render call:** `backend.post('/image/public/canvas', …)` direct pattern (no wrapper API function).
- **Signup CTA:** commit `0712794` shipped `GenerationLimitBanner` (prop `toolName`) + feature-flag evaluator.
- **Tool layout conventions:** Neo-brutalist — `border-[3px] border-gray-900`, `shadow-[4px_4px_0_0_#...]`, accent `#ffc480`, font `Manrope`.

**Backend (Fastify):**
- **Route structure:** `routes/tools/` directory already exists; mirror existing `routes/tools/*.js` filenames.
- **Public/anonymous render:** `routes/public-render.js` + `routes/public-templates.js` — Download hits these.
- **Abuse monitoring:** `service/abuse-monitor.js` — register new endpoint with standard per-IP rate limit.
- **Scheduler:** hourly jobs run via existing scheduler infra (experiments and certificate-gen both use it).
- **Request context middleware:** `service/request-context.js` — provides `request_id` for correlation across logs.
- **Redis client:** already available in backend for cache; new code depends on it but tolerates Redis-down.
- **Template model:** `models/Template.js` — supports typed variables (text/image/color/number/boolean) and expression engine via `service/template-expression-engine.js` (tokenizer + evaluator with `currency`, `uppercase`, `lowercase`, `capitalize`, `length`, `isEmpty`, conditionals).
- **Template render:** `routes/template-render.js` + `service/template-renderer.js` — used by the API snippet's `curl` example and the Download button.

### Institutional Learnings

- `0fe1c32` commit (2026-04-13) fixed three bug classes in the tool-page pattern: (a) batch canvas renders to avoid re-render per keystroke, (b) subscription leak on component unmount, (c) API snippet must derive from the same reactive state that drives the canvas — never from props. **This plan must not reintroduce any of the three.**
- `0712794` introduced the feature-flag + signup-CTA pattern. Reuse directly.
- `f43096b` wired PostHog experiments — available for CTA variant testing in this tool.
- Public syndication endpoint `cdn.syndication.twimg.com/tweet-result?id=<id>&token=a` is undocumented but stable since ~2020. Dummy token `a` accepted. Returns full data: user (name, screen_name, profile_image_url_https, is_blue_verified, verified), text, entities (urls, user_mentions, hashtags with indices), mediaDetails, favorite_count, conversation_count, created_at.

### External References

- Twitter publish oEmbed (`publish.twitter.com/oembed`) — documented but data-thin (no avatar, metrics, verified); confirmed 200 in pre-research; rejected in favor of syndication.
- Twitter API v2 — documented, requires $100/mo Basic tier — rejected.

## Key Technical Decisions

- **Decision: Use `cdn.syndication.twimg.com/tweet-result` as the upstream.** Rationale: full data (avatar, verified, metrics, media), no auth, no cost, proven-stable for 4+ years. Trade-off: undocumented — mitigated by (a) strict shape validation + named error classes, (b) hourly full-pipeline canary, (c) env kill-switch + graceful degrade to manual-entry mode.
- **Decision: Log-only canary, no Slack alerts.** Rationale: user call. Canary writes `level=error event=canary_fail_persistent` after 3 consecutive fails; dashboard panel surfaces it.
- **Decision: No failure cache on `/fetch`.** Rationale: user call — traffic is low and simplicity wins.
- **Decision: Entity-driven tokenizer, not regex.** Use the `entities.urls/user_mentions/hashtags` objects from syndication response (already has token type, text, indices). Splice structured tokens into the body render. Auto-escape per token via Svelte's `{text}` interpolation (never `{@html}`). Closes XSS by construction.
- **Decision: Inline overwrite-confirm, not modal.** When Fetch is clicked while any field has been user-edited, show a small inline warning next to Fetch with "Refetch / Cancel" — lightweight, no overlay.
- **Decision: Copy-paste `parseTweetId` across frontend + backend.** 15-line function; backend re-validates independently (security); shared comment `// KEEP IN SYNC WITH: …` points to the sibling file.
- **Decision: 5 snapshot fixtures for `normalizeTweet`.** Commit real-world JSON (minimal tweet, tweet-with-media, retweet, long-text, emoji-only) and snapshot the normalized output. Catches both our normalizer drift and Twitter adding fields.
- **Decision: Canary calls the full `fetchTweet` pipeline.** Not a raw HTTP probe — uses the same normalizer + schema validator users do. Detects 200-but-broken responses.
- **Decision: System Template `tweet_v1` for the API snippet.** Public template accessible via `/template/tweet_v1/render`. Snippet on the page is a real curl command that produces the same image the canvas shows. Versioned path gives us room for `tweet_v2` later without breaking users' saved snippets.
- **Decision: Two independent rollback knobs — `tools.tweet_screenshot.enabled` (page) and `TWEET_SYNDICATION_ENABLED` (dependency).** Page bug → flag off page. Twitter kills endpoint → flag off syndication, keep page useful in manual mode.

## Open Questions

### Resolved During Planning

- Q: Use oEmbed (documented-thin), syndication (undocumented-full), or API v2 (paid)? → **Syndication.**
- Q: Canary alert mechanism — Slack or logs? → **Log-only + dashboard panel.**
- Q: Cache 404/5xx from syndication? → **No.**
- Q: Tokenizer approach (plain text / regex / entity-driven)? → **Entity-driven.**
- Q: Overwrite confirmation (modal / inline / silent)? → **Inline.**
- Q: `parseTweetId` shared package or copy-paste? → **Copy + comment.**
- Q: How many snapshot fixtures? → **5 (minimal, media, retweet, long, emoji).**
- Q: Canary scope (HTTP-only or full pipeline)? → **Full pipeline.**
- Q: Download via system template or ad-hoc HTML? → **System template `tweet_v1`.**
- Q: Build runbook in-PR, defer, or skip? → **In-PR.**
- Q: Pre-build migration path to oEmbed/API v2? → **Skip; react if canary fires.**

### Deferred to Implementation

- Exact Fabric.js object shapes for the tweet card (avatar circle, verified SVG, metrics row) — determined during implementation against the design reference.
- Exact CSS/visual dimensions vs. native Twitter — tune during implementation; target "recognizable as a tweet" not pixel-perfect.
- Specific log field schema (structured logging library format) — match whatever the backend already uses (inferred from existing routes during implementation).
- Exact PostHog event property names beyond `source=tweet_screenshot` — follow whatever convention certificate-generator uses.
- Rate-limit key shape for abuse-monitor integration — match existing endpoint conventions.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### System topology

```
 ┌───────────────────────────────────────────────────────────────────┐
 │  SvelteKit page  /tools/tweet-screenshot                          │
 │  ├── URL input + "Fetch" button                                   │
 │  ├── editable fields panel (avatar, name, body, metrics, …)       │
 │  ├── FabricJS canvas (live preview, 150ms debounced)              │
 │  ├── API snippet panel (curl to /template/tweet_v1/render)        │
 │  └── Download button → public render pipeline                     │
 └────────┬─────────────────────────────────────────────┬────────────┘
          │ GET /tools/tweet-screenshot/fetch?url=...   │ POST /image/public/...
          │                                             │ or /template/tweet_v1/render
          ▼                                             ▼
 ┌────────────────────────┐                   ┌──────────────────────┐
 │ Fastify route          │                   │ existing public      │
 │ routes/tools/          │                   │ render pipeline      │
 │   tweet-screenshot.js  │                   └──────────────────────┘
 └────────┬───────────────┘
          │
          ▼
 ┌────────────────────────┐        ┌──────────────────────┐
 │ service/twitter-       │───────▶│ Redis cache 1h       │
 │   syndication.js       │        │ tweet:syn:<id>       │
 │   fetchTweet(id)       │        └──────────────────────┘
 │   normalizeTweet(raw)  │
 │   NormalizedTweet type │
 └────────┬───────────────┘
          │
          ▼
 ┌────────────────────────┐
 │ cdn.syndication.       │
 │   twimg.com            │
 │ /tweet-result?id=<id>  │
 │   &token=a             │
 │ (UNDOCUMENTED)         │
 └────────────────────────┘

 ┌────────────────────────┐
 │ service/tweet-         │ hourly via existing scheduler
 │   canary.js            │ → calls fetchTweet(20) end-to-end
 │                        │ → emits syndication_schema_drift
 │                        │   metric on validation failure
 └────────────────────────┘
```

### State machine — page interaction

```
    page load
        │
        ▼
  ┌────────────┐   invalid URL           ┌────────────┐
  │  empty /   │◀────────────────────────│  fetching  │
  │  manual    │                         └─────┬──────┘
  │  (default) │◀──── error (404/5xx) ─────────┤
  └─────┬──────┘                               │ 200 + valid shape
        │                                      ▼
        │                                ┌────────────┐
        │   edit any field               │ prefilled  │
        └───────────────────────────────▶│  editable  │
                                         └─────┬──────┘
                                               │ click Fetch
                                               │   + any field edited
                                               ▼
                                         ┌────────────┐
                                         │  confirm   │
                                         │  inline    │
                                         └─────┬──────┘
                                               │ confirm → restart fetch
                                               │ cancel  → stay in prefilled
```

### Error taxonomy (named classes)

```
SyndicationRateLimitError   ← HTTP 429
SyndicationNotFoundError    ← HTTP 404 (deleted / private)
SyndicationUpstreamError    ← HTTP 5xx or timeout (after 1 retry)
SyndicationParseError       ← non-JSON body / body > 100KB
SyndicationSchemaError      ← JSON but missing required fields

All rescued in routes/tools/tweet-screenshot.js → mapped to HTTP status
with a user-facing message that always offers manual-fill fallback.
```

## Implementation Units

- [ ] **Unit 1: Syndication client service + error classes**

**Goal:** Pure, tested backend service that fetches + normalizes a tweet by ID, with named error classes and strict response-shape validation.

**Requirements:** R8, R9 (foundations), R13 (entity pass-through)

**Dependencies:** None

**Target repo:** `html-to-gif`

**Files:**
- Create: `service/twitter-syndication.js`
- Create: `test/service/twitter-syndication.test.js`
- Create: `test/fixtures/syndication/minimal-tweet.json`
- Create: `test/fixtures/syndication/tweet-with-media.json`
- Create: `test/fixtures/syndication/retweet.json`
- Create: `test/fixtures/syndication/long-text-tweet.json`
- Create: `test/fixtures/syndication/emoji-only-tweet.json`

**Approach:**
- Export named error classes: `SyndicationRateLimitError`, `SyndicationNotFoundError`, `SyndicationUpstreamError`, `SyndicationParseError`, `SyndicationSchemaError`.
- Export `parseTweetId(url: string): string` — strict allowlist: hosts `{twitter.com, www.twitter.com, x.com, www.x.com, mobile.twitter.com}`, path `/{username}/status/{digits}`, ID all digits 1–25 chars, URL length ≤ 512, rejects non-https schemes. Throws `ValidationError` with an explicit reason.
- Export `fetchTweet(id: string, { cache?: RedisClient, signal? }): Promise<NormalizedTweet>`:
  - Cache read first (`tweet:syn:<id>`, 1h TTL). Redis-down → log warn, fall through.
  - `fetch('https://cdn.syndication.twimg.com/tweet-result?id=<id>&token=a', { signal: AbortSignal.timeout(8000) })`.
  - Max response body 100KB — abort if exceeded.
  - Status mapping: 404 → `SyndicationNotFoundError`; 429 → `SyndicationRateLimitError`; 5xx → one retry with 2s backoff, then `SyndicationUpstreamError`; timeout → `SyndicationUpstreamError`.
  - Body → JSON; non-JSON or parse error → `SyndicationParseError` with 2KB snippet logged.
  - Schema validation: `user.name`, `user.screen_name`, `text`, `id_str` required. Missing any → `SyndicationSchemaError` with missing field list logged + metric emitted.
  - `normalizeTweet(raw): NormalizedTweet` — pure, total. All optional fields explicitly `null` when absent. Avatar URL scheme-checked (https only) + host-allowlisted (`pbs.twimg.com`, `abs.twimg.com`). Media URLs same.
  - On success: cache set, return.
- Top-of-file 10-line comment explaining undocumented-endpoint risk, mitigation (strict validation + canary + kill-switch), and migration notes.

**Execution note:** Implement `parseTweetId` and `normalizeTweet` test-first — both are pure and have the highest attack surface.

**Technical design:** `NormalizedTweet` shape is the authoritative contract used by the frontend. All fields present (null if absent). Reviewer validates the contract, not the implementation.

```
NormalizedTweet = {
  id,                          // string
  author: {
    name,                      // string
    handle,                    // string (screen_name)
    avatar_url,                // string | null (validated)
    is_verified_blue,          // boolean
    is_verified,               // boolean
  },
  body,                        // string (raw tweet text)
  entities: {                  // arrays of { start, end, … } tokens
    urls:          [{ start, end, display_url, expanded_url }],
    user_mentions: [{ start, end, handle }],
    hashtags:      [{ start, end, text }],
  },
  media: [{ url, width, height, type }],  // up to 4, https + allowlisted host
  created_at,                  // ISO 8601 string | null
  metrics: {
    likes,                     // number | null
    retweets,                  // number | null (if exposed; else null)
    replies,                   // number | null (conversation_count)
  },
}
```

**Patterns to follow:**
- Error class structure: match any existing backend error classes (grep `class.*Error` in `service/`).
- Log fields: follow existing structured log calls.

**Test scenarios:**
- Happy path: valid tweet URL → normalized output matches `minimal-tweet` snapshot.
- Happy path: tweet-with-media fixture → media array has ≤ 4 https+pbs.twimg.com items.
- Happy path: long-text fixture → body preserved, entities indices correct.
- Happy path: emoji-only fixture → body preserves emoji, no entity regression.
- Happy path: retweet fixture → normalizes without error, author fields populated.
- Edge case: empty entities object → tokens arrays empty, not missing.
- Edge case: missing optional fields (profile_image_url_https, media) → null in output, not missing key.
- Edge case: avatar URL host `evil.com` → sanitized to null.
- Edge case: avatar URL scheme `javascript:` → sanitized to null.
- Edge case: media URL host not in allowlist → dropped from array.
- Edge case: response body > 100KB → `SyndicationParseError`.
- Edge case: cache hit → zero outbound calls.
- Error path: parseTweetId rejects non-twitter host, non-numeric ID, URL > 512 chars, nil, empty string, `javascript:` scheme, `file://` scheme, SSRF probe (`169.254.169.254`, `localhost`, `0.0.0.0`, `[::1]`).
- Error path: HTTP 404 → `SyndicationNotFoundError`.
- Error path: HTTP 429 → `SyndicationRateLimitError` (no retry).
- Error path: HTTP 500 → retries once with backoff, then `SyndicationUpstreamError`.
- Error path: fetch timeout (8s AbortSignal) → `SyndicationUpstreamError`.
- Error path: non-JSON body → `SyndicationParseError` with 2KB snippet logged.
- Error path: JSON missing `user.name` → `SyndicationSchemaError` + metric emitted.
- Integration: Redis down on read → log warn, proceeds to origin, returns success.
- Integration: Redis down on write → log warn, returns success anyway.
- Snapshot: all 5 fixtures → stable `normalizeTweet` output (fail on drift).

**Verification:**
- `normalizeTweet` is a pure function: no network, no I/O, no globals.
- All named error classes exist, extend a common base, and are exported.
- Snapshot suite passes. If Twitter changes a field, snapshot fails loudly (desired).

---

- [ ] **Unit 2: `/tools/tweet-screenshot/fetch` Fastify route**

**Goal:** Public anonymous endpoint that accepts a tweet URL and returns a `NormalizedTweet` JSON (or error with fallback hint), plumbed into abuse-monitor and per-IP rate limiting.

**Requirements:** R2, R7

**Dependencies:** Unit 1

**Target repo:** `html-to-gif`

**Files:**
- Create: `routes/tools/tweet-screenshot.js`
- Create: `test/routes/tools/tweet-screenshot.test.js`
- Modify: whatever root registers `routes/tools/*.js` (likely `routes/tools/index.js` or `server.js` — verify during implementation).

**Approach:**
- `GET /tools/tweet-screenshot/fetch?url=<url>`:
  - Validate query param `url` exists, non-empty, ≤ 512 chars → else 400 `{ error: "invalid_url", message }`.
  - Call `parseTweetId(url)` → `ValidationError` → 400 with reason.
  - Abuse-monitor middleware: 30 requests / 5 min per IP on this specific endpoint. Exceeded → 429 with `Retry-After`.
  - Call `fetchTweet(id, { cache, signal: req.raw.signal })`.
  - Map errors:
    - `SyndicationNotFoundError` → 404 `{ tweet: null, reason: "not_found" }`.
    - `SyndicationRateLimitError` → 503 `{ tweet: null, reason: "rate_limited" }`.
    - `SyndicationUpstreamError` → 503 `{ tweet: null, reason: "upstream" }`.
    - `SyndicationParseError` / `SyndicationSchemaError` → 503 `{ tweet: null, reason: "shape_error" }` + log + metric.
    - Unknown → 500 `{ tweet: null, reason: "internal" }` + log full stack.
  - Success → 200 `{ tweet: NormalizedTweet, cached: boolean }`.
- If env `TWEET_SYNDICATION_ENABLED !== 'true'` (read per-request), return 503 `{ tweet: null, reason: "disabled_kill_switch" }` immediately — no upstream call. Frontend uses this signal to render manual-only mode.
- Emit structured logs at all decision points: `event=syndication_fetch_success|failed`, `tweet_id`, `cached`, `duration_ms`, `error_class`, `request_id`.

**Patterns to follow:**
- Existing `routes/tools/*.js` files for route registration convention.
- `service/abuse-monitor.js` integration from other public routes.
- `service/request-context.js` for `request_id` propagation.

**Test scenarios:**
- Happy path: valid URL → 200 with normalized tweet shape + `cached: false`.
- Happy path: same URL second call → 200 with `cached: true` (one syndication call mocked).
- Error path: missing `url` query → 400 `invalid_url`.
- Error path: malformed URL → 400 `invalid_url`.
- Error path: non-twitter host → 400 `invalid_url`.
- Error path: SSRF probe `?url=http://169.254.169.254/` → 400 (host check).
- Error path: URL > 512 chars → 400.
- Error path: upstream 404 → 404 `not_found`.
- Error path: upstream 429 → 503 `rate_limited`.
- Error path: upstream timeout → 503 `upstream`.
- Error path: schema drift in upstream response → 503 `shape_error` + metric asserted.
- Error path: kill-switch `TWEET_SYNDICATION_ENABLED=false` → 503 `disabled_kill_switch` (no outbound).
- Error path: abuse-monitor blocks IP → 403.
- Error path: 31st call in 5min from same IP → 429 with `Retry-After`.
- Integration: response shape conforms to `NormalizedTweet` contract (type-asserted in test).
- Integration: `request_id` in all log lines for a single request.

**Verification:**
- Every mapped error class produces a distinct HTTP status + `reason` enum value.
- No unhandled promise rejections under any test scenario.

---

- [ ] **Unit 3: Canary job**

**Goal:** Hourly job that exercises the full `fetchTweet` pipeline against tweet id `20` and logs outcomes; detects both availability and schema-drift regressions.

**Requirements:** R9

**Dependencies:** Unit 1

**Target repo:** `html-to-gif`

**Files:**
- Create: `service/tweet-canary.js`
- Create: `test/service/tweet-canary.test.js`
- Modify: wherever scheduled jobs are registered (experiment-scheduler.js or similar — verify during implementation).

**Approach:**
- Export `runCanary({ fetchTweet, logger }): Promise<{ ok, duration_ms, error? }>` — pure-ish, takes deps for testability.
- Calls `fetchTweet('20', { cache: null })` — bypasses cache so every run is a real probe. Tweet 20 is @jack's first tweet, permanent.
- On success: log `level=info event=canary_success duration_ms=<n>`, reset consecutive-failure counter (module-level).
- On failure: increment counter; log `level=warn event=canary_fail_transient consecutive=<n>` for count 1–2; log `level=error event=canary_fail_persistent consecutive=<n> error_class=<name>` for count ≥ 3.
- `SyndicationSchemaError` always logs at `error` with `event=syndication_schema_drift` + emit metric, regardless of counter.
- Register with existing scheduler to run every hour.

**Patterns to follow:**
- Existing scheduled-job wiring (confirm exact pattern during implementation; `experiment-scheduler.js` is a likely reference).

**Test scenarios:**
- Happy path: canary success → `ok: true`, info log.
- Edge case: canary fails 1× → warn log `consecutive=1`, no error log.
- Edge case: canary fails 2× consecutive → warn log `consecutive=2`.
- Edge case: canary fails 3× consecutive → error log `canary_fail_persistent`.
- Edge case: canary succeeds after 2 failures → counter resets to 0.
- Error path: `SyndicationSchemaError` → error log `syndication_schema_drift` + metric emitted, regardless of counter state.
- Integration: runCanary uses the full fetchTweet path (not a raw HTTP call) — verified by injecting a spy fetchTweet and asserting it was called with `id='20'`.

**Verification:**
- Counter state is module-local; tests reset it between cases.
- A schema drift in the live syndication response is surfaced as an error log + metric in the canary output.

---

- [ ] **Unit 4: Seed `tweet_v1` system template**

**Goal:** A public Template document with the tweet layout and typed variables, accessible via `/template/tweet_v1/render` for both the Download button and the API snippet on the page.

**Requirements:** R5, R6, R10

**Dependencies:** Unit 1 (for `NormalizedTweet` variable shape)

**Target repo:** `html-to-gif`

**Files:**
- Create: `scripts/seed-tweet-screenshot-template.js` (idempotent seed, modeled on `scripts/seed-templates.js`)
- Create: `test/scripts/seed-tweet-screenshot-template.test.js`
- Reference: `scripts/seed-templates.js` (existing 1,794-LOC seeder — same idempotent-upsert pattern)

**Approach:**
- Template document:
  - `uid: 'tweet_v1'` (stable, public, versioned suffix for future `tweet_v2`).
  - `isPublic: true` — confirmed first-class field on `models/Template.js` (already used by `routes/public-templates.js` with `{ isPublic: true }` query filter, verified during deepening).
  - Variables (typed, matching `NormalizedTweet`):
    - `author_name` (text), `author_handle` (text), `author_avatar` (image), `is_verified_blue` (boolean), `is_verified` (boolean).
    - `body` (text).
    - `likes` (number), `retweets` (number), `replies` (number).
    - `created_at` (text).
    - `media_url_1` through `media_url_4` (image, optional).
  - FabricJS object tree for the tweet card: avatar circle, name + handle row, verified badge (conditional on `is_verified_blue || is_verified`), body text, metrics row (formatted with `currency`-style thousands separator via expression engine — e.g., `{{ likes | number }}`), optional media grid.
- Seed script: idempotent upsert by `uid`. Running twice is a no-op.
- Register the seed to run during deploy (wire into existing deploy-hook or add a README instruction — confirm during implementation).
- Verified during deepening: `isPublic` is a first-class field on the Template model; `routes/public-templates.js` filters by `isPublic: true` at line 177; `routes/public-render.js` exposes `POST /:uid` at line 74 which is the endpoint for the API snippet. The rendered path from the dashboard side is `POST /template/:uid/render` (authed); the public path is `POST /public-render/:uid` (or whatever prefix `public-render.js` is mounted under — verify during implementation).

**Patterns to follow:**
- Existing template seed/fixture scripts if any; otherwise model from `models/Template.js` directly.
- Certificate-generator's approach to building FabricJS JSON (via `src/lib/pseo/useCaseTemplates.js:getCertificateTemplate()` on the frontend). Backend-side we just need the static JSON.

**Test scenarios:**
- Happy path: script run → template `uid: tweet_v1` exists in DB.
- Happy path: script run twice → no duplicate documents (idempotent upsert).
- Happy path: `POST /template/tweet_v1/render` with full variables → 200 + image URL.
- Happy path: `POST /template/tweet_v1/render` with minimal variables (no media, no verified) → 200.
- Edge case: anonymous call to `/template/tweet_v1/render` → succeeds (public) or surfaces a clear permission error (caller adjusts).
- Integration: variables validated against type schema → rendering with wrong type fails gracefully.

**Verification:**
- Template is discoverable via whatever listing the API snippet URL should reference.
- Variable names and types match the `NormalizedTweet` contract from Unit 1 — if either drifts, test fails.

---

- [ ] **Unit 5: Frontend page scaffold + feature-flag gate**

**Goal:** New SvelteKit route at `/tools/tweet-screenshot` with SSR metadata, SEO schema, feature-flag server-side gate, and the overall layout shell. No behavior yet.

**Requirements:** R1, R11

**Dependencies:** None (parallel to backend)

**Target repo:** `front-end-html-to-gif`

**Files:**
- Create: `src/routes/tools/tweet-screenshot/+page.svelte`
- Create: `src/routes/tools/tweet-screenshot/+page.server.js`
- Create: `src/routes/tools/tweet-screenshot/_lib/.gitkeep` (directory for Units 6–9)
- Modify: `src/routes/tools/+page.svelte` (tools index) — add Tweet Screenshot entry.
- Modify: `src/lib/pseo/comparisons.js` if it enumerates tools — add this one.

**Approach:**
- `+page.server.js`:
  - Read feature flag `tools.tweet_screenshot.enabled` (reuse evaluator from commit `0712794`).
  - Flag false → `throw error(404)`.
  - Flag true → pass initial data (default placeholder tweet for SSR/crawler preview).
- `+page.svelte`:
  - `<svelte:head>`: `<title>Tweet Screenshot Generator — free, API-ready</title>`, meta description, canonical URL, OG tags, Twitter-card tags, FAQPage + WebApplication + BreadcrumbList JSON-LD.
  - Layout shell: header, URL-input row, two-column (editable fields / canvas), API snippet panel, signup CTA slot, FAQ section, RelatedTools component at bottom.
  - Neo-brutalist style per conventions.
  - Placeholder content only — actual state wiring in Unit 7.

**Patterns to follow:**
- `src/routes/tools/online-invoice-generator/+page.svelte` for SEO schema.
- `src/routes/tools/certificate-generator/+page.svelte` for overall layout & flag gate.

**Test scenarios:**
- Happy path: flag on → page renders 200.
- Happy path: flag off → page returns 404.
- Happy path: JSON-LD schemas present and valid (assert required fields exist in rendered HTML).
- Edge case: crawler (SSR-only, no JS) → sees canonical URL, OG tags, FAQ schema, and placeholder tweet preview.
- Integration: tools index page lists Tweet Screenshot with correct href.

**Verification:**
- Lighthouse SEO panel shows no critical warnings.
- View-source shows all JSON-LD schemas.

---

- [ ] **Unit 6: Frontend `_lib` helpers (parseTweetId, tokenize, tweet-state store)**

**Goal:** Pure, unit-tested frontend helpers that are the single source of truth for client-side validation, text tokenization, and tool state.

**Requirements:** R2, R13

**Dependencies:** Unit 1 (mirrors backend `parseTweetId` contract)

**Target repo:** `front-end-html-to-gif`

**Files:**
- Create: `src/routes/tools/tweet-screenshot/_lib/parseTweetId.js`
- Create: `src/routes/tools/tweet-screenshot/_lib/tokenize.js`
- Create: `src/routes/tools/tweet-screenshot/_lib/tweet-state.js`
- Create: `src/routes/tools/tweet-screenshot/_lib/parseTweetId.test.js`
- Create: `src/routes/tools/tweet-screenshot/_lib/tokenize.test.js`

**Approach:**
- `parseTweetId.js` — 15-line copy of the backend version. Top comment: `// KEEP IN SYNC WITH: html-to-gif/service/twitter-syndication.js#parseTweetId`. Same allowlist, same rules. Backend is authoritative for security.
- `tokenize.js` — takes `(body, entities): Array<{ type: 'text' | 'link' | 'mention' | 'hashtag', text?, href?, handle?, tag? }>`:
  - Sort entities by start index (defensive).
  - Walk the body, emitting plain-text tokens between entity positions and typed tokens for each entity.
  - Handle surrogate-pair emoji correctly (use `[...body]` or grapheme iterator for indexing).
  - `dir="auto"` passthrough (rendered by caller; tokenizer just returns strings).
  - Missing/empty `entities` → single text token with the whole body.
- `tweet-state.js` — single Svelte writable store holding the entire tool state:
  ```
  {
    url,               // string
    status,            // 'empty' | 'fetching' | 'prefilled-editable' | 'confirm-overwrite'
    lastFetchedId,     // string | null
    edited: { … },     // tracks which fields the user touched since last fetch
    data: NormalizedTweet | null,
    error: string | null,
  }
  ```
  - Explicit setters: `setUrl`, `startFetch`, `finishFetch`, `failFetch`, `updateField`, `requestOverwriteConfirm`, `confirmOverwrite`, `cancelOverwrite`.
  - No direct mutation from components — only via setters. Prevents the 0fe1c32 subscription-leak class by localizing reactive surface.

**Patterns to follow:**
- Reactive store pattern used in existing Svelte pages; align with whatever certificate-generator uses post-0fe1c32.

**Test scenarios:**
- `parseTweetId` — mirror all backend test cases (happy, SSRF probes, bad schemes, long URLs, nil, empty).
- `tokenize` — happy path (plain text → one text token).
- `tokenize` — one URL → text + link + text sequence.
- `tokenize` — URL + mention + hashtag interleaved → tokens in correct order.
- `tokenize` — entities with indices out of order in input → sorted before splicing.
- `tokenize` — emoji adjacent to entity boundary → surrogate pairs not split.
- `tokenize` — `<script>alert(1)</script>` in body → renders as text when consumer uses `{token.text}`.
- `tokenize` — missing entities object → single text token.
- `tokenize` — empty body → zero tokens (or single empty-text token, document choice).
- `tokenize` — RTL body → tokens preserve original characters; caller applies `dir="auto"`.
- `tweet-state` — setUrl updates url, doesn't touch other state.
- `tweet-state` — updateField when no previous edits → edited.{field} = true.
- `tweet-state` — confirmOverwrite resets edited map + sets status to 'fetching'.
- `tweet-state` — cancelOverwrite returns to 'prefilled-editable' without losing data.

**Verification:**
- `parseTweetId` byte-for-byte matches the backend rules (manual diff in review).
- `tokenize` never calls `innerHTML` or returns raw HTML strings.

---

- [ ] **Unit 7: Interactive page wire-up — URL input, fetch, overwrite-confirm, editable fields**

**Goal:** Connect `+page.svelte` to the backend `/fetch` endpoint and the `_lib` helpers. URL input, Fetch button, inline overwrite-confirm, editable fields panel — all reactive.

**Requirements:** R2, R3, R4, R12

**Dependencies:** Units 2, 5, 6

**Target repo:** `front-end-html-to-gif`

**Files:**
- Modify: `src/routes/tools/tweet-screenshot/+page.svelte`
- Create: `src/routes/tools/tweet-screenshot/TweetFieldsPanel.svelte`
- Create: `src/routes/tools/tweet-screenshot/UrlInputRow.svelte`
- Create: `e2e/tools/tweet-screenshot.spec.js` (or matching the repo's e2e convention — verify during implementation)

**Approach:**
- `UrlInputRow.svelte`: input + Fetch button + inline error slot. Fetch button disabled while `status === 'fetching'`. Uses AbortController per fetch — paste-new-URL aborts in-flight.
- Inline overwrite-confirm: when `status === 'confirm-overwrite'`, render a small warning row next to Fetch: "Refetching will replace your edits. [Refetch] [Cancel]". No modal overlay.
- `TweetFieldsPanel.svelte`: form for all editable fields (avatar URL, display name, handle, verified toggle, body textarea, likes, retweets, replies, media URLs x4, date). Each field change → `tweetState.updateField(name)`.
- Fetch flow:
  1. Click Fetch → if any field edited, set `confirm-overwrite`.
  2. Confirm (or no edits) → `startFetch()`, call `GET /tools/tweet-screenshot/fetch?url=...`.
  3. 200 → `finishFetch(tweet)`.
  4. Error → `failFetch(reason)`, fields stay in whatever state they were in, toast with a fallback hint.
- Offline detection: `navigator.onLine` check before calling origin; offline → toast "No connection", no request.
- Body length cap: visual truncate at 280 shown + toast "max 280 chars shown" if user pastes more.

**Patterns to follow:**
- AbortController per in-flight fetch; cleanup on unmount.
- Svelte `onDestroy` for subscription cleanup — guards 0fe1c32 regression class.

**Test scenarios:**
- Happy path: paste tweet URL + Fetch → fields populated via `_lib` tokenize result, no console errors.
- Happy path: edit display name → reactive state updates, no render-on-every-keystroke bug (debounce assertion from Unit 8's canvas tests applies here too).
- Edge case: double-click Fetch → second click no-op (button disabled).
- Edge case: paste new URL while fetching → previous request aborted; latest wins.
- Edge case: user edits a field then clicks Fetch → inline confirm appears.
- Edge case: confirm → fields replaced; cancel → edits preserved.
- Edge case: offline (simulated) → toast, no network call.
- Edge case: feature flag off server-side → page 404 (covered in Unit 5 but assert end-to-end).
- Error path: fetch returns 400 invalid_url → inline error under URL field.
- Error path: fetch returns 404 not_found → info toast + stay in manual mode.
- Error path: fetch returns 503 shape_error → error toast + stay in manual mode.
- Error path: fetch returns 503 disabled_kill_switch → info banner "Preview temporarily disabled; fill fields manually."
- Integration: component unmount while fetch in-flight → no "set state on unmounted" warning, AbortController triggered.

**Verification:**
- No "set state on unmounted" warnings in any path.
- All fetch rejections are handled — no unhandled promise rejections.

---

- [ ] **Unit 8: FabricJS canvas preview + debounced render**

**Goal:** Live canvas preview that renders the tweet card from the current state, debounced 150ms, with layer behavior matching certificate-generator's post-0fe1c32 pattern.

**Requirements:** R4

**Dependencies:** Units 4 (template shape), 7 (state wiring)

**Target repo:** `front-end-html-to-gif`

**Files:**
- Modify: `src/routes/tools/tweet-screenshot/+page.svelte`
- Create: `src/routes/tools/tweet-screenshot/TweetCanvas.svelte`
- Create: `src/routes/tools/tweet-screenshot/_lib/buildCanvasObjects.js`
- Create: `src/routes/tools/tweet-screenshot/_lib/buildCanvasObjects.test.js`

**Approach:**
- `buildCanvasObjects.js` — pure function: `(NormalizedTweet-like editable state) → FabricJS object tree`. Mirrors the `tweet_v1` template layout from Unit 4. Unit-tested against snapshot.
- `TweetCanvas.svelte` — owns the FabricJS canvas lifecycle. Receives state via prop; on change (debounced 150ms), rebuilds objects via `buildCanvasObjects` and updates canvas.
- Debounce implemented with a single timer ref; cleaned up in `onDestroy`.
- Avatar image load failures → swap to initials avatar (first letter of display name, colored background).
- Body text overflow → Fabric automatic truncation + ellipsis.
- RTL text: set `dir='auto'` at the text-object level.
- Single canvas instance re-used across renders — no re-instantiate on every update.

**Patterns to follow:**
- Certificate-generator canvas ownership pattern (post-0fe1c32: batch renders, subscription cleanup, no render-on-every-keystroke).
- MiniEditor `loadGeneration` generation-counter pattern if switching between states.

**Test scenarios:**
- Happy path: state update → canvas re-renders within 200ms (debounce + paint).
- Edge case: 10 keystrokes in 100ms → canvas re-renders ONCE (debounce works).
- Edge case: avatar URL 404 → canvas shows initials avatar, no "broken image" icon.
- Edge case: avatar URL CORS error → same initials fallback.
- Edge case: media array with 4 items → grid rendered; 0 items → no grid.
- Edge case: body > 280 chars → truncated with ellipsis.
- Edge case: body is RTL text → canvas rendering preserves direction.
- Edge case: display name 100 chars → truncated.
- Edge case: component unmount mid-debounce → timer cleared.
- Integration: `buildCanvasObjects` output structure matches the `tweet_v1` template object IDs/names (snapshot comparison).

**Verification:**
- No render-per-keystroke regression — debounce test is the tripwire.
- `onDestroy` cleans up canvas + timer + any subscriptions (audit with a leak-detection test wrapper).

---

- [ ] **Unit 9: API snippet panel (state-derived, NOT prop-derived)**

**Goal:** Visible `curl`/JS/Python code snippet that always reflects the user's current edited state, using `tweet_v1` template via `POST /template/tweet_v1/render`. This is the conversion hook.

**Requirements:** R5

**Dependencies:** Units 4, 7

**Target repo:** `front-end-html-to-gif`

**Files:**
- Modify: `src/routes/tools/tweet-screenshot/+page.svelte`
- Create: `src/routes/tools/tweet-screenshot/ApiSnippetPanel.svelte`
- Create: `src/routes/tools/tweet-screenshot/_lib/buildApiSnippet.js`
- Create: `src/routes/tools/tweet-screenshot/_lib/buildApiSnippet.test.js`

**Approach:**
- `buildApiSnippet.js` — pure: `(editableState, language: 'curl' | 'node' | 'python') → string`. Produces real, copy-pasteable code:
  - curl: `curl -X POST https://api.pictify.io/template/tweet_v1/render -H "Authorization: Bearer $PICTIFY_API_KEY" -d '{"variables": {…}}'`
  - node: `await fetch('https://api.pictify.io/template/tweet_v1/render', { method: 'POST', headers, body: JSON.stringify({ variables }) })`
  - python: `requests.post(…, json={"variables": {…}})`
- Snippet derives from the **same reactive state** that drives the canvas — not from fetch response props. This is the 0fe1c32 fix applied by construction.
- `ApiSnippetPanel.svelte` — tabbed (curl/Node/Python), syntax-highlighted, Copy button.
- Signed-out users see `$PICTIFY_API_KEY` placeholder. Signed-in users see their real token only if the existing API-token UI does the same (mirror cert-gen behavior).

**Patterns to follow:**
- Certificate-generator post-0fe1c32 snippet panel — directly source the fix.

**Test scenarios:**
- Happy path: edit display name → snippet updates with new display name.
- Happy path: edit body → curl payload reflects new body (NOT the prefilled one).
- Happy path: copy button → clipboard contains the current snippet.
- Edge case: signed-out → snippet shows `$PICTIFY_API_KEY` placeholder.
- Edge case: switch language tab → snippet regenerates for that language.
- Edge case: special chars in body (quotes, backslashes) → properly escaped in each language's snippet format.
- Edge case: verify the snippet is identical to what a real API call would look like — manual validation during QA.
- Regression: rapid edits → snippet state matches canvas state (snapshot of both at same time assertion).

**Verification:**
- A copy-paste of the generated `curl` into a real shell produces the exact image shown on the canvas (verified manually during QA).

---

- [ ] **Unit 10: Download button + signup CTA wiring**

**Goal:** Download button that produces a PNG via the public render pipeline, with signup-CTA interception for anonymous users over quota.

**Requirements:** R6, R14

**Dependencies:** Units 4, 7

**Target repo:** `front-end-html-to-gif`

**Files:**
- Modify: `src/routes/tools/tweet-screenshot/+page.svelte`
- Create: `src/routes/tools/tweet-screenshot/DownloadButton.svelte`

**Approach:**
- Button calls existing public render endpoint. **Verified during deepening:** cert-gen uses `backend.post('/image/public/canvas', …)` at `src/routes/tools/certificate-generator/+page.svelte:80`. Mirror this exact call for anonymous users. For signed-in users who want the "API-parity" version (same endpoint a paying customer would call programmatically), we can expose the `POST /public-render/:uid` path the public snippet references — but the simpler-and-proven path is to keep cert-gen parity.
- Anon + over-quota → existing `GenerationLimitBanner` / signup CTA modal intercepts (commit `0712794`).
- PostHog events on button click, render success, render failure, and on CTA view + signup click.
- Button disabled during in-flight render.

**Patterns to follow:**
- Certificate-generator download flow post-0fe1c32.
- `GenerationLimitBanner` usage.

**Test scenarios:**
- Happy path: signed-in user clicks Download → PNG downloads.
- Happy path: anon within quota → PNG downloads.
- Edge case: anon over quota → signup CTA modal appears, no render call.
- Edge case: double-click Download → second click no-op.
- Error path: render returns 500 → retry toast.
- Integration: PostHog `download_click` event fires exactly once per click; `signup_cta_view` fires when modal appears.

**Verification:**
- PostHog funnel `download_click → signup_cta_view → signup_success` is populated end-to-end.

---

- [ ] **Unit 11: Observability — logs, metrics, dashboard panel**

**Goal:** Every new codepath emits the structured logs defined in the review; dashboard surfaces canary status, fetch success rate, and conversion funnel.

**Requirements:** R9, R14

**Dependencies:** Units 2, 3

**Target repo:** `html-to-gif` (logs/metrics) + monitoring tool (dashboard panels)

**Files:**
- Modify: `routes/tools/tweet-screenshot.js` (log audit)
- Modify: `service/twitter-syndication.js` (log audit)
- Modify: `service/tweet-canary.js` (log audit)
- Create: monitoring dashboard panel config (wherever dashboards live; verify during implementation).

**Approach:**
- Every log line includes: `event`, `tweet_id` (where applicable), `request_id`, `duration_ms` (for timed ops), `error_class` (on failure), plus request-specific fields.
- Metrics emitted:
  - `syndication_fetch_total{status}` — counter.
  - `syndication_fetch_duration_ms` — histogram.
  - `syndication_cache_hit_ratio` — derived (counter pair).
  - `syndication_schema_drift_total` — counter, any non-zero value is news.
- Dashboard panels (day-1):
  - Page views (hourly time-series).
  - Fetch success rate gauge (target >95%).
  - Fetch p50/p95/p99 duration.
  - Cache hit ratio.
  - Error breakdown (stacked by reason enum).
  - Rate-limited IPs per hour.
  - Canary status heatmap (last 24h).
  - Download CTR and signup funnel.

**Patterns to follow:**
- Whatever structured-log library the backend currently uses.
- Existing dashboard config format.

**Test scenarios:**
- Each error class produces exactly one error log line with the expected fields (assert via log capture in tests).
- `request_id` is identical across all log lines emitted during one request (log-correlation assertion).
- `syndication_schema_drift_total` increments when a `SyndicationSchemaError` is thrown.

**Verification:**
- A new engineer can answer "why did this user's download fail?" from logs alone, given a `request_id`.

---

- [ ] **Unit 12: Runbook**

**Goal:** A committed runbook for the three operational scenarios identified in the review (canary failing, schema drift, rate-limited by Twitter). Closes the bus-factor-of-1 risk.

**Requirements:** R15

**Dependencies:** Units 2, 3, 11 (needs real log/metric names to reference)

**Target repo:** `html-to-gif`

**Files:**
- Create: `docs/runbooks/tweet-syndication.md` (or wherever `docs/` lives — verify structure during implementation).

**Approach:**
- Three sections, each with: trigger (log/metric), diagnosis steps, resolution options, rollback.
- Entries:
  1. **Syndication canary failing.** Trigger: `canary_fail_persistent` logs OR canary heatmap red >3h. Steps: check dashboard for `error_class`; manual `curl` test against known tweet ID 20; if endpoint moved → flip `TWEET_SYNDICATION_ENABLED=false`; tool degrades to manual mode; investigate new endpoint; update `service/twitter-syndication.js`.
  2. **Schema drift detected.** Trigger: `syndication_schema_drift_total` metric or error log event. Steps: inspect log for missing fields; compare to `test/fixtures/syndication/*.json`; if Twitter added optional field → update snapshots, safe; if Twitter renamed required field → update `normalizeTweet`, add migration case, ship.
  3. **Rate-limited by Twitter.** Trigger: frequent `SyndicationRateLimitError` or `fetch_total{status="rate_limited"}` spikes. Steps: check cache hit ratio; if low → debug Redis (existing ops); if healthy → raise cache TTL to 4h/12h (tool is read-heavy) instead of raising per-IP limits.
- Link from `service/twitter-syndication.js` top-of-file comment to this runbook.

**Patterns to follow:**
- Whatever runbook format exists in `docs/` (or establish: markdown, h2 per scenario, trigger/diagnose/resolve sections).

**Test scenarios:**
- Test expectation: none — documentation file.

**Verification:**
- Content matches the three scenarios verbatim from the review.
- Linked from code comment in `service/twitter-syndication.js`.

---

- [ ] **Unit 13: Integration & smoke tests**

**Goal:** End-to-end sanity that covers the Golden Path and the three most likely failure modes.

**Requirements:** cross-cutting

**Dependencies:** Units 1–10

**Target repo:** both (e2e in frontend repo; integration in backend repo)

**Files:**
- Create: `e2e/tools/tweet-screenshot.spec.js` (frontend)
- Create: `test/integration/tweet-screenshot-e2e.test.js` (backend)

**Approach:**
- Backend integration: spin up Fastify with a mocked syndication endpoint (fixtures). Test the full request/response cycle through `/tools/tweet-screenshot/fetch` for success + 404 + 5xx.
- Frontend e2e (Playwright or repo's existing e2e framework):
  - Paste tweet URL → fields prefill → canvas renders → snippet reflects → download works.
  - Invalid URL → inline error, no request.
  - Fetch fails → manual mode works.
  - Feature flag off → page 404.
- SECURITY: explicit e2e that passes an SSRF probe URL → 400.

**Patterns to follow:**
- Any existing e2e tests in the frontend repo.
- Backend integration test pattern (likely supertest or fastify's inject).

**Test scenarios:**
- Happy path: full Golden Path end-to-end with mocked syndication.
- Happy path: Download produces a PNG (assert content-type + non-empty body).
- Error path: invalid URL → 400 with `invalid_url` reason.
- Error path: upstream 404 → 404 with `not_found` reason.
- Error path: kill-switch on → 503 with `disabled_kill_switch` reason.
- Security: SSRF probe `?url=http://169.254.169.254/` → 400.
- Security: XSS payload in tweet body → rendered as text (view the page, inspect DOM).

**Verification:**
- CI runs the full suite without hitting live syndication.
- One manual QA pass against live syndication in staging.

---

## System-Wide Impact

- **Interaction graph:**
  - `routes/tools/tweet-screenshot.js` plugs into existing abuse-monitor + request-context middleware.
  - Canary job registers with existing scheduler.
  - `public-render` routes are read-only consumers of the new `tweet_v1` template.
  - Signup CTA + feature-flag infra reused from commit `0712794`.
  - PostHog events added; no new analytics infra.
- **Error propagation:** all syndication errors mapped through named classes → HTTP status → frontend toast + UI fallback. No rescue-StandardError. Frontend catches fetch rejections and shows toasts + manual-mode fallback.
- **State lifecycle risks:**
  - Redis cache 1h TTL — natural eviction; no manual cleanup.
  - FabricJS canvas must be disposed on unmount — audit via test wrapper (0fe1c32 regression class).
  - Subscription leaks in Svelte stores — `onDestroy` cleanup mandatory; snapshot-asserted.
- **API surface parity:** `/template/tweet_v1/render` uses the existing template-render route — no new public API surface for the developer-facing API. The only new public surface is `/tools/tweet-screenshot/fetch`, which is intentionally scoped to this tool page and rate-limited.
- **Integration coverage:** Unit 13's e2e suite covers cross-layer scenarios (frontend → backend → syndication mock → canvas output → snippet parity).
- **Unchanged invariants:**
  - `/image/public/canvas` — unchanged.
  - `/template/:uid/render` — unchanged (we add a template, we don't change the route).
  - `public-render.js`, `public-templates.js` — unchanged.
  - Existing tool pages (certificate-generator, og-image-generator, etc.) — unchanged.
  - Template model schema — unchanged.
  - Expression engine, rendering pipeline — unchanged.

## Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `cdn.syndication.twimg.com` endpoint changes or disappears | Medium (undocumented, long-term stable) | High (tool's primary hook fails) | Strict shape validation + named error classes + hourly full-pipeline canary + env kill-switch + graceful fallback to manual mode |
| Twitter schema drift (field renamed) | Low | High | `SyndicationSchemaError` + `syndication_schema_drift` metric + log with 2KB body snippet for forensic + 5 snapshot fixtures catch at CI time if we update by hand |
| SSRF via user URL input | High attempt frequency | High | ID-only parsing; never fetch user URL; hardcoded upstream hostname; e2e SSRF probe test |
| XSS via tweet body | High | High | Entity-driven tokenizer with auto-escaped `{text}`; never `{@html}`; avatar/media URL allowlist (https + pbs.twimg.com) |
| API snippet diverges from canvas (0fe1c32 regression) | Medium (we're copying the pattern for the 3rd time) | Medium (broken conversion story) | Single reactive state store drives both; Unit 9 snapshot test asserts parity; code review specifically looks for prop-source drift |
| Subscription leak on unmount (0fe1c32 regression) | Medium | Low-Medium | Unit 7 + Unit 8 tests for unmount behavior; onDestroy cleanup mandatory |
| Per-keystroke canvas re-render (0fe1c32 regression) | Medium | Low (perf) | Unit 8 debounce test is the tripwire |
| Rate-limited by Twitter from high organic traffic | Low (tool is new, traffic will ramp) | Medium | Redis 1h cache; runbook says raise TTL before raising limits |
| Canary misses a subtle schema break (200-but-broken) | Low | Medium | Canary uses full fetchTweet pipeline — schema validation included (Unit 3 verification) |
| Scaffold debt compounds with this being the 3rd copy | Medium | Low | TODO tracked — extract before 4th tool (twitter-carousel) |
| Feature flag lingers post-rollout | Medium | Very low | TODO with trigger condition — remove 2 weeks after stable 100% |
| Reliance on `cdn.syndication.twimg.com` for /fetch violating Twitter ToS | Low-Medium | Low-Medium | Endpoint is publicly reachable without auth and powers Twitter's own embeds; low legal exposure. If cease-and-desist arrives, kill-switch off in seconds; manual mode still works |
| API snippet shows an endpoint that doesn't match what Download actually calls (eroding the "programmatic parity" conversion story) | Medium | Medium | Unit 9 `buildApiSnippet` and Unit 10 Download must reference the same resolved public-render path. Acceptance test: curl the snippet's URL with the variables the UI captured; verify identical image bytes to the Download output. |
| MongoDB seed runs out of order (template missing when routes are cold) | Low | Medium | Unit 4 seed is idempotent upsert; Unit 13 integration test asserts `tweet_v1` exists before exercising render paths. Deploy runbook step: run seed before unblocking the flag. |

## Documentation / Operational Notes

- **Docs to update:**
  - `docs/runbooks/tweet-syndication.md` — created in Unit 12.
  - Tools index (`src/routes/tools/+page.svelte`) — updated in Unit 5.
  - Top-of-file comment in `service/twitter-syndication.js` — documents the undocumented-endpoint risk + mitigation + migration notes. Linked to the runbook.
- **Feature-flag rollout:**
  1. Day 0: backend + frontend merged with flag OFF. Canary starts logging.
  2. Day 0: staff-only on. Manual QA pass.
  3. Day 0: 10% anon traffic. Watch dashboard 1h.
  4. Day 0: 100% if green.
  5. Day 0: sitemap + crawl-discovery links added from certificate-generator, og-image-generator, relevant blog posts.
- **Env variables:**
  - `TWEET_SYNDICATION_ENABLED` (default `true`) — runtime kill-switch, read per-request.
- **Rollback:**
  - Page bug → flag OFF (seconds).
  - Twitter kills endpoint → `TWEET_SYNDICATION_ENABLED=false` (seconds, no restart).
  - Backend bug not containable by flags → git revert.
- **PostHog dashboard:** tool → signup funnel with `source=tweet_screenshot`.

## Sources & References

- **Origin document:** conversational CEO-mode plan review (2026-04-14 session) — this plan file supersedes it as the durable record.
- **Orshot competitive plan:** `/Users/suyashthakur/.claude/projects/-Users-suyashthakur-pictify-ideas/memory/project_orshot_competitive.md`
- **Reference plan:** `docs/plans/2026-04-13-001-feat-certificate-generator-tool-plan.md`
- **Reference code (frontend):** `src/routes/tools/certificate-generator/+page.svelte`, `src/routes/tools/online-invoice-generator/+page.svelte`
- **Reference code (backend):** `service/template-renderer.js`, `service/template-expression-engine.js`, `service/abuse-monitor.js`, `routes/public-render.js`
- **External:** `cdn.syndication.twimg.com/tweet-result` (undocumented upstream), `publish.twitter.com/oembed` (rejected fallback).
- **Recent related commits:** `0fe1c32` (certificate-generator post-ship fix — canary for regression classes), `0712794` (signup CTA + feature flag pattern), `f43096b` (PostHog experiments wiring).

## Deepening Pass Notes (2026-04-14)

Facts verified against the codebase during the deepening pass:

- `models/Template.js:146` defines `isPublic` as a first-class boolean field — no migration needed, `tweet_v1` seed just sets it true.
- `routes/public-templates.js:177` filters by `{ isPublic: true }` — confirms the mechanism by which the public-template listing works.
- `routes/public-render.js:74` exposes `POST /:uid` — this is the route the on-page API snippet should reference (full URL depends on the `public-render.js` mount prefix; confirm during implementation).
- `scripts/seed-templates.js` (1,794 LOC) is the canonical seeder to model — confirms idempotent-upsert-by-uid pattern.
- `src/routes/tools/certificate-generator/+page.svelte:80` calls `backend.post('/image/public/canvas', …)` — Unit 10's Download flow mirrors this exactly.
- `service/template-expression-engine.js` has `currency`, `uppercase`, `lowercase`, `capitalize`, `length`, `isEmpty`, `isNotEmpty`, `contains` built-in — Unit 4's `tweet_v1` template can use `{{ likes | number }}`-style formatting for metrics without custom helpers.

New risks surfaced by deepening:

- **API-snippet / Download endpoint parity.** The on-page `curl` and the actual Download button must hit endpoints that produce the same image. Mitigation added to the risk table and called out as a Unit 13 acceptance test.
- **Seed ordering at deploy.** `tweet_v1` must exist before the feature flag is flipped on. Added to Documentation/Operational Notes as a deploy runbook step.

No architectural changes required — the plan's scaffolding assumptions hold against the verified codebase.
