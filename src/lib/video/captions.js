/**
 * Turning a transcript into Caption clips.
 *
 * The backend returns a flat list of words with microsecond timings. A caption
 * is a GROUP of those words shown together while one of them is highlighted, so
 * the work here is deciding where one caption ends and the next begins, then
 * shaping the result into the `ICaptionClip` the engine renders.
 *
 * ── Why grouping is not just "every N words" ──────────────────────────────
 *
 * Splitting purely on a word count cuts sentences in half and leaves a caption
 * hanging on screen through a long silence. Three things end a caption, and the
 * first one to happen wins:
 *
 *   a sentence ended     the text ends in . ! or ?
 *   it got too long      MAX_WORDS, or MAX_DURATION_US on screen
 *   the speaker stopped  a gap of MAX_GAP_US since the previous word
 *
 * The silence rule is the one that is easy to leave out and most obvious when
 * missing: without it a caption from before a ten second pause sits frozen on
 * screen until the speaker starts again.
 *
 * ── Word timings are RELATIVE to the clip ─────────────────────────────────
 *
 * `caption.words[].from/to` are offsets from the clip's own start, not absolute
 * timeline positions. The engine reads them against the clip duration (its
 * fallback is the literal `5e6`, five seconds in microseconds). Storing them
 * absolutely would work until someone dragged the caption along the timeline,
 * at which point every highlight would be out of step with the audio by exactly
 * how far they moved it — and dragging clips is the main thing people do.
 */

const SECOND = 1_000_000;

/** Longest a single caption stays on screen. */
export const MAX_DURATION_US = 5 * SECOND;
/** Most words in one caption. Beyond about this it stops being readable. */
export const MAX_WORDS = 7;
/** A silence longer than this ends the caption rather than stretching it. */
export const MAX_GAP_US = 700_000;

/** Sentence-ending punctuation, which is why the transcript is punctuated. */
const ENDS_SENTENCE = /[.!?]["')\]]?$/;

/**
 * Default caption look. White with a black outline is the one combination that
 * stays legible over unknown footage, which is the whole problem with captions
 * over video.
 */
export const DEFAULT_CAPTION_STYLE = {
	fontFamily: 'Inter-Bold',
	fontSize: 64,
	color: '#ffffff',
	align: 'center',
	lineHeight: 1.25,
	stroke: { color: '#000000', width: 8 }
};

/** Highlight colours: the spoken word pops, upcoming words recede. */
export const DEFAULT_CAPTION_COLORS = {
	active: { color: '#ffc480' },
	future: { color: '#cbd5e1' }
};

/**
 * Split a flat word list into caption-sized groups.
 *
 * @param {Array<{text: string, from: number, to: number}>} words
 * @param {{maxWords?: number, maxDurationUs?: number, maxGapUs?: number}} [options]
 * @returns {Array<Array>} groups, in order, never containing an empty group
 */
export const groupWords = (words, options = {}) => {
	const maxWords = Math.max(1, options.maxWords ?? MAX_WORDS);
	const maxDuration = Math.max(1, options.maxDurationUs ?? MAX_DURATION_US);
	const maxGap = Math.max(0, options.maxGapUs ?? MAX_GAP_US);

	const groups = [];
	let current = [];

	for (const word of words || []) {
		if (!word || typeof word.text !== 'string' || !word.text.trim()) continue;

		if (current.length) {
			const start = current[0].from;
			const previous = current[current.length - 1];
			const tooLong = word.to - start > maxDuration;
			const tooMany = current.length >= maxWords;
			const silence = word.from - previous.to > maxGap;
			const sentenceEnded = ENDS_SENTENCE.test(previous.text);

			if (tooLong || tooMany || silence || sentenceEnded) {
				groups.push(current);
				current = [];
			}
		}
		current.push(word);
	}

	if (current.length) groups.push(current);
	return groups;
};

/**
 * One caption clip from one group of words.
 *
 * @param {Array} group - words, absolute microseconds, from groupWords
 * @param {object} options
 * @returns {object} a clip payload for core.clip.add
 */
export const captionClipFromGroup = (group, options = {}) => {
	const composition = options.composition || { width: 1080, height: 1920 };
	const from = group[0].from;
	const to = group[group.length - 1].to;
	const duration = Math.max(1, to - from);

	// A band across the lower third, which is where captions are read. Sized off
	// the composition so it lands correctly on portrait and landscape alike.
	const width = Math.round(composition.width * 0.86);
	const height = Math.round(composition.height * 0.18);

	return {
		type: 'Caption',
		name: 'Caption',
		text: group.map((word) => word.text).join(' '),
		mediaId: options.mediaId || '',
		wordsPerLine: options.wordsPerLine || 'multiple',
		timing: {
			display: { from, to },
			trim: { from: 0, to: duration },
			duration,
			playbackRate: 1
		},
		transform: {
			x: Math.round((composition.width - width) / 2),
			y: Math.round(composition.height * (options.bottomFraction ?? 0.72)),
			width,
			height,
			angle: 0,
			opacity: 1,
			// Above the footage it sits on; captions under a video are just absent.
			zIndex: options.zIndex ?? 50
		},
		caption: {
			// Rebased to the clip — see the note at the top of this file.
			words: group.map((word) => ({
				text: word.text,
				from: word.from - from,
				to: word.to - from
			})),
			colors: options.colors || DEFAULT_CAPTION_COLORS,
			positioning: {
				videoWidth: composition.width,
				videoHeight: composition.height
			}
		},
		style: { ...DEFAULT_CAPTION_STYLE, ...(options.style || {}) },
		metadata: {},
		locked: false
	};
};

/**
 * Every caption clip for a transcript.
 *
 * @param {Array} words - from the transcribe endpoint, absolute microseconds
 * @param {object} [options] - composition, style, colors, offsetUs, mediaId
 * @returns {Array<object>} clip payloads, in timeline order
 */
export const buildCaptionClips = (words, options = {}) => {
	const offset = Number(options.offsetUs) || 0;
	// The transcript is relative to the START OF THE MEDIA. If the clip it came
	// from does not begin at zero on the timeline, every caption has to shift by
	// the same amount or they all land early.
	const shifted = offset
		? (words || []).map((word) => ({ ...word, from: word.from + offset, to: word.to + offset }))
		: words || [];

	return groupWords(shifted, options).map((group) => captionClipFromGroup(group, options));
};

/** Plain text of a transcript, for showing what was heard before committing. */
export const transcriptPreview = (words, limit = 240) => {
	const text = (words || [])
		.map((word) => word?.text || '')
		.filter(Boolean)
		.join(' ');
	return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
};
