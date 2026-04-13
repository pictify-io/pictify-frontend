---
title: "feat: Add certificate generator free tool page"
type: feat
status: completed
date: 2026-04-13
deepened: 2026-04-13
---

# feat: Add certificate generator free tool page

## Overview

Add a dedicated interactive certificate generator at `/tools/certificate-generator` targeting the "certificate generator" keyword cluster (2,900 monthly searches, difficulty 23). This is a PLG/SEO tool that uses the existing FabricJS rendering pipeline — zero backend changes required. The tool offers 4-5 certificate templates with an interactive canvas editor and variable input form, generating downloadable PNG images.

## Problem Frame

Orshot.com's `/tools/certificate-generator` is their #1 non-branded traffic page (199 ETV, 40 ranked keywords). Pictify currently has a generic pSEO page at `/tools/certificate` with basic MiniEditor integration, but it lacks template variety, a variable input form, and dedicated SEO targeting. A purpose-built tool page will capture this keyword cluster while showcasing Pictify's FabricJS canvas advantage over Orshot's simpler approach.

## Requirements Trace

- R1. Dedicated route at `/tools/certificate-generator` with keyword-optimized SEO (title, meta, schema)
- R2. 4-5 visually distinct certificate templates as FabricJS JSON, each with variable bindings for recipientName, organizationName, date, achievementText
- R3. Interactive canvas preview via MiniEditor with form-driven variable input that syncs to the canvas live
- R4. Image generation via existing `POST /image/public/canvas` endpoint — watermarked for guests
- R5. Post-generation flow using existing NextSteps, GenerationLimitBanner, and "Open in Full Editor" CTA
- R6. Mobile-responsive layout (form + canvas side-by-side on desktop, stacked on mobile)
- R7. Tools index page updated to include Certificate Generator
- R8. pSEO certificate config updated with link to dedicated tool

## Scope Boundaries

- No backend changes — uses existing `/image/public/canvas` endpoint
- No PDF download (Phase 2)
- No CSV bulk generation (Phase 2)
- No logo/signature upload (Phase 2)
- No QR verification codes (Phase 2)
- No new API functions in `src/api/image.js` — call `backend.post()` directly (matches `[usecase]` page pattern)

## Context & Research

### Relevant Code and Patterns

- **Primary pattern:** `src/routes/tools/[usecase]/+page.svelte` — MiniEditor integration, `backend.post('/image/public/canvas', ...)`, template loading via `getTemplateForUseCase()`, NextSteps binding, generation state management
- **SEO pattern:** `src/routes/tools/online-invoice-generator/+page.svelte` — WebApplication + FAQPage schema, meta tags, OG tags, canonical URL, breadcrumbs
- **MiniEditor API:** `src/lib/components/tools/MiniEditor.svelte` — props: `fabricJSData`, `width`, `height`; exported: `getEditedFabricData()`; makes text objects click-to-edit, locks non-text objects
- **Template definition pattern:** `src/lib/pseo/useCaseTemplates.js:getCertificateTemplate()` (line 217) — FabricJS v6 objects with `isVariable: true` and `variableBindings` array
- **Component interfaces:**
  - `NextSteps`: props `heading`, `description`, `curlSnippet`, `templateDraft`, `generatedUrl`, `generatedWidth`, `generatedHeight`, `generatedFormat`, `toolName`
  - `GenerationLimitBanner`: prop `toolName`
  - `RelatedTools`: prop `tools` (array of use-case IDs)
- **Neo-brutalist style:** `border-[3px] border-gray-900`, `shadow-[4px_4px_0_0_#...]`, accent `#ffc480`, font `Manrope`

### Institutional Learnings

- The `[usecase]` page generation flow is battle-tested — uses `backend.post('/image/public/canvas')` directly, not a named API function
- MiniEditor disposes canvases properly on template switch via generation counter pattern (`loadGeneration`)
- Variable bindings use `variableBindings[0].variableName` to match objects to variable names

## Key Technical Decisions

- **Dedicated route over pSEO upgrade:** A custom page at `/tools/certificate-generator` gives full SEO control (exact keyword in title/H1/URL) and allows certificate-specific UX (variable form, template gallery). The pSEO page at `/tools/certificate` remains as a complementary landing page.
- **Extend MiniEditor with `setVariableValue()`:** Adds a method to programmatically update text objects from the variable form. This is backwards-compatible — existing pages don't call it. Alternative was manipulating `fabricJSData` prop and re-triggering load, but that recreates the entire canvas on each keystroke.
- **Templates as JS module, not backend HTML:** Certificate templates are FabricJS JSON objects in a JS file, following the `useCaseTemplates.js` pattern. No need for a backend template-serving route (unlike invoice which uses HTML files on disk).
- **Debounce form-to-canvas sync at 150ms:** Prevents excessive `renderAll()` calls during fast typing.

