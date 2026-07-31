/**
 * Clip speed.
 *
 * `timing.playbackRate` has been in the data model and has round-tripped
 * through save and render for a long time with no control anywhere. The engine
 * genuinely consumes it — `playbackRate !== 1` remaps the frame and sample list
 * — so this is a lever that changes the output rather than a stored number.
 *
 * ── Speed is a retiming problem, not a number ─────────────────────────────
 *
 * Setting `playbackRate` alone makes the clip play faster while still occupying
 * the same span on the timeline: the source runs out early and the last frame
 * freezes for the remainder, which reads as a broken render rather than a fast
 * clip. The display window has to shrink by the same factor, which is what
 * `speedPatch` does.
 *
 * ── What was written and then removed ─────────────────────────────────────
 *
 * Colour grading and chroma key controls were built here and taken out again.
 * Both fields are declared in the engine's serialization types
 * (`colorAdjustment`, `IChromaKeyOpts`) and NEITHER is applied by engine-pixi
 * 1.3.2 through the public clip API: `hasColorAdjustment` is not exported at
 * all, and setting either field on a clip changes nothing in the preview or in
 * the render — verified on canvas, not inferred from the types. Twelve grading
 * sliders that silently do nothing would be worse than not offering them.
 *
 * Worth revisiting on an engine bump. The shapes are `ColorAdjustmentBasic`
 * (brightness, contrast, saturation, temperature, hue, highlight, shadow,
 * sharpness, vignette, fade, grain, shine) and
 * `{enabled, color, similarity, spill}`.
 */

export const MIN_SPEED = 0.25;
export const MAX_SPEED = 4;
/** The speeds worth one click, rather than making people drag to exactly 2.00. */
export const SPEED_PRESETS = [0.5, 1, 1.5, 2];

const clamp = (value, min, max) => {
	const n = Number(value);
	if (!Number.isFinite(n)) return null;
	return Math.min(max, Math.max(min, n));
};

/** A clip's current rate, defaulting to normal. */
export const readSpeed = (clip) => {
	const rate = Number(clip?.timing?.playbackRate);
	// A rate of 0 would freeze the clip forever, so it is treated as unset
	// rather than honoured.
	if (!Number.isFinite(rate) || rate <= 0) return 1;
	return clamp(rate, MIN_SPEED, MAX_SPEED);
};

/**
 * A timing patch changing a clip's speed.
 *
 * The display window is rescaled by the same factor, keeping the clip's START
 * fixed so retiming does not shunt it along the timeline.
 *
 * @param {object} clip
 * @param {number} speed
 * @returns {{timing: object}|null} null when the speed is unusable
 */
export const speedPatch = (clip, speed) => {
	const next = clamp(speed, MIN_SPEED, MAX_SPEED);
	if (next === null) return null;

	const timing = clip?.timing || {};
	const display = timing.display || {};
	const from = Number(display.from) || 0;
	const to = Number(display.to);

	if (!Number.isFinite(to) || to <= from) {
		return { timing: { ...timing, playbackRate: next } };
	}

	const previous = readSpeed(clip);
	// The amount of SOURCE this clip covers, independent of how fast it plays.
	// Deriving the new span from this rather than from the current span is what
	// makes 1x -> 2x -> 1x return the original length instead of a quarter of it.
	const sourceSpan = (to - from) * previous;
	const span = Math.max(1, Math.round(sourceSpan / next));

	return {
		timing: {
			...timing,
			playbackRate: next,
			display: { from, to: from + span },
			duration: span
		}
	};
};
