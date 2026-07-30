/**
 * Reading and retiming `<Sequence>` blocks in a Remotion composition.
 *
 * A composition expresses animation as arithmetic on the current frame, so
 * there is no clip structure to recover and no honest way to turn arbitrary
 * code into a timeline. What a composition CAN do is declare its beats:
 *
 *     <Sequence from={0} durationInFrames={45}>...</Sequence>
 *     <Sequence from={45} durationInFrames={60}>...</Sequence>
 *
 * Those two numbers are the timing decisions people most want to change without
 * reading code, and they are the only part of a composition that can be edited
 * safely from a UI. So this reads them out, and writes them back.
 *
 * ── Why text spans and not an AST ─────────────────────────────────────────
 *
 * Parsing to an AST and printing it back reformats the whole file: quotes,
 * spacing, trailing commas, JSX line breaks. Someone who dragged one bar would
 * find every line of their composition rewritten, and a diff they cannot read.
 *
 * This records the exact character span of each number and replaces only those
 * characters. Everything else in the file is untouched, byte for byte.
 *
 * ── What is deliberately NOT handled ──────────────────────────────────────
 *
 * Only integer literals: `from={45}`. A computed value — `from={fps * 2}`,
 * `from={INTRO_END}` — is reported with `editable: false` so the UI can show the
 * beat but refuse to drag it. Rewriting an expression means deciding what the
 * author meant, and getting that wrong silently breaks their timing.
 */

/*
 * Matches one Sequence opening tag and captures its attribute text. Ends at the
 * first `>` that is not inside braces, so `durationInFrames={a > b ? 1 : 2}`
 * does not terminate the tag early.
 */
const SEQUENCE_TAG = /<Sequence(\s[^>]*?)?(\/?)>/g;

/** `from={45}` / `durationInFrames={45}` — integer literals only. */
const numericProp = (name) => new RegExp(`\\b${name}\\s*=\\s*\\{\\s*(-?\\d+)\\s*\\}`);
/** The same prop with any expression, so a computed one can be reported. */
const anyProp = (name) => new RegExp(`\\b${name}\\s*=\\s*\\{`);

/** A `name=` or `layout=` style label, or the first child component's name. */
const labelFrom = (attrs, source, tagEnd) => {
	const named = /\bname\s*=\s*["'{]([^"'}]+)["'}]?/.exec(attrs || '');
	if (named) return named[1].trim();
	// The first capitalised JSX tag inside is usually the thing being sequenced,
	// which reads better than "Sequence 2".
	const child = /<([A-Z][A-Za-z0-9]*)/.exec(source.slice(tagEnd, tagEnd + 400));
	return child ? child[1] : null;
};

/**
 * Every `<Sequence>` in the source, in document order.
 *
 * @param {string} tsx
 * @returns {Array<{
 *   index: number, from: number|null, durationInFrames: number|null,
 *   label: string|null, depth: number, editable: boolean,
 *   fromSpan: [number, number]|null, durationSpan: [number, number]|null
 * }>}
 */
