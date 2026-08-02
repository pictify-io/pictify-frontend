/**
 * Class vocabulary for the video studio.
 *
 * The studio is a full-screen surface built from Pictify's "dark pane"
 * component (DESIGN.md): dark surfaces wearing the house's 3px black borders,
 * offset solid shadows, and the `#ffc480` accent. It is NOT a dark theme, and
 * it is not the vendored editor's upstream chrome.
 *
 * These live in one module rather than inline per component because the studio
 * has ~15 surfaces and the audit (docs/DASHBOARD_UI_UX_AUDIT.md §9.2) already
 * flags the codebase for reimplementing buttons and inputs in every component.
 * Import the constant; don't retype the string.
 */

// ── Surfaces ─────────────────────────────────────────────────────────────
/** The stage behind the artboard. Darkest layer. */
export const STAGE = 'bg-gray-950';
/** Panels, rails, docks — one step up from the stage. */
export const PANEL = 'bg-gray-900';
/** Chrome inside a panel: headers, footers, toolbars. */
export const PANEL_CHROME = 'bg-gray-800/60';
/** Divider between dark panes. */
export const DIVIDER = 'border-black';

/** Text ramp on dark. */
export const TEXT = 'text-gray-100';
export const TEXT_MUTED = 'text-gray-400';
export const TEXT_FAINT = 'text-gray-500';

// ── Type ─────────────────────────────────────────────────────────────────
/** Section heading inside a panel. */
export const HEADING = 'text-xs font-black uppercase tracking-widest text-gray-100';
/** Field label / micro-label. */
export const LABEL = 'text-[10px] font-black uppercase tracking-widest text-gray-400';

// ── Buttons ──────────────────────────────────────────────────────────────
const BUTTON_BASE =
	'inline-flex items-center justify-center gap-2 rounded-xl border-[3px] border-black ' +
	'text-xs font-black uppercase tracking-widest transition-all focus-brutal ' +
	'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0';

/** The affirmative action on a dark surface. */
export const BUTTON_PRIMARY =
	`${BUTTON_BASE} bg-brand-accent text-black px-5 py-2.5 shadow-brutal-sm ` +
	'hover:shadow-brutal-md hover:-translate-y-0.5';

/** Everything else. */
export const BUTTON_SECONDARY =
	`${BUTTON_BASE} bg-gray-800 text-gray-100 px-4 py-2 hover:bg-gray-700`;

/** Destructive. */
export const BUTTON_DANGER =
	`${BUTTON_BASE} bg-brand-danger text-black px-4 py-2 shadow-brutal-sm ` +
	'hover:shadow-brutal-md hover:-translate-y-0.5';

/** Compact button for a toolbar row. */
export const BUTTON_COMPACT =
	'inline-flex items-center gap-1.5 rounded-lg border-[2px] border-black bg-gray-800 ' +
	'px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-100 ' +
	'transition-all hover:bg-gray-700 focus-brutal disabled:opacity-50 disabled:cursor-not-allowed';

/** Icon-only square button. */
export const BUTTON_ICON =
	'inline-flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-black ' +
	'bg-gray-800 text-gray-300 transition-all hover:bg-gray-700 hover:text-gray-100 focus-brutal ' +
	'disabled:opacity-50 disabled:cursor-not-allowed';

// ── Inputs ───────────────────────────────────────────────────────────────
export const INPUT =
	'w-full rounded-xl border-[3px] border-black bg-gray-950 px-3 py-2 text-sm font-bold ' +
	'text-gray-100 placeholder-gray-600 transition-all focus:outline-none ' +
	'focus:shadow-brutal-accent-sm focus:border-brand-accent';

export const INPUT_COMPACT =
	'w-full rounded-lg border-[2px] border-black bg-gray-950 px-2 py-1.5 font-mono text-xs ' +
	'font-bold text-gray-100 placeholder-gray-600 transition-all focus:outline-none ' +
	'focus:border-brand-accent focus:shadow-brutal-accent-sm';

// ── Chips ────────────────────────────────────────────────────────────────
export const CHIP =
	'inline-flex items-center gap-1 rounded-full border-[2px] border-black px-2.5 py-1 ' +
	'text-[10px] font-black uppercase tracking-widest';

export const CHIP_NEUTRAL = `${CHIP} bg-gray-800 text-gray-300`;
export const CHIP_ACCENT = `${CHIP} bg-brand-accent text-black`;
export const CHIP_LIVE = `${CHIP} bg-data-green text-black`;
export const CHIP_DANGER = `${CHIP} bg-brand-danger text-black`;

// ── Cards ────────────────────────────────────────────────────────────────
/** A floating card on a dark surface (render result, error, prompt). */
export const CARD = 'rounded-2xl border-[3px] border-black bg-gray-900 shadow-brutal-lg';

/** An error card. Same frame, danger-tinted. */
export const CARD_ERROR =
	'rounded-2xl border-[3px] border-brand-danger bg-brand-danger/10 p-4 ' +
	'text-sm font-bold text-brand-danger';

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
