/**
 * Reading and writing the clip style properties the engine renders but the
 * studio never exposed: stroke, shadow, corner radius, flip, text spacing and
 * audio fades.
 *
 * These all existed in `@openvideo/core` 1.3.2 already — `IBaseClipStyle` has
 * `stroke`/`shadow`/`borderRadius`, `IClipTransform` has `flip`, `IClipTiming`
 * has `fadeIn`/`fadeOut`. Only the UI was missing. So this module is
 * deliberately thin: it owns the defaults, the clamps, and the two unit
 * conversions that are easy to get wrong, and nothing else.
 *
 * ── The unit trap ─────────────────────────────────────────────────────────
 *
 * `timing.display` is in MICROSECONDS. `timing.fadeIn.duration` is in
 * MILLISECONDS. They sit on the same object, one key apart, and mixing them up
 * produces a fade that is either instant or a thousand times longer than the
 * clip. `fadeMaxMs` is the only place that conversion happens.
 *
 * ── Removal semantics ─────────────────────────────────────────────────────
 *
 * Dropping a stroke or shadow sets the key to `undefined` rather than to a
 * zeroed object. `JSON.stringify` drops undefined keys, so a removed stroke
 * does not persist as `{width: 0}` noise in every saved template, and the
 * engine sees an absent key rather than one it has to interpret.
 */

// ── Defaults ─────────────────────────────────────────────────────────────

/** A stroke you can actually see the moment it is switched on. */
export const DEFAULT_STROKE = { color: '#000000', width: 4 };

/** Offset down-right, which is what "drop shadow" means to most people. */
export const DEFAULT_SHADOW = {
	color: '#000000',
	alpha: 0.5,
	blur: 12,
	offsetX: 0,
	offsetY: 6
};

// ── Limits ───────────────────────────────────────────────────────────────

export const STROKE_WIDTH_MAX = 100;
export const SHADOW_BLUR_MAX = 100;
export const SHADOW_OFFSET_MAX = 200;
export const LETTER_SPACING_MIN = -5;
export const LETTER_SPACING_MAX = 20;
export const LINE_HEIGHT_MIN = 0.5;
export const LINE_HEIGHT_MAX = 3;
export const DEFAULT_LINE_HEIGHT = 1.2;
/** Upstream's ceiling, and long enough that no one asks for more. */
export const FADE_CEILING_MS = 5000;

export const FADE_CURVES = ['linear', 'ease-in', 'ease-out', 'ease-in-out'];

const clamp = (value, min, max) => {
	const n = Number(value);
	if (!Number.isFinite(n)) return min;
	return Math.min(max, Math.max(min, n));
};

// ── Stroke ───────────────────────────────────────────────────────────────

/**
 * The clip's stroke, or null when it has none.
 *
 * A zero width counts as none: the engine draws nothing, so reporting it as
 * present would leave the panel showing an "active" section with no effect.
 */
export const readStroke = (clip) => {
	const stroke = clip?.style?.stroke;
	if (!stroke) return null;
	const width = Number(stroke.width);
	if (!Number.isFinite(width) || width <= 0) return null;
	return {
		color: typeof stroke.color === 'string' ? stroke.color : DEFAULT_STROKE.color,
		width: clamp(width, 0, STROKE_WIDTH_MAX)
	};
};

/**
 * A style patch that sets or clears the stroke.
 *
 * @param {object|null} current - the existing stroke, from readStroke
 * @param {object|null} changes - partial stroke, or null to remove it
 */
export const strokePatch = (current, changes) => {
	if (changes === null) return { stroke: undefined };
	const base = current || DEFAULT_STROKE;
	return {
		stroke: {
			color: changes?.color ?? base.color,
			width: clamp(changes?.width ?? base.width, 0, STROKE_WIDTH_MAX)
		}
	};
};

// ── Shadow ───────────────────────────────────────────────────────────────

/**
 * The clip's shadow, or null when it has none.
 *
 * Unlike stroke there is no "zero means off" rule: a shadow at blur 0 with an
 * offset is a hard-edged shadow, which is a legitimate thing to want.
 */
export const readShadow = (clip) => {
	const shadow = clip?.style?.shadow;
	if (!shadow) return null;
	return {
		color: typeof shadow.color === 'string' ? shadow.color : DEFAULT_SHADOW.color,
		alpha: clamp(shadow.alpha ?? DEFAULT_SHADOW.alpha, 0, 1),
		blur: clamp(shadow.blur ?? DEFAULT_SHADOW.blur, 0, SHADOW_BLUR_MAX),
		offsetX: clamp(shadow.offsetX ?? DEFAULT_SHADOW.offsetX, -SHADOW_OFFSET_MAX, SHADOW_OFFSET_MAX),
		offsetY: clamp(shadow.offsetY ?? DEFAULT_SHADOW.offsetY, -SHADOW_OFFSET_MAX, SHADOW_OFFSET_MAX)
	};
};

/**
 * A style patch that sets or clears the shadow.
 *
 * @param {object|null} current - the existing shadow, from readShadow
 * @param {object|null} changes - partial shadow, or null to remove it
 */
