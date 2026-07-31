/**
 * Safe-area guides for social video.
 *
 * Reels, TikTok and Shorts all paint their own interface over the video: a
 * caption and handle along the bottom, a column of action buttons up the right,
 * a progress bar and header at the top. A caption placed in any of those bands
 * is covered by someone else's UI in the feed, and the only way to find out is
 * to publish and look.
 *
 * The guides are an overlay on the editing canvas, not a constraint. Plenty of
 * designs deliberately run to the edge, so this never moves or blocks anything
 * — it draws where the chrome lands so the decision is informed.
 *
 * ── Where the numbers come from ───────────────────────────────────────────
 *
 * Fractions of the frame, not pixels, so one set of numbers covers every
 * canvas size. They are deliberately generous: the platforms change their
 * layouts without notice, and a guide that is slightly too cautious costs a
 * little composition room, while one that is too tight costs a covered caption
 * in every video made from the template.
 */

/** Insets as fractions of the frame, per platform family. */
const PRESETS = {
	/*
	 * The 9:16 feeds. The bottom band is the big one — caption, handle, music
	 * ticker — and the right column is the action rail.
	 */
	portrait: {
		id: 'portrait',
		label: 'Reels, TikTok, Shorts',
		top: 0.08,
		bottom: 0.2,
		left: 0.05,
		right: 0.12
	},
	/* Square feed posts carry far less chrome; mostly just padding. */
	square: { id: 'square', label: 'Feed post', top: 0.06, bottom: 0.1, left: 0.05, right: 0.05 },
	/* 4:5 sits in the feed with a caption below the media, not over it. */
	vertical: { id: 'vertical', label: 'Feed video', top: 0.06, bottom: 0.12, left: 0.05, right: 0.05 },
	/* Landscape players put controls along the bottom and a title at the top. */
	landscape: {
		id: 'landscape',
		label: 'YouTube, embeds',
		top: 0.08,
		bottom: 0.12,
		left: 0.05,
		right: 0.05
	}
};

/**
 * The guide preset for a canvas size, chosen by aspect ratio.
 *
 * Ratio rather than exact dimensions, unlike the canvas presets: a 720x1280
 * canvas is not the "Reels" preset but it goes in exactly the same feed and
 * needs exactly the same guides.
 *
 * @param {number} width
 * @param {number} height
 * @returns {{id: string, label: string, top: number, bottom: number, left: number, right: number}}
 */
export const safeAreaFor = (width, height) => {
	const w = Number(width) || 1080;
	const h = Number(height) || 1920;
	const ratio = w / h;

	if (ratio < 0.6) return PRESETS.portrait; // 9:16 and taller
	if (ratio < 0.95) return PRESETS.vertical; // 4:5-ish
	if (ratio < 1.2) return PRESETS.square; // square-ish
	return PRESETS.landscape;
};

/**
 * The guide rectangle in PIXELS for a given canvas.
 *
 * Returned as an inset box so a renderer can draw it directly without repeating
 * the arithmetic, and so the numbers can be tested.
 *
 * @returns {{x: number, y: number, width: number, height: number, preset: string, label: string}}
 */
export const safeAreaBox = (width, height) => {
	const w = Math.max(1, Math.round(Number(width) || 1080));
	const h = Math.max(1, Math.round(Number(height) || 1920));
	const preset = safeAreaFor(w, h);

	const x = Math.round(w * preset.left);
	const y = Math.round(h * preset.top);
	return {
		x,
		y,
		width: Math.max(1, Math.round(w * (1 - preset.left - preset.right))),
		height: Math.max(1, Math.round(h * (1 - preset.top - preset.bottom))),
		preset: preset.id,
		label: preset.label
	};
};

/**
 * Whether a clip strays outside the safe area.
 *
 * Used to warn on the clip rather than only drawing a box: a caption sitting
 * under the TikTok handle is the failure this exists to catch, and someone
 * reading the properties panel is not necessarily looking at the guides.
 *
 * @param {object} clip
 * @param {{width: number, height: number}} composition
 * @returns {{outside: boolean, edges: string[]}}
 */
export const outsideSafeArea = (clip, composition) => {
	const transform = clip?.transform;
	if (!transform) return { outside: false, edges: [] };

	const box = safeAreaBox(composition?.width, composition?.height);
	const x = Number(transform.x);
	const y = Number(transform.y);
	const w = Number(transform.width);
	const h = Number(transform.height);
	if (![x, y, w, h].every(Number.isFinite)) return { outside: false, edges: [] };

	const edges = [];
	if (x < box.x) edges.push('left');
	if (y < box.y) edges.push('top');
	if (x + w > box.x + box.width) edges.push('right');
	if (y + h > box.y + box.height) edges.push('bottom');

	return { outside: edges.length > 0, edges };
};

export { PRESETS as SAFE_AREA_PRESETS };
