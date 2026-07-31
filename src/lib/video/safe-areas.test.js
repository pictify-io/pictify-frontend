/**
 * Tests for safe-area guides.
 * Run: node --test src/lib/video/safe-areas.test.js
 *
 * The preset is chosen by RATIO, not by exact dimensions. That is the whole
 * point: 720x1280 is not the "Reels" canvas preset but it goes in the same feed
 * behind the same chrome, and guides that only fired on 1080x1920 would miss it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	safeAreaFor,
	safeAreaBox,
	outsideSafeArea,
	SAFE_AREA_PRESETS
} from './safe-areas.js';

// ── Preset selection ─────────────────────────────────────────────────────

test('9:16 gets the vertical-feed guides', () => {
	assert.equal(safeAreaFor(1080, 1920).id, 'portrait');
});

test('a different 9:16 size gets the same guides', () => {
	// Ratio, not dimensions — this is the case exact matching would miss.
	assert.equal(safeAreaFor(720, 1280).id, 'portrait');
	assert.equal(safeAreaFor(540, 960).id, 'portrait');
});

test('1:1, 4:5 and 16:9 each get their own', () => {
	assert.equal(safeAreaFor(1080, 1080).id, 'square');
	assert.equal(safeAreaFor(1080, 1350).id, 'vertical');
	assert.equal(safeAreaFor(1920, 1080).id, 'landscape');
});

test('an unusual ratio still gets guides rather than nothing', () => {
	assert.ok(safeAreaFor(3000, 400).id);
	assert.ok(safeAreaFor(400, 3000).id);
});

test('missing dimensions fall back rather than dividing by zero', () => {
	assert.ok(safeAreaFor(undefined, undefined).id);
	assert.ok(safeAreaFor(0, 0).id);
});

test('the vertical feed reserves the most room at the bottom', () => {
	// Caption, handle and music ticker all live there; it is the band that
	// actually swallows content.
	const portrait = SAFE_AREA_PRESETS.portrait;
	assert.ok(portrait.bottom > portrait.top);
	assert.ok(portrait.right > portrait.left, 'the action rail is on the right');
});

test('every preset leaves a usable area', () => {
	for (const preset of Object.values(SAFE_AREA_PRESETS)) {
		assert.ok(preset.top + preset.bottom < 0.6, `${preset.id} vertical insets too large`);
		assert.ok(preset.left + preset.right < 0.6, `${preset.id} horizontal insets too large`);
	}
});

// ── The box ──────────────────────────────────────────────────────────────

test('the box is inset from every edge', () => {
	const box = safeAreaBox(1080, 1920);
	assert.ok(box.x > 0 && box.y > 0);
	assert.ok(box.x + box.width < 1080);
	assert.ok(box.y + box.height < 1920);
});

test('the box scales with the canvas', () => {
	const big = safeAreaBox(1080, 1920);
	const small = safeAreaBox(540, 960);
	assert.equal(Math.round(big.width / 2), small.width);
});

test('the box carries which preset it came from, for labelling', () => {
	const box = safeAreaBox(1920, 1080);
	assert.equal(box.preset, 'landscape');
	assert.equal(typeof box.label, 'string');
});

test('the box is whole pixels', () => {
	const box = safeAreaBox(1081, 1921);
	for (const value of [box.x, box.y, box.width, box.height]) {
		assert.equal(value, Math.round(value));
	}
});

// ── Clip checks ──────────────────────────────────────────────────────────

const composition = { width: 1080, height: 1920 };
const at = (x, y, width, height) => ({ transform: { x, y, width, height } });

test('a clip inside the guides is not flagged', () => {
	const box = safeAreaBox(1080, 1920);
	const clip = at(box.x + 10, box.y + 10, 100, 100);
	assert.equal(outsideSafeArea(clip, composition).outside, false);
});

test('a caption in the bottom band is flagged', () => {
	// The actual failure: a lower-third under the TikTok handle.
	const result = outsideSafeArea(at(100, 1800, 800, 100), composition);
	assert.equal(result.outside, true);
	assert.ok(result.edges.includes('bottom'));
});

test('each edge is reported separately', () => {
	const result = outsideSafeArea(at(0, 0, 1080, 1920), composition);
	assert.deepEqual(result.edges.sort(), ['bottom', 'left', 'right', 'top']);
});

test('a clip with no transform is not flagged', () => {
	// Effect clips have no geometry; flagging them would be noise.
	assert.equal(outsideSafeArea({}, composition).outside, false);
	assert.equal(outsideSafeArea({ transform: {} }, composition).outside, false);
});

test('unreadable geometry is not flagged', () => {
	assert.equal(outsideSafeArea(at('a', 'b', 'c', 'd'), composition).outside, false);
});