export const shadowPatch = (current, changes) => {
	if (changes === null) return { shadow: undefined };
	const base = current || DEFAULT_SHADOW;
	return {
		shadow: {
			color: changes?.color ?? base.color,
			alpha: clamp(changes?.alpha ?? base.alpha, 0, 1),
			blur: clamp(changes?.blur ?? base.blur, 0, SHADOW_BLUR_MAX),
			offsetX: clamp(changes?.offsetX ?? base.offsetX, -SHADOW_OFFSET_MAX, SHADOW_OFFSET_MAX),
			offsetY: clamp(changes?.offsetY ?? base.offsetY, -SHADOW_OFFSET_MAX, SHADOW_OFFSET_MAX)
		}
	};
};

// ── Corner radius ────────────────────────────────────────────────────────

/**
 * The largest radius that still describes a rounded rectangle.
 *
 * Past half the shorter side the corners have eaten the whole shape and the
 * slider keeps moving with nothing changing on the canvas, which reads as a
 * broken control.
 */
export const maxCornerRadius = (clip) => {
	const width = Number(clip?.transform?.width) || Number(clip?.width) || 0;
	const height = Number(clip?.transform?.height) || Number(clip?.height) || 0;
	const shorter = Math.min(width, height);
	if (!Number.isFinite(shorter) || shorter <= 0) return SHADOW_BLUR_MAX;
	return Math.floor(shorter / 2);
};

export const readCornerRadius = (clip) =>
	clamp(clip?.style?.borderRadius ?? 0, 0, maxCornerRadius(clip));

export const cornerRadiusPatch = (value, clip) => ({
	borderRadius: clamp(value, 0, maxCornerRadius(clip))
});

// ── Flip ─────────────────────────────────────────────────────────────────

/** Flip state, defaulting to neither axis. `flip` may be null on the clip. */
export const readFlip = (clip) => {
	const flip = clip?.transform?.flip;
	return { x: Boolean(flip?.x), y: Boolean(flip?.y) };
};

/**
 * A transform patch toggling one axis, preserving the other.
 *
 * @param {object} clip
 * @param {'x'|'y'} axis
 */
export const flipPatch = (clip, axis) => {
	const current = readFlip(clip);
	const next = { ...current, [axis]: !current[axis] };
	// Both axes off is the same as no flip at all; store it as absent so a clip
	// that was flipped and unflipped serialises identically to one never touched.
	if (!next.x && !next.y) return { flip: undefined };
	return { flip: next };
};

// ── Text spacing ─────────────────────────────────────────────────────────

export const readSpacing = (clip) => ({
	lineHeight: clamp(
		clip?.style?.lineHeight ?? DEFAULT_LINE_HEIGHT,
		LINE_HEIGHT_MIN,
		LINE_HEIGHT_MAX
	),
	letterSpacing: clamp(clip?.style?.letterSpacing ?? 0, LETTER_SPACING_MIN, LETTER_SPACING_MAX)
});

export const spacingPatch = (changes) => {
	const patch = {};
	if (changes?.lineHeight !== undefined) {
		patch.lineHeight = clamp(changes.lineHeight, LINE_HEIGHT_MIN, LINE_HEIGHT_MAX);
	}
	if (changes?.letterSpacing !== undefined) {
		patch.letterSpacing = clamp(changes.letterSpacing, LETTER_SPACING_MIN, LETTER_SPACING_MAX);
	}
	return patch;
};

// ── Fades ────────────────────────────────────────────────────────────────

/**
 * How long a fade may run on this clip, in MILLISECONDS.
 *
 * `timing.display` is microseconds; fades are milliseconds. A fade longer than
 * the clip never finishes, so the clip plays permanently part-faded.
 */
export const fadeMaxMs = (clip) => {
	const display = clip?.timing?.display;
	const from = Number(display?.from);
	const to = Number(display?.to);
	if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return FADE_CEILING_MS;
	const durationMs = (to - from) / 1000;
	return Math.max(0, Math.min(FADE_CEILING_MS, Math.round(durationMs)));
};

/** Fade durations in milliseconds, defaulting to none. */
export const readFade = (clip) => ({
	inMs: clamp(clip?.timing?.fadeIn?.duration ?? 0, 0, fadeMaxMs(clip)),
	outMs: clamp(clip?.timing?.fadeOut?.duration ?? 0, 0, fadeMaxMs(clip))
});

/**
 * A timing patch setting one fade, clamped so the two cannot overlap.
 *
 * A 3s fade-in and a 3s fade-out on a 4s clip is not a thing the engine can
 * express: the ramps cross and the clip never reaches full opacity. Clamping
 * the one being edited against the other keeps the pair coherent, and matches
 * what dragging the slider looks like it should do.
 *
 * @param {object} clip
 * @param {'in'|'out'} which
 * @param {number} ms
 */
export const fadePatch = (clip, which, ms) => {
	const timing = clip?.timing || {};
	const max = fadeMaxMs(clip);
	const other = which === 'in' ? readFade(clip).outMs : readFade(clip).inMs;
	const value = clamp(ms, 0, Math.max(0, max - other));
	const key = which === 'in' ? 'fadeIn' : 'fadeOut';

	return {
		timing: {
			...timing,
			// Zero means no fade, so store it as absent rather than as a
			// zero-duration ramp the engine still has to evaluate every frame.
			[key]: value > 0 ? { duration: value, curve: timing[key]?.curve || 'linear' } : undefined
		}
	};
};
