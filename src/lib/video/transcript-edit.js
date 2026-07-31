/**
 * Editing video by editing its transcript.
 *
 * Delete a sentence in the words and the matching stretch of video goes with
 * it. This is the one thing in the editor that removes the timeline as the
 * primary surface, and for talking-head footage — which is most of what gets
 * captioned — it is far faster than finding the same moment by scrubbing.
 *
 * Deepgram already gives word-level timings in microseconds (see
 * service/transcribe.js), and captions already map words to clip ranges, so the
 * new work is the cutting.
 *
 * ── Two clocks, and the conversion between them ───────────────────────────
 *
 * A clip plays `source[trim.from .. trim.to]` during
 * `timeline[display.from .. display.to]`. Word timings are in SOURCE time,
 * because the transcription service was handed the media file, not the
 * timeline. So every cut has to be expressed in source time and only converted
 * to timeline time when the pieces are laid back down:
 *
 *   timelineSpan = sourceSpan / playbackRate
 *
 * Mixing the two produces cuts that land near the right place, which is worse
 * than landing nowhere: it looks like an off-by-a-bit bug rather than a wrong
 * model, and people spend a long time nudging it.
 *
 * ── This is destructive ───────────────────────────────────────────────────
 *
 * Cutting rewrites the user's video. Every function here is pure and returns a
 * new document, so the caller keeps the previous one for undo, and the
 * behaviour is pinned hard in tests. A cut that silently removes the wrong two
 * seconds is not recoverable by eye.
 */

/** Merge overlapping or touching ranges, sorted. */
export const mergeRanges = (ranges) => {
	const usable = (ranges || [])
		.filter((r) => r && Number.isFinite(r.from) && Number.isFinite(r.to) && r.to > r.from)
		.sort((a, b) => a.from - b.from);
	if (!usable.length) return [];

	const out = [{ ...usable[0] }];
	for (const range of usable.slice(1)) {
		const last = out[out.length - 1];
		// Touching counts as overlapping: two adjacent deleted words are one cut,
		// and leaving them separate would split the clip for no reason.
		if (range.from <= last.to) last.to = Math.max(last.to, range.to);
		else out.push({ ...range });
	}
	return out;
};

/**
 * The source-time ranges covered by a set of word indices.
 *
 * @param {Array<{from: number, to: number}>} words - source time, microseconds
 * @param {Iterable<number>} indices - which words are being removed
 */
export const rangesForWords = (words, indices) => {
	const list = words || [];
	const wanted = new Set(indices || []);
	const ranges = [];
	for (let i = 0; i < list.length; i += 1) {
		if (!wanted.has(i)) continue;
		const word = list[i];
		if (!word || !Number.isFinite(word.from) || !Number.isFinite(word.to)) continue;
		ranges.push({ from: word.from, to: word.to });
	}
	return mergeRanges(ranges);
};

/**
 * What is LEFT of a clip's source window after removing some ranges.
 *
 * @returns {Array<{from: number, to: number}>} kept source spans, in order
 */
export const keptSpans = (trim, ranges) => {
	const from = Number(trim?.from) || 0;
	const to = Number(trim?.to);
	if (!Number.isFinite(to) || to <= from) return [];

	const cuts = mergeRanges(ranges).filter((r) => r.to > from && r.from < to);
	const kept = [];
	let cursor = from;

	for (const cut of cuts) {
		const start = Math.max(from, cut.from);
		const end = Math.min(to, cut.to);
		if (start > cursor) kept.push({ from: cursor, to: start });
		cursor = Math.max(cursor, end);
	}
	if (cursor < to) kept.push({ from: cursor, to });

	return kept;
};

/**
 * The clips a cut clip becomes, laid down contiguously from where it started.
 *
 * One piece per surviving span. An empty result means the whole clip was cut
 * and it should be removed.
 *
 * @param {object} clip
 * @param {Array<{from: number, to: number}>} ranges - source time
 * @returns {Array<object>} new clip payloads (no ids — the caller mints those)
 */
