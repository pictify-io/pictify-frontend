import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	MAX_HTML_BYTES,
	formatBytes,
	checkHtmlFiles,
	documentFacts,
	relativeAssetPaths,
	matchImages,
	embedImages,
	describeEmbed,
	stripScripts
} from './html-upload.js';

/**
 * TS-07 B. The drop target refuses before it reads, and says why in one line,
 * so every refusal here is checked for naming the file and the rule.
 */
const file = (name, size = 14 * 1024, type = '') => ({ name, size, type });

describe('which files the pane takes', () => {
	test('one .html or .htm under 2 MB is accepted', () => {
		for (const name of ['invoice.html', 'INVOICE.HTM', 'a.b.html']) {
			assert.equal(checkHtmlFiles([file(name)]).file.name, name);
		}
	});

	test('nothing dropped is not an error', () => {
		assert.deepEqual(checkHtmlFiles([]), { error: null, kind: 'none' });
	});

	test('more than one file is refused with the count', () => {
		const r = checkHtmlFiles([file('a.html'), file('b.html'), file('c.html')]);
		assert.equal(r.kind, 'multiple');
		assert.match(r.error, /3/);
	});

	test('a .zip gets its own reason, because it is the obvious next try', () => {
		const r = checkHtmlFiles([file('site.zip')]);
		assert.equal(r.kind, 'zip');
		assert.match(r.error, /\.zip/);
	});

	test('another type is refused by name', () => {
		const r = checkHtmlFiles([file('logo.png', 2000, 'image/png')]);
		assert.equal(r.kind, 'type');
		assert.match(r.error, /logo\.png/);
	});

	test('over 2 MB is refused with the actual size', () => {
		const r = checkHtmlFiles([file('big.html', MAX_HTML_BYTES + 1)]);
		assert.equal(r.kind, 'size');
		assert.match(r.error, /2\.0 MB/);
		assert.match(r.error, /over the 2 MB limit/);
	});

	test('exactly 2 MB is still fine', () => {
		assert.ok(checkHtmlFiles([file('edge.html', MAX_HTML_BYTES)]).file);
	});

	test('an empty file is refused', () => {
		assert.equal(checkHtmlFiles([file('blank.html', 0)]).kind, 'empty');
	});
});

describe('the loaded card', () => {
	test('sizes read the way the header prints them', () => {
		assert.equal(formatBytes(512), '512 B');
		assert.equal(formatBytes(14 * 1024), '14 KB');
		assert.equal(formatBytes(1536 * 1024), '1.5 MB');
	});

	test('counts lines and notices styles', () => {
		assert.deepEqual(documentFacts('<style>a{}</style>\n<p>x</p>'), { lineCount: 2, stylesKept: true });
		assert.deepEqual(documentFacts('<p style="color:red">x</p>'), { lineCount: 1, stylesKept: true });
		assert.deepEqual(documentFacts('<p>x</p>'), { lineCount: 1, stylesKept: false });
		assert.deepEqual(documentFacts(''), { lineCount: 0, stylesKept: false });
	});
});

describe('relative images', () => {
	const doc = `<img src="img/logo.png"><img src="https://cdn.example.com/a.png">
<div style="background:url('bg.jpg')"></div><img src="img/logo.png">`;

	test('lists each relative path once and skips absolute ones', () => {
		assert.deepEqual(relativeAssetPaths(doc), ['img/logo.png', 'bg.jpg']);
	});

	test('matches picked files by file name, case-insensitively', () => {
		const logo = file('LOGO.PNG');
		const r = matchImages(['img/logo.png', 'bg.jpg'], [logo]);
		assert.deepEqual(r.matched, [{ path: 'img/logo.png', file: logo }]);
		assert.deepEqual(r.missing, ['bg.jpg']);
	});

	test('a query string or an escaped space does not break the match', () => {
		const pic = file('my logo.png');
		assert.equal(matchImages(['assets/my%20logo.png?v=3'], [pic]).matched.length, 1);
	});

	test('embeds into src attributes and CSS url(), whatever the quoting', () => {
		const out = embedImages(
			`<img src="img/logo.png"><img src='img/logo.png'><img src=img/logo.png>
<div style="background:url(bg.jpg)"></div><div style="background:url('bg.jpg')"></div>`,
			new Map([
				['img/logo.png', 'data:image/png;base64,AAA'],
				['bg.jpg', 'data:image/jpeg;base64,BBB']
			])
		);
		assert.equal(out.match(/data:image\/png;base64,AAA/g).length, 3);
		assert.equal(out.match(/data:image\/jpeg;base64,BBB/g).length, 2);
		assert.equal(relativeAssetPaths(out).length, 0);
	});

	test('rewrites whole values only', () => {
		const out = embedImages('<img src="old-logo.png"><img src="logo.png">', {
			'logo.png': 'data:x'
		});
		assert.match(out, /src="old-logo\.png"/);
		assert.match(out, /src="data:x"/);
	});

	test('no replacements leaves the text byte-identical', () => {
		const src = "<img src='a.png'>";
		assert.equal(embedImages(src, new Map()), src);
	});

	test('the note says what is still wrong, not only what worked', () => {
		assert.deepEqual(describeEmbed({ embedded: 2, total: 2 }), {
			tone: 'proof',
			text: 'Embedded 2 of 2'
		});
		const partial = describeEmbed({ embedded: 1, total: 2, missing: ['img/logo.svg'] });
		assert.equal(partial.tone, 'field');
		assert.match(partial.text, /still missing logo\.svg/);
		const none = describeEmbed({ embedded: 0, total: 1, tooBig: ['hero.jpg'] });
		assert.equal(none.tone, 'alarm');
		assert.match(none.text, /hero\.jpg over 1 MB/);
	});
});

describe('scripts are stripped on the way to the render', () => {
	test('script blocks go, with or without a closing tag', () => {
		assert.equal(stripScripts('<p>a</p><script>alert(1)</script><p>b</p>'), '<p>a</p><p>b</p>');
		assert.equal(stripScripts('<script src="x.js"></script>'), '');
		assert.equal(stripScripts('<p>a</p><script src="x.js">'), '<p>a</p>');
	});

	test('inline handlers go, the rest of the tag stays', () => {
		assert.equal(
			stripScripts('<img src="a.png" onerror="alert(1)" alt="x" onload=go()>'),
			'<img src="a.png" alt="x">'
		);
	});

	test('javascript: urls are neutralised', () => {
		assert.equal(stripScripts('<a href="javascript:alert(1)">x</a>'), '<a href="#">x</a>');
	});

	test('markup with no scripts is untouched', () => {
		const src = '<style>.a{color:red}</style><div class="a" data-on="x">online</div>';
		assert.equal(stripScripts(src), src);
	});
});
