/**
 * Tests for align / distribute / stacking order.
 * Run: node --test src/lib/video/arrange.test.js
 *
 * These encode the ANCHOR assumption — transform.x/y is the clip's top-left,
 * established by rendering a box at known coordinates and checking which
 * quadrant lit up. If an engine bump moves the anchor to the centre, the
 * alignment maths silently goes wrong everywhere; these fail instead.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	alignPatch,
	distributePatches,
	orderPatches,
	selectionBounds,
	ALIGNMENTS,
	ORDER_OPS
} from './arrange.js';

const clip = (id, x, y, width = 100, height = 50, zIndex = 0, type = 'Shape') => ({
	id,
	type,
	transform: { x, y, width, height, zIndex }
});

const COMP = { width: 1000, height: 500 };

// ── Align ────────────────────────────────────────────────────────────────

test('align left pins to the artboard edge', () => {
	assert.deepEqual(alignPatch(clip('a', 300, 100), 'left', COMP), { x: 0 });
});

test('align right accounts for the clip width', () => {
	// Top-left anchor: the right edge is x + width, so x = compW - width.
	assert.deepEqual(alignPatch(clip('a', 0, 0, 100), 'right', COMP), { x: 900 });
});

test('center horizontally splits the leftover space', () => {
	assert.deepEqual(alignPatch(clip('a', 0, 0, 100), 'centerH', COMP), { x: 450 });
});

test('align top and bottom mirror the horizontal cases', () => {
	assert.deepEqual(alignPatch(clip('a', 0, 300, 100, 50), 'top', COMP), { y: 0 });
	assert.deepEqual(alignPatch(clip('a', 0, 0, 100, 50), 'bottom', COMP), { y: 450 });
	assert.deepEqual(alignPatch(clip('a', 0, 0, 100, 50), 'middleV', COMP), { y: 225 });
});

test('align only touches its own axis', () => {
	// A horizontal align must never move the clip vertically.
	assert.deepEqual(Object.keys(alignPatch(clip('a', 5, 7), 'centerH', COMP)), ['x']);
	assert.deepEqual(Object.keys(alignPatch(clip('a', 5, 7), 'middleV', COMP)), ['y']);
});

test('a clip wider than the artboard still gets a defined position', () => {
	assert.deepEqual(alignPatch(clip('a', 0, 0, 2000), 'centerH', COMP), { x: -500 });
});

test('an unknown alignment is a no-op rather than a crash', () => {
	assert.equal(alignPatch(clip('a', 0, 0), 'sideways', COMP), null);
});

test('every declared alignment produces a patch', () => {
	for (const { id } of ALIGNMENTS) {
		assert.ok(alignPatch(clip('a', 10, 10), id, COMP), `${id} produced nothing`);
	}
});

// ── Distribute ───────────────────────────────────────────────────────────

test('distribute spaces the middle clips evenly and leaves the ends alone', () => {
	// 3 clips of width 100 spanning 0..500 -> gaps of (500-300)/2 = 100.
	const clips = [clip('a', 0, 0), clip('b', 130, 0), clip('c', 400, 0)];
	const patches = distributePatches(clips, 'x');
	assert.equal(patches.length, 1, 'only the middle clip moves');
	assert.equal(patches[0].id, 'b');
	assert.equal(patches[0].patch.x, 200);
});

test('distribute needs three clips', () => {
	assert.deepEqual(distributePatches([clip('a', 0, 0), clip('b', 200, 0)], 'x'), []);
	assert.deepEqual(distributePatches([clip('a', 0, 0)], 'x'), []);
});

test('distribute sorts by position, not by selection order', () => {
	const clips = [clip('c', 400, 0), clip('a', 0, 0), clip('b', 130, 0)];
	const patches = distributePatches(clips, 'x');
	assert.equal(patches[0].id, 'b');
});

test('distribute works vertically', () => {
	const clips = [clip('a', 0, 0, 100, 50), clip('b', 0, 60, 100, 50), clip('c', 0, 250, 100, 50)];
	const patches = distributePatches(clips, 'y');
	assert.equal(patches[0].id, 'b');
	assert.equal(patches[0].patch.y, 125);
});

test('overlapping clips clamp to a zero gap instead of moving backwards', () => {
	const clips = [clip('a', 0, 0, 100), clip('b', 10, 0, 100), clip('c', 20, 0, 100)];
	const patches = distributePatches(clips, 'x');
	assert.equal(patches[0].patch.x, 100, 'stacks flush rather than inverting');
});

// ── Order ────────────────────────────────────────────────────────────────

test('bring to front lands above everything else', () => {
	const a = clip('a', 0, 0, 100, 50, 1);
	const all = [a, clip('b', 0, 0, 100, 50, 5), clip('c', 0, 0, 100, 50, 3)];
	assert.deepEqual(orderPatches([a], all, 'front'), [{ id: 'a', zIndex: 6 }]);
});

test('send to back lands below everything else', () => {
	const a = clip('a', 0, 0, 100, 50, 4);
	const all = [a, clip('b', 0, 0, 100, 50, 2), clip('c', 0, 0, 100, 50, 3)];
	assert.deepEqual(orderPatches([a], all, 'back'), [{ id: 'a', zIndex: 1 }]);
});

test('forward and backward step by one', () => {
	const a = clip('a', 0, 0, 100, 50, 2);
	const all = [a, clip('b', 0, 0, 100, 50, 5)];
	assert.deepEqual(orderPatches([a], all, 'forward'), [{ id: 'a', zIndex: 3 }]);
	assert.deepEqual(orderPatches([a], all, 'backward'), [{ id: 'a', zIndex: 1 }]);
});

test('Transition clips are ignored when computing the stack bounds', () => {
	// The engine puts transitions above the clips they blend, so counting them
	// would make "bring to front" drift upward on every use.
	const a = clip('a', 0, 0, 100, 50, 1);
	const all = [a, clip('b', 0, 0, 100, 50, 2), clip('tr', 0, 0, 0, 0, 99, 'Transition')];
	assert.deepEqual(orderPatches([a], all, 'front'), [{ id: 'a', zIndex: 3 }]);
});

test('ordering a multi-selection moves every clip', () => {
	const a = clip('a', 0, 0, 100, 50, 1);
	const b = clip('b', 0, 0, 100, 50, 2);
	const all = [a, b, clip('c', 0, 0, 100, 50, 7)];
	assert.deepEqual(orderPatches([a, b], all, 'front'), [
		{ id: 'a', zIndex: 8 },
		{ id: 'b', zIndex: 8 }
	]);
});

test('a no-op ordering produces no patch', () => {
	const a = clip('a', 0, 0, 100, 50, 5);
	assert.deepEqual(orderPatches([a], [a], 'front'), []);
});

test('every declared order op is handled', () => {
	const a = clip('a', 0, 0, 100, 50, 3);
	const all = [a, clip('b', 0, 0, 100, 50, 9)];
	for (const { id } of ORDER_OPS) {
		assert.equal(orderPatches([a], all, id).length, 1, `${id} produced nothing`);
	}
});

// ── Bounds ───────────────────────────────────────────────────────────────

test('selectionBounds covers every clip', () => {
	const bounds = selectionBounds([clip('a', 10, 20, 100, 50), clip('b', 200, 10, 50, 200)]);
	assert.deepEqual(bounds, { left: 10, top: 10, right: 250, bottom: 210, width: 240, height: 200 });
});

test('selectionBounds of nothing is null', () => {
	assert.equal(selectionBounds([]), null);
});
