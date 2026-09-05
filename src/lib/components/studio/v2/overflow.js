/**
 * Overflow detection. B03-3.
 *
 * The single most valuable check in the studio, because it catches the failure
 * that only shows up on someone else's data: a card that fits every sample the
 * designer looked at and clips the one customer with a long name.
 *
 * It is a DIAGNOSTIC, not a modal (locked decision 8). Nothing is blocked and
 * nothing is auto-corrected — the fixes change the DESIGN and only a human
 * should choose between them.
 */

/** Elements whose content can exceed their box without the browser reflowing. */
const CLIPS = /hidden|clip/;

/**
 * Find elements whose content does not fit.
 *
 * Two distinct failures, deliberately reported separately because the fixes
 * differ:
 *
 *   `clipped` — the box has a fixed size and overflow is hidden, so content is
 *   invisibly cut. This is the dangerous one: it looks fine in the editor.
 *   `spilling` — content is larger than its box but visible, so it overlaps
 *   whatever is beneath it.
 */
export function findOverflow(doc, view, { root = null } = {}) {
	const scope = root || doc?.body;
	if (!scope) return [];
	const issues = [];

	for (const el of scope.querySelectorAll('[data-pictify-id]')) {
		/*
		 * Skip editor chrome, but not the measuring container itself.
		 *
		 * The off-screen clone used to check every sample is marked as editor UI
		 * so it can never be serialized — which meant closest() matched it for
		 * every element inside and the whole check silently returned nothing.
		 * A diagnostic that always reports "fits" is worse than none.
		 */
		const chrome = el.closest('[data-editor-ui]');
		if (chrome && chrome !== scope) continue;
		const css = view.getComputedStyle(el);
		if (css.display === 'none') continue;

		const overflowsX = el.scrollWidth > el.clientWidth + 1;
		const overflowsY = el.scrollHeight > el.clientHeight + 1;
		if (!overflowsX && !overflowsY) continue;

		const hidden =
			CLIPS.test(css.overflow) || CLIPS.test(css.overflowY) || CLIPS.test(css.overflowX);
		issues.push({
			id: el.getAttribute('data-pictify-id'),
			kind: hidden ? 'clipped' : 'spilling',
			axis: overflowsY ? 'vertical' : 'horizontal',
			// How much is missing, so "nearly fits" reads differently from
			// "half the name is gone".
			overBy: overflowsY
				? Math.round(el.scrollHeight - el.clientHeight)
				: Math.round(el.scrollWidth - el.clientWidth),
			text: (el.textContent || '').trim().slice(0, 60)
		});
	}
	return issues;
}

/**
 * The three fixes offered (locked decision 8). Each changes the DESIGN, never
 * the data — "make it fit" must never mean "shorten the customer's name".
 */
export const FIXES = [
	{
		id: 'shrink',
		label: 'Shrink to fit',
		detail: 'Reduce the size until the longest sample fits, with a minimum.'
	},
	{
		id: 'clamp',
		label: 'Allow two lines, then ellipsis',
		detail: 'Wrap to a second line and trim beyond it.'
	},
	{
		id: 'display-name',
		label: 'Use a display name',
		detail: 'Set a shorter name for this account in Data.'
	}
];

/**
 * Apply a fix to an element's inline style.
 *
 * Returns the patch rather than mutating, so the caller commits it as one
 * transaction and undo puts back exactly what was there.
 */
export function fixStyles(fixId, el, view) {
	if (fixId === 'clamp') {
		return {
			display: '-webkit-box',
			'-webkit-line-clamp': '2',
			'-webkit-box-orient': 'vertical',
			overflow: 'hidden'
		};
	}
	if (fixId === 'shrink') {
		const current = parseFloat(view.getComputedStyle(el).fontSize) || 16;
		// A floor, because shrinking without one produces a card whose headline
		// is unreadable — technically fitting and practically useless.
		const next = Math.max(12, Math.round(current * 0.85));
		return { 'font-size': `${next}px` };
	}
	return null;
}

/**
 * A one-line summary for the status bar.
 *
 * Counts ELEMENTS and SAMPLES separately: "1 element clips on 2 of 5 samples"
 * tells the buyer both how widespread it is and how specific.
 */
export function summarize(bySample) {
	const failing = Object.entries(bySample).filter(([, issues]) => issues.length);
	if (!failing.length) return { ok: true, label: 'All samples fit' };
	const elements = new Set(failing.flatMap(([, issues]) => issues.map((i) => i.id)));
	const total = Object.keys(bySample).length;
	return {
		ok: false,
		label: `${elements.size} ${elements.size === 1 ? 'element clips' : 'elements clip'} on ${
			failing.length
		} of ${total} samples`,
		elements: [...elements],
		samples: failing.map(([id]) => id)
	};
}
