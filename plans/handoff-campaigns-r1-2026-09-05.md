# Handoff — Customer value campaigns R1: design boards + task breakdown

Date: 2026-09-05. Source of truth for behaviour: `plans/customer-value-campaigns-product-spec-2026-09-05.md` (v1.2). This document breaks that spec into design and engineering tasks, points every task at a Paper board, and fixes the decisions the spec left open where a designer would normally be asked. Branch `worktree-redesign-v2`. Backend `~/Developer/Personal/html-to-gif`.

**Operating rule for the implementing session:** do not ask the user for input. Where this document or the spec is silent, take the recommended path written here; where both are silent, take the smallest change consistent with the spec's invariants (INV-01 to INV-08) and record the decision in the completion report. The user will review once all tasks are done.

## 1. Paper boards (file `01KZQXXEZ2SNPWS5PN2FCF31PC`, "Pictify — Landing Redesign (Repro Shop)")

All boards use the existing v2 tokens. Read exact values with `get_jsx` / `get_computed_styles`, never from screenshots.

| Spec ID | Board name | Node | Primary state drawn | Other states |
|---|---|---|---|---|
| D01 | Campaigns D01 — list (campaigns experience) | `BPC-0` | Populated list, 5 rows incl. Sample-data row | Three dashed cards on the board: no campaigns, no pilot access, failed load / view-only |
| D02 + D03 | Campaigns D02/D03 — edition · Setup | `BT7-0` | New draft with format chosen, period, 2 metrics, brand pinned | Summary panel carries the live synthetic example; validation notes at the bottom of the panel |
| D04 | Campaigns D04 — edition · Data (upload + mapping) | `BZH-0` | File uploaded, 5 mapped, 2 ignored, 2 suggestions unconfirmed | Blocking upload errors listed in the panel card |
| D05 | Campaigns D05 — edition · Data review (warnings) | `CA0-0` | 2 blocking, 3 decisions, 2 excluded | All valid / no eligible / validation expired in the panel card |
| D06 | Campaigns D06 — edition · Preview & approve | `CJA-0` | 10 previews (6 visible), one clipped, approval blocked | Approval panel with acknowledgements + external buyer approval field |
| D07 | Campaigns D07 — edition · Generate (partial failure) | `CVB-0` | Partial: 245 ready / 3 failed, dither bar, per-account table | Queued, working, reconnecting, blocked entitlement, cancelling, cancelled, ready in the panel card |
| D08 | Campaigns D08 — edition · Export & handoff (ready) | `D7Z-0` | Reconciled, package card, three handoff steps, accept handoff | Building, failed export, source expired, artifacts expired, no permission in the panel card |
| D09 | Campaigns D09 — campaign detail · New period | `DHL-0` | Draft + ready + superseded + purged editions, config panel | New-period rule card, archive vs delete note |
| D10 | Campaigns D10 — delete edition data (typed confirmation) | `DLG-0` | Dialog over dimmed D09 | Purge row states card beside the dialog |
| UX-02 / 11.4 | Campaigns — experience choice + access request states | `DQG-0` | Left: one-time "What do you want to create?"; right: pilot access request | After-submit and revoked-entitlement copy on the card |
| OUT-01 | OUT-01 — Value update email card (PNG 1200×800, preset v1) | `DS1-0` | Two-metric card at source size | Preset rules in the side note |
| OUT-02 | OUT-02 — Value update PDF summary (A4 one page, preset v1) | `DSU-0` | Three-metric page with method box | Preset rules in the side note |
| 11.3 M01 | Campaign landing — /campaigns/customer-value-updates | `DU4-0` | Full page: hero, sample in/out, workflow, fit + trust, offer + FAQ, closing, footer | Nav gains "Campaigns"; primary CTA = "Request pilot access" (product-not-ready state) |
| D11 | Campaigns D11 — Brand assets (kit · rev 3 · used by) | `IVW-0` | Saved kit: Logo / Colours / Fonts / Voice rows, live specimen, USED BY, foot “Save as rev 4” | Notes `JIX-0` (decisions) + `JJI-0` (states) below the board |
| D11a | Campaigns D11a — Brand assets · empty · Set up your brand dialog | `JBE-0` | Dimmed empty kit + dialog: website field + Detect brand, or Upload a logo / Start blank | Detecting, unreachable, partial in `JJI-0` |
| D11b | Campaigns D11b — Brand assets · first run · detected from website, confirm | `J4W-0` | Detected kit, FOUND · n tags per row, accent contrast fails, foot “Save as rev 1” | Header actions: Try another website / Start blank |

