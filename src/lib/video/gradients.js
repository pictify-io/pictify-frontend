/**
 * Gradients for the video studio.
 *
 * Three surfaces, two mechanisms, one vocabulary.
 *
 *   BACKGROUNDS  — a full-bleed `Backdrop` clip with backdropType 'gradient'.
 *                  Colours live in `style.colors`; the angle rides on
 *                  `style.gradientType` as "linear:<deg>".
 *   SHAPE FILLS  — a CSS gradient string in `style.fill`. The patched engine
 *                  fills the already-built path with a gradient texture, so
 *                  rounded corners and circles work.
 *   TEXT         — NOT SUPPORTED. Text is drawn as bitmap glyphs, so a gradient
 *                  fill spans one glyph cell of the font atlas and every letter
 *                  comes out one flat colour. A gradient set on text degrades
 *                  to its first stop rather than rendering garbage, and the
 *                  studio does not offer the control.
 *
 * Both mechanisms exist because Shape and Backdrop each rebuild `style` from a
 * FIXED key list on every deserialize, so a bespoke descriptor key is silently
 * dropped. Each rides inside a key the clip already preserves.
 *
 * ── The angle carrier ──────────────────────────────────────────────────
 * BackdropClip rebuilds `style` from a FIXED key list in its constructor and
 * in fromObject, so a custom `gradientAngle` key is silently replaced by the
 * default on every deserialize. `gradientType` IS preserved, so the angle
 * rides on it as `linear:<degrees>`. The patched engine
 * (patches/@openvideo+engine-pixi+1.3.2.patch) parses it back out.
 *
 * Angles are CSS degrees, matching GradientColorPicker.svelte on the image
 * side: 0 = to top, 90 = to right, 180 = to bottom, 270 = to left.
 */

/** Presets shared with the HTML editor's GradientColorPicker, verbatim. */
export const GRADIENT_PRESETS = [
	{ id: 'sunset', name: 'Sunset', colors: ['#FF512F', '#F09819'], angle: 90 },
	{ id: 'ocean', name: 'Ocean', colors: ['#2E3192', '#1BFFFF'], angle: 90 },
	{ id: 'purple', name: 'Purple', colors: ['#667eea', '#764ba2'], angle: 135 },
	{ id: 'fire', name: 'Fire', colors: ['#f83600', '#f9d423'], angle: 45 },
	{ id: 'forest', name: 'Forest', colors: ['#134E5E', '#71B280'], angle: 90 },
	{ id: 'rose', name: 'Rose', colors: ['#ee0979', '#ff6a00'], angle: 90 },
	// Two studio-only additions: a neutral scrim and a brand wash. The scrim is
	// only possible because the patch passes colour STRINGS to addColorStop —
	// the upstream number path drops alpha and renders "transparent" as white.
	{ id: 'scrim', name: 'Scrim', colors: ['#00000000', '#000000e6'], angle: 180 },
	{ id: 'brand', name: 'Brand', colors: ['#ffc480', '#ff6b6b'], angle: 135 }
];

export const GRADIENT_TYPES = [
	{ value: 'linear', label: 'Linear' },
	{ value: 'radial', label: 'Radial' }
];

export const DEFAULT_GRADIENT_ANGLE = 180;
export const MAX_GRADIENT_STOPS = 5;
export const MIN_GRADIENT_STOPS = 2;

const clampAngle = (angle) => {
	const num = Number(angle);
	if (!Number.isFinite(num)) return DEFAULT_GRADIENT_ANGLE;
	return ((Math.round(num) % 360) + 360) % 360;
};

/**
 * Build the `gradientType` value the engine stores.
 * Radial ignores the angle; linear carries it.
 */
export const toGradientType = (type, angle) =>
	type === 'radial' ? 'radial' : `linear:${clampAngle(angle)}`;

/** Read `{ type, angle }` back out of a stored gradientType. */
export const fromGradientType = (raw) => {
	const value = String(raw || 'linear');
	if (value.startsWith('radial')) return { type: 'radial', angle: DEFAULT_GRADIENT_ANGLE };
	const [, degrees] = value.split(':');
	const angle = Number(degrees);
	return {
		type: 'linear',
		angle: Number.isFinite(angle) ? clampAngle(angle) : DEFAULT_GRADIENT_ANGLE
	};
};

/** Is this clip one of ours? */
export const isGradientClip = (clip) =>
	clip?.type === 'Backdrop' && (clip?.style?.backdropType || clip?.backdropType) === 'gradient';

/**
 * The gradient a Backdrop clip currently describes, in editor terms.
 * @returns {{ type: string, angle: number, colors: string[] }}
 */
export const readGradient = (clip) => {
	const style = clip?.style || {};
	const { type, angle } = fromGradientType(style.gradientType);
	const colors = Array.isArray(style.colors) && style.colors.length
		? [...style.colors]
		: ['#6A5AF9', '#B14EFF'];
	return { type, angle, colors };
};

