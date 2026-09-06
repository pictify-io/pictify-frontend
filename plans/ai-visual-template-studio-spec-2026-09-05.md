# AI-first visual HTML template studio

> **Consolidated authority:** [Pictify AI-native product specification](pictify-ai-native-product-spec-2026-09-05.md) now governs product scope, architecture, sequencing and estimates. This document remains a detailed implementation reference; conflicting earlier decisions are superseded.

**Version:** 1.0 · **Date:** September 5, 2026  
**Decision:** direction approved by the user after testing `/test/visual-html` in `redesign-v2`.  
**Status:** implementation specification; prototype approval is not production readiness.  
**Parent:** [Customer value campaigns product spec](customer-value-campaigns-product-spec-2026-09-05.md), v1.3. This document governs template creation/editing and supersedes its former controlled-preset-only assumption.

## 1. Product decision

Keep HTML/CSS as the template source of truth. Users describe what they want, see the resulting design, then directly customize that same document on a visual canvas. Their next AI instruction starts from the latest manual changes. HTML code is an optional advanced capability for Platform users, never a required Campaigns step.

Build an in-house editor around the browser DOM, using Moveable for manipulation and Selecto for selection. Reuse the redesign-v2 Template Studio, Say it rail, template API and rendering infrastructure. Do not revive the old HTML copilot, use GrapesJS as the editing surface, convert HTML into Fabric objects, or create another product/account system.

This is one shared studio within Pictify. Campaigns opens it in campaign context; Platform tools opens the same studio from Templates. Keep the existing host and shared accounts, teams and billing. The approved test route remains a development sandbox, not a production URL.

## 2. What approval covers, and what remains unproven

| Area | Prototype evidence | Production requirement |
|---|---|---|
| Direction | User accepted AI-first HTML plus visual controls | Implement in the real redesign studio |
| Manual editing | Selection, property edit, local save and undo exercised | Pointer drag/resize, multi-select, text, keyboard and history regression coverage |
| AI | Wired to redesign `editTemplateBySaying` and SayItRail | Authenticated create → visual edit → AI edit round trip, interruptions and conflicts tested |
| Source | HTML retained, editor UI stripped from tested local save | Canonical serializer and server validation; protected typed bindings |
| Persistence | Local storage and a separate test template on first AI request | Stable draft UID, autosave, revisions, recovery and tenant authority |
| Outputs | Browser DOM canvas and HTML download | Exact PNG/PDF renderer proof, immutable approved revisions and pinned assets |
| HTML support | Simple sample/imported HTML | Explicit supported profile, compatibility diagnostics and security enforcement |

## 3. Release scope

### Required for the first production builder

- Generate a first design from a description or start from an editable starter; select PNG card or one-page PDF before generation.
- AI editing of the whole template, with streamed progress, cancel, failure recovery and one undoable result per instruction.
- Visual selection, inline text editing, right-rail properties, drag, resize, constrained rotation, duplicate/delete, layout order, alignment and keyboard nudging.
- Add text, image, shape and approved dynamic field. Replace images and apply brand fonts/colors.
- Layer tree, select parent, locked layers, zoom/fit and overflow diagnostics.
- Typed binding controls and synthetic sample previews, including long and missing values.
- Stable server draft, autosave status, unified undo/redo, version restore and conflict handling.
- Production renderer proof and immutable template revisions for campaigns.
- Accessible keyboard/property-panel alternatives to pointer actions.

### Deferred

Multi-user live collaboration; animation/video; arbitrary websites with scripts; arbitrary external CSS frameworks; automatic responsive website design; custom plugin execution; arbitrary user-authored template expressions; unrestricted HTML import in Campaigns; custom fonts without the asset validation pipeline; AI editing targeted to an arbitrary multi-element selection. Selection-targeted AI can follow after stable IDs and a validated patch contract are proven. Whole-template AI editing is sufficient for R1.

## 4. Entry points and end-to-end flow

