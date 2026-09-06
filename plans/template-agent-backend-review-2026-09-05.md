# Backend template agent review

Date: September 5, 2026. Reviewed backend `worktree-onboarding-v2`, HEAD `d51a7b0`, at `/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2`. The backend has no worktree named redesign-v2; this worktree contains the Template Studio endpoints used by the frontend redesign. No backend code changed. This is source review plus two mocked execution checks, not a deployed-system or model-quality benchmark.

## Conclusion

Keep the existing single agent and tool loop. It already chooses tools, gathers website context, generates decorative assets, sees rendered images, receives validation failures and can repair its output. That is a useful agentic foundation. The priority is to make its context, constraints and commits dependable before adding more autonomy or more agents.

The product opportunity is a document-aware editing agent: it knows the user's selected element, protected fields, exact output size, saved brand and renderer diagnostics; it proposes a validated edit and commits against a specific revision. The current agent mostly receives a prose brief and emits a whole document.

## Existing strengths worth preserving

- Shared generation/edit loop instead of separate quality pipelines.
- Tools for `fetch_website`, `generate_asset`, `render_preview`, `submit_template`.
- Vision feedback from actual rendered HTML, not just a text-only critique.
- Handlebars AST-based identifiers and safelisted helper/raw interpolation checks.
- Tool count caps, individual provider timeouts, streamed stages and SSE heartbeat.
- Before-edit HTML snapshots and receipts derived partly from actual variable differences.
- No render-credit charge for internal AI proof steps; one user instruction is the billing unit.

## Findings, in implementation priority order

### F01 — P1: automatic fallback can replace an existing design

Evidence: [template-agent.js:599](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/service/template-agent.js:599).

Any loop failure invokes `streamHtmlGeneration` with only `messages:[prompt]` and `mode`. It drops caller instructions containing the existing HTML, dimensions, variable definitions and edit-preservation rules. For “make the title bigger,” a provider error can therefore turn an edit into a new design, which the route then saves. The explicit `TEMPLATE_AGENT=off` route branch passes current HTML correctly; the automatic error fallback does not.

Mocked execution confirmed fallback arguments contain only `messages` and `mode`; existing template context is absent. Do not silently degrade an edit into generation. Prefer retaining the draft and reporting a retryable failure. If fallback is retained, pass the full typed context and validate it through the identical finalization contract. Fallback must share the original operation deadline and billing identity.

### F02 — P1: raw website/image fetches have incomplete network isolation

Evidence: [template-agent.js:54](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/service/template-agent.js:54), [direct fetch:136](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/service/template-agent.js:136), [image fetch:322](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/service/template-agent.js:322).

The hostname regex misses private ranges such as 172.16/12 and IPv6 private addresses; it does not resolve DNS or revalidate redirects. Both direct paths follow redirects automatically. The HTML body is truncated after downloading it, and the image byte limit is checked after buffering it. The screenshot path uses a separate SSRF interceptor, which does not protect these Node fetches.

Use a shared safe-fetch implementation covering resolved addresses, every redirect hop, DNS/connection binding and streaming byte limits. Restrict available domains per operation where practical. Website text and HTML must be treated as untrusted content, not instructions authorizing new tool destinations. No network exploit was attempted in this review.

### F03 — P1: edit and undo endpoints omit content-edit permission checks

Evidence: [route registration:320](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/routes/template-studio.js:320), [team permission helper](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/plugins/team_context.js).

The route registers authentication and team context, but neither handler invokes `req.can('edit')` or `requirePermission('edit')`. Ownership queries scope to the active team; they do not distinguish a view-only member from an editor. Add the existing edit permission guard to both mutations and test view-only denial. This conclusion follows the reviewed route/plugin path; deployed middleware behavior has not been exercised.

### F04 — P1: previews can inspect the wrong output, or be skipped entirely

Evidence: [renderDraft:382](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/service/template-agent.js:382), [hardcoded prompt:617](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/service/template-agent.js:617), [studio declaration callback:103](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/routes/template-studio.js:103).

The agent prompt always uses 1080×1080. The temporary render template has no width/height, and output is always PNG; renderer defaults consequently govern its proof. The studio declaration callback returns variable definitions but no `sampleRow`, unlike onboarding. Newly added fields have empty defaults, so text/number layout checks can miss realistic failures.

`submit_template` only calls `declare`; it does not require a successful proof of the final source. Prose salvage bypasses the proof requirement too. A mocked direct submit was accepted with zero render calls. Even rendering draft A does not prove submitted draft B.

Pass exact dimensions, output profile, pinned assets and synthetic fixtures. Bind proof to the final source/asset/profile digest. Enforce mandatory deterministic validation and a successful final proof before activation; let the agent choose additional exploratory previews. PDF needs its own one-page checks. A screenshot at 768px is useful critique input, not an overflow or factual-validity guarantee.

### F05 — P1: saves have no explicit base-revision or operation identity

Evidence: [read/edit/save path:215](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/routes/template-studio.js:215), [template version schema:230](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/models/Template.js:230).

The handler loads a template, spends up to minutes generating, then saves it without an explicit compare-and-swap against the user's base revision. There is no operation ID or status reconciliation. Concurrent manual saves, another tab, undo or repeated AI requests can produce stale commits or ambiguous outcomes; incidental Mongoose version behavior is not a complete product contract.

Introduce `baseRevision` and `operationId`, authoritative CAS, recoverable operation state and server cancellation. A disconnected stream currently allows work to continue and save by design. The client must be able to recover that outcome instead of retrying blindly. Publish one committed revision and one billing result per accepted operation.

