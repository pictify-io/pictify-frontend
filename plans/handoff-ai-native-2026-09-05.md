# Handoff — AI-native product surfaces (spec v1.0 → Paper boards AN-01…AN-06)

**Date:** 2026-09-05 · **For:** `front-end-html-to-gif-ed` · **From:** design/orchestration session  
**Authority:** the user's *Pictify AI-native product specification v1.0* (consolidated; wins over the campaign spec, the studio spec and this doc on conflicts). This doc maps its §3 capabilities and §5 state list to Paper boards and to the existing task lists in `handoff-campaigns-r1-2026-09-05.md` and `handoff-studio-b-2026-09-05.md`.  
**Mandate (unchanged):** no questions to the user; take the recommended path and note it in the report.

## 1. Where each capability lives (Paper file `01KZQXXEZ2SNPWS5PN2FCF31PC`, x from 99200)

| Capability (spec §3) | Board | Node | What it shows |
|---|---|---|---|
| Brief → campaign draft | **AN-01** Campaigns › New · brief | `HCI-0` | Description composer with "Draft again"; editable brief rows (NAME · CADENCE/PERIOD · AUDIENCE · OUTPUT · BRAND · METRICS 1–3 · CLAIM TO FIX) with status squares FROM YOUR WORDS / SUGGESTED / NEEDS YOU; metric slots carry semantics chips (OBSERVED/ESTIMATED, direction, comparison, blank treatment); "Hours saved" needs a method-note answer; unsupported claim ("time they save") offered a safe rewording; foot: Save brief · **Create campaign draft**; side panel WHAT THE AI USED (description, brand rev, field types, customer data: none) + "A brief is a draft" + next steps + other states (empty, ambiguous, brand missing, AI unavailable, generating) |
| Brand-aware generation | ST-08 `H03-0` (existing) + AN-06 A4 | — | Brand rail on Start; brand-missing row/rail and safe-fetch detection |
| Selection-aware edits | **AN-02** Studio · scoped edit | `HOV-0` | Say it rail: `YOU · REV 5 · EDITING: HEADING` bubble with "Using: Northwind brand · synthetic samples · only the selected node may change"; receipt "Changed: Heading · size 52 → 60 … Untouched: 8 nodes · 5 fields · checked against rev 4"; **wider-scope proposal** card ("touches Metrics row, which you didn't select" → Apply as rev 6 / Keep to Heading); composer scope switch `Selected: Heading ✕ | Whole design`; placeholder "Describe a change to Heading…" |
| Visual customization | ST-01…08 (existing) | — | unchanged |
| Mapping assistant | **AN-03** D04 Data | `HVR-0` | Consent strip (post-consent state: "AI suggested 2 matches from your column names and types … did not see rows"); WHY rows under each suggestion; **Unresolved** row (`arr_usd` · alarm outline · "No campaign field takes a currency … No guess is made" · Ignore); side panel WHAT THE AI SAW (7 names · types · rows/values/names 0·0·0 · 5 fields) + other states (before consent, AI unavailable, heuristic-only) |
| Campaign reviewer + repair | **AN-04** D06 Review | `I30-0` | Right rail becomes the reviewer: CHECKS · ALL 248 ACCOUNTS; issue list with square + rule + VERIFIED/ADVISORY + affected count + example link (overflow 1 · comparison hidden 2 by design · method note missing 248 · narrative claim ADVISORY · NEEDS A HUMAN → Reviewed); **Proposed design fix** card with NOW/AFTER synthetic thumbnails, "Tested on 6 stress fixtures", "Re-checked all 248 · 0 overflow", "Makes design rev 6", **Apply as rev 6** · Open in studio · Dismiss; note "Verified = a rule ran on every eligible account … There is no score"; acknowledgements kept below |
| Campaign-wide repair | AN-04 + ST-05 `G8Z-0` | — | Same proposal card; studio overflow diagnostic |
| Next-period assistant | **AN-05** D09 New period | `IEZ-0` | Dialog: dates; deterministic change table WHAT / SINCE SEPTEMBER'S APPROVAL / OCTOBER USES (Design changed rev 5 → rev 6 available with **revision picker defaulting to the approved rev 5**; Brand unchanged; Metrics unchanged; Mapping reused, reopens only for new columns; Next action copy changed v2 → v3; Audience/data not carried); "Pictify never switches to a newer design on its own"; **Create October draft** |
| States (spec §5) | **AN-06** | `IKS-0` | A1 USING context line (3 variants); A2 change receipt (scoped · whole design with "layout: not compared" · rejected out-of-scope, NOT CHARGED); A3 AI unavailable strips (brief, studio, mapping, review, credits) with manual path; A4 brand missing; A5 approval invalidated banner; A6 partial generation run panel (243/248, failure reasons + attempts, Retry the 5 failed, Export off until all verified); A7 typed deletion (edition data, all revisions, tombstone, late workers); A8 repair-applied toast with Undo; capability → board map |

