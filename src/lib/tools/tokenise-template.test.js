import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { tokeniseTemplate, tokenFor } from './tokenise-template.js';

describe('tokenFor', () => {
	test('strips the template- prefix and normalises', () => {
		assert.equal(tokenFor('template-heading'), 'heading');
		assert.equal(tokenFor('template-stat1-label'), 'stat1_label');
		assert.equal(tokenFor('client-name'), 'client_name');
	});
	test('junk is empty, not a crash', () => {
		for (const junk of [null, undefined, '', '---']) assert.equal(tokenFor(junk), '');
	});
});

describe('tokenising', () => {
	test('a leaf text element becomes a token, its text becomes the sample', () => {
		const out = tokeniseTemplate('<h1 id="template-heading">Your Name</h1>');
		assert.equal(out.html, '<h1 id="template-heading">{{heading}}</h1>');
		assert.equal(out.samples.heading, 'Your Name');
	});

	test('an image is tokenised on its SRC and keeps the original as the sample', () => {
		// The designer's placeholder mark keeps showing; tokenising must not
		// turn every template into a broken image.
		const out = tokeniseTemplate('<img id="template-logo" src="https://cdn/x.png">');
		assert.match(out.html, /src="\{\{logo_url\}\}"/);
		assert.equal(out.samples.logo_url, 'https://cdn/x.png');
	});

	test('AN ELEMENT WITH CHILDREN IS LEFT ALONE', () => {
		/*
		 * The important safety property. Replacing the contents of a container
		 * with one token would delete the layout inside it — this is what stops
		 * a wrapper that happens to carry an id from eating the design.
		 */
		const src = '<div id="template-heading"><span class="a">Big</span> <em>small</em></div>';
		assert.equal(tokeniseTemplate(src).html, src);
		assert.deepEqual(tokeniseTemplate(src).variables, []);
	});

	test('text beside inline markup IS tokenised, and the markup survives', () => {
		/*
		 * Real headings look like this — an icon span next to the words. Skipping
		 * them left the most important variable in the template undeclared.
		 */
		const src = '<h1 id="template-heading"><span class="i">&lt;/&gt;</span> Your Name</h1>';
		const out = tokeniseTemplate(src);
		assert.equal(out.samples.heading, 'Your Name');
		assert.match(out.html, /<span class="i">&lt;\/&gt;<\/span> \{\{heading\}\}/);
	});

	test('the LONGEST text run wins, not the first', () => {
		// An element often holds a bullet or separator plus the value.
		const src = '<p id="template-subheading">• <b>x</b> Full Stack Developer</p>';
		assert.equal(tokeniseTemplate(src).samples.subheading, 'Full Stack Developer');
	});

	test('elements without an id are untouched', () => {
		const src = '<p>Just prose.</p><div class="x">More.</div>';
		assert.equal(tokeniseTemplate(src).html, src);
	});

	test('an id that is not a template field still becomes a token only once', () => {
		const src = '<p id="total-amount">$0.00</p><p id="total-amount">$0.00</p>';
		const out = tokeniseTemplate(src);
		assert.equal(out.variables.length, 1);
		assert.equal(out.variables[0], 'total_amount');
	});

	test('everything outside the tokenised elements is preserved byte for byte', () => {
		const src =
			'<!DOCTYPE html><html><head><style>.a{color:red}</style></head>' +
			'<body style="margin:0"><h1 id="template-heading">Hi</h1><p>keep me</p></body></html>';
		const out = tokeniseTemplate(src).html;
		assert.ok(out.startsWith('<!DOCTYPE html><html><head><style>.a{color:red}</style></head>'));
		assert.ok(out.includes('<body style="margin:0">'));
		assert.ok(out.includes('<p>keep me</p>'));
	});

	test('empty and non-string input do not throw', () => {
		for (const junk of ['', null, undefined]) {
			const out = tokeniseTemplate(junk);
			assert.equal(out.html, '');
			assert.deepEqual(out.variables, []);
		}
	});

	test('markup with no ids at all is returned unchanged', () => {
		const src = '<div><p>a</p><p>b</p></div>';
		assert.equal(tokeniseTemplate(src).html, src);
	});

	test('an id inside a comment or a string does not create a variable', () => {
		// `id=` appearing in prose must not be mistaken for an attribute.
		const src = '<p>Set id= on the element</p>';
		assert.deepEqual(tokeniseTemplate(src).variables, []);
	});

	test('a self-closing image is handled', () => {
		const out = tokeniseTemplate('<img id="template-logo" src="a.png" />');
		assert.match(out.html, /\{\{logo_url\}\}/);
	});
});