Rail for the Campaigns experience is the first child of `BPC-0` (`BPD-0`): Campaigns, Brand assets, Team & invites, Usage & billing; foot = campaign allowance card + "Switch to Platform tools".

## 2. Design decisions (locked, do not reopen)

1. **Edition shell.** Persistent header: breadcrumb (Campaigns / name), period chip (mono, subtle), state chip (mono, outlined), "SAVED n MIN AGO" + "Campaign settings" right. Under it a five-step strip: number (mono 11) · label (Inter 14) · state word (mono 10 caps). Current step has a 2px ink underline and a field-green state chip; done steps show slate "DONE …" (the proof-green square is the marker, never the text colour); blocked steps show slate "BLOCKED · reason". Steps are links only when the server says they are reachable.
2. **Layout.** Work area `flex:1` + 340px summary panel, 40px gap, 28px top padding, page padding 44px, rail 220. At ≤1024 the panel drops below the work area. Foot actions row: hairline top, explanatory sentence left, secondary + primary right. One plum primary per screen; disabled primary = subtle ground, mute text, rule-grey square (never just opacity).
3. **Status vocabulary.** 8px squares: proof-green = ready/verified/confirmed; field-green with ink border = current/needs decision/suggested; alarm `#B0483A` = blocking/failed (always with a sentence); rule-grey = excluded/not in run; mute outline = superseded/expired. Alarm is the only red. Never colour-only: every square is followed by text.
4. **Tables.** Mono caps 11.5px slate head row under a 1px ink rule; rows 46–64px with rule hairlines; IDs and counts in JetBrains Mono; fixed-width columns with `flex-shrink:0`, last text column `flex:1`. See D04/D05/D07/D09 for exact widths.
5. **Format choice** is two radio cards (D02); PNG copy "Place it inside your existing message", PDF copy "Attach or share from your own tool". PDF card has an A4/Letter select once chosen.
6. **Metrics rows** show key · unit · precision in mono, chips OBSERVED / ESTIMATED · METHOD NOTE (powder ground, royal text), HIGHER/LOWER IS BETTER, VS PRIOR PERIOD.
7. **Preview tiles** are 239px wide, 150px card, 4px brand band, then id (mono) + "WHY · reason" (mono 10 mute) + status. Clipped tile gets an alarm border and "Clipped" label.
8. **Generation progress** is the house dither bar: one 9px square per 4 accounts, proof/alarm/field/outline. No ETA text anywhere. "LAST CHECKED hh:mm:ss · POLLING n S" in mono.
9. **Export** never shows per-file URLs. Package card lists the four file classes; downloads are "Download campaign package", "Download manifest (.json)", "Text equivalents (.zip)". "Accept handoff" is an outlined ink button, not plum, and the sentence beside it states the effective deletion date ("whichever is earlier" with the 30-day ceiling).
10. **Delete** dialog requires typing `delete YYYY-MM`; the button stays disabled until it matches. Archive is a header button; delete lives under "DATA AND DELETION" in the config panel.
11. **Outputs** are the buyer's brand: preset uses Inter, one brand colour (contrast-checked), logo + name. No Pictify mark. Decreases render in slate; "neutral" variant drops the comparison line.
12. **Landing page** reuses the pricing hero band (field green + pixel cluster). Nav: Tools · Docs · Pricing · Blog · Campaigns; primary nav button "Request pilot access". The two sample cards on the page are the D02 card component with synthetic rows shown above each in a press-deep CSV block.

## 3. Task breakdown

Effort follows the spec's W-packages. "FE" = this repo, "BE" = html-to-gif. Design work is done unless marked.

