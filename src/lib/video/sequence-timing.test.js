/**
 * Tests for reading and retiming <Sequence> blocks.
 * Run: node --test src/lib/video/sequence-timing.test.js
 *
 * This edits a user's source file. The failure that matters is not "the drag
 * did nothing" — it is "the drag silently corrupted their composition", so the
 * write-back cases are pinned hardest: exact bytes preserved, spans that stay
 * correct when a number changes length, and a refusal to touch anything
 * computed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
	parseSequences,
	retimeSequence,
	toTimelineBars,
	hasSequences
} from './sequence-timing.js';

const TWO_BEATS = `import { Sequence, AbsoluteFill } from 'remotion';

export default function Scene() {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={45}>
        <Title />
      </Sequence>
      <Sequence from={45} durationInFrames={60}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
}`;

// ── Parsing ──────────────────────────────────────────────────────────────

test('reads every sequence in document order', () => {
	const found = parseSequences(TWO_BEATS);
	assert.equal(found.length, 2);
	assert.deepEqual(
		found.map((s) => [s.from, s.durationInFrames]),
		[[0, 45], [45, 60]]
	);
});

test('labels a beat from its first child component', () => {
	// "Title" reads better than "Sequence 1" when scanning a timeline.
	const found = parseSequences(TWO_BEATS);
	assert.equal(found[0].label, 'Title');
	assert.equal(found[1].label, 'Outro');
});

test('an explicit name attribute wins over the child', () => {
	const src = `<Sequence name="Intro beat" from={0} durationInFrames={30}><Title /></Sequence>`;
	assert.equal(parseSequences(src)[0].label, 'Intro beat');
});

test('a missing from defaults to 0, as Remotion does', () => {
	const found = parseSequences(`<Sequence durationInFrames={30}><A /></Sequence>`);
	assert.equal(found[0].from, 0);
	assert.equal(found[0].durationInFrames, 30);
});

test('a composition with no sequences parses to nothing, not a crash', () => {
	assert.deepEqual(parseSequences('export default () => <AbsoluteFill />'), []);
	assert.deepEqual(parseSequences(''), []);
	assert.deepEqual(parseSequences(null), []);
	assert.equal(hasSequences('const x = 1;'), false);
	assert.equal(hasSequences(TWO_BEATS), true);
});

// ── The safe subset ──────────────────────────────────────────────────────

test('a computed timing is reported but not editable', () => {
	// Rewriting `fps * 2` means deciding what the author meant. A bar that moves
	// but cannot be written back is worse than one that refuses to move.
	const src = `<Sequence from={fps * 2} durationInFrames={60}><A /></Sequence>`;
	const [sequence] = parseSequences(src);
	assert.equal(sequence.editable, false);
	assert.equal(sequence.computed, true);
	assert.equal(sequence.from, null, 'an unknown start is null, not a guessed 0');
});

test('both numbers must be literals to be editable', () => {
	const src = `<Sequence from={0} durationInFrames={INTRO}><A /></Sequence>`;
	assert.equal(parseSequences(src)[0].editable, false);
});

test('negative and multi-digit literals are read correctly', () => {
	const found = parseSequences(`<Sequence from={-15} durationInFrames={1200}><A /></Sequence>`);
	assert.deepEqual([found[0].from, found[0].durationInFrames], [-15, 1200]);
});

test('a comparison inside a prop does not end the tag early', () => {
	// `durationInFrames={a > b ? 1 : 2}` contains a ">" that a naive tag regex
	// would treat as the end of the element.
	const src = `<Sequence from={0} durationInFrames={a > b ? 30 : 60}><A /></Sequence>`;
	const found = parseSequences(src);
	assert.equal(found.length, 1);
	assert.equal(found[0].editable, false);
});

// ── Write-back ───────────────────────────────────────────────────────────

test('retiming changes only the digits it targets', () => {
	const out = retimeSequence(TWO_BEATS, 1, { from: 50, durationInFrames: 70 });
	assert.match(out, /from=\{50\} durationInFrames=\{70\}/);
	// Everything else is byte-identical: the point of spans over an AST.
	assert.equal(
		out.replace('from={50} durationInFrames={70}', 'from={45} durationInFrames={60}'),
		TWO_BEATS
	);
});

test('the first sequence is untouched when the second is retimed', () => {
	const out = retimeSequence(TWO_BEATS, 1, { from: 50 });
	assert.match(out, /from=\{0\} durationInFrames=\{45\}/, 'beat 1 unchanged');
});

test('a number growing in length does not corrupt the other span', () => {
	// 45 -> 1200 shifts every later offset. Edits are applied right to left for
	// exactly this reason; applied left to right the second write lands in the
	// wrong place and produces syntactically broken source.
	const out = retimeSequence(TWO_BEATS, 0, { from: 1000, durationInFrames: 2000 });
	assert.match(out, /from=\{1000\} durationInFrames=\{2000\}/);
	assert.match(out, /from=\{45\} durationInFrames=\{60\}/, 'the second beat is intact');
	// And the result still parses back to two sequences with the right numbers.
	assert.deepEqual(
		parseSequences(out).map((s) => [s.from, s.durationInFrames]),
		[[1000, 2000], [45, 60]]
	);
});

test('a computed sequence is refused, leaving the source untouched', () => {
	const src = `<Sequence from={fps} durationInFrames={60}><A /></Sequence>`;
	assert.equal(retimeSequence(src, 0, { from: 10, durationInFrames: 20 }), src);
});

test('an out-of-range index is a no-op', () => {
	assert.equal(retimeSequence(TWO_BEATS, 99, { from: 1 }), TWO_BEATS);
	assert.equal(retimeSequence(TWO_BEATS, -1, { from: 1 }), TWO_BEATS);
});

test('duration never goes below one frame', () => {
	// A zero-length sequence renders nothing and looks identical to a deleted
	// one, which is not what dragging an edge should ever mean.
	const out = retimeSequence(TWO_BEATS, 0, { durationInFrames: 0 });
	assert.match(out, /from=\{0\} durationInFrames=\{1\}/);
});

test('a negative start is clamped to zero', () => {
	const out = retimeSequence(TWO_BEATS, 0, { from: -40 });
	assert.match(out, /from=\{0\}/);
});

test('non-numeric timing is ignored rather than written', () => {
	assert.equal(retimeSequence(TWO_BEATS, 0, { from: NaN }), TWO_BEATS);
	assert.equal(retimeSequence(TWO_BEATS, 0, {}), TWO_BEATS);
	assert.equal(retimeSequence(TWO_BEATS, 0, { from: 'soon' }), TWO_BEATS);
});

test('fractional frames are rounded, not written as decimals', () => {
	// A dragged pixel maps to a fractional frame; durationInFrames={12.7} is not
	// valid timing.
	const out = retimeSequence(TWO_BEATS, 0, { from: 12.7, durationInFrames: 30.2 });
	assert.match(out, /from=\{13\} durationInFrames=\{30\}/);
});

// ── Nesting and bars ─────────────────────────────────────────────────────

const NESTED = `<Sequence from={90} durationInFrames={120}>
  <Sequence from={0} durationInFrames={30}><Inner /></Sequence>
</Sequence>`;

test('nesting depth is tracked', () => {
	const found = parseSequences(NESTED);
	assert.equal(found[0].depth, 0);
	assert.equal(found[1].depth, 1);
});

test('a nested start is resolved to absolute time for the bar', () => {
	// A child at from={0} inside a parent at from={90} starts at frame 90.
	// Drawing it at 0 would make the timeline actively misleading.
	const bars = toTimelineBars(parseSequences(NESTED), 300);
	assert.equal(bars[0].start, 90);
	assert.equal(bars[1].start, 90, 'child inherits its parent start');
});

test('bars are positioned as fractions of the composition', () => {
	const bars = toTimelineBars(parseSequences(TWO_BEATS), 105);
	assert.equal(bars[0].left, 0);
	assert.ok(Math.abs(bars[0].width - 45 / 105) < 1e-9);
	assert.ok(Math.abs(bars[1].left - 45 / 105) < 1e-9);
});

test('a beat running past the end still draws inside the track', () => {
	const bars = toTimelineBars(parseSequences(`<Sequence from={90} durationInFrames={600}><A /></Sequence>`), 100);
	assert.ok(bars[0].left + bars[0].width <= 1.0000001, 'clamped to the track');
});

test('a sequence with no duration fills the remaining time', () => {
	const bars = toTimelineBars(parseSequences(`<Sequence from={30}><A /></Sequence>`), 120);
	assert.equal(bars[0].length, 90);
});

test('a zero or missing total does not divide by zero', () => {
	const bars = toTimelineBars(parseSequences(TWO_BEATS), 0);
	assert.ok(Number.isFinite(bars[0].left) && Number.isFinite(bars[0].width));
});