### F06 — P1: variable declarations are validated but not persisted with the result

Evidence: [declare callback:103](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/routes/template-studio.js:103), [save:231](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/routes/template-studio.js:231), [validateAndDeclare:33](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/service/onboarding-v2-service.js:33).

`validateAndDeclare` returns expanded definitions, but the agent returns HTML/note and the route only updates `variables`, not `variableDefinitions`. A new field may be accepted against a temporary declaration that never reaches the saved document. Existing names are protected by prompt wording only: accidental deletion is reported after commit, not prevented. Undo snapshots contain only HTML, so they cannot restore pruned sample values or the full field/asset/dimension contract.

Finalize into `{html, fieldDefinitions, assetManifest, diagnostics}` and save atomically. Reject unrequested protected field changes, or return a reviewable proposal when intentional changes need confirmation. Snapshot the whole canonical document. Distinguish campaign-approved schema constraints from flexible Platform template creation.

### F07 — P2: advertised total deadline and credit limits are not hard operation bounds

Evidence: [loop deadline:635](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/service/template-agent.js:635), [AI credits](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/util/ai-credits.js).

The deadline is checked only at the start of each model turn. A turn can consume its full independent timeout, followed by several tools, and fallback can start outside that budget. Asset upload/postprocessing are not governed by a shared remaining deadline. The loop discards provider usage and has no explicit output-token budget.

Credit checks read a previously loaded entity; concurrent requests can all pass before spending. The first/month-reset spend uses `$set`, so concurrent initial spends can overwrite each other's count. Reserve atomically by operation ID; release failures and reconcile success. Track provider/tool cost separately from the simple user-facing credit. Pass a shared abort signal and remaining-time budget through all work, and record usage without storing raw customer content in general logs.

### F08 — P2: brand and visual-editor structure are not first-class agent context

Evidence: [agent input contract:590](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/service/template-agent.js:590), [asset generation:191](/Users/suyashthakur/Developer/Personal/html-to-gif/.claude/worktrees/onboarding-v2/service/template-agent.js:191).

There is no selected element, lock state, stable-node contract, approved brand profile, editor capability profile or change scope. Website imagery can guide brand appearance, but generated decorations use a hardcoded Pictify house style. Assets are uploaded under a global `agent-assets` key and returned as public URLs, without an operation-owned asset manifest here.

Add trusted structured context and supported-HTML constraints. Prefer existing saved brand assets to guessing brand from a screenshot. Make decorative generation optional and brand-aware. Bind generated assets to tenant/operation and the private/versioned lifecycle needed by Campaigns. Do not assume public decorative storage is appropriate for customer-specific content.

## Recommended agent evolution

Keep one orchestrator; add capabilities in this order:

1. **Reliable document context:** mode=create/edit, immutable base revision, canonical source, size/format, field schema, editor profile, trusted brand and asset manifest.
2. **Small scoped edits:** `inspect_document` / `inspect_element` expose node IDs and computed layout; `apply_patch` accepts validated operations such as setText, setStyle, replaceImage and reorder. Require node/version preconditions and reject changes outside requested scope. Avoid regex HTML editing.
3. **Whole-document generation:** retain `submit_template` for initial designs and broad redesign requests. Run all output through the same finalizer as patches and fallback.
4. **Useful diagnostics:** a validator reports overflow, missing assets, binding failures, contrast and PDF page count. The agent can repair specific failures instead of merely looking at a screenshot.
5. **Sample-suite review:** test synthetic long/short/missing/large-number fixtures, then report changed nodes and remaining issues. Real campaign rows stay outside model context under the approved privacy boundary.
6. **Campaign advisor later:** propose setup/field mappings and explain issues. Never invent customer metrics or automatically approve/send campaigns.

For a small color/text edit, use the scoped path with no website fetch or image generation. For a new branded design, allow discovery/assets and multiple proof repairs. Choose budgets from task type; more tool calls are not a quality measure.

## Execution order and evaluation

**First correctness patch:** F01, F03, F04, F06. Include F02 before any untrusted website access. These fit the studio spec's feasibility/security work; do not add them as an unexplained second scope estimate.

**Durability:** F05/F07, full-document revisions and an operation ledger before pilot usage.

**Product intelligence:** F08, selection-aware patches and deterministic diagnostic repair after the base contract is stable.

Create dedicated template-agent and studio route tests; no direct references to either were found in the existing test directory. Start with regression fixtures for the two reproduced failures, view-only access, field declaration persistence, non-square/PDF preview, stale commits, concurrent quota reservation, redirected/private URL rejection and retry/cancel recovery.

Build an evaluation set of approximately 30–50 synthetic tasks spanning create, copy/style edits, scoped edits, brand adherence, bindings, overflow and PDF. Measure task completion, preservation of untouched nodes/fields, final-proof pass rate, unexpected-change rate, retries, latency and provider cost. Compare the existing whole-HTML path against scoped edits using the same tasks. Do not choose a different model or agent framework before obtaining that baseline.

### Review evidence

A local VM harness loaded the actual `service/template-agent.js` with mocked provider/renderer dependencies. It reproduced (1) dropped current-template context after simulated provider failure and (2) successful submission without rendering. No external AI calls, customer-data access, database mutations or SSRF probes were performed. Other findings are source-level analysis and require the listed integration tests. Harness: `/tmp/review-template-agent.cjs` (temporary, not a permanent regression suite).
