# Pictify AI-native product specification

**Version:** 1.0 · **Date:** September 5, 2026  
**Status:** consolidated implementation direction; proposed behavior is not shipped capability.  
**Owner/capacity:** founder; 40 engineering hours/week, planned as 32 delivery + 8 contingency/support; separate 20 GTM hours/week.  
**Approved foundation:** redesign-v2 visual HTML prototype, shared Pictify product, Campaigns experience, media/export delivery.  
**New proposed scope:** brief-to-campaign assistance, selection-aware edits, brand context, mapping assistance and campaign review, sequenced below. This document is not evidence that those features were individually implemented or tested.

## 1. Authority and outcome

This is the single product and architecture authority for the AI-native direction. It consolidates and supersedes conflicting direction in the campaign product spec, visual studio spec and earlier AI opportunity discussion. Earlier documents remain detailed references and evidence, not separate competing roadmaps. Backend audit findings are incorporated as release requirements.

**Product outcome:** a customer-success or lifecycle operator describes a customer-value campaign, creates a branded design, customizes it visually, maps approved account metrics, resolves problems, approves representative outputs and exports a reliable account-matched package. For the next period, the operator reuses the approved configuration and reviews what changed.

AI reduces the work of preparing and reviewing the campaign. Deterministic software owns identity, data validation, rendering, saved revisions, permissions, approval and execution. The user owns metrics, audience and final approval. A successful AI response is not itself a successful campaign.

**Initial wedge:** repeatable customer-value updates for B2B SaaS teams that already have usable account metrics and a sending tool. Launch with up to 250 accounts, one selected PNG card or one-page PDF format per edition, and one to three buyer-approved metrics. These are release targets requiring acceptance evidence, not verified current capacity.

## 2. Decisions carried forward

| Decision | Product consequence |
|---|---|
| One Pictify product | Shared accounts, teams, assets, billing and template infrastructure |
| Campaigns and Platform tools are focused experiences | Navigation preference is separate from entitlement and permissions; users can switch without another login |
| No app-subdomain migration now | Keep existing host/routes; marketing layout is independent of authenticated application layout |
| AI-first creation plus visual customization | Users can describe a design and directly edit it without touching HTML |
| HTML/CSS remains canonical | Use browser DOM + Moveable/Selecto; no HTML-to-Fabric conversion or GrapesJS interface |
| Extend the existing agent | Preserve its tool loop, image inspection and validation feedback; do not introduce a multi-agent framework by default |
| Delivery remains media/export | No native email sending, recipient management, CRM/CDP, or autonomous campaign delivery |
| Product readiness precedes live commitments | Interviews and synthetic demos continue; paid delivery waits for the full release gate |
| Customer data stays outside model context | Use synthetic values and tightly controlled metadata/diagnostics; any exception needs a separate privacy/product decision |

Do not position this as a general-purpose Canva replacement, an autonomous CSM, or a system that discovers business metrics and proves ROI. Do not remove existing API/Fabric/video workflows to launch Campaigns.

## 3. AI-native capabilities and release scope

| Capability | User-visible result | AI responsibility | Deterministic/human boundary | Release |
|---|---|---|---|---|
| Brief → campaign draft | “Create a monthly value update about time saved” produces suggested layout, output and required fields | Propose a structured brief and design | User confirms metric meaning; no invented source values/formulas | R1 |
| Brand-aware generation | Draft uses the selected brand's fonts, colors and assets | Compose using trusted brand context | Asset ownership, compatibility and availability checked by code | R1 |
| Selection-aware edits | “Make this metric more prominent” changes the selected block | Propose scoped operations | Server validates target IDs, base revision, locks and scope | R1, bounded operations |
| Visual customization | Direct text, image, layout and styling edits | Optional contextual assistance | Canonical editor commands and history | R1 |
| Mapping assistant | Proposes matches between uploaded columns and required fields | Resolve semantic ambiguity from approved metadata | Parser/type rules validate; user confirms mapping | R1, optional suggestion |
| Campaign reviewer | Shows concrete data/layout issues and repair proposals | Explain structured diagnostics and propose design repairs | Rule checks cover every eligible row; human approves final revision | R1 |
| Campaign-wide repair | “Make this work for long names” yields a checked layout adjustment | Repair using synthetic stress fixtures | Revalidate full audience and invalidate stale approval | R1 for supported layouts |
| Next-period assistant | Reuses design/mapping and explains configuration/data-schema changes | Explain a deterministic diff | User uploads fresh data and approves again | R1 reuse; richer assistance R1.1 |
| Scheduling/connectors | Prepare recurring campaigns from external sources | Potential future assistance | Separate demand, privacy and operational gates | Later |