### Design (W01) — remaining
- [x] D-1 (done on Paper: `EM1-0`, `ESI-0`) Responsive variants for D04/D06/D07/D08 at 1024 and 390 (panel below work area; table scrolls horizontally inside its own container; account id + issue stay visible). Draw on Paper next to the desktop boards, same names + " · 1024" / " · 390".
- [x] D-2 Update `DESIGN.md` on the branch to match `tailwind.config.js` + `RailV2.svelte`, and add a "Campaigns layout" section using the rules in §2.
- [x] D-3 Click-through: export the 10 desktop boards as PNG into `plans/campaigns-clickthrough/` in D01→D10 order (Paper `export`).

### Frontend
- **W02 Navigation and entry** (RailV2, `NextStepCard`, auth redirect)
  - [ ] FE-1 `src/lib/campaigns/nav.js`: central link builder (`campaignsHome()`, `editionUrl(campaignUid, editionUid, step)`), safe intent slug allowlist (`customer-value-update` only), same-origin return-path check (reject `//`, protocol-relative, absolute).
  - [ ] FE-2 Campaigns rail variant in `RailV2.svelte` driven by experience preference (`campaigns` | `platform`), per board `BPD-0`. Add "Switch experience" to the account/workspace menu. Keep the platform rail unchanged.
  - [ ] FE-3 `/dashboard/campaigns` route (D01) with the four table states; entitlement from `GET /campaigns/capabilities`; "Try sample data" creates/opens the synthetic campaign (kind `customer_value_update`, `sample: true`) which is always labelled SAMPLE DATA and excluded from live lists' counts.
  - [ ] FE-4 One-time experience question (board `DQG-0` left) shown only when a new signup has no intent and no stored preference; writes `PATCH /me/experience`. Access-request card (right) shown whenever campaign intent lacks entitlement; posts to the inquiry endpoint (BE-9).
  - [ ] FE-5 Login/signup carry `intent` + `redirect` through, validated by FE-1; a validated invitation/deep link wins over intent.
- **W03 Setup / brand / presets**
  - [ ] FE-6 `src/lib/components/campaigns/Setup.svelte` (D02): format radio cards, period + timezone + locale, metric rows (1–3) with an edit drawer (key, label, unit, precision, source owner, observed/estimated + method note, direction, comparison on/off), brand block (logo/colour/font, contrast check, reset to preset). Explicit save on Continue; show "SAVED n MIN AGO".
  - [ ] FE-7 Summary panel component with the live synthetic card (`CardPreview.svelte`) rendered from the preset HTML with sample values; flags overflow / unreadable colour before data upload.
  - [ ] FE-20 Brand assets page (D11 / D11a / D11b) replaces `src/routes/dashboard/brand-assets/+page.svelte` (v1 asset grid, FeatureGate). One kit with four rows (Logo, Colours, Fonts, Voice; 124 px label column, 562 px content), right column = live specimen (`CardPreview.svelte` with sample data) + USED BY. Saving makes brand rev n+1 (`POST /brand-kit/revisions`); editions pin the rev they were approved with; USED BY lists editions on the current rev. Colours are roles (brand/ink/wash/accent) with a contrast ratio tag against white (proof ≥ 4.5 : 1, alarm below, never blocks save) and a “Darken to pass” nudge. Fonts: two slots (headings/body), Google or uploaded file (embedded in renders). Voice: up to two tone chips + one free-text rule; static copy only. Empty state = D11a dialog (`POST /brand-kit/detect` with website URL → draft kit shown as D11b with FOUND · n tags; nothing saved until “Save as rev 1”). Delete of an asset used by an approved edition needs the typed confirmation pattern from D10. Locked plan: same page read-only + one plum “Unlock brand kit”. States in `JJI-0`.
  - [ ] FE-8 Presets `value-update-card-v1` (PNG, boards `DS1-0`) and `value-update-pdf-v1` (A4/Letter, `DSU-0`) as versioned HTML templates under `src/lib/campaigns/presets/`, with a shared typed-metric contract, "normal" and "neutral" narrative variants, and a deterministic text-equivalent generator (`textEquivalent(row, config)`).
