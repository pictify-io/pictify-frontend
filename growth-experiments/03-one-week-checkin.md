# One-Week Check-In Playbook

Run this ~7 days after launching each experiment. Fill `result_week1` + `decision` in [`experiments.csv`](./experiments.csv).

> **Remember the power constraint:** only `url-tool-capture-flow-v1` is powered for a real significance call in a week. Everything post-signup is a **directional / assignment-health** read — don't kill a post-signup experiment on week-1 numbers alone.

---

## Setup (run queries against PostHog)

```bash
export PH_KEY="<your PostHog personal API key — phx_…>"   # do NOT commit this
export PID=55738
q() {  # usage: q "SELECT ..."
  python3 -c "import json,sys;print(json.dumps({'query':{'kind':'HogQLQuery','query':sys.argv[1]}}))" "$1" \
  | curl -s -H "Authorization: Bearer $PH_KEY" -H "Content-Type: application/json" \
      -X POST "https://us.posthog.com/api/projects/$PID/query/" --data @- \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print('cols:',d.get('columns'));[print(r) for r in d.get('results',d.get('detail'))]"
}
```

The variant a person saw is on each event as `properties['$feature/<flag-key>']`. Replace `START` with the launch timestamp (e.g. `'2026-06-10'`).

**Also read PostHog's native results:** Experiments → open the experiment → the configured Bayesian metric shows per-variant conversion + probability-to-beat-control. The HogQL below is for the ratio/guardrail reads the native single metric can't express.

---

## 1. `url-tool-capture-flow-v1` — THE powered read

```sql
SELECT properties['$feature/url-tool-capture-flow-v1'] AS variant,
       uniqIf(person_id, event='tool_opened' AND properties.tool_name='url_to_image_generator') AS opened,
       uniqIf(person_id, event='$rageclick' AND properties['$pathname']='/tools/url-to-image-generator') AS ragers,
       round(100.0*ragers/opened, 2) AS rage_pct,
       uniqIf(person_id, event='image_generated' AND properties.tool_name='url_to_image_generator') AS generated,
       round(100.0*generated/opened, 2) AS gen_pct
FROM events
WHERE timestamp >= START AND properties['$feature/url-tool-capture-flow-v1'] != ''
GROUP BY variant ORDER BY variant
```
**Decision:** `rage_pct` should drop sharply for `guided-capture` (and `auto-capture`) vs `control` → **ship the winner**. **GUARDRAIL (check daily, not just wk-1):** if `gen_pct` for either treatment falls below control → **kill that arm same-day** (a rageclick win with a capture-count loss is a net loss).

## 2. `tool-signup-cta-v2` — directional (call winner ~2–3 wks)

```sql
SELECT properties['$feature/tool-signup-cta-v2'] AS variant,
       uniqIf(person_id, event='image_generated' AND properties.tool_name='url_to_image_generator') AS gens,
       uniqIf(person_id, event='tool_signup_click') AS signup_clicks,
       round(100.0*signup_clicks/gens, 2) AS click_per_gen_pct,
       uniqIf(person_id, event='signup_completed') AS signups
FROM events
WHERE timestamp >= START AND properties['$feature/tool-signup-cta-v2'] != ''
GROUP BY variant ORDER BY variant
```
**Decision:** highest `click_per_gen_pct` arm leads; confirm `signups` trends with it. **Guardrail:** compare `content_copied`+`content_downloaded` across arms — must not drop. Don't finalize at week 1 (~30 clicks/wk total).

## 3. `welcome-experiment-a` — ASSIGNMENT HEALTH only

```sql
SELECT
  countIf(event='signup_completed') AS signups,
  countIf(event='welcome_assigned' AND properties.variant='welcome') AS assigned_welcome,
  countIf(event='welcome_assigned' AND properties.variant='control') AS assigned_control,
  countIf(event='welcome_viewed') AS welcome_viewed,
  countIf(event='welcome_curl_run_succeeded') AS curl_ok
FROM events WHERE timestamp >= START
```
**Pass criteria (this is the whole week-1 goal):** `assigned_welcome / signups ≈ 50%` (proves the flag-await fix + assignment work) AND `welcome_viewed / assigned_welcome` is high (redirect lands). If assignment ≈ 50% → **keep running ~6–8 wks** for the real `api_render_completed` read. If ~everyone is `control` → the flag isn't assigning; debug before trusting anything. **Guardrail:** `welcome_skipped / welcome_viewed` not too high.

## 4–6. Sequenced — instrumentation sanity + directional

First confirm the new events fire (run after deploy, before launching the A/B):
```sql
SELECT event, count() c, uniq(person_id) u FROM events
WHERE timestamp >= START AND event IN
 ('welcome_wizard_viewed','personalization_skip_to_value_clicked','checklist_step_cta_clicked',
  'verify_banner_shown','verify_wall_shown','verify_resend_clicked','dashboard_page_viewed')
GROUP BY event ORDER BY c DESC
```
- **`onboarding-value-first-skip`:** `Personalization Completed` per `welcome_wizard_viewed`, split by `properties['$feature/onboarding-value-first-skip']`. Guardrail: `Onboarding Dismissed` flat.
- **`dashboard-checklist-value-first`:** `checklist_step_cta_clicked` CTR by `properties['$feature/dashboard-checklist-value-first']`. Needs `dashboard_page_viewed` confirmed firing.
- **`verify-copy-v1`:** likely too low-volume for a call — report `verify_banner_shown`/`verify_wall_shown` counts; if impressions are tiny, **defer the copy A/B** and keep only the instrumentation.

> After day-1 of data, swap experiments #4–#6 to their **upgraded primary metric** (the new event) in the PostHog UI — they were created with a placeholder primary on an existing event because PostHog rejects metrics on not-yet-ingested events.

---

## Roll-up to fill each week

For every launched experiment, write into `experiments.csv`:
- `result_week1`: the key ratio(s) per arm + whether the guardrail held.
- `decision`: `ship <variant>` / `keep running` / `iterate` / `kill <arm>` / `defer`.