export const cutClip = (clip, ranges) => {
	const timing = clip?.timing || {};
	const trim = timing.trim || {};
	const display = timing.display || {};
	const rate = Number(timing.playbackRate) > 0 ? Number(timing.playbackRate) : 1;

	const spans = keptSpans(trim, ranges);
	if (!spans.length) return [];

	let cursor = Number(display.from) || 0;
	return spans.map((span) => {
		const sourceSpan = span.to - span.from;
		// Source time to timeline time. A clip at 2x occupies half the timeline
		// for the same amount of source.
		const timelineSpan = Math.max(1, Math.round(sourceSpan / rate));
		const piece = {
			...clip,
			timing: {
				...timing,
				trim: { from: span.from, to: span.to },
				display: { from: cursor, to: cursor + timelineSpan },
				duration: timelineSpan
			}
		};
		cursor += timelineSpan;
		return piece;
	});
};

/**
 * How much timeline time a cut removes from a clip.
 *
 * Used for the ripple: everything after the edited clip moves left by this
 * much, so the rest of the scene stays in sync rather than leaving a hole.
 */
export const removedTimelineSpan = (clip, ranges) => {
	const timing = clip?.timing || {};
	const display = timing.display || {};
	const before = (Number(display.to) || 0) - (Number(display.from) || 0);
	const after = cutClip(clip, ranges).reduce(
		(total, piece) => total + (piece.timing.display.to - piece.timing.display.from),
		0
	);
	return Math.max(0, before - after);
};

/**
 * Apply transcript cuts to a document.
 *
 * The edited clip becomes zero or more pieces, and every clip that STARTS at or
 * after the original clip's end shifts left by the removed span. That is what
 * ripple means, and it is what keeps captions and overlays lined up with the
 * speech they belong to — the whole point of cutting by transcript.
 *
 * Clips that merely overlap the edited one are left alone: shifting a lower
 * third that spans the cut would move it away from the moment it labels, and
 * there is no correct answer for a clip that straddles a hole.
 *
 * @param {object} projectJson
 * @param {string} clipId
 * @param {Array<{from: number, to: number}>} ranges - source time, microseconds
 * @param {() => string} makeId - mints ids for the new pieces
 * @returns {{clips: object, removedUs: number, pieces: number}} a plan the
 *   caller applies through the engine, plus what it did
 */
export const planCuts = (projectJson, clipId, ranges, makeId) => {
	const clips = projectJson?.clips || {};
	const target = clips[clipId];
	if (!target) return { clips: {}, removedUs: 0, pieces: 0, removeIds: [] };

	const pieces = cutClip(target, ranges);
	const removedUs = removedTimelineSpan(target, ranges);
	const originalEnd = Number(target.timing?.display?.to) || 0;

	const next = {};
	const removeIds = [];

	// The pieces. The first reuses the original id so bindings, metadata and
	// selection survive the common case of trimming one end.
	pieces.forEach((piece, index) => {
		const id = index === 0 ? clipId : makeId();
		next[id] = { ...piece, id };
	});
	if (!pieces.length) removeIds.push(clipId);

	// The ripple.
	if (removedUs > 0) {
		for (const [id, clip] of Object.entries(clips)) {
			if (id === clipId) continue;
			const display = clip?.timing?.display;
			const from = Number(display?.from);
			if (!Number.isFinite(from) || from < originalEnd) continue;
			next[id] = {
				...clip,
				timing: {
					...clip.timing,
					display: { from: from - removedUs, to: (Number(display.to) || 0) - removedUs }
				}
			};
		}
	}

	return { clips: next, removedUs, pieces: pieces.length, removeIds };
};

/**
 * Words grouped into sentences, for a transcript that can be read.
 *
 * A flat run of 600 words is not something anyone will edit. Sentences are the
 * unit people actually want to delete, and the punctuation is already there
 * because the transcript is requested punctuated.
 *
 * @returns {Array<{text: string, indices: number[], from: number, to: number}>}
 */
export const groupSentences = (words) => {
	const list = words || [];
	const out = [];
	let current = null;

	for (let i = 0; i < list.length; i += 1) {
		const word = list[i];
		if (!word?.text) continue;
		if (!current) current = { text: '', indices: [], from: word.from, to: word.to };

		current.text += (current.text ? ' ' : '') + word.text;
		current.indices.push(i);
		current.to = word.to;

		if (/[.!?]["')\]]?$/.test(word.text)) {
			out.push(current);
			current = null;
		}
	}
	if (current) out.push(current);
	return out;
};
