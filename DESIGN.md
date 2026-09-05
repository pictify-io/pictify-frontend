# Pictify — design system

> Extracted from shipped code: `tailwind.config.js`, `src/app.css`,
> `src/lib/components/dashboard/v2/RailV2.svelte`, and the campaigns surfaces
> under `src/lib/components/campaigns/`. This documents what exists. **When code
> and this file disagree, the code is right and this file is stale.**
>
> The app runs **two systems at once**. v2 (the 2026 rebrand, "Repro Shop") is
> the system of record for everything new. v1 (neo-brutalist) is deprecated and
> still shipped on pre-rebrand surfaces; it is documented in the appendix so
> nobody reads a legacy page and copies the wrong thing forward. Do not mix them
> in one view, and do not add v1 to a new surface.

---

# v2 — Repro Shop

## Theme

A print shop, not a dashboard. Flat surfaces; hierarchy comes from **ground
colour and inversion**, never elevation — there are no shadows in v2. Structure
is hairlines (`brand-rule`) and a single 1px ink rule above a table head. Type
does the shouting: Bricolage Grotesque at display sizes over a very quiet UI.

The signature is the **dither**: quantities drawn as raster squares filling in
(`DitherMeter`, `DitherBar`), not as smooth progress bars.

## Color

Every token below is real in `tailwind.config.js` under `brand.*`.

### Grounds

| Token | Value | Use |
|---|---|---|
| `brand-paper` | `#FFFFFF` | Cards, light section band |
| `brand-canvas` | `#E2E4DD` | Greige band — the dashboard rail sits on this |
| `brand-field` | `#D8F34A` | Saturated colour field — hero, closing CTA, "current" chips |
| `brand-sky` | `#A9D7F2` | Printed blue tint — integrations ground |
| `brand-subtle` | `#F4F6F4` | Barely-there wash — chart wells, meta strips, skeletons, disabled fills |

### Ink

| Token | Value | Use |
|---|---|---|
| `brand-ink` | `#000000` | Display type, primary text, the one structural rule |
| `brand-slate` | `#383A42` | Body text on light grounds |
| `brand-mute` | `#8A8A85` | Captions, mono labels, absent values |
| `brand-rule` | `#E5E7EB` | Hairlines. **The only border weight in v2 is 1px.** |

### Dark surfaces

`brand-press #242628` (dark card) · `brand-press-deep #131417` (dark band, CTA
strips, CSV blocks) · `brand-press-text #ADB9C6` (body on dark).

### Actions and status

| Token | Value | Use |
|---|---|---|
| `brand-plum` | `#252527` | The one filled primary button per screen |
| `brand-royal` | `#0054A6` | Links, the focus ring, brand accents on output |
| `brand-proof` | `#00BE43` | Rendered / delivered / verified |
| `brand-alarm` | `#B0483A` | Failed / blocking — **the only red in v2** |

### Decorative fills

`brand-blue #0078BF` (riso blue, the working ink) · `brand-powder #D3E7F6` ·
`brand-rose #FFD3E8` · `brand-pink #FF48B0` (fluorescent, spot punch, rare).

These carry pixel graphics, capsules and accent cards. **They are not
interactive surfaces** — a button is plum or an outlined hairline, never pink.

### Editor-private tokens

`tailwind.config.js` also defines shadcn-shaped names (`background`,
`foreground`, `muted`, `accent`, `popover`, `primary`, `border`, `destructive`)
for the vendored OpenVideo timeline island. As of v2 they are **re-pointed at
the Repro Shop palette**, which is how 64 vendored files got restyled without
touching third-party source. They are still globally scoped and still collide
with Tailwind semantics (`border-border` resolves to `#E5E7EB` anywhere). Treat
them as private to `src/lib/video/vendor/`; never use them in new Svelte code.

## Typography

- **Display**: Bricolage Grotesque (`font-display`) — variable 200–800, width +
  optical-size axes. Page titles, figures, card headings.