- **W04 Data**
  - [ ] FE-9 `Data.svelte` (D04): private multipart upload, file card, privacy note, mapping table (source header · sample · destination select · type · state) with suggestions requiring Confirm; ignored columns named and never sent. Re-upload creates a new draft data revision and warns that previews/approval go stale.
  - [ ] FE-10 `Review.svelte` (D05): counts strip, All/Valid/Issues/Excluded filter, issues table with per-row resolution (fix file / neutral variant / exclude with reason / check in preview), spreadsheet-safe error report download, "Validate again" strip when data changed.
  - [ ] FE-11 Shared CSV rules in `src/lib/campaigns/csv.js` mirroring backend: IDs stay strings (`00042`), dot-decimal, blank optional = suppressed metric, 250 rows / 32 cols / 2 MiB, BOM + quoted fields, duplicate headers blocking. Fixtures shared with BE tests.
- **W05 Preview and approval**
  - [ ] FE-12 `Preview.svelte` (D06): poll `GET /campaign-preview-runs/:pid`, tile grid with WHY rationale, inspector (full size + Text tab), "Inspect another row · n left", approval panel with the three acknowledgements, optional external approval reference, "Approve this version" separated from "Generate n summaries".
- **W07/W09 Run and export**
  - [ ] FE-13 `Generate.svelte` (D07): run status card with dither bar (1 cell per 4 accounts), counts legend, item table filtered Failed/Ready/All with safe error codes, Retry (eligible only) and Cancel run with settled-state messaging; polling starts at 3 s and backs off to 30 s on idle/error; never shows an ETA.
  - [ ] FE-14 `Export.svelte` (D08): reconciliation strip, package card (ZIP / manifest.json / text zip), three handoff steps, "Record launch confirmed in my tool" (user report), "Accept handoff" with the retention consequence shown before confirming.
- **W11 Campaign detail, deletion, marketing**
  - [ ] FE-15 `/dashboard/campaigns/[campaignUid]` (D09): editions table with draft/ready/superseded/purged rows, config panel with "changed since last edition", New period (copies config only; opens existing draft if one exists), Archive.
  - [ ] FE-16 Delete edition data dialog (D10): typed `delete YYYY-MM`, owner/admin only, deletion status rows (requested/purging/purge_failed/purged) reflected in D09.
  - [ ] FE-17 Marketing: `src/routes/campaigns/customer-value-updates/+page.svelte` per board `DU4-0` using existing landing primitives (hero band, PixelCluster, CtaStrip, footer); `/campaigns` redirects to it; "Campaigns" link in the marketing nav; one truthful example block on the homepage (the D02 card + its CSV row, labelled Sample data, alternating card/PDF, no video). Pricing page gets a "Campaign pilot" explanation block with no checkout. Access-request form with success/error states.
  - [ ] FE-18 Analytics: `surface`, `experience`, `entry_intent` on existing events; new events `campaign_intent_clicked`, `campaign_access_requested`, `campaign_setup_started`, `campaign_data_validated`, `campaign_approved`, `campaign_run_started`, `campaign_export_downloaded`, `campaign_handoff_accepted`, `campaign_new_period`. Mask all source data and previews.
  - [ ] FE-19 `src/api/campaign.js` (all routes in spec §7) using the raw fetch pattern with honest HTTP status and `Idempotency-Key` on start/retry; never the null-returning wrapper style. `src/service/backend.js` CORS headers extended (BE-1).