**Campaigns:** Setup includes a Template section with “Create with AI,” “Choose template,” and “Edit design.” Opening the studio preserves campaign/edition context and returns to Setup through “Use this design.” Starter PNG and PDF designs are editable starting points. Existing Paper D02/D03 requires this addition; it must not imply users can only change a logo/color.

**Platform tools:** Templates → New template opens the shared studio. Existing saved HTML templates open in compatibility mode until checked against the visual-editing profile. Existing workflows continue rendering their current source; opening a template must not silently rewrite it.

**Create:** choose output → describe the purpose and desired composition → AI produces a draft using synthetic field values → inspect and edit → preview sample data → save a named revision → use in campaign. Reopening the draft must recover the same UID, not create another template.

**Revise:** open draft → edit text/layout or describe a change → review renderer proof → explicitly use the saved revision. A draft edit cannot alter an approved or running edition. Applying a different revision to an edition invalidates approval and requires representative previews again.

**New period:** reuse the previous template revision by default; offer “Edit design” to create/use a newer revision deliberately. Never automatically follow a mutable “latest template” pointer.

## 5. Design and interaction specification

Use redesign-v2's brand tokens, restrained typography, lime active states and existing controls. Reuse its shell and components rather than creating a parallel visual system.

| Surface | Content and behavior |
|---|---|
| Top bar | Back to campaign/templates, editable name, output/dimensions, saved/saving/offline/conflict state, undo/redo, Preview, primary “Use this design” in Campaigns or Save in Platform |
| Left rail | Say it composer and chronological instruction/result receipts; optional Layers tab; live stages, cancel and retry; no code editor exposed by default |
| Center | Browser-rendered HTML artboard; Design / Preview data / Rendered proof modes; fit, zoom, selection outline and handles; controls outside exported markup |
| Right rail | Selection-specific properties; when nothing selected, document dimensions/background and brand; Inputs tab for typed fields/sample values |
| Status area | Concise saving/proof/validation state with actionable error links; no generic success message while proof is stale |

Default to Fit on entry and viewport changes without resetting the user's deliberate zoom. Maintain selection and scroll after ordinary property edits. At narrow desktop widths allow collapsing rails; below the tested editing width show preview and a clear larger-screen editing prompt. Do not claim full mobile editing in R1.

**Selection:** click selects the deepest supported editable element; double-click enters leaf text. Parent selection and Layers disambiguate nested containers. Shift-click toggles compatible siblings; mixed parent/child selections normalize to avoid applying a transform twice. Clicking empty space deselects. Locked elements remain reachable from Layers but cannot be accidentally changed.

**Text:** allow caret editing of static text. Render bindings as non-editable chips in edit mode; use the binding panel to replace a field. Escape exits text editing; blur commits one text transaction. Never flatten nested markup through `textContent` as a general text-edit operation.

**Layout:** distinguish flow elements from freely positioned elements. Dragging a flow element uses an explicit visual offset; reordering changes DOM order. Do not silently convert flex/grid children into absolute positioning. Inspector labels explain “Offset” versus “Layout order.” Resize obeys box sizing and documented constraints; unsupported rotated/nested-transform cases disable handles with an explanation. Rotation defaults to images/shapes, not metric text containers.

**Keyboard:** Tab reaches named controls; Layers supports selection; arrows nudge selected objects, Shift+arrow uses a larger increment. Delete only acts when the canvas owns focus, never inside an input. Cmd/Ctrl+Z and redo respect text-editing transactions. Provide visible focus, labeled handles/actions and status announcements.

**Busy/error states:** flush the active manual edit before starting AI. Freeze design mutations during the AI run, keep navigation/cancel available, and explain the lock. On failure retain the current draft and instruction with Retry. On completion show the actual revision's change receipt, then refresh proof. Never represent a partial streamed result as the saved design.

## 6. Supported HTML and CSS contract

R1 targets static, fixed-size media documents. Support ordinary semantic containers, text, approved images, borders/backgrounds, flex/grid layouts, inline styles and scoped style blocks; approved embedded static SVG only if the sanitizer/render pipeline supports it safely. Exclude scripts, forms, embedded pages, event handlers, remote stylesheets and executable URLs. One page per PDF is a validated output constraint, not an assumption.

