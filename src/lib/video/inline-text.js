/**
 * Inline canvas text editing.
 *
 * The studio draws text with Pixi, so there is no DOM text node to focus. This
 * module supports a DOM overlay positioned exactly over the clip: the user
 * types into a real <textarea> that looks like the rendered text, and the
 * document is written once on commit.
 *
 * ── What was measured, not assumed ─────────────────────────────────────────
 *
 * Every number below was checked in a browser against the running engine,
 * because all three of these would fail silently if guessed wrong:
 *
 *   1. `clip:dblclick` IS emitted — the engine fires it for Text and Caption
 *      clips only, on two pointer-downs under 350ms on the same clip. A
 *      declared-but-never-emitted event would have made the feature dead on
 *      arrival with no error anywhere.
 *
 *   2. `artboard.toGlobal()` returns CSS pixels relative to the canvas element,
 *      NOT drawing-buffer pixels. This is the opposite of what the renderer's
 *      resolution suggests: editorHost passes `previewScale: 0.75`, which the
 *      engine uses as the Pixi resolution, so the canvas buffer (748x514 in the
 *      harness) is smaller than its CSS box (997x685). Dividing by resolution —
 *      the obvious move — puts the overlay 25% off. Confirmed by arithmetic on
 *      both axes: composition y=400 at fit scale 0.3359 plus the 20px letterbox
 *      is 154.4, and toGlobal reported 154.
 *
 *   3. The sprite underneath CANNOT be hidden. Not for want of trying:
 *      `studio.spriteRenderers` does expose each clip's Pixi object, and
 *      setting `.visible = false` plus `pixiApp.render()` does blank the text.
 *      But the engine owns that property and reasserts it on the next store
 *      publish — and opening the editor changes the selection, which publishes.
 *      Instrumented: the component's hide returned true, the sprite object
 *      identity never changed, and `.visible` was back to true 60ms later.
 *
 *      So the overlay masks instead, with a near-opaque backdrop keyed to the
 *      text's own colour. Less of an illusion than hiding would have been, and
 *      it depends on nothing internal.
 *
 * Two other designs were tried and rejected:
 *
 *   - Updating the clip on every keystroke, so the sprite itself is the live
 *     preview and nothing needs masking. The engine exposes
 *     `beginHistoryGroup()` / `endHistoryGroup()`, which looked like it would
 *     collapse the edit into one undo entry — it does not for `clip.update`.
 *     Measured: typing five characters inside a group then pressing undo once
 *     went from "Brand" to "Bran". A sentence would cost a sentence of undos.
 *
 *   - A fully transparent overlay showing only a caret, letting the sprite draw
 *     the glyphs. Needs the live document updates above, so it dies with them.
 *
 * One earlier round of this was verified with `renderer.extract.pixels()`,
 * which forces a render of its own and so reported a hide that the on-screen
 * canvas never performed. A screenshot showed the old and new text plainly
 * superimposed. Read pixels from a screenshot, not from a call that repaints.
 *
 * The pure functions here are unit tested. `screenRect` is the only one that
 * talks to the engine, so it is verified in a browser instead.
 */

/** Clip types the engine fires `clip:dblclick` for. */
export const INLINE_EDITABLE_TYPES = ['Text', 'Caption'];

export const isInlineEditable = (clip) =>
	!!clip && INLINE_EDITABLE_TYPES.includes(clip.type) && !clip.locked;

/*
 * Font weights, longest token first.
 *
 * "ExtraBold" and "SemiBold" both contain "Bold", so a naive scan matches the
 * wrong one and renders a semibold heading at 700. Order is the fix, and the
 * tests pin it.
 */
const WEIGHT_TOKENS = [
	['extrablack', 950],
	['extrabold', 800],
	['ultrabold', 800],
	['extralight', 200],
	['ultralight', 200],
	['semibold', 600],
	['demibold', 600],
	['thin', 100],
	['light', 300],
	['book', 400],
	['normal', 400],
	['regular', 400],
	['medium', 500],
	['bold', 700],
	['black', 900],
	['heavy', 900]
];

/**
 * CSS font-weight for a font's display name or PostScript name.
 * Falls back to 400 — an unknown face is far more likely to be a regular than
 * anything else, and a wrong-but-plausible weight beats no text.
 */
export const weightFromFontName = (name) => {
	const flat = String(name || '')
		.toLowerCase()
		.replace(/[\s_-]/g, '');
	for (const [token, weight] of WEIGHT_TOKENS) {
		if (flat.includes(token)) return weight;
	}
	return 400;
};

export const isItalicFontName = (name) => /italic|oblique/i.test(String(name || ''));

