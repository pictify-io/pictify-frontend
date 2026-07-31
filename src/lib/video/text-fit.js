/**
 * Keeping substituted text inside the box it was designed for.
 *
 * A template is authored once against a placeholder and rendered hundreds of
 * times against real data. `{{speaker_name}}` is designed around "Jane Doe";
 * the dataset contains "Dr. Alexandra Fitzwilliam-Hutchinson". Today the second
 * one runs off the frame, and nobody finds out until the video is published,
 * because the studio only ever shows one set of test values.
 *
 * This is the failure mode that matters most for a template product, and it is
 * silent: the render succeeds, the file is fine, the text is just gone off the
 * edge.
 *
 * ── Applied at SUBSTITUTION, not at render ────────────────────────────────
 *
 * The fit has to be baked into the document when the value lands, so that the
 * browser export and the server render — which share no measurement code — get
 * the same answer. Anything computed live in the editor would not survive the
 * trip to the renderer.
 *
 * ── Why estimation, and why that is acceptable ────────────────────────────
 *
 * Measuring text exactly needs a laid-out font, which means a renderer, which
 * the backend substitution step does not have. So width is ESTIMATED from an
 * average glyph-width ratio.
 *
 * That is fine because of how the estimate is used. `wrap` hands the real work
 * to the engine's own `wordWrap`, which is exact. `shrink` only needs to be
 * approximately right and errs small — text slightly smaller than it had to be
 * is a cosmetic imperfection, text off the edge of the frame is a broken video.
 * Nothing here decides whether text is visible; it decides how comfortably.
 */

/**
 * Average glyph width as a fraction of font size.
 *
 * Measured across the studio's bundled families at their default weights. Real
 * values run about 0.48 to 0.58; the high end is used deliberately so the
 * estimate over-predicts width and shrinks slightly too eagerly rather than
 * leaving text hanging over the edge.
 */
const GLYPH_WIDTH_RATIO = 0.58;

/** Below this, text is unreadable at any sensible viewing size. */
export const MIN_FONT_SIZE = 12;

export const FIT_MODES = [
	{
		id: 'overflow',
		label: 'Overflow',
		hint: 'Let long text run past the box. What templates did before.'
	},
	{
		id: 'wrap',
		label: 'Wrap',
		hint: 'Break onto more lines. The box grows downward.'
	},
	{
		id: 'shrink',
		label: 'Shrink to fit',
		hint: 'Wrap, then reduce the size until it fits the box.'
	},
	{
		id: 'truncate',
		label: 'Truncate',
		hint: 'Cut the text and end with an ellipsis.'
	}
];

export const DEFAULT_FIT = 'overflow';

const isFitMode = (mode) => FIT_MODES.some((m) => m.id === mode);

/** The fit mode set on a clip, defaulting to today's behaviour. */
export const readFit = (clip) => {
	const mode = clip?.metadata?.pictify?.fit;
	return isFitMode(mode) ? mode : DEFAULT_FIT;
};

/**
 * A metadata patch setting a clip's fit mode.
 *
 * Read-modify-write: `metadata.pictify` also carries variable bindings and
 * animation presets, and replacing the object wholesale would erase them.
 */
export const fitPatch = (clip, mode) => {
	if (!isFitMode(mode)) return null;
	const metadata = clip?.metadata || {};
	const pictify = metadata.pictify || {};
	return {
		metadata: {
			...metadata,
			pictify:
				mode === DEFAULT_FIT
					? // Don't store the default — it is what an untouched clip already does.
						Object.fromEntries(Object.entries(pictify).filter(([key]) => key !== 'fit'))
					: { ...pictify, fit: mode }
		}
	};
};

/** Roughly how wide this text renders on one line, in pixels. */
export const estimateWidth = (text, fontSize, letterSpacing = 0) => {
	const length = String(text ?? '').length;
	if (!length) return 0;
	const size = Math.max(1, Number(fontSize) || 1);
	return length * (size * GLYPH_WIDTH_RATIO + (Number(letterSpacing) || 0));
};

/** How many lines this text needs at a given size, wrapping at `boxWidth`. */
export const estimateLines = (text, fontSize, boxWidth, letterSpacing = 0) => {
	const width = estimateWidth(text, fontSize, letterSpacing);
	if (!width || !boxWidth || boxWidth <= 0) return 1;
	return Math.max(1, Math.ceil(width / boxWidth));
};

/** Whether text at this size overflows the box. */
export const overflows = (text, style, box) => {
	const fontSize = Number(style?.fontSize) || 40;
	const lineHeight = Number(style?.lineHeight) || 1.2;
	const lines = estimateLines(text, fontSize, box?.width, style?.letterSpacing);
	return lines * fontSize * lineHeight > (Number(box?.height) || Infinity);
};

/**
 * How many lines the box was DESIGNED for.
 *
 * Derived from the box height at the clip's own font size, which encodes the
 * author's intent: a lower-third name box sized for one line at 41px was meant
 * to hold one line. See the note in shrinkToFit for why that matters.
 */
