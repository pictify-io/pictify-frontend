/**
 * Tests for cutting video by editing its transcript.
 * Run: node --test src/lib/video/transcript-edit.test.js
 *
 * This is the most destructive thing in the editor: it removes footage. A cut
 * that lands two seconds off is not recoverable by eye, and "nearly right" is
 * worse than obviously wrong because it reads as an off-by-a-bit bug rather
 * than a wrong model. So the two clocks — SOURCE time for words and trim,
 * TIMELINE time for display — are pinned separately and at a playback rate that
 * makes the two differ.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	mergeRanges,
	rangesForWords,
	keptSpans,
	cutClip,
	removedTimelineSpan,
	planCuts,
	groupSentences
} from './transcript-edit.js';

const S = 1_000_000;

/** A 10s clip playing source 0..10s at 0..10s on the timeline. */
const clip = (over = {}) => ({
	id: 'v1',
	type: 'Video',
	timing: {
		display: { from: 0, to: 10 * S },
		trim: { from: 0, to: 10 * S },
		duration: 10 * S,
		playbackRate: 1
	},
	...over
});

const words = [
	{ text: 'One.', from: 0, to: 1 * S },
	{ text: 'Two.', from: 1 * S, to: 2 * S },
	{ text: 'Three.', from: 2 * S, to: 3 * S }
];

// ── Ranges ───────────────────────────────────────────────────────────────

test('overlapping ranges merge', () => {
	assert.deepEqual(mergeRanges([{ from: 0, to: 5 }, { from: 3, to: 8 }]), [{ from: 0, to: 8 }]);
});

test('touching ranges merge, so two adjacent words are one cut', () => {
	// Leaving them separate splits the clip for no reason.
	assert.deepEqual(mergeRanges([{ from: 0, to: 5 }, { from: 5, to: 9 }]), [{ from: 0, to: 9 }]);
});

test('separate ranges stay separate and sorted', () => {
	assert.deepEqual(mergeRanges([{ from: 8, to: 9 }, { from: 0, to: 1 }]), [
		{ from: 0, to: 1 },
		{ from: 8, to: 9 }
	]);
});

test('zero-length and malformed ranges are dropped', () => {
	assert.deepEqual(mergeRanges([{ from: 5, to: 5 }, { from: 9, to: 2 }, null]), []);
	assert.deepEqual(mergeRanges(null), []);
});

test('word indices become merged source ranges', () => {
	assert.deepEqual(rangesForWords(words, [0, 1]), [{ from: 0, to: 2 * S }]);
	assert.deepEqual(rangesForWords(words, [0, 2]), [
		{ from: 0, to: 1 * S },
		{ from: 2 * S, to: 3 * S }
	]);
});

test('selecting nothing removes nothing', () => {
	assert.deepEqual(rangesForWords(words, []), []);
});

// ── Kept spans ───────────────────────────────────────────────────────────

test('cutting the middle leaves two spans', () => {
	const spans = keptSpans({ from: 0, to: 10 * S }, [{ from: 4 * S, to: 6 * S }]);
	assert.deepEqual(spans, [
		{ from: 0, to: 4 * S },
		{ from: 6 * S, to: 10 * S }
	]);
});

test('cutting the head leaves one span', () => {
	assert.deepEqual(keptSpans({ from: 0, to: 10 * S }, [{ from: 0, to: 3 * S }]), [
		{ from: 3 * S, to: 10 * S }
	]);
});

test('cutting everything leaves nothing', () => {
	assert.deepEqual(keptSpans({ from: 0, to: 10 * S }, [{ from: 0, to: 10 * S }]), []);
});

test('a cut outside the trim window is ignored', () => {
	// The clip is already trimmed to 2..5; deleting a word at 8s must not
	// change it.
	const spans = keptSpans({ from: 2 * S, to: 5 * S }, [{ from: 8 * S, to: 9 * S }]);
	assert.deepEqual(spans, [{ from: 2 * S, to: 5 * S }]);
});

test('a cut partly outside is clipped to the window', () => {
	const spans = keptSpans({ from: 2 * S, to: 5 * S }, [{ from: 1 * S, to: 3 * S }]);
	assert.deepEqual(spans, [{ from: 3 * S, to: 5 * S }]);
});

// ── Cutting a clip ───────────────────────────────────────────────────────

test('a middle cut produces two contiguous pieces', () => {
	const pieces = cutClip(clip(), [{ from: 4 * S, to: 6 * S }]);
	assert.equal(pieces.length, 2);
	// No hole: the second piece starts where the first ends.
	assert.equal(pieces[0].timing.display.to, pieces[1].timing.display.from);
	assert.equal(pieces[0].timing.display.from, 0);
	assert.equal(pieces[1].timing.display.to, 8 * S);
});

test('each piece keeps its own slice of the source', () => {
	const pieces = cutClip(clip(), [{ from: 4 * S, to: 6 * S }]);
	assert.deepEqual(pieces[0].timing.trim, { from: 0, to: 4 * S });
	assert.deepEqual(pieces[1].timing.trim, { from: 6 * S, to: 10 * S });
});

test('source time converts to timeline time through playbackRate', () => {
	// THE conversion. At 2x, four seconds of source occupies two of timeline;
	// getting this wrong lands cuts near the right place, which is worse than
	// nowhere because it reads as an off-by-a-bit bug.
	const fast = clip({
		timing: {
			display: { from: 0, to: 5 * S },
			trim: { from: 0, to: 10 * S },
			duration: 5 * S,
			playbackRate: 2
		}
	});
	const pieces = cutClip(fast, [{ from: 4 * S, to: 6 * S }]);
	assert.equal(pieces[0].timing.display.to, 2 * S, 'four source seconds at 2x is two');
	assert.equal(pieces[1].timing.display.to, 4 * S);
});

