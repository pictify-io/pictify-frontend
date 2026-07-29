# Pictify — design system

> Extracted from shipped code: `tailwind.config.js`, `src/app.css`, and the
> ~2,700 brutal-token usages across `src/`. This documents what exists. When
> code and this file disagree, the code is right and this file is stale.

## Theme

Neo-brutalist product UI. Light surfaces, hard black structure, one warm accent.
Committed, not restrained: the accent carries real surface area on active nav,
callouts, and primary actions, but never decorates.

Dark is **not** a theme here. Dark *panes* are a component (a code editor, a
canvas stage, a preview well) and they wear the same 3px black border and offset
shadow as everything else. A full-dark shell is off-system.

## Color

### Brand

| Token | Value | Use |
|---|---|---|
| `brand-bg` | `#FFFDF8` | App background |
| `brand-accent` | `#ffc480` | THE accent: active nav, primary emphasis, focus ring, selection |
| `brand-danger` | `#ff6b6b` | Errors, destructive actions |
| `brand-success` | `#10b981` | Success (see the two-greens note) |

Structure is `black` / `gray-900`; body text `gray-600`–`gray-900`; muted
`gray-500`.

### Data / category

`data-green #4ade80`, `data-blue #3b82f6`, `data-sky #60a5fa`,
`data-violet #a78bfa`, `data-purple #a855f7`, `data-amber #f59e0b`,
`data-teal #4ecdc4`, `data-pink #f472b6`, `data-red #ff5252`.

Section-heading dots, status pills, chart series. Named on purpose so they read
as tokens, not stray hex.

> **Known inconsistency** (audit §3.2): `brand-success` and `data-green` are two
> greens for one meaning. On light surfaces prefer `brand-success`; on dark panes
> `data-green` reads better. Pick one per surface, don't mix them in one view.

### Editor-private tokens

`tailwind.config.js` also defines shadcn-shaped names (`background`, `foreground`,
`muted`, `accent`, `popover`, `primary`, `border`, `destructive`) for the vendored
OpenVideo timeline island. **These are globally scoped and collide with Tailwind
semantics** — `border-border` resolves to `#27272a` anywhere in the app. Treat
them as private to `src/lib/video/vendor/`. Never use them in new Svelte code.

## Typography

- **Sans / body / UI**: Inter (`font-sans`).
- **Display**: DynaPuff (`font-heading`) — marketing only, never in UI labels.
- **Mono**: JetBrains Mono (`font-mono`) — code, variable names, IDs, API snippets.

Rules in force:

- Labels and buttons: `text-xs font-black uppercase tracking-widest`.
- Micro-labels: `text-[10px] font-black uppercase tracking-widest`.
- Page titles: `text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-black tracking-tighter leading-[0.95]`
  (note it steps *down* at `lg` — that's the density system, not a mistake).
- Section headings inside cards: `text-sm font-black uppercase tracking-widest`,
  preceded by a `w-3 h-3` colored square with a `border-[2px] border-black`.
- Weight does the hierarchy work. `font-bold` is the floor for UI text.

## Density

`src/app.css` steps the root font-size: **15px below 1680px, 14px below 1440px**.
Rem-based type and spacing scale with it; pixel details (`border-[3px]`,
`shadow-brutal-*`) intentionally keep full weight. Components also carry explicit
`lg:` down-steps (`px-5 py-3 lg:py-2.5`). **Verify new surfaces at 1440×900**, not
just on a large display.

## Structure

- **Borders**: `border-[3px] border-black` is the structural default.
  `border-[2px]` for nested chrome (pills, chips, inner tiles). `border-[1.5px]`
  for the smallest inline controls. 1px borders are off-system.
- **Radii**: exactly three. `rounded-lg` (small controls), `rounded-xl` (buttons,
  inputs, tiles), `rounded-2xl` (cards and panels). Bare `rounded` and
  `rounded-md` are off-system; `rounded-full` is for pills only.
- **Shadows**: offset solid, never blurred.

  | Token | Value |
  |---|---|
  | `shadow-brutal-sm` | `2px 2px 0 0 #1f2937` |
  | `shadow-brutal-md` | `3px 3px 0 0 #1f2937` |
  | `shadow-brutal-lg` | `4px 4px 0 0 #1f2937` |
  | `shadow-brutal-xl` | `6px 6px 0 0 #1f2937` |
  | `shadow-brutal-2xl` | `8px 8px 0 0 #1f2937` |
  | `shadow-brutal-3xl` | `12px 12px 0 0 #1f2937` |
  | `shadow-brutal-accent-sm` | `2px 2px 0 0 #ffc480` |
  | `shadow-brutal-accent` | `4px 4px 0 0 #ffc480` |

  Accent shadows mark focus/selection on dark or emphasized elements. (Audit §3.1
  flags the ladder as too long — prefer `sm` / `md` / `lg` / `2xl` and leave the
  rest alone.)

## Components

Copy these exact strings; don't re-derive them.

**Primary button**
```
inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl
font-black text-xs uppercase tracking-widest border-[3px] border-black
hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
```

**Secondary button**
```
inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl
font-black text-xs uppercase tracking-widest border-[3px] border-black
shadow-brutal-sm hover:shadow-brutal-md hover:-translate-y-0.5 transition-all
```

**Accent button** (the affirmative action on a card)
```
bg-brand-accent text-black … border-[3px] border-black shadow-brutal-sm
hover:shadow-brutal-md hover:-translate-y-0.5 transition-all
```

**Card / panel**
```
bg-white rounded-2xl border-[3px] border-black shadow-brutal-md
hover:shadow-brutal-xl hover:-translate-y-1 transition-all duration-200
```
(drop the hover half for static panels; `shadow-brutal-2xl` for hero panels)

**Input / textarea**
```
w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm font-bold
text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all
```

**Chip / badge**
```
px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full
border-[2px] border-black
```
Status fills: published `bg-data-green text-black`, draft `bg-gray-100 text-gray-700`,
meta `bg-brand-accent/20 text-black`.

**Active nav item**
```
bg-brand-accent text-gray-900 border-[3px] border-gray-900 shadow-brutal-md
```
Inactive: `text-gray-600 hover:bg-gray-100 border-[3px] border-transparent`
(transparent border, so nothing shifts on hover).

**Empty state** — dashed frame, an icon tile, a sentence that teaches, and a CTA:
```
bg-white rounded-2xl border-[3px] border-black border-dashed p-10 text-center
```

**Error state**
```
bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-4
text-sm font-bold text-brand-danger
```

**Skeleton** — `bg-gray-200 rounded animate-pulse` inside the real card frame, so
the layout doesn't jump when content lands. Never a centered spinner.

**Focus** — add `focus-brutal` to interactive elements (see `src/app.css`).

## Dark panes

Used for code editors, canvas stages, and preview wells. They are components, not
a theme:

- Frame: `rounded-2xl border-[3px] border-black shadow-brutal-2xl overflow-hidden`
- Surface: `bg-gray-950`; secondary chrome `bg-gray-900`; dividers `border-gray-800`
- Text: `text-gray-100` primary, `text-gray-400` muted
- Accent stays `#ffc480`. Never `yellow-400`.
- Success on dark: `text-data-green`. Danger on dark: `text-brand-danger`.

## Motion

150–250ms, `transition-all` / `transition-colors`. The house gesture is
`hover:-translate-y-0.5` paired with a shadow step-up — press-out, not glow.
Global `prefers-reduced-motion` handling lives in `src/app.css`; don't re-implement
or opt out.

## Z-index

The app has no declared scale and the shell already collides (audit §4.7: nav
`z-30` under a `z-40` backdrop). For new layered surfaces use, in order:
canvas `0` → docked panels `10` → drawers `20` → floating inspectors `30` →
modal backdrop `40` → modal `50` → toast `60`. Don't invent `999`.