/**
 * The style patch that applies a gradient to a Backdrop clip.
 *
 * `backdropType` is set in BOTH places because rebuildBackdrop reads
 * `style.backdropType || this.backdropType`.
 */
export const gradientStyle = ({ type, angle, colors }) => ({
	backdropType: 'gradient',
	colors: [...colors],
	gradientType: toGradientType(type, angle)
});

/** A CSS gradient string for swatches and the timeline row preview. */
export const gradientCss = ({ type, angle, colors }) => {
	const stops = colors.join(', ');
	return type === 'radial'
		? `radial-gradient(circle at 50% 50%, ${stops})`
		: `linear-gradient(${clampAngle(angle)}deg, ${stops})`;
};

/**
 * A complete Backdrop clip for the engine.
 *
 * `src` is MANDATORY: core.project.import drops any non-Text/Caption/Effect/
 * Transition clip with an empty src, silently, so a gradient authored without
 * one vanishes on the next load.
 *
 * @param {Object} preset - { colors, angle, type? }
 * @param {Object} composition - { width, height, durationUs }
 * @param {Object} [options] - { fullBleed, zIndex }
 */
export const createGradientClip = (preset, composition, { fullBleed = true, zIndex = 0 } = {}) => {
	const width = fullBleed ? composition.width : Math.round(composition.width * 0.6);
	const height = fullBleed ? composition.height : Math.round(composition.height * 0.3);
	const duration = composition.durationUs || 5_000_000;
	const type = preset.type || 'linear';

	return {
		type: 'Backdrop',
		name: preset.name ? `${preset.name} gradient` : 'Gradient',
		backdropType: 'gradient',
		src: 'backdrop://gradient',
		timing: {
			display: { from: 0, to: duration },
			trim: { from: 0, to: duration },
			duration,
			playbackRate: 1
		},
		transform: {
			x: fullBleed ? 0 : Math.round((composition.width - width) / 2),
			y: fullBleed ? 0 : Math.round((composition.height - height) / 2),
			width,
			height,
			angle: 0,
			opacity: 1,
			zIndex
		},
		style: gradientStyle({ type, angle: preset.angle, colors: preset.colors }),
		metadata: {},
		locked: false
	};
};

// ── CSS-string gradients (shape fills) ───────────────────────────────────
//
// A Shape's gradient rides IN its `fill` string as CSS, because ShapeClip
// rebuilds `style` from a fixed key list on every deserialize and would drop a
// separate descriptor key. The patched engine parses the same format, and
// fills the already-built path with a gradient texture — so rounded corners
// and circles gradient correctly, which a Backdrop rectangle could never do.
//
// Bonus: it is the exact representation the HTML editor's GradientColorPicker
// already produces, so one gradient vocabulary spans images and video.

/** Is this fill value a gradient rather than a solid colour? */
export const isGradientFill = (value) =>
	typeof value === 'string' &&
	(value.trim().startsWith('linear-gradient(') || value.trim().startsWith('radial-gradient('));

/**
 * Parse a CSS gradient string into editor terms.
 * Mirrors __pictifyParseGradient in the engine patch — keep them in step.
 * @returns {{type: string, angle: number, colors: string[]}|null}
 */
export const parseGradientFill = (value) => {
	if (!isGradientFill(value)) return null;
	const text = value.trim();
	const type = text.startsWith('radial-gradient(') ? 'radial' : 'linear';
	const inner = text.slice(text.indexOf('(') + 1, text.lastIndexOf(')'));

	// Split on top-level commas so rgba(...) survives.
	const parts = [];
	let depth = 0;
	let current = '';
	for (const ch of inner) {
		if (ch === '(') depth += 1;
		if (ch === ')') depth -= 1;
		if (ch === ',' && depth === 0) {
			parts.push(current.trim());
			current = '';
		} else {
			current += ch;
		}
	}
	if (current.trim()) parts.push(current.trim());

	let angle = DEFAULT_GRADIENT_ANGLE;
	if (parts.length && /^-?[\d.]+deg$/.test(parts[0])) angle = parseFloat(parts.shift());
	else if (parts.length && /^(circle|ellipse|at )/.test(parts[0])) parts.shift();

	const colors = parts.filter(Boolean);
	if (colors.length < 2) return null;
	return { type, angle, colors };
};

/** The CSS string to store in a Shape's `style.fill`. */
export const toGradientFill = ({ type, angle, colors }) => gradientCss({ type, angle, colors });

/**
 * A solid colour standing in for a gradient where one cannot render (text) or
 * cannot be edited (a native colour swatch).
 */
export const gradientFallbackColor = (value) => {
	const parsed = parseGradientFill(value);
	return parsed ? parsed.colors[0] : value;
};
