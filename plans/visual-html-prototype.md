# Visual HTML studio prototype

Dev-only route: `/test/visual-html`. `/test/grapesjs` redirects here.
Run from the `redesign-v2` worktree. Use http://localhost:5173/test/visual-html for the local backend's allowed origin.

The prototype reuses redesign-v2's `SayItRail` and `editTemplateBySaying` API, with an HTML iframe visual stage powered by Moveable and Selecto. It does not use the legacy HTML copilot or convert HTML into Fabric objects.

## AI and manual round trip

The first submitted instruction creates a template named **Visual studio prototype** in the signed-in account. It uses normal template slots and AI limits. Subsequent instructions save the latest local HTML to that draft before invoking the studio agent. The returned HTML is sanitized and becomes an undoable local version. Controls are locked during requests to prevent AI overwriting concurrent visual changes. Merely opening the route creates no server template.

Visual editing, undo/redo, import, local save and download work without AI. Reloading the page starts a new session; a subsequent AI request creates another test template. Delete test templates through the regular template list when finished. Local undo is synced to the server before the next AI request; it is not the server's version-history undo.

## Try it

1. Click the account heading; change its text or font size in the right rail.
2. Drag the selection or resize its handles. Double-click leaf text for inline editing.
3. Undo and redo. Save locally, then reload the saved design.
4. Preview data and switch between normal, long Unicode, and missing-value samples.
5. Sign in on the same origin. Describe a change in Say it, customize the returned HTML visually, then submit another instruction.
6. Download HTML and verify that dynamic tokens remain while editor handles and controls are absent.

## Prototype boundaries

This is an isolated test route using the redesigned studio component and API, not a replacement for the production TemplateStudio. Export is HTML, not PNG/PDF. Imported scripts, embedded pages and external stylesheet links are removed. Movement applies CSS transforms; it does not automatically reflow siblings. Arbitrary complex HTML/CSS needs further fidelity testing. Sample filling supports simple named tokens only. Browser checks cover selection/property editing and undo; live authenticated AI generation still needs validation with a signed-in session.
