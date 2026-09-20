/**
 * Snapshot tests for the playground's snippet generators.
 * Run: node --test src/lib/dashboard/playground-snippets.test.js
 *
 * The property worth protecting is that a snippet describes the request the
 * page actually sends. These fixtures are the `{ method, url, headers, body }`
 * objects the nine calls hand to `fetch`, so a change to a generator that would
 * make the printed call diverge from the sent one fails here rather than in a
 * developer's terminal.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	SNIPPET_LANGS,
	toNode,
	toPython,
	toCurl,
	toPhp,
	buildSnippet
} from './playground-snippets.js';

const KEY = 'pic_live_test0000';
const jsonHeaders = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const getHeaders = { Authorization: `Bearer ${KEY}` };
const base = 'https://api.pictify.io';

/** One fixture per call in the calls lane. */
const CALLS = {
	'html-image': {
		method: 'POST',
		url: `${base}/image`,
		headers: jsonHeaders,
		body: { html: '<div>Hello</div>', width: 1200, height: 630, fileExtension: 'png' }
	},
	'html-pdf': {
		method: 'POST',
		// The template render endpoint, not /pdf/multi-page: that one is
		// FabricJS-only and fails for every template creatable today.
		url: `${base}/templates/tpl_8ka2/render`,
		headers: jsonHeaders,
		body: { variableSets: [{ name: 'Ada' }], format: 'pdf', preset: 'A4' }
	},
	'tpl-image': {
		method: 'POST',
		url: `${base}/templates/tpl_8ka2/render`,
		headers: jsonHeaders,
		body: { variables: { recipient_name: 'Mika Patel' }, format: 'png' }
	},
	'tpl-pdf': {
		method: 'POST',
		url: `${base}/templates/tpl_8ka2/render`,
		headers: jsonHeaders,
		body: { variables: { recipient_name: 'Mika Patel' }, format: 'pdf' }
	},
	'tpl-video': {
		method: 'POST',
		url: `${base}/video/templates/tpl_8ka2/render`,
		headers: jsonHeaders,
		body: { variables: { title: 'Launch' }, format: 'mp4' }
	},
	'batch-rows': {
		method: 'POST',
		url: `${base}/templates/tpl_8ka2/batch-render`,
		headers: jsonHeaders,
		body: { variableSets: [{ name: 'Ada' }, { name: 'Alan' }], format: 'png' }
	},
	'batch-csv': {
		method: 'POST',
		url: `${base}/templates/tpl_8ka2/batch-render`,
		headers: jsonHeaders,
		body: { csv: 'name,title\nMika,Designer', format: 'png' }
	},
	'tpl-vars': { method: 'GET', url: `${base}/templates/tpl_8ka2/variables`, headers: getHeaders },
	'batch-results': {
		method: 'GET',
		url: `${base}/templates/batch/bat_12ab/results`,
		headers: getHeaders
	}
};

const CALL_IDS = Object.keys(CALLS);

test('nine calls × four languages all produce a snippet', () => {
	assert.equal(CALL_IDS.length, 9);
	assert.equal(SNIPPET_LANGS.length, 4);
	for (const id of CALL_IDS) {
		for (const lang of SNIPPET_LANGS) {
			const out = lang.build(CALLS[id]);
			assert.ok(out.length > 20, `${id} × ${lang.id} produced nothing`);
			// The URL is the one thing every language must print verbatim: it is
			// what makes the snippet the same call the page sent.
			assert.ok(out.includes(CALLS[id].url), `${id} × ${lang.id} lost the URL`);
			assert.ok(out.includes(KEY), `${id} × ${lang.id} lost the key`);
		}
	}
});

