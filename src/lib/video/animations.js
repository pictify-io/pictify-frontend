/**
 * Clip animation for the video studio.
 *
 * ── The contract, established by rendering, not by reading types ────────
 *
 * A clip animates through the SINGULAR `clip.animation` field:
 *
 *   clip.animation = {
 *     keyFrames: { '0%': { opacity: 0, scale: 0.9 }, '100%': { opacity: 1 } },
 *     options:   { duration: <MILLISECONDS>, delay?, iterCount? }
 *   }
 *
 * Three things here are easy to get wrong and each fails differently:
 *
 *   - `keyFrames` has a CAPITAL F. Lowercase is silently ignored.
 *   - `duration` is in MILLISECONDS, unlike every timing value in the engine
 *     (which is microseconds). Passing 1_000_000 gives a 16-minute fade, so the
 *     clip renders almost invisible for its whole life — it looks like the
 *     animation is broken rather than mistimed.
 *   - The plural `clip.animations` array is NOT this. Setting
 *     `animations: [{ type: 'fadeIn', ... }]` fails the server render outright
 *     with `Animation "fadeIn" not found in registry`, because that array wants
 *     registry types, not preset names.
 *
 * ── Why in and out are composed ────────────────────────────────────────
 *
 * The engine gives one animation slot per clip, but ANIMATION_PRESETS ships 51
 * "In" and 51 "Out" presets. Rather than force a choice, compose them into one
 * keyframe map: the In preset plays over the opening slice, the clip rests in
 * its neutral state through the middle, and the Out preset plays over the
 * closing slice. `duration` is the clip's own display duration, so the
 * percentages land where the user expects.
 */
import { ANIMATION_PRESETS, getPresetKeyframes } from '@openvideo/core';

/** How much of the clip each entrance/exit occupies, as a fraction. */
export const DEFAULT_IN_FRACTION = 0.25;
export const DEFAULT_OUT_FRACTION = 0.25;

const MICROSECONDS_PER_MS = 1000;

const humanize = (key) =>
	ANIMATION_PRESETS[key]?.label ||
	key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

const keys = () => Object.keys(ANIMATION_PRESETS || {});

/** Entrance presets, as {value,label} for a <select>. */
export const IN_PRESETS = () =>
	keys()
		.filter((k) => /in$/i.test(k) && !/caption$/i.test(k))
		.map((value) => ({ value, label: humanize(value) }));

/** Exit presets. */
export const OUT_PRESETS = () =>
	keys()
		.filter((k) => /out$/i.test(k) && !/caption$/i.test(k))
		.map((value) => ({ value, label: humanize(value) }));

/**
 * Looping / emphasis presets. These are not entrance or exit, so they own the
 * whole clip and cannot be combined with either.
 */
export const EMPHASIS_PRESETS = () =>
	keys()
		.filter((k) => !/in$|out$/i.test(k) && !/caption$/i.test(k))
		.map((value) => ({ value, label: humanize(value) }));

const NEUTRAL = { opacity: 1, scale: 1, x: 0, y: 0, angle: 0, blur: 0 };

/** The properties a preset actually touches, so we only reset those. */
const touchedProps = (frames) => {
	const props = new Set();
	for (const stop of Object.values(frames || {})) {
		for (const prop of Object.keys(stop || {})) props.add(prop);
	}
	return props;
};

/** The neutral resting value for every property a preset animates. */
const restingState = (...frameSets) => {
	const rest = {};
	for (const frames of frameSets) {
		for (const prop of touchedProps(frames)) {
			rest[prop] = NEUTRAL[prop] !== undefined ? NEUTRAL[prop] : 1;
		}
	}
	return rest;
};

const pct = (fraction) => `${Math.round(Math.min(100, Math.max(0, fraction * 100)))}%`;

/**
 * Remap a preset's 0%..100% keyframes onto an arbitrary slice of the timeline.
 * A preset stop at 50% inside a 0-25% slice lands at 12.5%.
 */