Also changed: D09 `DHL-0` subtitle now names the design revision instead of a preset (and the D10 copy).

Previously designed and still valid: ST-01…ST-08 (studio), ST-07 states (saving/offline/conflict, import report, missing asset, versions, approved-edition banner, keyboard), D01–D10, landing `F31-0`.

## 2. Locked design decisions for AI surfaces

1. **AI never gets its own screen.** Each capability sits inside the step where the decision is made, beside the manual control that does the same job. No generic chat page.
2. **"USING" line above every instruction** states exactly what left the tenant (brand rev, synthetic samples, field names; column names and types; rule codes and counts). Fixed strings per surface, never generated.
3. **Receipts are diffs, not prose.** "Changed: …" lists real nodes/fields from the server diff; "Untouched … verified" appears only when the diff proved it, otherwise "not compared". Rejected out-of-scope results say NOT CHARGED.
4. **Scope is visible and switchable**: `EDITING: <node>` chip on the instruction, `Selected: X ✕ | Whole design` on the composer. Out-of-scope needs are a proposal card (Apply as rev n+1 / Keep to selection), never a silent change.
5. **Consent before metadata sharing** (mapping): strip with "Suggest matches" / "I'll map by hand"; after consent the strip states what was seen. Unresolved rows never get a fabricated confidence; they say why no match exists.
6. **Reviewer vocabulary**: VERIFIED = rule ran on every eligible account, with a count; ADVISORY = AI reading, needs a human. No score, no percentage, no "passed" from the AI. Narrative claims need "Reviewed" by a person.
7. **Repairs change the design, never the data.** Proposal shows NOW/AFTER on synthetic fixtures, fixture count and the full-audience re-check; Apply = one undoable revision; approval on the old revision becomes stale (A5 banner).
8. **Next period is a deterministic diff** with the approved revision as the default; the user picks any newer revision explicitly.
9. **AI unavailable is a strip, not a modal**, always pointing to the manual control on the same screen. Credits exhaustion uses the field square, provider/deadline failures the alarm square.
10. **Brief semantics are the user's**: metric rows need label, unit, direction, source/estimated + method note, comparison, blank treatment; the AI may propose a field name, never a value, formula or "decrease is good".
11. Status squares, one plum primary per screen, mono labels, and the no-"preset"/"DOM"/"node"/"score" copy rules from the earlier handoffs still apply.

## 3. Contracts added (proposed; keep backend naming)