## Open Questions

### Resolved During Planning

- **Should we create a `createPublicCanvasImage()` function in `src/api/image.js`?** No — the `[usecase]` page calls `backend.post()` directly. Follow the same pattern for consistency.
- **Where do template thumbnails come from?** Each template definition includes a static `thumbnailBgColor` and `thumbnailLabel` for the gallery cards. No pre-rendered images needed — cards show a color swatch + template name.

### Deferred to Implementation

- **Exact FabricJS coordinates and styling for templates 2-5:** Will be determined during implementation by creating visually distinct designs. The approach (objects array with variable bindings) is fixed.
- **Exact FAQ content for schema:** Will be written during implementation to target certificate-related long-tail keywords.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
User Flow:
  
  1. Template Gallery (horizontal scroll of 4-5 cards)
     │
     ├── Select template → MiniEditor loads new fabricJSData
     │                      Form resets to template defaults
     │
  2. Variable Form (left) + MiniEditor Canvas (right)
     │
     ├── Type in form → debounced setVariableValue() → canvas re-renders
     ├── Click text on canvas → edit inline (existing MiniEditor behavior)
     │
  3. Generate Button
     │
     ├── getEditedFabricData() → POST /image/public/canvas
     ├── watermark: !isUserLoggedIn
     │
  4. Result Section
     │
     ├── Image preview + Download button
     ├── NextSteps (API snippet, save as template, batch info)
     ├── GenerationLimitBanner (for guests)
     └── "Open in Full Editor" CTA

MiniEditor Extension:
  
  setVariableValue(name, value):
    find object where variableBindings[0].variableName === name
    set object.text = value
    fabricCanvas.renderAll()
  
  getVariables():
    filter objects with variableBindings
    return [{name, value, description}]
