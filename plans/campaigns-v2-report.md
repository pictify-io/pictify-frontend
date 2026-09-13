# V-2 — frontend verification

Task V-2 of `plans/handoff-campaigns-r1-2026-09-05.md`: lint + build, then
browser verification of D01–D10 at 1440×900 / 1024 / 390 against the Paper
boards, a keyboard-only pass, a reduced-motion pass, and 200% zoom on D06/D07.

Run 2026-09-06 against a local dev stack: frontend `vite dev` on :5173 (the port
the backend's dev CORS allowlist names), backend on :3101, local Mongo. Test
account `v2-qa@pictify.test` on team `CG8F86NB56`, granted a synthetic 250-account
pilot entitlement, seeded through the product's own "Try sample data" button
(BE-8) rather than by writing fixtures — so what was verified is the path a buyer
actually takes.

Screenshots: `plans/campaigns-v2-screens/`.

## Static checks

| Check | Result |
|---|---|
| `npx eslint` on the campaigns surfaces | **clean** (was 8 errors — fixed, see below) |
| `svelte-check` | **0 errors**, 82 warnings, 29 files |
| `npm run build` | **passes** |
| `npm run lint` (repo-wide) | **fails, and did before this work** — 451 eslint errors and 331 prettier findings across legacy stores and marketing pages. Not touched: reformatting 331 files would bury every real change in this branch. |

`npm run build` failing was itself a finding — see "moveable and selecto" below.

## Browser pass

Console errors, per route, after `networkidle`:

| Board | Route | Console |
|---|---|---|
| D01 | `/dashboard/campaigns` | clean |
| D02/D03 | `…/editions/:e/setup` | one benign line* |
| D04 | `…/data` | clean |
| D05 | `…/review` | clean |
| D06 | `…/preview` | clean |
| D07 | `…/generate` | clean |
| D08 | `…/export` | clean |
| D09 | `/dashboard/campaigns/:c` | clean |
| M01 | `/campaigns/customer-value-updates` | clean |

\* `Blocked script execution in 'about:srcdoc' because the document's frame is
sandboxed` — the design preview iframe announcing its own sandbox. Chrome logs it
once for any sandboxed frame without `allow-scripts`, whatever writes the
content; `preview-document.js` documents it. It is the protection working.

A first pass showed 429s and knock-on 401/409s. Those were mine: walking nine
routes back-to-back tripped a rate limiter. Paced, they do not recur.

## Responsive

No page scrolls horizontally at any width. At 390 several routes have content
wider than the viewport — D01 (19 elements), D05 (7), D07 (7), D09 (14), M01 (98)
— and **every one of them is inside a container with its own `overflow-x`**;
zero escape to the page. That is D-1's rule holding: the table scrolls inside its
own container, the page does not.

`documentElement.scrollWidth === clientWidth` at 1440, 1024, 720 and 390 on every
route.

## 200% zoom (D06, D07)

Emulated as a 720px-wide viewport against the 1440 design. Both pages: no
horizontal page scroll, nothing past the right edge, panel stacked below the work
area as specified.

## Keyboard

D01: 23 focusable elements, **0 without an accessible name**, **0 with a positive
tabindex** — so tab order is DOM order, which is the order the page reads in.

The v2 focus ring resolves to `rgb(0, 84, 166) 2px solid` on a focused control
inside `[data-v2]` — `#0054A6`, brand-royal, as `src/app.css` specifies. The v1
orange `.focus-brutal` ring is correctly out of scope on these surfaces.

## Reduced motion

**Verified by inspection, not by emulation** — `Emulation.setEmulatedMedia` is not
on gstack browse's CDP allowlist, so the media feature could not be toggled in
this pass. What was checked instead: the only animation running on any campaigns
route is `pulse`, on skeletons, one element at a time; and `src/app.css` carries a
global `@media (prefers-reduced-motion: reduce)` block that clamps
`animation-duration` and `transition-duration` to `0.01ms` for `*`, `::before` and
`::after`. The rule covers the only animation present. Worth one manual
confirmation with the OS setting on before release.

## Defects found and fixed

1. **`Proof is from rev undefined` on D02** (`88d9b4b`). The design card printed a
   raw `undefined` to the buyer. One sentence was covering two different
   failures — a genuinely stale proof, and nothing pinned at all — and in the
   second there is no revision to name on either side. Now three cases, each
   naming only what it knows.

2. **A poll that outlived its page** (`3122b61`). `statusTimer` on D09 was
   assigned and never read: navigating away mid-purge left `getDeletion` firing
   every three seconds forever, into a destroyed component. Cleared on destroy,
   and before re-arming.

3. **`moveable` and `selecto` were never committed** (`69c6847`). Both have been
   imported by `src/lib/components/studio/v2/stage.js` since `4f64a18`, but only
   in the working tree's `package.json` — so a clean checkout of this branch did
   not build. Easy to miss because `stage.js` loads them as `import('moveable')`
   inside an async function, which a grep for `from 'moveable'` never finds.

4. Five smaller lint findings in the same commit as (2): an unused
   `capabilitiesError` import suggesting a second error path that does not exist,
   an unused `num` import, and three `{#each Array(n) as _, i (i)}` skeletons
   binding a value the loop never reads.

## Not covered

- **D06, D07, D08 were verified only in their blocked/empty states.** Reaching
  approved-with-previews, a partially-failed run and a reconciled export needs a
  full generation cycle against real storage and workers, which is V-3's
  250-account rehearsal, not this pass.
- **D10** (the typed `delete YYYY-MM` dialog) was reached but not exercised —
  confirming it would purge the sample edition and cost the rest of the pass.
- **D01's rail is the platform rail in these screenshots**, not the campaigns
  rail of board `BPD-0`. That is correct behaviour, not a mismatch: the rail
  follows the stored experience preference, and this account had never switched.
  The campaigns rail is reachable through the workspace menu.
- **Comparison against the Paper boards was structural, by reading both** —
  eyebrow, title, filter tabs, table shape, status vocabulary, panel geometry,
  foot actions. No pixel diff was run.