- **Sans / body / UI**: Inter (`font-sans`).
- **Mono**: JetBrains Mono (`font-mono`) — IDs, counts, timestamps, state words,
  micro-labels, API snippets. In v2 mono is a *UI* face, not just a code face:
  anything the machine knows (an account id, a run count, `SAVED 2 MIN AGO`) is
  mono, and anything a person wrote is Inter.
- `font-heading` (DynaPuff) is **v1 only**. Never in new code.

Rules in force:

- Marketing display sizes are the named `fontSize` steps (`display-lg` 112px →
  `card` 26px). They are **px on purpose**: the density system steps the root
  font-size down, which is right for the dashboard and wrong for hero type.
- Dashboard/product UI type is set in explicit px too (`text-[13.5px]` body,
  `text-[14px]` emphasis, `text-sm` nav) — v2 surfaces do not ride the rem scale.
- Micro-labels: `font-mono text-[10px]` (rail groups) or `text-[10.5px]`
  (panel headings), `uppercase tracking-[0.06em]`–`tracking-[0.12em]`.
- Table head: `font-mono text-[11.5px] font-normal uppercase tracking-[0.06em]
  text-brand-slate` under a 1px `border-brand-ink`.
- Weight is used sparingly: `font-semibold` marks the active thing,
  `font-bold`/`font-extrabold` is display only. There is no `font-black` in v2.

## Density

`src/app.css` steps the root font-size: **15px below 1680px, 14px below 1440px**.
v2 surfaces mostly pin their own px sizes, so the step affects rem-based spacing
more than type. **Verify new surfaces at 1440×900**, not just on a large display.

## Structure

- **Borders**: 1px, `border-brand-rule` for hairlines, `border-brand-ink` for the
  one rule that separates a head from its rows. `border-[3px]` is v1 — off-system
  in v2.
- **Radii**: four steps, no more.

  | Token | Value | Use |
  |---|---|---|
  | `rounded-btn` | 4px | Buttons, inputs — sharp |
  | `rounded-tile` | 12px | Render tiles, media wells |
  | `rounded-card` | 16px | Accent cards, CTA strips |
  | `rounded-pane` | 28px | Large dark panes |

  `rounded-md` appears on small rail/panel cards; bare `rounded` is off-system.
- **Shadows**: none. The `shadow-brutal-*` ladder is v1 and deprecated.
- **Max width**: `max-w-page` (1280px) paired with `px-10` resolves to the drawn
  1200px column. It is an outer bound, not the content width.

## Components

Copy these exact strings; don't re-derive them.

**Primary button** (one per screen)
```
flex h-11 items-center gap-2.5 rounded-btn bg-brand-plum px-4
font-sans text-[13.5px] text-white
```

**Disabled primary** — never opacity. Swap the fill and the trailing square:
```
flex h-11 items-center gap-2.5 rounded-btn px-4 font-sans text-[13.5px]
cursor-not-allowed bg-brand-subtle text-brand-mute
```
with the trailing `h-2 w-2` square going `bg-brand-field` → `bg-brand-rule`.

**Secondary button**
```
flex h-11 items-center rounded-btn border border-brand-rule px-4
font-sans text-[13.5px] text-brand-slate
```

**Panel card** (summary panels, notes)
```
rounded-md bg-brand-subtle p-4
```