/**
 * The clip's typography as CSS for the overlay.
 *
 * Not pixel-exact, and it cannot be: the engine rasterises the actual TTF from
 * `style.fontUrl`, while the DOM uses whatever webfont the app has loaded under
 * that family name. Close enough that the overlay reads as the same text, which
 * is what an editing affordance needs.
 *
 * @param {Object} clip
 * @param {number} scale - composition px per CSS px (artboard.worldTransform.a)
 * @param {Object|null} font - a fonts.ts entry, when the PostScript name resolves
 * @returns {Object} camelCase CSS properties
 */
export const overlayTypography = (clip, scale, font) => {
	const style = clip?.style || {};
	const postScriptName = style.fontFamily || '';
	// `fontFamily` on a clip is a PostScript name ("Inter-Bold"), which is not a
	// CSS family. The real family plus a derived weight is the honest mapping.
	const family = font?.family || postScriptName;
	const nameForWeight = font?.fullName || postScriptName;

	const fontSize = Math.max(1, (Number(style.fontSize) || 40) * scale);

	// Deduped: when the clip's family IS the fallback, "Inter, Inter, ..." is
	// harmless but reads as a bug to anyone inspecting the element.
	const stack = ['Inter', 'system-ui', 'sans-serif'].filter((f) => f !== family);

	return {
		fontFamily: [`"${family}"`, ...stack.map((f) => (f === 'Inter' ? `"${f}"` : f))].join(', '),
		fontSize: `${fontSize}px`,
		// An explicit numeric weight from the clip wins; otherwise read the face.
		fontWeight: String(
			typeof style.fontWeight === 'number'
				? style.fontWeight
				: style.fontWeight && style.fontWeight !== 'normal'
					? style.fontWeight
					: weightFromFontName(nameForWeight)
		),
		fontStyle: style.fontStyle === 'italic' || isItalicFontName(nameForWeight) ? 'italic' : 'normal',
		color: style.color || style.fill || '#ffffff',
		textAlign: style.textAlign || style.align || 'center',
		// Pixi's default line box is close to 1.2em when lineHeight is unset.
		lineHeight: style.lineHeight ? `${Number(style.lineHeight) * scale}px` : '1.2',
		letterSpacing: style.letterSpacing ? `${Number(style.letterSpacing) * scale}px` : 'normal'
	};
};

/**
 * The patch that commits an edit, or null when nothing changed.
 *
 * Returning null matters: writing an identical value would still push an undo
 * entry, so opening and closing the editor without typing would silently cost
 * the user an undo step.
 */
export const textPatch = (clip, nextText) => {
	const next = String(nextText ?? '');
	if (next === String(clip?.text ?? '')) return null;
	return { text: next };
};

/**
 * The clip's box in CSS pixels, relative to the canvas element.
 *
 * `toGlobal` is the whole trick — it walks the container hierarchy, so zoom, pan
 * and the fit-to-screen scale are all included without reimplementing any of
 * them. See the module header for why no resolution division belongs here.
 *
 * @returns {{left:number, top:number, width:number, height:number, scale:number}|null}
 */
export const screenRect = (studio, clip) => {
	const artboard = studio?.artboard;
	const transform = clip?.transform;
	if (!artboard || !transform || typeof artboard.toGlobal !== 'function') return null;

	const topLeft = artboard.toGlobal({ x: transform.x || 0, y: transform.y || 0 });
	const bottomRight = artboard.toGlobal({
		x: (transform.x || 0) + (transform.width || 0),
		y: (transform.y || 0) + (transform.height || 0)
	});
	// worldTransform.a is the artboard's x-scale. Deriving it from the corners
	// instead would divide by zero on a zero-width clip.
	const scale = artboard.worldTransform?.a || 1;

	return {
		left: topLeft.x,
		top: topLeft.y,
		width: Math.max(1, bottomRight.x - topLeft.x),
		height: Math.max(1, bottomRight.y - topLeft.y),
		scale
	};
};

/*
 * Perceptual luminance of a #rgb / #rrggbb colour, 0 (black) to 1 (white).
 * The sRGB coefficients, not a flat average: green reads far brighter than blue
 * at the same value, and averaging picks the wrong backdrop for colours like
 * pure blue.
 */
export const luminance = (hex) => {
	const raw = String(hex || '').trim().replace(/^#/, '');
	const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
	if (!/^[0-9a-f]{6}$/i.test(full)) return 0;
	const n = parseInt(full, 16);
	const r = ((n >> 16) & 255) / 255;
	const g = ((n >> 8) & 255) / 255;
	const b = (n & 255) / 255;
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * The backdrop the overlay sits on.
 *
 * Near-opaque because it has to hide the clip's own rendered text, which stays
 * on screen while editing (see the module header). Keyed to the text colour
 * rather than fixed dark: a template with black text on a pale background would
 * be unreadable as dark-on-dark, and legibility while typing beats matching the
 * surrounding artwork.
 */
export const overlayBackdrop = (textColor) =>
	luminance(textColor) > 0.5 ? 'rgba(9, 9, 11, 0.94)' : 'rgba(250, 250, 250, 0.94)';