```

## Implementation Units

- [ ] **Unit 1: Extend MiniEditor with variable control methods**

  **Goal:** Add `setVariableValue()` and `getVariables()` exported functions to MiniEditor, plus error state for failed canvas loads.

  **Requirements:** R3

  **Dependencies:** None

  **Files:**
  - Modify: `src/lib/components/tools/MiniEditor.svelte`

  **Approach:**
  - Add `export function setVariableValue(variableName, value)` — iterates `fabricCanvas.getObjects()`, finds object where `variableBindings` array contains matching `variableName`, sets `.text` property, calls `fabricCanvas.renderAll()`
  - Add `export function getVariables()` — filters objects with `variableBindings`, returns array of `{ name: binding.variableName, value: obj.text, description: binding.description }`
  - Add `let loadError = false` state variable. Set to `true` in the catch block of `loadCanvas()`. Reset to `false` at the start of each `loadCanvas()` call.
  - Add error UI: when `loadError` is true, show a message instead of the canvas
  - Guard clauses: early return if `fabricCanvas` is null in both new methods
  - Must not change any existing behavior — all existing props, exports, and event handling remain identical

  **Patterns to follow:**
  - Existing `getEditedFabricData()` export pattern in the same file
  - Variable binding structure from `useCaseTemplates.js`: `obj.variableBindings[0].variableName`

  **Test scenarios:**
  - Happy path: `setVariableValue('recipientName', 'John Doe')` updates the matching text object's `.text` property to 'John Doe'
  - Happy path: `getVariables()` returns array with correct name, value, description for each variable object
  - Edge case: `setVariableValue()` called before canvas initialized — no-ops without error
  - Edge case: `setVariableValue()` called with non-existent variable name — no-ops without error
  - Edge case: `getVariables()` called on canvas with no variable objects — returns empty array
  - Error path: `loadCanvas()` with malformed fabricJSData — sets `loadError = true`, shows error UI

  **Verification:**
  - Existing `[usecase]` pages still work identically (no regression)
  - New methods are callable from a parent component via `bind:this` ref

- [ ] **Unit 2: Create certificate template definitions**

  **Goal:** Define 4-5 visually distinct certificate FabricJS templates with consistent variable bindings.

  **Requirements:** R2

  **Dependencies:** None (can run in parallel with Unit 1)

  **Files:**
  - Create: `src/lib/components/tools/CertificateTemplates.js`

  **Approach:**
  - Export an array `certificateTemplates` and individual factory functions
  - Template #1 (Elegant): Port `getCertificateTemplate()` from `useCaseTemplates.js` — cream background, gold borders, Georgia font
  - Template #2 (Modern): Dark background (#1a1a2e), clean sans-serif (Inter), accent gradient bar, minimal borders
  - Template #3 (Corporate): White background, navy (#1e3a5f) header bar, professional layout, subtle gray borders
  - Template #4 (Minimalist): Pure white, thin gray borders, large centered typography, lots of whitespace
  - Template #5 (Creative): Colorful accent (#ff6b6b or similar), diagonal decorative elements, playful but professional
  - Each template: `{ id, name, description, thumbnailColor, width: 1920, height: 1080, fabricJSData }` 
  - Every template must have these variable bindings: `recipientName`, `organizationName`, `date`, `achievementText`
  - All templates use 1920x1080 landscape orientation
  - Use `generateId()` helper (import from useCaseTemplates.js or inline UUID function)

  **Patterns to follow:**
  - `src/lib/pseo/useCaseTemplates.js:getCertificateTemplate()` — exact object structure, variable binding format, FabricJS v6 schema

  **Test scenarios:**
  - Happy path: Each template returns a valid object with `id`, `name`, `width`, `height`, and `fabricJSData` with non-empty `objects` array
  - Happy path: Each template's `fabricJSData.objects` contains at least 4 variable-bound textbox objects (recipientName, organizationName, date, achievementText)
  - Edge case: All template IDs are unique
  - Edge case: All templates use width=1920 and height=1080

  **Verification:**
  - Templates can be loaded by MiniEditor without error
  - Variable bindings match the expected names used by the form

- [ ] **Unit 3: Build the certificate generator page**

  **Goal:** Create the main tool page with template gallery, variable form, MiniEditor canvas, generation flow, and full SEO.

  **Requirements:** R1, R3, R4, R5, R6

  **Dependencies:** Unit 1 (MiniEditor extensions), Unit 2 (templates)

  **Files:**
  - Create: `src/routes/tools/certificate-generator/+page.svelte`

  **Approach:**

  *Page structure (top to bottom):*
  1. `<svelte:head>` — SEO title, meta description, canonical, OG tags, Twitter cards, WebApplication schema, FAQPage schema
  2. Nav component
  3. Breadcrumb: Home / Tools / Certificate Generator
  4. Hero section: badge ("Free Tool"), H1 "CERTIFICATE GENERATOR", description
  5. GenerationLimitBanner
  6. Template gallery: horizontal row of template cards with thumbnail color + name, click to select
  7. Main editor section (responsive grid):
     - Left column (desktop) / top (mobile): Variable form with labeled inputs
     - Right column (desktop) / bottom (mobile): MiniEditor canvas preview
  8. Generate button (prominent, centered below editor)
  9. Result section (shown after generation): image preview, download button
  10. NextSteps component
  11. "Open in Full Editor" CTA section
  12. FAQ section (5-6 questions for SEO, also in FAQPage schema)
  13. RelatedTools section
  14. Footer component

  *State management:*
  - `selectedTemplate` — current template object (defaults to first)
  - `formValues` — `{ recipientName, organizationName, date, achievementText }` with sensible defaults
  - `isGenerating`, `generatedImageUrl`, `generationError` — generation state
  - `miniEditorRef` — bound reference to MiniEditor
  - `isUserLoggedIn` — from user store subscription

  *Form-to-canvas sync:*
  - Reactive statement watches `formValues` changes
  - Debounced at 150ms before calling `miniEditorRef.setVariableValue()` for each changed field
  - On template switch: reset `formValues` to new template's defaults, MiniEditor reloads via reactive `fabricJSData` prop change

  *Generation flow:*
  - Follows exact `[usecase]` page pattern: `generationLimits.increment()`, `backend.post('/image/public/canvas', ...)`, toast notifications, error handling for 429/500
  - `templateDraft` for NextSteps: `{ version: 1, name: 'Certificate template', type: 'certificate', width: 1920, height: 1080, fabricJSData: editedData, source: 'certificate-generator' }`
  - API curl snippet built from current template data

  *SEO:*
  - Title: "Free Certificate Generator Online | Create Custom Certificates | Pictify.io"
  - H1: "CERTIFICATE GENERATOR" (neo-brutalist styled)
  - WebApplication schema with `applicationCategory: ['DesignApplication', 'Utility']`
  - FAQPage schema with 5-6 certificate-specific questions
  - Canonical: `https://pictify.io/tools/certificate-generator`

  *Analytics:*
  - `onMount`: `analytics.trackToolOpened({ tool_name: 'certificate_generator' })`
  - On generate: `analytics.trackImageGenerated({ tool_name: 'certificate_generator', format: 'png', with_watermark: !isUserLoggedIn })`

  **Patterns to follow:**
  - `src/routes/tools/[usecase]/+page.svelte` — generation flow, MiniEditor binding, NextSteps integration, template loading
  - `src/routes/tools/online-invoice-generator/+page.svelte` — page structure, SEO markup, breadcrumbs, hero section, neo-brutalist styling

  **Test scenarios:**
  - Happy path: Page loads with default template rendered in MiniEditor canvas
  - Happy path: Selecting a different template updates the canvas preview
  - Happy path: Typing in variable form updates text on canvas after debounce
  - Happy path: Generate button calls `/image/public/canvas` and displays result image
  - Happy path: NextSteps appears after successful generation with correct props
  - Edge case: Double-click generate — button disabled while `isGenerating` is true
  - Edge case: Generate before canvas ready — uses fallback template data via `getEditedFabricData() || selectedTemplate.fabricJSData`
  - Edge case: Mobile viewport — form and canvas stack vertically
  - Error path: 429 rate limit — shows "Too many requests" toast
  - Error path: 500 server error — shows "Failed to generate" toast
  - Error path: Canvas load failure — MiniEditor shows error state (from Unit 1)
  - Integration: Template switch resets form values and reloads canvas with new fabricJSData

  **Verification:**
  - Page accessible at `/tools/certificate-generator`
  - All 5 templates selectable and renderable
  - Form updates reflect on canvas in real-time
  - Generated image URL loads a valid PNG
  - SEO: view source shows correct title, meta, schema markup
  - Mobile: layout stacks correctly on narrow viewports

