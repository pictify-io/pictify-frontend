> Retired: the GrapesJS experiment is replaced by `/test/visual-html`. See [visual-html-prototype.md](visual-html-prototype.md) for the current redesign studio prototype.

# GrapesJS builder prototype

Route: `/test/grapesjs` in the redesign worktree. Development-only: production requests return 404. No campaign API, generation, billing or auth gate is connected. Use synthetic data. Existing root-layout analytics/auth initialization is inherited; the editor surface is marked `ph-no-capture`.

Start with `npm run dev -- --host 127.0.0.1 --port 5190`, then open http://127.0.0.1:5190/test/grapesjs.

## Try it

1. Double-click Northwind or another text block and change its wording. Select an element and use the paintbrush/style panel for typography, size, spacing and color. Native GrapesJS layers and undo/redo are available.
2. Open the blocks panel (grid icon). Drag headings, text, sections, columns or account-field blocks onto the template. Add image supports local PNG/JPEG/WebP up to 2 MiB; no asset upload server.
3. Change zoom to fit the card. Choose an account and Preview filled design. Long-name/large-value and missing-value fixtures test basic layout behavior; close with Escape or Close preview. Rendering the preview does not replace template tokens.
4. Save locally. Switch to the A4 starter or blank canvas, then Reload saved (confirm discarding changes). Local saves are explicit, use a prototype-specific key, and may fail if browser storage is full.
5. Export JSON to keep the editable project, then Import JSON to restore it. Import accepts this prototype's versioned format, not arbitrary HTML/templates. Use trusted test files only.
6. Export filled HTML for the selected account. This is a downloadable HTML document, not a PNG/PDF export. The A4 option establishes a template width and print CSS, not a validated one-page production PDF.

## Boundaries

This intentionally exercises GrapesJS's block/HTML model. It does not establish Canva-style free positioning, responsive editor UX, automatic text fitting, campaign validation, or reliable server export. The template is the editable GrapesJS project; account substitutions are made only in a derived preview/export. Re-importing generated HTML is not the persistence contract. No new server renderer is introduced.

Prototype decisions to evaluate: block placement and styling usability, real data overflow, editor/HTML fidelity, and whether users need freeform positioning beyond this interaction model. Do not reuse this local-only storage or field substitution as the production campaign architecture.

Verified: route loads; synthetic normal/long-name substitution; source tokens preserved; local save and restore after switching A4; targeted ESLint and production build. Build emits the existing Cloudflare route-exclusion limit warning. Browser graphics/image upload and all possible imports are not exhaustively tested.
