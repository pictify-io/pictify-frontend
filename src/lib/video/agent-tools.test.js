/**
 * Tests for the copilot's tool table.
 * Run: node --test src/lib/video/agent-tools.test.js
 *
 * The model is an untrusted caller. It will send ids that do not exist, numbers
 * outside every range, strings where numbers go, and colours that are not
 * colours — not occasionally, but as a matter of course. So the validators are
 * pinned harder than the happy paths, and the rule under all of them is that a
 * bad call costs its own operation and nothing else.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	TOOLS,
	toolByName,
	toolSchema,
	planToolCalls,
	describeDocument,
	summarizeOperations,
	searchCatalogue,
	describeMedia
} from './agent-tools.js';

const S = 1_000_000;

const doc = () => ({
	settings: { width: 1080, height: 1920, fps: 30, duration: 6 * S },
	clips: {
		t1: {
			id: 't1',
			type: 'Text',
			name: 'Title',
			text: 'Hello',
			transform: { x: 100, y: 200, width: 800, height: 120, angle: 0, opacity: 1, zIndex: 5 },
			timing: { display: { from: 0, to: 3 * S }, duration: 3 * S },
			style: { color: '#ffffff', fontSize: 60 }
		},
		s1: {
			id: 's1',
			type: 'Shape',
			name: 'Plate',
			transform: { x: 0, y: 1400, width: 1080, height: 200, angle: 0, opacity: 1, zIndex: 1 },
			timing: { display: { from: 0, to: 6 * S }, duration: 6 * S },
			style: { fill: '#0f172a' }
		}
	}
});

const call = (name, args) => ({ name, args });

// ── The table ────────────────────────────────────────────────────────────

test('every tool declares a name, description, params and both hooks', () => {
	for (const tool of TOOLS) {
		assert.ok(tool.name && tool.description, tool.name);
		assert.equal(typeof tool.validate, 'function', tool.name);
		assert.equal(typeof tool.apply, 'function', tool.name);
		assert.ok(Object.keys(tool.params || {}).length, tool.name);
	}
});

test('the schema is the table, without the executable parts', () => {
	const schema = toolSchema();
	assert.equal(schema.length, TOOLS.length);
	assert.equal(schema[0].validate, undefined);
	assert.ok(schema[0].description);
});

test('an unknown tool name resolves to null', () => {
	assert.equal(toolByName('drop_database'), null);
});

// ── The document summary ─────────────────────────────────────────────────

test('the summary gives geometry in fractions, not pixels', () => {
	// A model given pixels puts a title at y=1700 on a 1080x1920 canvas and
	// buries it under the caption bar. Fractions travel across canvas sizes.
	const summary = describeDocument(doc());
	const title = summary.clips.find((c) => c.id === 't1');
	assert.equal(title.x, 0.09);
	assert.equal(title.y, 0.1);
	assert.ok(title.width <= 1);
});

test('the summary gives time in seconds', () => {
	const title = describeDocument(doc()).clips.find((c) => c.id === 't1');
	assert.equal(title.startS, 0);
	assert.equal(title.durationS, 3);
});

test('the summary carries the id, because every tool addresses by id', () => {
	for (const clip of describeDocument(doc()).clips) assert.ok(clip.id);
});

test('the summary survives an empty or malformed document', () => {
	assert.deepEqual(describeDocument({}).clips, []);
	assert.deepEqual(describeDocument(null).clips, []);
});

// ── Validation: the model is an untrusted caller ─────────────────────────

test('a call naming a clip that does not exist fails alone', () => {
	const { operations, errors } = planToolCalls(doc(), [
		call('set_text', { clipId: 'ghost', text: 'x' }),
		call('set_text', { clipId: 't1', text: 'Real' })
	]);
	assert.equal(errors.length, 1);
	assert.equal(operations.length, 1, 'the good call still lands');
	assert.match(errors[0].error, /ghost/);
});

test('an unknown tool is reported, not executed', () => {
	const { operations, errors } = planToolCalls(doc(), [call('rm_rf', {})]);
	assert.equal(operations.length, 0);
	assert.match(errors[0].error, /Unknown tool/);
});

test('setting text on a clip that has none is refused', () => {
	const { errors } = planToolCalls(doc(), [call('set_text', { clipId: 's1', text: 'x' })]);
	assert.match(errors[0].error, /no text/i);
});

test('a colour that is not a colour is refused', () => {
	const { errors } = planToolCalls(doc(), [call('set_color', { clipId: 't1', color: 'reddish' })]);
	assert.match(errors[0].error, /hex/);
});

test('non-numeric geometry is refused', () => {
	const { errors } = planToolCalls(doc(), [
		call('move_clip', { clipId: 't1', x: 'left', y: 0.5 })
	]);
	assert.match(errors[0].error, /numbers/);
});

test('a zero or negative size is refused', () => {
	const { errors } = planToolCalls(doc(), [
		call('resize_clip', { clipId: 't1', width: 0, height: 0.5 })
	]);
	assert.equal(errors.length, 1);
});

test('a zero-length duration is refused', () => {
	const { errors } = planToolCalls(doc(), [
		call('set_timing', { clipId: 't1', startS: 1, durationS: 0 })
	]);
	assert.equal(errors.length, 1);
});

test('adding text with no text is refused', () => {
	const { errors } = planToolCalls(doc(), [call('add_text', { text: '   ', x: 0.5, y: 0.5 })]);
	assert.equal(errors.length, 1);
});

// ── The unit boundary ────────────────────────────────────────────────────

test('fractions convert to pixels against the real canvas', () => {
	const { operations } = planToolCalls(doc(), [call('move_clip', { clipId: 't1', x: 0.5, y: 0.25 })]);
	assert.equal(operations[0].patch.transform.x, 540);
	assert.equal(operations[0].patch.transform.y, 480);
});

test('a fraction outside 0..1 is clamped onto the canvas', () => {
	// The model WILL send 1.5. Clamping keeps the clip on screen; passing it
	// through puts it somewhere nobody can find it.
	const { operations } = planToolCalls(doc(), [call('move_clip', { clipId: 't1', x: 9, y: -9 })]);
	assert.equal(operations[0].patch.transform.x, 1080);
	assert.equal(operations[0].patch.transform.y, 0);
});

test('seconds convert to microseconds', () => {
	const { operations } = planToolCalls(doc(), [
		call('set_timing', { clipId: 't1', startS: 2, durationS: 3 })
	]);
	assert.deepEqual(operations[0].patch.timing.display, { from: 2 * S, to: 5 * S });
	assert.equal(operations[0].patch.timing.duration, 3 * S);
});

test('a timing patch carries the whole timing object', () => {
	// core.clip.update merges one level deep, so a partial display would lose
	// its sibling key.
	const { operations } = planToolCalls(doc(), [
		call('set_timing', { clipId: 't1', startS: 0, durationS: 1 })
	]);
	assert.ok('duration' in operations[0].patch.timing);
	assert.ok('display' in operations[0].patch.timing);
});

// ── Colour keys ──────────────────────────────────────────────────────────

test('text takes style.color and a shape takes style.fill', () => {
	// Writing the wrong key lands on the clip and is never read — a change that
	// reports success and does nothing.
	const { operations } = planToolCalls(doc(), [
		call('set_color', { clipId: 't1', color: '#ff0000' }),
		call('set_color', { clipId: 's1', color: '#00ff00' })
	]);
	assert.equal(operations[0].patch.style.color, '#ff0000');
	assert.equal(operations[1].patch.style.fill, '#00ff00');
});

test('setting a colour keeps the rest of the style', () => {
	const { operations } = planToolCalls(doc(), [call('set_color', { clipId: 't1', color: '#ff0000' })]);
	assert.equal(operations[0].patch.style.fontSize, 60);
});

// ── Adding ───────────────────────────────────────────────────────────────

test('added text is centred on the requested point, not left-aligned to it', () => {
	// x is where the text should BE. Treating it as the box's left edge puts
	// every centred title off to the right by half its width.
	const { operations } = planToolCalls(doc(), [
		call('add_text', { text: 'Hi', x: 0.5, y: 0.5, size: 0.05 })
	]);
	const t = operations[0].clip.transform;
	assert.equal(t.x + Math.round(t.width / 2), 540);
});

test('font size is a fraction of the SHORTER side', () => {
	// So type reads the same on portrait and landscape.
	const { operations } = planToolCalls(doc(), [
		call('add_text', { text: 'Hi', x: 0.5, y: 0.5, size: 0.1 })
	]);
	assert.equal(operations[0].clip.style.fontSize, 108);
});

test('an added clip is a complete, renderable payload', () => {
	const { operations } = planToolCalls(doc(), [call('add_text', { text: 'Hi', x: 0.5, y: 0.5 })]);
	const clip = operations[0].clip;
	assert.equal(clip.type, 'Text');
	assert.ok(clip.timing.display.to > clip.timing.display.from);
	assert.ok(clip.transform.width > 0 && clip.transform.height > 0);
	assert.ok(clip.style.fontSize >= 12);
});

test('a bad colour on add falls back rather than failing the call', () => {
	// The text is what was asked for; the colour is a detail worth defaulting.
	const { operations, errors } = planToolCalls(doc(), [
		call('add_text', { text: 'Hi', x: 0.5, y: 0.5, color: 'purple-ish' })
	]);
	assert.equal(errors.length, 0);
	assert.equal(operations[0].clip.style.color, '#ffffff');
});

// ── Removing, and the batch contract ─────────────────────────────────────

test('delete resolves to a remove operation', () => {
	const { operations } = planToolCalls(doc(), [call('delete_clip', { clipId: 's1' })]);
	assert.deepEqual(operations[0], { tool: 'delete_clip', op: 'remove', clipId: 's1' });
});

test('planning never mutates the document', () => {
	// The caller applies the operations and owns undo.
	const source = doc();
	planToolCalls(source, [
		call('move_clip', { clipId: 't1', x: 0.9, y: 0.9 }),
		call('delete_clip', { clipId: 's1' })
	]);
	assert.equal(source.clips.t1.transform.x, 100);
	assert.ok(source.clips.s1);
});

test('an empty or missing call list is a no-op', () => {
	assert.deepEqual(planToolCalls(doc(), []).operations, []);
	assert.deepEqual(planToolCalls(doc(), null).errors, []);
});

// ── The vocabulary gate ──────────────────────────────────────────────────

const vocab = {
	effects: ['invert', 'glitch', 'oldFilm'],
	animations: ['fadeIn', 'slideInLeft'],
	transitions: ['fade', 'wipeLeft']
};

test('an effect the engine does not have is refused', () => {
	// The model guesses "sparkle" if it is not told the real names.
	const { errors } = planToolCalls(doc(), [call('add_effect', { effectKey: 'sparkle' })], vocab);
	assert.match(errors[0].error, /No effect called sparkle/);
});

test('a real effect key lands, above the content it shades', () => {
	const { operations, errors } = planToolCalls(
		doc(),
		[call('add_effect', { effectKey: 'invert', startS: 1, durationS: 2 })],
		vocab
	);
	assert.equal(errors.length, 0);
	assert.equal(operations[0].clip.effectKey, 'invert');
	// Below the content, an effect renders nothing at all.
	assert.ok(operations[0].clip.transform.zIndex > 100);
	assert.equal(operations[0].clip.timing.display.from, 1 * S);
});

test('an unknown animation preset or transition is refused', () => {
	const bad = planToolCalls(doc(), [call('set_animation', { clipId: 't1', inPreset: 'zoomy' })], vocab);
	assert.match(bad.errors[0].error, /No animation called zoomy/);
	const worse = planToolCalls(doc(), [call('add_transition', { clipId: 't1', transitionKey: 'swoosh' })], vocab);
	assert.match(worse.errors[0].error, /No transition called swoosh/);
});

test('with no vocabulary supplied, names are not blocked', () => {
	// The caller could not check, and the panel validates again before applying.
	const { errors } = planToolCalls(doc(), [call('add_effect', { effectKey: 'anything' })]);
	assert.equal(errors.length, 0);
});

test('animation and transition are left for the caller to resolve', () => {
	// Composing presets into keyframes needs the engine's registry, and a
	// transition joins a PAIR, which needs the track order.
	const { operations } = planToolCalls(
		doc(),
		[
			call('set_animation', { clipId: 't1', inPreset: 'fadeIn' }),
			call('add_transition', { clipId: 't1', transitionKey: 'fade', durationS: 0.5 })
		],
		vocab
	);
	assert.equal(operations[0].op, 'animate');
	assert.equal(operations[1].op, 'transition');
	assert.equal(operations[1].durationUs, 500_000);
});

test('set_animation needs at least one preset', () => {
	const { errors } = planToolCalls(doc(), [call('set_animation', { clipId: 't1' })], vocab);
	assert.equal(errors.length, 1);
});

// ── Stock and shapes ─────────────────────────────────────────────────────

test('stock is a resolve step, not a document change', () => {
	// The only tool that needs the network; planning stays synchronous.
	const { operations } = planToolCalls(doc(), [
		call('add_stock', { kind: 'image', query: 'mountains', durationS: 4 })
	]);
	assert.equal(operations[0].op, 'stock');
	assert.equal(operations[0].query, 'mountains');
	assert.equal(operations[0].durationUs, 4 * S);
});

test('a stock kind that is not image or video is refused', () => {
	const { errors } = planToolCalls(doc(), [call('add_stock', { kind: 'gif', query: 'x' })]);
	assert.equal(errors.length, 1);
});

test('an empty stock query is refused', () => {
	const { errors } = planToolCalls(doc(), [call('add_stock', { kind: 'image', query: '  ' })]);
	assert.equal(errors.length, 1);
});

test('a shape is centred on its point, like text', () => {
	const { operations } = planToolCalls(doc(), [
		call('add_shape', { x: 0.5, y: 0.5, width: 0.5, height: 0.1 })
	]);
	const t = operations[0].clip.transform;
	assert.equal(t.x + Math.round(t.width / 2), 540);
	assert.equal(t.y + Math.round(t.height / 2), 960);
});

test('a shape gets a fill even when none was given', () => {
	const { operations } = planToolCalls(doc(), [
		call('add_shape', { x: 0.5, y: 0.5, width: 0.5, height: 0.1, fill: 'blueish' })
	]);
	assert.match(operations[0].clip.style.fill, /^#[0-9a-f]{6}$/i);
});

// ── Knowing what a clip IS ───────────────────────────────────────────────

test('a clip reports its media, animation, effect and layer', () => {
	// Without these the model reasons about anonymous rectangles: it cannot tell
	// which Image already shows the logo, cannot see a clip is already animated
	// before adding a second animation, and cannot name an effect to replace it.
	const rich = {
		settings: { width: 1080, height: 1920, duration: 6 * S },
		clips: {
			i1: {
				id: 'i1', type: 'Image', src: 'https://cdn.example.com/logo.png?sig=abc',
				transform: { x: 0, y: 0, width: 540, height: 540, zIndex: 7 },
				timing: { display: { from: 0, to: 3 * S } },
				metadata: { pictify: { animation: { inPreset: 'fadeIn' } } }
			},
			e1: {
				id: 'e1', type: 'Effect', effectKey: 'oldFilm',
				transform: { zIndex: 900 }, timing: { display: { from: 0, to: 6 * S } }
			}
		}
	};
	const [image, effect] = describeDocument(rich).clips;
	assert.equal(image.media, 'logo.png', 'the signed-URL noise is stripped');
	assert.equal(image.layer, 7);
	assert.deepEqual(image.animation, { in: 'fadeIn', out: undefined, emphasis: undefined });
	assert.equal(effect.effectKey, 'oldFilm');
});

test('hand-authored keyframes are summarised, not dumped', () => {
	const doc2 = {
		settings: { width: 1080, height: 1920 },
		clips: {
			t: {
				id: 't', type: 'Text', transform: { x: 0, y: 0, width: 10, height: 10 },
				timing: { display: { from: 0, to: S } },
				animations: [{ type: 'keyframes', params: { '0%': { opacity: 0 }, '100%': { opacity: 1, scale: 1.2 } } }]
			}
		}
	};
	const [clip] = describeDocument(doc2).clips;
	assert.deepEqual(clip.keyframes.at, ['0%', '100%']);
	assert.deepEqual(clip.keyframes.animating.sort(), ['opacity', 'scale']);
});

test('an embedded data URL is named rather than pasted', () => {
	// A base64 image would otherwise be the entire prompt.
	const doc2 = {
		settings: { width: 1080, height: 1920 },
		clips: { i: { id: 'i', type: 'Image', src: 'data:image/png;base64,AAAA', transform: { x: 0, y: 0, width: 1, height: 1 }, timing: { display: { from: 0, to: 1 } } } }
	};
	assert.equal(describeDocument(doc2).clips[0].media, 'embedded');
});

test('quiet defaults stay out of the description', () => {
	// Every key costs tokens on every turn; only what differs is worth saying.
	const [clip] = describeDocument(doc()).clips;
	assert.equal(clip.speed, undefined);
	assert.equal(clip.fades, undefined);
	assert.equal(clip.locked, undefined);
	assert.equal(clip.flipped, undefined);
});

// ── The user's own media ─────────────────────────────────────────────────

test('the media library is described by name, not by id', () => {
	// Uids are not stable across sessions, and the name is what a user says.
	const described = describeMedia([{ uid: 'x1', kind: 'image', name: 'logo.png', source: 'brand' }]);
	assert.deepEqual(described, [{ name: 'logo.png', kind: 'image', source: 'brand' }]);
});

test('the media list is capped and survives being empty', () => {
	const many = Array.from({ length: 100 }, (_, i) => ({ name: `f${i}`, kind: 'image' }));
	assert.equal(describeMedia(many, 5).length, 5);
	assert.deepEqual(describeMedia(null), []);
});

test('add_media resolves to a library lookup, not a document change', () => {
	const { operations } = planToolCalls(doc(), [call('add_media', { name: 'logo.png', durationS: 3 })]);
	assert.equal(operations[0].op, 'media');
	assert.equal(operations[0].name, 'logo.png');
	assert.equal(operations[0].durationUs, 3 * S);
});

test('add_media without a name is refused', () => {
	assert.equal(planToolCalls(doc(), [call('add_media', { name: '  ' })]).errors.length, 1);
});

// ── Discovery ────────────────────────────────────────────────────────────

test('a lookup returns matching names, not the whole catalogue', () => {
	// The point of discovery is keeping thousands of tokens out of the prompt.
	const found = searchCatalogue(['oldFilm', 'filmStripPro', 'glitch', 'invert'], 'film');
	assert.deepEqual(found.names, ['oldFilm', 'filmStripPro']);
});

test('matching is case-insensitive', () => {
	assert.deepEqual(searchCatalogue(['oldFilm'], 'FILM').names, ['oldFilm']);
});

test('results are capped so a one-letter query cannot dump everything', () => {
	const many = Array.from({ length: 200 }, (_, i) => `effect${i}`);
	assert.equal(searchCatalogue(many, 'effect', 5).names.length, 5);
	assert.equal(searchCatalogue(many, 'effect', 5).total, 200, 'the true count is still reported');
});

test('a query matching nothing falls back to what exists', () => {
	// "Here is what there is" beats "no": the model asked for something and can
	// pick the nearest rather than inventing a name.
	const found = searchCatalogue(['invert', 'glitch'], 'sparkle');
	assert.deepEqual(found.names, ['invert', 'glitch']);
});

test('an empty query lists from the top', () => {
	assert.equal(searchCatalogue(['a', 'b'], '').names.length, 2);
	assert.deepEqual(searchCatalogue(null, 'x').names, []);
});

test('lookups resolve to a query operation, never a document change', () => {
	const { operations } = planToolCalls(doc(), [call('list_effects', { query: 'film' })]);
	assert.deepEqual(operations[0], {
		tool: 'list_effects',
		op: 'query',
		list: 'effects',
		query: 'film'
	});
});

test('a turn that only looked things up reports no change', () => {
	// Claiming "changed 1 clip" after a lookup would be a lie.
	const { operations } = planToolCalls(doc(), [call('list_effects', { query: 'film' })]);
	assert.match(summarizeOperations(operations), /Nothing changed/);
});

// ── Reporting ────────────────────────────────────────────────────────────

test('a batch summarises in a sentence a person can read', () => {
	const { operations } = planToolCalls(doc(), [
		call('add_text', { text: 'Hi', x: 0.5, y: 0.5 }),
		call('move_clip', { clipId: 't1', x: 0.5, y: 0.5 }),
		call('delete_clip', { clipId: 's1' })
	]);
	const line = summarizeOperations(operations);
	assert.match(line, /added 1 clip/i);
	assert.match(line, /changed 1 clip/);
	assert.match(line, /removed 1 clip/);
});

test('an empty batch says so rather than claiming success', () => {
	assert.match(summarizeOperations([]), /Nothing changed/);
});

// ── The scene-level tools ────────────────────────────────────────────────
// Added for the design → execute → review pipeline: without these the agent
// can place every clip perfectly and still ship a video that runs four
// seconds too long over a default background.

test('set_background writes a settings patch, and rejects non-hex', () => {
	const { operations } = planToolCalls(doc(), [call('set_background', { color: '#111827' })]);
	assert.deepEqual(operations[0], {
		tool: 'set_background',
		op: 'settings',
		patch: { backgroundColor: '#111827' }
	});
	const { errors } = planToolCalls(doc(), [call('set_background', { color: 'darkish' })]);
	assert.match(errors[0].error, /hex/);
});

test('set_scene_duration converts seconds to microseconds once', () => {
	const { operations } = planToolCalls(doc(), [call('set_scene_duration', { durationS: 8.5 })]);
	assert.deepEqual(operations[0].patch, { duration: 8_500_000 });
	const { errors } = planToolCalls(doc(), [call('set_scene_duration', { durationS: 0 })]);
	assert.match(errors[0].error, /greater than zero/);
});

test('set_layer clamps to 0..1000 and keeps the rest of the transform', () => {
	const { operations } = planToolCalls(doc(), [call('set_layer', { clipId: 't1', layer: 900 })]);
	assert.equal(operations[0].patch.transform.zIndex, 900);
	assert.equal(operations[0].patch.transform.x, 100, 'siblings survive the one-level merge');
	const high = planToolCalls(doc(), [call('set_layer', { clipId: 't1', layer: 99999 })]);
	assert.equal(high.operations[0].patch.transform.zIndex, 1000);
});

test('set_opacity clamps to 0..1', () => {
	const { operations } = planToolCalls(doc(), [call('set_opacity', { clipId: 't1', opacity: 3 })]);
	assert.equal(operations[0].patch.transform.opacity, 1);
});

test('set_fades converts seconds to MILLISECONDS — the one timing field in ms', () => {
	const { operations } = planToolCalls(doc(), [
		call('set_fades', { clipId: 't1', fadeInS: 0.5, fadeOutS: 0.5 })
	]);
	const timing = operations[0].patch.timing;
	assert.equal(timing.fadeIn.duration, 500);
	assert.equal(timing.fadeOut.duration, 500);
	// The display window is untouched: fades are additive to timing, not a rewrite.
	assert.deepEqual(timing.display, { from: 0, to: 3 * S });
});

test('set_fades with zeros clears the fades rather than storing zero-length ramps', () => {
	const { operations } = planToolCalls(doc(), [
		call('set_fades', { clipId: 't1', fadeInS: 0, fadeOutS: 0 })
	]);
	assert.equal(operations[0].patch.timing.fadeIn, undefined);
	assert.equal(operations[0].patch.timing.fadeOut, undefined);
});

test('set_font_size sizes off the shorter side and grows the box with the type', () => {
	const { operations } = planToolCalls(doc(), [
		call('set_font_size', { clipId: 't1', size: 0.08 })
	]);
	const patch = operations[0].patch;
	assert.equal(patch.style.fontSize, Math.round(0.08 * 1080));
	assert.ok(patch.transform.height >= patch.style.fontSize * 1.6 - 1);
	assert.equal(patch.style.color, '#ffffff', 'existing style keys survive');
});

test('set_font_size refuses non-text clips', () => {
	const { errors } = planToolCalls(doc(), [call('set_font_size', { clipId: 's1', size: 0.08 })]);
	assert.match(errors[0].error, /no type size/);
});

test('the settings and media ops read as a sentence', () => {
	assert.match(summarizeOperations([{ op: 'settings' }]), /Adjusted the scene/);
	assert.match(summarizeOperations([{ op: 'media' }]), /Placed 1 media item/);
});

// ── Tier 1+2 tools ───────────────────────────────────────────────────────
// The gaps a good video actually uses: gradient scrims, emphasis motion,
// typography, sound, Ken Burns, captions, speed, trim, canvas aspect.

const richDoc = () => {
	const base = doc();
	base.clips.v1 = {
		id: 'v1',
		type: 'Video',
		name: 'Footage',
		src: 'https://cdn.example.com/clip.mp4',
		transform: { x: 0, y: 0, width: 1080, height: 1920, angle: 0, opacity: 1, zIndex: 1 },
		timing: {
			display: { from: 0, to: 4 * S },
			trim: { from: 0, to: 4 * S },
			duration: 4 * S,
			playbackRate: 1
		},
		style: {},
		metadata: { pictify: { animation: { inPreset: 'fadeIn' } } }
	};
	return base;
};

test('add_shape with gradientTo writes a CSS gradient into the fill string', () => {
	const { operations } = planToolCalls(doc(), [
		call('add_shape', {
			x: 0.5, y: 0.8, width: 1, height: 0.4,
			fill: '#00000000', gradientTo: '#000000cc',
			startS: 0, durationS: 5
		})
	]);
	const clip = operations[0].clip;
	assert.equal(clip.style.fill, 'linear-gradient(180deg, #00000000, #000000cc)');
	assert.equal(clip.name, 'Gradient');
});

test('add_shape gradientAngle steers the gradient; garbage angle falls back to 180', () => {
	const angled = planToolCalls(doc(), [
		call('add_shape', { x: 0.5, y: 0.5, width: 1, height: 1, fill: '#111111', gradientTo: '#222222', gradientAngle: 90 })
	]);
	assert.match(angled.operations[0].clip.style.fill, /^linear-gradient\(90deg/);
	const garbage = planToolCalls(doc(), [
		call('add_shape', { x: 0.5, y: 0.5, width: 1, height: 1, fill: '#111111', gradientTo: '#222222', gradientAngle: 'up' })
	]);
	assert.match(garbage.operations[0].clip.style.fill, /^linear-gradient\(180deg/);
});

test('add_shape opacity lands on the transform; a bad gradientTo is refused', () => {
	const { operations } = planToolCalls(doc(), [
		call('add_shape', { x: 0.5, y: 0.5, width: 1, height: 1, fill: '#111111', opacity: 0.6 })
	]);
	assert.equal(operations[0].clip.transform.opacity, 0.6);
	const { errors } = planToolCalls(doc(), [
		call('add_shape', { x: 0.5, y: 0.5, width: 1, height: 1, fill: '#111111', gradientTo: 'dark' })
	]);
	assert.match(errors[0].error, /gradientTo must be a hex/);
});

test('set_animation accepts an emphasis preset, validated against its OWN list', () => {
	const vocabulary = { animations: ['fadeIn'], emphasis: ['pulse'] };
	const ok = planToolCalls(doc(), [call('set_animation', { clipId: 't1', emphasisPreset: 'pulse' })], vocabulary);
	assert.equal(ok.operations[0].emphasisPreset, 'pulse');
	// An entrance preset cannot sneak into the emphasis slot.
	const wrong = planToolCalls(doc(), [call('set_animation', { clipId: 't1', emphasisPreset: 'fadeIn' })], vocabulary);
	assert.match(wrong.errors[0].error, /No emphasis animation called fadeIn/);
});

test('set_font resolves to a caller op and checks the family list', () => {
	const vocabulary = { fonts: ['Inter', 'Playfair Display'] };
	const { operations } = planToolCalls(doc(), [
		call('set_font', { clipId: 't1', family: 'Playfair Display' })
	], vocabulary);
	assert.deepEqual(operations[0], {
		tool: 'set_font', op: 'font', clipId: 't1', family: 'Playfair Display'
	});
	const { errors } = planToolCalls(doc(), [
		call('set_font', { clipId: 't1', family: 'Comic Sans' })
	], vocabulary);
	assert.match(errors[0].error, /No font called Comic Sans/);
});

test('set_font refuses clips that have no font', () => {
	const { errors } = planToolCalls(doc(), [call('set_font', { clipId: 's1', family: 'Inter' })]);
	assert.match(errors[0].error, /Shape clips have no font/);
});

test('set_volume writes the top-level volume, clamped, and only for things that make sound', () => {
	const { operations } = planToolCalls(richDoc(), [call('set_volume', { clipId: 'v1', volume: 3 })]);
	assert.deepEqual(operations[0].patch, { volume: 1 });
	const { errors } = planToolCalls(doc(), [call('set_volume', { clipId: 't1', volume: 0.5 })]);
	assert.match(errors[0].error, /Text clips make no sound/);
});

test('ken_burns push_in writes two keyframe stops scaling up', () => {
	const { operations } = planToolCalls(richDoc(), [
		call('ken_burns', { clipId: 'v1', move: 'push_in' })
	]);
	const animation = operations[0].patch.animations[0];
	assert.equal(animation.type, 'keyframes');
	assert.equal(animation.params['0%'].scale, 1);
	assert.equal(animation.params['100%'].scale, 1.06);
	assert.equal(animation.options.duration, 4 * S);
});

test('ken_burns pans hold a fixed zoom so the frame edge never shows', () => {
	const { operations } = planToolCalls(richDoc(), [
		call('ken_burns', { clipId: 'v1', move: 'pan_left', strength: 'strong' })
	]);
	const params = operations[0].patch.animations[0].params;
	assert.equal(params['0%'].scale, params['100%'].scale);
	assert.ok(params['100%'].x < 0, 'pan_left drifts left');
});

test('ken_burns strips the preset metadata it replaces', () => {
	const { operations } = planToolCalls(richDoc(), [
		call('ken_burns', { clipId: 'v1', move: 'pull_out' })
	]);
	assert.equal(operations[0].patch.metadata.pictify.animation, undefined);
});

test('ken_burns refuses text and unknown moves', () => {
	const text = planToolCalls(doc(), [call('ken_burns', { clipId: 't1', move: 'push_in' })]);
	assert.match(text.errors[0].error, /for media, not Text/);
	const move = planToolCalls(richDoc(), [call('ken_burns', { clipId: 'v1', move: 'spin' })]);
	assert.match(move.errors[0].error, /move must be/);
});

test('add_captions resolves to a caller op, and only for reachable media', () => {
	const { operations } = planToolCalls(richDoc(), [call('add_captions', { clipId: 'v1' })]);
	assert.deepEqual(operations[0], { tool: 'add_captions', op: 'captions', clipId: 'v1' });

	const local = richDoc();
	local.clips.v1.src = 'blob:http://localhost/abc';
	const { errors } = planToolCalls(local, [call('add_captions', { clipId: 'v1' })]);
	assert.match(errors[0].error, /has not finished uploading/);
});

test('set_speed rescales the display window around a fixed start', () => {
	const { operations } = planToolCalls(richDoc(), [call('set_speed', { clipId: 'v1', speed: 2 })]);
	const timing = operations[0].patch.timing;
	assert.equal(timing.playbackRate, 2);
	assert.deepEqual(timing.display, { from: 0, to: 2 * S }, '4s at 2x takes 2s of timeline');
});

test('set_trim picks the source window without moving the clip on the timeline', () => {
	const { operations } = planToolCalls(richDoc(), [
		call('set_trim', { clipId: 'v1', sourceStartS: 3 })
	]);
	const timing = operations[0].patch.timing;
	assert.deepEqual(timing.trim, { from: 3 * S, to: 7 * S }, '4s timeline span from 3s in');
	assert.deepEqual(timing.display, { from: 0, to: 4 * S }, 'timeline position untouched');
});

test('set_trim accounts for playback rate — a 2x clip eats source twice as fast', () => {
	const fast = richDoc();
	fast.clips.v1.timing.playbackRate = 2;
	const { operations } = planToolCalls(fast, [call('set_trim', { clipId: 'v1', sourceStartS: 1 })]);
	assert.deepEqual(operations[0].patch.timing.trim, { from: 1 * S, to: 9 * S });
});

test('set_canvas_size maps preset names to real dimensions and rejects others', () => {
	const { operations } = planToolCalls(doc(), [call('set_canvas_size', { aspect: 'landscape' })]);
	assert.deepEqual(operations[0].patch, { width: 1920, height: 1080 });
	const { errors } = planToolCalls(doc(), [call('set_canvas_size', { aspect: 'imax' })]);
	assert.match(errors[0].error, /aspect must be one of/);
});

test('list_fonts is a query op like the other discovery tools', () => {
	const { operations } = planToolCalls(doc(), [call('list_fonts', { query: 'serif' })]);
	assert.deepEqual(operations[0], { tool: 'list_fonts', op: 'query', list: 'fonts', query: 'serif' });
});

test('the font and caption ops read as a sentence', () => {
	assert.match(summarizeOperations([{ op: 'font' }]), /Changed 1 font/);
	assert.match(summarizeOperations([{ op: 'captions' }]), /Captioned 1 clip/);
});

// ── Model-chosen ids ─────────────────────────────────────────────────────
// The add tools return no id, so a model composing a scene in one turn had
// no way to style what it just created — it invented "text_1" and every
// follow-up failed. Now it NAMES the clip and the caller applies calls one
// at a time, so the reference is real by the time it is validated.

test('add_text and add_shape carry the model’s id into the clip payload', () => {
	const { operations } = planToolCalls(doc(), [
		call('add_text', { id: 'title', text: 'Hi', x: 0.5, y: 0.2 }),
		call('add_shape', { id: 'scrim', x: 0.5, y: 0.8, width: 1, height: 0.3, fill: '#000000' })
	]);
	assert.equal(operations[0].clip.id, 'title');
	assert.equal(operations[1].clip.id, 'scrim');
});

test('add_effect, add_stock and add_media carry the id too', () => {
	const { operations } = planToolCalls(doc(), [
		call('add_effect', { id: 'fx1', effectKey: 'vignette' }),
		call('add_stock', { id: 'bg1', kind: 'video', query: 'coffee' }),
		call('add_media', { id: 'logo1', name: 'logo.png' })
	]);
	assert.equal(operations[0].clip.id, 'fx1');
	assert.equal(operations[1].id, 'bg1');
	assert.equal(operations[2].id, 'logo1');
});

test('an id that already exists is refused, so a reused name cannot clobber a clip', () => {
	const { errors } = planToolCalls(doc(), [
		call('add_text', { id: 't1', text: 'Hi', x: 0.5, y: 0.2 })
	]);
	assert.match(errors[0].error, /already exists/);
});

test('a malformed id is refused rather than passed to the engine', () => {
	const { errors } = planToolCalls(doc(), [
		call('add_text', { id: 'has spaces!', text: 'Hi', x: 0.5, y: 0.2 })
	]);
	assert.match(errors[0].error, /letters, numbers, dashes or underscores/);
});

test('no id still works — the caller generates one', () => {
	const { operations, errors } = planToolCalls(doc(), [
		call('add_text', { text: 'Hi', x: 0.5, y: 0.2 })
	]);
	assert.equal(errors.length, 0);
	assert.equal(operations[0].clip.id, undefined);
});

test('sequential per-call planning lets a follow-up see the freshly added clip', () => {
	// This is the caller's contract: plan ONE call, apply it, then plan the
	// next against the updated document. Simulated here by inserting the added
	// clip before planning the styling call — the way the panel's live store
	// does between applies.
	const live = doc();
	const first = planToolCalls(live, [call('add_text', { id: 'headline', text: 'Hi', x: 0.5, y: 0.2 })]);
	assert.equal(first.errors.length, 0);
	live.clips.headline = { id: 'headline', ...first.operations[0].clip };
	const second = planToolCalls(live, [call('set_font', { clipId: 'headline', family: 'Inter' })], { fonts: ['Inter'] });
	assert.equal(second.errors.length, 0);
	assert.equal(second.operations[0].clipId, 'headline');
});