### Backend (html-to-gif)
- **W00** [ ] BE-0 Inspect deployed storage/Redis/Mongo guarantees; write `docs/campaigns-w00.md` answering spec §16 items 1–6; confirm private bucket/prefix and that the public upload helper is not reused.
- **W06 Domain and API** [ ] BE-1 Models Campaign / CampaignEdition / CampaignItem / CampaignRun / Artifact / Export / IdempotencyRecord / UserTeamExperiencePreference / CampaignEntitlement with the uniqueness constraints in §6; `routes/campaign.js` implementing §7 with error shape `{code,message,requestId,fieldErrors?}`; allow `Idempotency-Key` in CORS for approved origins; `GET/PATCH /me/experience`.
- **W08 Storage and privacy** [ ] BE-2 Private artifact adapter (`service/campaign-storage.js`), authenticated gateway `/campaign-artifacts/:aid/download` and `/campaign-exports/:xid/download` with `Cache-Control: private, no-store`; absolute expiry timestamps; purge lifecycle with tombstone/epoch; exclusion from public galleries and `/r/:uid`.
- **W04** [ ] BE-3 CSV ingest + typed validation service sharing fixtures with FE-11; safe-ID grammar; ignored columns discarded at parse time; spreadsheet-safe error report.
- **W05** [ ] BE-4 Representative sample selection (deterministic), preview runs with separate identity + allowance, snapshot digest, asset pinning (logo/font bytes copied per edition), approval persisting actor/time/digest, `409 stale_revision`.
- **W07** [ ] BE-5 Durable dispatcher/reconciler, worker lease tokens with attempt versions, temp-key write → verify → atomic canonical claim, bounded retries (2 automatic), failed-only manual retry, cancel semantics, counts rebuilt from item states.
- **W09** [ ] BE-6 Verified artifacts, bounded-memory ZIP streaming, canonical `manifest.json` + `manifest.csv` + README + per-account text; handoff-confirmation and launch-confirmation endpoints; retention deadline recalculation on acceptance.
- **W10** [ ] BE-7 Campaign capability checks mapped to `request.can(...)` (approve/purge = owner/admin in pilot), pilot grant records, atomic reservation, per-artifact metering identity, ops ledger fields, alerts for stuck dispatch / purge failure / count mismatch.
- **W11** [ ] BE-8 Sample-data campaign seeding (synthetic 12-account fixture), New period endpoint semantics, legacy `/workflow` untouched, `packType` enum untouched, fix legacy run-to-hook `outputFormat` omission as a separate commit.
- **M01** [ ] BE-9 Inquiry endpoint for pilot access requests (rate-limited, no customer data fields), owner notification.

### Verification
- [x] V-1 Jest unit/integration in html-to-gif for QA-01…QA-21 and QA-24 (spec §13) with synthetic fixtures; restart/crash tests for BE-5; purge tests for BE-2.
- [x] V-2 Frontend: `npm run lint` + `npm run build`, then gstack `/browse` screenshots of D01–D10 at 1440×900 and 1024 and 390 against the Paper boards; keyboard-only pass; reduced-motion pass; 200% zoom on D06/D07.
- [~] V-3 QA-22/23/25 rehearsal (QA-25 done; QA-23 awaits four Customer.io UI steps — see plans/campaigns-v3-report.md): 250 synthetic accounts, injected worker interruption, reconciled ZIP, two-account preview in a real sending tool (use a free Customer.io or HubSpot sandbox, no real customers).

## 4. Order of work

1. BE-0 (W00) and D-2 in parallel; stop and report if private storage or CAS guarantees are missing.
2. BE-1 + BE-2 + BE-7 (authority, storage, identity). FE-1, FE-2, FE-19 against the reviewed contract.
3. FE-3/4/5, FE-6/7/8, BE-3, FE-9/10/11.
4. BE-4, FE-12; BE-5, FE-13; BE-6, FE-14.
5. FE-15/16, BE-8, FE-17/18, BE-9, D-1, D-3, V-1…V-3.

Commit per package on `worktree-redesign-v2` (frontend) and a `feat/campaigns-r1` branch (backend). Do not `git stash` or `git add -A` in the shared worktree; add files by path. Do not touch the uncommitted redesign/email edits already in the tree.

## 5. Acceptance (what "done" means before the user reviews)

- Every board in §1 has a matching route/state in the app, verified by screenshot at 1440×900.
- Spec §14 checklist items 1–10 each have evidence linked in the completion report (test output, screenshot path, or doc).
- `grep -rniE "native integration|signed webhook|permanent (cdn|url)|delivered|sent" src/routes/campaigns src/lib/components/campaigns` returns only the explicit "Pictify renders, your tool sends" copy.
- No new nav item beyond "Campaigns"; no /solutions route; no video option anywhere in campaign UI or marketing.

