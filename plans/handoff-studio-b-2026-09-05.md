# Handoff — AI-first visual template studio (packages B00–B06)

**Date:** 2026-09-05 · **For:** implementing session `front-end-html-to-gif-ed` · **From:** design/orchestration session  
**Spec:** [`plans/ai-visual-template-studio-spec-2026-09-05.md`](ai-visual-template-studio-spec-2026-09-05.md) v1.0 (governs; this doc maps it to boards, contracts and tasks).  
**Parent handoff:** [`plans/handoff-campaigns-r1-2026-09-05.md`](handoff-campaigns-r1-2026-09-05.md) — everything there still stands except where §5 below amends it.

**Mandate (unchanged):** do not ask the user for input. Where a choice is open, take the recommended path written here and record it in your report. The user reviews once everything is done.

---

## 1. What changed

Pre-built presets (`value-update-card-v1`, `value-update-pdf-v1`) are no longer the product. Every campaign gets a **design** made in the shared studio: the user describes it, AI drafts HTML, the user customizes it visually (Moveable/Selecto around the browser DOM) or by further instructions, previews it with synthetic samples, and the **exact saved revision** is what the edition renders. OUT-01/OUT-02 (`DS1-0`, `DSU-0`) become *starter layouts and fidelity fixtures*, not a fixed catalogue.

We reuse: `src/lib/components/studio/*` (TemplateStudio, SayItRail, StudioTopBar, InputsRail, ProofStage), the template API (`src/api/template.js`, `editTemplateBySaying`), and the prototype at `src/routes/test/visual-html/` (`+page.svelte`, `dom-editor.js`, `templates.js`). The test route stays dev-only.

## 2. Paper boards (file `01KZQXXEZ2SNPWS5PN2FCF31PC`)

All studio boards are 1440×900 unless noted, top −999, x from 87000.

| Board | Node | Shows |
|---|---|---|
| ST-01 Design mode · text selected | `FM8-0` | Full shell: top bar (`FM9-0`), Say it rail with receipts, stage toolbar (Design/Preview data/Rendered proof · +Text +Image +Shape +Field · FIT/50/100), artboard at 50 % with heading selected, context actions (Edit text · Select parent · Duplicate · Delete), selection tag, status line, Selection rail with CONTENT/TEXT/POSITION/SIZE |
| ST-02 Image selected · field picker | `FRZ-0` | Logo selected (Replace · Select parent · Duplicate · Delete), image rail (`GEN-0`: file, Fit inside, rotation snaps 15°, free position x/y/w/h, align, layer order), **+ Field picker** (`GGI-0`): campaign fields with type/required, IN USE vs Add, "Fields are defined in Setup" |
| ST-03 Layers · nested group · locked | `FXN-0` | Layers tab active (`GHG-0` tree: root › Header group [selected] › Logo/Northwind/{{period_label}} · eyebrow · heading · Metrics row › 2 fields · Thank-you line **LOCKED**), group outline on canvas, group rail (`GJE-0`: Row/Column/Free, gap, justify, align, padding, fill/radius, Fill/Hug size) |
| ST-04 AI running | `G3B-0` | Top bar `AI WORKING · REV 4 → 5`, undo/redo + Use this design disabled, Say it shows rev-5 instruction + stages (read ✓ · planned ✓ · writing ● · check ○) + Cancel, canvas dimmed with "Design is locked while AI works · Cancel", right rail overlay "Properties return when AI finishes", composer disabled |
| ST-04b AI failed (rail) | `GMI-0` (340×fit) | Same rail after failure: alarm square, "The change didn't apply", reason sentence, "Your design is still rev 4", **Try again · Edit instruction**, `REF STU-4021 · reported automatically`, composer re-enabled |
| ST-05 Preview data · overflow | `G8Z-0` | Preview data active, sample switcher (‹ 7/10 name ⌄ › · Longest), artboard filled with longest sample, dashed alarm outline on heading + tag, diagnostic card under the artboard ("overflows for 1 of 10 samples" · Shrink to fit · Allow 2 lines · Use display name from Setup · CHECKED ON SAVE), status `1 overflow · 9 samples fit`, **Inputs rail** (`GQI-0`: each field with sample value, FITS / 1 OVERFLOW, usage line) |
| ST-06 Rendered proof · stale vs current | `GRY-0` (816×852, stage only) | Proof mode, sample switcher, plum **Re-proof rev 4**, stale banner (`STALE · REV 3`), the real render with caption `RENDERED REV 3 · PNG 1200 × 800 · 184 KB · 2.1 S · 12:04`, variant strip `CURRENT · REV 4`, status line "re-proof before you use this design" |
| ST-07 States | `GTP-0` (1440×fit) | S1 save states (SAVED · SAVING… · UNSAVED → saves in 2 s · OFFLINE kept on device · SAVE FAILED + Retry) · S2 conflict dialog (Keep mine as rev 6 / Take rev 5) · S3 import compatibility report · S4 missing asset (canvas + rail) · S5 Versions panel · S6 approved-edition banner · S7 return to Setup Template section · S8 keyboard & accessibility table |
| ST-08 Start (empty) | `H03-0` | New design: Say it rail becomes the Start composer (format cards PNG/PDF, description textarea, **Create first draft · about 20 s**, three starters, Import HTML / Choose existing), empty dashed artboard, **Brand rail** (`H74-0`: logo, colours, fonts, voice chips) |

