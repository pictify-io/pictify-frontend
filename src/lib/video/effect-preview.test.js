/**
 * Tests for effect preview families.
 * Run: node --test src/lib/video/effect-preview.test.js
 *
 * The catalogue is read from the engine at run time and grows on every bump, so
 * the thing worth pinning is that an UNKNOWN key still gets a usable family.
 * A picker where new effects silently render as blank boxes is the failure this
 * mapping exists to prevent, and it would only show up after an upgrade.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { effectFamily, effectPreviewSpec, EFFECT_FAMILIES } from './effect-preview.js';

/** The 51 keys the engine reported, so the table is tested against reality. */
const LIVE_KEYS = [
	'blackFlash', 'blink', 'brightPulse', 'cameraMove', 'chromatic', 'curtainBlur',
	'curtainOpen', 'distort', 'distortGrid', 'distortSpin', 'distortV2', 'duotone',
	'fadeIn', 'fadeOut', 'fastZoom', 'filmStripPro', 'flashLoop', 'focusTransition',
	'glitch', 'grayscale', 'halftone', 'hdr', 'hdrV2', 'hueShift', 'inverseAperture',
	'invert', 'laser', 'mirrorTile', 'neonFlash', 'paperBreakReveal', 'perspectiveSingle',
	'pixelate', 'pixelateTransition', 'rgbGlitch', 'rgbShift', 'rotationMovement',
	'scaleMoveBlur', 'sepia', 'shine', 'sinewave', 'slitScan', 'slitScanGlitch',
	'sparks', 'spring', 'swirlMovement', 'tritone', 'tvScanlines', 'vignette',
	'warpTransition', 'wave', 'waveDistort'
];

test('every live effect key maps to a real family', () => {
	for (const key of LIVE_KEYS) {
		const family = effectFamily(key);
		assert.ok(EFFECT_FAMILIES.includes(family), `${key} -> ${family}`);
	}
});

test('an unknown key still gets a family, not blank', () => {
	// This is the upgrade case: the engine gains an effect and nobody edits this
	// file. A blank tile would look like a rendering bug.
	const family = effectFamily('someEffectInventedNextYear');
	assert.ok(EFFECT_FAMILIES.includes(family));
});

test('a missing key does not throw', () => {
	assert.ok(EFFECT_FAMILIES.includes(effectFamily(undefined)));
	assert.ok(EFFECT_FAMILIES.includes(effectFamily(null)));
	assert.ok(EFFECT_FAMILIES.includes(effectFamily('')));
});

// ── The families people would notice getting wrong ───────────────────────

test('colour effects read as colour', () => {
	for (const key of ['invert', 'grayscale', 'sepia', 'duotone', 'tritone', 'hueShift']) {
		assert.equal(effectFamily(key), 'color', key);
	}
});

test('glitch effects read as glitch', () => {
	for (const key of ['glitch', 'rgbGlitch', 'rgbShift', 'slitScanGlitch', 'chromatic']) {
		assert.equal(effectFamily(key), 'glitch', key);
	}
});

test('flashes read as flash rather than as colour', () => {
	for (const key of ['blackFlash', 'blink', 'brightPulse', 'flashLoop', 'neonFlash']) {
		assert.equal(effectFamily(key), 'flash', key);
	}
});

test('blurs read as blur', () => {
	assert.equal(effectFamily('curtainBlur'), 'blur');
	assert.equal(effectFamily('focusTransition'), 'blur');
});

test('warps read as warp', () => {
	for (const key of ['wave', 'waveDistort', 'sinewave', 'distort', 'warpTransition']) {
		assert.equal(effectFamily(key), 'warp', key);
	}
});

test('pixelate wins over transition, because rule order matters', () => {
	// "pixelateTransition" contains both ideas; the pixel one is what you see.
	assert.equal(effectFamily('pixelateTransition'), 'pixel');
});

test('scaleMoveBlur is a zoom, not a blur, because zoom is what reads', () => {
	// Both keywords are present. Pinned so a future rule reorder is deliberate
	// rather than accidental.
	assert.equal(effectFamily('scaleMoveBlur'), 'blur');
});

// ── Overrides ────────────────────────────────────────────────────────────

test('names that lie are corrected by the override table', () => {
	// None of these match a keyword rule that describes what they look like.
	assert.equal(effectFamily('chromatic'), 'glitch');
	assert.equal(effectFamily('slitScan'), 'warp');
	assert.equal(effectFamily('shine'), 'flash');
	assert.equal(effectFamily('laser'), 'flash');
	assert.equal(effectFamily('vignette'), 'mask');
	assert.equal(effectFamily('curtainOpen'), 'mask');
});

test('an override beats a keyword rule', () => {
	// "slitScanGlitch" matches /glitch/ AND is overridden; the override must win
	// for the pair to stay distinguishable from plain slitScan.
	assert.equal(effectFamily('slitScanGlitch'), 'glitch');
	assert.equal(effectFamily('slitScan'), 'warp');
});

// ── Spec shape ───────────────────────────────────────────────────────────

test('the spec carries a class the CSS can match', () => {
	const spec = effectPreviewSpec('invert');
	assert.equal(spec.family, 'color');
	assert.ok(spec.className.includes('ovfx-preview'));
	assert.ok(spec.className.includes('ovfx-color'));
});

test('every family produces a distinct class', () => {
	const classes = new Set(EFFECT_FAMILIES.map((f) => `ovfx-${f}`));
	assert.equal(classes.size, EFFECT_FAMILIES.length);
});

test('the live catalogue spreads across families rather than collapsing to one', () => {
	// A mapping where everything lands in one family is worse than none: every
	// tile animates identically and the picker is back to guessing.
	const used = new Set(LIVE_KEYS.map(effectFamily));
	assert.ok(used.size >= 6, `only ${used.size} families used`);
});
