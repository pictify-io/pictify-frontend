/**
 * Tests for transcript -> caption clips.
 * Run: node --test src/lib/video/captions.test.js
 *
 * Two things are pinned hardest, because both fail silently and look like the
 * feature simply not working rather than like a bug:
 *
 *   grouping   a caption that never ends sits frozen through a silence
 *   rebasing   words stored in absolute time desynchronise the moment someone
 *              drags the clip, which is the normal thing to do with a clip
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	groupWords,
	buildCaptionClips,
	captionClipFromGroup,
	transcriptPreview,
	MAX_WORDS,
	MAX_GAP_US,
	MAX_DURATION_US
} from './captions.js';

/** Words on a tidy quarter-second cadence, with no gaps. */
const cadence = (texts, step = 250_000) =>
	texts.map((text, i) => ({ text, from: i * step, to: i * step + step }));

// ── Grouping ─────────────────────────────────────────────────────────────

test('a short sentence stays in one caption', () => {
	const groups = groupWords(cadence(['one', 'two', 'three']));
	assert.equal(groups.length, 1);
	assert.equal(groups[0].length, 3);
});

test('a sentence end starts the next caption', () => {
	// The whole reason the transcript is requested punctuated.
	const groups = groupWords(cadence(['Hello', 'there.', 'Next', 'one']));
	assert.deepEqual(
		groups.map((g) => g.map((w) => w.text).join(' ')),
		['Hello there.', 'Next one']
	);
});

test('question and exclamation marks end a caption too', () => {
	assert.equal(groupWords(cadence(['Really?', 'Yes'])).length, 2);
	assert.equal(groupWords(cadence(['Stop!', 'Now'])).length, 2);
});

test('a closing quote after the full stop still ends the sentence', () => {
	// `"...done."` and `(done.)` are common in transcripts of quoted speech.
	assert.equal(groupWords(cadence(['done."', 'Next'])).length, 2);
	assert.equal(groupWords(cadence(['done.)', 'Next'])).length, 2);
});

test('a decimal point does not end a caption', () => {
	// "3.5" ends in a digit, not in punctuation, so the regex must not fire.
	assert.equal(groupWords(cadence(['about', '3.5', 'percent'])).length, 1);
});

test('a caption is capped at MAX_WORDS', () => {
	const groups = groupWords(cadence(Array.from({ length: MAX_WORDS * 2 }, (_, i) => `w${i}`)));
	assert.equal(groups.length, 2);
	assert.ok(groups.every((g) => g.length <= MAX_WORDS));
});

test('a long silence ends the caption', () => {
	// Otherwise the words from before a pause hang on screen through all of it.
	const words = [
		{ text: 'before', from: 0, to: 200_000 },
		{ text: 'after', from: 200_000 + MAX_GAP_US + 1, to: 3_000_000 }
	];
	assert.equal(groupWords(words).length, 2);
});

test('a gap just under the threshold does not split', () => {
	const words = [
		{ text: 'before', from: 0, to: 200_000 },
		{ text: 'after', from: 200_000 + MAX_GAP_US - 1, to: 3_000_000 }
	];
	assert.equal(groupWords(words).length, 1);
});

test('a caption is capped by wall-clock duration', () => {
	// Two slow words can exceed the on-screen limit without reaching MAX_WORDS.
	const words = [
		{ text: 'looong', from: 0, to: MAX_DURATION_US - 1 },
		{ text: 'tail', from: MAX_DURATION_US - 1, to: MAX_DURATION_US + 1_000_000 }
	];
	assert.equal(groupWords(words).length, 2);
});

test('blank and malformed words are skipped, not grouped', () => {
	const groups = groupWords([
		{ text: 'real', from: 0, to: 1 },
		{ text: '   ', from: 1, to: 2 },
		null,
		{ from: 2, to: 3 },
		{ text: 'also real', from: 3, to: 4 }
	]);
	assert.equal(groups.length, 1);
	assert.deepEqual(groups[0].map((w) => w.text), ['real', 'also real']);
});

test('no words produces no groups rather than one empty group', () => {
	assert.deepEqual(groupWords([]), []);
	assert.deepEqual(groupWords(null), []);
});

test('grouping limits are configurable', () => {
	assert.equal(groupWords(cadence(['a', 'b', 'c', 'd']), { maxWords: 2 }).length, 2);
});

