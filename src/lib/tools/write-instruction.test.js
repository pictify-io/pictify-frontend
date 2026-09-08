import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { writeOgInstruction, hostOf, coloursFrom } from './write-instruction.js';

/**
 * TS-5a. The instruction is shown to the visitor and is editable, so it has to
 * read like a sentence in every case — including the ones where the page told
 * us almost nothing.
 */
describe('hostOf', () => {
	test('strips the scheme, www and path', () => {
		assert.equal(hostOf('https://www.example.com/blog/post'), 'example.com');
		assert.equal(hostOf('example.com'), 'example.com');
	});
	test('rubbish comes back unchanged rather than throwing', () => {
		assert.equal(hostOf('not a url'), 'not a url');
		assert.equal(hostOf(''), '');
		assert.equal(hostOf(null), '');
	});
});

describe('coloursFrom', () => {
	test('valid triples become css', () => {
		assert.deepEqual(coloursFrom([[27, 58, 107], [216, 243, 74]]), [
			'rgb(27, 58, 107)',
			'rgb(216, 243, 74)'
		]);
	});
	test('malformed entries are dropped, not printed', () => {
		// website-info can return fewer than three palette entries, or junk.
		assert.deepEqual(coloursFrom([[1, 2], null, 'nope', [1, 2, 3]]), ['rgb(1, 2, 3)']);
		assert.deepEqual(coloursFrom(null), []);
	});
});

describe('the OG instruction', () => {
	const full = {
		title: 'Templated media for developers',
		description: 'Render images and PDFs from HTML.',
		logo: 'https://example.com/logo.svg',
		colors: [[27, 58, 107], [216, 243, 74]]
	};

	test('reads as a sentence with everything present', () => {
		const out = writeOgInstruction('https://pictify.io/blog', full);
		assert.match(out, /^Make an OG image for “Templated media for developers” by pictify\.io\./);
		assert.match(out, /Use the logo at https:\/\/example\.com\/logo\.svg\./);
		assert.match(out, /Use rgb\(27, 58, 107\) and rgb\(216, 243, 74\) as the brand colours\./);
		assert.match(out, /Use this as the subtitle: “Render images and PDFs from HTML\.”\./);
	});

	test('one colour is singular', () => {
		const out = writeOgInstruction('x.com', { title: 'T', colors: [[1, 2, 3]] });
		assert.match(out, /as the brand colour\./);
		assert.ok(!out.includes('colours'));
	});

	test('a page we could not read still produces an instruction', () => {
		// The URL alone is enough to write something the visitor can edit —
		// leaving the composer empty would strand them.
		const out = writeOgInstruction('https://example.com/thing', null);
		assert.match(out, /^Make an OG image for example\.com\./);
		assert.match(out, /Keep it clean and readable/);
	});

	test('a title but nothing else does not invent detail', () => {
		const out = writeOgInstruction('example.com', { title: 'Just a title' });
		assert.match(out, /^Make an OG image for “Just a title” by example\.com\.$/);
	});

	test('no logo means no logo sentence', () => {
		const out = writeOgInstruction('example.com', { title: 'T', description: 'D' });
		assert.ok(!/logo/i.test(out));
	});

	test('it never contains "undefined" or "null"', () => {
		for (const info of [null, {}, { title: undefined }, { colors: [[1]] }, { logo: '' }]) {
			const out = writeOgInstruction('example.com', info);
			assert.ok(!/undefined|null|NaN/.test(out), `got: ${out}`);
		}
	});
});
