import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitDocument, joinDocument, fontLinks, shellAttributes } from './document-shell.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REAL = fs.readFileSync(path.join(here, 'fixtures/logic-template.html'), 'utf8');

/**
 * PS-10. The shell is the difference between a preview of the design and a
 * preview of its contents — the canvas size, the page background and the
 * webfont all live outside `<body>`'s children.
 */
describe('splitting and rejoining', () => {
	test('the real template rejoins byte for byte', () => {
		const shell = splitDocument(REAL);
		assert.equal(joinDocument(shell, shell.body), REAL);
	});

	test('it finds the real template’s shell', () => {
		const shell = splitDocument(REAL);
		assert.equal(shell.whole, true);
		assert.match(shell.htmlAttrs, /background-color: #1B0316/);
		assert.match(shell.bodyAttrs, /width: 1080px; height: 1080px/);
		assert.match(shell.bodyAttrs, /radial-gradient/);
		assert.ok(!shell.body.includes('<body'), 'the body slice is contents, not the tag');
	});

	test('a bare fragment stays a bare fragment', () => {
		// Re-wrapping one in <html> on save would change what the renderer gets.
		const src = '<div class="card">hi</div>';
		const shell = splitDocument(src);
		assert.equal(shell.whole, false);
		assert.equal(shell.body, src);
		assert.equal(joinDocument(shell, shell.body), src);
	});

	test('an edited body is put back inside the original shell', () => {
		const src = '<html lang="en"><head><title>t</title></head><body style="color:red">old</body></html>';
		const shell = splitDocument(src);
		assert.equal(
			joinDocument(shell, 'new'),
			'<html lang="en"><head><title>t</title></head><body style="color:red">new</body></html>'
		);
	});

	test('the head is kept verbatim, understood or not', () => {
		const src = '<html><head><meta name="x"><style>.a{}</style></head><body>b</body></html>';
		assert.equal(joinDocument(splitDocument(src), 'b'), src);
	});

	test('a doctype and trailing newline survive', () => {
		const src = '<!DOCTYPE html>\n<html><body>x</body></html>\n';
		assert.equal(joinDocument(splitDocument(src), 'x'), src);
	});

	test('uppercase and spaced tags are matched', () => {
		const src = '<HTML STYLE="color:red"><BODY  class="c">x</BODY></HTML>';
		const shell = splitDocument(src);
		assert.equal(shell.whole, true);
		assert.deepEqual(shellAttributes(shell.bodyAttrs), { class: 'c' });
		assert.equal(joinDocument(shell, shell.body), src);
	});

	test('a `</body>` inside a comment does not cut the document short', () => {
		// lastIndexOf, for exactly this.
		const src = '<html><body>a<!-- </body> -->b</body></html>';
		const shell = splitDocument(src);
		assert.equal(shell.body, 'a<!-- </body> -->b');
		assert.equal(joinDocument(shell, shell.body), src);
	});

	test('a body tag with no close is treated as a fragment, not truncated', () => {
		const src = '<html><body>never closed';
		assert.equal(splitDocument(src).body, src);
	});

	test('empty and non-string input do not throw', () => {
		for (const junk of ['', null, undefined]) {
			const shell = splitDocument(junk);
			assert.equal(joinDocument(shell, shell.body), '');
		}
	});
});

describe('which stylesheets a preview may keep', () => {
	test('the real template’s Google Fonts link is kept', () => {
		const links = fontLinks(splitDocument(REAL).head);
		assert.equal(links.length, 1);
		assert.match(links[0], /Bricolage\+Grotesque/);
	});

	test('any other host is dropped', () => {
		assert.deepEqual(fontLinks('<link rel="stylesheet" href="https://evil.example/x.css">'), []);
	});

	test('a host name appearing in a query string is not the host', () => {
		// String-matching `fonts.googleapis.com` would pass this.
		assert.deepEqual(
			fontLinks('<link rel="stylesheet" href="https://evil.example/?x=fonts.googleapis.com">'),
			[]
		);
	});

	test('a look-alike host is not the host', () => {
		for (const href of [
			'https://fonts.googleapis.com.evil.example/x.css',
			'https://evilfonts.googleapis.com/x.css',
			'https://sub.fonts.googleapis.com/x.css'
		]) {
			assert.deepEqual(fontLinks(`<link rel="stylesheet" href="${href}">`), []);
		}
	});

	test('http is refused', () => {
		assert.deepEqual(fontLinks('<link rel="stylesheet" href="http://fonts.googleapis.com/x">'), []);
	});

	test('a scheme-relative href is emitted as the https url that was checked', () => {
		// `//host` resolves against the parent page's scheme at fetch time, so
		// emitting it unchanged would fetch something other than what passed the
		// host check.
		assert.deepEqual(fontLinks('<link rel="stylesheet" href="//fonts.googleapis.com/x">'), [
			'<link rel="stylesheet" href="https://fonts.googleapis.com/x">'
		]);
	});

	test('a relative href is refused rather than resolved onto our own origin', () => {
		assert.deepEqual(fontLinks('<link rel="stylesheet" href="/theme.css">'), []);
	});

	test('a link that is not a stylesheet is dropped', () => {
		assert.deepEqual(fontLinks('<link rel="preload" href="https://fonts.googleapis.com/x">'), []);
	});

	test('a kept link is re-emitted, not passed through', () => {
		// Only rel and href survive; an onload or integrity on the source tag
		// never reaches the frame.
		const out = fontLinks(
			'<link rel="stylesheet" onload="x()" href="https://fonts.googleapis.com/css2?family=Inter">'
		);
		assert.deepEqual(out, ['<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">']);
	});

	test('a quote in an unquoted href cannot break out of the attribute', () => {
		const out = fontLinks(`<link rel=stylesheet href=https://fonts.googleapis.com/a"onerror=x>`);
		assert.equal(out.length, 1);
		// Percent-encoded by the URL parse, so the quote is gone before escaping
		// ever has to save it — and the emitted value has no bare quote at all.
		assert.deepEqual(out, [
			'<link rel="stylesheet" href="https://fonts.googleapis.com/a%22onerror=x">'
		]);
	});
});

describe('which shell attributes are applied', () => {
	test('style and class are taken', () => {
		assert.deepEqual(shellAttributes(`style="color:red" class='a b'`), {
			style: 'color:red',
			class: 'a b'
		});
	});

	test('everything else is left behind', () => {
		// The shell is the one place an attribute would reach the frame without
		// passing through the body sanitizer.
		assert.deepEqual(shellAttributes('onload="steal()" id="x" lang="en" data-a="1"'), {});
	});

	test('nothing at all is an empty set, not a throw', () => {
		for (const junk of ['', null, undefined]) assert.deepEqual(shellAttributes(junk), {});
	});
});
