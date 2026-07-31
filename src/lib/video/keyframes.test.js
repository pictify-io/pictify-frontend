/**
 * Tests for hand-authored keyframes.
 * Run: node --test src/lib/video/keyframes.test.js
 *
 * The format is the part that fails invisibly. Three specific mistakes render
 * nothing at all while looking correct in the document — the wrong `type`, the
 * wrong time unit, and the dead singular `animation` field — so the shape of
 * what gets written is pinned harder than the editing behaviour.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	KEYFRAME_PROPS,
	KEYFRAME_TYPE,
	toStop,
	fromStop,
	hasKeyframes,
	hasPreset,
	readKeyframes,
	writeKeyframes,
	setKeyframe,
	removeKeyframe,
	removeStop,
	valueAt,
	animatedProps,
	seedProperty
} from './keyframes.js';

const clipWith = (params) => ({
	animations: [{ type: KEYFRAME_TYPE, options: { duration: 3_000_000 }, params }]
});

// ── Stops ────────────────────────────────────────────────────────────────

test('fractions round-trip through percentage keys', () => {
	assert.equal(toStop(0), '0%');
	assert.equal(toStop(0.5), '50%');
	assert.equal(toStop(1), '100%');
	assert.equal(fromStop('50%'), 0.5);
	assert.equal(fromStop('0%'), 0);
});

test('a fraction outside 0..1 is clamped rather than written', () => {
	assert.equal(toStop(-1), '0%');
	assert.equal(toStop(9), '100%');
});

test('a non-percentage key reads as null, not as zero', () => {
	// Zero would silently place a junk key at the start of the timeline.
	assert.equal(fromStop('nonsense'), null);
	assert.equal(fromStop(undefined), null);
});

// ── Detection ────────────────────────────────────────────────────────────

test('a clip with no animation has no keyframes', () => {
	assert.equal(hasKeyframes({}), false);
	assert.equal(hasKeyframes({ animations: [] }), false);
});

test('an animation of another registry type is not keyframes', () => {
	assert.equal(hasKeyframes({ animations: [{ type: 'wipe', params: {} }] }), false);
});

test('a preset is detected through its metadata, not its type', () => {
	// Presets are ALSO stored as type 'keyframes', so adopting hand-authored
	// ones would look like a no-op and then silently drop the preset.
	const preset = { animations: [{ type: KEYFRAME_TYPE, params: {} }],
		metadata: { pictify: { animation: { inPreset: 'fadeIn' } } } };
	assert.equal(hasPreset(preset), true);
	assert.equal(hasPreset(clipWith({})), false);
});

// ── Reading ──────────────────────────────────────────────────────────────

test('keyframes read back sorted by time', () => {
	const frames = readKeyframes(clipWith({ '100%': { opacity: 1 }, '0%': { opacity: 0 } }));
	assert.deepEqual(frames.map((f) => f.at), [0, 1]);
});

test('unparseable stops are dropped rather than placed at zero', () => {
	const frames = readKeyframes(clipWith({ '0%': { opacity: 0 }, junk: { opacity: 1 } }));
	assert.equal(frames.length, 1);
});

test('reading a clip with no keyframes gives an empty list', () => {
	assert.deepEqual(readKeyframes({}), []);
});

// ── Writing: the shape that fails invisibly ──────────────────────────────

test('the written animation uses a registry type', () => {
	// A preset name here fails the render outright.
	const [animation] = writeKeyframes(
		[{ at: 0, props: { opacity: 0 } }, { at: 1, props: { opacity: 1 } }],
		3_000_000
	);
	assert.equal(animation.type, KEYFRAME_TYPE);
});

test('duration is written in microseconds, unchanged', () => {
	// Milliseconds finish the animation in the first few frames.
	const [animation] = writeKeyframes(
		[{ at: 0, props: { opacity: 0 } }, { at: 1, props: { opacity: 1 } }],
		3_000_000
	);
	assert.equal(animation.options.duration, 3_000_000);
});

test('params are keyed by percentage', () => {
	const [animation] = writeKeyframes(
		[{ at: 0, props: { opacity: 0 } }, { at: 0.5, props: { opacity: 1 } }],
		1_000
	);
	assert.deepEqual(Object.keys(animation.params).sort(), ['0%', '50%']);
});

test('one stop is not an animation', () => {
	// The engine would hold a single stop for the whole clip, which is a static
	// offset wearing an animation's clothes.
	assert.equal(writeKeyframes([{ at: 0, props: { opacity: 0.5 } }], 1000), null);
	assert.equal(writeKeyframes([], 1000), null);
	assert.equal(writeKeyframes(null, 1000), null);
});

test('stops with no properties do not count toward the minimum', () => {
	const frames = [{ at: 0, props: {} }, { at: 1, props: { opacity: 1 } }];
	assert.equal(writeKeyframes(frames, 1000), null);
});

test('a zero or missing duration still writes something renderable', () => {
	const [animation] = writeKeyframes(
		[{ at: 0, props: { opacity: 0 } }, { at: 1, props: { opacity: 1 } }],
		0
	);
	assert.ok(animation.options.duration >= 1);
});

// ── Editing ──────────────────────────────────────────────────────────────

test('setting a property creates the stop', () => {
	const frames = setKeyframe([], 0.5, 'opacity', 0.3);
	assert.equal(frames.length, 1);
	assert.equal(frames[0].props.opacity, 0.3);
});

test('setting a second property on the same stop keeps the first', () => {
	let frames = setKeyframe([], 0.5, 'opacity', 0.3);
	frames = setKeyframe(frames, 0.5, 'scale', 2);
	assert.equal(frames.length, 1);
	assert.deepEqual(frames[0].props, { opacity: 0.3, scale: 2 });
});

test('editing does not mutate the previous list', () => {
	// The caller holds the old value for undo.
	const original = setKeyframe([], 0, 'opacity', 1);
	const edited = setKeyframe(original, 0, 'opacity', 0);
	assert.equal(original[0].props.opacity, 1);
	assert.equal(edited[0].props.opacity, 0);
});

test('stops stay sorted however they are added', () => {
	let frames = setKeyframe([], 1, 'opacity', 1);
	frames = setKeyframe(frames, 0, 'opacity', 0);
	frames = setKeyframe(frames, 0.5, 'opacity', 0.5);
	assert.deepEqual(frames.map((f) => f.at), [0, 0.5, 1]);
});

test('values are clamped to the property range', () => {
	assert.equal(setKeyframe([], 0, 'opacity', 99)[0].props.opacity, 1);
	assert.equal(setKeyframe([], 0, 'scale', -5)[0].props.scale, 0);
});

test('an unknown property or unusable value is refused', () => {
	assert.deepEqual(setKeyframe([], 0, 'nope', 1), []);
	assert.deepEqual(setKeyframe([], 0, 'opacity', 'lots'), []);
});

test('removing a property leaves the other properties at that stop', () => {
	let frames = setKeyframe([], 0, 'opacity', 0);
	frames = setKeyframe(frames, 0, 'scale', 2);
	frames = removeKeyframe(frames, 0, 'opacity');
	assert.deepEqual(frames[0].props, { scale: 2 });
});

test('removing the last property removes the stop', () => {
	// An empty stop is invisible but still occupies a marker position, so it
	// cannot be selected and cannot be deleted.
	const frames = removeKeyframe(setKeyframe([], 0, 'opacity', 0), 0, 'opacity');
	assert.deepEqual(frames, []);
});

test('a whole stop can be removed', () => {
	let frames = setKeyframe([], 0, 'opacity', 0);
	frames = setKeyframe(frames, 1, 'opacity', 1);
	assert.deepEqual(removeStop(frames, 0).map((f) => f.at), [1]);
});

// ── Interpolation ────────────────────────────────────────────────────────

const ramp = [
	{ at: 0, props: { opacity: 0 } },
	{ at: 1, props: { opacity: 1 } }
];

test('a value between two stops is interpolated', () => {
	assert.equal(valueAt(ramp, 'opacity', 0.5), 0.5);
	assert.equal(valueAt(ramp, 'opacity', 0.25), 0.25);
});

test('a value holds flat outside the stops that set it', () => {
	// The engine treats a single stop as constant, not as a ramp from nowhere.
	const late = [{ at: 0.5, props: { opacity: 0.4 } }];
	assert.equal(valueAt(late, 'opacity', 0), 0.4);
	assert.equal(valueAt(late, 'opacity', 1), 0.4);
});

test('a property with no stops reads as its neutral', () => {
	assert.equal(valueAt(ramp, 'scale', 0.5), 1);
	assert.equal(valueAt(ramp, 'x', 0.5), 0);
	assert.equal(valueAt([], 'opacity', 0.5), 1);
});

test('interpolation ignores stops that do not set the property', () => {
	const mixed = [
		{ at: 0, props: { opacity: 0 } },
		{ at: 0.5, props: { scale: 2 } },
		{ at: 1, props: { opacity: 1 } }
	];
	assert.equal(valueAt(mixed, 'opacity', 0.5), 0.5);
});

test('two stops at the same instant do not divide by zero', () => {
	const stacked = [
		{ at: 0.5, props: { opacity: 0 } },
		{ at: 0.5, props: { opacity: 1 } }
	];
	assert.ok(Number.isFinite(valueAt(stacked, 'opacity', 0.5)));
});

// ── Property list and seeding ────────────────────────────────────────────

test('animated properties are reported in panel order', () => {
	const frames = [{ at: 0, props: { angle: 0, opacity: 1 } }];
	assert.deepEqual(animatedProps(frames), ['opacity', 'angle']);
});

test('seeding a property makes two stops holding the current value', () => {
	// Visible in the editor, changes nothing on the canvas until edited.
	const frames = seedProperty([], 'opacity');
	assert.deepEqual(frames.map((f) => f.at), [0, 1]);
	assert.equal(frames[0].props.opacity, 1);
	assert.equal(frames[1].props.opacity, 1);
});

test('seeding respects a value already in effect', () => {
	const existing = [{ at: 0.5, props: { scale: 2 } }];
	const frames = seedProperty(existing, 'scale');
	assert.equal(valueAt(frames, 'scale', 0), 2);
});

test('every property spec has a range containing its neutral', () => {
	for (const spec of KEYFRAME_PROPS) {
		assert.ok(spec.neutral >= spec.min && spec.neutral <= spec.max, spec.name);
		assert.ok(spec.step > 0, spec.name);
	}
});

// ── Round trip ───────────────────────────────────────────────────────────

test('write then read returns the same keyframes', () => {
	const frames = [
		{ at: 0, props: { opacity: 0, scale: 0.8 } },
		{ at: 0.5, props: { opacity: 1 } },
		{ at: 1, props: { opacity: 0, scale: 1.2 } }
	];
	const animations = writeKeyframes(frames, 2_000_000);
	const back = readKeyframes({ animations });
	assert.deepEqual(back, frames);
});