AI should generate this supported subset, stable element IDs, predictable group containers and explicit template bindings. Encourage flow layout for variable-length text and free positioning for decoration. It must not invent metric fields or turn customer values into factual claims.

An HTML compatibility pass returns supported, partially editable, or unsupported with concrete reasons. Unsupported fragments may remain read-only in Platform; Campaigns cannot activate a template with unresolved blocking compatibility issues. Offer to duplicate and simplify an existing template before changing it. Sanitization must report material changes instead of silently claiming fidelity.

Stable `data-pictify-id` values identify nodes across manual changes. Duplicates receive new IDs. AI output is checked for uniqueness; replaced nodes may receive new IDs and clear obsolete selection. IDs are editor metadata, never an authority or tenant boundary. Source serialization removes controls, selection attributes and contenteditable state while retaining approved IDs/bindings. Customer sample substitutions are never serialized into the canonical template.

## 7. State, revisions and AI consistency

Maintain one canonical template draft containing HTML, dimensions, output format, typed field definitions, asset references and schema version. Selection, zoom, open panels and pointer state live separately and do not mark the document dirty.

Every completed manual gesture, committed text edit and accepted AI result is one history transaction. Batch slider/drag updates; do not create a revision per pointer event. Undo/redo changes the canonical draft and canvas together. A subsequent edit truncates redo. Restoring an older saved revision creates a new revision rather than deleting history. History includes geometry, fields and asset references, not HTML alone.

Autosave uses a stable UID and an expected revision/version. Serialize pending saves before AI, and reject stale writes on the server. Two tabs cannot silently overwrite each other. Show a conflict with recoverable local copy and explicit reload/duplicate choice. A saved indicator means server acknowledgement, not localStorage success. Local recovery must follow campaign privacy/retention policy; never persist real customer datasets in browser storage.

AI sequence:

1. Commit inline edits and await the latest draft save.
2. Submit instruction, base revision and a unique operation ID.
3. Run the current studio agent against that immutable base; expose progress.
4. Validate/sanitize the candidate HTML, fields, assets and supported profile on the server.
5. Commit at most once only if the base is still current. Return new revision and change receipt.
6. Replace the canvas document, append one history entry and mark renderer proof stale.

Retrying an ambiguous request uses the same operation ID and reconciles its outcome before starting another charged run. Cancel is a server operation: aborting the browser stream alone does not prove generation stopped. A result racing with cancel must be reported truthfully and recoverably. Disconnect/navigation must not lose the committed result. Define operation retention and billing reconciliation before shipping.

The prototype's save-then-edit calls and local undo are useful demonstrations, not sufficient concurrency/version semantics for production.

## 8. Fields, customer data and assets

Use the parent campaign spec's typed metric contract. Bindings reference field IDs/names, type, formatting, required/optional status and empty-value treatment. Provide a picker; users should not need to type `{{...}}`. Escape all substituted text. Image bindings, if enabled, resolve only through the approved asset pipeline. Arbitrary HTML substitution and user-authored expressions are outside R1.

AI creation/editing uses synthetic samples, field definitions and public/non-sensitive instructions. Do not attach campaign CSV rows, recipient details or rendered real-account proofs to model requests. Prompt placeholders and explanatory copy should discourage pasting customer data. Define and enforce backend context allowlists; masking analytics alone does not satisfy this requirement.

Copy uploaded fonts/logos/images into private versioned assets with validated type, size and readiness. Pin the exact dependency versions in a published template revision and edition snapshot. Restrict asset network access in both the browser sandbox and production renderer. DOMPurify alone does not constrain CSS network requests; enforce CSP, CSS/URL validation and server egress/SSRF controls. AI output and imports pass the same server policy.

## 9. Preview, validation and campaign approval