AI suggestions are optional at mapping and review steps. A provider outage must not block valid manual mapping, visual editing or review of deterministic validation results.

## 4. End-to-end experience

### 4.1 Discover and enter

Marketing leads with “Turn approved customer metrics into branded value updates.” The focused route remains `/campaigns/customer-value-updates`. Demonstrate Describe → Customize → Preview → Generate → Export with synthetic data and real product screens. “Start with AI. Make it yours visually.” supports the outcome; it is not a separate product proposition.

Before release use Request pilot access and label prototype demos. After access is granted, preserve safe campaign intent through sign-in into campaign setup. Do not put datasets or access tokens into URLs. Retain the existing platform homepage proposition and add a Campaigns destination/example.

Unknown-intent users receive a one-time experience choice. Existing Platform users retain their default. Remember experience per user/team; server entitlement and role checks remain authoritative. Campaigns access requests do not create a second tenant or subscription.

### 4.2 Describe and confirm a campaign brief

Campaigns → New → describe the communication purpose. Offer a visible editable brief with campaign name, period/cadence, audience description, output format, brand and one to three metric slots. Show what is known and what needs the user's answer.

AI may suggest “hours_saved” as a field needed for a time-saved story. It may not infer actual hours, a monetary conversion or whether a decrease is good. Required metric semantics include label, unit, direction, source definition, optional comparison and empty-value treatment. Unsupported claims such as guaranteed ROI are flagged for correction.

Users can skip the prompt and configure the same structured brief manually. A brief is a draft, not an approved campaign or an instruction to generate the full audience.

### 4.3 Create and customize the design

Setup → Template offers Create with AI, Choose template and Edit design. PNG/PDF starter layouts are fully editable. Open the shared redesign Template Studio in campaign context and return through Use this design; users do not switch to Platform tools to edit.

AI generates against the confirmed brief, field contract, synthetic values and brand. The visual stage displays the same HTML the agent edits. Select a block, describe a change, inspect the result, fine-tune it manually and continue with AI from the latest saved draft.

Use this design selects a saved immutable template revision with a current valid production proof. It does not approve customer data or launch generation.

### 4.4 Upload, map and validate

Upload CSV with canonical string account IDs and approved metrics. Do not request email addresses. Parse and validate deterministically, then suggest column mappings. R1 can use local heuristics first; AI receives only user-approved, sanitized column labels and coarse type descriptors, never raw rows or sample values. Headers can themselves be sensitive, so suggestions must work manually when metadata sharing is unsuitable.

Present source column → field, inferred type and an explanation; unknown/ambiguous remains unresolved rather than receiving a fabricated confidence score. Require confirmation before storing mapping. Never silently convert optional blank to zero or change audience eligibility.

Reject duplicate IDs, malformed/ambiguous numbers, unsafe magnitudes, missing required values and invalid assets. Numeric zero is valid. Define decimal precision/locale explicitly. Show row-specific problems privately in the app; fix/upload/exclude according to explicit user choices. Exclusions change the audience revision.

### 4.5 Review and repair

Run deterministic binding, asset, bounds/overflow and output checks across every eligible account. Choose ten representative previews using risk-based sampling, including extremes and missing values. Samples supplement all-row validation.

Show an issue list with severity, rule, affected-count, source revision and navigation to examples. The AI can explain sanitized rule output and propose a layout patch tested on synthetic stress fixtures. Actual account names, values, images and real-account proofs are excluded from model input.

AI cannot establish business truth from pixels. Unsupported-claim checking begins with metric/field rules and buyer-approved copy. Unverifiable narrative claims require human review rather than an AI “passed” label. Distinguish machine-verified issues from advisory suggestions.

Each repair previews its changes and applies as one undoable transaction. Revalidate affected checks and refresh proof. Real-data editing never happens as an automatic fix for a design problem.

### 4.6 Approve, generate and hand off

Approval records the exact audience, normalized data, metric definitions, template revision, asset manifest, output profile and reviewed proofs. Any change invalidates approval for the new revision. AI cannot approve, exclude accounts, start paid bulk work, delete edition data or send messages on its own.

Generate is an explicit user action. Persist accepted work durably, reconcile every artifact, support failed-only retry/cancel, and preserve approval snapshots. Ready means every required artifact verified, not “some succeeded.” Export ZIP + account-ID manifest + text equivalent. Buyer uses their existing delivery system. Successful export does not mean sent or delivered.