Updated campaign boards:

- **D02/D03 `BT7-0`** — "Brand and template" section replaced by **Design** (`H8M-0`): thumbnail + name + READY · REV 5 + three status lines + `Edit design · New with AI · Choose another · Brand settings`. Summary panel row "Preset" → "Design · value card · rev 5 · proof ok".
- **D06 `CJA-0`** — "What you are approving" gains `Design · value card · rev 5 · proof ok` (`H9Z-0`); footer alarm copy now "Fix it in the design (Edit design) or set a display name in Data."
- **Landing `F31-0`** — new section `HA2-0` after Spreadsheet→card: eyebrow `DESIGN STUDIO · PROTOTYPE · IN THE PRIVATE PILOT`, headline **"Start with AI. Make it yours visually."**, five tiles Describe → Customize → Preview → Generate → Export with UI crops, three proof lines (no design skills; AI sees layout never numbers; import HTML).

## 3. Locked design decisions (in addition to handoff §2)

1. **Three modes, one stage.** Design (editable DOM), Preview data (same DOM, sample substitution, read-only), Rendered proof (server PNG/PDF of an exact revision). Mode is a segmented control at the top-left of the stage; keyboard 1/2/3.
2. **Selection language.** 1.5 px royal outline + four 8 px paper handles; dark context bar above the element (Edit text/Replace · Select parent · Duplicate · Delete); a royal mono tag below it (`Heading · field: account_name · 300 × 34`). Bindings render as powder chips, never caret-editable.
3. **Rails.** Left = Say it | Layers (lime active tab). Right = Selection | Inputs | Brand. Nothing selected → right rail shows document (dimensions, background) then Brand. Every canvas action has a rail equivalent.
4. **Status squares** (8 px): proof green = done/fits; field yellow with ink border = in progress/unsaved/warning; alarm `#B0483A` = failure/overflow/offline; rule-bordered empty = pending. Alarm always carries a sentence.
5. **One plum primary per screen**: "Use this design" (top bar) in campaign context; "Create first draft" on Start (top-bar button disabled there); "Re-proof rev N" in proof mode when stale; dialogs keep their own primary.
6. **AI lock**: while an operation runs, canvas gets a canvas-token 72 % wash + centred card with Cancel; right rail 78 % white wash + note; undo/redo and Use this design disabled; composer disabled; top bar `AI WORKING · REV n → n+1`.
7. **Revision language** everywhere: `REV n` mono; proof caption states the rendered rev; stale = alarm badge `STALE · REV 3`, current = proof badge `CURRENT · REV 4`; Setup and Review both name the rev they will use.
8. **Overflow is a diagnostic, not a modal**: dashed alarm outline on the offending element, alarm tag, card under the artboard with three fixes that change the *design* (shrink to fit with min size, allow N lines then ellipsis, use display name from Setup). Checked on every save against all samples; status line counts.
9. **Import is honest**: compatibility report lists kept / converted / removed items with reasons before anything changes; "Import with these changes" is the primary.
10. **Conflict is recoverable**: 409 opens S2 with "Keep mine as rev n+1" (recommended, default) or "Take theirs"; both remain in Versions; Compare is optional.
11. **Copy rules**: talk about "design", "revision", "sample", "field". Never "preset", "template engine", "DOM", "node". Number formats stay as designed in the parent handoff.

## 4. Contracts (proposed names; keep backend conventions)

