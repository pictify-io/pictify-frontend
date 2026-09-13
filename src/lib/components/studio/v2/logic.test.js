import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toStageHtml, fromStageHtml, variablesFrom, checkRoundTrip } from './logic.js';

const here = path.dirname(fileURLToPath(import.meta.url));
/** A real platform template, the one the user reported as "messed up". */
const REAL = fs.readFileSync(path.join(here, 'fixtures/logic-template.html'), 'utf8');

const trip = (src) => fromStageHtml(toStageHtml(src).html);

/**
 * PS-10. The contract is BYTE-FOR-BYTE: a studio that silently rewrites a
 * working template's Handlebars on open is worse than one that refuses to
 * show it. Every case below asserts identity, not equivalence.
 */
describe('round trip', () => {
	test('the real template survives byte for byte', () => {
		assert.equal(trip(REAL), REAL);
	});

	test('an inline if/else inside a sentence', () => {
		const src = 'Welcome{{#if firstName}}, <b>{{firstName}}</b>{{else}}, friend{{/if}}!';
		assert.equal(trip(src), src);
	});

	test('nested blocks', () => {
		const src = '{{#if a}}A{{else}}{{#if b}}B{{/if}}{{/if}}';
		assert.equal(trip(src), src);
	});

	test('a block with no else', () => {
		const src = '<p>{{#if paid}}Thanks{{/if}}</p>';
		assert.equal(trip(src), src);
	});

	test('each, unless and with', () => {
		for (const src of [
			'{{#each items}}<li>{{this}}</li>{{/each}}',
			'{{#unless paid}}<b>Due</b>{{/unless}}',
			'{{#with order}}{{id}}{{/with}}'
		]) {
			assert.equal(trip(src), src);
		}
	});

	test('whitespace control is preserved exactly', () => {
		// Rebuilding from the AST would drop the tildes.
		const src = '{{~#if a~}}x{{~/if~}}';
		assert.equal(trip(src), src);
	});

	test('a helper call with a string parameter is left alone', () => {
		const src = '<span>{{default planName "PRO TRIAL"}}</span>';
		assert.equal(trip(src), src);
		assert.ok(!toStageHtml(src).html.includes('pictify-logic'), 'a mustache is not a block');
	});

	test('a comment containing a brace does not confuse it', () => {
		const src = '{{! a } comment }}<p>{{#if a}}x{{/if}}</p>';
		assert.equal(trip(src), src);
	});

	test('markup with no logic passes through untouched', () => {
		const src = '<div class="a"><h1>{{title}}</h1></div>';
		assert.equal(toStageHtml(src).html, src);
		assert.equal(trip(src), src);
	});

	test('empty and unparseable input do not throw', () => {
		assert.equal(trip(''), '');
		const broken = toStageHtml('{{#if a}}no close');
		assert.equal(broken.ok, false);
		assert.ok(broken.reason);
	});
});

describe('what the chips say', () => {
	test('a block reports the helper and its subject, not both as one', () => {
		// `IF if firstName` was the bug this guards.
		const [b] = toStageHtml('{{#if firstName}}x{{/if}}').blocks;
		assert.equal(b.kind, 'if');
		assert.equal(b.expression, 'firstName');
	});

	test('the real template yields four conditions', () => {
		const blocks = toStageHtml(REAL).blocks;
		assert.equal(blocks.length, 4);
		assert.deepEqual(
			[...new Set(blocks.map((b) => `${b.kind} ${b.expression}`))].sort(),
			['if firstName', 'if userName']
		);
	});

	test('inline content is inline; block content is contents', () => {
		assert.match(toStageHtml('{{#if a}}<span>x</span>{{/if}}').html, /display:inline/);
		assert.match(toStageHtml('{{#if a}}<div>x</div>{{/if}}').html, /display:contents/);
	});
});

describe('variables from the AST', () => {
	test('a helper call reports its parameter, not the helper', () => {
		// A token regex sees `default`; the rail should list `planName`.
		assert.deepEqual(variablesFrom('{{default planName "PRO"}}'), ['planName']);
	});

	test('block conditions and their contents both count', () => {
		assert.deepEqual(variablesFrom('{{#if a}}{{b}}{{/if}}'), ['a', 'b']);
	});

	test('the real template lists what it actually reads', () => {
		const vars = variablesFrom(REAL);
		for (const name of ['firstName', 'userName', 'planName', 'workspaceName']) {
			assert.ok(vars.includes(name), `missing ${name}`);
		}
		assert.ok(!vars.includes('default'), 'the helper is not a variable');
		assert.ok(!vars.includes('if'), 'the block helper is not a variable');
	});

	test('names are de-duplicated and @-globals excluded', () => {
		assert.deepEqual(variablesFrom('{{a}}{{a}}{{@index}}'), ['a']);
	});
});

