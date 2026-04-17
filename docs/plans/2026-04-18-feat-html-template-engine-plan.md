---
title: "feat: HTML Template Engine (engine='html') + Pictify CLI + git-first Workflow"
type: feat
status: active
date: 2026-04-18
deepened: 2026-04-18
origin: Direct request + /plan-ceo-review (EXPANSION mode, 2026-04-18)
---

# feat: HTML Template Engine (engine='html') + Pictify CLI + git-first Workflow

## Overview

Pictify's template authoring is FabricJS-only today. Technical users — the wedge we keep hearing from — want to manage templates as HTML/CSS in their own tools (git, IDE, PR review) and want the render fidelity only a real browser gives them (custom fonts, CSS gradients, SVG filters, web components).

This plan introduces a **first-class `engine` field** on `Template` with two initial values — `fabric` (current) and `html` (new, Puppeteer-rendered, Handlebars-templated) — behind a single `render-dispatcher` facade so the six routes that render templates stop branching on engine-specific code. It ships a `pictify` CLI with git-based sync (`init / login / push / pull / render / watch`) so developers can version templates alongside their app code. It adds the UI, observability, security, and rollout controls required to ship this at production scale.

**Target repos:**
- `front-end-html-to-gif` (SvelteKit UI, this repo)
- `html-to-gif` (Fastify backend, sibling repo at `/Users/suyashthakur/html-to-gif`)
- `pictify-cli` (new repo, published to npm)

## Problem Frame

Three concrete user jobs are being under-served today:

1. **Developers who want git-first authoring** — author HTML/CSS in their IDE, commit to git, sync to Pictify via a CLI. Today they can't; templates live only in the Pictify dashboard.
2. **Render-quality limits of FabricJS** — complex CSS (gradients, filters, transforms), web fonts, SVG animations, Tailwind/utility-CSS layouts, and custom elements cannot be authored or rendered in Fabric.
3. **Stateless HTML render exists but is invisible** — `POST /image` with raw HTML already uses Puppeteer, but it's undocumented as a template surface. It has no persistence, no variables, no dashboard, no CLI, no analytics. Users who could benefit from it never find it.

Shipping an `engine='html'` first-class path closes all three gaps with one coherent feature. Shipping a CLI on top of it gives Pictify a defensible developer-tool narrative (vs. Bannerbear, Placid, Orshot — all dashboard-only).

## Requirements Trace

- **R1** — Template model supports `engine: 'fabric' | 'html'`; default `'fabric'` for backward compatibility; immutable after creation (force fork to change).
- **R2** — HTML templates store user-authored HTML as a string; variables are expressed in Handlebars `{{var}}` / `{{#if}}` / `{{#each}}` syntax.
- **R3** — Variable substitution escapes by default (`{{var}}`); raw interpolation (`{{{var}}}`) requires per-variable `allowRawHtml: true` opt-in.
- **R4** — Strict-variable mode by default: undefined required variables cause HTTP 422 with line info. Per-template `strictVariables: false` opts into lax mode (empty string + warning log).
- **R5** — Single `render-dispatcher` facade: all render routes (`/image`, `/gif`, `/pdf`, `/r/:uid.:format`, experiment renderer, thumbnail worker) call the dispatcher; dispatcher switches on `template.engine`.
- **R6** — HTML renders via Puppeteer reuse the existing browser pool. A per-team Redis semaphore caps concurrent HTML renders at 10 per team.
- **R7** — Pool saturation metric (`pictify_browser_pool_saturation`) exposed; alert at >0.8 sustained 5 min. Default pool size bumped 50%.
- **R8** — SSRF defense: Puppeteer request interceptor rejects `file://`, `chrome://`, `chrome-extension://`, `javascript:`, non-image `data:` URIs. For allowed schemes, re-resolve DNS per request and block RFC-1918 / 169.254.0.0/16 / 127.0.0.0/8 / ::1 / fc00::/7 (DNS-rebind safe).
- **R9** — JavaScript execution is **opt-in per template** (`jsEnabled: boolean`, default `false`). When false, `page.setJavaScriptEnabled(false)` before render.
- **R10** — HTML templates support image (PNG/JPEG/WebP), PDF, and GIF output on day 1, routed through the dispatcher.
- **R11** — Handlebars compile cache (LRU 500, keyed by `templateId + updatedAt`); target ≥80% hit rate post-warmup.
- **R12** — Template body max size 500KB; variable payload max size 64KB (strings max 10KB each by default); viewport max 4096×4096.
- **R13** — Mongoose validator enforces `engine`/`fabricJSData`/`html` mutex invariant. Handlebars compile errors raised at save (not render) with line + column info.
- **R14** — Web HTML editor: CodeMirror 6 with Handlebars syntax highlighting, variable autocomplete on `{{`, inline variable hover preview, debounced live iframe preview (300 ms), compile-error squiggles, "Randomize sample variables" action, multi-language API snippet, auto-add of undeclared variables on save.
- **R15** — `pictify` CLI: `init / login / push / pull / render / watch` with content-hash diffing, idempotent batch push, optimistic-concurrency `lastKnownVersion`, `.pictify/` gitignored by default, scaffolded starter templates on `init`.
- **R16** — Feature-flagged rollout via PostHog: `html-templates-enabled`, `html-templates-cli-enabled`, `html-templates-js-enabled` (global JS kill-switch).
- **R17** — Observability: structured logs per stage keyed by `render_id`, Prometheus counters/histograms, new "HTML Templates" Grafana dashboard, 7 alerts, admin `inspect-render` dev tool.
- **R18** — Retire `grapeJSData` legacy shim and naïve `Template.populateTemplate`; route all callers through the dispatcher.
- **R19** — Font proxy: host common Google Fonts on Pictify's S3/CDN and rewrite `fonts.googleapis.com` URLs to proxied CDN at render time to eliminate external fetch flakiness.
- **R20** — Render-result cache: `redis` cache of `(templateId + updatedAt + canonicalized-vars + format + width + height)` → rendered bytes; TTL = template `updatedAt`-tied; size cap via eviction policy.
- **R21** — API snippet generator outputs working curl / JS fetch / Python requests / Ruby / Go / PHP snippets with real uid + sample vars filled in.
- **R22** — Quota, audit-log, webhook, team-scoping, rate-limit parity: engine=html renders are charged, audited, webhooked, scoped, and rate-limited identically to engine=fabric.

## Scope Boundaries

- **In scope:** engine='html' (Handlebars + Puppeteer + SSRF + semaphore + dispatcher), CLI with git-sync, HTML editor UX, HTML→{image, pdf, gif} on day 1, feature-flagged rollout, observability, font proxy, render-result cache, legacy `populateTemplate` + `grapeJSData` retirement, inspect-render dev tool.
- **Non-goals:**
  - MJML engine — deferred (TODO).
  - JSX/React SSR engine — deferred (TODO).
  - IR / unified compiler across engines — explicit non-goal; the dispatcher pattern is sufficient.
  - Copilot AI generation for HTML templates — deferred (TODO).
  - Collaborative editing (Y.js, CRDTs) on HTML editor — not planned.
  - Visual HTML→Fabric converter — out of scope; users fork + rewrite.
  - User-defined Handlebars helpers (arbitrary JS at render time) — security risk; safelist only.
  - Separate HTML-only Puppeteer worker pool — start with shared + semaphore; revisit if metrics demand.
  - HTML→GIF beyond the existing Puppeteer frame-capture path.
  - GitHub Action for PR-visual-diff comments — deferred (TODO).

### Deferred to Separate Tasks

- GitHub Action rendering before/after diff on PRs that touch `templates/*.html` — follow-up, blocked by CLI shipping.
- MJML engine for transactional email — Phase 2, separate plan.
- JSX/React SSR engine — Phase 3, separate plan.
- Copilot HTML generator — separate plan after engine=html adoption data.

## Context & Research

### Relevant Code and Patterns (backend — `html-to-gif` repo)

- `models/Template.js` — existing `html` field (unused, reuse it), `fabricJSData`, `grapeJSData` legacy shim, `variableDefinitions`, `layouts`, `pages`, `populateTemplate` (naïve `replaceAll`, to retire), `populateFabricTemplate`, `populateOgImage`.
- `routes/template.js` — create/update/list with `templateSchema` JSON-schema validation, `resolveFabricJSData`, `uploadBase64Images`, `normalizeTemplate`. **Pattern**: extend `templateSchema` with `engine`, `jsEnabled`, `strictVariables`.
- `routes/image.js`, `routes/gif.js`, `routes/pdf.js` — existing handlers that call `template.populateTemplate(variables)` on line 61/69 (naïve). Will be refactored to call the dispatcher.
- `routes/template-render.js` (aka `/r/:uid.:format`) — URL-param renderer; currently fabric-only via `renderTemplateWithVariables`. Extend through dispatcher.
- `routes/experiment-render.js` — mirror pattern: `switch (experiment.type)` with strategy per value. Our dispatcher should mirror this shape: `switch (template.engine)`.
- `service/template-renderer.js` — orchestrates fabric render (populate → process special vars → register fonts → canvas render → upload). Wrap as `fabric-renderer.js` behind dispatcher.
- `service/template-expression-engine.js` — `processTemplateLogic` with `showWhen/hideWhen/{{ expr }}/loops` on fabric objects. 40+ helper functions (currency, titleCase, etc.). **Extract** helpers to a shared `service/template-helpers.js`; both fabric path and Handlebars path register them.
- `service/url-param-renderer.js` — orchestrates `/r/:uid.:format`. Replace direct `renderTemplateWithVariables` call with dispatcher call.
- `service/browserpool.js` — Puppeteer page pool, health checks, acquire/release. Reuse as-is; HTML renderer acquires pages here.
- `service/ssrf-protection.js` — existing SSRF guard, likely URL-only. **Extend** with per-request DNS resolution (re-check every request inside Puppeteer interceptor).
- `lib/image.js` — `WebImageCapture` with Puppeteer setContent/screenshot, MAX_DIMENSION=4096, request interceptor blocking ad/tracking hosts. Model for the HTML renderer.
- `lib/retry.js`, `lib/errors.js` — shared retry + error classes. New errors extend `GenerationError`.
- `plugins/verify_api_token`, `plugins/verify_api_token_flexible`, `plugins/quota_guard`, `plugins/team_context`, `plugins/email_verification_guard` — reuse for CLI sync endpoint and HTML render routes.
- `service/post-generation-queue.js` — BullMQ pattern for async side effects. New `html-thumbnail-queue` follows the same pattern.
- `service/audit-service.js` — `logTemplateRender`. Extend to include `engine` field.
- `service/webhook-delivery.js` — `emitEvent`. New events emitted with engine in payload.
- `config/posthog.js` — PostHog feature-flag integration. Use for rollout gates.
- `connectors/storage/helper.js` — `maybeUploadToUserStorage`. Reuse for HTML render result uploads.

### Relevant Code and Patterns (frontend — `front-end-html-to-gif` repo)

- `src/routes/template-workspace/[uid]/+page.svelte`, `src/routes/template-workspace/image/create/+page.svelte`, `src/routes/template-workspace/pdf/` — existing creation flows using `CreateTemplate.svelte`. Mirror the pattern for HTML templates.
- `src/lib/components/dashboard/template/CreateTemplate.svelte` — current entry that wraps `EditorLayout`. Branch on an `engineFor='html'` prop to render `HtmlEditorLayout` instead of fabric canvas.
- `src/lib/components/editor/EditorLayout.svelte` + `Canvas.svelte` + `VariablesPanel.svelte` + `PropertiesPanel.svelte` + `LayersPanel.svelte` — fabric editor. For HTML, we ship a parallel `src/lib/components/editor/html/` tree that reuses `VariablesPanel.svelte` where possible.
- `src/lib/components/editor/FigmaImportModal.svelte` — reference for "external source → modal flow → convert → live in dashboard". Our CLI install modal can use the same visual pattern.
- `src/store/template.store.js`, `src/store/variables.store.js`, `src/store/pages.store.js`, `src/store/editor.store.js`, `src/store/history.store.js`, `src/store/toast.store.js` — Svelte stores; HTML editor composes only the ones it needs (template + variables + toast).
- `src/lib/utils/figma-converter.js` — shows the "external import → normalize → canvas" flow pattern.
- `src/api/*.js`, `src/service/backend.js` — existing `backend.get/post/patch/delete` wrapper, token cookie auth. Reuse.
- `src/routes/dashboard/api-token/+page.svelte` — API-token UI; CLI login modal can live here as a second tab "CLI access".
- `src/routes/dashboard/integrations/` — reference for "external integrations hub"; add a CLI install card.

### Institutional Learnings (from user memory + project history)

- `fix(certificate-generator): ... use edited data in API snippet` (commit `0fe1c32`) — **the API snippet MUST use the most recent saved/edited variable values, not stored placeholders**. Applies directly to the HTML template API snippet.
- `grapeJSData → fabricJSData` drift from prior editor migration — proves what happens when engines are added without a clean facade. The `resolveFabricJSData` normalization sprinkled across the codebase is the cautionary tale. Dispatcher pattern must not produce a second drift.
- Neobrutalist design system (thick borders, shadows, warm yellow/orange accent `#ffc480`) — the HTML editor UI must conform.
- "End user does not care about CDN views or CDN traffic" — avoid CDN jargon in user-facing copy.
- `node node_modules/vite/bin/vite.js build > /tmp/vite-build.log 2>&1` — build check pattern (shell aliases interfere). Use for build verification.
- Figma plugin pattern (`figma-plugin/` directory, Bearer-token auth from `figma.clientStorage`, CORS `*` on plugin routes) — proven template for "outside-the-dashboard dev tool → backend". CLI follows a similar shape: Bearer token via `~/.pictify/credentials.json`, dedicated CLI API routes.
- Svelte `{@const}` must live inside `{#if}` blocks (not raw HTML elements) — apply when adding const-derived values in the HTML editor components.
- `[uid]` dashboard route directory: `git add` must use directory paths, not glob-expanded file paths (zsh glob issue with brackets).

### External References

- Handlebars.js v4.7+ docs — `allowProtoMethodsByDefault: false`, `allowProtoPropertiesByDefault: false`, `noEscape: false`, `strict: true`, AST access for variable extraction, `parse()` for compile-time error locations.
- Puppeteer `page.setJavaScriptEnabled()`, `page.setRequestInterception()`, `page.on('error')`, `page.on('pageerror')`, `page.evaluateHandle('document.fonts.ready')`, `page.pdf()` options (format, printBackground, margin, preferCSSPageSize).
- CodeMirror 6 packages: `@codemirror/lang-html`, `@codemirror/autocomplete`, `@codemirror/linter`, `@codemirror/view` (decorations for squiggles), `@codemirror/state`.
- Node `dns.lookup({ family: 0 })` — IPv4+IPv6 resolution for SSRF check.
- `ioredis` with `setex` + `set NX PX` for distributed semaphore + deterministic TTL-based reaping.
- `ua-parser-js`, `geoip-lite` — already installed for Smart Links; not needed here but confirm no conflicts.
- `ipaddr.js` — canonical library for private-range detection.
- `@faker-js/faker` — realistic sample values for "Randomize variables".
- `commander` + `chalk` + `ora` + `prompts` — standard Node CLI stack.
- `chokidar` — file watcher for `pictify watch`.

