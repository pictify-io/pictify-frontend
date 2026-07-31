/**
 * Tests for the clip style properties.
 * Run: node --test src/lib/video/clip-style.test.js
 *
 * The two things pinned hardest are the unit boundary between microsecond
 * timings and millisecond fades, and the removal semantics — a control that
 * cannot be switched back off leaves the user stuck with a stroke they cannot
 * delete, which is worse than never having offered the control.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	readStroke,
	strokePatch,
	readShadow,
	shadowPatch,
	readCornerRadius,
	cornerRadiusPatch,
	maxCornerRadius,
	readFlip,
	flipPatch,
	readSpacing,
	spacingPatch,
	readFade,
	fadePatch,
	fadeMaxMs,
	DEFAULT_STROKE,
	DEFAULT_SHADOW,
	DEFAULT_LINE_HEIGHT,
	STROKE_WIDTH_MAX,
	FADE_CEILING_MS
} from './clip-style.js';

/** A clip with a one-second display window, in microseconds. */
const clipOf = (over = {}) => ({
	transform: { width: 400, height: 200 },
	timing: { display: { from: 0, to: 1_000_000 } },
	style: {},
	...over
});

// ── Stroke ───────────────────────────────────────────────────────────────

test('a clip with no stroke reads as null, not as a zeroed stroke', () => {
	assert.equal(readStroke(clipOf()), null);
	assert.equal(readStroke({}), null);
	assert.equal(readStroke(null), null);
});

test('a zero-width stroke reads as absent', () => {
	// The engine draws nothing, so showing the section as active would be a lie.
	assert.equal(readStroke(clipOf({ style: { stroke: { color: '#fff', width: 0 } } })), null);
});

test('an existing stroke is read back with its colour and width', () => {
	const stroke = readStroke(clipOf({ style: { stroke: { color: '#ff0000', width: 6 } } }));
	assert.deepEqual(stroke, { color: '#ff0000', width: 6 });
});

test('switching a stroke on uses a width that is actually visible', () => {
	// A default of 0 or 1 makes the feature look broken on first click.
	assert.deepEqual(strokePatch(null, {}), { stroke: DEFAULT_STROKE });
	assert.ok(DEFAULT_STROKE.width >= 2);
});

test('a partial stroke change preserves the other field', () => {
	const current = { color: '#ff0000', width: 6 };
	assert.deepEqual(strokePatch(current, { width: 10 }).stroke, { color: '#ff0000', width: 10 });
	assert.deepEqual(strokePatch(current, { color: '#00ff00' }).stroke, {
		color: '#00ff00',
		width: 6
	});
});

test('removing a stroke sets undefined, so it does not persist as noise', () => {
	// JSON.stringify drops undefined keys; {width: 0} would survive in every
	// saved template forever.
	const patch = strokePatch({ color: '#fff', width: 4 }, null);
	assert.equal(patch.stroke, undefined);
	assert.equal(JSON.stringify({ style: patch }), '{"style":{}}');
});

test('stroke width is clamped to the maximum', () => {
	assert.equal(strokePatch(null, { width: 9999 }).stroke.width, STROKE_WIDTH_MAX);
	assert.equal(strokePatch(null, { width: -5 }).stroke.width, 0);
});

// ── Shadow ───────────────────────────────────────────────────────────────

test('a clip with no shadow reads as null', () => {
	assert.equal(readShadow(clipOf()), null);
});

test('a partial shadow is filled in from the defaults', () => {
	// The engine treats every field as optional, so a shadow saved by an older
	// build can be missing anything.
	const shadow = readShadow(clipOf({ style: { shadow: { color: '#123456' } } }));
	assert.equal(shadow.color, '#123456');
	assert.equal(shadow.blur, DEFAULT_SHADOW.blur);
	assert.equal(shadow.alpha, DEFAULT_SHADOW.alpha);
});

test('shadow alpha, blur and offsets are clamped', () => {
	const shadow = readShadow(
		clipOf({ style: { shadow: { alpha: 5, blur: -3, offsetX: 9999, offsetY: -9999 } } })
	);
	assert.equal(shadow.alpha, 1);
	assert.equal(shadow.blur, 0);
	assert.equal(shadow.offsetX, 200);
	assert.equal(shadow.offsetY, -200);
});

test('a zero-blur shadow is kept, because a hard shadow is legitimate', () => {
	const shadow = readShadow(clipOf({ style: { shadow: { blur: 0, offsetY: 8 } } }));
	assert.notEqual(shadow, null);
	assert.equal(shadow.blur, 0);
});

test('removing a shadow sets undefined', () => {
	assert.equal(shadowPatch(DEFAULT_SHADOW, null).shadow, undefined);
});

test('the default shadow is offset, so it reads as a drop shadow', () => {
	assert.ok(DEFAULT_SHADOW.offsetY > 0);
});

// ── Corner radius ────────────────────────────────────────────────────────

test('the radius ceiling is half the shorter side', () => {
	// Past this the corners have consumed the shape and the slider does nothing.
	assert.equal(maxCornerRadius(clipOf()), 100); // min(400, 200) / 2
});

test('a radius beyond the ceiling is clamped on both read and write', () => {
	assert.equal(readCornerRadius(clipOf({ style: { borderRadius: 500 } })), 100);
	assert.equal(cornerRadiusPatch(500, clipOf()).borderRadius, 100);
	assert.equal(cornerRadiusPatch(-10, clipOf()).borderRadius, 0);
});