const remap = (frames, fromFraction, toFraction) => {
	const out = {};
	const span = toFraction - fromFraction;
	for (const [stop, props] of Object.entries(frames || {})) {
		const at = parseFloat(stop) / 100;
		if (!Number.isFinite(at)) continue;
		out[pct(fromFraction + at * span)] = { ...props };
	}
	return out;
};

/**
 * Build the `clip.animation` value for an in/out/emphasis selection.
 *
 * @param {Object} selection - { inPreset, outPreset, emphasisPreset, inFraction, outFraction }
 * @param {number} durationUs - the clip's display duration, in MICROseconds
 * @returns {Object|null} clip.animation, or null when nothing is selected
 */
export const buildAnimation = (selection, durationUs) => {
	const { inPreset, outPreset, emphasisPreset, inFraction, outFraction } = selection || {};
	const durationMs = Math.max(1, Math.round((durationUs || 0) / MICROSECONDS_PER_MS));

	// Emphasis owns the whole clip and loops; it cannot share with in/out.
	if (emphasisPreset) {
		const frames = getPresetKeyframes(emphasisPreset);
		if (!frames) return null;
		return {
			keyFrames: { ...frames },
			options: {
				duration: durationMs,
				iterCount: ANIMATION_PRESETS[emphasisPreset]?.defaultOptions?.iterCount ?? 1
			}
		};
	}

	const inFrames = inPreset ? getPresetKeyframes(inPreset) : null;
	const outFrames = outPreset ? getPresetKeyframes(outPreset) : null;
	if (!inFrames && !outFrames) return null;

	const inEnd = inFrames ? Math.min(0.9, inFraction ?? DEFAULT_IN_FRACTION) : 0;
	const outStart = outFrames ? 1 - Math.min(0.9, outFraction ?? DEFAULT_OUT_FRACTION) : 1;
	const rest = restingState(inFrames, outFrames);

	const keyFrames = {};
	if (inFrames) Object.assign(keyFrames, remap(inFrames, 0, inEnd));
	// Hold the neutral state across the middle so the clip is not still
	// mid-entrance when the exit begins.
	if (inFrames && outFrames && outStart > inEnd) {
		keyFrames[pct(inEnd)] = { ...rest };
		keyFrames[pct(outStart)] = { ...rest };
	} else if (inFrames && !outFrames) {
		keyFrames['100%'] = { ...keyFrames[pct(inEnd)], ...rest };
	} else if (outFrames && !inFrames) {
		keyFrames['0%'] = { ...rest };
	}
	if (outFrames) Object.assign(keyFrames, remap(outFrames, outStart, 1));

	return { keyFrames, options: { duration: durationMs, iterCount: 1 } };
};

/**
 * Best-effort read of which presets a stored animation came from.
 *
 * The engine stores only the composed keyframes, not the preset names, so the
 * selection is mirrored into `clip.metadata.pictify.animation`. Falling back to
 * "custom" is correct for a hand-edited or agent-authored animation.
 *
 * @returns {{inPreset: string, outPreset: string, emphasisPreset: string}}
 */
export const readAnimation = (clip) => {
	const stored = clip?.metadata?.pictify?.animation;
	return {
		inPreset: stored?.inPreset || '',
		outPreset: stored?.outPreset || '',
		emphasisPreset: stored?.emphasisPreset || ''
	};
};

/** Does this clip animate at all? */
export const hasAnimation = (clip) => !!clip?.animation?.keyFrames;

/**
 * The metadata patch that remembers the selection, read-modify-write so the
 * variable bindings living on the same object survive.
 */
export const withAnimationMeta = (clip, selection) => {
	const metadata = clip?.metadata || {};
	const pictify = metadata.pictify || {};
	return { ...metadata, pictify: { ...pictify, animation: { ...selection } } };
};