Design mode edits tokens; Preview data substitutes a selected synthetic/authorized sample without changing source. Rendered proof uses the production renderer and exact revision, dimensions, fonts and assets. Show revision/proof freshness. Reject stale responses using revision IDs, not merely arrival order.

Required fixtures: short/long account names, Unicode, maximum numeric magnitude, negative/zero values, missing optional values, long period labels and image/font failures. Validate all eligible rows for binding errors and detectable overflow before full generation; ten representative proofs supplement this, not replace it. PNG must fit the chosen artboard. PDF must fit the chosen A4/Letter page; an extra page blocks approval. Text must remain legible at intended email display size.

“Use this design” requires a saved compatible revision with resolved required fields/assets and current output proof. Campaign approval additionally requires the parent spec's dataset, audience, metric and representative-preview checks. Freeze template revision, source digest, fields, dimensions, renderer profile and asset manifest in the edition snapshot. Any relevant change creates a new edition revision and invalidates its approval.

Browser DOM fidelity is not enough to approve output. Reuse existing rendering for PNG/PDF, verify parity, and retain export-only delivery: no email sending is added by this builder.

## 10. Implementation map and proposed contracts

| Area | Implementation direction |
|---|---|
| Studio shell | Extend `src/lib/components/studio/TemplateStudio.svelte`; reuse `SayItRail`, `StudioTopBar`, `InputsRail`, proof infrastructure |
| Visual stage | Extract reusable components/utilities from `src/routes/test/visual-html`; isolate DOM mutation, selection/transform adapters and serialization |
| Editor state | One store/controller for canonical draft, transaction history, save queue and AI operation; UI panels invoke commands rather than mutate separate HTML copies |
| API client | Extend `src/api/template.js`; keep existing callers compatible |
| Backend | Template revision/CAS, server policy validation, idempotent studio operations and recoverable operation status |
| Campaigns | Setup template picker/studio return context; immutable template revision in edition snapshots |
| Test route | Keep dev-only; stop creating a new draft per page session in production |

The following are proposed additions, not claims about current endpoints:

- Draft update includes `expectedRevision`; return authoritative revision/digest or `409 revision_conflict`.
- Studio edit includes `baseRevision` and `operationId`; done receipt includes committed revision, fields/assets changes and validation results.
- Operation status/reconciliation and cancel endpoints are tenant-scoped. Exact route names follow backend conventions during contract implementation.
- Template revision selection/publication returns immutable source and asset references suitable for campaign snapshotting.
- Validation/proof response includes revision, renderer profile, output dimensions/page count and blocking/advisory issues.

Enforce ownership, edit permission, pilot entitlement, request limits and metering on the server. Reuse existing identity/billing. A client-side route or feature flag is not authorization. Creation must be deduplicated, and template-cap errors must not discard the unsaved design.

## 11. Design deliverables and acceptance tests

Design the following states before implementation completion: empty creation; generating; AI failure/cancel; selected text/image/container; nested layer selection; binding picker; unsupported HTML; missing asset; overflow; saving/offline/conflict; undo/restore; stale/current proof; return to campaign; approved-edition edit warning. Update D02/D03 with the studio entry/return and D06 with exact-revision proof. OUT-01/02 become starter layouts and fidelity fixtures.

| Test | Pass condition |
|---|---|
| AI → manual → AI | Generate, change headline/geometry/color manually, request another change; latest manual source is the base and result remains editable |
| History and remount | Text/property/drag/add/delete/AI undo and redo restore canonical source and DOM; restoring the original srcdoc repaints correctly |
| Bindings | Rename/remove fields deliberately; required mapping errors surface; sample values never replace canonical tokens |
| Persistence | Reload recovers same draft/revision; offline save failure is visible; two tabs produce conflict rather than silent loss |
| AI recovery | Disconnect/cancel/retry race resolves to one visible committed outcome and no duplicate quota debit |
| DOM mechanics | Drag/resize at multiple zooms and scroll positions; nested transforms handled or disabled; multi-select avoids double transforms |
| Fidelity | Browser and production proofs tested for supported CSS/fonts/assets; PNG bounds and one-page PDF verified |
| Snapshot isolation | Editing shared template cannot alter approved/running output; new revision requires new approval |
| Security | Cross-tenant draft/operation/assets denied; script/CSS/URL attacks blocked in browser and renderer; raw datasets absent from AI/replay logs |
| Accessibility | Entire selection/property editing flow possible by keyboard; focus and error/progress state announced |
| Regression | Existing Platform templates, AI studio and rendering API remain functional under their existing contracts |

