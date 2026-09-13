# Design plan — Customer ROI recap wedge (P0 only)

Date: 2026-09-05. Source: `~/.gstack/projects/front-end-html-to-gif/suyashthakur-master-design-20260905-014627.md` and the "Redesign Decision" that followed it. Branch: `worktree-redesign-v2`.

## What the research decides, in design terms

- The wedge is **customer ROI recaps** for B2B SaaS customer-marketing teams: one on-brand recap per customer, from a CSV, for renewal and adoption campaigns. Externally we say "customer ROI recap"; never "customer proof media".
- The redesign already has the presentation layer (recap film, Moments 01, onboarding recap prompt, metric video starter). **Adapt, don't replace.** No new nav item, no `/solutions/customer-roi-recaps`, no homepage repivot, no nineteenth tool.
- **Format neutrality is a hard rule.** Static cards and paired video+card must be equally visible everywhere the recap appears. Video is not "the winner" until two of the first three paying buyers pick the paired proof without a discount.
- The first value moment is "ten real customer recaps approved", not "template created". Design should make a ten-row preview feel like the natural first step.
- Every capability claim on the site must be true today.

The changes below are small by design. Each one names the surface, what changes, and what stays.

## D1 — Make the recap example outcome-driven

**Surfaces:** `src/lib/components/landing/VideoSection.svelte` (scenes + "the row that filled it"), `src/lib/components/landing/Moments.svelte` (moment 01 overlay + copy).

**Rule the section already enforces:** nothing on screen may come from data the row doesn't hold. So the row switches to the proof schema and the scenes are composed only from it.

The row (shown beside the player):

| token | value |
|---|---|
| `{{company_name}}` | Northwind |
| `{{metric_value}}` | 312 |
| `{{metric_label}}` | hours saved |
| `{{comparison_period}}` | Q2 |
| `{{comparison_value}}` | +38% |

(`external_customer_id` exists in the schema but is not rendered; show it in the row as `cus_8k2a` in mute so the schema on screen is the real one.)

Scenes, same three-beat structure and colours as today:

1. Blue: kicker "Your Q3 with Pictify" (the sender's brand, not Northwind's), head "Northwind saved 312 hours.", sub "+38% on Q2."
2. Ink: kicker "Hours saved", head "312", sub "Across every workflow you ran."
3. Field: kicker "vs Q2", head "+38%", sub "Nice quarter, Northwind."

Moments 01: keep the title and the "one per user" frame, but the overlay becomes the card version of the same row: label "Q3 recap", value "312 h saved", sub "Northwind · +38% vs Q2". Body: "Customer ROI recaps, milestone cards, streaks, certificates. Every product with customers gets asked for this, usually before a renewal." ICP line gains "B2B SaaS · customer marketing" at the front.

Wording: "customer ROI recap" everywhere; "hours saved" as the lead metric because it is the most legible; the other five candidate metrics (workflows automated, adoption increase, revenue influenced, support time reduced, QoQ change) appear only as chips in the onboarding prompt (D2), not on the homepage.

## D2 — Static and paired, equally visible (format neutrality)

**Surface:** `VideoSection.svelte`, the player block.

Today the section is the film alone, which quietly positions video as the answer. Add the **paired output** to the same block: to the right of the film, the PNG share card rendered from the same row, labelled `SAME ROW · AS A CARD`. Two outputs, one row. The section heading stays ("Same variables. Now it moves.") because it is about the variables, but the CTA strip changes:

- text: "One row. A card, or a card and a film."
- action: "Start a customer ROI recap" → `/signup?intent=customer-roi-recap&redirect=%2Fonboarding%3Fintent%3Dcustomer-roi-recap`
- link: "See the schema" → anchors to the row (no new page)

The homepage never says "video first" or "card first". Where the two are listed, alternate the order between VideoSection (film, card) and Moments 01 (card, film) so neither reads as primary.

## D3 — Attributable start path

```
Homepage recap example → /signup?intent=customer-roi-recap
  → /onboarding?intent=customer-roi-recap (prefilled prompt)
  → first recap template (static or paired)
  → first render (ten-row preview)
```

**Surfaces:** `src/lib/components/auth/login.svelte` (already carries `?redirect=`; pass `intent` through it), `src/routes/onboarding/+page.svelte` (read `intent` from the URL, seed `prompt`), `src/lib/components/onboarding/v2/PickStep.svelte`.

PickStep with intent present:

- A one-line mono strip above the prompt: `FROM THE ROI RECAP EXAMPLE · WE'LL START YOU THERE` with a quiet "Start blank instead" link. No banner, no modal.
- Prompt prefilled: "A customer ROI recap for each customer: {{company_name}} saved {{metric_value}} {{metric_label}} this quarter, {{comparison_value}} vs {{comparison_period}}. On-brand, one per row of a CSV."
- The seed row swaps "A wrapped-style recap video" for "A customer ROI recap" (format-neutral), and the four seeds include one metric chip row underneath: `hours saved · workflows automated · adoption · revenue influenced · support time` — tapping one rewrites the metric words in the prompt.
- A **Format** segmented control (Card · Card + film) sits under the prompt, default **unselected** so the choice is observed, not defaulted. It writes `recap_format_selected`.
- The template gallery highlights the two operator templates from D4 when intent is present; everything else stays.

No intent: PickStep is unchanged apart from the seed wording.