### 4.7 Repeat

New period reuses the prior approved template revision/configuration, accepts fresh data and displays a deterministic change summary. Flag schema, brand, metric or template changes. Do not follow a mutable “latest template” silently. Review and approval are required each period; scheduling remains deferred.

## 5. Interface and design requirements

Use redesign-v2 tokens, typography and components. Keep the guided campaign workflow visible; AI assistance should appear in context, not replace the app with one generic chat screen.

| Surface | Required behavior |
|---|---|
| Studio top bar | Name, output/dimensions, saved/saving/offline/conflict, undo/redo, proof freshness, return to campaign |
| Left rail | Say it + Layers; selected-scope indicator, instruction receipts, progress, cancel and retry |
| Center | HTML artboard; Design / Preview data / Rendered proof; Fit, zoom, selection and handles |
| Right rail | Text/image/container properties, brand, bindings and sample controls |
| Review panel | Deterministic issues, affected count, fix proposal, preview and apply; no vague “AI score” |
| Change receipt | Actual changed nodes/fields plus validation state; generated prose is secondary |

Examples: “Editing: selected metric card”; “Using: Acme brand and synthetic samples”; “Changed: spacing and type size”; “Three accounts still need review.” Do not claim fields were preserved unless verified.

Provide selection/parent/layer controls, compatible multi-select, inline static text, image replacement, duplicate/delete, ordering, alignment and keyboard nudging. Bindings are protected chips edited through the field picker. Flow layout reordering and visual offset are separate controls; dragging must not silently absolute-position flex/grid children. Limit rotation to supported cases. Disable unsupported handles with a reason.

Fit initially; preserve deliberate zoom, selection and scroll across normal changes. Collapse rails on narrower desktops. Full mobile editing is not R1; provide usable preview and a larger-screen editing prompt. Keyboard/property-panel alternatives, visible focus and announced progress/errors are required.

Design states to deliver: brief empty/ambiguous, brand missing, generating/cancelled/failed, selected text/image/container, unsupported HTML, broken bindings/assets, overflow, saving/offline/conflict, stale proof, review proposal, partial generation, new period and typed deletion confirmation. Update Paper D02/D03 for studio entry/return, D04/D05 for mapping/review assistance, D06 for exact-revision proof; preserve D01–D10 workflow and experience-access states. OUT-01/02 become starters and regression fixtures.

## 6. Canonical document and compatibility

Canonical document: HTML/CSS, schema version, stable element IDs, dimensions/output profile, typed fields, pinned asset references and brand revision. Selection, zoom and panel state are separate UI state. Samples never replace canonical bindings.

R1 supports static fixed-size media with semantic containers, text, validated images, scoped styles, flex/grid and supported positioning. No scripts, forms, embedded pages, executable URLs, arbitrary expressions or remote CSS frameworks. Static SVG is allowed only through a tested sanitizer/render policy. Campaigns import is restricted to the supported profile; Platform can retain unsupported legacy content read-only or in its existing advanced flow.

Compatibility states are supported, partially editable and blocked with specific reasons. Opening old HTML must not silently rewrite it. Offer duplicate-and-simplify before material transformation. Keep editor controls/contenteditable state out of saved/exported markup. Node IDs are metadata, not authorization. Duplicate nodes get new IDs; AI replacements invalidate obsolete selections.

DOMPurify is a browser defense, not the complete policy. The server validates HTML/CSS, URLs, field syntax and assets; CSP and renderer egress controls block network escape. The same finalizer applies to initial generation, patches, full HTML edits, imports and fallback.

## 7. Agent architecture

Retain one agent orchestrator using the existing backend loop. Existing tools—website context, decorative asset generation, render preview and submit—remain useful. Give it a typed operation context:

```
operationId, tenantId, actorId, taskType,
baseRevision, document, editorProfile,
selectedNodeIds, allowedScope, protectedFieldIds,
brandRevision, assetManifest, outputProfile,
syntheticFixtures, toolPolicy, deadline
```

Tenant/actor/permissions come from the server session, not the model or client payload. Client selection resolves against the authoritative base revision. Template source, website content and uploaded metadata are untrusted data; they cannot widen tool policy or permissions.

### Tool contracts

