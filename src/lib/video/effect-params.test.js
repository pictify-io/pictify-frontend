/**
 * Tests for uniform -> control derivation and effect value patches.
 * Run: node --test src/lib/video/effect-params.test.js
 *
 * The behaviour worth pinning is what happens to values NOT set: a control that
 * writes every uniform on first touch freezes the current engine defaults into
 * every saved template, so a later engine improving a shader's default has no
 * effect on any template anyone already made.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	prettyLabel,
	paramLabel,
	rangeFor,
	isVec2,
	isColor,
	specsFromUniforms,
	createEffectClip,
	readEffectValues,
	effectValuePatch,
	resetEffectValues,
	DEFAULT_EFFECT_US,
	MIN_EFFECT_US,
	EFFECT_Z_INDEX
} from './effect-params.js';

const uniform = (value, type = 'float') => ({ value, type });

// ── Labels ───────────────────────────────────────────────────────────────

test('camelCase and snake_case keys become readable labels', () => {
	assert.equal(prettyLabel('oldFilm'), 'Old film');
	assert.equal(prettyLabel('old_film'), 'Old film');
	assert.equal(prettyLabel('rgb-split'), 'Rgb split');
	assert.equal(prettyLabel('glitch'), 'Glitch');
});

test('a missing key does not throw', () => {
	assert.equal(prettyLabel(undefined), '');
	assert.equal(prettyLabel(null), '');
});

test('the shader "u" prefix is stripped from control labels', () => {
	// Uniforms are conventionally uIntensity / uDirection, which surfaced in the
	// panel as "U Intensity" and read as a typo.
	assert.equal(paramLabel('uIntensity'), 'Intensity');
	assert.equal(paramLabel('uDirection'), 'Direction');
});

test('a name that merely starts with u keeps it', () => {
	// Stripping unconditionally would turn "use" into "se".
	assert.equal(paramLabel('use'), 'Use');
	assert.equal(paramLabel('up'), 'Up');
	assert.equal(paramLabel('uniform_scale'), 'Uniform scale');
});

test('param labels handle camelCase and separators', () => {
	assert.equal(paramLabel('noiseSize'), 'Noise size');
	assert.equal(paramLabel('scratch_density'), 'Scratch density');
	assert.equal(paramLabel(''), '');
});

// ── Value classification ─────────────────────────────────────────────────

test('vec2 is a pair of numbers, nothing else', () => {
	assert.equal(isVec2([1, 2]), true);
	assert.equal(isVec2([1, 2, 3]), false);
	assert.equal(isVec2([1]), false);
	assert.equal(isVec2(['a', 'b']), false);
	assert.equal(isVec2(null), false);
});

test('colours are hex strings', () => {
	assert.equal(isColor('#ffffff'), true);
	assert.equal(isColor('#FFF'), true);
	assert.equal(isColor('#ff00ff80'), true);
	assert.equal(isColor('white'), false);
	assert.equal(isColor(1), false);
});

// ── Ranges ───────────────────────────────────────────────────────────────

test('a normalised uniform gets a 0..1 track', () => {
	assert.deepEqual(rangeFor(0.5), { min: 0, max: 1, step: 0.01 });
});

test('a large default gets a range that can actually reach it', () => {
	// A pixelate size of 30 on a 0..1 slider is pinned to the end and looks broken.
	const range = rangeFor(30);
	assert.ok(range.max >= 30);
	assert.equal(range.min, 0);
});

test('a negative default opens the range below zero', () => {
	assert.ok(rangeFor(-0.5).min < 0);
	assert.ok(rangeFor(-40).min < 0);
});

test('a big range steps in whole numbers', () => {
	// 0.01 steps across a 0..300 track is 30,000 drag positions.
	assert.equal(rangeFor(200).step, 1);
});

// ── Spec derivation ──────────────────────────────────────────────────────

test('each value type picks its own control', () => {
	const specs = specsFromUniforms({
		amount: uniform(0.5),
		enabled: uniform(true, 'bool'),
		tint: uniform('#ff0000', 'vec3'),
		center: uniform([0.5, 0.5], 'vec2')
	});
	assert.deepEqual(
		specs.map((s) => [s.name, s.kind]),
		[
			['amount', 'number'],
			['enabled', 'boolean'],
			['tint', 'color'],
			['center', 'vec2']
		]
	);
});

test('the GLSL type string is ignored in favour of the actual value', () => {
	// Shaders disagree about type names and the vocabulary grows between
	// versions; a JavaScript number is reliably a number.
	const [spec] = specsFromUniforms({ x: { value: 3, type: 'totally-unknown' } });
	assert.equal(spec.kind, 'number');
});

test('unsupported uniforms are skipped, not rendered as dead controls', () => {
	const specs = specsFromUniforms({
		matrix: uniform([1, 0, 0, 1, 0, 0]),
		sampler: uniform({ texture: true }),
		nothing: uniform(null),
		good: uniform(0.25)
	});
	assert.deepEqual(specs.map((s) => s.name), ['good']);
});

test('NaN and Infinity are not offered as sliders', () => {
	assert.deepEqual(specsFromUniforms({ a: uniform(NaN), b: uniform(Infinity) }), []);
});

test('a shader with no uniforms yields no controls', () => {
	assert.deepEqual(specsFromUniforms(undefined), []);
	assert.deepEqual(specsFromUniforms({}), []);
	assert.deepEqual(specsFromUniforms('nonsense'), []);
});

// ── Clip creation ────────────────────────────────────────────────────────

test('a new effect clip is typed, keyed and timed', () => {
	const clip = createEffectClip({ key: 'oldFilm', fromUs: 1_000_000 });
	assert.equal(clip.type, 'Effect');
	assert.equal(clip.effectKey, 'oldFilm');
	assert.equal(clip.name, 'Old film');
	assert.equal(clip.timing.display.from, 1_000_000);
	assert.equal(clip.timing.display.to, 1_000_000 + DEFAULT_EFFECT_US);
});

test('a new effect sits above the content it is meant to affect', () => {
	// An effect shades everything BELOW it. At the default z-index it lands
	// under the scene and does nothing: clip on the timeline, working controls,
	// unchanged canvas. That reads as a broken feature, not a layering mistake.
	const clip = createEffectClip({ key: 'invert' });
	assert.ok(clip.transform.zIndex >= 900, `z-index was ${clip.transform.zIndex}`);
});

test('the effect z-index clears the caption band', () => {
	// Captions are placed at 50; an effect below them would leave the subtitles
	// untouched while shading the footage, which looks like a rendering fault.
	assert.ok(createEffectClip({ key: 'a' }).transform.zIndex > 50);
});

test('an explicit z-index is respected', () => {
	assert.equal(createEffectClip({ key: 'a', zIndex: 12 }).transform.zIndex, 12);
});

test('a nonsense z-index falls back rather than producing NaN', () => {
	assert.equal(
		createEffectClip({ key: 'a', zIndex: 'top' }).transform.zIndex,
		EFFECT_Z_INDEX
	);
});

test('a new effect stores no values at all', () => {
	// Absent means "the shader's default". Writing them out freezes today's
	// defaults into every template ever saved.
	assert.deepEqual(createEffectClip({ key: 'glitch' }).values, {});
});

test('an explicit label wins over the derived one', () => {
	assert.equal(createEffectClip({ key: 'x', label: 'My Look' }).name, 'My Look');
});

test('duration is clamped and a negative start is pulled to zero', () => {
	assert.equal(createEffectClip({ key: 'a', durationUs: 1 }).timing.duration, MIN_EFFECT_US);
	assert.equal(createEffectClip({ key: 'a', fromUs: -5 }).timing.display.from, 0);
});

test('createEffectClip survives being called with nothing', () => {
	const clip = createEffectClip();
	assert.equal(clip.type, 'Effect');
	assert.equal(clip.timing.duration, DEFAULT_EFFECT_US);
});

// ── Reading and patching ─────────────────────────────────────────────────

const specs = specsFromUniforms({ amount: uniform(0.5), on: uniform(true) });

test('unset uniforms read back as the shader default', () => {
	assert.deepEqual(readEffectValues({ values: {} }, specs), { amount: 0.5, on: true });
});

test('a stored override wins over the default', () => {
	assert.equal(readEffectValues({ values: { amount: 0.9 } }, specs).amount, 0.9);
});

test('a stored false is respected rather than treated as unset', () => {
	// `stored[name] || default` would resurrect the default here.
	assert.equal(readEffectValues({ values: { on: false } }, specs).on, false);
});

test('a patch writes a changed value', () => {
	assert.deepEqual(effectValuePatch({ values: {} }, specs, 'amount', 0.8), {
		values: { amount: 0.8 }
	});
});

test('setting a value back to the default removes it', () => {
	// Otherwise touching a slider and undoing pins the old default forever.
	const patch = effectValuePatch({ values: { amount: 0.9 } }, specs, 'amount', 0.5);
	assert.deepEqual(patch.values, {});
});

test('numbers are clamped to the control range', () => {
	assert.equal(effectValuePatch({ values: {} }, specs, 'amount', 99).values.amount, 1);
	assert.equal(effectValuePatch({ values: {} }, specs, 'amount', -99).values.amount, 0);
});

test('other values on the clip survive a patch', () => {
	const patch = effectValuePatch({ values: { on: false } }, specs, 'amount', 0.7);
	assert.deepEqual(patch.values, { on: false, amount: 0.7 });
});

test('an unknown uniform name is refused', () => {
	assert.equal(effectValuePatch({ values: {} }, specs, 'nope', 1), null);
});

test('a non-numeric value for a slider is refused', () => {
	assert.equal(effectValuePatch({ values: {} }, specs, 'amount', 'loud'), null);
});

test('a malformed vec2 or colour is refused rather than written', () => {
	const s = specsFromUniforms({ c: uniform([0, 0]), tint: uniform('#000000') });
	assert.equal(effectValuePatch({ values: {} }, s, 'c', [1]), null);
	assert.equal(effectValuePatch({ values: {} }, s, 'tint', 'reddish'), null);
	assert.deepEqual(effectValuePatch({ values: {} }, s, 'c', [1, 2]).values, { c: [1, 2] });
});

test('reset clears every override', () => {
	assert.deepEqual(resetEffectValues().values, {});
});