- **Draft save** `PATCH /templates/:uid` body `{ html, width, height, format, fields, assets, schemaVersion, expectedRevision }` → `{ revision, digest, savedAt }` or **409** `{ code: "revision_conflict", current: { revision, digest, savedAt, by } }`. Client keeps the local copy keyed by `uid + baseRevision` for S1 offline/S2.
- **AI edit** `POST /templates/:uid/edit` body `{ instruction, baseRevision, operationId }` streaming stages `{ stage: read|plan|write|check, ... }`, done `{ revision, digest, receipt: { added, removed, changed, fields, assets }, validation }`; failure `{ code, message, ref }`. Same `operationId` retried reconciles, never double-charges.
- **Cancel** `POST /templates/:uid/operations/:operationId/cancel` → `{ state: cancelled|completed|failed }`; **status** `GET .../operations/:operationId`.
- **Compatibility** `POST /templates/import/check` body `{ html }` → `{ verdict: supported|partial|unsupported, items: [{ level: ok|warn|block, message, count }], sanitizedHtml }` (S3).
- **Proof** `POST /templates/:uid/proof` body `{ revision, sampleId, format }` → `{ revision, rendererProfile, url, width, height, pages, bytes, ms, at, issues: [{ level, message }] }`. Client rejects responses whose `revision` ≠ requested.
- **Versions** `GET /templates/:uid/revisions` → list `{ revision, at, by: user|ai|import|restore, summary, usedBy: [editionIds] }`; **restore** `POST .../revisions/:n/restore` creates a new revision.
- **Node identity**: `data-pictify-id` on every editable element; serializer strips `contenteditable`, selection/handle markup, sample substitutions, editor attributes; keeps ids and `{{bindings}}`.
- **Supported HTML profile** (enforced server-side, reported client-side): containers, text, `<img>` from approved assets, borders/backgrounds, flex/grid, inline + scoped `<style>`, static inline SVG if sanitizer allows. Blocked: scripts, forms, iframes, event handlers, remote CSS/fonts, executable/remote URLs.
- **Edition snapshot** freezes `{ templateUid, revision, digest, fields, width, height, rendererProfile, assetManifest }`; any change → new edition revision, approval invalidated (S6 banner).

## 5. Amendments to `handoff-campaigns-r1-2026-09-05.md`

- **FE-6 Setup**: replace the brand block with the **Design** section (`H8M-0`); brand editing moves to the studio Brand rail (link "Brand settings"). Empty state = three starters (Create with AI · Import HTML · Choose existing) → opens the studio in campaign context; return via "Use this design" lands on S7 with the toast.
- **FE-7 Summary/CardPreview**: render from the *selected revision's* HTML with sample values, not from a preset; row "Design · name · rev n · proof ok/stale".
- **FE-8 Presets**: **drop** as a product surface. Keep the two HTML files as starters under `src/lib/campaigns/starters/` and as fidelity fixtures for B00/B05 tests. Keep the typed-metric contract and `textEquivalent(row, config)`.
- **D06 / V-1**: preview tiles are rendered from the edition's frozen revision; approval panel names it.
- Nothing else in §2–§7 changes.

## 6. Tasks

**B00 — prove the round trip (do first, report before B02)**
- [ ] B00-1 Authenticated create → visual edit → AI edit → visual edit on the real `TemplateStudio` path using `editTemplateBySaying`; record whether the agent honours `data-pictify-id` and the supported profile. If not, fix the agent prompt/serializer before any inspector work (Gate A).
- [ ] B00-2 Renderer parity: render OUT-01/OUT-02 starters + 3 edited variants through the production PNG/PDF path; diff against browser DOM; note font/asset gaps.
- [ ] B00-3 Compatibility pass on three real customer-style HTML files → report shape of S3.
- [x] **B00-4 Node identity, required before B02** (added 2026-09-05 from the Gate A result). Gate A PASSED empirically — two live edits through `POST /template-studio/:uid/edit` on a probe carrying four `data-pictify-id` attributes preserved all of them, through a cosmetic edit AND a structural flex rewrite that reordered and re-nested every element. Two things it did not do:
  - Elements the AI **creates** get an id only sometimes. Edit 1 invented `metric-label`; edit 2's two new flex wrappers got none (7 elements, 5 addressable). An element the AI just made is exactly the one a user reaches for, and it is unselectable.
  - Preservation is **emergent, not instructed**. Nothing in `routes/template-studio.js` mentions node identity; the model is generalising from "preserve everything the user did not ask you to touch". That works today and can regress silently on a prompt tweak or a model change.

  Therefore:
  - (a) **Prompt clause** in `editViaAgent`'s `instructions`: every element carries `data-pictify-id`, preserve them exactly, never renumber, give any new element a fresh unique one. This is a HINT.
  - (b) **Post-AI serializer pass** that assigns an id to any element lacking one and re-ids duplicates. This is the CONTRACT. (a) failing must degrade to "new element gets a generated id", never to "new element is unselectable". Do not ship (a) alone — an unenforced prompt instruction is not a contract.

  Blocked with the rest of the studio work: `routes/template-studio.js` lives only on `worktree-onboarding-v2`, so neither fix can be committed from `feat/campaigns-r1` until that branch reaches it.
- [ ] B00-4 **Node identity contract (added 2026-09-05 after Gate A):** Gate A passed — existing `data-pictify-id` values survive cosmetic and structural AI edits — but preservation is emergent, and elements the AI creates get an id only sometimes. Required before B02: (a) an explicit clause in the edit instructions in `routes/template-studio.js` (preserve every id exactly, never renumber, give new elements a fresh unique id); (b) a post-AI serializer pass that assigns an id to any element lacking one and re-ids duplicates. (b) is the contract; (a) is the hint.