describe('the well-formedness gate', () => {
	test('a template that round-trips is well formed', () => {
		const out = checkRoundTrip('<p>{{#if a}}x{{/if}}</p>');
		assert.equal(out.wellFormed, true);
	});

	test('the real template is well formed', () => {
		assert.equal(checkRoundTrip(REAL).wellFormed, true);
	});

	test('a document with no logic needs no gate', () => {
		assert.equal(checkRoundTrip('<p>{{title}}</p>').wellFormed, true);
	});

	test('an unparseable document is refused with a reason', () => {
		const out = checkRoundTrip('{{#if a}}');
		assert.equal(out.wellFormed, false);
		assert.ok(out.reason);
	});
});

describe('documents with no logic never reach the parser', () => {
	test('plain HTML containing a stray brace is still well formed', () => {
		// A campaign card with `content: "}}"` in its CSS would otherwise fail
		// Handlebars.parse and be sent to the read-only gate for no reason.
		const src = '<style>.a::after{content:"}}"}</style><p>hi</p>';
		assert.equal(toStageHtml(src).ok, true);
		assert.equal(checkRoundTrip(src).wellFormed, true);
		assert.equal(trip(src), src);
	});

	test('a document that does open a mustache is still parsed', () => {
		assert.equal(toStageHtml('{{#if a}}').ok, false);
	});
});

describe('helper mustaches become chips', () => {
	test('a bare token is left alone — the stage already binds it', () => {
		const src = '<p>{{firstName}}</p>';
		assert.equal(toStageHtml(src).html, src);
		assert.equal(toStageHtml(src).expressions.length, 0);
	});

	test('a helper call is wrapped, and says what it shows', () => {
		const out = toStageHtml('<span>{{default planName "PRO TRIAL"}}</span>');
		assert.match(out.html, /<pictify-expr/);
		assert.deepEqual(out.expressions[0].paths, ['planName']);
		assert.equal(out.expressions[0].helper, 'default');
		// The subject leads: "shows planName, falling back to PRO TRIAL".
		// Entity-escaped in the markup; the canvas renders it with real quotes.
		assert.match(out.html, /planName · default &quot;PRO TRIAL&quot;</);
	});

	test('a subexpression shows the call, having no single subject', () => {
		const out = toStageHtml('<div>{{uppercase (slice firstName 0 1)}}</div>');
		assert.match(out.html, /uppercase \(slice firstName 0 1\)/);
		// The paths inside are still bindings, so Inputs and Change keep working.
		assert.deepEqual(out.expressions[0].paths, ['firstName']);
	});

	test('the helper name is never reported as an input', () => {
		assert.ok(!toStageHtml('{{default planName "x"}}').expressions[0].paths.includes('default'));
	});

	test('every helper mustache in the real template round-trips', () => {
		const out = toStageHtml(REAL);
		assert.ok(out.expressions.length >= 4, `expected chips, got ${out.expressions.length}`);
		assert.equal(fromStageHtml(out.html), REAL);
	});

	test('a chip inside a branch unwraps in the right order', () => {
		// An expression can sit inside a condition; scanning for one kind and
		// then the other would emit them out of order.
		const src = '{{#if a}}<b>{{default n "x"}}</b>{{else}}{{uppercase m}}{{/if}}';
		assert.equal(fromStageHtml(toStageHtml(src).html), src);
	});

	test('the visible label is never what gets saved', () => {
		// data-hb-raw is the source; the label is a rendering and would not parse.
		const src = '{{default planName "PRO TRIAL"}}';
		const html = toStageHtml(src).html;
		assert.ok(html.includes('planName · default'), 'label shown');
		assert.equal(fromStageHtml(html), src);
	});

	test('whitespace control survives a chip', () => {
		const src = '{{~default a "b"~}}';
		assert.equal(fromStageHtml(toStageHtml(src).html), src);
	});

	test('a quote in a helper argument survives the attribute round trip', () => {
		const src = `{{default name "He said \\"hi\\""}}`;
		assert.equal(fromStageHtml(toStageHtml(src).html), src);
	});
});
