/**
 * Class vocabulary for the video studio.
 *
 * v2 (Repro Shop, 2026-08): the studio was a full-screen dark pane — gray-950
 * stage, gray-900 panels, 3px black borders, offset solid shadows, the v1
 * `#ffc480` accent. That was its own product. It is now the same object as the
 * image studio: floating white cards on the greige canvas, hairline rules, one
 * soft shadow, and colour used to say something rather than to decorate.
 *
 * Only two files import from here (VideoStudio, VideoVariablesPanel), so this
 * module is the whole Svelte-side surface — the vendored React panels are
 * restyled separately, by the semantic token remap in tailwind.config.js.
 *
 * These live in one module rather than inline per component because the studio
 * has ~15 surfaces and the audit (docs/DASHBOARD_UI_UX_AUDIT.md §9.2) already
 * flags the codebase for reimplementing buttons and inputs in every component.
 * Import the constant; don't retype the string.
 */

// ── Surfaces ─────────────────────────────────────────────────────────────
/**
 * The ground the cards float on. Not "the darkest layer" any more — the stage
 * is the page, and the panels sit on top of it as paper.
 */
export const STAGE = 'bg-brand-canvas';
/** Panels, rails, docks — white paper on the canvas. */
export const PANEL = 'bg-brand-paper';
/** Chrome inside a panel: headers, footers, toolbars. */
export const PANEL_CHROME = 'bg-brand-subtle';
/** Divider between panes. A hairline, not a 3px black bar. */
export const DIVIDER = 'border-brand-rule';

/** The card treatment every floating panel wears. Pairs with `.studio-card`. */
export const CARD_SHELL = 'studio-card rounded-card bg-brand-paper overflow-hidden';

/** Text ramp on paper. */
export const TEXT = 'text-brand-ink';
export const TEXT_MUTED = 'text-brand-slate';
export const TEXT_FAINT = 'text-brand-mute';

// ── Type ─────────────────────────────────────────────────────────────────
/** Section heading inside a panel. Display face, sentence case, not shouting. */
export const HEADING = 'font-display text-[13px] font-bold text-brand-ink';
/**
 * Field label / micro-label. Mono is the house's label voice — it reads as
 * machine metadata, which is what these are.
 */
export const LABEL = 'font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute';

// ── Buttons ──────────────────────────────────────────────────────────────
const BUTTON_BASE =
	'inline-flex items-center justify-center gap-2 rounded-btn font-sans transition-all ' +
	'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal ' +
	'disabled:opacity-40 disabled:cursor-not-allowed';

/**
 * The affirmative action. Dark fill, not the field green — field is a ground
 * and an accent square, never a button body (it fails contrast at 11px and
 * competes with the stage).
 */
export const BUTTON_PRIMARY =
	`${BUTTON_BASE} bg-brand-press px-4 py-2 text-sm font-medium text-white hover:opacity-90`;

/** Everything else. */
export const BUTTON_SECONDARY =
	`${BUTTON_BASE} border border-brand-rule bg-brand-paper px-3.5 py-2 text-sm ` +
	'font-medium text-brand-slate hover:border-brand-ink hover:text-brand-ink';

/** Destructive. Outlined, not filled — this is the only red in v2, spend it. */
export const BUTTON_DANGER =
	`${BUTTON_BASE} border border-brand-alarm bg-brand-paper px-3.5 py-2 text-sm ` +
	'font-medium text-brand-alarm hover:bg-brand-alarm hover:text-white';

/** Compact button for a toolbar row. */
export const BUTTON_COMPACT =
	'inline-flex items-center gap-1.5 rounded-btn border border-brand-rule bg-brand-paper ' +
	'px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-slate ' +
	'transition-colors hover:border-brand-ink hover:text-brand-ink focus:outline-none ' +
	'focus-visible:ring-2 focus-visible:ring-brand-royal disabled:opacity-40 ' +
	'disabled:cursor-not-allowed';

/** Icon-only square button. */
export const BUTTON_ICON =
	'inline-flex h-8 w-8 items-center justify-center rounded-btn border border-brand-rule ' +
	'bg-brand-paper text-brand-slate transition-colors hover:border-brand-ink ' +
	'hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal ' +
	'disabled:opacity-40 disabled:cursor-not-allowed';

// ── Inputs ───────────────────────────────────────────────────────────────
export const INPUT =
	'w-full rounded-btn border border-brand-rule bg-brand-paper px-3 py-2 text-sm ' +
	'text-brand-ink placeholder-brand-mute transition-colors focus:outline-none ' +
	'focus:border-brand-ink';

export const INPUT_COMPACT =
	'w-full rounded-btn border border-brand-rule bg-brand-paper px-2 py-1.5 font-mono text-xs ' +
	'text-brand-ink placeholder-brand-mute transition-colors focus:outline-none ' +
	'focus:border-brand-ink';

// ── Chips ────────────────────────────────────────────────────────────────
export const CHIP =
	'inline-flex items-center gap-1 rounded-btn border border-brand-ink px-2 py-0.5 ' +
	'font-mono text-[10px] tracking-[0.06em] text-brand-ink';

export const CHIP_NEUTRAL = `${CHIP} border-brand-rule bg-brand-subtle text-brand-slate`;
export const CHIP_ACCENT = `${CHIP} bg-brand-field`;
export const CHIP_LIVE = `${CHIP} bg-brand-proof text-white`;
export const CHIP_DANGER = `${CHIP} border-brand-alarm bg-brand-alarm text-white`;

// ── Cards ────────────────────────────────────────────────────────────────
/** A floating card on the stage (render result, error, prompt). */
export const CARD = 'studio-card rounded-card bg-brand-paper';

/** An error card. Same frame, alarm-tinted. */
export const CARD_ERROR =
	'rounded-card border border-brand-alarm bg-brand-alarm/[0.06] p-4 text-sm text-brand-alarm';

// ── Layering (DESIGN.md z-index scale) ───────────────────────────────────
export const Z = {
	canvas: 'z-0',
	dock: 'z-10',
	drawer: 'z-20',
	inspector: 'z-30',
	backdrop: 'z-40',
	modal: 'z-50',
	toast: 'z-[60]'
};