// ── Clip shape ───────────────────────────────────────────────────────────

const composition = { width: 1080, height: 1920 };

test('a clip spans its first word to its last', () => {
	const group = cadence(['one', 'two', 'three']);
	const clip = captionClipFromGroup(group, { composition });
	assert.equal(clip.timing.display.from, 0);
	assert.equal(clip.timing.display.to, 750_000);
	assert.equal(clip.timing.duration, 750_000);
});

test('word timings are rebased to the clip start', () => {
	// THE bug this guards: absolute timings look right until the clip is
	// dragged, then every highlight is off by however far it moved.
	const group = [
		{ text: 'late', from: 10_000_000, to: 10_500_000 },
		{ text: 'words', from: 10_500_000, to: 11_000_000 }
	];
	const clip = captionClipFromGroup(group, { composition });
	assert.deepEqual(
		clip.caption.words.map((w) => [w.from, w.to]),
		[[0, 500_000], [500_000, 1_000_000]]
	);
	assert.equal(clip.timing.display.from, 10_000_000, 'the clip itself is still absolute');
});

test('the caption text is the words joined', () => {
	const clip = captionClipFromGroup(cadence(['Hello', 'there.']), { composition });
	assert.equal(clip.text, 'Hello there.');
});

test('the clip is centred horizontally and sits low', () => {
	const clip = captionClipFromGroup(cadence(['x']), { composition });
	assert.equal(clip.transform.x, Math.round((1080 - clip.transform.width) / 2));
	assert.ok(clip.transform.y > composition.height * 0.5, 'below the middle');
});

test('the clip carries a z-index above footage', () => {
	// A caption behind the video it captions is indistinguishable from no caption.
	assert.ok(captionClipFromGroup(cadence(['x']), { composition }).transform.zIndex > 0);
});

test('the default style has an outline, for legibility over unknown footage', () => {
	const clip = captionClipFromGroup(cadence(['x']), { composition });
	assert.ok(clip.style.stroke.width > 0);
	assert.equal(clip.style.color, '#ffffff');
});

test('style and colours can be overridden', () => {
	const clip = captionClipFromGroup(cadence(['x']), {
		composition,
		style: { fontSize: 120 },
		colors: { active: { color: '#ff0000' } }
	});
	assert.equal(clip.style.fontSize, 120);
	assert.equal(clip.caption.colors.active.color, '#ff0000');
	assert.equal(clip.style.color, '#ffffff', 'unspecified style keys keep the default');
});

// ── End to end ───────────────────────────────────────────────────────────

test('a transcript becomes clips in timeline order', () => {
	const clips = buildCaptionClips(cadence(['One.', 'Two.', 'Three.']), { composition });
	assert.equal(clips.length, 3);
	const starts = clips.map((c) => c.timing.display.from);
	assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
});

test('an offset shifts every caption by the clip start', () => {
	// The transcript is relative to the media; the clip may start anywhere.
	const clips = buildCaptionClips(cadence(['One.', 'Two.']), {
		composition,
		offsetUs: 4_000_000
	});
	assert.equal(clips[0].timing.display.from, 4_000_000);
	// Rebasing still happens after the shift, so words stay clip-relative.
	assert.equal(clips[0].caption.words[0].from, 0);
});

test('every clip is a Caption the engine will accept', () => {
	for (const clip of buildCaptionClips(cadence(['One.', 'Two.']), { composition })) {
		assert.equal(clip.type, 'Caption');
		assert.ok(Array.isArray(clip.caption.words) && clip.caption.words.length);
		assert.ok(['single', 'multiple'].includes(clip.wordsPerLine));
		assert.equal(typeof clip.text, 'string');
	}
});

test('an empty transcript produces no clips', () => {
	assert.deepEqual(buildCaptionClips([], { composition }), []);
});

// ── Preview ──────────────────────────────────────────────────────────────

test('the preview joins words and truncates politely', () => {
	assert.equal(transcriptPreview(cadence(['Hello', 'there'])), 'Hello there');
	const long = transcriptPreview(cadence(Array.from({ length: 200 }, () => 'word')));
	assert.ok(long.length <= 241);
	assert.ok(long.endsWith('…'));
});

test('the preview of nothing is an empty string', () => {
	assert.equal(transcriptPreview([]), '');
	assert.equal(transcriptPreview(null), '');
});