## 6. Design review disposition (2026-09-05, review v1 → boards v2)

The user's Paper design review (R01–R07 + screen table + marketing changes + minimum evidence) has been applied. Everything below is now drawn; the implementer builds to the v2 boards, not the review text.

### Fixes applied to the existing boards

| Item | Where | What changed |
|---|---|---|
| R01 | `BT7-0` + new `EAM-0` | Setup now has campaign name + sender name fields and a **Next action** block (label + campaign-level https destination, validated). "Nothing here is customer data" replaced with "Account metrics are uploaded in the next step". Metric editor drawer, fresh-campaign state, PDF-selected with A4/Letter, entitlement-restricted format, and the four save states are on `EAM-0`. |
| R02 | `CJA-0`, `CVB-0`, `CA0-0`, new `EE7-0` | All ten previews are on the board (scroll region). "6 left" → "6 extra previews in your allowance". D07's overflow failure is now a different, unsampled account (00633 Nordwind Logistik) so the scenario is continuous. D05 row 00519 resolves via **Set display name**. Inspector (Rendered / Text equivalent / Row tabs, rationale, review progress, display-name fix that never alters the source name), approved-not-generated state with "Generate 248 summaries" and "Withdraw approval", and role variants are on `EE7-0`. |
| R03 | `DS1-0`, `EYS-0`, `BT7-0`, `D7Z-0` | CTA inside the raster is text (label + destination) only; the clickable button is real HTML in the buyer's email, shown at 600 and 360 on `EYS-0`. Destination is campaign-level in R1 (per-account URL column deferred, with validation/snapshot rules noted). Sample host is `northwind.example`. Handoff step 2 says "wrap the whole image in your own link and put the CTA as real text beside it". PDF link annotation is an acceptance-test output, not an assumption. |
| R04 | `D7Z-0`, `DLG-0`, `BZH-0`, `EHD-0` | Retention copy shows the effective date and "whichever is earlier"; accepted state (actor, time, resulting deadline, digest) on `EHD-0`. Delete dialog names the period **and revisions** (rev 1 and rev 2), typed phrase covers all revisions, backup lifetime is marked **UNRESOLVED · fill from W00**, dialog widened so the footer fits. Upload privacy note now states the ingest contract: server parses, keeps only mapped columns in the stored source, discards the original after parsing. |
| R05 | `CA0-0`, `EE7-0` | Counts are accounts: strip reads BLOCKING ISSUES / DECISIONS; duplicate id shows both rows (41 and 188) as one issue; panel reads "Eligible now 243 · Unresolved 5 · Excluded 2"; filter chip "Unresolved 5". Exclude-with-reason popover, revalidate strip and a real upload-rejected state are on `EE7-0`. |
| R06 | all rails, `CVB-0`, `EHD-0`, `DU4-0` | Rail reads "PLATFORM: FREE · PILOT: ACTIVE" and the allowance is synchronised per board (0 → 248 reserved → 245/250 → 248/250 used). D07 explains manual retry after 3 automatic attempts and shows the retry budget (2 of 20); "Attempts are metered…" replaced with "Retries of this approved version don't use another account allowance". Retry-exhausted, cancelling→cancelled and reconnecting states on `EHD-0`. Landing offer reads "10 previews + 6 extra · bounded retries". |
| R07 | all boards, `EYS-0` | Proof-green text labels are now slate with the green square as marker; table heads 11.5px slate; helper captions 13px slate; explicit radio/checkbox check glyphs on format cards, acknowledgements and experience choice. PNG source labels raised to 26/24px (12–13px at 600). Delivered-size mocks at 600 and 328 with real text and a real HTML button on `EYS-0`; one-metric and three-metric extremes there too. |
| Screen table | `BPC-0`, `DHL-0`, `DQG-0`, `EJE-0`, `F1S-0` | List has Active/Archived/All filter and a row-open hint. New period opens a date dialog that detects an existing draft ("Resume September instead"). Access card shows team and prefilled identity; multi-team choice, request-pending, revoked/permission-denied, unsaved-switch dialog and the account-menu switcher are on `EJE-0`. PDF Letter + long-name + three-large-metric variant is `F1S-0`; hours arithmetic fixed to 312.4 everywhere. |
| Marketing | `DU4-0` | Hero has "Request pilot access" + "See a sample" under the copy. Workflow cards use real UI crops (mapping row, preview tile, dither bar, package card); production notes moved out of copy, one "Prototype" label remains. Closing reads "Review a sample before you export." Retention "whichever comes first". "Two working days" removed. "Any tool that takes a file" → "Manual transfer to any sender" with the honest note. Footer line covers both audiences. |
| Responsive | `EM1-0`, `ESI-0` | D05 at 1024 (panel below work area, header compacts). 390 frames for list, review (issue cards, sticky footer), export, access, landing. 200% zoom note: same rules as 1024 apply at ≥175% zoom on 1440. |