test('a clip laid down later keeps its start', () => {
	const late = clip({
		timing: {
			display: { from: 20 * S, to: 30 * S },
			trim: { from: 0, to: 10 * S },
			duration: 10 * S,
			playbackRate: 1
		}
	});
	assert.equal(cutClip(late, [{ from: 4 * S, to: 6 * S }])[0].timing.display.from, 20 * S);
});

test('cutting everything produces no pieces', () => {
	assert.deepEqual(cutClip(clip(), [{ from: 0, to: 10 * S }]), []);
});

test('cutting nothing returns the clip unchanged in shape', () => {
	const pieces = cutClip(clip(), []);
	assert.equal(pieces.length, 1);
	assert.deepEqual(pieces[0].timing.display, { from: 0, to: 10 * S });
});

test('the removed timeline span is what was actually lost', () => {
	assert.equal(removedTimelineSpan(clip(), [{ from: 4 * S, to: 6 * S }]), 2 * S);
	assert.equal(removedTimelineSpan(clip(), []), 0);
});

// ── The document plan ────────────────────────────────────────────────────

const ids = () => {
	let n = 0;
	return () => `new${(n += 1)}`;
};

const doc = () => ({
	clips: {
		v1: clip(),
		// Starts after the video: should ripple.
		after: { id: 'after', type: 'Text', timing: { display: { from: 10 * S, to: 12 * S } } },
		// Overlaps the video: deliberately left alone.
		over: { id: 'over', type: 'Text', timing: { display: { from: 5 * S, to: 7 * S } } }
	}
});

test('the first piece keeps the original id, so bindings survive', () => {
	// Trimming one end is the common case and must not orphan variable
	// bindings or lose the selection.
	const plan = planCuts(doc(), 'v1', [{ from: 8 * S, to: 10 * S }], ids());
	assert.ok(plan.clips.v1);
	assert.equal(plan.pieces, 1);
});

test('a middle cut mints an id for the second piece', () => {
	const plan = planCuts(doc(), 'v1', [{ from: 4 * S, to: 6 * S }], ids());
	assert.equal(plan.pieces, 2);
	assert.ok(plan.clips.v1);
	assert.ok(plan.clips.new1);
});

test('clips starting after the cut clip ripple left', () => {
	// This is what keeps captions lined up with the speech they belong to.
	const plan = planCuts(doc(), 'v1', [{ from: 4 * S, to: 6 * S }], ids());
	assert.equal(plan.removedUs, 2 * S);
	assert.equal(plan.clips.after.timing.display.from, 8 * S);
	assert.equal(plan.clips.after.timing.display.to, 10 * S);
});

test('a clip that merely overlaps is left alone', () => {
	// Shifting a lower third that spans the cut moves it away from the moment
	// it labels, and there is no correct answer for one straddling a hole.
	const plan = planCuts(doc(), 'v1', [{ from: 4 * S, to: 6 * S }], ids());
	assert.equal(plan.clips.over, undefined);
});

test('cutting the whole clip reports it for removal', () => {
	const plan = planCuts(doc(), 'v1', [{ from: 0, to: 10 * S }], ids());
	assert.deepEqual(plan.removeIds, ['v1']);
	assert.equal(plan.pieces, 0);
});

test('cutting nothing ripples nothing', () => {
	const plan = planCuts(doc(), 'v1', [], ids());
	assert.equal(plan.removedUs, 0);
	assert.equal(plan.clips.after, undefined);
});

test('an unknown clip id is a no-op, not a crash', () => {
	const plan = planCuts(doc(), 'nope', [{ from: 0, to: S }], ids());
	assert.deepEqual(plan.clips, {});
	assert.equal(plan.removedUs, 0);
});

test('the plan never mutates the input document', () => {
	const source = doc();
	planCuts(source, 'v1', [{ from: 4 * S, to: 6 * S }], ids());
	assert.deepEqual(source.clips.v1.timing.display, { from: 0, to: 10 * S });
	assert.equal(source.clips.after.timing.display.from, 10 * S);
});

// ── Sentences ────────────────────────────────────────────────────────────

test('words group into sentences on punctuation', () => {
	const sentences = groupSentences([
		{ text: 'Hello', from: 0, to: 1 },
		{ text: 'there.', from: 1, to: 2 },
		{ text: 'Next', from: 2, to: 3 },
		{ text: 'one.', from: 3, to: 4 }
	]);
	assert.equal(sentences.length, 2);
	assert.equal(sentences[0].text, 'Hello there.');
	assert.deepEqual(sentences[0].indices, [0, 1]);
});

test('a sentence carries the span it covers, for the cut', () => {
	const [sentence] = groupSentences([
		{ text: 'Hello', from: 5, to: 6 },
		{ text: 'there.', from: 6, to: 9 }
	]);
	assert.equal(sentence.from, 5);
	assert.equal(sentence.to, 9);
});

test('a trailing fragment with no full stop is still a sentence', () => {
	// Otherwise the last words of every transcript are uneditable.
	const sentences = groupSentences([{ text: 'unfinished', from: 0, to: 1 }]);
	assert.equal(sentences.length, 1);
});

test('an empty transcript groups to nothing', () => {
	assert.deepEqual(groupSentences([]), []);
	assert.deepEqual(groupSentences(null), []);
});
