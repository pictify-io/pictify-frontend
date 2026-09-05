import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { summarize, FIXES, fixStyles } from './overflow.js';
import { SAMPLE_CASES, valuesFor } from './samples.js';

describe('overflow summary', () => {
	test('says nothing alarming when every sample fits', () => {
		const s = summarize({ typical: [], longest: [], unicode: [] });
		assert.equal(s.ok, true);
		assert.equal(s.label, 'All samples fit');
	});

	test('counts elements and samples separately', () => {
		// "1 element clips on 2 of 3 samples" tells the buyer both how
		// widespread the problem is and how specific — one number cannot.
		const s = summarize({
			typical: [],
			longest: [{ id: 'n3', kind: 'clipped' }],
			unicode: [{ id: 'n3', kind: 'clipped' }]
		});
		assert.equal(s.ok, false);
		assert.equal(s.label, '1 element clips on 2 of 3 samples');
		assert.deepEqual(s.elements, ['n3']);
	});

	test('one element failing many samples is still one element', () => {
		const s = summarize({
			a: [{ id: 'n1' }],
			b: [{ id: 'n1' }],
			c: [{ id: 'n1' }]
		});
		assert.equal(s.elements.length, 1);
	});

	test('pluralises honestly', () => {
		const s = summarize({ a: [{ id: 'n1' }, { id: 'n2' }] });
		assert.match(s.label, /^2 elements clip on 1 of 1 samples$/);
	});
});

describe('fixes', () => {
	test('every fix changes the design, never the data', () => {
		// "Make it fit" must never mean "shorten the customer's name".
		const ids = FIXES.map((f) => f.id);
		assert.deepEqual(ids, ['shrink', 'clamp', 'display-name']);
		// The only one that touches a name is explicit about it being a display
		// name set in Data, not an edit to the account.
		assert.match(FIXES[2].detail, /shorter name for this account in Data/);
	});

	test('shrink has a floor, so it cannot produce unreadable text', () => {
		const view = { getComputedStyle: () => ({ fontSize: '13px' }) };
		const patch = fixStyles('shrink', {}, view);
		// 13 * 0.85 rounds to 11, which is below the floor.
		assert.equal(patch['font-size'], '12px');
	});

	test('clamp allows two lines then trims', () => {
		const patch = fixStyles('clamp', {}, {});
		assert.equal(patch['-webkit-line-clamp'], '2');
		assert.equal(patch.overflow, 'hidden');
	});

	test('display-name is a decision, not a style change', () => {
		assert.equal(fixStyles('display-name', {}, {}), null);
	});
});

describe('sample cases', () => {
	test('include the rows most likely to break a design', () => {
		const ids = SAMPLE_CASES.map((c) => c.id);
		for (const required of ['longest', 'unicode', 'zero', 'largest']) {
			assert.ok(ids.includes(required), `missing ${required}`);
		}
	});

	test('every case says WHY it is there', () => {
		for (const c of SAMPLE_CASES) assert.ok(c.why && c.why.length > 3, c.id);
	});

	test('the zero case leaves a second metric blank, exercising suppression', () => {
		const values = valuesFor(
			SAMPLE_CASES.find((c) => c.id === 'zero'),
			['workflows', 'hours']
		);
		assert.equal(values.workflows, '0');
		// Blank, not "0" — suppression is a different layout from a zero.
		assert.equal(values.hours, '');
	});

	test('metric keys come from the campaign, not a fixed list', () => {
		const values = valuesFor(SAMPLE_CASES[0], ['anything_at_all']);
		assert.ok('anything_at_all' in values);
	});
});