- [ ] **Unit 4: Update tools index and pSEO config**

  **Goal:** Add Certificate Generator to the tools index page and link the pSEO certificate config to the dedicated tool page.

  **Requirements:** R7, R8

  **Dependencies:** Unit 3

  **Files:**
  - Modify: `src/routes/tools/+page.svelte`
  - Modify: `src/lib/pseo/use-cases.js`

  **Approach:**
  - Tools index: Add a new card in the featured tools grid linking to `/tools/certificate-generator` with appropriate icon/description. Place it logically near Invoice Generator (both are document-type tools).
  - pSEO config: Add `toolUrl: '/tools/certificate-generator'` to the `certificate` use-case detail object at line ~534. This allows the pSEO page to link users to the dedicated interactive tool.

  **Patterns to follow:**
  - Existing tool cards in `src/routes/tools/+page.svelte` for card structure and linking
  - Other use-case configs that reference dedicated tool pages (if any exist)

  **Test scenarios:**
  - Happy path: Tools index page shows Certificate Generator card with correct link
  - Happy path: Clicking the card navigates to `/tools/certificate-generator`
  - Integration: pSEO page at `/tools/certificate` shows a link/CTA to the dedicated tool page

  **Verification:**
  - `/tools` page renders the new card
  - Navigation from tools index to certificate generator works
  - No broken links or layout regressions on the tools index

## System-Wide Impact

- **Interaction graph:** MiniEditor gains two new exported functions. All existing callers (`[usecase]` page) are unaffected — they don't call these methods. The new page is the only consumer.
- **Error propagation:** Generation errors follow the existing toast pattern. No new error types introduced.
- **State lifecycle risks:** Template switching disposes and recreates the FabricJS canvas via MiniEditor's existing `loadGeneration` counter pattern. Form state resets on template change — no stale state risk.
- **API surface parity:** No new API endpoints. Uses existing public canvas endpoint identically to `[usecase]` pages.
- **Unchanged invariants:** All existing tool pages, the pSEO `[usecase]` route, the MiniEditor component's existing behavior, and the backend `/image/public/canvas` endpoint remain unchanged.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| FabricJS template designs look bad | Start from the proven `getCertificateTemplate()` design; iterate on 4 new designs with distinct visual themes |
| MiniEditor `setVariableValue()` doesn't find objects due to serialization | Variable bindings with `isVariable: true` are included in `toJSON()` for textbox objects — verified in existing template usage |
| Rate limit (5/min) frustrates users | GenerationLimitBanner already handles this UX; matches all other tool pages |
| Page competes with own `/tools/certificate` pSEO page | Different URL slug targets different keyword intents ("certificate generator" vs "certificate from HTML"); canonical tags prevent duplicate content |

## Sources & References

- Related code: `src/routes/tools/[usecase]/+page.svelte` (generation flow pattern)
- Related code: `src/routes/tools/online-invoice-generator/+page.svelte` (page structure pattern)
- Related code: `src/lib/components/tools/MiniEditor.svelte` (canvas component)
- Related code: `src/lib/pseo/useCaseTemplates.js:getCertificateTemplate()` (template #1 source)
- SEO data: "certificate generator" 2,900 vol / difficulty 23 — Orshot at pos 7