| Tool | Contract |
|---|---|
| inspect_document / inspect_element | Read supported structure, IDs, layout and bindings from the authorized revision |
| propose_patch | Return structured setText/setStyle/replaceImage/reorder/add/remove operations; validate scope, types, locks and preconditions |
| fetch_brand_context | Optional; approved public destinations only, safe fetch and untrusted-content treatment |
| generate_asset | Optional; approved brand/style, tenant-owned asset, bounded cost and lifetime |
| validate_template | Deterministic binding, compatibility, asset and structural diagnostics |
| render_preview | Exact source/assets/output profile with synthetic fixture; returns proof digest, diagnostics and image |
| submit_candidate | Finalize a candidate through policy checks; cannot bypass required final proof or commit stale source |

Small selected edits use patches and no discovery/asset tools by default. Initial design/broad redesign can replace the whole document. Whole-document output and patches share finalization. Reject out-of-scope changes; do not rely on “preserve everything else” prompt wording alone. If an instruction needs wider scope, present a proposal rather than silently changing it.

Keep model reasoning private; show useful tool stages, evidence and change receipts. No model/framework replacement is justified until baseline evaluations show a concrete benefit.

## 8. Persistence, history and operation lifecycle

Create one durable template draft per intentional creation, not per browser reload. Autosave is a serialized queue with expected-revision checks. Saved means server acknowledged. Two tabs produce a recoverable conflict rather than last-writer-wins. Local recovery follows privacy policy and must not retain customer datasets.

One completed gesture/text edit/AI result is one transaction. Undo/redo covers the whole canonical document, including fields/assets/dimensions; restoring an old saved revision creates a new revision. The bounded local history UI is not the immutable campaign revision archive.

AI lifecycle: accepted → running → validating → committed, failed, cancelled or conflicted. A review-only proposal may stop at proposed. Store operation status, base revision, candidate/result revision, cost reservation and safe diagnostics. Versioned status/proof responses prevent stale UI updates.

Before AI: commit inline edits and await save. During AI: lock document mutations while retaining cancel/navigation. After AI: validate against base, commit once, add one history entry, refresh proof. Cancellation is a server request; stream abort alone is not cancellation. Recover committed outcomes after disconnect. Retry ambiguous work with the same operation ID, reconcile first, and never bill twice.

Use a shared absolute deadline and abort propagation through model calls, fetches, render and uploads. Cap tool calls, response bytes, image sizes and model output. Enforce atomic quota reservation by operation ID; release failed work, settle successful work and reconcile interrupted billing. Record provider/tool costs separately from predictable user-facing instruction credits.

## 9. Backend review fixes required before pilot

The reviewed implementation is backend `onboarding-v2` at `d51a7b0`; frontend is `redesign-v2`. Neither proves deployed state. Re-audit relevant diffs during implementation.

| Finding | Required fix and acceptance |
|---|---|
| Automatic fallback drops current HTML/context | Fail without mutation or preserve full typed context; all fallback results use the same finalizer. Simulated provider failure cannot replace a design from a short edit instruction |
| Direct web/image fetches use incomplete hostname checks | Shared safe fetch validates resolved addresses and redirect hops, bounds streaming downloads and prevents private-network access |
| Edit/undo lack explicit content-edit permission | Apply existing role guard; view-only member receives denial without mutation or cost |
| Proof is optional and size defaults to 1080 square | Exact dimensions/format/assets and synthetic fixtures; final digest must have required proof; reject unpreviewed or stale candidate |
| Variable definitions are discarded after validation | Atomically save canonical field contract with HTML and assets; enforce protected fields |
| Save lacks explicit base revision/operation ID | CAS, durable operation status, deduplication and recoverable cancel/retry |
| Deadlines/quota checks are not hard operation bounds | Shared deadline and atomic reservations; concurrent requests cannot exceed reserved allowance or lose charges |
| Undo stores HTML only | Full-document revisions; restore binding/config/asset state consistently |
| Brand/scope absent from agent contract | First-class brand profile, selected node IDs, allowed operations and supported HTML policy |

Two review checks reproduced fallback context loss and acceptance without render using mocked execution. Other findings were source-level analysis; production security, concurrency and AI quality remain to be tested.

## 10. Campaign authority, privacy and execution

Campaign stores reusable configuration; Edition stores one period/revision and audience; Approval freezes its contract; Run executes it; Artifact joins tenant/campaign/edition/account ID; Export packages verified outputs. IDs and digests establish identity, never row order or filenames.

Edition lifecycle: draft → validating → needs_correction or previewing → in_review → approved. Runs: accepted → queued → processing → ready/partial/failed, with explicit cancelling/cancelled and failed-only retry. Export and deletion each have separate durable lifecycles. Persist accepted work before dispatch so Redis/provider interruption cannot lose ownership. Zero eligible accounts cannot start. Deleted editions cannot be resurrected by in-flight workers.

