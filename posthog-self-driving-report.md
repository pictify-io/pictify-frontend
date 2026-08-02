# PostHog Self-driving Setup Report

_Generated 2026-07-29 · Project 55738 (Pictify)_

## Summary

PostHog Self-driving has been configured for Pictify. Session Replay, Error Tracking, and Support signal sources are enabled and wired to the inbox; a scout troop of 6 (4 built-in + 2 custom) is armed and will start running within ~30 minutes. Findings will begin appearing in your [Self-driving inbox](https://us.posthog.com/project/55738/inbox) shortly.

---

## AI data processing

**Approved.** Organization-level AI data processing consent was confirmed before this run — required for session replay analysis and scout operations.

---

## GitHub

**Connected during this run.** Integration `pictify-io` (id: 193556) was created by installing the PostHog GitHub App. Self-driving can now research findings against the repo and open fix PRs.

---

## Products enabled

The `products-enable` MCP tool was not available in this deployment. The server flip to turn on Session Replay, Error Tracking, and Support must be done manually.

| Product | Status | Notes |
|---|---|---|
| Session Replay | **Manual step required** | See follow-ups. `posthog.init` is clean — no `disable_session_recording` override. Once enabled server-side, recordings will flow. |
| Error Tracking | **Manual step required** | See follow-ups. `posthog.init` has no `capture_exceptions: false` override. |
| Support (Conversations) | **Manual step required** | See follow-ups. Tickets only arrive once an inbound channel (email / inbox / Slack) is also connected. |

The `posthog.init` call in `src/lib/analytics.js:27` uses a proxied API host (`https://api.pictify.io/posthog`) with `capture_pageview: true` and no disabling flags — it will not interfere with any of the above once they are enabled server-side.

---

## Signal sources

| source_product | source_type | Action | Config ID |
|---|---|---|---|
| `health_checks` | `health_issue` | **enabled** | `019fae3f-6bed-7160-9310-38ccc0eed6ae` |
| `error_tracking` | `issue_created` | **enabled** | `019fae3f-6fff-7598-9802-88774e04ea96` |
| `error_tracking` | `issue_reopened` | **enabled** | `019fae3f-72a2-7016-ba61-47489874b473` |
| `error_tracking` | `issue_spiking` | **enabled** | `019fae3f-765b-75fe-9236-d446afac5643` |
| `session_replay` | `session_analysis_cluster` | **enabled** (sample rate: 10%) | `019fae3f-7b24-738f-bc8b-c223e3367a99` |
| `conversations` | `ticket` | **enabled** | `019fae3f-7fb3-7a06-9e16-e74a372480b2` |
| `signals_scout` | `cross_source_issue` | **on by default** — no config row needed | — |

---

## Connected tools

No external tools were selected. All issue-tracker, error-tracker, support-desk, security-scanner, product-feedback, and search-analytics integrations were skipped (not used).

---

## Scout troop

**Run budget:** 24 runs/day (early-access default) · 0 used today · 24 remaining.
_Banner: "Scouts are in early access so daily runs are limited to 24 by default for now, please reach out to team-self-driving@posthog.com if you would like more runs."_

With 6 enabled scouts at one run each per day, ~6 runs/day are consumed — well within budget.

### Enabled (6)

| Scout | Reason |
|---|---|
| `signals-scout-general` | Always on — sweeps cross-product correlations and uncovered surfaces. |
| `signals-scout-feature-flags` | Feature flags and A/B experiments are heavily used in this project. |
| `signals-scout-web-analytics` | Pageviews and UTM attribution are actively tracked in `analytics.js`. |
| `signals-scout-product-analytics` | Product events (signups, tool usage, upgrade flows) are tracked and funnels will be added. |
| `signals-scout-pictify-image-gen` | Custom — see Custom Scouts below. |
| `signals-scout-pictify-workflow-runs` | Custom — see Custom Scouts below. |

### Disabled (24)

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by the native `error_tracking` signal source (steps 3b + 4). |
| `signals-scout-session-replay` | Covered by the native `session_replay` signal source (steps 3b + 4). |
| `signals-scout-experiments` | Covered within `signals-scout-feature-flags` (experiments are feature flags). Enable separately if you need the dedicated validity-threat monitor. |
| `signals-scout-surveys` | No surveys in use (0 surveys found). Enable if you add surveys. |
| `signals-scout-ai-observability` | No `$ai_*` events or LLM SDK confirmed. Enable if you add AI observability tracking. |
| `signals-scout-revenue-analytics` | No payment SDK or revenue data found. Enable if you integrate Stripe/Paddle. |
| `signals-scout-logs` | PostHog logs product not in use. Enable if you configure it. |
| `signals-scout-csp-violations` | No CSP reporting configured. Enable if you add `$csp_violation` capture. |
| `signals-scout-customer-analytics` | No group/accounts analytics in use. Enable for B2B account-level insights. |
| `signals-scout-data-pipelines` | No CDP destinations or hog flows configured. |
| `signals-scout-data-warehouse` | No warehouse sources connected. |
| `signals-scout-apm` | No distributed tracing / OpenTelemetry configured. |
| `signals-scout-anomaly-detection` | Disabled to stay within budget; re-enable once dashboards are populated. |
| `signals-scout-observability-gaps` | Disabled to stay within budget; useful after more insights are created. |
| `signals-scout-health-checks` | Covered by the native `health_checks` signal source (step 4). |
| `signals-scout-replay-vision` | No Replay Vision scanners configured. |
| `signals-scout-conversations` | Conversations product just enabled; no data yet. Re-enable once a support channel is connected. |
| `signals-scout-ingestion-warnings` | Not in top picks for this project's current stage. |
| `signals-scout-insight-alerts` | No configured insight alerts yet. Enable once alerts are set up. |
| `signals-scout-inbox-validation` | Fresh setup — no resolved reports to validate yet. |
| `signals-scout-mcp-tool-calls` | No `$mcp_tool_call` telemetry confirmed. |
| `signals-scout-tasks` | Not in top picks. |
| `signals-scout-skills-store` | Not relevant to product surface monitoring. |
| `signals-scout-web-vitals` | No `$web_vitals` events confirmed. Enable if you add Core Web Vitals capture. |

---

## Custom scouts

### `signals-scout-pictify-image-gen`

- **Watches:** `image_generated` events, grouped by `tool_name` (code-to-image, html-to-gif, url-to-image, certificate-generator, etc.).
- **Discriminator:** a tool's 24-hour count drops below 40% of its 7-day rolling daily average, sustained across two 12-hour windows, for tools averaging ≥5 events/day.
- **Why no built-in covers it:** `signals-scout-product-analytics` watches saved funnels/retention flows; it will not fire on raw event volume drops without a saved funnel. `signals-scout-web-analytics` watches session volume and attribution — not per-tool conversion counts. No other built-in covers a product's core conversion event at the tool level.
- **Surfaces ruled out:** signup funnel (`signup_started` → `signup_completed`) — `signals-scout-product-analytics` will cover this once a funnel is saved; upgrade funnel — same.

### `signals-scout-pictify-workflow-runs`

- **Watches:** `workflow_run_completed` events for rising `failed/row_count` ratios, sliced by `output_format` and `delivery_method`.
- **Discriminator:** failure ratio exceeds 7-day rolling baseline by >15 percentage points, with ≥10 runs in the window, sustained across two 12-hour windows; quota-cap confounds (`run_cap_hit`) are automatically excluded.
- **Why no built-in covers it:** the workflow engine is a new product surface with its own success/failure loop (`workflow_run_completed.status`, `.failed`, `.delivered`). None of the 4 enabled built-in scouts watch this. `signals-scout-general` might catch an anomaly but won't diagnose format/delivery pipeline breakdowns.
- **Surfaces ruled out:** `run_cap_hit` as its own scout — it's a disqualifier for both custom scouts, not its own watchable surface yet.

**Noise escape hatch:** if either custom scout turns out noisy, open its config in PostHog and set `emit: false` to switch it to dry-run — it will continue logging without writing to the inbox.

---

## Follow-ups

_Worked 2026-07-29 via the PostHog API + MCP._

- [x] **Enable Session Replay** — **was already on.** `session_recording_opt_in: true` on project 55738; the follow-up was stale. No action needed.
- [x] **Enable Error Tracking** — **done.** `autocapture_exceptions_opt_in` flipped `null → true` via `PATCH /api/projects/55738/`. Baseline confirmed at 0 `$exception` events in the prior 7 days, so any exceptions from here are new capture, not backfill. Verify a real one lands after the next deploy.
- [x] **Re-enable `signals-scout-experiments`** — **done.** Config `019fae40-54ac-790c-a9d1-63178dc0e2cf` enabled, daily. See note below on why this one mattered most.
- [x] **Enable Support (Conversations)** — **was already on** (`conversations_enabled: true`). Stale follow-up, like Session Replay.
- [x] **Connect a support inbound channel** — **widget channel configured.** `widget_enabled` flipped `false → true` via `PATCH /api/projects/55738/`. Confirmed the browser receives `widgetEnabled: true` through the `api.pictify.io/posthog` proxy, and that the proxy serves PostHog's static assets (`conversations.js`, `surveys.js`, `recorder.js` all 200). **Blocked on an SDK upgrade — see below.**
- [ ] **Enable `signals-scout-conversations`** — *still correctly disabled.* Enable once real tickets exist; with zero ticket data it burns a daily run to find nothing.

### ✅ posthog-js upgraded 1.293.0 → 1.407.7 (widget now renders)

The widget could not render on 1.293.0: that build contains **zero references to `conversations`** — no Support module at all, so `conversations.js` was never requested no matter what the server config said.

**Upgraded** (`package.json` `^1.257.2` → `^1.407.7`). Verified against a real production build served locally:

| Check | Result |
|---|---|
| `svelte-check` | 0 errors |
| `vite build` | passes |
| `conversations.js` via proxy | 200 (21.6 KB) |
| Widget in DOM | `DIV#ph-conversations-widget-container` present, chat bubble visible bottom-right |
| Widget → Support API | `GET /api/conversations/v1/widget/tickets` → 200 |
| Session replay | `posthog-recorder.js` → 200 |
| Exception autocapture | `exception-autocapture.js` → 200, `$exception_capture_enabled_server_side: true` |
| Feature flags | `POST /flags/?v=2` → 200; server returns all 5 flags incl. the three live experiments |

API surface used by this codebase (`onFeatureFlags`, `getFeatureFlag`, `reloadFeatureFlags`, `capture`, `identify`, `reset`, `people.set`, `__loaded`) is all still present in 1.407.7 — `people.set` is still there despite being legacy.

**Testing note worth keeping:** PostHog **bot-filters `HeadlessChrome`** — the flags endpoint returns **0 flags** for a headless UA and **5** for a normal Chrome UA, same key, same moment. Any headless QA of experiments will show no flag assignment and that is not a bug. This was verified to affect the old build on live prod identically, which is how the upgrade was cleared of regressing flag evaluation.

### Support desk: remaining decisions

- **Anonymous tickets have no reply address.** `requireEmail: false` and `collectName: false`. Logged-in users are identified so their tickets carry identity, but the free-tool funnel is ~7,300 anonymous visitors/quarter against 374 signups — most widget traffic will be logged-out. A ticket from an anonymous visitor with no email cannot be answered. Turn on **Require email** in Support → Settings before promoting the widget. (`require_email` is not a writable API key — the settings blob accepts it but the config serializer ignores it; it must be flipped in the UI.)
- **Widget is scoped to `https://pictify.io`** only. If the dashboard or docs run on another host, add it to `widget_domains`.
- **Second channel:** email (`support@pictify.io`) needs a forwarding rule plus SPF/DKIM on the domain — your action. Worth doing since it captures people who've already left the app.
- [ ] **Connect issue trackers** — *your call.* GitHub is already connected for fix PRs (integration `pictify-io`, id 193556), which is the part that matters. Adding GitHub Issues / Linear / Jira as a warehouse source is only worth it if you actually triage there.

### Run budget after changes

7 enabled scouts × 1 daily run = **~7 of 24 runs/day**. Comfortable headroom.

| Enabled | Origin |
|---|---|
| `signals-scout-general` | canonical |
| `signals-scout-feature-flags` | canonical (already ran once, 14:30) |
| `signals-scout-web-analytics` | canonical |
| `signals-scout-product-analytics` | canonical |
| `signals-scout-experiments` | canonical — **enabled in this pass** |
| `signals-scout-pictify-image-gen` | custom |
| `signals-scout-pictify-workflow-runs` | custom |

### Why the experiments scout was the one worth turning on

The wizard disabled it as redundant with `signals-scout-feature-flags`. It isn't, for this project specifically: `welcome-experiment-a` has had **broken assignment coverage for five consecutive weekly reads** (64% of signups fire `welcome_assigned`, should be ~100%) and it was only ever caught by a human reading a check-in report. Exposure stalls and sample-ratio mismatch are exactly this scout's remit. It is the one automation here that would have caught a failure this project actually had.

Related known gap it should surface: the `url-tool-capture-flow-v1` flag is still live with losing arms serving traffic — the winner is hardcoded in code but the flag archive is pending deploy (see `growth-experiments/experiments.csv`).

---

## What happens next

1. The scout coordinator picks up the new configs within ~30 minutes and dispatches the first runs.
2. Each enabled scout runs once daily by default; each run draws one from the 24-run daily budget.
3. The first two runs of each custom scout will build their baselines and close out empty — findings start on the third run.
4. Reports cluster into your [Self-driving inbox](https://us.posthog.com/project/55738/inbox). Immediately-actionable ones can auto-start coding tasks with GitHub access.
5. If the run budget feels tight, email team-self-driving@posthog.com to request more runs.