export const parseSequences = (tsx) => {
	const source = String(tsx || '');
	const found = [];
	let depth = 0;
	let cursor = 0;
	let index = 0;

	SEQUENCE_TAG.lastIndex = 0;
	let match;
	while ((match = SEQUENCE_TAG.exec(source))) {
		// Close tags between the last match and this one reduce nesting depth.
		// Remotion nests sequences freely and a nested `from` is relative to its
		// parent, so the UI has to know which is which or the bars lie.
		const between = source.slice(cursor, match.index);
		depth -= (between.match(/<\/Sequence>/g) || []).length;
		if (depth < 0) depth = 0;
		cursor = match.index + match[0].length;

		const attrs = match[1] || '';
		const selfClosing = match[2] === '/';
		const tagStart = match.index;

		const fromMatch = numericProp('from').exec(attrs);
		const durationMatch = numericProp('durationInFrames').exec(attrs);

		// Offsets are relative to the attribute text; shift into the file.
		const attrsOffset = tagStart + match[0].indexOf(attrs);
		const spanOf = (m) =>
			m ? [attrsOffset + m.index + m[0].lastIndexOf(m[1]), attrsOffset + m.index + m[0].lastIndexOf(m[1]) + m[1].length] : null;

		const hasComputedFrom = !fromMatch && anyProp('from').test(attrs);
		const hasComputedDuration = !durationMatch && anyProp('durationInFrames').test(attrs);

		found.push({
			index: index++,
			// `from` defaults to 0 in Remotion when omitted.
			from: fromMatch ? Number(fromMatch[1]) : hasComputedFrom ? null : 0,
			durationInFrames: durationMatch ? Number(durationMatch[1]) : null,
			label: labelFrom(attrs, source, cursor),
			depth,
			// Draggable only when BOTH numbers are literals we can replace. A bar
			// that moves but cannot be written back is worse than one that does
			// not move.
			editable: !!fromMatch && !!durationMatch,
			computed: hasComputedFrom || hasComputedDuration,
			fromSpan: spanOf(fromMatch),
			durationSpan: spanOf(durationMatch)
		});

		if (!selfClosing) depth += 1;
	}

	return found;
};

/**
 * Rewrite one sequence's timing, touching only those digits.
 *
 * @param {string} tsx
 * @param {number} index - the sequence's position from parseSequences
 * @param {{from?: number, durationInFrames?: number}} timing
 * @returns {string} the new source, or the original when nothing can be written
 */
export const retimeSequence = (tsx, index, timing = {}) => {
	const source = String(tsx || '');
	const sequences = parseSequences(source);
	const target = sequences[index];
	if (!target || !target.editable) return source;

	const edits = [];
	if (Number.isFinite(timing.from) && target.fromSpan) {
		edits.push({ span: target.fromSpan, text: String(Math.max(0, Math.round(timing.from))) });
	}
	if (Number.isFinite(timing.durationInFrames) && target.durationSpan) {
		edits.push({
			span: target.durationSpan,
			// A zero-length sequence renders nothing and is indistinguishable from
			// a deleted one, which is not what dragging an edge should ever mean.
			text: String(Math.max(1, Math.round(timing.durationInFrames)))
		});
	}
	if (!edits.length) return source;

	// Right to left, so an earlier replacement cannot shift a later span. The
	// numbers change length (45 -> 120), which is exactly how this goes wrong.
	edits.sort((a, b) => b.span[0] - a.span[0]);
	let out = source;
	for (const edit of edits) {
		out = out.slice(0, edit.span[0]) + edit.text + out.slice(edit.span[1]);
	}
	return out;
};

/**
 * Sequences as timeline bars, in frames, with nesting resolved to absolute time.
 *
 * A nested sequence's `from` is relative to its parent, so a child at `from={0}`
 * inside a parent at `from={90}` starts at frame 90. Drawing it at 0 would put
 * the bar in the wrong place and make the timeline actively misleading.
 *
 * @param {Array} sequences - from parseSequences
 * @param {number} totalFrames - the composition's duration
 */
export const toTimelineBars = (sequences, totalFrames) => {
	const total = Math.max(1, Math.round(Number(totalFrames) || 1));
	const parentStack = [];
	const bars = [];

	for (const sequence of sequences) {
		parentStack.length = sequence.depth;
		const parentStart = parentStack.reduce((sum, start) => sum + start, 0);
		const start = parentStart + (sequence.from ?? 0);
		const length = sequence.durationInFrames ?? Math.max(1, total - start);

		parentStack[sequence.depth] = sequence.from ?? 0;

		bars.push({
			...sequence,
			start,
			length,
			// Clamped to the composition so a beat running past the end still draws
			// inside the track instead of overflowing it.
			left: Math.min(1, Math.max(0, start / total)),
			width: Math.min(1 - Math.min(1, start / total), Math.max(0, length / total))
		});
	}
	return bars;
};

/** Whether a composition has anything a timeline could show. */
export const hasSequences = (tsx) => parseSequences(tsx).length > 0;