Do not label authenticated AI, security, rendering parity or production persistence as verified based solely on the prototype. Record test evidence and remaining failures in the release checklist.

## 12. Marketing and product presentation

Keep `/campaigns/customer-value-updates` as the focused campaign landing page on the existing marketing host. Show “Describe → customize → preview → generate → export” with a short genuine studio demonstration: generate a branded starter, change a headline/color visually, preview two synthetic accounts, then show the resulting media. The builder supports the campaign outcome; do not reposition the whole homepage as a general design tool.

Suggested feature copy: “Start with AI. Make it yours visually.” Pair it with the concrete capability: editable text, images, layout and dynamic fields. Do not promise Canva feature parity, universal HTML compatibility or production readiness from the prototype. Until release gates pass, label demos as prototypes and retain Request pilot access. After pilot access is granted, carry campaign intent through sign-in into Setup → Template; no extra product signup or app-subdomain migration.

Update Paper's campaign landing design and D02/D03 to match this workflow. Existing platform marketing can describe the same studio from an API/template perspective without creating another brand. M01 marketing implementation remains a separate 12–20h package in the parent spec.

## 13. Work packages, estimates and release gates

Planning estimates, not a delivery promise. These are incremental builder hours beyond the parent spec's original controlled-preset campaign scope; avoid counting shared work twice when scheduling.

| Package | Work | Hours | Depends on |
|---|---|---:|---|
| B00 | Prove authenticated AI/manual round trip, HTML compatibility and renderer parity on representative fixtures | 8–12 | Current prototype |
| B01 | Final studio states, Campaigns entry/return and keyboard design | 8–12 | B00 |
| B02 | Extract visual stage; robust selection, layout transforms, layers, text and property commands | 24–36 | B00, B01 |
| B03 | Typed bindings, asset controls and compatibility/overflow diagnostics | 16–24 | B00, campaign metric/asset contracts |
| B04 | Canonical history, autosave/CAS, persistent revisions and recoverable AI operations | 24–36 | B00, backend contracts |
| B05 | Production proof, campaign revision integration and snapshot invalidation | 12–20 | B03, B04, campaign approval/storage work |
| B06 | Security/accessibility/regression hardening and acceptance evidence | 16–24 | B02–B05 |
| **Incremental total** | | **108–164** | |

Combined planning envelope: original **142–220h** campaign work plus **108–164h** builder = **250–384h**, approximately **8–12 weeks at 32 planned engineering hours/week**, with the remaining eight of the user's 40 hours reserved for uncertainty/support. GTM remains the separate 20-hour allocation. Including the parent spec’s separate M01 marketing package (12–20h) gives **262–404h**, roughly **9–13 weeks** at the same planned capacity. Re-estimate after B00; these totals are scope envelopes, not claims that all original work remains undone.

**Gate A — direction viability:** B00 demonstrates the actual agent and renderer round trip. Fix model output constraints or editing support before building a large inspector.

**Gate B — usable internal studio:** B01–B04 pass synthetic editing, persistence and failure tests. Enable internal workspace only.

**Gate C — campaign-ready:** B05–B06 and all parent campaign reliability/privacy/export gates pass. Then enable one pilot workspace. Builder approval does not waive those gates.

If schedule must shrink, reduce optional transforms/layout tools, advanced import and the second output format. Preserve AI creation, practical visual customization, binding safety, durable saving and approval integrity. Track usage/cost/failures without recording prompts, HTML or customer values in general analytics. Expand controls based on observed task failures rather than a generic design-tool feature checklist.