The onboarding "generate" path for intent users should land on the static template first and offer "Add the film" as a second step, again without defaulting.

## D4 — The two proof templates (operator-managed, same schema)

Design both as templates in the studio, not public gallery items. Schema for both, identical field names:

`external_customer_id · company_name · metric_value · metric_label · comparison_period · comparison_value`

**Static card (1200×630, PNG):** sender brand slot top-left (logo + name), `company_name` as the eyebrow, `metric_value` as the hero figure (Bricolage 800, ~180px), `metric_label` under it in mono caps, a comparison chip `▲ +38% vs Q2` in field on ink, the sender's footer line. Colour roles from the site tokens; brand colour overrides the field accent on paid tiers only.

**Video (15 s, MP4 + GIF):** the three scenes from D1, extended from `src/lib/video/starters.js` `metric` starter: rename tokens to the schema above and add the comparison scene. Poster frame = scene 2 so the thumbnail reads as a number.

Both get a **ten-row sample CSV** shipped with the template (synthetic companies), so "preview ten rows" is one click. I will draw both templates on Paper as the next step if you want them; they are the only new artwork in this plan.

## D5 — Instrumentation (where events fire)

Through `src/lib/telemetry.js` `track`. All carry `format` (`static` | `paired` | `unknown`), `source` (`homepage_video` | `homepage_moments` | `onboarding` | `studio`), `template_uid` and `campaign_id` when known.

| Event | Fires |
|---|---|
| `recap_intent_clicked` | CTA in VideoSection / Moments 01 |
| `recap_prompt_started` | PickStep prompt focused or seed tapped with intent present |
| `recap_format_selected` | Card / Card + film segmented control |
| `recap_template_created` | onboarding generates from the intent prompt, or an operator template is duplicated |
| `recap_first_render_completed` | first successful render of a recap template (ten-row preview counts) |
| `recap_output_downloaded` | download or copy-URL on a recap output |

Deposits and rollouts stay manual.

## D6 — Finish the email retirement (design of the replacement)

**Surfaces:** `src/routes/dashboard/workflows/new/+page.svelte`, `src/routes/dashboard/workflows/[uid]/+page.svelte`, `src/api/workflow.js`.

The wizard's "Deliver" step (download vs email column) becomes an **Outputs** step with three quiet options, none of which send anything:

1. **Download** — zip of files + `manifest.csv` (`external_customer_id, format, url, status, error`).
2. **Copy URLs** — the manifest as a table with per-row copy; the campaign id at the top.
3. **Send it from your own tool** — Customer.io, Braze, HubSpot, n8n, Zapier as logo links to docs (recipes come in P2). Copy: "Pictify renders. Your lifecycle tool sends."

Remove the email column picker and the `emailKey` webhook option. Same on the run page: the "Sent" column becomes "Output" with the URL, and the completed-run panel shows the manifest download. This is one atomic change across the three files.

## D7 — Remove unsupported claims (copy audit)

Until the backend gate passes, these sentences change or go. Found on the branch today:

| File | Claim | Change to |
|---|---|---|
| `src/routes/tools/certificate-generator/+page.svelte:848` | "Re-run any single row on its own if a value was wrong" | "Fix the row and run the batch again." |
| `src/routes/tools/certificate-generator/+page.svelte:162` | "signed webhook" | "webhook" |
| `src/lib/pseo/comparisons.js:2270, 2462, 2594` | "signed webhooks … on every plan" | "webhooks" |
| `src/lib/pseo/comparisons.js:289, 922` | "permanent CDN links / permanent URLs" | "hosted URLs" (retention to be documented) |
| `src/lib/pseo/comparisons.js:2311, 2454, 2534` | per-row rerun / "every webhook event" | "batch status and per-row results" |
| `src/lib/pseo/useCaseHtmlTemplates.js:401` | "every webhook" | drop the sentence |

Also: no throughput or recipient counts anywhere ("1,000 recipients", "renders a minute"); no "white-label share pages" until the share page ships branding; no "storage connectors receive workflow outputs" until wired. The homepage itself is clean on these terms; the risk is in comparisons and the certificate tool.

## Not in this plan

P1 backend blockers (unique `externalCustomerId`, idempotency, stable item ids, retries, manifest export, retention docs, share-link revocation, MP4 webhook/share defects) and P2 productisation. They are tracked in the source doc; none of them needs design work now, except that D6's manifest and D4's schema should match what P1 will enforce, which is why both use `external_customer_id` as the first field.

## Order of work

1. D7 copy audit (an hour, zero risk, removes liability).
2. D1 + D2 homepage example and paired output.
3. D3 intent path and PickStep.
4. D4 templates (Paper first, then studio).
5. D5 events, wired as each surface lands.
6. D6 workflows Outputs step, as one commit.

## Acceptance

- Homepage: the recap row shows the six-field schema; scenes and the card use only those fields; static and paired appear together with no "first" wording.
- Click-through from either recap CTA lands on onboarding with the prompt prefilled and the strip visible; format control starts unselected; `recap_intent_clicked` → `recap_prompt_started` → `recap_format_selected` fire in order.
- Both operator templates render the same ten-row sample CSV, outputs join on `external_customer_id`.
- Workflow wizard has no email delivery option; run page shows the manifest.
- `grep -rniE "signed webhook|permanent (cdn|url)|re-?run any|every webhook|white-?label share|recipients"` over `src/` returns nothing in public copy.
