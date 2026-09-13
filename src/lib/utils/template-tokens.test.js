import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { typeFor, defaultSampleFor, extractInputs } from './template-tokens.js';

describe('typeFor', () => {
	test('recognises the kinds that change the control', () => {
		assert.equal(typeFor('issued_on'), 'date');
		assert.equal(typeFor('logo_url'), 'image');
		assert.equal(typeFor('avatar'), 'image');
		assert.equal(typeFor('website_url'), 'url');
		assert.equal(typeFor('brand_colour'), 'color');
		assert.equal(typeFor('brand_color'), 'color');
		assert.equal(typeFor('anything_else'), 'text');
	});

	test('junk input is text, not a crash', () => {
		for (const junk of [null, undefined, '', 123]) assert.equal(typeFor(junk), 'text');
	});
});

describe('defaultSampleFor', () => {
	test('a name gets an obviously fictional person', () => {
		/*
		 * Deliberately not plausible-but-real: someone must not be able to
		 * download a certificate that appears to belong to an actual person
		 * they never named.
		 */
		assert.equal(defaultSampleFor('name'), 'Ada Lovelace');
		assert.equal(defaultSampleFor('recipient_name'), 'Ada Lovelace');
	});

	test('images are left EMPTY rather than guessed', () => {
		// A guessed image URL is a broken image, which reads as a bug in the
		// tool rather than as a blank to fill.
		assert.equal(defaultSampleFor('logo_url'), '');
		assert.equal(defaultSampleFor('avatar'), '');
	});

	test('a date is a real date, formatted', () => {
		const out = defaultSampleFor('issued_on');
		assert.ok(out.length > 6);
		assert.ok(!/undefined|NaN|Invalid/.test(out));
	});

	test('money, counts, urls and colours get usable shapes', () => {
		assert.match(defaultSampleFor('total'), /[\d,.]+/);
		assert.equal(defaultSampleFor('quantity'), '3');
		assert.equal(defaultSampleFor('site_url'), 'https://example.com');
		assert.match(defaultSampleFor('accent_color'), /^#/);
	});

	test('an invoice number is an identifier, not a count', () => {
		// `/number/` matching the count rule gave this the value "3".
		assert.equal(defaultSampleFor('invoice_number'), 'INV-2043');
		assert.equal(defaultSampleFor('quantity'), '3');
	});

	test('an unknown token falls back to its own humanised name', () => {
		// Still obviously a sample, and it shows which box feeds which part.
		assert.equal(defaultSampleFor('some-thing'), 'Some Thing');
		assert.equal(defaultSampleFor('widget_label'), 'Widget Label');
	});

	test('every token in a real template gets a non-crashing sample', () => {
		const html =
			'<p>{{name}} {{issued_on}} {{logo_url}} {{total}} {{unknown_thing}} {{brand_colour}}</p>';
		for (const token of extractInputs(html)) {
			const v = defaultSampleFor(token);
			assert.equal(typeof v, 'string');
			assert.ok(!/undefined|null|NaN/.test(v), `${token} -> ${v}`);
		}
	});
});
