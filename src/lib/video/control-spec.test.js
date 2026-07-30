/**
 * Tests for variable control descriptors.
 * Run: node --test src/lib/video/control-spec.test.js
 *
 * This decides what every template input looks like on screen, for both kinds
 * of template and for fields that arrive from three different places (a zod
 * schema, a plain object schema, or typed by hand). Getting it wrong is not a
 * crash — it is a colour rendered as a text box, which is exactly the failure
 * this replaces.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { controlFor, normalizeOptions, groupControls, CONTROLS } from './control-spec.js';

const control = (field) => controlFor(field).control;

// ── Type to control ──────────────────────────────────────────────────────

test('each type maps to a control the panel can render', () => {
	for (const field of [
		{ name: 'a', type: 'text' },
		{ name: 'b', type: 'color' },
		{ name: 'c', type: 'image' },
		{ name: 'd', type: 'video' },
		{ name: 'e', type: 'audio' },
		{ name: 'f', type: 'number' },
		{ name: 'g', type: 'boolean' }
	]) {
		assert.ok(CONTROLS.includes(control(field)), `${field.type} -> ${control(field)}`);
	}
});

test('media types carry what they accept', () => {
	// One control, three accept values — otherwise an audio field opens an image
	// picker and silently offers the wrong library.
	assert.equal(controlFor({ name: 'logo', type: 'image' }).accept, 'image');
	assert.equal(controlFor({ name: 'clip', type: 'video' }).accept, 'video');
	assert.equal(controlFor({ name: 'bed', type: 'audio' }).accept, 'audio');
});

test('an unknown type falls back to text rather than disappearing', () => {
	assert.equal(control({ name: 'x', type: 'quantum' }), 'text');
	assert.equal(control({ name: 'x' }), 'text');
	assert.equal(control({}), 'text');
});

// ── Numbers and sliders ──────────────────────────────────────────────────

test('explicit bounds make a slider', () => {
	const spec = controlFor({ name: 'weight', type: 'number', min: 100, max: 900, step: 100 });
	assert.equal(spec.control, 'slider');
	assert.deepEqual([spec.min, spec.max, spec.step], [100, 900, 100]);
});

test('a number with no bounds is inferred from what it is', () => {
	// A bare z.number() carries nothing but its name, and that is the only signal
	// available. A wrong guess costs an unhelpful range; a text box costs the
	// control entirely.
	const size = controlFor({ name: 'fontSize', type: 'number' });
	assert.equal(size.control, 'slider');
	assert.deepEqual([size.min, size.max], [8, 240]);

	const opacity = controlFor({ name: 'opacity', type: 'number' });
	assert.deepEqual([opacity.min, opacity.max, opacity.step], [0, 1, 0.05]);

	const angle = controlFor({ name: 'rotation', type: 'number' });
	assert.deepEqual([angle.min, angle.max], [-180, 180]);
});

test('an unrecognised number stays a plain input, not an invented range', () => {
	// Sliding between 0 and 100 for a value that means neither is worse than a
	// number box: it silently constrains what the user can type.
	assert.equal(control({ name: 'seed', type: 'number' }), 'number');
	assert.equal(control({ name: 'zIndex', type: 'number' }), 'number');
});

test('explicit bounds beat the name guess', () => {
	const spec = controlFor({ name: 'opacity', type: 'number', min: 0, max: 255, step: 1 });
	assert.deepEqual([spec.min, spec.max], [0, 255], 'the schema knows better than the heuristic');
});

test('a half-specified range is not a slider', () => {
	// min without max cannot render a track.
	assert.equal(control({ name: 'seed', type: 'number', min: 0 }), 'number');
	assert.equal(control({ name: 'seed', type: 'number', max: 10 }), 'number');
});

// ── Options ──────────────────────────────────────────────────────────────

test('options make a select whatever the underlying type says', () => {
	const spec = controlFor({ name: 'align', type: 'text', options: ['left', 'center', 'right'] });
	assert.equal(spec.control, 'select');
	assert.equal(spec.options.length, 3);
});

test('bare values and labelled pairs both work', () => {
	// A schema author writing options: ['left','right'] should not have to know
	// about the richer form.
	assert.deepEqual(normalizeOptions(['left']), [{ value: 'left', label: 'Left' }]);
	assert.deepEqual(normalizeOptions([{ value: 'l', label: 'Left side' }]), [
		{ value: 'l', label: 'Left side' }
	]);
});

test('option labels are humanised when not supplied', () => {
	assert.equal(normalizeOptions(['top_left'])[0].label, 'Top left');
	assert.equal(normalizeOptions(['fadeIn'])[0].label, 'Fade In');
});

test('junk options are dropped, not rendered as blanks', () => {
	assert.deepEqual(normalizeOptions([null, '', undefined, {}]), []);
	assert.deepEqual(normalizeOptions('nope'), []);
	assert.deepEqual(normalizeOptions(null), []);
});

test('an empty options array does not force a select', () => {
	assert.equal(control({ name: 'title', type: 'text', options: [] }), 'text');
});

// ── Labels and long copy ─────────────────────────────────────────────────

test('labels are humanised from the field name', () => {
	assert.equal(controlFor({ name: 'accentColor' }).label, 'Accent Color');
	assert.equal(controlFor({ name: 'customer_name' }).label, 'Customer name');
	assert.equal(controlFor({ name: 'cta' }).label, 'Cta');
});

test('an explicit label wins', () => {
	assert.equal(controlFor({ name: 'cta', label: 'Button text' }).label, 'Button text');
});

test('long-form copy gets room to type', () => {
	// A quote or a paragraph in a single-line input is the difference between
	// editing copy and fighting the field.
	assert.equal(control({ name: 'bodyText', type: 'text' }), 'textarea');
	assert.equal(control({ name: 'quote', type: 'text' }), 'textarea');
	assert.equal(control({ name: 'title', type: 'text' }), 'text');
});

// ── Grouping ─────────────────────────────────────────────────────────────

test('grouping preserves first-seen order', () => {
	const groups = groupControls([
		controlFor({ name: 'a', group: 'Brand' }),
		controlFor({ name: 'b', group: 'Copy' }),
		controlFor({ name: 'c', group: 'Brand' })
	]);
	assert.deepEqual(groups.map((g) => g.group), ['Brand', 'Copy']);
	assert.equal(groups[0].controls.length, 2);
});

test('ungrouped fields sit above the named sections', () => {
	// They are the template's own top-level inputs, not a leftover bucket.
	const groups = groupControls([
		controlFor({ name: 'a', group: 'Brand' }),
		controlFor({ name: 'b' })
	]);
	assert.equal(groups[0].group, null);
	assert.equal(groups[1].group, 'Brand');
});

test('no groups at all means one ungrouped block, not an Other heading', () => {
	const groups = groupControls([controlFor({ name: 'a' }), controlFor({ name: 'b' })]);
	assert.equal(groups.length, 1);
	assert.equal(groups[0].group, null);
	assert.equal(groups[0].controls.length, 2);
});

test('a blank group string is treated as no group', () => {
	assert.equal(controlFor({ name: 'a', group: '   ' }).group, null);
});

test('grouping nothing is an empty list', () => {
	assert.deepEqual(groupControls([]), []);
	assert.deepEqual(groupControls(), []);
});
