# Pictify Activation Experiment Portfolio

**Created:** 2026-06-03 · **Mechanism:** PostHog feature flags read in Svelte · **Status:** all 6 created as **draft + dormant** (flags inactive) in PostHog project `55738`.

Baseline data: [`00-funnel-diagnosis.md`](./00-funnel-diagnosis.md). Tracking sheet: [`experiments.csv`](./experiments.csv). Week-1 read playbook: [`03-one-week-checkin.md`](./03-one-week-checkin.md).

> **Nothing is live.** Each experiment's feature flag is set to `active:false`. The gated code is written and defaults to **control**, so even after you deploy, users see today's experience until you launch each experiment in PostHog. See **Launch steps** at the bottom.

---

## The binding constraint (read first)

**~21 signups/week.** Any metric *downstream of signup* cannot reach statistical significance in one week. So the portfolio is split:

- **Powered TOFU experiments** (tool pages, hundreds/week) → a real 1-week significance read, and they pump more users into the post-signup funnel.
- **Post-signup experiments** → judged on a **leading/proxy metric** + assignment health at week 1, run **longer** (2–8 weeks) for significance. **Max 1–2 post-signup experiments run at once** so they don't split the same ~21/week.

---

## Portfolio at a glance

| # | Experiment | Flag (PostHog exp id) | Stage | Variants | Primary metric | Powered in 1wk? | Run |
|---|---|---|---|---|---|---|---|
| 1 | URL tool: kill the dead-click | `url-tool-capture-flow-v1` (374736) | Acquisition | control / guided-capture / auto-capture (50/25/25) | rageclick rate per `tool_opened` | ✅ **yes** | Week 1 |
| 2 | Post-gen signup CTA | `tool-signup-cta-v2` (374737) | Signup | control / inline-value-prop / sticky-bar (34/33/33) | `tool_signup_click` per guest gen | ~ directional | Week 1 |
| 3 | Value-first activation (/welcome) | `welcome-experiment-a` (374738) | Activation | control / welcome (50/50) | `api_render_completed` | ❌ assignment-health only | Week 1 (solo post-signup) |
| 4 | Reframe intent wizard | `onboarding-value-first-skip` (374739) | Activation | control / value-skip (50/50) | `Personalization Completed` | ❌ | Sequenced |
| 5 | Dashboard checklist reorder | `dashboard-checklist-value-first` (374740) | Activation | control / value-first (50/50) | `checklist_step_cta_clicked` | ❌ | Sequenced |
| 6 | Email verification copy | `verify-copy-v1` (374741) | Activation | control / value-unlock (50/50) | `email_verified` | ❌ (maybe defer) | Sequenced |

---

## Sequencing & collision plan

**Week 1 — run concurrently:**
- `url-tool-capture-flow-v1` + `tool-signup-cta-v2` both live on `/tools/url-to-image-generator` but on **different surfaces** (Capture button vs post-result CTA) and **different primary events** (`$rageclick` vs `tool_signup_click`), so they're analyzable in parallel. Randomized independently; read each on its own primary only; don't touch the running `tool-prefilled-example-v1`.
- `welcome-experiment-a` runs **alone** among post-signup tests — it redefines the cohort for every other post-signup experiment, so it must validate first.

**Sequenced (after `welcome-experiment-a` shows healthy assignment, ~2–3 wks; run ONE at a time, never overlapping welcome):**
- `onboarding-value-first-skip` → its cohort is redefined by the welcome redirect.
- `dashboard-checklist-value-first` → shares dashboard population; weak read; needs the `dashboard_page_viewed` fix already shipped.
- `verify-copy-v1` → instrumentation ships now; the A/B may be too low-traffic to ever read — defer the copy test, keep the measurement.

**PLG coordination (pic-30 upsell engine):** the tool CTAs are guest-only and the PLG usage-banner/proactive-modal are logged-in-only — no on-screen collision on tool pages. But **suppress the pic-30 proactive modal / usage banner on a new user's first `/welcome` session and first dashboard paint** while the welcome/onboarding tests run, so two "look here" treatments don't fight. Confirm with the pic-30 owner before launching #3/#4.

---

## Ship-regardless instrumentation (already in the diff, ungated — land independently of any flag)

These are bug/measurement fixes, not experiments. They are live the moment you deploy (no flag needed):

