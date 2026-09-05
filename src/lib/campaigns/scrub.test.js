import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { scrub } from './scrub.js';

/**
 * These assert the guard REFUSES things, which is the only property that
 * matters. Every campaign event fires from a screen showing a named third
 * party's figures, and analytics is a place no purge sweep reaches.
 */
describe('analytics scrub', () => {
	test('keeps counts, states and booleans', () => {
		assert.deepEqual(scrub({ accounts: 248, state: 'partial', reconciled: true, revision: 2 }), {
			accounts: 248,
			state: 'partial',
			reconciled: true,
			revision: 2
		});
	});

	test('drops every field that could name a customer', () => {
		const out = scrub({
			account_id: '00042',
			accountName: 'Contoso Freight',
			email: 'j@northwind.com',
			company: 'Northwind',
			accounts: 12
		});
		assert.deepEqual(Object.keys(out).sort(), ['accounts', 'dropped_keys']);
		assert.equal(out.dropped_keys, 4);
	});

	test('drops a customer metric even under an innocent key', () => {
		// The values object is where the figures live.
		const out = scrub({ values: { workflows: 1284 }, metrics: ['Workflows completed'] });
		assert.equal(out.values, undefined);
		assert.equal(out.metrics, undefined);
		assert.equal(out.dropped_keys, 2);
	});

	test('drops artifact paths and object keys', () => {
		const out = scrub({
			artifactPath: '/campaign-artifacts/HR8KGEDCPX/download',
			objectKey: 'campaigns/T/E/abc.png',
			url: 'https://media.pictify.io/x.png'
		});
		assert.deepEqual(Object.keys(out), ['dropped_keys']);
		assert.equal(out.dropped_keys, 3);
	});

	test('drops free text even when the key looks harmless', () => {
		// A sentence is prose and prose is where names end up.
		const out = scrub({ summary: 'Contoso Freight completed 1284 workflows' });
		assert.equal(out.summary, undefined);
	});

	test('drops nested objects and arrays wholesale', () => {
		const out = scrub({ payload: { deep: { account_name: 'Contoso' } }, list: [1, 2, 3] });
		assert.deepEqual(Object.keys(out), ['dropped_keys']);
	});

	test('drops NaN and Infinity — those are bugs travelling, not measurements', () => {
		const out = scrub({ a: NaN, b: Infinity, c: 3 });
		assert.deepEqual(out, { c: 3, dropped_keys: 2 });
	});

	test('reports how much it dropped so a leak is visible, not silent', () => {
		assert.equal(scrub({ accounts: 1 }).dropped_keys, undefined);
		assert.equal(scrub({ accountName: 'x', accounts: 1 }).dropped_keys, 1);
	});

	test('survives null, undefined and an empty payload', () => {
		assert.deepEqual(scrub(), {});
		assert.deepEqual(scrub(null), {});
		assert.deepEqual(scrub({ a: null, b: undefined }), {});
	});
});

describe('AI-7 payloads', () => {
	test('an instruction never leaves, however short', () => {
		// The dangerous case is a SHORT instruction: long prose already fails the
		// enumerated-string test, so a one-word customer name is what would slip.
		const out = scrub({ instruction: 'bigger', scope: 'selection', changed: 1 });
		assert.equal(out.instruction, undefined);
		assert.equal(out.scope, 'selection');
		assert.equal(out.changed, 1);
	});

	test('node labels never leave — a label is often a customer name', () => {
		const out = scrub({
			selectedLabel: 'Contoso Freight',
			touches: ['Metrics row'],
			labels: ['Heading'],
			scopeKind: 'selection'
		});
		assert.equal(out.selectedLabel, undefined);
		assert.equal(out.touches, undefined);
		assert.equal(out.labels, undefined);
		assert.equal(out.scopeKind, 'selection');
	});

	test('the counts that make the events useful still pass', () => {
		const out = scrub({
			changed_count: 3,
			untouched_count: 12,
			verified: true,
			outcome: 'refused',
			ms: 4210
		});
		assert.deepEqual(out, {
			changed_count: 3,
			untouched_count: 12,
			verified: true,
			outcome: 'refused',
			ms: 4210
		});
	});
})
