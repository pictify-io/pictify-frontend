/**
 * Tests for clip speed.
 * Run: node --test src/lib/video/clip-speed.test.js
 *
 * The behaviour that matters is retiming. Changing `playbackRate` without
 * rescaling the display window leaves the clip occupying its old span with a
 * frozen tail, which looks like a broken render rather than a fast clip.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	readSpeed,
	speedPatch,
	MIN_SPEED,
	MAX_SPEED,
	SPEED_PRESETS
} from './clip-speed.js';

// ── Speed ────────────────────────────────────────────────────────────────

const clipAt = (from, to, rate) => ({
	timing: { display: { from, to }, duration: to - from, playbackRate: rate }
});

test('a clip with no rate reads as normal speed', () => {
	assert.equal(readSpeed({}), 1);
	assert.equal(readSpeed(clipAt(0, 1000)), 1);
});

test('a nonsense rate reads as normal speed rather than zero', () => {
	// playbackRate 0 would freeze the clip forever.
	assert.equal(readSpeed({ timing: { playbackRate: 0 } }), 1);
	assert.equal(readSpeed({ timing: { playbackRate: -2 } }), 1);
});

test('doubling the speed halves the span', () => {
	// THE bug this prevents: at 2x in the original span, the source runs out
	// halfway and the last frame freezes for the rest.
	const patch = speedPatch(clipAt(0, 4_000_000, 1), 2);
	assert.equal(patch.timing.playbackRate, 2);
	assert.equal(patch.timing.display.to, 2_000_000);
	assert.equal(patch.timing.duration, 2_000_000);
});

test('halving the speed doubles the span', () => {
	const patch = speedPatch(clipAt(0, 2_000_000, 1), 0.5);
	assert.equal(patch.timing.display.to, 4_000_000);
});

test('the clip start never moves', () => {
	// Retiming should not shunt the clip along the timeline.
	const patch = speedPatch(clipAt(5_000_000, 9_000_000, 1), 2);
	assert.equal(patch.timing.display.from, 5_000_000);
	assert.equal(patch.timing.display.to, 7_000_000);
});

test('speed changes compose rather than compounding off the current span', () => {
	// 1x -> 2x -> back to 1x must return the original span, not a quarter of it.
	const once = speedPatch(clipAt(0, 4_000_000, 1), 2);
	const back = speedPatch({ timing: once.timing }, 1);
	assert.equal(back.timing.display.to, 4_000_000);
});

test('speed is clamped to a usable band', () => {
	assert.equal(speedPatch(clipAt(0, 1_000_000, 1), 99).timing.playbackRate, MAX_SPEED);
	assert.equal(speedPatch(clipAt(0, 1_000_000, 1), 0.001).timing.playbackRate, MIN_SPEED);
});

test('a clip with no usable window still gets the new rate', () => {
	const patch = speedPatch({ timing: {} }, 2);
	assert.equal(patch.timing.playbackRate, 2);
});

test('an unusable speed is refused', () => {
	assert.equal(speedPatch(clipAt(0, 1000, 1), 'fast'), null);
});

test('every preset is inside the allowed band and includes normal speed', () => {
	assert.ok(SPEED_PRESETS.includes(1), 'there must be a way back to 1x');
	for (const s of SPEED_PRESETS) assert.ok(s >= MIN_SPEED && s <= MAX_SPEED, String(s));
});
