/**
 * Tests for text fit.
 * Run: node --test src/lib/video/text-fit.test.js
 *
 * The estimate is approximate on purpose (see the module header). So these
 * tests pin BEHAVIOUR and DIRECTION — longer text shrinks more, a fitted result
 * fits, truncation includes its own ellipsis in the budget — rather than exact
 * pixel counts, which would be false precision and would break on any font
 * change.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	FIT_MODES,
	DEFAULT_FIT,
	readFit,
	fitPatch,
	estimateWidth,
	estimateLines,
	overflows,
	shrinkToFit,
	designedLines,
	truncateToFit,
	applyFit,
	overflowingClips,
	MIN_FONT_SIZE
} from './text-fit.js';

const textClip = (over = {}) => ({
	id: 'c1',
	type: 'Text',
	text: 'Jane Doe',
	style: { fontSize: 40, lineHeight: 1.2 },
	transform: { width: 600, height: 120 },
	metadata: {},
	...over
});

const long = 'Dr. Alexandra Fitzwilliam-Hutchinson OBE, Chief Scientific Officer';

// ── Mode storage ─────────────────────────────────────────────────────────

test('an untouched clip overflows, which is what templates did before', () => {
	assert.equal(readFit(textClip()), 'overflow');
	assert.equal(DEFAULT_FIT, 'overflow');
});

test('a stored mode reads back', () => {
	assert.equal(readFit(textClip({ metadata: { pictify: { fit: 'shrink' } } })), 'shrink');
});

test('an unknown stored mode falls back rather than breaking the render', () => {
	assert.equal(readFit(textClip({ metadata: { pictify: { fit: 'explode' } } })), 'overflow');
});

test('setting a mode preserves the rest of the pictify metadata', () => {
	// Bindings and animation presets live on the same object.
	const clip = textClip({ metadata: { pictify: { bindings: [{ target: 'text' }] } } });
	const patch = fitPatch(clip, 'wrap');
	assert.equal(patch.metadata.pictify.fit, 'wrap');
	assert.deepEqual(patch.metadata.pictify.bindings, [{ target: 'text' }]);
});

test('setting the mode back to the default removes the key', () => {
	const clip = textClip({ metadata: { pictify: { fit: 'wrap', bindings: [] } } });
	const patch = fitPatch(clip, 'overflow');
	assert.equal(patch.metadata.pictify.fit, undefined);
	assert.deepEqual(patch.metadata.pictify.bindings, []);
});

test('an invalid mode is refused', () => {
	assert.equal(fitPatch(textClip(), 'nope'), null);
});

test('every mode has a label and a hint', () => {
	for (const mode of FIT_MODES) {
		assert.ok(mode.id && mode.label && mode.hint, mode.id);
	}
});

// ── Estimation ───────────────────────────────────────────────────────────

test('width grows with length and with font size', () => {
	assert.ok(estimateWidth('aaaa', 40) > estimateWidth('aa', 40));
	assert.ok(estimateWidth('aa', 80) > estimateWidth('aa', 40));
	assert.equal(estimateWidth('', 40), 0);
});

test('letter spacing widens the estimate', () => {
	assert.ok(estimateWidth('aaaa', 40, 10) > estimateWidth('aaaa', 40, 0));
});

test('line count rises as the box narrows', () => {
	assert.equal(estimateLines('short', 40, 10_000), 1);
	assert.ok(estimateLines(long, 40, 200) > estimateLines(long, 40, 600));
});

test('a zero-width box does not divide by zero', () => {
	assert.equal(estimateLines('text', 40, 0), 1);
});

// ── Overflow detection ───────────────────────────────────────────────────

test('the designed-for value fits, the real-world one does not', () => {
	// The exact case this module exists for.
	const box = { width: 600, height: 120 };
	const style = { fontSize: 40, lineHeight: 1.2 };
	assert.equal(overflows('Jane Doe', style, box), false);
	assert.equal(overflows(long, style, box), true);
});

test('a box with no height is never reported as overflowing', () => {
	assert.equal(overflows(long, { fontSize: 40 }, { width: 100 }), false);
});

// ── Shrink ───────────────────────────────────────────────────────────────

test('shrinking produces a size that actually fits', () => {
	const clip = textClip({ text: long });
	const size = shrinkToFit(long, clip.style, clip.transform);
	assert.equal(overflows(long, { ...clip.style, fontSize: size }, clip.transform), false);
});

test('text that already fits is not shrunk', () => {
	const clip = textClip();
	assert.equal(shrinkToFit('Jane Doe', clip.style, clip.transform), 40);
});

test('longer text shrinks further', () => {
	const clip = textClip();
	const a = shrinkToFit(long, clip.style, clip.transform);
	const b = shrinkToFit(long + long + long, clip.style, clip.transform);
	assert.ok(b <= a);
});

test('shrinking never uses more lines than the box was designed for', () => {
	// The visible bug this guards: a name box built for one line wrapped to two
	// and ran straight into the job title underneath. Technically "fitted",
	// visibly broken.
	const clip = textClip({ transform: { width: 600, height: 60 } });
	assert.equal(designedLines(clip.style, clip.transform), 1);
	const size = shrinkToFit(long, clip.style, clip.transform);
	assert.equal(estimateLines(long, size, 600), 1, `size ${size} still wrapped`);
});

test('a box designed for several lines is allowed to use them', () => {
	// Capping everything at one line would ruin body copy.
	const clip = textClip({ style: { fontSize: 20, lineHeight: 1.2 }, transform: { width: 600, height: 200 } });
	assert.ok(designedLines(clip.style, clip.transform) >= 3);
});

test('shrinking stops at a readable floor rather than vanishing', () => {
	const clip = textClip({ transform: { width: 40, height: 20 } });
	assert.equal(shrinkToFit(long.repeat(20), clip.style, clip.transform), MIN_FONT_SIZE);
});

// ── Truncate ─────────────────────────────────────────────────────────────

test('truncated text ends in an ellipsis and is shorter', () => {
	const clip = textClip({ transform: { width: 300, height: 50 } });
	const out = truncateToFit(long, clip.style, clip.transform);
	assert.ok(out.endsWith('…'));
	assert.ok(out.length < long.length);
});

test('text that fits is returned untouched', () => {
	const clip = textClip();
	assert.equal(truncateToFit('Jane Doe', clip.style, clip.transform), 'Jane Doe');
});

test('truncation prefers a word boundary', () => {
	const clip = textClip({ transform: { width: 300, height: 50 } });
	const out = truncateToFit('alpha beta gamma delta epsilon zeta', clip.style, clip.transform);
	// Either it broke on a space, or the word was too long to break politely.
	assert.ok(!/\s…$/.test(out), 'no dangling space before the ellipsis');
});

test('truncating an empty string is safe', () => {
	assert.equal(truncateToFit('', {}, { width: 10, height: 10 }), '');
});

// ── applyFit ─────────────────────────────────────────────────────────────

test('overflow mode changes nothing', () => {
	assert.equal(applyFit(textClip({ text: long })), null);
});

test('wrap hands the work to the engine rather than estimating', () => {
	const clip = textClip({ text: long, metadata: { pictify: { fit: 'wrap' } } });
	const patch = applyFit(clip);
	assert.equal(patch.style.wordWrap, true);
	assert.equal(patch.style.wordWrapWidth, 600);
	assert.equal(patch.style.fontSize, 40, 'wrap must not resize');
	assert.equal(patch.text, undefined, 'wrap must not rewrite the text');
});

test('shrink wraps AND reduces the size', () => {
	const clip = textClip({ text: long, metadata: { pictify: { fit: 'shrink' } } });
	const patch = applyFit(clip);
	assert.equal(patch.style.wordWrap, true);
	assert.ok(patch.style.fontSize < 40);
});

test('truncate rewrites the text', () => {
	const clip = textClip({
		text: long,
		transform: { width: 300, height: 50 },
		metadata: { pictify: { fit: 'truncate' } }
	});
	const patch = applyFit(clip);
	assert.ok(patch.text.endsWith('…'));
});

test('a clip with no box is left alone', () => {
	const clip = textClip({ transform: {}, metadata: { pictify: { fit: 'shrink' } } });
	assert.equal(applyFit(clip), null);
});

test('an empty value is left alone', () => {
	const clip = textClip({ text: '', metadata: { pictify: { fit: 'shrink' } } });
	assert.equal(applyFit(clip), null);
});

test('the style keys already on the clip survive', () => {
	const clip = textClip({
		text: long,
		style: { fontSize: 40, lineHeight: 1.2, color: '#ff0000' },
		metadata: { pictify: { fit: 'shrink' } }
	});
	assert.equal(applyFit(clip).style.color, '#ff0000');
});

// ── Reporting ────────────────────────────────────────────────────────────

test('overflowing clips are reported for the warning', () => {
	const doc = { clips: { c1: textClip({ text: long }) } };
	const found = overflowingClips(doc);
	assert.equal(found.length, 1);
	assert.equal(found[0].clipId, 'c1');
});

test('a clip that has been given a fit mode is not reported', () => {
	// It has been told what to do; that is not a problem to warn about.
	const doc = { clips: { c1: textClip({ text: long, metadata: { pictify: { fit: 'shrink' } } }) } };
	assert.deepEqual(overflowingClips(doc), []);
});

test('non-text clips are never reported', () => {
	const doc = { clips: { c1: { ...textClip({ text: long }), type: 'Image' } } };
	assert.deepEqual(overflowingClips(doc), []);
});

test('an empty or malformed document reports nothing', () => {
	assert.deepEqual(overflowingClips({}), []);
	assert.deepEqual(overflowingClips(null), []);
});
