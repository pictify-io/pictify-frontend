import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
	buildRanges,
	nodeForOffset,
	rangeForNode,
	lineForOffset,
	offsetForLine
} from './code-map.js';

/**
 * PS-3. These pin the property the whole of Code mode rests on: a selection
 * means the same thing on both sides of the split.
 *
 * The offsets are into the USER'S BUFFER, not into a re-serialised document —
 * `ensureNodeIds` rewrites `<br/>` to `<br>`, `class='x'` to `class="x"` and
 * uppercase tags to lowercase, so a map built after a DOM round-trip would
 * point at characters that are not the ones being edited.
 */

const DOC = `<div data-pictify-id="n1" class="card">
  <h1 data-pictify-id="n2">{{title}}</h1>
  <img data-pictify-id="n3" src="/a.png" />
  <p data-pictify-id="n4">Hi {{name}}</p>
</div>`;

describe('buildRanges', () => {
	test('finds every tagged element, outermost first', () => {
		assert.deepEqual(buildRanges(DOC).map((r) => r.id), ['n1', 'n2', 'n3', 'n4']);
	});

	test('a range spans the whole element, opening tag to closing tag', () => {
		const h1 = rangeForNode(DOC, 'n2');
		assert.equal(DOC.slice(h1.start, h1.end), '<h1 data-pictify-id="n2">{{title}}</h1>');
	});

	test('a self-closing element ends at its own tag', () => {
		const img = rangeForNode(DOC, 'n3');
		assert.equal(DOC.slice(img.start, img.end), '<img data-pictify-id="n3" src="/a.png" />');
	});

	test('a void element without a slash also ends at its own tag', () => {
		const html = '<br data-pictify-id="b1"><p data-pictify-id="p1">after</p>';
		assert.equal(html.slice(rangeForNode(html, 'b1').start, rangeForNode(html, 'b1').end), '<br data-pictify-id="b1">');
		assert.equal(rangeForNode(html, 'p1').end, html.length);
	});

	test('reports the 1-based line of each element', () => {
		assert.equal(rangeForNode(DOC, 'n1').line, 1);
		assert.equal(rangeForNode(DOC, 'n2').line, 2);
		assert.equal(rangeForNode(DOC, 'n4').line, 4);
	});

	test('single-quoted ids are read too', () => {
		assert.equal(buildRanges(`<div data-pictify-id='q1'>x</div>`)[0].id, 'q1');
	});

	test("a `>` inside an attribute does not end the tag", () => {
		// The classic scanner bug: `alt="a > b"` closing the tag early.
		const html = `<img data-pictify-id="i1" alt="a > b">`;
		const r = rangeForNode(html, 'i1');
		assert.equal(html.slice(r.start, r.end), html);
	});

	test('untagged elements do not steal a closing tag', () => {
		/*
		 * `<span>` has no id, so it gets no range — but it must still take a
		 * stack frame, or its `</span>` would close the outer div and the div's
		 * range would end early.
		 */
		const html = `<div data-pictify-id="d1"><span>x</span> tail</div>`;
		assert.equal(html.slice(rangeForNode(html, 'd1').end - 6), '</div>');
	});

	test('comments and doctype are skipped, not read as tags', () => {
		const html = `<!-- <div data-pictify-id="ghost"> --><p data-pictify-id="p1">x</p>`;
		assert.deepEqual(buildRanges(html).map((r) => r.id), ['p1']);
	});

	test('markup inside <script> and <style> is not scanned', () => {
		const html = `<style data-pictify-id="s1">.a::after{content:"<div>"}</style><p data-pictify-id="p1">x</p>`;
		assert.deepEqual(buildRanges(html).map((r) => r.id), ['s1', 'p1']);
	});

	test('an element left open runs to the end rather than disappearing', () => {
		// A buffer is unbalanced for most of the time someone is typing in it; a
		// map that vanished on every keystroke would take the selection with it.
		const html = `<div data-pictify-id="d1"><p data-pictify-id="p1">typing`;
		assert.equal(rangeForNode(html, 'd1').end, html.length);
		assert.equal(rangeForNode(html, 'p1').end, html.length);
	});

	test('a stray closing tag does not unwind everything', () => {
		const html = `<div data-pictify-id="d1"></span><p data-pictify-id="p1">x</p></div>`;
		assert.equal(rangeForNode(html, 'd1').end, html.length);
		assert.ok(rangeForNode(html, 'p1'));
	});

	test('empty and junk input yield nothing rather than throwing', () => {
		for (const junk of ['', null, undefined, '<<<', '< div >', '</p>']) {
			assert.ok(Array.isArray(buildRanges(junk)));
		}
	});
});

describe('nodeForOffset — the caret half of the sync', () => {
	test('returns the INNERMOST element containing the caret', () => {
		// Inside {{title}}, which is inside the h1, which is inside the div.
		const at = DOC.indexOf('{{title}}') + 2;
		assert.equal(nodeForOffset(DOC, at), 'n2');
	});

	test('a caret between children belongs to the parent', () => {
		const at = DOC.indexOf('\n  <img');
		assert.equal(nodeForOffset(DOC, at), 'n1');
	});

	test('a caret inside a self-closing tag finds it', () => {
		assert.equal(nodeForOffset(DOC, DOC.indexOf('src="/a.png"')), 'n3');
	});

	test('outside every element is null, not a guess', () => {
		assert.equal(nodeForOffset('  <p data-pictify-id="p1">x</p>', 0), null);
		assert.equal(nodeForOffset(DOC, DOC.length), null);
	});

	test('a non-numeric offset is null rather than NaN behaviour', () => {
		assert.equal(nodeForOffset(DOC, 'nope'), null);
		assert.equal(nodeForOffset(DOC, undefined), null);
	});
});

describe('the two directions agree', () => {
	test('every element round-trips: range → caret → same element', () => {
		/*
		 * The property that makes clicking the canvas and clicking the code the
		 * same gesture. If this ever fails the two panes are describing
		 * different documents.
		 */
		for (const r of buildRanges(DOC)) {
			const inside = r.start + 1;
			const found = nodeForOffset(DOC, inside);
			assert.equal(found, r.id, `offset ${inside} inside ${r.id} resolved to ${found}`);
		}
	});

	test('the line of a range matches the line of its start offset', () => {
		for (const r of buildRanges(DOC)) {
			assert.equal(r.line, lineForOffset(DOC, r.start));
		}
	});
});

describe('line and offset conversion', () => {
	test('offsetForLine and lineForOffset are inverse', () => {
		for (let line = 1; line <= 5; line++) {
			assert.equal(lineForOffset(DOC, offsetForLine(DOC, line)), line);
		}
	});

	test('line 1 starts at 0 and out-of-range clamps to the end', () => {
		assert.equal(offsetForLine(DOC, 1), 0);
		assert.equal(offsetForLine(DOC, 999), DOC.length);
	});
});

describe('what the ids have to survive', () => {
	test('ids and {{tokens}} are untouched by mapping', () => {
		// The map only reads; nothing here may rewrite the buffer.
		const before = DOC;
		buildRanges(DOC);
		nodeForOffset(DOC, 10);
		rangeForNode(DOC, 'n2');
		assert.equal(DOC, before);
	});

	test('an id containing a dash or digits is read whole', () => {
		const html = '<p data-pictify-id="node-12_a">x</p>';
		assert.equal(buildRanges(html)[0].id, 'node-12_a');
	});
});
