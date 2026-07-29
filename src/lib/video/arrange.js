/**
 * Align, distribute and stacking order for the video studio.
 *
 * `transform.x/y` is the clip's TOP-LEFT corner, not its centre — verified by
 * rendering an 80x80 box at (0,0) and at (240,240) in a 320x320 composition and
 * checking which quadrant lit up. Every formula here depends on that, so if a
 * future engine bump changes the anchor, these tests fail loudly.
 *
 * Alignment targets the ARTBOARD rather than the selection's bounding box.
 * With one clip selected the two are indistinguishable; with several, aligning
 * to the artboard is the predictable reading of "align left" and does not
 * change meaning depending on what else happens to be selected.
 *
 * Pure: every function returns patches. Nothing here touches the engine, which
 * is what makes it testable without a browser.
 */

/** Alignment axes, in the order they appear in the UI. */
export const ALIGNMENTS = [
	{ id: 'left', axis: 'x', label: 'Align left', icon: 'fa-align-left' },
	{ id: 'centerH', axis: 'x', label: 'Center horizontally', icon: 'fa-align-center' },
	{ id: 'right', axis: 'x', label: 'Align right', icon: 'fa-align-right' },
	{ id: 'top', axis: 'y', label: 'Align top', icon: 'fa-arrow-up' },
	{ id: 'middleV', axis: 'y', label: 'Center vertically', icon: 'fa-arrows-up-down' },
	{ id: 'bottom', axis: 'y', label: 'Align bottom', icon: 'fa-arrow-down' }
];

const size = (clip) => ({
	width: clip?.transform?.width ?? 0,
	height: clip?.transform?.height ?? 0
});

/**
 * The transform patch that aligns one clip within the composition.
 *
 * @param {Object} clip
 * @param {string} alignment - an ALIGNMENTS id
 * @param {Object} composition - { width, height }
 * @returns {Object|null} a partial transform, or null when the id is unknown
 */
export const alignPatch = (clip, alignment, composition) => {
	const { width, height } = size(clip);
	const compW = composition?.width ?? 0;
	const compH = composition?.height ?? 0;

	switch (alignment) {
		case 'left':
			return { x: 0 };
		case 'centerH':
			return { x: Math.round((compW - width) / 2) };
		case 'right':
			return { x: Math.round(compW - width) };
		case 'top':
			return { y: 0 };
		case 'middleV':
			return { y: Math.round((compH - height) / 2) };
		case 'bottom':
			return { y: Math.round(compH - height) };
		default:
			return null;
	}
};

/**
 * Even spacing across the selection's own extent, along one axis.
 *
 * The outermost two clips stay put — that is what makes it "distribute" rather
 * than "spread": the user has already decided where the group begins and ends.
 * Needs three clips; with two there is nothing between them to move.
 *
 * @param {Array} clips
 * @param {'x'|'y'} axis
 * @returns {Array<{id: string, patch: Object}>}
 */
export const distributePatches = (clips, axis) => {
	if (!Array.isArray(clips) || clips.length < 3) return [];
	const dimension = axis === 'x' ? 'width' : 'height';

	const ordered = [...clips].sort(
		(a, b) => (a.transform?.[axis] ?? 0) - (b.transform?.[axis] ?? 0)
	);
	const first = ordered[0];
	const last = ordered[ordered.length - 1];

	const start = first.transform?.[axis] ?? 0;
	const end = (last.transform?.[axis] ?? 0) + (last.transform?.[dimension] ?? 0);
	const totalSize = ordered.reduce((sum, c) => sum + (c.transform?.[dimension] ?? 0), 0);
	// Negative when the clips overlap more than the span allows; clamping to 0
	// then stacks them flush rather than moving them backwards past each other.
	const gap = Math.max(0, (end - start - totalSize) / (ordered.length - 1));

	const patches = [];
	let cursor = start;
	ordered.forEach((clip, index) => {
		if (index > 0 && index < ordered.length - 1) {
			patches.push({ id: clip.id, patch: { [axis]: Math.round(cursor) } });
		}
		cursor += (clip.transform?.[dimension] ?? 0) + gap;
	});
	return patches;
};

/** Stacking operations, in UI order. */
export const ORDER_OPS = [
	{ id: 'front', label: 'Bring to front', icon: 'fa-angles-up' },
	{ id: 'forward', label: 'Bring forward', icon: 'fa-angle-up' },
	{ id: 'backward', label: 'Send backward', icon: 'fa-angle-down' },
	{ id: 'back', label: 'Send to back', icon: 'fa-angles-down' }
];

/**
 * New zIndex values for a stacking change.
 *
 * Transition clips are excluded from the bounds: the engine places them above
 * the clips they blend, so counting them would make "bring to front" drift
 * upward every time it is used.
 *
 * @param {Array} selected - clips being moved
 * @param {Array} allClips - every clip in the document
 * @param {string} op - an ORDER_OPS id
 * @returns {Array<{id: string, zIndex: number}>}
 */
export const orderPatches = (selected, allClips, op) => {
	const others = (allClips || []).filter(
		(c) => c && c.type !== 'Transition' && !selected.some((s) => s.id === c.id)
	);
	// Nothing else in the document means there is nothing to be in front of or
	// behind, so front/back are no-ops rather than a jump to an arbitrary index.
	if (!others.length && (op === 'front' || op === 'back')) return [];

	const indices = others.map((c) => c.transform?.zIndex ?? 0);
	const max = indices.length ? Math.max(...indices) : 0;
	const min = indices.length ? Math.min(...indices) : 0;

	return selected
		.map((clip) => {
			const current = clip.transform?.zIndex ?? 0;
			let next = current;
			if (op === 'front') next = max + 1;
			else if (op === 'back') next = min - 1;
			else if (op === 'forward') next = current + 1;
			else if (op === 'backward') next = current - 1;
			return { id: clip.id, zIndex: next };
		})
		.filter((p) => p.zIndex !== (selected.find((c) => c.id === p.id)?.transform?.zIndex ?? 0));
};

/**
 * The bounding box of a set of clips, in composition coordinates.
 * Useful for showing the user what a multi-selection covers.
 */
export const selectionBounds = (clips) => {
	if (!clips?.length) return null;
	let left = Infinity;
	let top = Infinity;
	let right = -Infinity;
	let bottom = -Infinity;
	for (const clip of clips) {
		const x = clip.transform?.x ?? 0;
		const y = clip.transform?.y ?? 0;
		const { width, height } = size(clip);
		left = Math.min(left, x);
		top = Math.min(top, y);
		right = Math.max(right, x + width);
		bottom = Math.max(bottom, y + height);
	}
	return { left, top, right, bottom, width: right - left, height: bottom - top };
};
