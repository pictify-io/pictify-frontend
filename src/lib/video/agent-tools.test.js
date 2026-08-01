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
	describeCapabilities
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

// ── Capabilities ─────────────────────────────────────────────────────────

test('the capability lists are capped, so the prompt stays affordable', () => {
	const many = Array.from({ length: 200 }, (_, i) => `effect${i}`);
	const described = describeCapabilities({ effects: many }, 5);
	assert.equal(described.effects.split(', ').length, 5);
});

test('describing an empty vocabulary is safe', () => {
	assert.deepEqual(describeCapabilities(), { effects: '', animations: '', transitions: '' });
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
