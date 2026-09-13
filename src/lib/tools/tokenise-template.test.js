import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { tokeniseTemplate, tokenFor, inferFields } from './tokenise-template.js';

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
		/*
		 * And it does NOT fall through to inference: the template stated its
		 * fields, so "none here" is the answer — inferring some would tokenise
		 * whatever text sat nearby instead of what was declared.
		 */
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

	test('markup that declares no ids falls through to inference', () => {
		/*
		 * Intended: an id-less template's text IS its content — that is the whole
		 * point of the fallback. Templates that DO declare ids are handled above
		 * and never reach it.
		 */
		const src = '<p>Just prose.</p><div class="x">More words here.</div>';
		assert.ok(tokeniseTemplate(src).variables.length > 0);
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

	test('an id= in prose is not read as an attribute', () => {
		// It must not become a field NAMED from that text; inference may still
		// treat the prose as content, which is a different thing.
		const out = tokeniseTemplate('<p>Set id= on the element</p>');
		assert.ok(!out.variables.some((v) => v.startsWith('on_')));
	});

	test('a self-closing image is handled', () => {
		const out = tokeniseTemplate('<img id="template-logo" src="a.png" />');
		assert.match(out.html, /\{\{logo_url\}\}/);
	});
});

/**
 * The fallback for templates that declare no fields. Eighteen pSEO templates
 * are inline-styled divs with no ids at all, so swapping to one used to give
 * the visitor an empty Inputs tab.
 */
describe('inferring fields from the design', () => {
	const CARD =
		'<div><div style="font-size:22px;letter-spacing:.12em;text-transform:uppercase">MARCH NEWSLETTER</div>' +
		'<div style="font-size:64px">What shipped this month</div>' +
		'<div style="font-size:24px">Roadmap notes and one big announcement.</div></div>';

	test('size is the signal: biggest is the heading, next the subheading', () => {
		const out = tokeniseTemplate(CARD);
		assert.equal(out.samples.heading, 'What shipped this month');
		assert.equal(out.samples.subheading, 'Roadmap notes and one big announcement.');
	});

	test('small letter-spaced capitals are a label, not the second heading', () => {
		// A 22px eyebrow above a 64px headline is a label, not the runner-up.
		assert.equal(tokeniseTemplate(CARD).samples.label, 'MARCH NEWSLETTER');
	});

	test('variables come back in DOCUMENT order, not size order', () => {
		// Inputs should read down the design.
		assert.deepEqual(tokeniseTemplate(CARD).variables, ['label', 'heading', 'subheading']);
	});

	test('glyphs and initials are not fields', () => {
		/*
		 * Without this the biggest "text" in a badge is the ★ and an avatar's
		 * "JA" outranks the author's name — someone editing {{heading}} expecting
		 * the title would get a star.
		 */
		const src =
			'<div><div style="font-size:90px">★</div><div style="font-size:30px">JA</div>' +
			'<div style="font-size:20px">Top Contributor</div></div>';
		const out = tokeniseTemplate(src);
		assert.ok(!Object.values(out.samples).includes('★'));
		assert.ok(!Object.values(out.samples).includes('JA'));
		assert.equal(out.samples.heading, 'Top Contributor');
	});

	test('a template that DECLARES its fields is believed over the fallback', () => {
		// The fallback is a fallback; a stated contract always wins.
		const src = '<div><h1 id="template-heading">Real</h1><div style="font-size:99px">Bigger</div></div>';
		const out = tokeniseTemplate(src);
		assert.deepEqual(out.variables, ['heading']);
		assert.equal(out.samples.heading, 'Real');
	});

	test('markup with no words yields nothing rather than junk fields', () => {
		const out = tokeniseTemplate('<div><div style="font-size:40px">★</div></div>');
		assert.deepEqual(out.variables, []);
	});

	test('it never produces more fields than it can name well', () => {
		let src = '<div>';
		for (let i = 0; i < 20; i++) src += `<div style="font-size:${40 - i}px">Line number ${i}</div>`;
		src += '</div>';
		assert.ok(tokeniseTemplate(src).variables.length <= 6);
	});
});

describe('a document that already has tokens', () => {
	test('is not inferred over', () => {
		/*
		 * The certificates arrive with their fields already named by the render
		 * function. Inferring on top added label/label_2/label_3 for the fixed
		 * chrome — "CERTIFICATE", "ORGANIZATION", "DATE" — which is not content
		 * and buried the four fields that are.
		 */
		const src =
			'<div><div style="font-size:20px">CERTIFICATE</div>' +
			'<div style="font-size:60px">{{name}}</div></div>';
		assert.deepEqual(tokeniseTemplate(src).variables, []);
		assert.equal(tokeniseTemplate(src).html, src);
	});
});

describe('inferFields · opaque elements', () => {
	test('never proposes a stylesheet as a field', () => {
		const doc = `<html><head><style>
      body { margin: 0; font-family: system-ui; }
      h1 { font-size: 76px; color: #14110f; }
    </style></head><body>
      <h1 style="font-size:76px">Edit this HTML</h1>
      <p style="font-size:26px">Change anything on the left and it follows.</p>
    </body></html>`;
		const { html, samples, variables } = inferFields(doc);
		// The CSS survives untouched — it is the design, not a value.
		assert.match(html, /font-family: system-ui/);
		for (const v of variables) assert.doesNotMatch(samples[v], /font-family/);
		assert.deepEqual(variables, ['heading', 'subheading']);
	});

	test('leaves script, title and pre alone too', () => {
		const doc = `<html><head><title>Some page title here</title></head><body>
      <script>const answer = "forty two and then some";</script>
      <pre>a preformatted block of sample text</pre>
      <h1 style="font-size:60px">The real heading</h1>
      <p style="font-size:20px">And the real body copy underneath.</p>
    </body></html>`;
		const { samples, variables } = inferFields(doc);
		const texts = variables.map((v) => samples[v]);
		assert.deepEqual(texts, ['The real heading', 'And the real body copy underneath.']);
	});
});