**Blocked on the user (2026-09-05):** `routes/template-studio.js`, `service/design-agents.js`, `service/template-agent.js` live only on `worktree-onboarding-v2` (14 commits ahead of master, fast-forwardable). `feat/campaigns-r1` branched from master, so the studio edit endpoint is a 404 there. The peer's merge was denied by its permission settings. Recommended path: land `worktree-onboarding-v2` on master via PR, then merge master into `feat/campaigns-r1`. Fallback: merge the branch directly into `feat/campaigns-r1`. FE-6/7/8 and B01–B06 wait on this; BE-4, FE-9, FE-10 proceed.

**B01 — studio states & shell (boards ST-01…ST-08)**
- [ ] B01-1 Extend `TemplateStudio.svelte` shell to the three-column layout with Say it | Layers and Selection | Inputs | Brand tabs, stage toolbar with modes, status line, top-bar save states (S1).
- [ ] B01-2 Start state (`H03-0`): format choice, description, starters, Import HTML, Choose existing; Brand rail.
- [ ] B01-3 Setup Design section + return toast (S7); approved-edition banner (S6).
- [ ] B01-4 Keyboard map (S8) and live-region announcements.

**B02 — visual stage** (extract from `src/routes/test/visual-html/dom-editor.js`)
- [ ] B02-1 Selection (deepest editable, double-click text, shift-click siblings, select parent, click-empty deselect), Moveable handles at all zooms, Selecto marquee; context bar + tag.
- [ ] B02-2 Flow vs Free: offset for flow elements, DOM reorder for layout order, Free = absolute; never auto-convert flex children; disable handles on unsupported nested transforms with an explanation.
- [ ] B02-3 Inline text editing with bindings as chips; one transaction per blur/Escape.
- [ ] B02-4 Layers tree (nesting, drag reorder, lock/hide, rename), group properties rail (`GJE-0`).
- [ ] B02-5 Add Text / Image / Shape / Field; duplicate/delete; nudge; zoom fit/50/100.

**B03 — bindings, assets, diagnostics**
- [ ] B03-1 Field picker (`GGI-0`) from campaign field definitions; typed formatting; empty-value treatment; escape substituted text.
- [ ] B03-2 Inputs rail with per-field samples and FITS/OVERFLOW; sample switcher; fixtures per spec §9.
- [ ] B03-3 Overflow diagnostic (dashed outline, tag, card, three fixes) evaluated against all samples on save.
- [ ] B03-4 Asset controls: replace/upload/pick from Brand; missing-asset state (S4) blocks "Use this design".
- [ ] B03-5 Import compatibility report (S3) wired to `/templates/import/check`.

**B04 — history, autosave, revisions, AI operations**
- [ ] B04-1 One editor store: canonical draft, transaction history (manual gesture / text commit / AI result = one entry), save queue, AI operation state.
- [ ] B04-2 Autosave 2 s debounce with `expectedRevision`; S1 states; offline local copy + replay; S2 conflict dialog on 409.
- [ ] B04-3 AI run: flush edits → await save → submit with `baseRevision + operationId` → lock (ST-04) → stages → commit once → replace canvas + one history entry + proof stale. Cancel is a server op (ST-04 card and rail). Failure keeps draft + instruction (ST-04b).
- [ ] B04-4 Versions panel (S5) with restore-as-new-revision.

**B05 — proof and campaign integration**
- [ ] B05-1 Rendered proof mode (ST-06) with stale/current badges, caption, Re-proof; reject stale responses by revision.
- [ ] B05-2 Edition snapshot freezes the revision (§4); Setup/Review show it; changing revision invalidates approval; "Use this design" gate = saved compatible revision + resolved fields/assets + current proof.

**B06 — hardening**
- [ ] B06-1 Security: server profile enforcement, CSP/URL validation for CSS, tenant checks on draft/operation/assets, no raw datasets in AI/replay logs.
- [ ] B06-2 Accessibility: whole flow by keyboard; focus rings; announcements.
- [ ] B06-3 Regression: existing Platform templates, AI studio, rendering API; acceptance table in spec §11 executed with evidence in the report.

**Recommended order:** B00 → B01-1/B01-2 → B04-1 (store first, the rest hangs off it) → B02 → B03 → B04-2/3/4 → B01-3/B05 → B06.

## 7. Acceptance for this handoff

- Every board in §2 has a matching screen or state, screenshotted at 1440 (plus 1024 for ST-01 with rails collapsed).
- The eleven acceptance tests in spec §11 run, with pass/fail and evidence.
- Gate A result (B00) reported explicitly, including what the agent could not do.
- No preset language remains in the campaign UI; Setup, Review and Export name the design revision.
- Report once at the end: commits, screenshots, test evidence, decisions taken under the mandate, open items.