test('GET calls carry no body and no Content-Type', () => {
	for (const id of ['tpl-vars', 'batch-results']) {
		for (const lang of SNIPPET_LANGS) {
			const out = lang.build(CALLS[id]);
			assert.ok(!out.includes('Content-Type'), `${id} × ${lang.id} sent a Content-Type`);
			assert.ok(!/body|POSTFIELDS|json=|-d '/.test(out), `${id} × ${lang.id} sent a body`);
		}
	}
});

test('node snippet is a JS object literal, not a JSON string', () => {
	const out = toNode(CALLS['tpl-image']);
	assert.match(out, /body: JSON\.stringify\(\{/);
	assert.match(out, /variables: \{/); // bare key
	assert.match(out, /recipient_name: 'Mika Patel'/); // single quotes
	assert.ok(!out.includes('"variables"'), 'node snippet should not quote keys');
});

test('quoted keys stay quoted where the identifier is not bare', () => {
	const out = toNode(CALLS['html-image']);
	assert.match(out, /'Content-Type': 'application\/json'/);
});

test('python snippet uses python spellings', () => {
	const out = toPython({ ...CALLS['tpl-image'], body: { a: true, b: false, c: null } });
	assert.match(out, /'a': True/);
	assert.match(out, /'b': False/);
	assert.match(out, /'c': None/);
	assert.match(out, /^import requests/);
});

test('curl body is real JSON and single quotes inside it are shell-escaped', () => {
	const out = toCurl({ ...CALLS['tpl-image'], body: { name: "Mika's award" } });
	assert.ok(out.includes(`-d '`), 'body should be single-quoted for the shell');
	assert.ok(out.includes(`'\\''`), 'an apostrophe must close and reopen the shell quote');
});

test('php snippet is valid-looking short-array syntax', () => {
	const out = toPhp(CALLS['batch-rows']);
	assert.match(out, /^<\?php/);
	assert.match(out, /'variableSets' => \[/);
	assert.match(out, /curl_setopt\(\$ch, CURLOPT_POSTFIELDS, json_encode\(/);
	assert.match(out, /curl_close\(\$ch\);/);
});

test('an empty object and an empty array render as literals, not as blank', () => {
	const out = toNode({ ...CALLS['tpl-image'], body: { variables: {}, sets: [] } });
	assert.match(out, /variables: \{\}/);
	assert.match(out, /sets: \[\]/);
});

test('a multi-line value stays a valid single-line literal', () => {
	// The sample HTML is multi-line. A raw newline inside a single-quoted JS,
	// Python or PHP string is a syntax error, so the copied snippet would not
	// run — which defeats the entire point of the copy button.
	const req = { ...CALLS['html-image'], body: { html: '<div>\n  hi\n</div>' } };
	for (const build of [toNode, toPython, toPhp]) {
		const out = build(req);
		const literal = /'<div>[^']*'/.exec(out);
		assert.ok(literal, `${build.name} did not emit the html literal`);
		assert.ok(!literal[0].includes('\n'), `${build.name} left a raw newline in a string literal`);
		assert.ok(
			literal[0].includes('\\n'),
			`${build.name} dropped the escape instead of writing \\n`
		);
	}
	// curl carries the body as real JSON, where JSON.stringify does the escaping.
	const curl = toCurl(req);
	assert.ok(curl.includes('\\n'), 'curl body should carry an escaped newline');
});

test('a tab and a backslash survive the round trip', () => {
	const req = { ...CALLS['html-image'], body: { html: 'a\tb\\c' } };
	const out = toNode(req);
	assert.match(out, /'a\\tb\\\\c'/);
});

test('buildSnippet falls back to node for an unknown language id', () => {
	assert.equal(buildSnippet('COBOL', CALLS['html-image']), toNode(CALLS['html-image']));
});

test('the snippet never invents a field the request did not carry', () => {
	// The board shows a SCALE field; /image does not accept one, so it must not
	// appear in any generated call.
	for (const id of CALL_IDS) {
		for (const lang of SNIPPET_LANGS) {
			assert.ok(!/\bscale\b/i.test(lang.build(CALLS[id])), `${id} × ${lang.id} invented scale`);
		}
	}
});
