/**
 * Tests for the studio's variables engine.
 *
 * Run with:  node --test src/lib/video/variables.test.js
 *
 * Uses Node's built-in test runner rather than adding a test framework to the
 * frontend. The module under test is pure — no Svelte, no DOM, no engine — so
 * that's all it needs.
 *
 * What matters here is the stuff that is easy to get subtly wrong and hard to
 * see in a browser: patch construction against the engine's one-level merge,
 * and the auto-declare/prune rules that decide whether a user's variable
 * silently disappears.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	detectTokens,
	detectBoundVariables,
	detectReferences,
	replaceTokens,
	reconcileDefinitions,
	resolveValues,
	missingRequired,
	buildClipPatch,
	computeOverlayPatches,
	applyVariables,
	withBinding,
	pruneBindings,
	stripToken,
	humanizeName,
	isPristine,
	makeDefinition,
	bindingTargetsForClip,
	MICROSECONDS_PER_SECOND
} from './variables.js';

const project = (clips, settings = {}) => ({
	settings: { width: 1080, height: 1920, fps: 30, ...settings },
	tracks: [],
	clips
});

const bound = (target, variable, extra = {}) => ({
	metadata: { pictify: { bindings: [{ target, variable, ...extra }] } }
});

// ── Detection ────────────────────────────────────────────────────────────

test('detectTokens finds tokens in order, without duplicates', () => {
	const doc = project({
		a: { id: 'a', type: 'Text', text: 'Hi {{name}}, welcome {{name}}' },
		b: { id: 'b', type: 'Text', text: '{{company}}' }
	});
	assert.deepEqual(detectTokens(doc), ['name', 'company']);
});

test('detectTokens tolerates whitespace inside the braces', () => {
	const doc = project({ a: { id: 'a', type: 'Text', text: '{{  spaced  }}' } });
	assert.deepEqual(detectTokens(doc), ['spaced']);
});

test('detectTokens ignores malformed tokens', () => {
	const doc = project({ a: { id: 'a', type: 'Text', text: '{{ not-valid }} {{ok}}' } });
	assert.deepEqual(detectTokens(doc), ['ok']);
});

test('detectBoundVariables reads clip bindings', () => {
	const doc = project({
		img: { id: 'img', type: 'Image', src: 'https://x/y.png', ...bound('src', 'photo') }
	});
	assert.deepEqual(detectBoundVariables(doc), ['photo']);
});

test('detectReferences merges tokens and bindings', () => {
	const doc = project({
		t: { id: 't', type: 'Text', text: '{{name}}' },
		i: { id: 'i', type: 'Image', src: 'https://x/y.png', ...bound('src', 'photo') }
	});
	assert.deepEqual(detectReferences(doc), ['name', 'photo']);
});

test('replaceTokens leaves unknown tokens literal', () => {
	assert.equal(replaceTokens('{{a}} {{b}}', { a: '1' }), '1 {{b}}');
});

// ── Reconciliation ───────────────────────────────────────────────────────

test('reconcile auto-declares a newly typed token', () => {
	const result = reconcileDefinitions([], ['name'], {});
	assert.deepEqual(result.added, ['name']);
	assert.equal(result.definitions.length, 1);
	assert.equal(result.definitions[0].type, 'text');
	assert.deepEqual(result.autoAdded, ['name']);
});

test('reconcile prunes an auto-added, untouched, now-orphaned variable', () => {
	const defs = [makeDefinition('name')];
	const result = reconcileDefinitions(defs, [], { autoAdded: ['name'] });
	assert.deepEqual(result.removed, ['name']);
	assert.equal(result.definitions.length, 0);
});

test('reconcile KEEPS an orphaned variable the user configured', () => {
	const defs = [{ ...makeDefinition('name'), defaultValue: 'Ada' }];
	const result = reconcileDefinitions(defs, [], { autoAdded: ['name'] });
	assert.deepEqual(result.removed, []);
	assert.equal(result.definitions.length, 1);
});

test('reconcile KEEPS an orphaned variable the user declared by hand', () => {
	// Never auto-added, so never auto-removed — even though nothing uses it.
	const result = reconcileDefinitions([makeDefinition('manual')], [], { autoAdded: [] });
	assert.deepEqual(result.removed, []);
	assert.equal(result.definitions.length, 1);
});

test('reconcile does NOT resurrect a name the user explicitly deleted', () => {
	const result = reconcileDefinitions([], ['name'], {
		explicitlyDeleted: new Set(['name'])
	});
	assert.deepEqual(result.added, []);
	assert.equal(result.definitions.length, 0);
});

test('reconcile never duplicates an already-declared name', () => {
	const result = reconcileDefinitions([makeDefinition('name')], ['name'], {});
	assert.deepEqual(result.added, []);
	assert.equal(result.definitions.length, 1);
});

test('isPristine tracks whether a definition has been touched', () => {
	assert.equal(isPristine(makeDefinition('a')), true);
	assert.equal(isPristine({ ...makeDefinition('a'), defaultValue: 'x' }), false);
	assert.equal(isPristine({ ...makeDefinition('a'), type: 'image' }), false);
	assert.equal(
		isPristine({ ...makeDefinition('a'), validation: { required: true } }),
		false
	);
});

// ── Values ───────────────────────────────────────────────────────────────

test('resolveValues prefers a supplied value, falls back to the default', () => {
	const defs = [{ ...makeDefinition('a'), defaultValue: 'fallback' }];
	assert.equal(resolveValues(defs, {}).a, 'fallback');
	assert.equal(resolveValues(defs, { a: 'given' }).a, 'given');
});

test('resolveValues omits empties so the authored value survives', () => {
	const defs = [makeDefinition('a')];
	assert.equal('a' in resolveValues(defs, { a: '' }), false);
});

test('missingRequired only reports required-and-unfilled names', () => {
	const defs = [
		{ ...makeDefinition('needed'), validation: { required: true } },
		{ ...makeDefinition('optional') },
		{
			...makeDefinition('hasDefault'),
			defaultValue: 'x',
			validation: { required: true }
		}
	];
	assert.deepEqual(missingRequired(defs, {}), ['needed']);
	assert.deepEqual(missingRequired(defs, { needed: 'v' }), []);
});

// ── Patch building (the engine-merge-rules code) ─────────────────────────

test('buildClipPatch substitutes text and can restore it', () => {
	const clip = { id: 'c', type: 'Text', text: 'Hi {{name}}' };
	const { patch, restore } = buildClipPatch(clip, { name: 'Ada' });
	assert.equal(patch.text, 'Hi Ada');
	assert.equal(restore.text, 'Hi {{name}}');
});

test('buildClipPatch returns null when nothing changes', () => {
	assert.equal(buildClipPatch({ id: 'c', type: 'Text', text: 'no tokens' }, {}), null);
});

test('buildClipPatch carries the WHOLE style object, not just the bound key', () => {
	// core.clip.update merges style one level deep, so a partial style patch
	// would be fine — but the restore has to rebuild the original, and any
	// sibling key must survive both directions.
	const clip = {
		id: 'c',
		type: 'Shape',
		style: { fill: '#fff', fillOpacity: 1 },
		...bound('style.fill', 'brand')
	};
	const { patch, restore } = buildClipPatch(clip, { brand: '#ffc480' });
	assert.equal(patch.style.fill, '#ffc480');
	assert.equal(patch.style.fillOpacity, 1, 'sibling style key must survive');
	assert.equal(restore.style.fill, '#fff');
});

test('buildClipPatch carries the WHOLE timing.display, not just the bound end', () => {
	// This is the one that bites: timing merges only one level, so patching
	// { timing: { display: { to } } } naively would drop `from`.
	const clip = {
		id: 'c',
		type: 'Text',
		text: 'hi',
		timing: { display: { from: 500, to: 1000 } },
		...bound('timing.display.to', 'hold', { unit: 'seconds' })
	};
	const { patch, restore } = buildClipPatch(clip, { hold: 4 });
	assert.equal(patch.timing.display.to, 4 * MICROSECONDS_PER_SECOND);
	assert.equal(patch.timing.display.from, 500, 'sibling timing key must survive');
	assert.equal(restore.timing.display.to, 1000);
	assert.equal(restore.timing.display.from, 500);
});

test('buildClipPatch clamps opacity into 0..1', () => {
	const clip = { id: 'c', type: 'Text', text: 'hi', transform: {}, ...bound('transform.opacity', 'o') };
	assert.equal(buildClipPatch(clip, { o: 5 }).patch.transform.opacity, 1);
	assert.equal(buildClipPatch(clip, { o: -2 }).patch.transform.opacity, 0);
});

test('buildClipPatch ignores a binding whose target is not whitelisted', () => {
	const clip = { id: 'c', type: 'Text', text: 'hi', ...bound('__proto__.x', 'evil') };
	assert.equal(buildClipPatch(clip, { evil: 'boom' }), null);
	assert.equal({}.x, undefined);
});

test('buildClipPatch ignores a binding used on the wrong clip type', () => {
	const clip = { id: 'c', type: 'Audio', src: 'https://x/a.mp3', ...bound('style.fill', 'brand') };
	assert.equal(buildClipPatch(clip, { brand: '#fff' }), null);
});

test('buildClipPatch skips a binding with no value, leaving the authored one', () => {
	const clip = { id: 'c', type: 'Image', src: 'https://x/p.png', ...bound('src', 'photo') };
	assert.equal(buildClipPatch(clip, {}), null);
});

test('computeOverlayPatches returns one entry per changed clip', () => {
	const doc = project({
		a: { id: 'a', type: 'Text', text: '{{name}}' },
		b: { id: 'b', type: 'Text', text: 'static' }
	});
	const patches = computeOverlayPatches(doc, { name: 'Ada' }, [makeDefinition('name')]);
	assert.equal(patches.length, 1);
	assert.equal(patches[0].clipId, 'a');
});

// ── Whole-document apply ─────────────────────────────────────────────────

test('applyVariables returns a new document and leaves the original alone', () => {
	const doc = project({ a: { id: 'a', type: 'Text', text: 'Hi {{name}}' } });
	const next = applyVariables(doc, { name: 'Ada' }, [makeDefinition('name')]);
	assert.equal(next.clips.a.text, 'Hi Ada');
	assert.equal(doc.clips.a.text, 'Hi {{name}}', 'input must not be mutated');
});

test('applyVariables substitutes into settings.backgroundColor', () => {
	const doc = project({}, { backgroundColor: '{{bg}}' });
	const next = applyVariables(doc, { bg: '#ffc480' }, [makeDefinition('bg', 'color')]);
	assert.equal(next.settings.backgroundColor, '#ffc480');
});

// ── Bindings ─────────────────────────────────────────────────────────────

test('withBinding preserves unrelated metadata', () => {
	// The vendored text presets store their own metadata; clobbering it would
	// silently break them, and clip.update SHALLOW-assigns metadata.
	const clip = { metadata: { preset: 'title', pictify: { bindings: [] } } };
	const next = withBinding(clip, 'src', 'photo');
	assert.equal(next.preset, 'title');
	assert.deepEqual(next.pictify.bindings, [{ target: 'src', variable: 'photo' }]);
});

test('withBinding replaces a binding for the same target rather than stacking', () => {
	const clip = { metadata: { pictify: { bindings: [{ target: 'src', variable: 'old' }] } } };
	const next = withBinding(clip, 'src', 'new');
	assert.equal(next.pictify.bindings.length, 1);
	assert.equal(next.pictify.bindings[0].variable, 'new');
});

test('withBinding with a null variable unbinds', () => {
	const clip = { metadata: { pictify: { bindings: [{ target: 'src', variable: 'photo' }] } } };
	assert.deepEqual(withBinding(clip, 'src', null).pictify.bindings, []);
});

test('withBinding stamps the unit for a seconds-based target', () => {
	const next = withBinding({}, 'timing.display.to', 'hold');
	assert.equal(next.pictify.bindings[0].unit, 'seconds');
});

test('pruneBindings drops references to deleted variables', () => {
	const doc = project({
		a: { id: 'a', type: 'Image', src: 'https://x/p.png', ...bound('src', 'gone') }
	});
	assert.equal(pruneBindings(doc, new Set(['other'])), 1);
	assert.deepEqual(doc.clips.a.metadata.pictify.bindings, []);
});

test('bindingTargetsForClip is type-aware', () => {
	const forImage = bindingTargetsForClip('Image').map((t) => t.target);
	assert.ok(forImage.includes('src'));
	assert.ok(!forImage.includes('style.fill'));

	// Text and Shape take DIFFERENT colour keys. Offering style.fill on Text was
	// a real bug: the value landed on the clip and the renderer never read it.
	const forText = bindingTargetsForClip('Text').map((t) => t.target);
	assert.ok(forText.includes('style.color'), 'text colour is style.color');
	assert.ok(!forText.includes('style.fill'), 'style.fill is dead on text');
	assert.ok(!forText.includes('src'));

	const forShape = bindingTargetsForClip('Shape').map((t) => t.target);
	assert.ok(forShape.includes('style.fill'), 'shape fill is style.fill');
	assert.ok(!forShape.includes('style.color'));
});

// ── Token stripping ──────────────────────────────────────────────────────

test('stripToken replaces a deleted variable with readable text', () => {
	const doc = project({ a: { id: 'a', type: 'Text', text: 'Hi {{firstName}}!' } });
	assert.equal(stripToken(doc, 'firstName', 'Ada'), 1);
	assert.equal(doc.clips.a.text, 'Hi Ada!');
});

test('stripToken falls back to the humanized name so a clip never goes blank', () => {
	const doc = project({ a: { id: 'a', type: 'Text', text: '{{firstName}}' } });
	stripToken(doc, 'firstName');
	assert.equal(doc.clips.a.text, 'First Name');
});

test('humanizeName splits camelCase and separators', () => {
	assert.equal(humanizeName('recipientName'), 'Recipient Name');
	assert.equal(humanizeName('recipient_name'), 'Recipient Name');
	assert.equal(humanizeName('name'), 'Name');
});

// ── Gradient stops ───────────────────────────────────────────────────────

test('buildClipPatch writes an indexed gradient stop into the colors array', () => {
	// The generic style.* branch would write a literal "colors.0" key, which the
	// engine ignores — while the server writes the array element. That mismatch
	// makes the preview disagree with the render.
	const clip = {
		id: 'g',
		type: 'Backdrop',
		style: { backdropType: 'gradient', gradientType: 'linear:90', colors: ['#FF512F', '#F09819'] },
		...bound('style.colors.0', 'brand')
	};
	const { patch, restore } = buildClipPatch(clip, { brand: '#6A5AF9' });
	assert.deepEqual(patch.style.colors, ['#6A5AF9', '#F09819']);
	assert.equal(patch.style['colors.0'], undefined, 'must not write a literal dotted key');
	assert.equal(patch.style.gradientType, 'linear:90', 'angle carrier must survive');
	assert.deepEqual(restore.style.colors, ['#FF512F', '#F09819']);
});

test('buildClipPatch applies two bound stops to the same gradient', () => {
	const clip = {
		id: 'g',
		type: 'Backdrop',
		style: { backdropType: 'gradient', gradientType: 'linear:90', colors: ['#000', '#111'] },
		metadata: {
			pictify: {
				bindings: [
					{ target: 'style.colors.0', variable: 'a' },
					{ target: 'style.colors.1', variable: 'b' }
				]
			}
		}
	};
	const { patch } = buildClipPatch(clip, { a: '#ff0000', b: '#0000ff' });
	assert.deepEqual(patch.style.colors, ['#ff0000', '#0000ff']);
});

test('a gradient stop binding is rejected on a non-Backdrop clip', () => {
	const clip = { id: 't', type: 'Text', text: 'hi', style: {}, ...bound('style.colors.0', 'c') };
	assert.equal(buildClipPatch(clip, { c: '#fff' }), null);
});

test('bindingTargetsForClip offers gradient stops only on a Backdrop', () => {
	const backdrop = bindingTargetsForClip('Backdrop').map((t) => t.target);
	assert.ok(backdrop.includes('style.colors.0'));
	assert.ok(backdrop.includes('style.colors.1'));

	const text = bindingTargetsForClip('Text').map((t) => t.target);
	assert.ok(!text.includes('style.colors.0'));
});

test('a text colour binding writes style.color', () => {
	const clip = {
		id: 't',
		type: 'Text',
		text: 'hi',
		style: { color: '#ffffff', fontSize: 96 },
		...bound('style.color', 'brand')
	};
	const { patch } = buildClipPatch(clip, { brand: '#ffc480' });
	assert.equal(patch.style.color, '#ffc480');
	assert.equal(patch.style.fontSize, 96);
});

test('a text background binding writes the NESTED style.background.color', () => {
	const clip = {
		id: 't',
		type: 'Text',
		text: 'hi',
		style: { background: { color: '#000000', borderRadius: 4 } },
		...bound('style.background.color', 'bg')
	};
	const { patch, restore } = buildClipPatch(clip, { bg: '#ffc480' });
	assert.equal(patch.style.background.color, '#ffc480');
	assert.equal(patch.style.background.borderRadius, 4, 'sibling must survive');
	assert.equal(restore.style.background.color, '#000000');
});
