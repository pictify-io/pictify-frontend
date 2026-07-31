/**
 * Hand-authored keyframes.
 *
 * The studio has 123 animation presets and no way to say "move it from here to
 * there". That is the difference between a template tool and a video editor,
 * and the engine has always been able to do it — presets are only a generator
 * for the same keyframe map this module lets people write directly.
 *
 * ── The format, and three ways it fails ───────────────────────────────────
 *
 * Established by decoding rendered frames (see animations.js, which composes
 * presets into the identical structure):
 *
 *   clip.animations = [{
 *     type:    'keyframes',                          // a REGISTRY type
 *     options: { duration: <MICROSECONDS>, easing, iterCount },
 *     params:  { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
 *   }]
 *
 *   - `type` must be a registry name. A preset name there fails the render with
 *     `Animation "fadeIn" not found in registry`.
 *   - `duration` is MICROSECONDS. Milliseconds finish the animation in the
 *     first few frames, which reads as "it does nothing".
 *   - The SINGULAR `clip.animation` field deserializes and is then never
 *     applied. Its type definition looks more inviting than `animations[]` —
 *     it even names `w` and `h` — and it renders nothing at all.
 *
 * ── The property vocabulary is the engine's, not the type definition's ────
 *
 * `animation.keyFrames` in the .d.ts claims `{x, y, w, h, angle, opacity}`, but
 * that is the dead field. The properties the LIVE path animates are the ones
 * its own 123 presets use, read out of the registry:
 *
 *   angle, blur, brightness, mirror, motionBlur, opacity, scale, scaleX,
 *   scaleY, x, y
 *
 * `x` and `y` are OFFSETS from where the clip already sits, and `scale` is a
 * multiplier — a keyframe does not move a clip to an absolute position, it
 * displaces it. Neutral is 0 for offsets and 1 for scale/opacity.
 *
 * ── One animation slot ────────────────────────────────────────────────────
 *
 * The engine gives a clip ONE animation. Presets and hand-authored keyframes
 * are therefore mutually exclusive: adopting one replaces the other. That is a
 * product fact, not a limitation of this module, and the UI has to say so
 * rather than silently discarding the user's preset.
 */

/** The properties worth offering, in panel order. */
export const KEYFRAME_PROPS = [
	{ name: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01, neutral: 1 },
	{ name: 'scale', label: 'Scale', min: 0, max: 4, step: 0.01, neutral: 1 },
	{ name: 'x', label: 'Offset X', min: -2000, max: 2000, step: 1, neutral: 0 },
	{ name: 'y', label: 'Offset Y', min: -2000, max: 2000, step: 1, neutral: 0 },
	{ name: 'angle', label: 'Rotation', min: -360, max: 360, step: 1, neutral: 0 },
	{ name: 'blur', label: 'Blur', min: 0, max: 40, step: 0.5, neutral: 0 }
];

export const KEYFRAME_TYPE = 'keyframes';

const propSpec = (name) => KEYFRAME_PROPS.find((p) => p.name === name) || null;

const clamp = (value, min, max) => {
	const n = Number(value);
	if (!Number.isFinite(n)) return null;
	return Math.min(max, Math.max(min, n));
};

/**
 * A fraction 0..1 as a percentage key.
 *
 * Rounded to whole percent because that is the resolution the engine's own
 * presets use, and because two stops that differ by a hundredth of a percent
 * are the same stop as far as anyone dragging a marker is concerned.
 */
export const toStop = (fraction) => `${Math.round(clamp(fraction, 0, 1) * 100)}%`;

/** A percentage key back to a fraction, or null when it is not one. */
export const fromStop = (stop) => {
	const value = parseFloat(String(stop));
	if (!Number.isFinite(value)) return null;
	return clamp(value / 100, 0, 1);
};

/** Whether this clip's animation slot holds hand-authored keyframes. */
export const hasKeyframes = (clip) => {
	const animation = clip?.animations?.[0];
	return animation?.type === KEYFRAME_TYPE && !!animation.params;
};

/**
 * Whether the slot holds a PRESET, which hand-authoring would replace.
 *
 * Presets are also stored as `type: 'keyframes'`, so the two are told apart by
 * the metadata animations.js writes alongside them. Without that check,
 * adopting keyframes would look like a no-op and then silently drop the
 * preset the moment anything was edited.
 */
export const hasPreset = (clip) => {
	const meta = clip?.metadata?.pictify?.animation;
	return Boolean(meta && (meta.inPreset || meta.outPreset || meta.emphasisPreset));
};

/**
 * The clip's keyframes as a sorted list.
 *
 * @param {object} clip
 * @returns {Array<{at: number, props: Record<string, number>}>} at is 0..1
 */
export const readKeyframes = (clip) => {
	if (!hasKeyframes(clip)) return [];
	const params = clip.animations[0].params || {};

	return Object.entries(params)
		.map(([stop, props]) => ({ at: fromStop(stop), props: { ...(props || {}) } }))
		.filter((frame) => frame.at !== null)
		.sort((a, b) => a.at - b.at);
};

