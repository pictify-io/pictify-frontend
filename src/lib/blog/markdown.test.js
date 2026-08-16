/**
 * Tests for the blog markdown helpers.
 * Run: node --test src/lib/blog/markdown.test.js
 *
 * The load-bearing property is that `tableOfContents` and the Heading renderer
 * agree on every id. They agree because both drive `headingSlugger`, and the
 * subtle part is that the slugger must see EVERY heading while the TOC only
 * emits H2s — an H3 between two same-named H2s shifts the suffix. That case is
 * the first test here; if it regresses, anchors scroll nowhere and nothing
 * else fails.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	slugify,
	headingSlugger,
	tableOfContents,
	extractTldr,
	stripLeadingH1,
	formatDate,
	readingMinutes
} from './markdown.js';

test('slugify matches marked: lowercase, punctuation dropped, spaces hyphenated', () => {
	assert.equal(slugify('Why "HTML to Image"?'), 'why-html-to-image');
	assert.equal(slugify('Step 1. Install the SDK'), 'step-1-install-the-sdk');
	assert.equal(slugify('  Trailing space  '), 'trailing-space');
});

test('headingSlugger dedupes the way marked does', () => {
	const next = headingSlugger();
	assert.equal(next('Pricing'), 'pricing');
	assert.equal(next('Pricing'), 'pricing-1');
	assert.equal(next('Pricing'), 'pricing-2');
});

test('an intervening H3 shifts the H2 suffix — the TOC must account for it', () => {
	const md = ['## Pricing', 'a', '### Pricing', 'b', '## Pricing', 'c'].join('\n');
	const toc = tableOfContents(md);
	// The H3 consumed `pricing-1`, so the second H2 is `pricing-2`. Emitting
	// `pricing-1` here would point the rail at the H3 instead.
	assert.deepEqual(
		toc.map((t) => t.id),
		['pricing', 'pricing-2']
	);
	assert.equal(toc.length, 2, 'H3s are not listed in the rail');
});

test('headings inside fenced code are not headings', () => {
	const md = ['## Real', '```bash', '## not a heading', '```', '## Also real'].join('\n');
	assert.deepEqual(
		tableOfContents(md).map((t) => t.text),
		['Real', 'Also real']
	);
});

test('an unterminated fence does not swallow the rest of the document', () => {
	const md = ['## Before', '```js', 'const x = 1;'].join('\n');
	assert.deepEqual(
		tableOfContents(md).map((t) => t.text),
		['Before']
	);
});

test('heading text is de-marked for the rail', () => {
	assert.equal(tableOfContents('## Use **bold** and `code`')[0].text, 'Use bold and code');
});

test('extractTldr reads a leading blockquote into claim + points', () => {
	const md = [
		'> **TL;DR** One template, three formats.',
		'> - 50 renders a month free',
		'> - No card',
		'',
		'## Body'
	].join('\n');
	const out = extractTldr(md);
	assert.equal(out.claim, 'One template, three formats.');
	assert.deepEqual(out.points, ['50 renders a month free', 'No card']);
	assert.ok(!out.rest.includes('TL;DR'), 'the block is removed so it is not rendered twice');
	assert.ok(out.rest.includes('## Body'));
});

test('a blockquote that is not a TL;DR is left alone', () => {
	assert.equal(extractTldr('> Just a normal pull quote.\n\n## Body'), null);
});

test('a TL;DR further down the page is not hoisted', () => {
	assert.equal(extractTldr('## Body\n\n> **TL;DR** quoting someone else'), null);
});

test('stripLeadingH1 removes only a leading H1', () => {
	assert.equal(stripLeadingH1('# Title\n\nBody'), 'Body');
	assert.equal(stripLeadingH1('Body\n\n# Later'), 'Body\n\n# Later');
});

test('formatDate refuses to invent a date', () => {
	// One post in the CMS has a null publishedAt. `new Date(null)` is 1970 and
	// `new Date(undefined)` prints "Invalid Date"; both used to reach the page.
	assert.equal(formatDate(null), null);
	assert.equal(formatDate(undefined), null);
	assert.equal(formatDate(''), null);
	assert.equal(formatDate('not a date'), null);
	assert.equal(formatDate('2026-08-10T02:00:00Z'), '10 Aug 2026');
});

test('readingMinutes prefers the stored value, else estimates', () => {
	assert.equal(readingMinutes({ readingTime: 9, content: 'x' }), 9);
	assert.equal(readingMinutes({ content: new Array(400).fill('word').join(' ') }), 2);
	assert.equal(readingMinutes({ content: '' }), null);
});