1. **`dashboard_page_viewed`** now fires on the main `/dashboard` route (`dashboard/+page.svelte`). Fixes the fake ~0.4% reach.
2. **`welcome_wizard_viewed`** fires on `WelcomeWizard` mount — the wizard impression is now *measured*, so the >50% skip rate is real, not inferred.
3. **Email-verification tracking** (had zero before): `verify_banner_shown`, `verify_wall_shown` (5 gated paths), `verify_resend_clicked/succeeded/failed`; `email_verified` enriched with `source`.
4. **`checklist_step_cta_clicked`** on the Getting-Started checklist CTAs — the checklist had no conversion signal at all.
5. **`login.svelte` flag-await fix** (prerequisite for #3): new signups now `await posthog.onFeatureFlags()` (1.5s timeout) before reading `welcome-experiment-a`, and fire `welcome_assigned` for **both** arms. Without this, a freshly-identified user reads `undefined` → everyone falls to control.

---

## Per-experiment detail

### 1. `url-tool-capture-flow-v1` — kill the dead-click (P0, powered) 🟢
**File:** `src/routes/tools/url-to-image-generator/+page.svelte`
**Why:** verified #1 rageclick hotspot — the green Capture button is gated on `!url || !iframeElement || isImageGenerating`, but `iframeElement` is truthy on mount, so it *looks* clickable before any preview exists; clicking fires a warning toast → users hammer it (785 rageclicks / 116 users / 30d).
- **control** — legacy disabled logic (today's behaviour).
- **guided-capture** — Capture gated on the real precondition `isPreviewLoaded`; "Load the preview first…" helper + loading chip; scrolls the Capture button into view on load. Mitigation: `isPreviewLoaded` is also set after a successful HTML fetch, so CORS-quirky pages that never fire iframe `load` aren't stranded.
- **auto-capture** — after a *user-initiated* preview load, auto-fires one capture (fonts+rAF settle; reserves guest quota via `getRemaining() > 1`; never on the prefill auto-load). Button relabels to "Re-capture".
- **Primary (1-wk significance):** `$rageclick` rate per `tool_opened` on this path, treatments vs control.
- **Guardrail (daily):** `image_generated` per `tool_opened` per arm must not drop below control (kill that arm same-day — CORS-strand for guided, quota/quality for auto).

### 2. `tool-signup-cta-v2` — post-generation signup CTA (P0) 🟢
**Files:** `src/routes/tools/url-to-image-generator/+page.svelte`, `src/lib/components/tools/StickySignupBar.svelte`
**New flag key** (the old `tool-signup-cta-experiment` was killed 2026-04-21 — reusing it contaminates via sticky localStorage buckets). StickySignupBar is now driven by the parent's resolved variant.
- **control** — no post-gen CTA. · **inline-value-prop** — "Like it? Automate it." card. · **sticky-bar** — fixed bottom signup bar.
- **Primary:** total `tool_signup_click` per qualifying guest (net additivity), arms vs control. **Directional** at 1 wk (~30 signup-clicks/wk total); winner at ~2–3 wks.
- **Guardrail:** `content_copied` + `content_downloaded` for guests must not drop; on ≤414px the sticky bar must not cover the Capture button.

### 3. `welcome-experiment-a` — value-first activation (P0, directional) 🟡
**Files:** `src/lib/components/auth/login.svelte` (+ existing `src/routes/welcome/+page.svelte`)
**Why:** `/welcome` is a built, polished activation page (auto-issues an API key, rehydrates the last render, one-click "Run this now" → `api_render_completed`) that **was never shown** because this flag never existed.
- **control** — → `/dashboard` (today). · **welcome** — → `/welcome`.
- **1-wk read = ASSIGNMENT HEALTH ONLY:** `welcome_assigned / signup_completed ≈ 50%` (proves the flag-await fix works) and `welcome_viewed / welcome_assigned` high (proves the redirect lands). Directional proxy: `welcome_curl_run_succeeded / welcome_viewed`. **No** significance read on `api_render_completed` for 6–8 wks.
- **Guardrail:** `welcome_skipped` share — if most welcome-arm users bail straight to the dashboard, the value-first bet is failing.

### 4. `onboarding-value-first-skip` — reframe the intent wizard (P1, sequenced) 🟡
**Files:** `src/lib/components/onboarding/WelcomeWizard.svelte` (+ store)
- **control** — current dense intent wizard. · **value-skip** — headline "Your API key is ready — what should we set up first?"; "Skip for now" → "Just show me my API key →" (fires `personalization_skip_to_value_clicked`).
- **Primary:** `Personalization Completed` per `welcome_wizard_viewed`. **Do NOT** read `Completed/(Completed+Skipped)` — the reframe inflates the skip denominator by design. Guardrail: `Onboarding Dismissed` must not rise.

### 5. `dashboard-checklist-value-first` — checklist reorder (P2, sequenced) 🟡
**Files:** `src/routes/dashboard/+page.svelte`, `src/lib/components/onboarding/GettingStartedGuide.svelte`
- **control** — current step order. · **value-first** — for `api-integration`/`no-code` intents, the "generate your first image" step is sorted first and renumbered.
- **Primary:** `checklist_step_cta_clicked` CTR by arm (new event — ships ungated as the conversion signal the checklist never had). Guardrail: `Onboarding Dismissed` must not rise.

### 6. `verify-copy-v1` — email verification copy (P2, sequenced / maybe-defer) 🟡
**Files:** `src/lib/components/dashboard/VerifyEmailBanner.svelte`, `EmailVerificationRequired.svelte`, `verify-email/+page.svelte`
- **control** — existing copy. · **value-unlock** — "Verify your email to unlock API rendering."
- **The instrumentation half ships ungated now** (it's the only part with 1-wk value). The copy A/B is deferred — the surface may be too low-traffic to ever reach significance. Guardrail: resend 429 / complaint rate.

---

## Launch steps (you do these — manual deploy, per your instruction)

For each experiment, in order, when you're ready:
1. **Deploy the frontend** (the gated code; all flags default to control, so deploying is safe and changes nothing yet).
2. In **PostHog → Experiments**, open the experiment (IDs above), **set its feature flag `active`**, and **Launch** it (sets the start date + begins metric collection).
3. Record the launch date in `experiments.csv` (`started_on`).
4. **Week 1:** run the queries in [`03-one-week-checkin.md`](./03-one-week-checkin.md), fill `result_week1` + `decision`.

**Recommended launch order:** ship instrumentation + deploy → launch #1 and #2 (TOFU, powered) → launch #3 solo → after #3 validates, launch #4, then #5, then (maybe) #6.

> Sequenced experiments #4–#6 were created with a **valid placeholder primary** (on an existing event) because PostHog rejects metrics on not-yet-ingested events. Once their new events (`welcome_wizard_viewed`, `checklist_step_cta_clicked`, `verify_banner_shown`) have flowed for a day post-deploy, **swap the primary metric** in the PostHog UI to the upgraded one noted in each experiment's description.