/**
 * Build the `animations` array from a keyframe list.
 *
 * @param {Array<{at: number, props: object}>} frames
 * @param {number} durationUs - the clip's display duration, MICROSECONDS
 * @returns {Array|null} null when there is nothing to animate
 */
export const writeKeyframes = (frames, durationUs) => {
	const usable = (frames || []).filter(
		(frame) => frame && Object.keys(frame.props || {}).length > 0
	);
	// A single stop is a static offset, not an animation, and the engine would
	// hold it for the whole clip. Two stops is the minimum that moves.
	if (usable.length < 2) return null;

	const params = {};
	for (const frame of usable) {
		// Later stops win on a collision, which is what dragging one onto
		// another looks like it should do.
		params[toStop(frame.at)] = { ...frame.props };
	}

	return [
		{
			type: KEYFRAME_TYPE,
			options: {
				duration: Math.max(1, Math.round(Number(durationUs) || 0)),
				easing: 'linear',
				iterCount: 1
			},
			params
		}
	];
};

/**
 * Set one property at one stop.
 *
 * Creates the stop if it does not exist. Returns a NEW list; nothing here
 * mutates, because the caller holds the previous value for undo.
 */
export const setKeyframe = (frames, at, prop, value) => {
	const spec = propSpec(prop);
	if (!spec) return frames || [];
	const next = clamp(value, spec.min, spec.max);
	if (next === null) return frames || [];

	const fraction = clamp(at, 0, 1);
	const stop = toStop(fraction);
	const out = (frames || []).map((frame) => ({ at: frame.at, props: { ...frame.props } }));

	const existing = out.find((frame) => toStop(frame.at) === stop);
	if (existing) {
		existing.props[prop] = next;
	} else {
		out.push({ at: fromStop(stop), props: { [prop]: next } });
	}
	return out.sort((a, b) => a.at - b.at);
};

/**
 * Remove one property from one stop, and the stop itself once it is empty.
 *
 * An empty stop is invisible in the editor but still occupies a marker
 * position, so leaving it behind produces markers that cannot be selected and
 * cannot be deleted.
 */
export const removeKeyframe = (frames, at, prop) => {
	const stop = toStop(at);
	return (frames || [])
		.map((frame) => {
			if (toStop(frame.at) !== stop) return frame;
			const props = { ...frame.props };
			delete props[prop];
			return { at: frame.at, props };
		})
		.filter((frame) => Object.keys(frame.props).length > 0);
};

/** Remove a whole stop. */
export const removeStop = (frames, at) => {
	const stop = toStop(at);
	return (frames || []).filter((frame) => toStop(frame.at) !== stop);
};

/**
 * A property's value at an arbitrary point, linearly interpolated.
 *
 * Used to show what the clip is doing at the playhead, and to seed a new
 * keyframe with the value already in effect there — so dropping a marker never
 * jumps the clip.
 *
 * Outside the first and last stop that set this property, the value holds flat.
 * That matches the engine: a property with one stop is constant, not ramping
 * from nowhere.
 */
export const valueAt = (frames, prop, at) => {
	const spec = propSpec(prop);
	const neutral = spec ? spec.neutral : 0;

	const stops = (frames || [])
		.filter((frame) => frame?.props && frame.props[prop] !== undefined)
		.sort((a, b) => a.at - b.at);

	if (!stops.length) return neutral;
	const fraction = clamp(at, 0, 1);
	if (fraction <= stops[0].at) return stops[0].props[prop];
	if (fraction >= stops[stops.length - 1].at) return stops[stops.length - 1].props[prop];

	for (let i = 0; i < stops.length - 1; i += 1) {
		const a = stops[i];
		const b = stops[i + 1];
		if (fraction >= a.at && fraction <= b.at) {
			const span = b.at - a.at;
			// Two stops at the same instant: take the later one rather than
			// dividing by zero.
			if (span <= 0) return b.props[prop];
			const t = (fraction - a.at) / span;
			return a.props[prop] + (b.props[prop] - a.props[prop]) * t;
		}
	}
	return neutral;
};

/** Every property any stop touches, in panel order. */
export const animatedProps = (frames) => {
	const used = new Set();
	for (const frame of frames || []) {
		for (const prop of Object.keys(frame?.props || {})) used.add(prop);
	}
	return KEYFRAME_PROPS.filter((spec) => used.has(spec.name)).map((spec) => spec.name);
};

/**
 * A starting pair for a property someone has just chosen to animate.
 *
 * Two stops at the ends holding the current value: visible in the editor,
 * changes nothing on the canvas until a value is edited. Seeding a ramp people
 * did not ask for means every new property immediately alters the clip.
 */
export const seedProperty = (frames, prop) => {
	const spec = propSpec(prop);
	if (!spec) return frames || [];
	const start = valueAt(frames, prop, 0);
	const end = valueAt(frames, prop, 1);
	return setKeyframe(setKeyframe(frames, 0, prop, start), 1, prop, end);
};