export const designedLines = (style, box) => {
	const fontSize = Math.max(1, Number(style?.fontSize) || 40);
	const lineHeight = Number(style?.lineHeight) || 1.2;
	const height = Number(box?.height);
	if (!height) return 1;
	return Math.max(1, Math.floor(height / (fontSize * lineHeight)));
};

/**
 * The largest font size at which the text still fits the box.
 *
 * Steps down rather than solving directly: line count is a ceiling function, so
 * the relationship between size and height is not smooth and a closed-form
 * answer overshoots around the wrap points.
 *
 * ── Why the line count is capped ──────────────────────────────────────────
 *
 * Fitting purely by HEIGHT lets text wrap onto more lines than the design had,
 * and clips sit next to each other: a name box that grows from one line to two
 * runs straight into the job title underneath. The render is then technically
 * "fitted" and visibly broken.
 *
 * So the text is held to the number of lines the box was built for. It has to
 * get smaller to manage that, which is the correct trade — the whole point of
 * this mode is that the layout survives whatever the data does.
 */
export const shrinkToFit = (text, style, box) => {
	const startSize = Math.max(MIN_FONT_SIZE, Number(style?.fontSize) || 40);
	const lineHeight = Number(style?.lineHeight) || 1.2;
	const height = Number(box?.height);
	const width = Number(box?.width);
	if (!height || !width) return startSize;

	const maxLines = designedLines(style, box);

	for (let size = startSize; size >= MIN_FONT_SIZE; size -= 1) {
		const lines = estimateLines(text, size, width, style?.letterSpacing);
		if (lines <= maxLines && lines * size * lineHeight <= height) return size;
	}
	return MIN_FONT_SIZE;
};

/**
 * Cut text to what fits, ending in an ellipsis.
 *
 * The ellipsis is part of the budget, so the result genuinely fits rather than
 * fitting-plus-three-dots.
 */
export const truncateToFit = (text, style, box) => {
	const source = String(text ?? '');
	if (!source) return source;

	const fontSize = Number(style?.fontSize) || 40;
	const lineHeight = Number(style?.lineHeight) || 1.2;
	const width = Number(box?.width);
	const height = Number(box?.height);
	if (!width || !height) return source;

	const maxLines = Math.max(1, Math.floor(height / (fontSize * lineHeight)));
	const perLine = Math.max(1, Math.floor(width / (fontSize * GLYPH_WIDTH_RATIO)));
	const budget = maxLines * perLine;
	if (source.length <= budget) return source;

	// Cut on a word boundary where one is close, so the result does not end
	// mid-word for the sake of two characters.
	const cut = source.slice(0, Math.max(1, budget - 1));
	const lastSpace = cut.lastIndexOf(' ');
	const body = lastSpace > budget * 0.6 ? cut.slice(0, lastSpace) : cut;
	return `${body.trimEnd()}…`;
};

/**
 * Apply a clip's fit mode to substituted text.
 *
 * Returns the patch to merge onto the clip. Called from variable substitution
 * with the value already in place.
 *
 * @param {object} clip - a Text or Caption clip, AFTER substitution
 * @returns {{text?: string, style?: object}|null} null when nothing to do
 */
export const applyFit = (clip) => {
	const mode = readFit(clip);
	if (mode === 'overflow') return null;

	const text = clip?.text;
	if (typeof text !== 'string' || !text) return null;

	const style = clip.style || {};
	const box = { width: clip?.transform?.width, height: clip?.transform?.height };
	if (!box.width || !box.height) return null;

	if (mode === 'wrap') {
		// Handed to the engine, which wraps exactly. No estimate involved.
		return { style: { ...style, wordWrap: true, wordWrapWidth: box.width } };
	}

	if (mode === 'shrink') {
		const fontSize = shrinkToFit(text, style, box);
		return {
			style: { ...style, wordWrap: true, wordWrapWidth: box.width, fontSize }
		};
	}

	// truncate
	return {
		text: truncateToFit(text, style, box),
		style: { ...style, wordWrap: true, wordWrapWidth: box.width }
	};
};

/**
 * Which clips would overflow with the values applied.
 *
 * Drives the warning in the variables panel: the point is to see WHICH value
 * breaks the layout, which single-row preview cannot tell you.
 *
 * @param {object} projectJson - with values already applied
 * @returns {Array<{clipId: string, name: string, text: string}>}
 */
export const overflowingClips = (projectJson) => {
	const found = [];
	for (const clip of Object.values(projectJson?.clips || {})) {
		if (!clip || (clip.type !== 'Text' && clip.type !== 'Caption')) continue;
		// A clip that has been told what to do about overflow is not a problem.
		if (readFit(clip) !== 'overflow') continue;
		const box = { width: clip?.transform?.width, height: clip?.transform?.height };
		if (!box.width || !box.height) continue;
		if (overflows(clip.text, clip.style, box)) {
			found.push({ clipId: clip.id, name: clip.name || 'Text', text: clip.text });
		}
	}
	return found;
};
