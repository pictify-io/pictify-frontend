# Campaigns — Paper design review

Reviewed September 5, 2026 against product specification v1.2. Source: [Pictify — Landing Redesign (Repro Shop), Page 1](https://app.paper.design/file/01KZQXXEZ2SNPWS5PN2FCF31PC/1-0). All 13 requested artboards were visually inspected through Paper; node structure and selected style/preset definitions were also inspected. This is a static design review, not a browser usability test, renderer test, or verification of deployed privacy and billing behavior. No Paper designs were modified.

## Verdict

Keep the visual direction and overall workflow. The focused Campaigns rail, restrained edition header, account-level results, explicit approval, complete-export gate and external-sender boundary are consistent with the agreed product. The designs need targeted revisions and several missing interaction frames before implementation sign-off. A new visual redesign or subdomain migration is unnecessary.

The strongest screens are the campaign list, partial-run table, package/handoff structure and configuration-only New period explanation. The weak points are recovery and edit interactions, inconsistent example data/states, privacy promises, output link behavior, and readable presentation at actual delivery sizes.

Notes labeled “OTHER STATES,” “STATE,” “AFTER SUBMIT,” and “PRESET RULES” are design annotations. They are useful specifications, but do not count as rendered alternate screens and must not ship as product copy. Some preset notes are outside the visible artboard and were found through node inspection.

## Required changes before implementation sign-off

### R01 — Complete Setup rather than implementing from summary chips

**Artboard BT7-0, D02/D03.** The screen already assumes a named campaign and populated metrics. “Edit,” “Add a third metric,” logo change, font choice and PDF selection have no corresponding detailed frames in the requested set.

Draw a metric-edit panel with key, customer-facing label, unit, precision, source owner, observed/estimated, required/optional, desired direction, comparison mode/prior-period label and approved methodology. Show missing-method and invalid-precision errors. Draw a fresh-campaign name field/state and PDF-selected state with A4/Letter. Add brand-name and content/next-action controls wherever these are configured; Northwind and “Open report” must not be uneditable sample constants.

Keep Save draft and Continue, but define unsaved, saving, saved and failed-save behavior. Replace “Nothing here is customer data”: brand names and custom methodology can themselves be sensitive; “Account metrics are uploaded in the next step” is precise.

### R02 — Finish the review/correction loop and make the example sequence consistent

**CJA-0, D06; CVB-0, D07.** Blocking approval for clipped account 00519 is correct. However, the next screen presents revision 1 as approved and the same account failing with render_overflow. If these frames depict one continuous scenario, that transition is impossible. Either fix the clipping and show successful reapproval before Generate, or use a different, previously unsampled account for the final-run overflow failure.

“Resolve in Data” is not sufficient for a legitimate long business name. Offer an explicit customer-facing display name while preserving account ID/original identity, or an approved preset layout adjustment. Do not force the user to falsify the source name. Any change must regenerate affected previews and invalidate the changed revision's approval.

Draw the full-size inspector: readable rendered output, account ID, selection rationale, text equivalent, overflow details, previous/next preview and review progress. Draw the clean all-previews-passed state and the approved-but-not-yet-generated state with the actual “Generate 248 summaries” action. The current six tiles plus “4 more previews below” do not implement access to all ten: render the remaining tiles in a real scroll region or provide explicit pagination. Distinguish “6 additional previews remaining” from “6 previews left to review.” Use min(10, eligible accounts) for small campaigns.

### R03 — Define the clickable action separately from the PNG

**DS1-0, OUT-01; BT7-0; D7Z-0.** “Open report” is drawn inside the PNG. A raster button is not an independently interactive email control. The preset annotation mentions CTA text + URL in the text equivalent, but the setup and handoff do not show how a buyer supplies, validates and applies that destination.

Preferred R1: keep the card as the visual summary and place a real text link/button in the buyer's email using the handoff example. If the button stays inside the image, explicitly demonstrate wrapping the whole image in one buyer-owned link and explain the click area. Decide whether destinations are campaign-level or account-specific; account-specific destinations require a defined optional mapped field, safe URL validation, snapshot/manifest treatment and recipient-preview checks. Neither path requires native email sending.

For PDF, specify whether the report URL is an actual PDF link annotation and test it in the renderer. Do not use an unverified real-looking host for sample navigation; use a non-live example destination or a verified demonstration destination.

### R04 — Correct retention and deletion wording

**D7Z-0, D08.** “Accepting starts the 7-day source deletion clock” and “After handoff accepted +7 days” omit the earlier 30-day ceiling. Show the effective date before confirmation: “Accepting now deletes source data on [date], or the existing deadline if sooner. Output expiry is unchanged.” After acceptance show actor, time and the resulting deadline. Do not let later acceptance appear to extend retention.

**DLG-0, D10.** “Backups purged within 35 days” is a new unverified promise. The spec explicitly requires checking actual backup lifetime. Replace the hardcoded value with a verified policy value before release; mark it unresolved in the design annotation until then. Identify the campaign, period and revision being deleted: August has both rev 1 and rev 2 in D09, while the dialog title and typed phrase identify only August. State whether the operation targets one revision or all revisions, matching the API contract. The destructive button also extends beyond the modal's right edge in the inspected frame; fix footer sizing.

**BZH-0, D04.** “Ignored values are not stored” requires a concrete ingest contract. The spec also describes raw upload retention. Resolve whether client-side selection excludes unmapped data before upload, or the server briefly receives the file and persists only a sanitized source. Do not retain an untouched original and simultaneously promise ignored fields were never stored. This is a design/technical contract clarification, not proof of a current backend defect.

### R05 — Correct row accounting and recovery affordances

**CA0-0, D05.** The strip shows 250 input = 243 valid + 2 blocking + 3 needing decisions + 2 excluded. The side summary “Eligible accounts 243 · if errors fixed” mixes the current count with a hypothetical future count. Show “243 currently eligible; 5 unresolved; 2 excluded,” then update after actual decisions. Clarify whether counts refer to rows, unique accounts or issues. Duplicate ID 00042 affects rows 41 and 188; show both rows and count them consistently. The “Issues 7” filter must specify whether exclusions are included and how many results are shown.

Draw the exclude-with-reason interaction and re-include behavior, plus at least one actual failed-upload state. Present full field/error text in an inspector when the table truncates it. Avoid relying on the same neutral dropdown to stand for unrelated decisions without clear labels.

### R06 — Make allowances and retries understandable

**Shared rail, D07, landing offer.** The rail remains “0 / 250” when 245 and then 248 outputs are ready. Synchronize it with campaign usage and distinguish reserved from used where necessary. “FREE PLAN” alongside a paid pilot may be technically true for platform billing but is confusing without scope: label “Platform: Free” and “Campaign pilot: active,” or remove unrelated plan emphasis from the campaign rail.

D07 correctly offers “Retry 2 failures” for two transient failures and “Revise edition” for overflow. Explain why a manual retry is available after “3 of 3” automatic attempts, what allowance remains and whether support is needed. “Attempts are metered; each account is charged once” mixes internal compute monitoring with customer billing. Prefer “Retries of this approved version do not consume another account allowance,” only if that is the actual policy. Define revised-edition allowance treatment rather than implying unlimited free corrections. Landing “retries included” must match the bounded policy.

### R07 — Improve readable text and control states

Paper styles confirm recurring 10–11px monospaced metadata and light muted text. Calculated color contrast on white: mute #8A8A85 is approximately 3.47:1; proof green #00BE43 is approximately 2.49:1. These are below the spec's ordinary-text contrast target. The green is used for tiny DONE/READY text as well as status indicators.

Use darker text for meaningful status and retention information, keeping green as an accompanying marker. Use approximately 13–14px for operational helper text/table labels where possible; reserve tiny decorative labels for genuinely nonessential content. Add explicit checked ticks/radio states: a lime square alone is an ambiguous selection cue. Verify focus, disabled explanations and dialog focus return in implementation.

OUT-01 uses 22–24px source labels, which become 11–12px at 600px display and roughly 6–7px at 320px. Large metrics remain visible, but methodology, period and next action become difficult to read. Draw actual 600px and 320–360px email placements with accompanying real text. Increase essential source text and reduce card copy; use HTML/text for longer methodology. The JPG/PNG screenshot alone cannot establish email-client compatibility or final file size.

## Screen-by-screen disposition

| Design / Paper ID | Disposition | Specific follow-through |
|---|---|---|
| D01 list — BPC-0 | Keep, refine | Clear next actions and synthetic separation. Make row opening and inline actions distinguishable; default-hide archived entries behind a filter. Draw real empty/load/access variants separately from annotations. Sync allowance and scoped plan labels. |
| D02/D03 Setup — BT7-0 | Needs interaction frames | R01; show campaign naming, metric editor, PDF paper choice, brand/content controls, save errors and entitlement-restricted format choice. |
| D04 upload/mapping — BZH-0 | Good foundation | R04/R05; add pre-upload drop zone, parse/upload progress/failure, large-column handling and replace-file confirmation when it invalidates previews. |
| D05 review — CA0-0 | Needs count/decision fixes | R05; distinct unresolved vs excluded accounting, complete duplicate identity, exclusion reason and revalidation states. |
| D06 previews — CJA-0 | Not complete for approval handoff | R02; full-size inspector, all ten reachable, corrected/approved state, clear additional-preview allowance, actor/role variants. |
| D07 partial run — CVB-0 | Strong structure, revise details | R02/R06; consistent revision story, friendly error labels with technical codes in details, manual retry explanation, draw cancel/reconnect/ready variants. |
| D08 export — D7Z-0 | Strong structure, revise trust/action details | R03/R04; effective retention deadline, accepted state, real link/text handoff, package-building/error/expired variants. Rename “Manifest only (.json)” to “Download manifest (.json)” if it is an additional download rather than mode selection. |
| D09 New period — DHL-0 | Keep, complete interaction | Good history/config-only copy. “New period” should open date selection and detect an existing matching draft; use “Resume September” when that is the actual next action. Do not unconditionally resume September when user intends October. Draw period selection, duplicate match and configuration-diff detail. |
| D10 deletion — DLG-0 | Correct confirmation details | R04; revision identity, verified backup policy, footer fit and actual pending/failed/purged states. Typed confirmation is reasonable for this broad destructive operation. |
| Experience/access — DQG-0 | Correct separation, incomplete states | Keep one account and optional experience selection. Add visible active team, prefill known identity, request-pending/revoked distinction, permission-denied state, multi-team choice and unsaved-switch prompt. Avoid presenting a revoked pilot as a fresh application. |
| OUT-01 PNG — DS1-0 | Clean visual base, revise delivery fit | R03/R07; actual email-size readability, actionable link outside raster, one/three-metric and long-name examples. Preset notes define variable heights; the 1200×800 frame represents only the two-metric variant. |
| OUT-02 PDF — DSU-0 | Strong base, minor content/variant work | A4 frame is approximately correct proportions, not proof of PDF page settings. Draw Letter and long content/three-large-metric variants. Confirm selectable text/link behavior. Reconcile methodology: 1,284 × 14.6 minutes / 60 = 312.44 hours, which rounds to 312.4 at one decimal, not the shown 312.5; use internally consistent synthetic inputs. |
| Landing — DU4-0 | Correct proposition, needs polish before publication | See marketing changes below. |

## Marketing changes

The landing page correctly shows two synthetic accounts, limits, external sending, a pilot offer and relevant FAQs. Keep this structure and specific CS/Lifecycle audience.

1. Put “Request pilot access” and “See a sample” directly below the hero explanation. The current hero has no local action; only the small header CTA is visible there. Reduce the decorative pixel area or bring a real output crop into the hero so the product is evident sooner.
2. Replace the four “INTERFACE EXCERPT” placeholders with actual crops of the reviewed UI. Move production instructions such as “label them Prototype if published earlier” and “claims here are published only after tests pass” into design annotations. For a public prototype, label the illustration simply “Prototype” and avoid asserting unverified capabilities in surrounding copy.
3. Prefer “Review a sample before you export” over “Ten real previews before anyone sees a thing.” Pictify cannot enforce what the buyer sends outside the app, and campaigns smaller than ten accounts have fewer previews. “Ten representative previews” can remain qualified detail for larger audiences.
4. Reconcile offer copy: ten included previews versus D06's six additional previews, and bounded retries versus “retries included.” Define what the grant actually includes before publishing.
5. Make retention explicitly “whichever comes first.” Publish the two-working-day reply promise only if the founder adopts that response commitment. The form should show confirmation, pending state and recoverable errors.
6. “Any tool that takes a file” is too broad for automated account-to-recipient personalization. State manual transfer and account matching plainly; avoid implying that every listed sender imports this manifest or automatically places every image. Demonstrate one real two-account handoff before making specific compatibility claims.
7. Keep the existing shared footer, but use a relevant Campaigns line alongside the developer proposition. The campaign buyer should not finish on “A template declares variables” as the sole explanation of Pictify.

## Minimum additional design evidence

Produce these before calling the design set implementation-ready; do not redraw every screen:

- Metric edit/add, fresh campaign naming and PDF-selected setup.
- Preview inspector/text tab, corrected preview and approved/pre-generation state.
- Exclusion reason, corrected/revalidated data and actual upload-error state.
- Retry exhaustion/revised-edition, cancellation and reconnected run variants.
- Accepted handoff with effective deadlines, export failure/expired state and revision-specific deletion confirmation.
- New-period date selection/existing-draft handling; multi-team, request-pending, revoked access and unsaved experience switch.
- At least a 1024px edition layout, 390px list/review/export/access/landing examples, plus 200% zoom behavior notes. All ten requested app frames inspected are currently 1440×900 desktop frames. Notes alone do not prove responsive usability.
- PNG at delivered desktop/mobile email size and one/three-metric extremes; PDF long-content and Letter example. Keep neutral/zero/negative/Unicode fixtures consistent across samples.

## What remains an implementation check

Native control semantics, keyboard flow, announcements, client performance, real font loading, output filesize, PDF links/text, actual privacy/backup deletion, idempotency and billing cannot be approved from static artboards. Link those checks to the product spec's QA and UXA cases during implementation.

Proceed with the shell and established layout direction. Resolve R01–R07 and the missing critical interaction frames before freezing renderer, approval, deletion and handoff contracts. These are focused corrections to a sound direction, not a reason to restart design.