## Key Technical Decisions

- **D1. `engine` is a first-class, immutable field on `Template`.** Not a derived/inferred value, not a separate model. Immutable post-create to avoid lossy migration and the class of bugs that followed `grapeJSData`. Users fork to change engine. (Origin: CEO review 0D, Section 1.3, Step 0F choice.)
- **D2. Single `render-dispatcher` facade; routes do not branch on engine.** Routes call `dispatcher.renderTemplate(template, vars, options)`. All engine branching lives in one file. Future engines (MJML, JSX) drop in without touching routes. (Origin: Section 1 issue 1A.)
- **D3. Per-team Redis semaphore caps HTML renders at 10 concurrent per team.** Browser pool is a SPOF; noisy-neighbor protection from day 1. Stale-lock reaping via Redis key TTL (60s). (Origin: Section 1 issue 1B.)
- **D4. Strict variables by default; `strictVariables: false` opts into lax mode.** Technical users renting our render infra want loud failures on missing required variables. Lax mode preserves the "optional logo" ergonomic. (Origin: Section 2 gap 2A.)
- **D5. Do not sanitize template markup; sandbox the render instead.** Template markup is trusted (the author wrote it); sanitization breaks SVG/CSS/custom-element use cases without closing SSRF. Defense is in the Puppeteer sandbox + SSRF interceptor + JS-off default. **Variable values are always HTML-escaped by default** (`{{var}}`). (Origin: Section 2 gap 2B.)
- **D6. SSRF defense = per-request DNS resolution inside Puppeteer's request interceptor.** URL-string blocklist is insufficient; DNS rebinding is real. For every subresource fetch, resolve host, reject if private/link-local. Combined with explicit protocol allowlist (http/https + data:image only). (Origin: Section 2 gap 2C, Section 3 threat T2.)
- **D7. Raw interpolation `{{{var}}}` requires per-variable `allowRawHtml: true`.** Compile fails at save if a raw interpolation references a variable without the flag. Forces the footgun to be explicit in the template definition; shows up in audit logs. (Origin: Section 3 issue 3A.)
- **D8. JavaScript is opt-in per template, default `false`.** `while(1)` in a stored template would tie up a Puppeteer page per render. Users with legit JS needs (Chart.js, KaTeX, SVG animation) flip the flag consciously. Global kill-switch via `html-templates-js-enabled` feature flag. (Origin: Section 2 issue 2G.)
- **D9. Mongoose validator enforces engine/data mutex.** `engine='html'` → `html` non-empty AND `fabricJSData` null. `engine='fabric'` → `fabricJSData` non-empty AND `html` empty. Invalid combinations throw at save. (Origin: Section 2 gap 2E.)
- **D10. CLI push is idempotent + content-hash diffed.** Server endpoint accepts a batch array with per-item `{ path, html, variables, contentHash, lastKnownVersion }`. Server responds per-item `{ status: 'created'|'updated'|'unchanged'|'conflict'|'error' }`. Client maintains `.pictify/state.json` with last-synced hash. Network drops mid-batch → re-run skips synced items. Concurrent edits → 409 with remote diff. (Origin: Section 2 gap 2D.)
- **D11. Variable auto-add on save, not block.** AST-parse Handlebars, diff identifiers against `variableDefinitions`, auto-add missing with default `{ type: 'text', defaultValue: '' }`. Editor surfaces "Auto-added N variables" toast + inline squiggle on undeclared refs before save. (Origin: Section 4 issue 4A.)
- **D12. HTML→PDF on day 1 via `page.pdf()`.** Share the render pipeline; only the output step differs. Invoices/reports/certificates are the highest-value HTML template use cases. (Origin: Section 6 issue 6A.)
- **D13. Browser pool bumped 50% + saturation metric + alert.** Make the SPOF visible; give ops a leading indicator before the pool collapses. (Origin: Section 7 issue 7A.)
- **D14. Feature-flagged 5-phase rollout.** `html-templates-enabled` gates creation/editor; `html-templates-cli-enabled` gates CLI endpoint; `html-templates-js-enabled` is a global JS kill-switch. Ship internal → dogfood → 10% → 100% → CLI beta. (Origin: Section 9.)
- **D15. Retire legacy `grapeJSData` shim and `Template.populateTemplate` as part of this PR.** Touching the same code; momentum is here; cleaner diff than a follow-up. All callers (`routes/image.js:61`, `routes/gif.js:69`) route through the dispatcher instead. (Origin: TODO #3 decision.)
- **D16. Font proxy: rewrite `fonts.googleapis.com` → Pictify CDN at render time.** Pre-seed the CDN with top-200 Google fonts; fall back to pass-through for fonts not yet cached (asynchronously cache on first miss). Eliminates external DNS/HTTP flakiness in render p99. (Origin: TODO #1 decision.)
- **D17. Render-result cache in Redis keyed by `(templateId + updatedAt + canonicalized-vars + format + width + height)`.** Cache rendered bytes (for small payloads) or CDN URL (for large). Invalidated by template `updatedAt` bump. LRU eviction. (Origin: TODO #2 decision.)
- **D18. Inspect-render dev tool at `/admin/renders/:renderId`.** Replays a past render with same variables and shows full stage-timing + resource-block + page-error timeline. Dev-only, admin-auth. Hash variable values for privacy. (Origin: TODO #5 decision.)
- **D19. Stage-timed structured logging + Prometheus metrics.** Every html render logs keyed by `render_id` at each stage (compile, apply, acquire, setContent, fonts, screenshot). Metrics labels: team, engine, status, stage. (Origin: Section 8.)
- **D20. CLI token lives at `~/.pictify/credentials.json`, not in project `.pictify/`.** Project `.pictify/` only holds `config.json` (apiHost, teamId) + `state.json` (per-template content hashes). Auto-add `.pictify/` to `.gitignore` on `pictify init`. (Origin: Section 3 threat T6.)

## Open Questions

### Resolved During Planning

- Mode: **EXPANSION** — build the platform, not just the feature. *Resolved in Step 0F.*
- IDE/CLI scope: **Full CLI + git sync** (init/login/push/pull/render/watch). *Resolved in Step 0 follow-up.*
- Engine architecture: **First-class `engine` field on Template** (not separate model, not implicit). *Resolved in Step 0 follow-up.*
- Dispatcher: **Single facade** in `service/render-dispatcher.js`. *Resolved in Section 1.*
- Concurrency: **Per-team Redis semaphore, 10 concurrent.** *Resolved in Section 1.*
- Engine mutability: **Immutable; force fork.** *Resolved in Section 1.*
- Variable errors: **Strict by default, `strictVariables: false` opts out.** *Resolved in Section 2.*
- Sanitization: **No markup sanitization; sandbox + SSRF + JS-off default.** *Resolved in Section 2.*
- JS execution: **Opt-in per template; global kill-switch.** *Resolved in Section 2.*
- Raw interpolation: **Allowed with per-variable `allowRawHtml: true` flag.** *Resolved in Section 3.*
- Undeclared vars: **Auto-add on save + inline warning.** *Resolved in Section 4.*
- Pool sizing: **50% bump + saturation metric + alert.** *Resolved in Section 7.*
- HTML→PDF: **On day 1 via `page.pdf()`.** *Resolved in Section 6.*
- Font proxy, render cache, legacy retirement, inspect-render tool, `pictify init` scaffolding, autocomplete, line-specific errors, faker randomize, multi-language API snippet: **All in scope for this PR.** *Resolved in TODO/Delight pass.*
- MJML, JSX/React, Copilot-for-HTML, GitHub Action PR visual diff: **Deferred to separate plans.** *Resolved in TODO pass.*

### Deferred to Implementation

- Exact pool size bump target (currently 50% placeholder) — set by measuring peak saturation in Phase 0 telemetry.
- Handlebars helper safelist — provisional list is the 40 helpers already in `template-expression-engine.js`. Final list finalized during Unit 6 when helpers are extracted.
- Exact Redis key naming scheme for semaphore vs. render-result cache vs. compile cache — standardized in Unit 5 (semaphore) / Unit 18 (render cache); prefix with `pictify:` for easy grep.
- Whether to pre-compile Handlebars at save or compile lazily at first render — start with lazy + LRU; revisit if compile latency shows up in p99.
- The precise shape of `.pictify/state.json` (array vs. object, hashing algo — sha256 vs. xxhash) — finalize during CLI Unit 22.
- Concrete starter templates shipped with `pictify init` — content finalized during Unit 29 (OG image, invoice, certificate designs).
- Whether the "engine picker" in the creation flow is two separate routes (`/html/create`, `/image/create`) or one route with a radio — finalize in Unit 23 UI design.
- Font-proxy domain name and CDN origin — finalize with infra during Unit 19 (e.g., `fonts-proxy.pictify.io` vs. subfolder on existing CDN).

## Output Structure

New/modified top-level structure across three target repos:

```
html-to-gif/  (backend)
  models/
    Template.js                           (modify — add engine, jsEnabled, strictVariables, mutex validator)
  routes/
    template.js                           (modify — extend schema, create/update accept new fields, engine-mutability guard)
    template-sync.js                      (new — CLI push/pull endpoints)
    image.js                              (modify — dispatch through render-dispatcher)
    gif.js                                (modify — dispatch)
    pdf.js                                (modify — dispatch)
    template-render.js                    (modify — dispatch; see also service/url-param-renderer)
    admin/
      inspect-render.js                   (new — /admin/renders/:renderId replay)
  service/
    render-dispatcher.js                  (new — engine switch facade)
    fabric-renderer.js                    (new — wraps existing fabric path; service/template-renderer.js refactored)
    html-renderer.js                      (new — Puppeteer HTML render pipeline)
    html-template-engine.js               (new — Handlebars compile/apply)
    template-helpers.js                   (new — extracted shared helpers used by both engines)
    ssrf-guard.js                         (new or extended — DNS re-check interceptor)
    browser-semaphore.js                  (new — Redis semaphore)
    render-result-cache.js                (new — Redis cache)
    font-proxy.js                         (new — fonts.googleapis.com rewriter + CDN cache)
    inspect-render-store.js               (new — stores render timeline for replay)
    template-renderer.js                  (modify — becomes thin wrapper consumed by fabric-renderer.js; populateTemplate retirement here)
    audit-service.js                      (modify — add engine field to logTemplateRender)
  lib/
    html-template-errors.js               (new — error classes)
    html-ast.js                           (new — Handlebars AST helpers for variable extraction)
  plugins/
    verify_api_token.js                   (no change — reused for CLI)
  scripts/
    backfill-engine-field.js              (new — one-time backfill script)
    seed-font-proxy.js                    (new — pre-cache top-200 Google fonts)
  test/
    html-renderer.test.js                 (new)
    render-dispatcher.test.js             (new)
    ssrf-guard.test.js                    (new)
    browser-semaphore.test.js             (new)
    render-result-cache.test.js           (new)
    template-sync.test.js                 (new)
    template-model-invariant.test.js      (new)
    html-template-engine.test.js          (new)
    font-proxy.test.js                    (new)
    inspect-render.test.js                (new)

front-end-html-to-gif/  (frontend, this repo)
  src/
    lib/
      components/
        editor/
          html/
            HtmlEditorLayout.svelte       (new)
            HtmlEditor.svelte             (new — CodeMirror wrapper)
            HtmlPreview.svelte            (new — debounced iframe preview)
            HtmlTopBar.svelte             (new)
            HtmlVariablesPanel.svelte     (new — reuses VariablesPanel.svelte logic where feasible)
            HtmlApiSnippetPanel.svelte    (new — multi-language snippet)
            HtmlSettingsPanel.svelte      (new — jsEnabled, strictVariables, size, title, description)
            InstallCliModal.svelte        (new)
          VariablesPanel.svelte           (modify — add allowRawHtml + visual cue for raw-interpolation vars)
        dashboard/
          template/
            CreateTemplate.svelte         (modify — support engineFor='html')
            HtmlTemplateCard.svelte       (new — HTML-tagged template card; optional)
      utils/
        handlebars-ast.js                 (new — client-side AST parsing)
        handlebars-autocomplete.js        (new — CodeMirror autocomplete for var refs + helpers)
        handlebars-linter.js              (new — CodeMirror linter)
        sample-variable-generator.js      (new — faker-based)
        api-snippet-generator.js          (new — multi-language snippet generator)
    routes/
      template-workspace/
        html/
          create/
            +page.svelte                  (new)
          [uid]/
            +page.svelte                  (new)
      dashboard/
        api-token/
          +page.svelte                    (modify — add CLI access tab)
        integrations/
          +page.svelte                    (modify — add Pictify CLI card)
    api/
      html-templates.js                   (new — thin wrapper over /template that filters engine=html and carries HTML-specific ops)

pictify-cli/  (new repo — published as `pictify` on npm)
  package.json
  bin/pictify.js
  src/
    commands/
      init.js
      login.js
      push.js
      pull.js
      render.js
      watch.js
      debug.js
    sync/
      diff.js                             (content-hash diffing)
      state.js                            (.pictify/state.json management)
      walker.js                           (scan local templates/)
    config.js                             (read ~/.pictify/credentials.json + project .pictify/config.json)
    api.js                                (fetch wrapper for Pictify API)
    scaffolds/
      og-image/
        template.html
        variables.json
        README.md
      invoice/
        template.html
        variables.json
        README.md
      certificate/
        template.html
        variables.json
        README.md
  test/
    sync.test.js
    diff.test.js
    commands.test.js
  README.md
```

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Render-dispatcher facade (the architectural keystone)

```
                       +----------------------------+
                       |  Routes (image / gif /     |
                       |  pdf / r / experiment /    |
                       |  thumbnail)                |
                       +-------------+--------------+
                                     | renderTemplate(template, vars, options)
                                     v
                       +----------------------------+
                       |  service/render-dispatcher |
                       |    switch(template.engine) |
                       +-----+-----------------+----+
                             |                 |
                 engine=fabric|                 |engine=html
                             v                 v
                   +-----------------+  +---------------------+
                   | fabric-renderer |  |    html-renderer    |
                   |  (node-canvas)  |  |  (Puppeteer + HB)   |
                   +-----------------+  +---------------------+
                                                |
                                                v
                                     +------------------------+
                                     | browser-semaphore      |
                                     |   (Redis, per-team 10) |
                                     +------------------------+
                                                |
                                                v
                                     +------------------------+
                                     |   browserpool page     |
                                     +------------------------+
                                                |
                                                v
                                     +------------------------+
                                     | ssrf-guard interceptor |
                                     |  (DNS re-check / scheme)|
                                     +------------------------+
                                                |
                                                v
                                     +------------------------+
                                     | html-template-engine   |
                                     |  (Handlebars compile + |
                                     |   apply, safelist)     |
                                     +------------------------+
                                                |
                                                v
                                     +------------------------+
                                     |  page.setContent →     |
                                     |  wait fonts.ready →    |
                                     |  page.screenshot /     |
                                     |  page.pdf / gif frames |
                                     +------------------------+
```

### HTML render data flow — all four shadow paths

```
input: {template, variables, format, ...}
  ├── happy: full payload → dispatcher → html-renderer → image bytes
  ├── nil:   template=null      → 404 TemplateNotFound
  ├── empty: html=''            → 422 HtmlTemplateEmpty
  └── bad:   variables='string' → 422 InvalidVariablesPayload
                                      (happy path continued below)
render-dispatcher
  ├── template.engine undefined → default 'fabric' (legacy compat)
  ├── template.engine === 'fabric' → fabricRenderer.renderTemplate(...)
  ├── template.engine === 'html'   → htmlRenderer.renderTemplate(...)
  └── template.engine === unknown  → 500 UnknownEngineError
html-renderer.renderTemplate (ordered stages, each observable)
  [1] validate: required vars, sizes, format, dims → 422 on fail
  [2] compile:  LRU cache lookup by (uid + updatedAt), else Handlebars.parse
                → on syntax error, return 422 with {line, col, message}
  [3] apply:    compiled(vars) with escape-by-default;
                strict mode → throw on undefined; lax → empty + warn
  [4] semaphore acquire (team uid, cap 10, TTL 60s)
                → timeout 10s → 503 RenderQueueBusy
  [5] page acquire (browserpool timeout 30s)
                → timeout → 503 or 500 per pool health
  [6] setJS: page.setJavaScriptEnabled(template.jsEnabled && flag-enabled)
  [7] install request interceptor = ssrf-guard
                → every subresource: DNS re-check, scheme allowlist
                → blocked subresource: log + proceed (degraded render ok)
  [8] setContent(html, { waitUntil: 'domcontentloaded' })
                → timeout 30s → 503 RenderTimeout
  [9] wait fonts ready (page.evaluate document.fonts.ready, 5s timeout)
                → timeout: proceed with fallback + warn log
  [10] output:
        - image: page.screenshot({type, quality, clip, omitBackground})
        - pdf:   page.pdf({format, printBackground})
        - gif:   frame capture loop via existing path
  [11] postprocess: sharp for format/quality (image only)
  [12] finally: always release page + release semaphore
      (verified by tests; page.on('error') handler counts as implicit release)
```

### Engine immutability state machine

```
  (create, engine='fabric')                 (create, engine='html')
         |                                          |
         v                                          v
  +-----------+                              +-----------+
  |  fabric   |--[attempt patch engine]----> REJECTED (422)
  +-----------+       (force fork)           +-----------+
         |                                          |
         | fork (creates new Template, same engine) |
         |                                          |
         v                                          v
  +-----------+                              +-----------+
  |  fabric*  |                              |  html*    |
  +-----------+                              +-----------+

  * fork inherits everything except uid, team, parentTemplate
```

### CLI sync protocol

```
  pictify push
   |- walk templates/**/*.html
   |- for each: read html + sibling variables.json
   |- compute contentHash = sha256(html + JSON.stringify(variables))
   |- load .pictify/state.json (previous hashes)
   |- diff: create | update | unchanged | deleted
   |- batch POST /api/v1/templates/sync
   |      { items: [{path, html, variables, contentHash, lastKnownVersion}] }
   |- server responds: { results: [{path, status, remoteVersion, error?}] }
   |- client: write successful items into state.json
   |          re-prompt on 'conflict' items (show diff)
   |          retry on transient 'error' items
   |- network drop mid-batch → state.json partial, rerun idempotent
```

## Implementation Units

Implementation units below are grouped by phase. Each phase is atomic enough to merge independently behind feature flags. Phase 1 lays the invariants + dispatcher; Phase 2 ships the engine; Phase 3 ships the UI; Phase 4 ships the CLI; Phase 5 ships observability + infra. Units 3 and 15 intentionally cover both backends at once because they form the dispatcher's contract.

### Phase 1 — Foundations (Model, Dispatcher, Invariants)

- [ ] **Unit 0: Dependency installation + Prometheus reintroduction prep**

**Goal:** Add all net-new runtime dependencies to both repos before any unit depends on them.

**Requirements:** enables R2, R8, R14, R19.

**Dependencies:** None.

**Files:**
- Modify: `html-to-gif/package.json` — add `handlebars` (v4.7+), `ipaddr.js`, `@faker-js/faker` (if used server-side for seed tests), `prom-client`, `lru-cache`, `json-stable-stringify`, `linkedom`, `diff`.
- Modify: `front-end-html-to-gif/package.json` — add `@codemirror/autocomplete`, `@codemirror/linter`, `@codemirror/state`, `handlebars`, `@faker-js/faker`, `diff`. Verify `prismjs` is already present for snippet highlighting.
- Create: `pictify-cli/package.json` (generated in Unit 22; flagged here for npm-name reservation).
- Run `npm install` in both backend + frontend; commit lock-files.
- **Pre-flight:** verify `pictify` is available on npm; if not, fall back to `@pictify/cli`.

**Test scenarios:**
- Happy path: `npm ci` in both repos succeeds with lockfile diffs only.

**Verification:** build passes on both repos after install; no runtime behavior change.

- [ ] **Unit 1: Add `engine`, `jsEnabled`, `strictVariables` fields to Template model with invariant validator**

**Goal:** Extend `Template` schema with the three new fields, enforce the `engine`/`fabricJSData`/`html` mutex, and block post-create `engine` mutation.

**Requirements:** R1, R13, D1, D9.

**Dependencies:** None.

**Files:**
- Modify: `html-to-gif/models/Template.js`
- Test: `html-to-gif/test/template-model-invariant.test.js`

**Approach:**
- Add `engine: { type: String, enum: ['fabric','html'], default: 'fabric' }`, `jsEnabled: { type: Boolean, default: false }`, `strictVariables: { type: Boolean, default: true }`.
- Add `templateSchema.pre('validate')` enforcing mutex rules.
- Add `templateSchema.pre('findOneAndUpdate')` + `pre('updateOne')` rejecting any `$set.engine` change.
- Backward compat: templates missing `engine` default to `'fabric'`; mutex validator skipped for legacy records where both `html` is empty and `fabricJSData` is null (render-dispatcher handles legacy default).

**Execution note:** Start with a failing test that writes an invalid combo (engine='html' + populated fabricJSData) and expects a validation error; then implement.

**Patterns to follow:**
- Existing pre-save hook at `html-to-gif/models/Template.js` (uid generation).
- Existing `filterActive` pre-query pattern.

**Test scenarios:**
- Happy path: create `engine='fabric'` + `fabricJSData` populated → ok.
- Happy path: create `engine='html'` + `html` populated + `fabricJSData` null → ok.
- Error path: create `engine='html'` + empty `html` → validation error.
- Error path: create `engine='html'` + populated `fabricJSData` → validation error.
- Error path: create `engine='fabric'` + empty `fabricJSData` → validation error.
- Error path: `findOneAndUpdate` with `{ engine: 'html' }` on existing fabric template → validation error, template unchanged.
- Edge case: legacy template with `engine` missing, `html=''`, `fabricJSData=null`, `grapeJSData=populated` → `toJSON`/`toObject` normalizes without error (backfill path).
- Edge case: `jsEnabled` and `strictVariables` default correctly when omitted.

**Verification:** Tests pass; `node scripts/backfill-engine-field.js --dry-run` reports correct counts (Unit 2 validates this).

- [ ] **Unit 2: Backfill script — set `engine='fabric'` on all existing templates**

**Goal:** One-time migration that sets `engine='fabric'` on every template missing the field, plus reports any records that would violate the mutex invariant (so Unit 1's validator doesn't break production on deploy).

**Requirements:** R1, deployment safety.

**Dependencies:** Unit 1.

**Files:**
- Create: `html-to-gif/scripts/backfill-engine-field.js`
- Test: covered via dry-run plus a small integration test exercising one real fixture.

**Approach:**
- Query: `{ engine: { $exists: false } }` → set `engine: 'fabric'`.
- Pre-scan: `{ html: { $ne: '' }, fabricJSData: { $ne: null } }` → log count + sample uids; if non-zero, exit non-zero on non-dry-run. Document manual cleanup procedure.
- Pre-scan: `{ grapeJSData: { $exists: true } }` → log count; no changes (Unit 20 handles retirement).
- Support `--dry-run`, `--batch-size`, `--limit` flags.

**Patterns to follow:** Existing scripts under `html-to-gif/scripts/` (migration pattern with `--dry-run` flag).

**Test scenarios:**
- Happy path: 100 templates without `engine` → all updated.
- Edge case: pre-scan detects mutex-violation records → script exits non-zero with actionable message.
- Edge case: batch size honored; large dataset processes in chunks.
- Happy path: dry-run mode makes no writes.

**Verification:** Backfill runs green on a staging snapshot.

- [ ] **Unit 3: Add `service/render-dispatcher.js` facade + `fabric-renderer.js` wrapper**

**Goal:** Introduce the single rendering entry point. Wrap the existing fabric rendering path (today: `service/template-renderer.js`) behind a `fabric-renderer.js` module that exposes the same signature the dispatcher calls. The dispatcher is the only module that knows about engines.

**Requirements:** R5, D2.

**Dependencies:** Unit 1.

**Files:**
- Create: `html-to-gif/service/render-dispatcher.js`
- Create: `html-to-gif/service/fabric-renderer.js` (thin wrapper around existing `template-renderer.renderTemplateWithVariables`)
- Modify: `html-to-gif/service/template-renderer.js` (extract `renderTemplateWithVariables` — no behavior change)
- Test: `html-to-gif/test/render-dispatcher.test.js`

**Approach:**
- Public API: `async function renderTemplate(template, variables = {}, options = {}) → RenderResult` where `RenderResult` is the same shape the existing fabric path returns (`{ url, width, height, dataUrl, timings, ... }`).
- Dispatch logic: `engine === 'fabric' → fabricRenderer.renderTemplate(...)`, `engine === 'html' → htmlRenderer.renderTemplate(...)` (stub that throws `NotImplementedError` until Unit 10). Undefined engine → fabric (legacy compat).
- Inject dependencies for testing (factory export): `createDispatcher({ fabricRenderer, htmlRenderer })`.
- Add `render_id` generation (uuidv4) and thread through `options.renderId`.

**Patterns to follow:**
- `html-to-gif/routes/experiment-render.js` — `switch(experiment.type)` strategy pattern.
- Options-object pattern used by `service/template-renderer.js`.

**Test scenarios:**
- Happy path: engine='fabric' dispatches to fabric renderer, returns its result.
- Happy path: engine undefined defaults to fabric renderer.
- Error path: engine='html' currently throws NotImplementedError (will be replaced when Unit 10 lands).
- Error path: engine='banana' → UnknownEngineError.
- Integration: `render_id` is unique per call and appears in the returned result.

**Verification:** Existing `template-renderer` tests still pass; dispatcher tests pass.

- [ ] **Unit 4: Route all render callers through the dispatcher**

**Goal:** Retire direct calls to `template.populateTemplate(...)` / `renderTemplateWithVariables(...)` in favor of `dispatcher.renderTemplate(...)`. No HTML behavior yet — fabric continues to render unchanged; this is preparation work.

**Requirements:** R5, R18.

**Dependencies:** Unit 3.

**Files:** (pre-work: run `rg -l 'populateTemplate|populateFabricTemplate|renderTemplateWithVariables|grapeJSData' html-to-gif` and verify every hit is migrated before closing this unit)
- Modify: `html-to-gif/routes/image.js` (replace `template.populateTemplate(variables)` at line ~61)
- Modify: `html-to-gif/routes/gif.js` (replace call at line ~69)
- Modify: `html-to-gif/routes/pdf.js` (currently calls `renderTemplateToPdf` with `variableSets[]`; see note below)
- Modify: `html-to-gif/routes/template-render.js`
- Modify: `html-to-gif/routes/public-render.js`
- Modify: `html-to-gif/service/url-param-renderer.js`
- Modify: `html-to-gif/service/experiment-renderer.js`
- Modify: `html-to-gif/service/pdf-generator.js` (multi-page PDF path)
- Modify: `html-to-gif/service/binding-renderer.js`
- Modify: `html-to-gif/service/batch-processor.js`
- Modify: `html-to-gif/connectors/universal/actions/renderWithVariables.js`
- Modify: `html-to-gif/connectors/universal/actions/renderStatic.js`
- Modify: `html-to-gif/lib/thumbnail.js` (reads `template.fabricJSData || template.grapeJSData` — replace with normalized accessor that dispatcher also uses)
- Test: integration tests on every migrated caller confirm no regression (reuse existing tests; add pixel-compare snapshot for each render route and characterization-capture payloads for binding-renderer, batch-processor, and the universal connector actions).

**Approach:**
- Wherever a route/service pulls a template and currently calls `template.populateTemplate` or passes the template into `renderTemplateWithVariables`, change the call to `dispatcher.renderTemplate(template, variables, options)`.
- Preserve the routes' existing option shapes (quota, audit, webhook emission) by reading from the dispatcher's uniform `RenderResult`.
- Where a route today branches `if (templateUid) html = await template.populateTemplate(variables)` and then sends raw HTML into Puppeteer, the new path simply calls the dispatcher and uses its returned artifact (the fabric renderer already produced a data URL / URL).
- **Legacy HTML-through-Puppeteer fallback (routes/image.js + routes/gif.js):** today's `template.populateTemplate(variables)` returns an HTML string that is fed into `captureImagesReliable`. This is materially different from the fabric-canvas path. Before migrating, snapshot behavior for any template that today has **both** `html` populated AND `fabricJSData` populated. For those rows the dispatcher's engine='fabric' routing will change rendered bytes. Options: (a) skip migration if `html` non-empty + `fabricJSData` null (legacy HTML-as-fabric) and keep calling `captureImagesReliable`; or (b) set `engine='html'` during the Unit 2 backfill for those rows so the dispatcher routes correctly. Decide + document in the final Unit 2 script.
- **Multi-page PDF signature (pdf.js + pdf-generator.js):** `renderTemplateToPdf(template, variableSets[])` takes an array. Extend dispatcher `options` to accept `options.variableSets?: object[]` and flatten `variables` into a single-element array internally so both callers use the same signature. Document the option shape in Unit 3.
- **`RenderResult.dataUrl` contract:** fabric produces `dataUrl` via node-canvas. Puppeteer produces a Buffer. Unit 10 (html-renderer) MUST produce a `dataUrl` for parity with the fabric-renderer so downstream callers (`url-param-renderer.js:106`, `experiment-renderer.js:160-162` which regex-parses `dataUrl`) do not break. Alternative: add `buffer` + `contentType` fields to `RenderResult` and migrate those 2 callers to use buffer directly. Pick the latter (cleaner, avoids base64 overhead) and migrate `url-param-renderer` + `experiment-renderer` as part of Unit 4.
- **`browserpool.js::resetPage` contamination:** today's `resetPage` does not restore `page.setJavaScriptEnabled` state. Unit 10 sets JS-off for HTML renders; if the page is recycled to a fabric/PDF render, the waitForFunction will hang. Unit 4 adds a `resetPage` modification that restores `setJavaScriptEnabled(true)`, clears request interceptors, and `page.goto('about:blank')` between renders to clear any tenant state (service workers, intervals, iframes). This prevents cross-tenant data leaks via recycled pages.

**Execution note:** Characterization-first — snapshot the response shape of each touched route against a fixture before changing, then verify unchanged after.

**Patterns to follow:**
- `html-to-gif/routes/image.js` current quota + audit pattern.

**Test scenarios:**
- Integration: POST /image with `{ template: uid, variables }` returns identical shape to before refactor.
- Integration: GET /r/:uid.png returns identical bytes (pixel-compare) for the same template + vars.
- Integration: GIF + PDF endpoints unchanged.
- Integration: experiment-renderer end-to-end unchanged.

**Verification:** Full existing test suite green. Manual curl of each route returns expected content.

### Phase 2 — HTML Engine (Handlebars + Puppeteer + Safety)

- [ ] **Unit 5: Redis-backed per-team semaphore (`browser-semaphore.js`)**

**Goal:** Provide `acquire(teamUid) → release` with a concurrency cap (default 10) and a safety TTL (default 60s). Fallback to in-memory counter when Redis is unreachable.

**Requirements:** R6, D3.

**Dependencies:** None technical; useful before Unit 10.

**Files:**
- Create: `html-to-gif/service/browser-semaphore.js`
- Test: `html-to-gif/test/browser-semaphore.test.js`

**Approach:**
- Key: `pictify:html-render:sem:{teamUid}:{slot}` with slot 1..N; attempt `SET NX PX 60000`; first success wins; retry with jitter up to total 10s wait.
- Release: `DEL` the acquired slot key.
- TTL reaping ensures a crashed render doesn't permanently leak a slot.
- Expose metrics: `pictify_browser_pool_semaphore_wait_seconds`.
- Fallback: if ioredis reports down, use in-proc `Map<teamUid, count>` + Promise queue.

**Patterns to follow:**
- `html-to-gif/service/rate-limit*.js` Redis patterns (if present) or `@fastify/rate-limit` source for reference.
- OAuth state memory-fallback pattern referenced in user memory (Redis-backed with in-memory fallback).

**Test scenarios:**
- Happy path: 10 acquires succeed, 11th blocks until release.
- Happy path: release frees a slot; next acquire succeeds.
- Edge case: TTL expires on held slot → slot automatically reclaimable after 60s.
- Error path: Redis down → fallback engages; warn log emitted; acquires still succeed up to cap (in-proc).
- Edge case: two teams independently at full cap do not block each other.

**Verification:** Unit tests pass against real Redis in CI; fallback path tested with Redis client-disconnect simulation.

- [ ] **Unit 6: Extract shared `service/template-helpers.js` (helper safelist)**

**Goal:** Move the 40+ text-interpolation helpers currently embedded in `service/template-expression-engine.js` into a standalone module that both the fabric expression engine and the new Handlebars engine can consume. Single source of truth; no drift.

**Requirements:** R2, R3, R4, DRY (D15 indirectly).

**Dependencies:** None.

**Files:**
- Create: `html-to-gif/service/template-helpers.js`
- Modify: `html-to-gif/service/template-expression-engine.js` (import from new module)
- Test: `html-to-gif/test/template-helpers.test.js`

**Approach:**
- Each helper exported as a pure function (no canvas/fabric dependency).
- Helper registry is an explicit named export: `const HELPERS = { currency, titleCase, date, ... }`.
- Document which helpers are safe for Handlebars (most are); any stateful/side-effecting helpers are flagged (none currently).
- Maintain existing fabric behavior byte-for-byte during refactor.

**Execution note:** Characterization-first — snapshot existing fabric helper outputs against a fixture set before extraction.

**Patterns to follow:** Internal structure of `service/template-expression-engine.js`.

**Test scenarios:**
- Happy path: `currency(1234.5, 'USD')` returns `$1,234.50`.
- Happy path: `titleCase('hello world')` returns `Hello World`.
- Happy path: every helper with a representative input produces the expected output.
- Regression: existing fabric templates rendering through `processTemplateLogic` produce identical text output before/after the refactor.

**Verification:** Existing fabric tests pass unchanged; new tests cover each helper.

- [ ] **Unit 7: `service/html-template-engine.js` — Handlebars compile + apply with LRU cache, safelist, strict mode, raw-HTML gate**

**Goal:** Turn `(template.html, variables, template.variableDefinitions, strictMode)` into a fully rendered HTML string safely. This is where all templating semantics live.

**Requirements:** R2, R3, R4, R11, D4, D7.

**Dependencies:** Unit 6.

**Files:**
- Create: `html-to-gif/service/html-template-engine.js`
- Create: `html-to-gif/lib/html-ast.js` (Handlebars AST extraction utilities)
- Create: `html-to-gif/lib/html-template-errors.js`
- Test: `html-to-gif/test/html-template-engine.test.js`

**Approach:**
- Configure Handlebars instance with `noEscape: false`, `strict: false` at the Handlebars level (we implement strict semantics explicitly, see below), `allowProtoMethodsByDefault: false`, `allowProtoPropertiesByDefault: false`.
- Register helpers from `template-helpers.js` via `instance.registerHelper`. **SafeString audit** (Execution note): during helper extraction in Unit 6, enumerate every helper and note which return a `Handlebars.SafeString` — those are implicit raw-HTML paths and must also be gated by `allowRawHtml` or rewritten to return escaped strings.
- Compile cache: LRU (lru-cache), key `{templateId}:{updatedAt-ms}:{hash(variableDefinitions)}`, max 500 entries. Including a hash of `variableDefinitions` ensures a config-only change (e.g., flipping `allowRawHtml`) invalidates the cached compiled fn even if `updatedAt` did not bump.
- Parse-phase static analysis before compile:
  - Extract identifier references (variable names, block contexts).
  - For every `{{{rawVar}}}` triple-brace ref, verify `variableDefinitions[rawVar].allowRawHtml === true`, else throw `RawHtmlNotAllowedError` with line/col.
  - For every `{{helper arg}}` call, verify helper name in safelist, else throw `HelperNotAllowedError`.
  - **Block helpers accessing `@root` / `../..`** are not blocked (Handlebars feature), but because we pass a clean variables-only context (see below), `@root` can only reach the user's own variables — there is no system metadata to expose.
- Apply phase:
  - Pass **only the variables object** to the compiled fn. No request context, team id, internal fields. This is the security contract.
  - If a required variable (`variableDefinitions[name].required === true`) is undefined → always throw `VariableRequiredError` regardless of strictVariables mode.
  - If strictVariables AND a `{{var}}` mustache / `{{helper var}}` helper argument is undefined → throw `UndefinedVariableError`. **Do not throw** on undefined block-condition subjects (`{{#if discount}}`) or `{{#each}}` iterables — treat those as falsy per Handlebars norm. This prevents the common "optional conditional" pattern from breaking in strict mode.
  - Escape-by-default via Handlebars `{{var}}`.
  - **`{{#each}}` iteration cap**: 5000 elements per iterable, configurable via `HTML_RENDER_MAX_EACH_ITERATIONS` env. Throws `IterationLimitExceededError`. Prevents CPU-DoS via a variable that is a 100k-element array applied pre-semaphore.
- Expose: `compile(template) → compiledFn`, `render(template, vars, options) → htmlString`.
- Surface compile errors with `{ line, col, message, hint }` for editor consumption.

**Patterns to follow:**
- `service/template-expression-engine.js` expression semantics for carryover parity.
- `lib/errors.js` base-error conventions (retriable flag).

**Test scenarios:**
- Happy path: `{{name}}` with `{ name: 'Jo' }` → `Jo`.
- Happy path: `{{currency price 'USD'}}` with `{ price: 9.9 }` → `$9.90`.
- Happy path: `{{#if logo}}<img>{{/if}}` with `{ logo: 'url' }` → `<img>` block rendered.
- Happy path: `{{#each items}}{{name}}{{/each}}` iterates.
- Escape: `{{title}}` with `{ title: '<script>' }` → `&lt;script&gt;`.
- Raw gate happy: `{{{html}}}` with variableDefinitions[html].allowRawHtml=true → raw output.
- Raw gate error: `{{{html}}}` without flag → `RawHtmlNotAllowedError` with line/col.
- Strict-missing required: `{{name}}` with no value, variable marked required → `VariableRequiredError`.
- Strict-missing non-required: `{{name}}` with no value, strictVariables=true → `UndefinedVariableError`.
- Lax-missing: same input, strictVariables=false → empty string + warning log emitted.
- Compile error: `{{#if}}` unclosed → `HandlebarsCompileError` with `line: 1, col: 6, hint: 'unclosed #if block'`.
- Safelist: `{{eval x}}` → `HelperNotAllowedError`.
- Prototype guard: `{{__proto__.constructor}}` → throws via Handlebars config.
- Edge case: circular variable value → `[Circular]` token rendered, no exception.
- Edge case: large template (500KB) compiles under 250ms on CI.
- Compile cache: second render of same template (unchanged updatedAt) hits cache (assert via spy).

**Verification:** Tests pass; `run() → renderedHtml` is safe to hand to Puppeteer.

- [ ] **Unit 8: `service/ssrf-guard.js` — per-request DNS re-check + scheme allowlist**

**Goal:** Produce a request-interceptor function suitable for `page.on('request', handler)` that blocks private-IP, link-local, and non-HTTPS/HTTP resources (except `data:image/*`), with DNS resolution on every request (not at save-time URL parsing alone).

**Requirements:** R8, D6.

**Dependencies:** None.

**Files:**
- Create or extend: `html-to-gif/service/ssrf-guard.js`
- Test: `html-to-gif/test/ssrf-guard.test.js`

**Approach:**
- Exported: `createInterceptor({ allowedSchemes, allowExternal = true, extraBlocklist, onBlock })` returning `(puppeteerRequest) => void`.
- Scheme allowlist: `http:`, `https:`, `data:` (only `data:image/*` MIME types).
- For http/https: parse URL; resolve via `dns.lookup(host, { family: 0, all: true })`; if any resolved IP matches RFC-1918 / 100.64.0.0/10 / 127.0.0.0/8 / 169.254.0.0/16 / ::1 / fc00::/7 / fe80::/10 → abort.
- DNS cache: tiny per-render LRU (bounded ~500 entries) to avoid re-resolving the same host per render — BUT cache entries live only for the duration of a single render (new Map() per render).
- `onBlock(reason, url)` — emits structured security log + increments `pictify_ssrf_blocks_total` counter.
- Existing ad/tracking URL-substring block (from `lib/image.js`) stays as a complementary layer; consolidate if trivial.

**Patterns to follow:**
- Existing `lib/image.js` request-interception pattern.
- `ipaddr.js` for robust IP classification.

**Test scenarios:**
- Happy path: `https://fonts.gstatic.com/...` → continue.
- Error: `http://169.254.169.254/latest/meta-data/` → abort, security log emitted.
- Error: `http://10.0.0.1/` → abort.
- Error: `http://localhost:6379/` → abort.
- Error: `file:///etc/passwd` → abort (scheme).
- Error: `javascript:alert(1)` → abort (scheme).
- Error: `data:text/html,<script>alert(1)</script>` → abort (data: MIME not image).
- Happy: `data:image/png;base64,...` → continue.
- DNS-rebind: host resolves once to public IP, on re-resolve returns 127.0.0.1 → per-render cache ensures the second resolution is fresh; block.
- Edge: AAAA record is IPv6 link-local → abort.
- Edge: IPv4-mapped IPv6 (`::ffff:10.0.0.1`) → abort.

**Verification:** All tests pass using mocked `dns.lookup`.

- [ ] **Unit 9: `service/font-proxy.js` — fonts.googleapis.com rewriter + CDN cache**

**Goal:** Rewrite Google Fonts URLs to the Pictify CDN at render time so fonts load from our edge, not Google's. Pre-seeded with the top fonts; fills in on-demand for misses.

**Requirements:** R19, D16.

**Dependencies:** None.

**Files:**
- Create: `html-to-gif/service/font-proxy.js`
- Create: `html-to-gif/scripts/seed-font-proxy.js`
- Test: `html-to-gif/test/font-proxy.test.js`

**Approach:**
- Provide `rewriteHtml(html)` using a **DOM parser** (linkedom — already a candidate dep) rather than regex. Regex-on-HTML is fragile with quote variants, attributes in odd order, or `@import` inside CSS comments. Rewrite rules:
  - `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` → proxied.
  - `@import url('https://fonts.googleapis.com/...')` inside inline `<style>` or `<link>` tags → proxied.
  - `<link rel="preconnect" href="https://fonts.gstatic.com">` → rewritten to our CDN origin.
  - Any `url('https://fonts.gstatic.com/...woff2')` inside rewritten CSS (we fetch + rewrite the CSS body when we proxy it) → proxied. This covers the font-file fetches, which is where the real p99 latency sits.
- Proxy endpoint `/font-proxy/googleapis/:query` and `/font-proxy/gstatic/:path` — server-side fetch → S3/CDN cache → 302 to CDN URL. Keyed by family+weight+subset hash AND `User-Agent` hash (Google Fonts' CSS2 response varies by UA; we forward our Puppeteer UA so fetched CSS targets the correct woff2 variants).
- **Input validation** for `:query` / `:path`: strict allowlist regex (`^[A-Za-z0-9_+:,.?&=-]{1,256}$`); any violation → 400. This prevents SSRF via crafted parameters.
- **SSRF guard reuse**: the proxy's server-side fetch runs through `service/ssrf-protection.validateUrl` before executing. Defense-in-depth even though the outbound URL is constructed from our allowlist.
- **Scope note (non-goals for this unit):** Adobe Fonts / Typekit / Bunny Fonts / self-hosted fonts are NOT rewritten by this proxy. Templates using those keep hitting their origins; we rely on the Puppeteer `waitForFonts` fallback to keep rendering sane. A follow-up plan can extend the proxy if metrics show material impact from non-Google providers.
- **License safety:** before shipping, run `scripts/seed-font-proxy.js --license-audit` which cross-references the top-200 families against the Google Fonts API metadata for redistribution terms. Exclude any family whose license is not in `{'OFL', 'Apache-2.0', 'UFL'}`. Document the audit result in `docs/HTML_BACKEND.md`.
- Seed script pre-warms the top ~200 families + common gstatic woff2 files.
- Miss: asynchronously fetches + caches; first miss falls back to direct Google Fonts URL **through the SSRF guard** (log warn).
- Rate limit the `/font-proxy/*` endpoint independently (public-facing if hit from user browsers; internal if only Puppeteer calls it — start with internal-only and block public access at the reverse proxy).

**Patterns to follow:**
- `connectors/storage/helper.js` for S3 upload helper.

**Test scenarios:**
- Happy path: HTML with `<link rel=stylesheet href="https://fonts.googleapis.com/css2?family=Inter">` → rewritten to CDN URL.
- Happy path: `@import url('https://fonts.googleapis.com/css2?family=Inter')` inside `<style>` → rewritten.
- Edge case: fonts.googleapis.com query variations preserved in CDN key.
- Error path: CDN miss → async cache + direct-URL fallback serve.

**Verification:** Render perf A/B on a dummy template: pre-rewrite vs. rewritten shows reduced p99 font-load stage.

- [ ] **Unit 10: `service/html-renderer.js` — end-to-end HTML render pipeline**

**Goal:** Concrete implementation of the HTML engine. Wire compile → apply → semaphore → page → interceptor → setContent → fonts → output. Support image / pdf / gif output.

**Requirements:** R6, R8, R9, R10, R12, D3, D5, D6, D8, D12.

**Dependencies:** Units 5, 7, 8, 9.

**Files:**
- Create: `html-to-gif/service/html-renderer.js`
- Test: `html-to-gif/test/html-renderer.test.js`

**Approach:**
- Signature mirrors `fabric-renderer.renderTemplate`.
- Stages exactly as the data-flow diagram above.
- **Stage order with cache + font-proxy wired in:** validate → render-result-cache.get() → [cache miss] compile → apply vars → font-proxy rewrite → semaphore acquire → page acquire → JS toggle → install SSRF interceptor → setContent → fonts.ready → output → postprocess → render-result-cache.set() → release. Cache hit returns immediately after `render-result-cache.get()` (see Unit 14 for quota/audit parity note).
- Output branch by `options.format`:
  - `png|jpeg|webp`: `page.screenshot(...)` → optional sharp reformat.
  - `pdf`: `page.pdf(...)` with preset-to-option mapping reusing `pdfPreset` enum.
  - `gif`: hand off frames to existing GIF frame-capture path.
- Always returns `{ url?, dataUrl?, buffer?, contentType, width, height, timings, format, renderId }`. `buffer + contentType` is canonical; `dataUrl` is opt-in (generated from buffer when a caller still needs it).
- `finally` block releases page + semaphore. Wire `page.on('error')` and `page.on('pageerror')` to log with renderId. Force-release the page via `browserpool.forceReleaseOnError(page)` so a crashed page is replaced, not recycled.
- Respect `template.strictVariables`, `template.jsEnabled` (AND'd with `html-templates-js-enabled` feature flag). When the flag is OFF but the template has `jsEnabled=true`, emit counter `pictify_html_render_js_overridden_by_flag` + warn log so ops can see kill-switch-induced behavior changes.
- Structured stage timings logged (Section D19).
- **Clean Handlebars context:** pass `compiledFn(variables)` where `variables` is the user payload only — NEVER merge in request context, team metadata, or system state. This closes Handlebars `@root` / `../` path-traversal context-escape (Security D5).
- **`document.fonts.ready` timeout fallback:** 5s cap; on timeout, capture which fonts failed via `page.evaluate(() => Array.from(document.fonts).filter(f => f.status !== 'loaded').map(f => f.family))` and emit a `font_load_failed` log event with the list. Fallback to system fonts for the render. This gives us signal to debug persistent font issues (including `unicode-range` subsets that never resolve).
- **Page hygiene between renders:** before release, `await page.goto('about:blank')` + `page.removeAllListeners('request')` + restore `setJavaScriptEnabled(true)` so the next (possibly fabric) consumer starts clean. Ownership of this hygiene lives in `browserpool.js::resetPage` (Unit 4 modifies it).

**Patterns to follow:**
- `lib/image.js` `WebImageCapture` for setContent + interception details.
- `service/template-renderer.js` stage-timing + uploadToStorage pattern.

**Test scenarios:**
- Happy path: `engine='html'`, simple `<h1>{{title}}</h1>`, format png → returns buffer; pixel-compares to snapshot.
- Happy path: same template, format pdf → returns PDF bytes with page size matching `pdfPreset`.
- Happy path: with jsEnabled=true + SVG animation → gif frames captured.
- Error path: compile error bubbles as 422-compatible error (HandlebarsCompileError from Unit 7 re-thrown).
- Error path: semaphore timeout (cap saturated) → SemaphoreTimeoutError.
- Error path: page.setContent timeout → RenderTimeoutError; retry once; else 503.
- Error path: SSRF-blocked subresource → render proceeds, security log emits, image missing that asset but completes.
- Edge case: viewport > 4096 → ViewportTooLargeError (422 at validation stage).
- Edge case: fonts never become ready within 5s → render proceeds with fallback + FontsTimeoutWarning log.
- Integration: after completion, semaphore slot is free AND page is released (assert via spies).

**Verification:** Tests pass; manual curl of `/image` with an `engine='html'` test template renders successfully.

- [ ] **Unit 11: Wire `html-renderer` into the dispatcher**

**Goal:** Replace the NotImplementedError stub in Unit 3 with the concrete `html-renderer`.

**Requirements:** R5.

**Dependencies:** Units 3, 10.

**Files:**
- Modify: `html-to-gif/service/render-dispatcher.js`
- Test: `html-to-gif/test/render-dispatcher.test.js`

**Approach:**
- Import `html-renderer` and pass through identical options.
- Feature-flag gate: if `html-templates-enabled` is off, dispatcher throws `HtmlTemplatesDisabledError` (prevents accidental renders if create-guard is bypassed).

**Patterns to follow:** Unit 3.

**Test scenarios:**
- Happy path: `engine='html'` dispatches to html-renderer.
- Error path: feature flag off → HtmlTemplatesDisabledError.

**Verification:** Existing dispatcher tests pass; HTML route now returns real images.

- [ ] **Unit 12: Extend `routes/template.js` — accept `engine`, `html`, `jsEnabled`, `strictVariables`; compile-validate at save**

**Goal:** Accept the new fields on create/update. Compile-validate HTML at save via Unit 7's `html-template-engine.parse()` to catch syntax errors before they land in storage. Undeclared-variable auto-add (Unit 13 client-side, server validates the final saved set).

**Requirements:** R1, R13, R14 (partial), D11.

**Dependencies:** Unit 7.

**Files:**
- Modify: `html-to-gif/routes/template.js`
- Test: reuse `test/template.test.js` or add `test/template-html-create.test.js`.

**Approach:**
- Extend `templateSchema` JSON schema with the three new fields.
- In create/update handlers, if `engine === 'html'`: run `htmlTemplateEngine.parse(html, variableDefinitions)`. If `RawHtmlNotAllowedError`, `HelperNotAllowedError`, or compile error → respond 422 with `{ code, line, col, message, hint }`.
- If `engine` present and differs from existing record on update → 422 `EngineImmutableError` with `fork` hint (belt and braces alongside the mongoose pre-hook).
- Template size cap check: `html.length > 500_000` → 422 `TemplateTooLarge`.
- **Legacy schema fix:** `Template.variables` (the legacy string array) is `required: true`. For HTML templates we don't use it, but Mongoose will reject saves without it. Default `variables: []` server-side on engine='html' create paths. Do NOT relax `required:true` (it'd ripple across other callers); just supply the empty array.
- **Any mutation path that touches `html`, `variableDefinitions`, `jsEnabled`, or `strictVariables` MUST bump `updatedAt`.** Mongoose `findOneAndUpdate` / `updateOne` bypass `pre('save')`; use explicit `$set.updatedAt = new Date()` or enable `timestamps: true` at the schema level — pick one and document. This protects the compile cache and render-result cache keys from staleness (Security F8).
- **Auto-add undeclared variables (D11):** after a successful parse, use `lib/html-ast.extractIdentifiers(html)` and append any missing identifiers to `variableDefinitions` as `{ type: 'text', defaultValue: '', required: false }`. Return the added names in the response payload so the editor can surface them.

**Patterns to follow:**
- Existing `createTemplate`/`updateTemplate` handlers; `uploadBase64Images`; `extractVariablesFromFabric`.

**Test scenarios:**
- Happy path: POST /template with `{ engine: 'html', html: '<h1>{{title}}</h1>', variableDefinitions: [{name:'title'}] }` → 200, uid returned.
- Error path: same but `html: '{{#if'` → 422 with line/col.
- Error path: HTML > 500KB → 422 TemplateTooLarge.
- Error path: PATCH template with `{ engine: 'html' }` on existing fabric template → 422 EngineImmutable.
- Happy path: PATCH `html` field on existing HTML template → 200, updatedAt bumps (invalidates compile cache).

**Verification:** API tests green; existing fabric create/update unchanged.

- [ ] **Unit 13: `lib/html-ast.js` server-side + `src/lib/utils/handlebars-ast.js` client-side — variable auto-add on save**

**Goal:** Parse Handlebars AST on both server (during save) and client (during edit) to extract identifiers. Server implements the auto-add: on save, if `html` references identifiers not in `variableDefinitions`, append them with `{ type: 'text', defaultValue: '' }` and return a list of added names in the response so the editor can surface them.

**Requirements:** R14, D11.

**Dependencies:** Unit 7.

**Files:**
- Create: `html-to-gif/lib/html-ast.js`
- Create: `front-end-html-to-gif/src/lib/utils/handlebars-ast.js`
- Modify: `html-to-gif/routes/template.js` (use `html-ast` on save to auto-add)
- Test: `html-to-gif/test/html-ast.test.js`; frontend TBD.

**Approach:**
- Uses Handlebars `parse()` to obtain AST; walk program body; extract `PathExpression` names from `MustacheStatement` / `BlockStatement` / `SubExpression`.
- Filter out reserved block helpers (`if`, `unless`, `each`, `with`, etc.) and helper function names.
- Context-aware: identifiers inside `{{#each}}` blocks are scoped; top-level-only extraction ignores block locals.
- Return `{ addedVariables: [...], knownReferenced: [...], blockHelpersUsed: [...] }`.

**Patterns to follow:** Handlebars AST walkers in the Handlebars repo.

**Test scenarios:**
- Happy path: template with `{{a}} {{#if b}}{{c}}{{/if}}` → identifiers `['a','b','c']`.
- Happy path: template with `{{#each items}}{{this.name}}{{/each}}` → identifier `items` only; `name` ignored (block-local).
- Edge case: template with only helpers no vars → empty identifier list.
- Auto-add: save with undeclared `{{z}}` → response contains `addedVariables: ['z']`; DB record contains `z` in `variableDefinitions`.

**Verification:** Server test pass; client-side utility tested in Unit 27.

- [ ] **Unit 14: `service/render-result-cache.js` — Redis-backed rendered output cache**

**Goal:** Cache the rendered bytes (or CDN URL) keyed on `(templateId, updatedAt, canonicalizedVars, format, width, height, quality)`. Invalidated implicitly by template edits (updatedAt bumps).

**Requirements:** R20, D17.

**Dependencies:** Unit 10 (produces something worth caching).

**Files:**
- Create: `html-to-gif/service/render-result-cache.js`
- Modify: `html-to-gif/service/html-renderer.js` (wire cache read/write inside the render pipeline — see Unit 10 Approach stage order)
- Test: `html-to-gif/test/render-result-cache.test.js`

**Approach:**
- **Canonicalization** (use `json-stable-stringify` or equivalent; do NOT hand-roll):
  - Recursively sort object keys alphabetically.
  - Preserve array order (arrays are semantic).
  - Distinguish `null`, `undefined`, and missing key (use a sentinel for `undefined` in canonical form so `{a: undefined}` and `{}` produce different keys).
  - Normalize numbers to fixed-precision canonical form (e.g., `0.1 + 0.2` → serialize as `0.30000000000000004` by default; document the choice).
  - Reject `Date` objects — require ISO strings — to avoid timezone ambiguity.
- **Cache key MUST include `teamId`**: `pictify:render:cache:{teamId}:{templateId}:{updatedAt-ms}:{sha256(canonicalJson + format + dims + quality)}`. This prevents cross-team cache hits for public templates rendered with identical inputs (see Security F3). Public templates do not share the cache across tenants.
- **PII posture**: templates with variables flagged `containsPII: true` (a new optional flag on variableDefinitions, default false) are NEVER cached. Additionally, if any variable value contains a detected e-mail / phone number / credit-card-pattern, skip cache + log. Use a lightweight regex check (no PII service dependency).
- Value strategy:
  - Image ≤ 256KB: store bytes + content-type directly.
  - Larger / PDF / GIF: store metadata only `{ url, width, height, format }` — assumes S3 already holds the artifact.
- TTL: 7 days (override per team plan tier).
- Integrated inside `html-renderer.renderTemplate`: cache read happens AFTER validation/compile but BEFORE semaphore + page acquire. Cache miss path writes after successful render.
- **Quota/audit/webhook parity on cache hit** (Security F9 + scope R22): cache hit still consumes a render credit, still emits the `render.completed` webhook, still writes an audit-log entry. The cache skips ONLY Puppeteer resources (page + semaphore). Unit 27 adds `pictify_html_render_cache_hit_total` counter.
- Expose hit/miss counters.

**Patterns to follow:** Any existing Redis cache service; otherwise thin wrapper on ioredis.

**Test scenarios:**
- Happy path: first render misses cache; second identical render hits cache; no page acquired.
- Edge case: same template + different vars → miss.
- Edge case: template edited (updatedAt bumps) → miss.
- Edge case: large PDF → stores URL only, not bytes.
- Error path: Redis down → graceful bypass (render proceeds); warn log.

**Verification:** Tests pass; observable cache hit rate in metrics.

### Phase 3 — Frontend (HTML Editor UX)

- [ ] **Unit 15: Engine picker + HTML template creation routes**

**Goal:** Users can select "HTML" as an engine when creating a template. HTML templates get their own creation and edit routes.

**Requirements:** R14.

**Dependencies:** Unit 12.

**Files:**
- Create: `front-end-html-to-gif/src/routes/template-workspace/html/create/+page.svelte`
- Create: `front-end-html-to-gif/src/routes/template-workspace/html/[uid]/+page.svelte`
- Modify: `front-end-html-to-gif/src/routes/template-workspace/image/create/+page.svelte` (add engine picker at entry)
- Modify: `front-end-html-to-gif/src/lib/components/dashboard/template/CreateTemplate.svelte` (support `engineFor='html'`)
- Modify: `front-end-html-to-gif/src/routes/dashboard/+page.svelte` (add "HTML Template" option to the empty-state CTA + surface engine in the template list card chip)

**Approach:**
- The existing `template-workspace/image/create` flow stays fabric. A new sibling route `template-workspace/html/create` mounts `HtmlEditorLayout`.
- Users land on a unified chooser (modal or card row) — "Canvas" (fabric) vs. "HTML" (new) — styled in the existing neobrutalist system (`#ffc480` accent).
- PostHog feature-flag `html-templates-enabled` gates the HTML entry point end-to-end.
- Template list in `/dashboard` shows an `HTML` badge chip on engine=html templates.

**Patterns to follow:**
- `routes/template-workspace/image/create/+page.svelte` mounting pattern.
- `FigmaImportModal.svelte` visual style for selection modals.

**Test scenarios:**
- UX: engine picker visible when flag on; hidden when flag off.
- UX: selecting "HTML" opens the HTML editor; selecting "Canvas" opens the existing fabric editor.
- UX: engine='html' template card in list shows HTML badge.

**Verification:** Manual dogfood + screenshot review.

- [ ] **Unit 16: `HtmlEditor.svelte` — CodeMirror 6 with Handlebars syntax, autocomplete, linter**

**Goal:** The editing surface. Syntax highlighting, variable autocomplete on `{{`, inline hover preview of variable default value, compile-error squiggles.

**Requirements:** R14 (CodeMirror editor + autocomplete + linter).

**Dependencies:** Unit 7 (compile errors), Unit 13 (AST utility).

**Files:**
- Create: `front-end-html-to-gif/src/lib/components/editor/html/HtmlEditor.svelte`
- Create: `front-end-html-to-gif/src/lib/utils/handlebars-autocomplete.js`
- Create: `front-end-html-to-gif/src/lib/utils/handlebars-linter.js`

**Approach:**
- Use CodeMirror 6 packages (`@codemirror/lang-html`, `@codemirror/autocomplete`, `@codemirror/linter`, `@codemirror/view`).
- Handlebars-aware autocomplete: on `{{`, open completion menu with declared variables (from `variables.store`), safelisted helpers (from backend-provided constant), and block helpers (`#if`, `#each`, etc.).
- Linter: async source that POSTs current buffer to a new lightweight `/template/validate` endpoint OR runs Unit 7's parser client-side (decision in implementation — see deferred note). Decorates lines with `cm-lintRange-error` on compile errors; inline tooltip shows `hint`.
- Hover preview: hover on `{{name}}` shows `name: "Jane" (text)` in a tooltip.
- Exposes `value`, `dirty`, `errors` stores.

**Patterns to follow:**
- Existing editor store patterns (`editor.store`, `history.store`).
- CodeMirror 6 official recipes for completion + linter.

**Test scenarios:**
- UX: typing `{{ ` shows completion list with known variables.
- UX: saving with `{{#if` → inline squiggle under `{{#if`; tooltip: "unclosed #if block".
- UX: hovering `{{title}}` shows its type + default.
- UX: undo/redo via cmd+z works.

**Verification:** Manual dogfood + screenshot review.

- [ ] **Unit 17: `HtmlPreview.svelte` — debounced iframe live preview with sandboxing**

**Goal:** Live iframe preview renders the current editor buffer with current variable values. Debounced 300ms; AbortController on stale responses.

**Requirements:** R14.

**Dependencies:** Unit 10 (server-side preview endpoint; see Approach).

**Files:**
- Create: `front-end-html-to-gif/src/lib/components/editor/html/HtmlPreview.svelte`
- Create: `html-to-gif/routes/template-preview.js` (new lightweight server-rendered preview endpoint using the same html-renderer path but skipping audit/quota/webhook).

**Approach:**
- Preview via server (render to data URL) and display in an `<img>` — avoids iframe sandbox mismatch with Puppeteer execution context.
- Alternative/adjunct: for very fast local-only preview, a fallback iframe with `sandbox="allow-same-origin"` and Handlebars running in-browser (no Puppeteer). Shown while server preview is in flight.
- Race-safe: request ID + AbortController; stale responses dropped.
- Shows stage breakdown (compile → render) in a footer bar when >1s.
- **Preview endpoint safety (resolves Security F9):** "skipping audit/quota/webhook" means skipping the credit charge and external side-effects only. The endpoint MUST still:
  - Use the per-team Redis semaphore from Unit 5 (shares the same 10-slot cap).
  - Be rate-limited independently at 60 previews / minute / team.
  - Route through the same SSRF guard (no exceptions for preview).
  - Use the same JS-off default + feature flag as persistent renders.
  - Emit a low-cardinality log line per preview (no separate quota, but visible for abuse detection).
  - Reject payloads > 500 KB HTML + 64 KB variables (same as Unit 24 limits).

**Patterns to follow:**
- Existing template preview patterns in the dashboard.

**Test scenarios:**
- UX: type a char → 300ms later, preview refreshes.
- UX: rapid typing cancels prior requests; only final response shown.
- UX: network error → preview pane shows "Preview unavailable" + retry button.
- UX: nav-away cancels in-flight request.

**Verification:** Manual QA + one integration test for endpoint.

- [ ] **Unit 18: `HtmlVariablesPanel.svelte` — variable management with `allowRawHtml` opt-in + sample faker randomize**

**Goal:** Manage variable definitions for HTML templates: name, type, description, required, default value, `allowRawHtml` flag for text/html vars. "Randomize sample values" button fills defaults with faker-generated values so the preview looks real instantly.

**Requirements:** R3, D7, R14 (variable panel + Randomize).

**Dependencies:** Unit 16.

**Files:**
- Create: `front-end-html-to-gif/src/lib/components/editor/html/HtmlVariablesPanel.svelte`
- Create: `front-end-html-to-gif/src/lib/utils/sample-variable-generator.js`
- Modify: `front-end-html-to-gif/src/lib/components/editor/VariablesPanel.svelte` (reuse subcomponents where feasible; no regression)

**Approach:**
- Reuses the existing `variables.store`.
- New fields on the variable definition modal: `allowRawHtml` checkbox (with warning copy) for text vars only; disabled otherwise.
- `Randomize` action: for each var, infer a realistic value by name + type using `@faker-js/faker` (e.g., `name` → `faker.person.fullName`; `price` → `faker.commerce.price`; `email` → `faker.internet.email`). Pattern list in `sample-variable-generator.js`. **Randomize writes to an ephemeral `testValues` overlay consumed by the preview, NOT to persisted `defaultValue`.** Defaults remain untouched unless the user explicitly clicks "Save as defaults" on a variable row (separate opt-in action). This prevents Randomize from corrupting intentional defaults on every exploration.
- Auto-added variables from Unit 13 server response surface here with an "auto-added" tag for one session.

**Patterns to follow:** `VariablesPanel.svelte` existing layout; neobrutalist chip styling.

**Test scenarios:**
- UX: toggle `allowRawHtml` persists in saved variableDefinitions.
- UX: `Randomize` fills vars with plausible values.
- UX: an auto-added variable appears with an "auto-added" tag that disappears after next save.

**Verification:** Manual QA.

- [ ] **Unit 19: `HtmlSettingsPanel.svelte` — template metadata + jsEnabled + strictVariables toggles + width/height + PDF preset**

**Goal:** Edit template name, description, dimensions, format (image/pdf/gif), PDF preset when applicable, `jsEnabled` toggle (with destructive-looking warning), `strictVariables` toggle.

**Requirements:** R9, R10, R12, D8.

**Dependencies:** Unit 16.

**Files:**
- Create: `front-end-html-to-gif/src/lib/components/editor/html/HtmlSettingsPanel.svelte`

**Approach:**
- Form-based side panel.
- `jsEnabled` toggle styled with a prominent `!` warning explaining performance + security implications; default off.
- `strictVariables` toggle default on; copy explains "Missing variables cause HTTP 422 by default. Turn off to substitute empty strings instead."
- Dimensions validated against `MAX_DIMENSION=4096`; inline error otherwise.

**Patterns to follow:** Existing `PropertiesPanel.svelte` form layout.

**Test scenarios:**
- UX: toggling `jsEnabled` shows/hides a warning banner.
- UX: dimensions > 4096 trigger inline validation.
- UX: switching format=pdf reveals PDF preset dropdown.

**Verification:** Manual QA.

- [ ] **Unit 20: `HtmlApiSnippetPanel.svelte` — multi-language API snippet generator (curl, JS, Python, Ruby, Go, PHP)**

**Goal:** Show the exact API call a user would make to render this template with current sample variables, in 6 languages, with one-click copy. Uses last-saved state (lesson from commit `0fe1c32`).

**Requirements:** R21.

**Dependencies:** Unit 12 (saved template exists).

**Files:**
- Create: `front-end-html-to-gif/src/lib/components/editor/html/HtmlApiSnippetPanel.svelte`
- Create: `front-end-html-to-gif/src/lib/utils/api-snippet-generator.js`

**Approach:**
- Generator is pure: `(template, sampleVariables, languageKey) → snippetString`.
- Languages:
  - `curl`: `POST /image` multipart-less `{ template: uid, variables: {...} }`.
  - `JS (fetch)`, `Node`, `Python (requests)`, `Ruby (Net::HTTP)`, `Go (net/http)`, `PHP (curl)`.
- Tabs per language; syntax-highlighted via PrismJS (check existing deps first).
- "Copy" button per language; "Send test request" button fires the snippet live (reuses current session token).
- API token appears masked; placeholder with "Copy your real token from API Token page".

**Patterns to follow:** Certificate-generator snippet UI at `src/routes/tools/certificate-generator`. Use its "edit then snippet reflects" pattern.

**Test scenarios:**
- UX: every language tab produces a valid snippet using the actual saved uid and sample vars.
- UX: saving the template re-generates snippets (no stale uid/vars).
- UX: "Send test" actually renders and returns an image in-panel.

**Verification:** Manual QA on all 6 languages; test endpoints with each curl snippet locally.

- [ ] **Unit 21: `HtmlEditorLayout.svelte` — composes editor + preview + panels + topbar**

**Goal:** Composition root for the HTML editor: left = HtmlEditor + Settings/Variables/API tabs; right = HtmlPreview. Topbar with template name, save status, publish/api-access quick actions.

**Requirements:** R14.

**Dependencies:** Units 16–20.

**Files:**
- Create: `front-end-html-to-gif/src/lib/components/editor/html/HtmlEditorLayout.svelte`
- Create: `front-end-html-to-gif/src/lib/components/editor/html/HtmlTopBar.svelte`

**Approach:**
- **Two-pane layout** (NOT a three-zone mirror of `EditorLayout.svelte`). Left pane: HtmlEditor + tab bar at top. Right pane: live preview.
- Tab bar (left pane, top): `Editor | Variables | API | Settings`. Switching tabs swaps the left-pane content while the right-pane preview stays mounted.
- **Logs tab (deferred Phase 5):** hidden by default. When `html-templates-inspect-enabled` flag is on, a "Logs" tab appears, linking out to `/admin/renders/recent?template={uid}` for admins; for non-admins it is not rendered.
- Keyboard shortcuts: cmd+s saves; cmd+shift+r opens API; cmd+k opens command palette (optional delight).
- **Responsive posture (Design F13):** the editor is desktop-only by design. On viewports < 1024 px, render a dismissible banner: "The HTML editor is desktop-only. Reopen on a wider screen, or use `pictify render` via the CLI." Below 768 px, hide the editor entirely and show a link back to the dashboard.
- **CodeMirror keyboard behavior (Design F14):** `Tab` inside the editor inserts a tab character (developer expectation). Focus escape is `Escape → Shift+Tab` to leave the editor, then normal tab order through tabs → settings → save button. Document this in the editor tooltip on first open.
- **Accessibility baselines (Design F15, F16):** lint squiggles use a CSS class `pictify-lint-error` with a brand-aligned dark-red underline wave that meets 4.5:1 contrast against the `#FFFDF8` canvas. The preview region uses `aria-live="off"` (auto-update is too frequent for announcements); a manual "Refresh preview" button announces completion via a separate `aria-live="polite"` status region. Modals trap focus; Escape closes.

**Patterns to follow:** `EditorLayout.svelte`.

**Test scenarios:**
- UX: cmd+s persists via PATCH; toast confirms.
- UX: unsaved changes set `isDirty`; `beforeunload` prompts.
- UX: switching tabs preserves editor state.

**Verification:** Dogfood a template end-to-end.

### Phase 4 — Pictify CLI (git-first authoring)

- [ ] **Unit 22: New `pictify-cli/` package — scaffold + `pictify init` + `pictify login`**

**Goal:** Create the npm package skeleton. `init` scaffolds a `templates/`, `assets/`, and `.pictify/` dir in the user's cwd with three starter HTML templates (og-image, invoice, certificate). `login` opens a browser-friendly auth flow and writes `~/.pictify/credentials.json`.

**Requirements:** R15.

**Dependencies:** Backend accepts Bearer tokens (existing).

**Files:**
- Create: `pictify-cli/package.json`, `pictify-cli/bin/pictify.js`
- Create: `pictify-cli/src/commands/init.js`, `pictify-cli/src/commands/login.js`
- Create: `pictify-cli/src/scaffolds/og-image/`, `.../invoice/`, `.../certificate/` (each: `template.html`, `variables.json`, `README.md`)
- Create: `pictify-cli/src/config.js`, `pictify-cli/src/api.js`
- Create: `pictify-cli/README.md`
- Create: `pictify-cli/test/commands.test.js`

**Approach:**
- `commander` for CLI parsing; `chalk` for color; `ora` for spinners; `prompts` for interactive; `chokidar` for watch (Unit 25).
- `init` flow: ask project name, template output dir (default `templates/`), copy scaffolds, create `.pictify/config.json` (apiHost, teamId placeholder), append `.pictify/` to `.gitignore`.
- `login` flow: `pictify login --token <value>` OR `pictify login` (opens `https://pictify.io/dashboard/api-token?cli=1` in browser; user copies token; prompt pastes). Server-minted CLI tokens carry `scope='cli'` (Unit 24).
- `logout` flow: `pictify logout` deletes `~/.pictify/credentials.json` and calls backend to revoke the stored token. Essential for "oops, I committed my creds" recovery.
- Credentials path: `~/.pictify/credentials.json` with mode 0600 on POSIX. On Windows, use `%APPDATA%\pictify\credentials.json` with ACL restricted to the current user (no broad-read). Document the fallback.
- **npm publication:** package name `pictify` (verify availability on npm BEFORE starting Unit 22 — if taken, use `@pictify/cli`). Publisher uses GitHub Actions with an npm token in org secrets. 2FA on the npm account is required.
- **Versioning policy:** CLI uses semver. Breaking changes to the sync protocol go through a minor bump on the backend `/api/v1/templates/sync` and a minor bump on the CLI; when the CLI receives `minClientVersion` in a sync response, warn + exit-with-success-but-nudge, not hard-fail.
- **Monorepo vs separate repo decision (deferred to implementation):** evaluate whether to colocate in `html-to-gif/packages/cli/` (shared types, coordinated releases) vs a standalone repo. Default toward monorepo to simplify schema sync; revisit if build complexity grows.
- **Windows support:** path handling via `path.posix.normalize` for cross-platform `cliPath` hashing; chokidar's `awaitWriteFinish` enabled; test on WSL + native Windows before GA.
- Clean `--help` output with command descriptions.

**Patterns to follow:**
- `figma-plugin/` structure as a reference for "sibling package with its own lifecycle".

**Test scenarios:**
- Happy path: `pictify init` creates all expected files and writes `.gitignore`.
- Happy path: `pictify login --token abc` writes credentials file with mode 0600.
- Edge case: re-running `init` with existing files prompts before overwrite.
- Edge case: `login` with invalid token exits with a useful message.

**Verification:** `npx pictify init` + `npx pictify login` in a fresh directory produces the expected layout.

- [ ] **Unit 23: Sync protocol — `diff.js`, `state.js`, `walker.js`**

**Goal:** The core sync engine. Walk local templates, compute content hashes, compare to `.pictify/state.json`, produce a `{create, update, unchanged, deleted}` changeset. Per-item idempotency.

**Requirements:** R15, D10.

**Dependencies:** None (pure JS).

**Files:**
- Create: `pictify-cli/src/sync/diff.js`, `state.js`, `walker.js`
- Test: `pictify-cli/test/sync.test.js`, `pictify-cli/test/diff.test.js`

**Approach:**
- `walker`: scans `<templateDir>/**/*.html`; for each match, looks for sibling `variables.json` + `README.md`; produces `LocalTemplate[]` with `{ path, html, variables, readme, contentHash }`.
- `state.js`: read/write `.pictify/state.json`; shape `{ version: 1, teamId, templates: { [path]: { uid, remoteVersion, contentHash, lastSyncedAt } } }`. **`state.json` is COMMITTED to git by default** (it is the shared source of truth for "what version was last seen on the server"). Only `.pictify/credentials.json` is gitignored — and credentials live in `~/.pictify/`, not in the project tree, so there is nothing to gitignore inside the project. This resolves the multi-developer concurrency scenario: when Bob pulls Alice's commit, he sees Alice's updated `state.json` with `remoteVersion=6` and his next push sends `lastKnownVersion=6` correctly.
- `diff.js`: given local list + state → `{ create: [...], update: [...], unchanged: [...], deleted: [...] }` where `deleted` is "was in state but not on disk anymore".
- Content hash: sha256(html + canonical JSON of variables); canonical = keys sorted, no extra whitespace.

**Patterns to follow:** none specific; standard functional pattern.

**Test scenarios:**
- Happy path: first run sees all-new templates → all in `create`.
- Happy path: second run unchanged → all in `unchanged`.
- Happy path: edit a template → in `update`.
- Happy path: delete a template file → in `deleted`.
- Edge case: filename contains unicode, spaces.
- Edge case: `variables.json` missing → default `{}`.
- Edge case: malformed `variables.json` → parse error surfaced with file+line.

**Verification:** Tests pass; `pictify push --dry-run` (Unit 25) uses this and reports correct counts.

- [ ] **Unit 24: Backend `POST /api/v1/templates/sync` endpoint — idempotent batch push**

**Goal:** Server endpoint accepting the CLI's batch payload, creating/updating templates atomically per-item, returning per-item results.

**Requirements:** R15, D10, R22 (quota/audit/webhook parity).

**Dependencies:** Unit 12.

**Files:**
- Create: `html-to-gif/routes/template-sync.js`
- Test: `html-to-gif/test/template-sync.test.js`

**Approach:**
- Auth: `verify_api_token` plugin + `team_context`.
- **Team scoping (Security F1 — critical):** `team` for all sync operations is sourced EXCLUSIVELY from `request.team` (resolved by `verify_api_token` from the token's `authToken.team`). Requests MUST NOT be able to specify a `teamId` in the body; if one is present, ignore it. The client's `.pictify/config.json` teamId is advisory/display only.
- **CLI token type:** add `authToken.scope: 'full' | 'cli'` (default 'full'). CLI tokens created via `pictify login` carry `scope='cli'` and are allowed only on `/api/v1/templates/sync`, `/api/v1/templates/*` (read), `/image`, `/pdf`, `/gif`, `/r/*` routes. Billing/team-admin endpoints reject `scope='cli'`. Listing + revocation live on `/dashboard/api-token` with a "CLI tokens" section (Unit 26).
- Rate limit: 100 templates per push; 10 pushes per minute per team. Enforce via `@fastify/rate-limit` keyed by team.
- **Request body limits:**
  - Total `Content-Length` ≤ 10 MB (enforced by Fastify `bodyLimit`).
  - Per-item: `html` ≤ 500 KB, `variables` ≤ 64 KB serialized, `variables` object max depth 3, string values max 10 KB, `readme` ≤ 16 KB.
- Request body schema: `{ items: [{ path, html, variables: object, contentHash, lastKnownVersion?, readme?, jsEnabled?, strictVariables? }] }`.
- Per-item processing:
  - Look up by `metadata.cliPath === path` (new field) within team scope.
  - If found: optimistic-concurrency check against `lastKnownVersion`; mismatch → `{ status: 'conflict', remoteVersion, remoteContentHash }` so the CLI can surface a three-way diff.
  - If not found: create new Template with `engine='html'`, default settings, `metadata.cliPath=path`.
  - Always compile-validate via Unit 7 before write; compile failure → `{ status: 'error', error: { code, line, col, message } }`.
- Response: `{ results: [{ path, status: 'created'|'updated'|'unchanged'|'conflict'|'error', uid, remoteVersion, error? }], minClientVersion?: string }`. The `minClientVersion` field is populated when the server's required CLI version has bumped — CLI treats it as an upgrade nudge.
- Audit log per created/updated item; webhook emit.

**Patterns to follow:**
- `routes/template.js` create/update logic.
- `routes/webhooks.js` batch semantics if any exist.

**Test scenarios:**
- Happy path: 5 new templates → 5 created; all have `engine='html'`, `metadata.cliPath` set.
- Happy path: 5 unchanged (contentHash matches) → 5 `unchanged`, no DB write.
- Error path: one item has compile error → that item `error`; others processed normally.
- Error path: one item with stale `lastKnownVersion` → `conflict` with current remote version; no write.
- Edge case: rate limit hit mid-batch → 429; client retries with backoff.
- Integration: audit log records the CLI origin.

**Verification:** Endpoint integration tests; `pictify push` (Unit 25) exercises this against a dev backend.

- [ ] **Unit 25: `pictify push / pull / render / watch / debug`**

**Goal:** The actual user-facing commands, wired to Unit 23 + Unit 24.

**Requirements:** R15.

**Dependencies:** Units 22, 23, 24.

**Files:**
- Create: `pictify-cli/src/commands/push.js`, `pull.js`, `render.js`, `watch.js`, `debug.js`
- Test: extend `pictify-cli/test/commands.test.js`

**Approach:**
- `push [--dry-run] [--only <glob>]`: walk → diff → display plan → confirm (or auto-yes with `--yes`) → batch POST → update state.json. Progress bar with ora. On 429 from backend, exponential backoff (start 2s, cap 30s, max 5 retries).
- `pull [--force] [--rebase]`: GET `/api/v1/templates?engine=html` → write to local; reconcile state.json. `--force` overwrites local changes. `--rebase` prompts per-conflict with a three-way diff (local vs remote vs last-synced) and asks the user to pick.
- `render <name> [--vars <json>|--vars-file <path>] [--format png|pdf|gif] [--out <path>]`: resolve template by local path → POST `/image` (or `/pdf`) → write binary to `--out` (default: `name.timestamp.png`).
- `watch`: chokidar on `templates/**/*` → debounce 500ms → auto-push or auto-render.
- `debug render <template>`: verbose render with full stage-timing output.
- **Conflict resolution UX (Design F21):** when `push` receives `status: 'conflict'` per item, print a clear diff using `diff` npm package (unified-diff format by default). Prompt: `[k]eep local / [t]ake remote / [m]erge manually (open $EDITOR) / [s]kip`. Document resolution commands in the modal + `pictify help resolve`.

**Test scenarios:**
- Happy path: `push` with 3 local templates uploads all.
- Happy path: `pull` writes remote templates to disk.
- Error path: `push` with 1 conflict prompts user to resolve.
- Edge case: `watch` debounces rapid saves.

**Verification:** End-to-end manual test: `init` → edit template → `push` → render appears on dashboard.

- [ ] **Unit 26: Frontend — CLI access UI (tab on API Token page + integration card)**

**Goal:** Users can find, install, and authenticate the CLI from the dashboard.

**Requirements:** R15 (UX).

**Dependencies:** Unit 22 (CLI exists).

**Files:**
- Modify: `front-end-html-to-gif/src/routes/dashboard/api-token/+page.svelte` (add "CLI access" tab)
- Modify: `front-end-html-to-gif/src/routes/dashboard/integrations/+page.svelte` (add Pictify CLI card)
- Create: `front-end-html-to-gif/src/lib/components/editor/html/InstallCliModal.svelte`

**Approach:**
- CLI tab: install snippet (`npm i -g pictify` / `npx pictify …`), "Copy my token to clipboard" action, link to docs, supported commands cheat sheet.
- Integration card: neobrutalist accent card with "Install the Pictify CLI" and a single prominent CTA.
- `InstallCliModal`: reusable modal that any HTML editor page can launch.

**Patterns to follow:** `FigmaImportModal.svelte` + existing API token page.

**Test scenarios:** Manual UX dogfood.

**Verification:** Dogfood the "get from docs → install → login → push" flow end-to-end in under 5 minutes.

### Phase 5 — Observability, Admin, Infra, Retire Legacy

- [ ] **Unit 27: Structured logging + Prometheus metrics for all HTML render stages**

**Goal:** Wire the metrics + log schema from the review into the code.

**Requirements:** R17, D19.

**Dependencies:** Units 10, 11, 14.

**Files:**
- Modify: `html-to-gif/service/html-renderer.js` (stage logging)
- Modify: `html-to-gif/service/browser-semaphore.js` (wait metric)
- Modify: `html-to-gif/service/ssrf-guard.js` (block metric + log)
- Modify: `html-to-gif/service/render-result-cache.js` (hit/miss counters)
- Modify: `html-to-gif/config/logger.js` (if needed for render_id context)
- Create: `html-to-gif/config/prometheus.js` (register new metrics + expose `/metrics` endpoint — **prior Prometheus integration was removed per comment in `service/post-generation-queue.js:154`; this unit reintroduces it scoped to HTML rendering. Add `prom-client` to dependencies.**)
- Modify: `html-to-gif/server.js` (register `/metrics` scrape endpoint behind internal-only middleware)

**Approach:**
- Metrics as listed in Section 8.2 of the review.
- Stage-keyed log lines include `render_id`, `template_id`, `team_id`, `stage`, `ms`.
- Error events include a `reason` code (machine-readable), not only a message.

**Patterns to follow:** Existing Prometheus usage in `server.js`.

**Test scenarios:**
- Unit: counter increments on each render.
- Unit: histogram records stage timings.
- Unit: SSRF block emits security log with URL + reason.
- Integration: `/metrics` endpoint returns the new series.

**Verification:** `curl /metrics` shows new series; dashboard panels light up in staging.

- [ ] **Unit 28: Grafana dashboard + 7 alerts**

**Goal:** A single "HTML Templates" dashboard and alert set that ops can open on day 1.

**Requirements:** R17.

**Dependencies:** Unit 27.

**Files:**
- Create: `html-to-gif/infra/dashboards/html-templates.json` (Grafana JSON export)
- Create: `html-to-gif/infra/alerts/html-templates.yaml` (Prometheus alert rules)

**Approach:** Panels and alerts as enumerated in the review. Dashboard linked from CLAUDE.md / ops runbook.

**Test scenarios:** None (config).

**Verification:** Dashboard imports cleanly into staging Grafana; alert rules pass `promtool check rules`.

- [ ] **Unit 29: `admin/inspect-render` — replay past renders**

**Goal:** Admin-only page showing a timeline of a past render: all stages, blocked resources, browser errors, timings, final output.

**Requirements:** R17, D18.

**Dependencies:** Unit 10, 27.

**Files:**
- Create: `html-to-gif/service/inspect-render-store.js` (Redis, stores the last N render timelines by render_id, TTL 7 days)
- Create: `html-to-gif/routes/admin/inspect-render.js` (GET /admin/renders/:renderId)
- Modify: `html-to-gif/service/html-renderer.js` (write to store)
- Create: `front-end-html-to-gif/src/routes/admin/renders/[renderId]/+page.svelte`
- Test: `html-to-gif/test/inspect-render.test.js`

**Approach:**
- Timeline record: `{ renderId, templateId, teamId, varsHash (not values), stages: [{name, ms, status, meta}], blockedResources: [], pageErrors: [], output: { url (time-limited signed URL, 30 min), format, dims, bytes }, error? }`.
- **Privacy contract (resolves Security F4 + Design F22):**
  - The rendered image at `output.url` may still contain PII rendered from variables. We do NOT "replay" a past render with original inputs (the inputs aren't stored). The admin tool is a **timeline viewer** — stages, timings, blocked resources, errors — PLUS a link to the rendered artifact stored at render time. Rename Unit 29 from "replay" to "inspect".
  - The artifact URL is a short-lived signed URL, NOT a permanent CDN URL. TTL = 30 minutes from first access.
  - Every admin access to `/admin/renders/:renderId` is audit-logged with `admin.user_id`, `admin.ip`, `target.teamId`, `target.templateId`, `target.renderId`, `accessed_at`. Audit is retained 1 year.
  - Templates flagged `containsPII` on any variable OR with a `templateSchema.inspectOptOut: true` (team-level setting) are excluded from inspect-render storage entirely — the timeline is kept but the artifact URL is omitted.
- Retention: 7 days for the timeline record, 7 days or until the admin URL TTL expires (whichever is shorter) for the artifact signed URL.
- Admin auth via existing `routes/admin/dashboard.js` pattern (shared secret + admin user gating). Add the audit-log step.

**Test scenarios:**
- Happy: render → GET /admin/renders/:id returns timeline.
- Edge: expired render → 404 with retention hint.

**Verification:** Triggered a render, inspected it via admin page, saw the timeline.

- [ ] **Unit 30: Retire `grapeJSData` legacy shim + `Template.populateTemplate`**

**Goal:** Remove dead/unsafe code now that all callers go through the dispatcher.

**Requirements:** R18, D15.

**Dependencies:** Unit 1 (model validator), Unit 2 (engine backfill), Unit 4 (all callers migrated incl. thumbnail worker + binding-renderer + batch-processor + universal connector actions), Unit 27 (metrics ship first so regressions are visible), Unit 31 (feature-flag rollout complete so no in-flight CLI pulls during retirement). Additionally a non-code gate: `scripts/cleanup-grapejs.js` executed in prod BEFORE the code-deletion PR is merged.

**Files:**
- Modify: `html-to-gif/models/Template.js` — remove `grapeJSData` field, `resolveFabricJSData`, `normalizeEditorPayload`, `Template.populateTemplate` method.
- Modify: `html-to-gif/routes/template.js` — remove `resolveFabricJSData` helper + calls.
- Modify: `html-to-gif/service/*.js` — remove any residual `grapeJSData` references.
- Create: `html-to-gif/scripts/cleanup-grapejs.js` (one-time migration: for any record with `grapeJSData` but not `fabricJSData`, move it; then unset `grapeJSData`).
- Test: remove tests referencing the old shim; add a test that confirms creating a template without `fabricJSData` provided but with `grapeJSData` is rejected (post-retirement).

**Approach:**
- Sequence the migration: run `cleanup-grapejs.js` in staging + prod before merging the code deletion.
- Final deletion PR is code-only; migration script is a separate deploy step.

**Test scenarios:** Existing Template tests continue to pass; no `grapeJSData` references remain.

**Verification:** `rg grapeJSData` returns zero hits in `html-to-gif`.

- [ ] **Unit 31: Feature-flag rollout config + CLAUDE.md/AGENTS.md updates**

**Goal:** Ship PostHog flags + documentation so ops + the team know how to enable / kill / operate the feature.

**Requirements:** R16, D14.

**Dependencies:** All prior units.

**Files:**
- Modify: `html-to-gif/config/posthog.js` (register 3 flags: `html-templates-enabled`, `html-templates-cli-enabled`, `html-templates-js-enabled`)
- Modify: `html-to-gif/CLAUDE.md` (new HTML engine section)
- Create: `html-to-gif/docs/HTML_BACKEND.md` (mirror of `FABRIC_BACKEND.md`)
- Modify: `front-end-html-to-gif/src/lib/utils/feature-flags.js` (wire flag reads into the dashboard)
- Modify: `front-end-html-to-gif` AGENTS.md / CLAUDE.md additions for the new editor tree.

**Approach:**
- Flags default off in prod; enabled for `team=pictify` via PostHog cohort.
- Docs include: architecture overview, render pipeline, dispatcher contract, security model, CLI usage, rollback playbook.

**Test scenarios:** None (docs/config).

**Verification:** Flag toggles visible in PostHog UI; docs link out from top-level CLAUDE.md.

## System-Wide Impact

- **Interaction graph:**
  - `routes/image.js`, `routes/gif.js`, `routes/pdf.js`, `routes/template-render.js`, `service/url-param-renderer.js`, `service/experiment-renderer.js` — all now call the dispatcher (no direct fabric coupling).
  - Thumbnail worker (BullMQ) learns about engine to know which renderer to spawn.
  - Webhook events include `engine` in payload.
  - Audit log enriched with `engine`.
  - Quota / rate-limit plugins unchanged but metered renders now include engine='html'.
- **Error propagation:** All new error classes extend `GenerationError` (from `lib/errors.js`) with a `retriable` flag. 422 for user-fault; 503 for transient pool/semaphore; 500 for unexpected. Dispatcher unwraps consistently.
- **State lifecycle risks:**
  - Browser pool: partial page release on errors — `finally` block + `page.on('error')` handler ensures cleanup.
  - Semaphore leak: 60s TTL reaps stuck locks; crash before release is recoverable within TTL.
  - Compile cache: keyed by updatedAt; stale entries auto-miss after edits.
  - Render-result cache: same.
- **API surface parity:**
  - `/r/:uid.:format` (URL-param render) — supported for engine=html identically.
  - Layouts (`template.layouts`) — deferred for engine=html in this plan (explicit non-goal; document per-layout support as a future item, file a follow-up ticket).
  - Multi-page PDFs (`template.pages[]`) — fabric only; document HTML multi-page via `@page` CSS as alternative.
- **Integration coverage:**
  - Experiment renderer with engine='html' variants → end-to-end test.
  - Webhook → engine appears in `render.completed` payload.
  - API token → CLI Bearer auth → sync endpoint.
- **Unchanged invariants:**
  - Fabric template behavior is byte-identical after the refactor (characterization tests in Unit 4).
  - Existing API contracts (`/image`, `/gif`, `/pdf`, `/r`) unchanged; engine is an internal detail.
  - Team scoping and quota rules unchanged.
  - Template uid generation unchanged.

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| Browser pool saturation under realistic HTML load | Per-team semaphore (Unit 5) + pool size bump + saturation metric (Unit 27) + alert (Unit 28) |
| SSRF (including DNS rebinding) | Dedicated ssrf-guard with per-request DNS re-check (Unit 8); tests include rebind simulation |
| Stored-template prototype pollution via Handlebars | Handlebars configured `allowProtoMethodsByDefault: false` + `allowProtoPropertiesByDefault: false` + safelist (Unit 7) |
| Font-load flakiness in prod | Font proxy (Unit 9) + `document.fonts.ready` timeout with fallback render (Unit 10) |
| Scope creep breaks 6-8 week budget | Feature flags let us ship phases independently; Phase 1 delivers the dispatcher value alone |
| Legacy `populateTemplate` retirement breaks an undocumented API contract | Characterization tests in Unit 4; Unit 30 sequenced after migration runs |
| CLI mid-batch network drop corrupts state | Content-hash diff + per-item idempotency (Unit 23 + Unit 24); re-run safely resumes |
| Two users editing the same template concurrently | Optimistic `lastKnownVersion` concurrency in sync + PATCH template (Unit 24) |
| Puppeteer `while(1)` DoS | JS-off by default (Unit 10) + global JS kill-switch flag (Unit 31) |
| Render-result cache hides template bugs by serving stale | Cache keyed on `updatedAt` — edits bust automatically (Unit 14) |

## Documentation / Operational Notes

- New docs: `html-to-gif/docs/HTML_BACKEND.md`, CLAUDE.md additions in both repos, `pictify-cli/README.md`, public docs at `pictify.io/docs/html-templates`.
- Runbooks: browser pool saturation, SSRF spike from a single team, compile error spike (template pushed broken by a team), CLI version compatibility.
- Rollout: feature-flag phased as in D14. Weekly review of HTML render error rate + semaphore saturation during rollout.
- Deprecations: `Template.populateTemplate`, `grapeJSData`, `resolveFabricJSData` — sunset announced in the feature launch post; Unit 30 deletes them from code.
- Customer communication: launch blog + changelog; CLI announcement post with git-first workflow demo.

## Abort Criteria (Must-Resolve Before Closing Phase 2)

This plan is a platform bet. It has a real risk of dead-code burden if adoption disappoints. Explicit kill criteria:

- **Week 4 checkpoint:** if internal dogfood shows <3 internal templates authored in the HTML editor, pause Phase 3 rollout, run 5 user interviews before continuing.
- **Week 8 checkpoint (post-GA):** if <10 teams have created an engine='html' template in 30 days OR no team has rendered engine='html' template >50 times, **revisit rollout** — consider freezing the CLI (Phase 4), the font proxy (Unit 9), the render cache (Unit 14), and the inspect-render tool (Unit 29).
- **Week 12 checkpoint:** if <2% of active teams use engine='html' after 90 days, formally sunset the feature with a deprecation notice. Sunsetting requires: deprecating the `/api/v1/templates/sync` endpoint, deprecating the `pictify` npm package (final release with deprecation message), removing the engine picker from the dashboard, leaving model + dispatcher in place (since they're used by `engine='fabric'` production traffic too).
- **Security kill-switch:** if an SSRF or prototype-pollution incident is detected post-ship, disable `html-templates-enabled` flag globally within 15 minutes; post-mortem before re-enabling.

## Invisible Work (Must Be Scheduled Alongside Units)

Work the units do not own but must happen for the feature to succeed. Surfaced from adversarial review F13.

- **PostHog events:** `html_template_created`, `html_template_saved`, `html_template_rendered`, `cli_login_invoked`, `cli_push_invoked`, `cli_pull_invoked` — needed to measure the rollout gates. Owner: TBD. Wire during Unit 31.
- **Internal comms during rollout:** CS and on-call enablement — what the new 422 errors look like, what the 7 alerts mean, what the inspect-render tool does. Owner: TBD. Sequence: before flag → 10%.
- **Customer support playbook:** decision tree for "my render is wrong" / "my variables didn't work" / "my CLI push failed". Owner: CS lead.
- **Public docs:** `pictify.io/docs/html-templates` (templating syntax, helper reference, Handlebars gotchas, CLI cheat sheet, raw-HTML gate explanation, strict mode explanation). Owner: docs lead. Required before 10% rollout.
- **Billing/pricing audit:** HTML renders cost 5-8× more CPU/memory than fabric renders. Current pricing charges identically. Before 100% rollout, decide: (a) absorb the cost, (b) charge a multiplier on HTML renders, (c) restrict engine='html' to Pro/Business plans.
- **Security review sign-off:** D5 (no-sanitize + sandbox) + D6 (DNS re-check) + D8 (JS opt-in) are substantive security postures that need a formal sign-off before shipping. Owner: TBD.
- **Abuse-monitor integration:** HTML templates are a new abuse vector. Route new templates through `service/abuse-monitor.js` at create time (detect crypto-miner patterns, known phishing layouts, CSAM signals). Owner: TBD.
- **Launch comms:** in-app announcement, email blast, changelog entry, blog post. Owner: marketing.
- **Rollback playbook:** step-by-step rollback doc for each phase. Owner: on-call.
- **GitHub Action follow-up:** deferred from this plan but should ship within 4 weeks of CLI GA for the "git-first workflow" narrative to land. Separate plan.

## Post-Review Strategic Decisions (Require User Call)

Document review surfaced material strategic concerns that the document-author should consciously decide on. These are NOT auto-fixable — they are platform bets dressed as feature decisions.

1. **Premise evidence (product-lens F1, adversarial F10):** The plan assumes "technical users want HTML authoring" without citing PostHog usage on the existing raw-HTML `/image` path, Intercom/email interviews, or churn data to HCTI / APITemplate. A 1-week evidence-gathering loop may save 6-14 weeks of work. Options: (a) spend the week before kick-off, (b) ship to dogfood-only and gather evidence post-Phase 2, (c) accept the premise and proceed.
2. **Identity bet (product-lens F2):** The plan implicitly reverses the "visual content OS for growth teams" positioning from the 2026-03-14 CEO review toward "developer SDK platform like Vercel CLI." This is a real bet that deserves an explicit decision, not an implicit one. Options: (a) keep both identities — ship HTML engine + CLI as "developer entry" alongside the growth-team visual editor, (b) lean all-in on developer identity (marketing + pricing shift), (c) limit engine='html' to the editor surface only (drop CLI, Phase 4) to preserve growth-team identity.
3. **CLI scope (product-lens F3, scope-guardian F6, adversarial F7):** Phase 4 (Units 22–26) adds a full npm package with its own release cadence, version-skew protocol, Windows support, and maintenance tail. Options: (a) ship CLI in this plan as designed, (b) ship web editor only; CLI becomes a separate plan gated on engine='html' adoption ≥20 teams, (c) ship a minimal "token-paste-and-curl" CLI (just `render`) without sync/push/pull to test developer appetite.
4. **Dispatcher retrofit (scope-guardian F1, adversarial F4):** The dispatcher facade touches 15+ files to retrofit an abstraction justified mainly by hypothetical future engines (MJML, JSX). Options: (a) ship the dispatcher as designed (prepare for MJML), (b) skip the dispatcher; add 4-line engine branches at each render call site; extract the dispatcher when engine #3 actually arrives (saves ~1 week).
5. **Scope expansion items (scope-guardian F2, F3, F5, F7):** Font proxy (Unit 9), render cache (Unit 14), Grafana dashboard (Unit 28), inspect-render (Unit 29), multi-language API snippets (Unit 20) all lack measured evidence of need. Options: (a) ship all in Phase 2 as designed, (b) ship only after Phase 1 telemetry justifies each. Minimum-viable alternative saves ~2-3 weeks.
6. **grapeJSData retirement bundling (scope-guardian F4, adversarial F11):** Retiring `grapeJSData` + `populateTemplate` inside the feature PR is risky (migration failure blocks the feature). Options: (a) ship retirement as Unit 30, (b) split into a separate PR shipped AFTER HTML engine stabilizes at 10% rollout.
7. **Strict variables default (adversarial F9):** Default `strictVariables: true` will surprise users with the common `{{#if optional}}{{optional}}{{/if}}` pattern (Handlebars strict mode throws on undefined subject expressions). Options: (a) keep strict default + clearly document the required declaration pattern, (b) default strict to false; surface undefined-variable warnings at save time; strict becomes opt-in, (c) custom strict semantics that throws on helper args but not conditional subjects (already adopted in Unit 7 Approach — document as the canonical answer).
8. **Engine immutability UX cost (adversarial F2):** Users with dashboards/automations/webhooks referencing a template uid cannot swap engine without breaking consumers. Options: (a) keep immutability (users fork + update consumers), (b) add `parentTemplate` + `replacedBy` references so a fork can redirect callers, (c) allow engine mutation with destructive "all data lost" warning.
9. **6-8 week budget realism (product-lens F4, adversarial F4):** Realistic range is 10-14 weeks. Options: (a) commit to the longer window upfront, (b) ship minimum-viable scope (reduce to ~18 units) in 4-5 weeks, (c) phase ship weekly behind flags starting week 3 to get learning signal early.

Each of these is surfaced here intentionally rather than auto-fixed because the correct answer depends on business context the reviewer agents do not have. Resolve before entering Phase 2.

## Sources & References

- **Origin:** CEO review conversation from 2026-04-18 (this session).
- **User memory:**
  - `.../memory/MEMORY.md` — architecture facts, recent commits, conventions, Figma plugin pattern.
  - `project_hetzner_infra.md` — infra guidance (not directly used but informs rollout assumptions).
- **Existing plans:** `docs/plans/2026-03-11-feat-figma-import-to-fabricjs-plan.md` — the closest structural analogue (sibling dev-tool package + backend endpoint + frontend modal).
- **Backend repo:** `/Users/suyashthakur/html-to-gif` (branch `feat/personalized-onboarding` — note: memory says `feat/teams-with-seats`, actual is different).
- **Frontend repo:** `/Users/suyashthakur/front-end-html-to-gif` (branch `master` — note: memory says `feat/state-of-art-copilot`, actual is master).
- **External:**
  - Handlebars.js docs — compile API, AST, security config.
  - Puppeteer docs — page.setContent, request interception, screenshot, pdf.
  - CodeMirror 6 — autocomplete, linter, decorations.
  - `ipaddr.js` — RFC-1918 / link-local classification.