Pin normalized data, template revision, asset bytes/versions, output profile and render configuration. Changing content/audience invalidates approval. Snapshot isolation applies even when shared templates or brand assets are edited later. Export counts, digests and account identities must reconcile before Ready.

Keep raw data, private assets, previews, outputs and export packages tenant-authorized. Define enforced absolute retention deadlines and purge verification before accepting real data. Opaque URLs alone are not access control. Prevent customer rows/prompts/HTML leaking through analytics/session replay or generic error logs. Generated customer-specific assets inherit private/versioned lifecycle; do not reuse the current public decorative-asset path without reviewing its suitability.

Model-context allowlist: synthetic fixtures, approved field schema, selected public brand context and sanitized diagnostic codes/structural details. Deny raw CSV rows, recipient information, real-account screenshots and raw values in tool errors. Data-bearing headers and user prompts need explicit handling; no blanket claim that a prompt box can technically prevent all sensitive entry. Make the sharing boundary visible and offer manual alternatives.

## 11. Production API and module boundaries

Extend shared components: `TemplateStudio`, `SayItRail`, `StudioTopBar`, `InputsRail` and proof services. Extract the prototype's DOM adapter into a reusable visual stage. One command/state controller owns canonical document, history, save queue and operation state; panels do not maintain independent HTML copies.

Proposed server contracts, not existing endpoint claims:

- Draft save: expected revision + canonical document; return revision/digest or `409 revision_conflict`.
- AI operation: operation ID + base revision + task/scope; server supplies trusted context and policy.
- Operation status/cancel: tenant-scoped, recoverable and idempotent.
- Finalization/proof: candidate digest + output/assets/profile; return blocking/advisory diagnostics and current proof.
- Template revision selection: immutable reference used by campaign edition snapshots.
- Mapping/review assistance: sanitized typed metadata/diagnostics only; returns proposals, never silent campaign mutations.

Keep existing template/render API callers compatible. Separate pilot entitlement, role permission and navigation preference. Revalidate authority at mutation/commit boundaries, including deleted/archived resources. Avoid a second database of templates or AI-only campaign state.

## 12. Release plan and estimates

R0 is synthetic/internal validation. R1 is the bounded static campaign workflow plus reliable studio, scoped edits, brand context and assistive mapping/review described here. R1.1 expands next-period assistance after repeated use. Scheduling, connectors, autonomous outreach, video/paired outputs and live collaboration are deferred.

| Phase | Work and dependencies | Exit evidence |
|---|---|---|
| P0 — establish baseline | Reproduce/fix agent correctness, verify deployed topology, authenticated round trip and non-square/PDF rendering | Agent failure preserves source; exact output proof; permissions/network policy tests |
| P1 — studio foundation | Canonical document, visual commands, typed bindings/brand assets, CAS/history and operation recovery | AI → manual → AI preserves requested scope; reload/conflict/cancel/undo pass |
| P2 — contextual intelligence | Structured brief, bounded selection patches, brand-aware generation, synthetic diagnostics/repair | Same fixtures show useful task completion with protected content preserved |
| P3 — campaign preparation | Campaign models/navigation, CSV validation/mapping, reviewer UI, private snapshots and approval | All-row checks + representative proofs, privacy and stale-approval tests |
| P4 — reliable delivery | Durable runs/retries/cancel, verified export, deletion, period reuse and marketing | Full 250-account synthetic rehearsal and buyer-tool test handoff |
| P5 — pilot and learn | One authorized workspace after all gates | Measured preparation effort, issue rates, costs and repeat-period usage |

P0 precedes substantial feature expansion. P1/P2 share the existing studio work; P3/P4 retain all original campaign correctness obligations. Do not implement both a separate general chatbot and a separate campaign agent stack.

### Capacity accounting

Prior planning envelope: campaign work **142–220h** + approved builder **108–164h** = **250–384h**. This is total scope, not remaining work. Agent correctness, persistence, security, brand controls and proof belong inside those packages; do not count them again.

New AI-native scope beyond that envelope:

| Increment | Hours |
|---|---:|
| Structured campaign brief and assisted setup | 8–12 |
| Bounded selection-aware AI patch path and preservation checks | 12–20 |
| Sanitized metadata mapping suggestions and confirmation UX | 6–10 |
| Diagnostic explanation/repair proposals and reviewer UI additions | 10–18 |
| Shared task evaluation set and AI-specific telemetry | 8–12 |
| **Incremental scope** | **44–72** |