### Still open for implementation (not design)

- Verified backup lifetime for the delete dialog (W00, BE-0).
- PDF real text + link annotation (V-1 acceptance).
- Actual email-client rendering and file size (V-3).
- Per-account CTA destinations: deferred; if built, add an optional mapped `cta_url` field with safe-URL validation and snapshotting.

### New board index (v2 additions)

| Board | Node |
|---|---|
| Campaigns — Setup interactions (R01) | `EAM-0` |
| Campaigns — Review interactions (R02/R05) | `EE7-0` |
| Campaigns — Run & export variants (R04/R06) | `EHD-0` |
| Campaigns — Entry & period variants (UX-02/11.4/D09) | `EJE-0` |
| Campaigns D05 — Data review · 1024 | `EM1-0` |
| Campaigns — 390 · list / review / export / access / landing | `ESI-0` |
| OUT-01 — delivered sizes (600 email · 360 mobile · 1 and 3 metrics) | `EYS-0` |
| OUT-02 — PDF summary · Letter · long name + 3 large metrics | `F1S-0` |

Design task D-1 (responsive variants) is done by `EM1-0` + `ESI-0`. D-2 is done (`9d2881b` — `DESIGN.md` now leads with v2 and carries a "Campaigns layout" section built from §2). D-3 is done (`3b8c9f8` — `plans/campaigns-clickthrough/`, nine 1x PNGs covering D01–D10 plus a README mapping click-through position to spec ID). All design tasks W01 are complete; what remains is V-1, V-2 and V-3.

## 7. Campaign landing v2 (2026-09-05, supersedes `DU4-0` for FE-17)

Board **Campaign landing v2 — /campaigns/customer-value-updates** (`F31-0`). Rebuilt section by section to share the main site's register (Refero lock: Pictify's own landing as primary; Loops' document-like specimen blocks and Ghost's evidence-first sections as borrowed details). Build FE-17 from this board; `DU4-0` stays only as the v1 reference.

| # | Section | Node | Reuse from the codebase |
|---|---|---|---|
| 1 | Nav + hero: field band, eyebrow, 62px display headline, sub, two CTAs, mono facts line; right side is a real specimen: CSV row chip → 520px card, caption "PNG · 1200 × 800 · rendered from the row above · static preview"; pixel cluster bleed bottom | `F3M-0` | Hero band + `PixelCluster` from the landing/pricing hero; card = the D02 `CardPreview` component with sample row |
| 2 | Proof wall: "248 accounts got their own card on Tuesday." + 5 account cards with row numbers and variant labels (neutral, decrease, max, Unicode) + "+243" tile bleeding off the right, then press-deep CTA strip "One CSV and one approval did all of that." | `F56-0` | Same pattern as the homepage Proof Sheet (`Wall Row` + `CTA — After Proof`) |
| 3 | Contract pane on canvas ground: press card with the CSV rows left and the typed field contract right (name · type · required/optional), footnotes on id preservation, blank ≠ zero, ignored columns | `F73-0` | Same pattern as the homepage Contract Section |
| 4 | Workflow bento: blue (upload + mapping crop), powder (preview tile), sky (dither bar), field with ink border (package card + "See the handoff README") | `F8G-0` | Same pattern as the homepage filler bento; crops are the real D04/D06/D07/D08 components rendered with sample data |
| 5 | Fit and trust: three numbered editorial rows (01 IT NEEDS / 02 IT WILL NOT / 03 IT HANDS OFF) with a right-hand facts column (formats · stays in your tool · works with chips + "no native integration badge") | `FCE-0` | Same pattern as the homepage Moments numerals |
| 6 | Offer + FAQ (unchanged from the reviewed v1) | clone of `E0F-0` | — |
| 7 | Closing band: "Your numbers already exist. The cards don't." + sub + two CTAs + mono line, cluster bleed | `FF1-0` | Same pattern as the homepage Closing CTA |
| 8 | Footer (shared, with the two-audience line) | clone of `E1X-0` | Shared footer |