test('a clip with no dimensions still gets a usable ceiling', () => {
	// Audio clips and clips mid-load have no width; returning 0 would freeze the
	// slider at zero with no explanation.
	assert.ok(maxCornerRadius({}) > 0);
});

test('a missing radius reads as zero', () => {
	assert.equal(readCornerRadius(clipOf()), 0);
});

// ── Flip ─────────────────────────────────────────────────────────────────

test('a clip with no flip reads as neither axis', () => {
	assert.deepEqual(readFlip(clipOf()), { x: false, y: false });
	// `flip` is explicitly nullable on IClipTransform.
	assert.deepEqual(readFlip({ transform: { flip: null } }), { x: false, y: false });
});

test('toggling one axis preserves the other', () => {
	const clip = clipOf({ transform: { width: 400, height: 200, flip: { x: true, y: false } } });
	assert.deepEqual(flipPatch(clip, 'y').flip, { x: true, y: true });
});

test('flipping back to neither axis clears the key', () => {
	// So a clip flipped and unflipped serialises identically to one never touched.
	const clip = clipOf({ transform: { flip: { x: true, y: false } } });
	assert.equal(flipPatch(clip, 'x').flip, undefined);
});

test('flipping an untouched clip turns the axis on', () => {
	assert.deepEqual(flipPatch(clipOf(), 'x').flip, { x: true, y: false });
});

// ── Text spacing ─────────────────────────────────────────────────────────

test('spacing falls back to a normal line height, not zero', () => {
	// lineHeight 0 collapses every line on top of the next.
	assert.deepEqual(readSpacing(clipOf()), {
		lineHeight: DEFAULT_LINE_HEIGHT,
		letterSpacing: 0
	});
});

test('spacing values are clamped to their slider ranges', () => {
	const spacing = readSpacing(clipOf({ style: { lineHeight: 99, letterSpacing: -99 } }));
	assert.equal(spacing.lineHeight, 3);
	assert.equal(spacing.letterSpacing, -5);
});

test('a spacing patch only carries the field that changed', () => {
	// Writing both would stamp a default line height onto text that never set one.
	assert.deepEqual(spacingPatch({ letterSpacing: 2 }), { letterSpacing: 2 });
	assert.deepEqual(spacingPatch({ lineHeight: 1.5 }), { lineHeight: 1.5 });
	assert.deepEqual(spacingPatch({}), {});
});

// ── Fades ────────────────────────────────────────────────────────────────

test('the fade ceiling converts microsecond display into milliseconds', () => {
	// THE unit trap: display is µs, fade duration is ms, one key apart on the
	// same object. A 1,000,000µs clip is 1000ms, not 1,000,000ms.
	assert.equal(fadeMaxMs(clipOf()), 1000);
});

test('a long clip is capped at the fade ceiling', () => {
	const clip = clipOf({ timing: { display: { from: 0, to: 60_000_000 } } });
	assert.equal(fadeMaxMs(clip), FADE_CEILING_MS);
});

test('a clip with no display window still allows a fade', () => {
	assert.equal(fadeMaxMs({}), FADE_CEILING_MS);
	assert.equal(fadeMaxMs({ timing: { display: { from: 10, to: 10 } } }), FADE_CEILING_MS);
});

test('fades default to none', () => {
	assert.deepEqual(readFade(clipOf()), { inMs: 0, outMs: 0 });
});

test('a fade longer than the clip is clamped to the clip', () => {
	// Otherwise the ramp never completes and the clip plays permanently faded.
	const patch = fadePatch(clipOf(), 'in', 99_999);
	assert.equal(patch.timing.fadeIn.duration, 1000);
});

test('the two fades cannot overlap', () => {
	// A 700ms fade-out on a 1000ms clip leaves 300ms for the fade-in; asking for
	// 800 gives 300, not a pair of ramps that cross.
	const clip = clipOf({
		timing: { display: { from: 0, to: 1_000_000 }, fadeOut: { duration: 700 } }
	});
	assert.equal(fadePatch(clip, 'in', 800).timing.fadeIn.duration, 300);
});

test('setting a fade to zero removes it', () => {
	const clip = clipOf({
		timing: { display: { from: 0, to: 1_000_000 }, fadeIn: { duration: 400 } }
	});
	assert.equal(fadePatch(clip, 'in', 0).timing.fadeIn, undefined);
});

test('setting one fade leaves the other alone', () => {
	const clip = clipOf({
		timing: { display: { from: 0, to: 1_000_000 }, fadeOut: { duration: 200 } }
	});
	const patch = fadePatch(clip, 'in', 300);
	assert.equal(patch.timing.fadeOut.duration, 200);
	assert.equal(patch.timing.fadeIn.duration, 300);
});

test('an existing curve survives a duration change', () => {
	const clip = clipOf({
		timing: { display: { from: 0, to: 1_000_000 }, fadeIn: { duration: 100, curve: 'ease-in' } }
	});
	assert.equal(fadePatch(clip, 'in', 500).timing.fadeIn.curve, 'ease-in');
});

test('the display window is preserved by a fade patch', () => {
	// The patch replaces the whole timing object, so dropping display here would
	// delete the clip from the timeline.
	const patch = fadePatch(clipOf(), 'in', 200);
	assert.deepEqual(patch.timing.display, { from: 0, to: 1_000_000 });
});