- **Brief draft** `POST /campaigns/brief` `{ description, brandRevision }` → `{ brief: { name, cadence, period, audience, output, brand, metrics[ {key,label,unit,precision,kind: observed|estimated, direction, comparison, blank} ], claims[ {span, reason, rewording} ] }, sources: { fromWords: [...], suggested: [...], needsYou: [...] } }`. Never receives customer data; server enforces the allowlist.
- **Scoped AI edit** — extend `POST /templates/:uid/edit` with `{ selectedNodeIds, allowedScope: selection|document }`. Server validates the candidate against scope; out-of-scope changes are returned as `proposal: { touches: [...], reason, candidateRevisionPreview }` with nothing committed. Receipt includes `{ changed: [{id,name,props}], untouched: { nodes, fields, verified: bool } , rejected: [...] }`.
- **Mapping suggestions** `POST /campaigns/:id/editions/:eid/mapping/suggest` `{ headers: [{name,type}], consent: true }` → `[{ header, field|null, why, state: suggested|unresolved }]`. Deterministic heuristics run first; AI only after consent.
- **Review** `GET /editions/:eid/review` → `{ checkedAccounts, issues: [{ id, rule, severity: block|warn|advisory, verified: bool, count, examples: [accountIds], revision }] }`; **repair proposal** `POST /editions/:eid/review/:issueId/propose` → `{ patch, fixtures: {tested, fit}, recheck: {accounts, remaining}, previewBefore, previewAfter }`; **apply** creates a template revision through the studio commit path and invalidates approval.
- **Next period** `POST /campaigns/:id/editions` with `{ period, templateRevision }` → server returns the diff summary from saved records (`design`, `brand`, `metrics`, `mapping`, `nextAction`, `audience: fresh`).
- **Run status** already in BE-5; A6 needs `failed[]` with `{ accountId, reason, attempts }` and `retryFailedOnly`.

## 4. Task deltas (add to the R1 / B backlog; order after B06 unless noted)

- **AI-1** Brief screen (AN-01) at Campaigns › New; manual "Skip" path lands on Setup unchanged. Setup pre-fills from the brief. *P2.*
- **AI-2** Scoped edits in the studio (AN-02): scope chip + switch, server scope validation, proposal card, receipt from server diff. *P2, after B04.*
- **AI-3** Mapping consent strip + WHY rows + unresolved state (AN-03); heuristics first. *P3.*
- **AI-4** Reviewer rail on D06 (AN-04): verified issues from BE rules, advisory items, proposal card → apply as revision → approval invalidation banner (A5). *P3.*
- **AI-5** New period dialog (AN-05) with deterministic diff and revision picker. *P4.*
- **AI-6** States (AN-06): USING line component, receipt component, unavailable strips, brand-missing, partial generation panel with failed-only retry, typed deletion tombstone, repair toast. *Across P1–P4.*
- **AI-7** Evaluation set + telemetry per spec §13 (safe IDs/counts only). *P2.*

## 5. Acceptance additions

- Every AI surface shows the USING line and a receipt or proposal; no AI action mutates campaign state without a user click.
- Scope tests: an edit with a selection cannot touch other nodes (server-rejected, not charged); wider-scope needs surface as a proposal.
- Mapping without consent sends nothing to the AI (network assertion); unresolved rows carry a reason and no confidence number.
- Reviewer counts equal the full eligible audience; applying a repair produces a new revision and voids the prior approval.
- New period defaults to the approved revision; choosing another requires an explicit pick.
- Screenshots of AN-01…AN-06 at 1440 in the final report.

## 6. Layout pass (2026-09-05, after user review: "cluttered, too much text")

Reference lock from Refero: Grammarly rewrite card and suggestion panel (flows 1875/1869), Craft assistant popover (7959 step 8), Sana settings form. Rule set applied to AN-01…AN-06:

- Every AI card is **title line + one detail line + one action row**. No explanatory paragraphs inside the UI.
- Status is a square plus at most one mono tag; chips are gone except for the scope chip.
- Forms are one field per row with a 130 px label column and 16 px row padding (AN-01).
- "Other states" prose now lives in **note cards below the boards** (`ISN-0` under AN-01, `IU3-0` under AN-03), never inside the screen.
- Reviewer: one line per issue with a trailing count; the fix card is title, thumbnails, one evidence line, buttons.
- New-period dialog rows are single phrases ("Unchanged", "Changed · rev 6 saved Sep 12").
- Studio rail receipt: "Heading · 52 → 60 px, bolder / Nothing else changed · verified / Details · Undo"; the wider-scope proposal is a question with two buttons.

Implement the copy as drawn; do not re-add the removed explanations. Help text belongs behind "Details" links or tooltips.