Copy rules unchanged: no "native integration", no delivery/sent claims, "whichever comes first" retention, no reply-time promise, "Prototype" label on UI crops until release. The 390 layout on `ESI-0` still applies (hero stacks, wall becomes a horizontal scroll, bento stacks, numbered rows stack with the facts column under the text).

### 7.1 Non-technical audience pass (2026-09-05, same board `F31-0`)

Competitor research (Movable Ink, Hyperise, Vitally; Mailchimp style on Refero): outcome headline in the buyer's words, "what the customer sees" mockups (phone, inbox) instead of files, a before/after, no code on the page, CS vocabulary (renewal, adoption, value). Applied:

- Hero headline "Show every customer what they got from you this month." Right side is an inbox card + phone showing the email with the card in it (`FGX-0`), not a raw PNG.
- New section after the hero: **Before / After** (`FI5-0`) — generic newsletter vs the per-customer email with the card and a real button.
- The CSV/contract pane is replaced by **Spreadsheet → card** (`FJF-0`): a sheet-style table (Account ID, Company, Workflows, Last month, Hours saved) with line 42 highlighted, an arrow, the card, and three plain-language rules (blank means blank, a dip is shown as a dip, estimates say so).
- All copy de-teched: "spreadsheet" not CSV, "folder of cards + match-list" not ZIP/manifest, "line" not row, "customers" not accounts where it reads better, "send" not edition. Bento, fit rows, offer and FAQ rewritten in that register. Retention copy reflects the user's storage decision (images hosted like other Pictify images at unguessable addresses; download needs login).
- Section order: Nav · Hero · Before/After · Proof wall · Spreadsheet→card · Four steps · What it needs / will not do · Offer + FAQ · Closing · Footer.

Build FE-17 from this state. The inbox/phone mockups and the sheet table are HTML components with the sample fixture, not images.

## 8. Brand assets page (2026-09-06, D11)

The v1 `/dashboard/brand-assets` grid (asset tiles by type, categories, uppercase headings) is retired. Refero references: Frontify/Brandfolder-style kit pages (one kit, rows by role, live specimen) and Webflow/Framer site-settings forms (fixed label column). Boards: `IVW-0` (saved kit), `J4W-0` (first run after detect), `JBE-0` (empty + dialog); notes `JIX-0` (decisions) and `JJI-0` (states).

Decisions (locked):
- One kit, four rows: Logo · Colours · Fonts · Voice. No asset-type grid, no categories.
- Revisions, not overwrites. Save = rev n+1; approved editions pin their rev; USED BY shows editions on the current rev.
- Colour roles (Brand, Ink, Wash, Accent) with a contrast tag per swatch; alarm informs the AI, never blocks.
- Fonts: headings + body slots, Google or uploaded (embedded). Voice: ≤ 2 chips + 1 line, static copy only.
- Specimen is the standard card re-rendered live with sample data.
- First run: detect from website (public homepage, read once), confirm, then save. Alternatives: upload a logo, start blank.

Implementation task: FE-20 (W03). Backend: `GET /brand-kit`, `POST /brand-kit/revisions`, `POST /brand-kit/detect`, `POST /brand-kit/assets` (upload) — add to BE list when the peer resumes.