**Definition list** (the summary panel's default shape)
```
<dl class="mt-3 border-t border-brand-ink">
  <div class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2.5">
    <dt class="font-sans text-[13.5px] text-brand-slate">…</dt>
    <dd class="font-mono text-[12px] text-brand-ink">…</dd>
  </div>
</dl>
```

**Chip** — mono, square, no pill:
```
bg-brand-subtle px-2 py-1 font-mono text-[11px] text-brand-slate      (period)
border border-brand-rule px-2 py-1 font-mono text-[11px] text-brand-slate  (state)
bg-brand-field px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-ink  (current)
```

**Link** — `font-sans text-[13.5px] text-brand-royal hover:underline`.

**Skeleton** — `animate-pulse bg-brand-subtle` at the real element's dimensions,
inside the real frame, so nothing jumps when content lands. Never a spinner.

**Focus** — nothing to add per element. Put `data-v2` on the surface's root and
`src/app.css` gives every `:focus-visible` inside it a 2px `#0054A6` outline at
2px offset. The v1 `.focus-brutal` orange is scoped away from v2 for exactly this
reason: one app with two focus colours appearing at random is worse than the
browser default.

## The rail

`src/lib/components/dashboard/v2/RailV2.svelte`. 220px, `bg-brand-canvas`,
`px-[18px] py-[22px]`. Three zones, and only the middle one scrolls:

1. **Context** (pinned): brand mark + team switcher. The switcher is a hairline
   card (`border-black/[0.08] bg-white/85`), name in Inter 12.5 semibold, subline
   in mono 10 caps. The **Switch experience** action lives in this menu, because
   which experience you are in is a property of how you work — like which team
   you are in — not a navigation destination.
2. **Location** (scrolls): mono group headings (`Shop` / `Campaigns` /
   `Account` / `More ▾`), rows at `rounded-btn px-2 py-[7px]` with a 9px gap.
   Active = `bg-white/85 font-semibold text-brand-ink` plus `aria-current="page"`;
   inactive = `text-brand-slate hover:bg-white/50`. The rail scrolls the active
   row into view only when it is actually out of view, and re-checks on resize.
3. **Meters** (pinned): the house signature. `DitherMeter` for renders and AI
   quota; never a smooth bar. The masked API key sits under them.

Two maps, not one filtered map. The campaigns rail is Campaigns · Brand assets ·
Team & invites · Usage & billing, with a **campaign allowance** card in place of
the meters — a pilot is metered in accounts summarised, and a render count there
would meter the wrong thing. A buyer in a pilot has no use for renders,
templates or the API, and greying them out would suggest a pilot is a limited
version of the platform rather than a different job.

Both the allowance card and the pilot subline render **only when the server has
stated every part of them**. A half-known allowance ("… / 250") is worse than
none: it invites the buyer to plan against a number nobody published.

## Motion

150–250ms, `transition-colors` on hover states. v2 dropped the v1 press-out
gesture (`hover:-translate-y-0.5` + shadow step) — flat surfaces do not lift.
Global `prefers-reduced-motion` handling lives in `src/app.css`; don't
re-implement or opt out.

## Z-index

The app has no declared scale and the shell already collides (audit §4.7: nav
`z-30` under a `z-40` backdrop). For new layered surfaces use, in order:
canvas `0` → docked panels `10` → drawers `20` → floating inspectors `30` →
modal backdrop `40` → modal `50` → toast `60`. Don't invent `999`.

---

# Campaigns layout

The campaigns surfaces (`/dashboard/campaigns/**`, boards D01–D10) add rules on
top of v2. These were locked in `plans/handoff-campaigns-r1-2026-09-05.md` §2 and
are **not open for re-litigation** in implementation. Components live in
`src/lib/components/campaigns/`.

### 1. Edition shell

`editions/[editionUid]/+layout.svelte`. Page padding `px-11 pt-7` (`px-5 pt-6`
below `md`). Persistent header, one row:

- breadcrumb `Campaigns / <name>` (mute → ink 16px bold)
- period chip (mono, `bg-brand-subtle`)
- state chip (mono, outlined `border-brand-rule`)
- right: `SAVED n MIN AGO` (mono 10.5 caps mute) + `Campaign settings` link

Under it the **five-step strip** (`StepStrip.svelte`): number (mono 11) · label
(Inter 14) · state word (mono 10 caps).

- Current step: 2px ink bottom border + a field-green chip.
- Done step: slate `DONE …` text with a **proof-green square as the marker**. The
  words stay slate — a green word would make "done" the loudest thing on screen.
- Blocked step: slate `BLOCKED · reason`.
- **Steps are links only when the server says `reachable`.** A blocked step is
  plain text, not a disabled link: a disabled link invites a click and explains
  nothing.
- Every word in the strip comes from server state. The client never decides that
  a step is done, reachable, or why it is blocked.
- The underline follows the **URL**, not the server's current step — "where am I"
  is a question only the URL can answer.

### 2. Layout

Work area `min-w-0 flex-1` + `w-full flex-shrink-0 xl:w-[340px]` summary panel,
`gap-10` (40px), `mt-7` top padding, rail 220. Below `xl` (≤1024) the panel drops
underneath the work area.

Foot actions row: hairline top rule, an explanatory sentence on the left,
secondary + primary on the right. **One plum primary per screen.** Disabled
primary uses the subtle-ground / mute-text / rule-grey-square treatment above —
never just opacity.

### 3. Status vocabulary

`StatusSquare.svelte`. 8px (`h-2 w-2`) squares:

| Tone | Fill | Meaning |
|---|---|---|
| `ready` | `bg-brand-proof` | ready / verified / confirmed |
| `current` | `bg-brand-field border border-brand-ink` | current / needs decision / suggested |
| `blocked` | `bg-brand-alarm` | blocking / failed — **always with a sentence** |
| `excluded` | `bg-brand-rule` | deliberately not in the run |
| `expired` | `border border-brand-mute` | superseded / expired |

Alarm is the only red. **Never colour-only**: every square is followed by words,
so the state survives a greyscale print, a colourblind reader, and a screenshot
pasted into a ticket. A red square that says nothing tells a buyer something is
wrong about their customers and not what.

### 4. Tables

Mono caps 11.5px slate head row under a 1px ink rule. Rows 46–64px separated by
`border-brand-rule` hairlines. IDs and counts in JetBrains Mono. Fixed-width
columns with `flex-shrink-0`; the last text column takes `flex-1`. Exact widths
per board: D04/D05/D07/D09. At 390 the table scrolls horizontally inside its own
container and the account id + issue columns stay visible.

### 5. Format choice

Two radio cards (D02). PNG copy: "Place it inside your existing message". PDF
copy: "Attach or share from your own tool". The PDF card reveals an A4/Letter
select once chosen.

### 6. Metric rows

key · unit · precision in mono, plus chips: `OBSERVED` / `ESTIMATED · METHOD
NOTE` (powder ground, royal text), `HIGHER/LOWER IS BETTER`, `VS PRIOR PERIOD`.

### 7. Preview tiles

239px wide, 150px card, 4px brand band, then id (mono) + `WHY · reason`
(mono 10 mute) + status. A clipped tile gets an alarm border and a "Clipped"
label.

### 8. Generation progress

The house dither bar (`DitherBar.svelte`): one 9px square per 4 accounts, in
proof / alarm / field / outline. `LAST CHECKED hh:mm:ss · POLLING n S` in mono.
**No ETA text anywhere** — an ETA on a queue we do not control is a promise the
product cannot keep.

### 9. Export

Never shows per-file URLs. The package card lists the four file classes;
downloads are "Download campaign package", "Download manifest (.json)", "Text
equivalents (.zip)". **"Accept handoff" is an outlined ink button, not plum** —
it is the consequential action, and the sentence beside it states the effective
deletion date ("whichever is earlier", with the 30-day ceiling) before it is
clicked.

### 10. Delete

The dialog requires typing `delete YYYY-MM`; the button stays disabled until it
matches exactly. Archive is a header button. Delete lives under
`DATA AND DELETION` in the config panel — the two are not neighbours on purpose.

### 11. Outputs

The card and PDF a customer receives are **the buyer's brand, not ours**. Preset
uses Inter, one brand colour (contrast-checked), logo + name. **No Pictify mark.**
Decreases render in slate, never red — colouring a dip red turns a fact into a
verdict, and the buyer decides whether a dip is bad news. The "neutral" variant
drops the comparison line entirely.

Sample values across the whole marketing page come from one fixture
(`src/lib/campaigns/marketing-fixture.js`) so the sheet and the card beside it
cannot disagree. Every number is invented and the page says so wherever it
appears.

### 12. Landing page

`/campaigns/customer-value-updates` reuses the pricing hero band (field green +
`PixelCluster`). Nav: Tools · Docs · Pricing · Blog · Campaigns; the primary nav
button is "Request pilot access". The two sample cards are the D02 card
component with synthetic rows shown above each in a press-deep CSV block.

### Previews are sandboxed

Any in-browser preview of buyer HTML goes through
`src/lib/components/studio/v2/preview-document.js` — a CSP meta tag plus an
iframe `sandbox`. DOMPurify strips scripts; it does **not** touch URLs inside CSS
(`@import`, `background:url()`, `@font-face`, `<img src>` all survive it, and
that was measured, not assumed). In a preview each of those is a request the
buyer's browser makes to a host chosen by whoever wrote the markup — a tracking
channel, and with a query string an exfiltration one. The sanitizer cannot close
it; the CSP can. Never write preview HTML into a frame by any other path.

---

# Appendix — v1 (neo-brutalist), deprecated

Still shipped on `/dashboard` (non-v2 routes) and pre-rebrand marketing pages.
Documented so those surfaces stay internally consistent until they are migrated.
**Do not introduce v1 to a new surface, and do not mix v1 and v2 in one view.**

Tokens: `brand-bg #FFFDF8`, `brand-accent #ffc480`, `brand-danger #ff6b6b`,
`brand-success #10b981`; structure in `black`/`gray-900`; the `data-*` category
palette (`data-green #4ade80`, `data-blue`, `data-sky`, `data-violet`,
`data-purple`, `data-amber`, `data-teal`, `data-pink`, `data-red`) for chart
series and status pills.

> **Known inconsistency** (audit §3.2): `brand-success` and `data-green` are two
> greens for one meaning. On light surfaces prefer `brand-success`; on dark panes
> `data-green` reads better. Pick one per surface.

Type: Inter body, DynaPuff (`font-heading`) for marketing display, JetBrains Mono
for code. Labels and buttons `text-xs font-black uppercase tracking-widest`;
micro-labels `text-[10px] font-black uppercase tracking-widest`; page titles
`text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-black tracking-tighter
leading-[0.95]` (it steps *down* at `lg` — that is the density system, not a
mistake).

Structure: `border-[3px] border-black` default, `border-[2px]` nested,
`border-[1.5px]` smallest inline. Radii `rounded-lg` / `rounded-xl` /
`rounded-2xl`. Offset solid shadows, never blurred — `shadow-brutal-sm` `2px 2px`
through `shadow-brutal-3xl` `12px 12px` (all `#1f2937`), plus
`shadow-brutal-accent-sm` / `shadow-brutal-accent` in `#ffc480` for
focus/selection. Audit §3.1 flags the ladder as too long: prefer `sm` / `md` /
`lg` / `2xl`.

Components:

```
Primary   bg-black text-white px-5 py-2.5 rounded-xl font-black text-xs
          uppercase tracking-widest border-[3px] border-black hover:bg-gray-800
Secondary bg-white text-black … border-[3px] border-black shadow-brutal-sm
          hover:shadow-brutal-md hover:-translate-y-0.5
Accent    bg-brand-accent text-black … shadow-brutal-sm hover:shadow-brutal-md
Card      bg-white rounded-2xl border-[3px] border-black shadow-brutal-md
Input     w-full rounded-xl border-[3px] border-black px-4 py-3 text-sm
          font-bold focus:outline-none focus:shadow-brutal-md
Chip      px-2.5 py-1 text-[10px] font-black uppercase tracking-widest
          rounded-full border-[2px] border-black
Nav       active: bg-brand-accent text-gray-900 border-[3px] border-gray-900
          shadow-brutal-md · inactive: border-[3px] border-transparent
Empty     bg-white rounded-2xl border-[3px] border-black border-dashed p-10
Error     bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-4
Skeleton  bg-gray-200 rounded animate-pulse inside the real card frame
Focus     add `focus-brutal` (see src/app.css)
```

Dark panes (code editors, canvas stages, preview wells) are a *component*, not a
theme: `rounded-2xl border-[3px] border-black shadow-brutal-2xl overflow-hidden`,
surface `bg-gray-950`, chrome `bg-gray-900`, dividers `border-gray-800`, text
`text-gray-100` / `text-gray-400`, accent stays `#ffc480` (never `yellow-400`),
success `text-data-green`, danger `text-brand-danger`.

Motion: the house gesture was `hover:-translate-y-0.5` paired with a shadow
step-up — press-out, not glow. v2 has no equivalent.