Revised product envelope **294–456h**; separate marketing implementation **12–20h** gives **306–476h**, approximately **10–15 weeks at 32 planned hours/week**. Estimates are provisional implementation/design/QA scope allowances, not validated remaining-work or delivery promises. Inventory completed work and re-estimate after P0. Existing 20 GTM hours remain separate; paid support displaces engineering capacity.

If capacity must shrink, defer AI mapping/explanations while preserving manual equivalents, richer brief generation and optional transforms. Never cut durable saving, safe edit preservation, field correctness, permissions/privacy, approval or reconciliation to preserve an AI feature list.

## 13. Acceptance, evaluation and observability

### Required release scenarios

1. Generate a branded design, visually edit text/geometry, select a block and request an AI edit. Latest manual state is the base; unselected/protected content is unchanged.
2. Provider failure, exhausted deadline, cancel race and dropped stream leave one truthful recoverable outcome; no silent replacement or double charge.
3. Save/reload/undo/redo and two-tab conflict restore the complete document, not just HTML. Same initial srcdoc still repaints correctly after undo.
4. Agent direct-submit, prose salvage and fallback cannot bypass final validation/proof.
5. Non-square PNG and A4/Letter one-page PDF use exact assets and dimensions; long/Unicode/missing/large-number fixtures surface real failures.
6. Invalid/duplicate IDs, ambiguous mapping and field deletion cannot enter an approved revision. Optional blank and zero remain distinct.
7. Viewer/cross-tenant access, unsafe redirects/private destinations, executable HTML/CSS and sensitive model-context fixtures are rejected.
8. A 250-account synthetic run includes ten representative previews, injected dispatcher/worker interruption, failed-only retry and reconciled ZIP/manifest. Preview correct assets for two test recipients in the buyer's existing tool.
9. Editing template/brand/data after approval cannot alter running output; deletion purges data/artifacts and defeats late worker writes.
10. Keyboard editing, progress/error announcements and existing Platform/API workflows pass regression checks.

Create a 30–50 task synthetic evaluation set spanning generation, small scoped edits, brand, bindings and layout failures. Compare the current whole-document agent with the improved path using identical tasks. Record expected invariants and human-reviewed design/task success; do not use the same model's self-score as the only quality measure.

Hard gates: zero protected-field/scope violations in the designated suite, no stale commits or duplicate billing in fault tests, complete artifact reconciliation, no unresolved blocking security/privacy tests. Design preference and latency are measured outcomes; set performance thresholds after P0 evidence rather than inventing an SLA.

Track brief-to-first-proof and brief-to-approved-export time, successful AI operations, unexpected changes, undo-after-AI, manual correction effort, failed proof rate, provider/tool cost, export reconciliation and repeat-period completion. Record safe IDs/counts/durations/model version; exclude raw prompts/HTML/customer values from general analytics. Treat time-saved and retention benefits as hypotheses until measured with users.

## 14. Immediate implementation handoff

Start with P0 in backend onboarding-v2 and frontend redesign-v2. Confirm branch/deployment state before editing. Add regression tests for fallback context loss and no-proof submission; fix permission, safe-fetch, field persistence and exact preview context. Complete an authenticated create → visual edit → AI edit → production proof rehearsal using synthetic values.

Then freeze the canonical document/operation/patch contracts and design the missing states before expanding the inspector or campaign AI features. Keep prototype and production routes distinct until the shared studio is ready. No live customer campaign commitment before P4 acceptance.

## 15. Supporting evidence and detailed references

- [Campaign product specification](customer-value-campaigns-product-spec-2026-09-05.md): detailed delivery, retention, permissions and campaign API requirements; read alongside this consolidated release scope.
- [Visual studio specification](ai-visual-template-studio-spec-2026-09-05.md): detailed editor interactions and B00–B06 packages; selection-aware AI is promoted from its deferred scope by this document.
- [Backend agent review](template-agent-backend-review-2026-09-05.md): source citations, reproduced issues and audit limits.
- [Strategy and research](customer-value-campaigns-strategy-2026-09-05.md): market hypothesis and earlier research; this consolidation does not claim a new market survey.
- [Prototype guide](visual-html-prototype.md): what the tested prototype does and what remains unverified.

When these documents conflict on scope, sequencing, product architecture or estimates, this document wins. Maintain detailed safety/identity/export contracts unless explicitly revised here; consolidation is not permission to drop them.
