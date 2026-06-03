# Pictify Post-Signup Drop-off — Funnel Diagnosis

**Pulled:** 2026-06-03 · **Source:** PostHog (US cloud, project `55738`) · **Windows:** 30d / 90d as noted

> Goal: find where users drop after signup and design experiments to lift activation.
> This doc is the data baseline. Experiment specs live in `02-experiment-portfolio.md`; tracking in `experiments.csv`.

---

## TL;DR — where the leak is

1. **~80% of signups never reach a value moment.** Of the 273 users who signed up in the last 90 days, only **20.5% ever generated an image while logged in** and only **13.6% entered onboarding**.
2. **Onboarding is weak and skippable.** Of users who reach personalization, **>50% skip it** (29 skipped vs 25 completed in the 7-day cohort).
3. **Email verification is nearly dead:** only **~3%** of signups verify their email within 7 days (8 of 273).
4. **The #1 free tool is a rage-click magnet:** `/tools/url-to-image-generator` logged **785 rage-clicks from 116 users** in 30 days — more than every other page combined.
5. **Volume is the binding constraint:** **~21 signups/week.** Post-signup experiments **cannot** reach statistical significance in one week — only top-of-funnel (tool-page) experiments can. See *Statistical power* below.

---

## Post-signup activation funnel (cohort: signed up in last 90 days, n = 273)

| Step | Event | Users | % of signups |
|---|---|---:|---:|
| Signed up | `signup_completed` | 273 | 100.0% |
| Generated an image (logged in) | `image_generated` | 56 | **20.5%** |
| Entered onboarding | `onboarding_step_viewed` | 37 | **13.6%** |
| Completed personalization | `Personalization Completed` | 25 | 9.2% |
| First API render | `api_render_completed` | 17 | 6.2% |
| Created an API key | `api_key_created` | 4 | 1.5% |
| Viewed dashboard | `dashboard_page_viewed` | 1 | 0.4% ⚠️ |

⚠️ **`dashboard_page_viewed` is under-instrumented, not real.** `analytics.trackDashboardPage()` is only called on dashboard *sub-pages* (`template/render`, `activity-logs`, …), never on the main `/dashboard` route's `onMount`. The ~0% is a measurement bug. **Fix ships regardless of experiments** (see portfolio item `fix-dashboard-pageview-instrumentation`).

## What signups actually do in their first 7 days (same 90d cohort)

| Event | Users |
|---|---:|
| `login_completed` | 103 |
| `tool_opened` | 65 |
| `image_generated` | 51 |
| `onboarding_step_viewed` | 35 |
| `Personalization Skipped` | 29 |
| `tool_first_input` | 27 |
| `Personalization Completed` | 25 |
| `api_render_completed` | 16 |
| `email_verified` | 8 |
| `Onboarding Dismissed` | 4 |
| `api_key_created` | 4 |

**Read:** the real value path is **via the tools**, not the onboarding wizard (`tool_opened` 65 > `onboarding_step_viewed` 35). Yet most still never generate. Onboarding is something users route *around*.

## Rage-click hotspots (30d, by page)

| Path | Rage-clicks | Users |
|---|---:|---:|
| `/tools/url-to-image-generator` | **785** | **116** |
| `/tools/html-to-png` | 63 | 28 |
| `/tools/linkedin-banner-generator` | 33 | 12 |
| `/tools/og-image-generator` | 30 | 15 |
| `/tools/tweet-screenshot` | 19 | 10 |
| `/` (home) | 8 | 6 |
| `/template-workspace/html/create` | 6 | 4 |

**Likely culprit** (from code): on `url-to-image-generator`, the green **Capture** button is `disabled` until `url && iframeElement && !isImageGenerating`, and **Load Preview** gives no next-step feedback. Users click dead buttons while the iframe loads. This page is both the top acquisition surface and the top frustration surface.

## Statistical power — read this before planning

- **Signups: ~21/week** (273 / 90d; weekly range roughly 15–28).
- A 50/50 post-signup experiment gets **~10–11 signups per arm per week**. To detect even a large lift (e.g. 20% → 30% activation) at 80% power / 95% confidence needs **hundreds per arm**. → **No post-signup experiment can hit significance in a week.**
- **Top-of-funnel has volume:** `tool_opened` ~575/wk, `tool_first_input` ~338/wk, `image_generated` (mostly guests) ~380/wk, `tool_signup_click` ~30/wk. → **Tool-page experiments can show real signal in a week.**

**Implication for the portfolio:**
- Run **2–3 powered TOFU experiments** (tool pages) for a true 1-week read — these also pump more users *into* the post-signup funnel.
- Run the highest-leverage **post-signup experiments for directional signal**, judged at the 1-week checkpoint on a **leading/proxy metric** (e.g. "% of new signups who reach `image_generated` or `api_render_completed`"), with the intent to run them **longer** for significance.
- Cap concurrent post-signup experiments at **1–2** so they don't cannibalize the same ~21/week.

## Event taxonomy (confirmed firing, 30d volumes)

`signup_started` (149u) → `signup_completed` (122u) → `login_completed` (125u); `email_verified` (5u);
`tool_opened` (2304u) → `tool_first_input` (1351u) → `tool_signup_click` (116u);
`image_generated` (609u, incl. guests); `onboarding_step_viewed` (81u); `Personalization Completed/Skipped` (37/47u);
`api_render_completed` (20u); `api_key_created` (5u); `usage_banner_shown` / `proactive_modal_shown` (PLG, low);
`$rageclick` (227u).

## Existing PostHog feature flags / experiments (as of pull)

| Flag | State | Variants | Notes |
|---|---|---|---|
| `tool-prefilled-example-v1` | **running** (exp 367362, since 2026-04-22) | control / prefilled | Do not disturb |
| `create-image-home` | running (exp 31866, old) | control / test | Legacy |
| `tool-signup-cta-experiment` | flag exists, **inactive** | control / value-prop / social-proof | Code wired in `url-to-image-generator`; never launched |
| `tool-sticky-signup-bar` | flag exists, **inactive** | control / sticky-bar | Code wired in `StickySignupBar.svelte`; never launched |
| `welcome-experiment-a` | **flag missing** | (control / welcome in code) | `login.svelte` redirects new signups to `/welcome` if variant=`welcome`, but the flag was never created → dormant. `/welcome` is a built, polished activation page. |

> **Three half-built experiments** can be finished cheaply by creating/activating the flag — `welcome-experiment-a` is the highest-leverage near-zero-effort win.
