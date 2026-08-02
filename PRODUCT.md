# Pictify — product context

> Written from the codebase, not from a brief. Every claim here is traceable to
> shipped code (`tailwind.config.js`, `src/app.css`, `src/lib/components/dashboard/`,
> `docs/DASHBOARD_UI_UX_AUDIT.md`). Correct it when the product moves.

## Register

**product** — the primary surface is an authenticated dashboard at `/dashboard/*`:
templates, workflows, runs, media, brand assets, API tokens, billing. There is a
marketing site (`/`, `/pricing`, `/tools/*`) that reads **brand**, but it is the
minority surface and it borrows the dashboard's visual language rather than the
other way round.

Design here SERVES the task. The user came to render something.

## What the product does

Pictify turns a template plus a row of data into a rendered asset — an image, a
PDF, a GIF, and now a video — via the dashboard, a bulk workflow, or an HTTP API.

The three nouns that matter:

- **Template** — HTML (or a video scene) with `{{variables}}` in it.
- **Variables** — the declared contract: what a caller must supply to render.
- **Run / render** — one row in, one asset out. Repeated over a CSV, that's a workflow.

Everything else in the dashboard exists to support that loop. A surface that
doesn't lead back to "render something with variables" is a dead end, and the
product has shipped a few of those (see the video editor's history).

## Who uses it

- **Solo developers and small teams** integrating rendered assets into their own
  product: certificates, badges, tickets, OG images, social cards. They live in
  the API docs and the token page, and they visit the dashboard to author a
  template once.
- **Operators** running a batch: upload a CSV, map columns to variables, render
  200 certificates, email them. They live in the workflow wizard and never see code.

Both are in a task, usually a repeated one, often on a laptop (hence the density
system below). Neither is here to admire the interface.

## Personality

Neo-brutalist and unembarrassed: hard 3px black borders, offset solid shadows,
`font-black` uppercase labels, a warm apricot accent doing the pointing. It is
deliberately not the soft-shadow SaaS default. The tone is direct — buttons say
what they do, empty states teach the next action.

The one rule that keeps it from becoming noise: **the accent points at the
action, never at decoration.**

## Anti-references

- Soft-shadow, rounded-3xl, indigo-gradient SaaS. The product already rejected
  this; reintroducing it in one surface makes that surface look bolted on.
- Foreign editor chrome. A vendored editor that keeps its upstream dark theme
  (the video studio's `#101014` / `yellow-400` chrome) reads as a different
  product embedded in this one.
- Gradient text, glassmorphism, decorative motion. None of it ships here.

## Accessibility

- `.focus-brutal` in `src/app.css` is the keyboard focus system — a 3px `#ffc480`
  ring keyed to `:focus-visible`, with variants that compose with each brutal
  shadow so there's no double halo. New interactive elements use it.
- `prefers-reduced-motion` is honoured globally in `src/app.css`. Don't opt out.
- The audit (`docs/DASHBOARD_UI_UX_AUDIT.md` §1.5) scores accessibility as the
  weakest dimension — missing ARIA on navigation, no delete confirmations. New
  surfaces should not add to that debt; keyboard-heavy surfaces like an editor
  especially.

## Design principles

1. **Every surface returns to the loop.** If a screen can't reach "render with
   variables," it isn't finished.
2. **One noun per concept.** The image side has exactly one template noun. Video
   now does too (`VideoTemplate`, discriminated by `kind`). A second noun costs a
   nav item, a mental model, and a set of docs, and buys nothing.
3. **Variables are the contract.** Declared the same way, shaped the same way,
   and sent the same way everywhere — the HTML editor, the video studio, the
   workflow wizard, the API.
4. **Density is a feature.** The root font-size steps down below 1680px and
   1440px so laptop users see the same information without zooming out. Pixel
   details (borders, shadows) keep their weight on purpose.
5. **Borrowed code adopts the house style.** Vendored UI is fine; vendored
   aesthetics are not.
