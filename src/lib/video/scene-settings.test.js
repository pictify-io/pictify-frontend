/**
 * Tests for composition settings.
 * Run: node --test src/lib/video/scene-settings.test.js
 *
 * Clamping is the load-bearing part. These values go straight to the renderer,
 * and the backend rejects anything outside 16..4096, so a studio that lets
 * someone type 99999 produces a template that saves fine and fails at render
 * time — long after the mistake was made.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	ASPECT_PRESETS,
	QUALITY_PRESETS,
	FPS_OPTIONS,
	matchAspectPreset,
	matchQualityPreset,
	aspectPatch,
	rotatePatch,
	settingsPatch,
	readSettings,
	estimatedSizeMb,
	DEFAULT_BITRATE,
	MIN_DIMENSION,
	MAX_DIMENSION,
	MAX_FPS
} from './scene-settings.js';

// ── Presets ──────────────────────────────────────────────────────────────

test('the default portrait canvas is a known preset', () => {
	assert.equal(matchAspectPreset(1080, 1920)?.id, 'portrait');
});

test('a custom size matches no preset', () => {
	// Reporting a preset here would claim the canvas is something it is not.
	assert.equal(matchAspectPreset(1234, 567), null);
});

test('the same ratio at a different size is not the preset', () => {
	// 720x1280 is 9:16, but it is not what "Reels" would set.
	assert.equal(matchAspectPreset(720, 1280), null);
});

test('a preset patch carries both dimensions', () => {
	assert.deepEqual(aspectPatch('landscape'), { width: 1920, height: 1080 });
});

test('an unknown preset id yields null rather than a broken patch', () => {
	assert.equal(aspectPatch('nope'), null);
});

test('every preset is inside the renderable range', () => {
	for (const preset of ASPECT_PRESETS) {
		assert.ok(preset.width >= MIN_DIMENSION && preset.width <= MAX_DIMENSION, preset.id);
		assert.ok(preset.height >= MIN_DIMENSION && preset.height <= MAX_DIMENSION, preset.id);
	}
});

test('the standard quality preset is the renderer default, so choosing it changes nothing', () => {
	assert.equal(QUALITY_PRESETS.find((p) => p.id === 'standard').bitrate, DEFAULT_BITRATE);
	assert.equal(matchQualityPreset(DEFAULT_BITRATE)?.id, 'standard');
});

test('an unset bitrate reads as standard', () => {
	assert.equal(matchQualityPreset(undefined)?.id, 'standard');
});

test('a hand-set bitrate matches no preset', () => {
	assert.equal(matchQualityPreset(5_500_000), null);
});

test('every offered frame rate is renderable', () => {
	for (const fps of FPS_OPTIONS) assert.ok(fps >= 1 && fps <= MAX_FPS);
});

// ── Rotate ───────────────────────────────────────────────────────────────

test('rotating swaps width and height', () => {
	assert.deepEqual(rotatePatch({ width: 1080, height: 1920 }), { width: 1920, height: 1080 });
});

test('rotating a landscape preset lands on the portrait one', () => {
	const rotated = rotatePatch({ width: 1920, height: 1080 });
	assert.equal(matchAspectPreset(rotated.width, rotated.height)?.id, 'portrait');
});

test('rotating with no settings falls back rather than producing NaN', () => {
	const rotated = rotatePatch({});
	assert.ok(Number.isFinite(rotated.width) && Number.isFinite(rotated.height));
});

// ── Clamping ─────────────────────────────────────────────────────────────

test('an oversized dimension is clamped, not rejected', () => {
	// The backend refuses anything over 4096, and a silently unchanged input
	// reads as a broken control.
	assert.equal(settingsPatch({}, { width: 99999 }).width, MAX_DIMENSION);
	assert.equal(settingsPatch({}, { height: 0 }).height, MIN_DIMENSION);
});

test('frame rate is clamped to what the renderer accepts', () => {
	assert.equal(settingsPatch({}, { fps: 500 }).fps, MAX_FPS);
	assert.equal(settingsPatch({}, { fps: 0 }).fps, 1);
});

test('a non-numeric entry falls back to the current value', () => {
	assert.equal(settingsPatch({ width: 800 }, { width: 'wide' }).width, 800);
});

test('bitrate is clamped to a sane band', () => {
	assert.ok(settingsPatch({}, { bitrate: 1 }).bitrate >= 400_000);
	assert.ok(settingsPatch({}, { bitrate: 999_000_000 }).bitrate <= 64_000_000);
});

test('a patch only carries the keys that changed', () => {
	// Writing every field would stamp defaults onto a project that never set them.
	assert.deepEqual(settingsPatch({ width: 100, height: 200 }, { fps: 24 }), { fps: 24 });
	assert.deepEqual(settingsPatch({}, {}), {});
});

test('dimensions are whole numbers', () => {
	assert.equal(settingsPatch({}, { width: 1080.6 }).width, 1081);
});

test('a background colour passes through, a non-string does not', () => {
	assert.equal(settingsPatch({}, { backgroundColor: '#ff0000' }).backgroundColor, '#ff0000');
	assert.deepEqual(settingsPatch({}, { backgroundColor: 123 }), {});
});

// ── Reading ──────────────────────────────────────────────────────────────

test('reading fills in defaults for an empty project', () => {
	assert.deepEqual(readSettings({}), {
		width: 1080,
		height: 1920,
		fps: 30,
		bitrate: DEFAULT_BITRATE,
		backgroundColor: '#000000'
	});
});

test('reading preserves what is set', () => {
	const settings = readSettings({ width: 1920, height: 1080, fps: 60, bitrate: 16_000_000 });
	assert.equal(settings.width, 1920);
	assert.equal(settings.fps, 60);
	assert.equal(settings.bitrate, 16_000_000);
});

// ── Size estimate ────────────────────────────────────────────────────────

test('the size estimate follows bitrate and duration', () => {
	// 8 Mbps for 10s is 10MB of video, near enough for a hint.
	assert.equal(estimatedSizeMb(8_000_000, 10_000_000), 9.5);
	assert.ok(estimatedSizeMb(16_000_000, 10_000_000) > estimatedSizeMb(8_000_000, 10_000_000));
});

test('a zero-length composition estimates zero rather than NaN', () => {
	assert.equal(estimatedSizeMb(8_000_000, 0), 0);
	assert.equal(estimatedSizeMb(undefined, undefined), 0);
});
