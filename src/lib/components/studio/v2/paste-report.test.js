import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { inspectPastedHtml, reportLines } from './paste-report.js';

/**
 * PS-6. The report is shown BEFORE the paste is accepted, so what it claims
 * has to be true — a false "nothing will change" is worse than no report.
 */
describe('assets the renderer will not fetch', () => {
	test('a remote image is reported with its host', () => {
		const r = inspectPastedHtml('<img src="https://cdn.example.com/logo.png">');
		assert.equal(r.assets.length, 1);
		assert.equal(r.assets[0].host, 'cdn.example.com');
		assert.equal(r.ok, false);
	});

	test('our own asset hosts are fine', () => {
		for (const url of [
			'https://htgf.s3.amazonaws.com/a.png',
			'https://media.pictify.io/b.png'
		]) {
			assert.equal(inspectPastedHtml(`<img src="${url}">`).assets.length, 0);
		}
	});

	test('a data: or blob: image carries its own bytes', () => {
		assert.equal(inspectPastedHtml('<img src="data:image/png;base64,AAAA">').assets.length, 0);
		assert.equal(inspectPastedHtml('<img src="blob:abc">').assets.length, 0);
	});

	test('url() inside a style is an asset too', () => {
		// The common case: a background image that vanishes in the render.
		const r = inspectPastedHtml('<div style="background:url(https://cdn.example.com/bg.jpg)"></div>');
		assert.equal(r.assets.length, 1);
		assert.equal(r.assets[0].kind, 'css');
	});

	test('the same url twice is reported once', () => {
		const r = inspectPastedHtml(
			'<img src="https://cdn.example.com/a.png"><img src="https://cdn.example.com/a.png">'
		);
		assert.equal(r.assets.length, 1);
	});

	test('a relative path IS a finding, and is not blamed on a host', () => {
		/*
		 * `/logo.png` works on the site it was copied from and resolves against
		 * nothing here — a render is handed a bare document with no base url. So
		 * it is reported, but as a relative path rather than as a foreign host.
		 */
		const r = inspectPastedHtml('<img src="/logo.png">');
		assert.equal(r.assets.length, 1);
		assert.equal(r.assets[0].relative, true);
		assert.equal(r.assets[0].host, null);
		assert.match(reportLines(r)[0].label, /relative path/);
	});
});

describe('scripts, which are always removed', () => {
	test('a script block is named', () => {
		assert.ok(inspectPastedHtml('<script>x()</script>').scripts.length);
	});

	test('inline handlers are named individually', () => {
		const r = inspectPastedHtml('<div onclick="a()" onmouseover="b()">x</div>');
		assert.match(r.scripts.join(' '), /onclick/);
		assert.match(r.scripts.join(' '), /onmouseover/);
	});

	test('a javascript: url counts', () => {
		assert.ok(inspectPastedHtml('<a href="javascript:alert(1)">x</a>').scripts.length);
	});

	test('markup with none of that reports no scripts', () => {
		assert.equal(inspectPastedHtml('<p>hello</p>').scripts.length, 0);
	});
});

describe('remote stylesheets', () => {
	test('Google Fonts is the allowed exception', () => {
		const r = inspectPastedHtml(
			'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">'
		);
		assert.equal(r.styles.length, 0);
		assert.equal(r.ok, true);
	});

	test('any other stylesheet is reported', () => {
		const r = inspectPastedHtml('<link rel="stylesheet" href="https://cdn.example.com/site.css">');
		assert.equal(r.styles.length, 1);
		assert.equal(r.styles[0].host, 'cdn.example.com');
	});

	test('an @import is reported even without a link tag', () => {
		assert.equal(inspectPastedHtml('<style>@import url(x.css)</style>').styles.length, 1);
	});
});

describe('the overall verdict', () => {
	test('clean markup reports ok', () => {
		const r = inspectPastedHtml('<div style="color:red"><h1>{{title}}</h1></div>');
		assert.equal(r.ok, true);
		assert.deepEqual(reportLines(r), []);
	});

	test('ok is false when anything at all will change', () => {
		assert.equal(inspectPastedHtml('<script>x</script>').ok, false);
	});

	test('empty and non-string input do not throw', () => {
		for (const junk of ['', null, undefined]) assert.equal(inspectPastedHtml(junk).ok, true);
	});

	test('every finding produces a line with a reason', () => {
		const r = inspectPastedHtml(
			'<script>x</script><img src="https://cdn.example.com/a.png">' +
				'<link rel="stylesheet" href="https://cdn.example.com/s.css">'
		);
		const lines = reportLines(r);
		assert.equal(lines.length, 3);
		for (const line of lines) {
			assert.ok(line.label, 'has a label');
			assert.ok(line.detail, 'says why it matters');
		}
	});
});
