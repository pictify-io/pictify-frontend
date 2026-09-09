import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { proposeFields } from './propose-fields.js';

const CARD = `<html><body>
  <p style="font-size:14px;letter-spacing:0.1em;text-transform:uppercase">Case study</p>
  <h1 style="font-size:64px">Acme cut render time by half</h1>
  <p style="font-size:24px">Two engineers, one afternoon, no new infrastructure.</p>
</body></html>`;

describe('proposeFields', () => {
	test('offers the fields it found, with the words it would replace', () => {
		const p = proposeFields(CARD);
		assert.ok(p);
		assert.equal(p.count, 3);
		const names = p.fields.map((f) => f.name);
		assert.ok(names.includes('heading'));
		// The offer is checkable: every field carries its original text.
		for (const f of p.fields) assert.ok(f.sample.length > 0);
		const heading = p.fields.find((f) => f.name === 'heading');
		assert.equal(heading.sample, 'Acme cut render time by half');
	});

	test('the proposed html is the accepted document, tokens and all', () => {
		const p = proposeFields(CARD);
		assert.match(p.html, /\{\{heading\}\}/);
		assert.doesNotMatch(p.html, /Acme cut render time by half/);
		// Every proposed name resolves to a sample, or Inputs opens with holes.
		for (const f of p.fields) assert.equal(p.samples[f.name], f.sample);
	});

	test('reads down the design, not by size', () => {
		const p = proposeFields(CARD);
		const order = p.fields.map((f) => f.name);
		// The eyebrow is above the headline on the page and above it in Inputs,
		// even though it is the smallest text in the document.
		assert.ok(order.indexOf('label') < order.indexOf('heading'));
	});

	test('never proposes over an existing contract', () => {
		const withTokens = CARD.replace('Acme cut render time by half', '{{title}}');
		assert.equal(proposeFields(withTokens), null);
	});

	test('one field is not a template', () => {
		const thin = '<html><body><h1 style="font-size:64px">Just a headline</h1></body></html>';
		assert.equal(proposeFields(thin), null);
	});

	test('nothing to offer on an empty or wordless document', () => {
		assert.equal(proposeFields(''), null);
		assert.equal(proposeFields('   '), null);
		assert.equal(proposeFields('<html><body><div>★</div><div>JA</div></body></html>'), null);
	});

	test('caps the offer rather than listing the whole page', () => {
		const many = `<html><body>${Array.from(
			{ length: 20 },
			(_, i) => `<p style="font-size:${40 - i}px">Line number ${i} of the page</p>`
		).join('')}</body></html>`;
		const p = proposeFields(many);
		assert.ok(p.count <= 6, `proposed ${p.count}`);
	});
});
