import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	writeOgInstruction,
	hostOf,
	coloursFrom,
	writeInstruction,
	countRows,
	SOURCES
} from './write-instruction.js';

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

/**
 * TS-7. One test per kind, because each writes a different sentence and each
 * has an "almost nothing filled in" case. The instruction is shown to the
 * visitor and costs one of three daily AI credits to run, so an empty or
 * nonsense sentence is not a cosmetic problem.
 */
describe('the nine source blocks', () => {
	test('every kind in SOURCES has fields, a label and a cta', () => {
		for (const [kind, def] of Object.entries(SOURCES)) {
			assert.ok(def.label, `${kind} has no label`);
			assert.ok(def.cta, `${kind} has no cta`);
			assert.ok(def.fields?.length, `${kind} has no fields`);
			for (const f of def.fields) assert.ok(f.key && f.placeholder, `${kind} field is incomplete`);
		}
	});

	test('every field a block collects is used by its instruction', () => {
		/*
		 * The point of defining fields and the sentence in one module: a field
		 * that stopped being written would be a box the visitor fills for
		 * nothing. `og` reads its values through website-info rather than
		 * directly, so it is checked separately.
		 */
		const sample = {
			url: 'https://example.com/x',
			name: 'Ada',
			headline: 'Builds things',
			quote: 'It is good',
			author: 'Grace',
			course: 'CSS',
			recipient: 'Ada',
			issuer: 'Pictify',
			number: 'INV-1',
			client: 'Contoso',
			campaign: 'Spring sale',
			role: 'Speaker',
			event: 'ConfX',
			subtitle: 'Member',
			org: 'Acme',
			rows: 'Name\tScore\nAda\t120\nGrace\t118',
			note: 'dark theme'
		};
		for (const [kind, def] of Object.entries(SOURCES)) {
			if (kind === 'og') continue;
			const out = writeInstruction(kind, sample);
			assert.ok(out.length > 20, `${kind} wrote nothing`);
			for (const f of def.fields) {
				if (f.key === 'url' || f.key === 'rows') continue; // used as host / count
				// Case-insensitive: `code` sentence-cases the note it is given, which
				// is still using it.
				assert.ok(
					out.toLowerCase().includes(sample[f.key].toLowerCase()),
					`${kind} collects "${f.key}" but never writes it: ${out}`
				);
			}
		}
	});

	test('an empty block writes nothing, so the button stays disabled', () => {
		// Running an AI edit on an empty sentence spends one of three credits
		// to be told nothing changed.
		for (const kind of Object.keys(SOURCES)) {
			if (kind === 'og') continue;
			assert.equal(writeInstruction(kind, {}), '', `${kind} wrote something from nothing`);
		}
	});

	test('an unknown kind writes nothing rather than guessing', () => {
		assert.equal(writeInstruction('nope', { name: 'x' }), '');
	});

	test('linkedin protects the photo zone', () => {
		const out = writeInstruction('linkedin', { name: 'Ada', headline: 'Builds things' });
		assert.match(out, /left 20% clear/);
	});

	test('certificate makes the recipient a variable, not just text', () => {
		// This is the whole bulk story: one certificate is also a thousand.
		const out = writeInstruction('certificate', { course: 'CSS', recipient: 'Ada' });
		assert.match(out, /\{\{name\}\}/);
		assert.match(out, /Ada/);
	});

	test('badge makes the name a variable and lets the role pick a colour', () => {
		const out = writeInstruction('badge', { name: 'Ada', role: 'Speaker', event: 'ConfX' });
		assert.match(out, /\{\{name\}\}/);
		assert.match(out, /colour band/);
	});

	test('table counts rows, ignoring a header and a markdown separator', () => {
		assert.equal(countRows('Name\tScore\nAda\t120\nGrace\t118'), 2);
		assert.equal(countRows('| a | b |\n| --- | --- |\n| 1 | 2 |'), 1);
		assert.equal(countRows(''), 0);
		assert.equal(countRows('   \n  '), 0);
	});

	test('table writes a rows variable so more can be passed later', () => {
		const out = writeInstruction('table', { rows: 'a\tb\n1\t2\n3\t4' });
		assert.match(out, /2 rows/);
		assert.match(out, /\{\{rows\}\}/);
	});

	test('code is told to change looks only, not structure', () => {
		const out = writeInstruction('code', { note: 'dark theme' });
		assert.match(out, /^Dark theme\./);
		assert.match(out, /keep its structure and text/);
	});

	test('brand details from website-info are appended when present', () => {
		const out = writeInstruction(
			'email-header',
			{ url: 'acme.com', campaign: 'Spring' },
			{ logo: 'https://acme.com/l.svg', colors: [[1, 2, 3]] }
		);
		assert.match(out, /Use the logo at https:\/\/acme\.com\/l\.svg and rgb\(1, 2, 3\)\./);
	});

	test('no kind ever emits undefined, null or a bare quote pair', () => {
		for (const kind of Object.keys(SOURCES)) {
			for (const values of [{}, { name: 'x' }, { url: 'x.com' }, { quote: 'q' }]) {
				const out = writeInstruction(kind, values);
				assert.ok(!/undefined|null|NaN|““|””/.test(out), `${kind}: ${out}`);
			}
		}
	});
});
