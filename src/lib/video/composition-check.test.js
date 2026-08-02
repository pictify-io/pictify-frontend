/**
 * Tests for blank-render detection.
 * Run: node --test src/lib/video/composition-check.test.js
 *
 * The bias is deliberately asymmetric. A false positive blocks a render someone
 * wanted; a false negative costs them a black mp4 and a render from their
 * quota. Both are bad, but only the first is a bug the user cannot work around,
 * so most of these tests pin what must NOT be reported blank.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { checkComposition, overlapsWindow } from './composition-check.js';

const clip = (over = {}) => ({
	type: 'Shape',
	timing: { display: { from: 0, to: 2_000_000 } },
	...over
});

const project = (clips, durationUs = 5_000_000) => ({
	settings: { width: 1080, height: 1920, fps: 30, duration: durationUs },
	tracks: [],
	clips: Object.fromEntries(clips.map((c, i) => [`c${i}`, c]))
});

// ── The blank cases ──────────────────────────────────────────────────────

test('an empty timeline is blank', () => {
	const result = checkComposition(project([]));
	assert.equal(result.blank, true);
	assert.equal(result.reason, 'empty_composition');
});

test('a missing or malformed document is blank, not a crash', () => {
	assert.equal(checkComposition(undefined).blank, true);
	assert.equal(checkComposition(null).blank, true);
	assert.equal(checkComposition({}).blank, true);
});

test('audio with no picture is blank', () => {
	const result = checkComposition(project([clip({ type: 'Audio' })]));
	assert.equal(result.blank, true);
	assert.equal(result.reason, 'audio_only');
});

test('every clip past the end of the composition is blank', () => {
	// The case people actually hit: shorten the composition, or drag a clip out
	// past the end, and the timeline still looks full while the output is black.
	const late = clip({ timing: { display: { from: 9_000_000, to: 12_000_000 } } });
	const result = checkComposition(project([late], 5_000_000));
	assert.equal(result.blank, true);
	assert.equal(result.reason, 'nothing_in_window');
});

test('the message names the duration, so the fix is obvious', () => {
	const late = clip({ timing: { display: { from: 9_000_000, to: 12_000_000 } } });
	assert.match(checkComposition(project([late], 5_000_000)).message, /5s/);
});

test('every blank result carries something the user can act on', () => {
	for (const doc of [project([]), project([clip({ type: 'Audio' })])]) {
		const result = checkComposition(doc);
		assert.equal(typeof result.message, 'string');
		assert.ok(result.message.length > 20);
	}
});

// ── What must NOT be blocked ─────────────────────────────────────────────

test('a normal composition passes', () => {
	assert.equal(checkComposition(project([clip()])).blank, false);
});

test('one visible clip is enough, even alongside audio', () => {
	assert.equal(checkComposition(project([clip({ type: 'Audio' }), clip()])).blank, false);
});

test('a clip starting before zero and running in is fine', () => {
	const early = clip({ timing: { display: { from: -1_000_000, to: 1_000_000 } } });
	assert.equal(checkComposition(project([early])).blank, false);
});

test('a clip overrunning the end is fine, because it is on screen at the start', () => {
	const long = clip({ timing: { display: { from: 0, to: 99_000_000 } } });
	assert.equal(checkComposition(project([long], 5_000_000)).blank, false);
});

test('a clip with no timing is assumed visible', () => {
	// The engine defaults it to the whole composition.
	assert.equal(checkComposition(project([clip({ timing: undefined })])).blank, false);
});

test('unreadable timing is assumed visible rather than blocking', () => {
	const odd = clip({ timing: { display: { from: 'soon', to: null } } });
	assert.equal(checkComposition(project([odd])).blank, false);
});

test('no composition duration disables the window check', () => {
	const late = clip({ timing: { display: { from: 9_000_000, to: 12_000_000 } } });
	assert.equal(checkComposition(project([late], 0)).blank, false);
	assert.equal(checkComposition({ clips: { a: late }, settings: {} }).blank, false);
});

test('an Effect over a backdrop is a legitimate video', () => {
	assert.equal(checkComposition(project([clip({ type: 'Effect' })])).blank, false);
});

test('a Caption counts as visible content', () => {
	assert.equal(checkComposition(project([clip({ type: 'Caption' })])).blank, false);
});

// ── Window arithmetic ────────────────────────────────────────────────────

test('a zero-length or inverted clip is not on screen', () => {
	assert.equal(overlapsWindow({ timing: { display: { from: 5, to: 5 } } }, 1000), false);
	assert.equal(overlapsWindow({ timing: { display: { from: 9, to: 2 } } }, 1000), false);
});

test('a clip touching either edge of the window counts', () => {
	assert.equal(overlapsWindow({ timing: { display: { from: 0, to: 10 } } }, 1000), true);
	assert.equal(overlapsWindow({ timing: { display: { from: 990, to: 5000 } } }, 1000), true);
});

test('a clip entirely past the end does not count', () => {
	assert.equal(overlapsWindow({ timing: { display: { from: 1000, to: 2000 } } }, 1000), false);
});
