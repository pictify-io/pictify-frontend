/**
 * The bridge between a text buffer and a document. PS-3.
 *
 * Code mode shows the same design twice — as characters on the left and as a
 * live canvas on the right — and a selection has to mean the same thing in
 * both. That needs an answer to two questions:
 *
 *   `nodeForOffset(html, offset)`  the caret is at character n; which element
 *                                  is it inside?
 *   `rangeForNode(html, id)`       this element is selected; which characters
 *                                  and which line is it?
 *
 * DELIBERATELY A SCANNER, NOT A DOM PARSE. The answers must be positions IN
 * THE USER'S TEXT, and a DOM round-trip does not preserve them — parsing and
 * re-serialising rewrites `<br/>` to `<br>`, `class='x'` to `class="x"`,
 * uppercase tags to lowercase and `disabled` to `disabled=""`. Every one of
 * those shifts offsets, so a map built from re-serialised markup would point
 * at the wrong characters of the buffer the user is actually editing.
 *
 * It follows that this file must never be the thing that decides what is
 * valid: it is a locator, and the DOM remains the authority on structure.
 */

/** Elements with no closing tag. Their range is the tag itself. */
const VOID = new Set([
	'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
	'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

/** Content is opaque markup, not children — never scanned for tags. */
const RAW_TEXT = new Set(['script', 'style']);

const ID_ATTR = /data-pictify-id\s*=\s*("([^"]*)"|'([^']*)')/i;

/**
 * Every addressable element's character range, outermost first.
 *
 * `[{ id, tag, start, end, line }]` where `start` is the `<` of the opening
 * tag and `end` is one past the `>` of its closing tag (or of the tag itself
 * when void). `line` is 1-based, for the code pane's band.
 *
 * Unclosed tags are tolerated rather than rejected: a buffer is unbalanced for
 * most of the time someone is typing into it, and a map that vanished on every
 * keystroke would take the selection with it. An element left open at the end
 * of input simply runs to the end of input.
 */
export function buildRanges(html) {
	const src = String(html || '');
	const ranges = [];
	const stack = [];
	// Line numbers are computed by counting newlines up to each start, which is
	// O(n²) if done per element — so the offsets of every newline are collected
	// once and binary-searched instead.
	const newlines = [];
	for (let i = 0; i < src.length; i++) if (src[i] === '\n') newlines.push(i);
	const lineAt = (offset) => {
		let lo = 0;
		let hi = newlines.length;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (newlines[mid] < offset) lo = mid + 1;
			else hi = mid;
		}
		return lo + 1;
	};

	let i = 0;
	while (i < src.length) {
		const lt = src.indexOf('<', i);
		if (lt === -1) break;

		// Comments and doctype carry no elements; skip wholesale so a `<` inside
		// one cannot be read as a tag.
		if (src.startsWith('<!--', lt)) {
			const close = src.indexOf('-->', lt);
			i = close === -1 ? src.length : close + 3;
			continue;
		}
		if (src.startsWith('<!', lt)) {
			const close = src.indexOf('>', lt);
			i = close === -1 ? src.length : close + 1;
			continue;
		}

		const isClose = src[lt + 1] === '/';
		const nameMatch = /^[a-zA-Z][^\s/>]*/.exec(src.slice(lt + (isClose ? 2 : 1)));
		if (!nameMatch) {
			i = lt + 1;
			continue;
		}
		const tag = nameMatch[0].toLowerCase();

		// The end of this tag, skipping `>` that sit inside quoted attributes.
		let gt = -1;
		let quote = null;
		for (let k = lt + 1; k < src.length; k++) {
			const ch = src[k];
			if (quote) {
				if (ch === quote) quote = null;
			} else if (ch === '"' || ch === "'") {
				quote = ch;
			} else if (ch === '>') {
				gt = k;
				break;
			}
		}
		if (gt === -1) break;

		if (isClose) {
			// Close the nearest matching open element. A mismatched close is
			// ignored rather than unwinding the stack: malformed markup mid-edit
			// should cost one element's range, not all of them.
			for (let s = stack.length - 1; s >= 0; s--) {
				if (stack[s].tag !== tag) continue;
				// An untagged element holds a frame with no entry — it exists only
				// so its closing tag cannot be matched against an ancestor.
				if (stack[s].entry) stack[s].entry.end = gt + 1;
				stack.splice(s, 1);
				break;
			}
			i = gt + 1;
			continue;
		}

		const tagText = src.slice(lt, gt + 1);
		const selfClosing = tagText.endsWith('/>') || VOID.has(tag);
		const idMatch = ID_ATTR.exec(tagText);
		const id = idMatch ? (idMatch[2] ?? idMatch[3]) : null;

		if (id) {
			const entry = { id, tag, start: lt, end: gt + 1, line: lineAt(lt) };
			ranges.push(entry);
			if (!selfClosing) stack.push({ tag, entry });
		} else if (!selfClosing) {
			// Untagged elements still need a stack frame, or their closing tag
			// would be matched against an ancestor and end it early.
			stack.push({ tag, entry: null });
		}

		if (RAW_TEXT.has(tag) && !selfClosing) {
			const close = src.toLowerCase().indexOf(`</${tag}`, gt);
			if (close === -1) break;
			// Pop the frame we just pushed; its content is not scanned.
			const frame = stack.pop();
			if (frame?.entry) frame.entry.end = src.indexOf('>', close) + 1;
			i = close;
			continue;
		}

		i = gt + 1;
	}

	// Anything still open ran to the end of the buffer.
	for (const frame of stack) if (frame.entry) frame.entry.end = src.length;
	return ranges;
}

/**
 * The innermost element containing `offset`.
 *
 * INNERMOST, because that is what a person means by "where I am": a caret
 * inside an `<h1>` that sits inside a `<div>` is in the heading, and selecting
 * the div would be selecting the thing they did not click.
 */
export function nodeForOffset(html, offset) {
	const pos = Number(offset);
	if (!Number.isFinite(pos)) return null;
	let best = null;
	for (const r of buildRanges(html)) {
		if (pos < r.start || pos >= r.end) continue;
		// Later entries are more deeply nested (the scan is document order), and
		// a shorter span breaks ties for siblings that share a boundary.
		if (!best || r.start >= best.start) best = r;
	}
	return best ? best.id : null;
}

/** The character range and line of one element, or null when it is not there. */
export function rangeForNode(html, id) {
	if (!id) return null;
	return buildRanges(html).find((r) => r.id === id) || null;
}

/** 1-based line containing `offset`. */
export function lineForOffset(html, offset) {
	const src = String(html || '');
	const pos = Math.max(0, Math.min(Number(offset) || 0, src.length));
	let line = 1;
	for (let i = 0; i < pos; i++) if (src[i] === '\n') line++;
	return line;
}

/** Character offset of the start of a 1-based line. */
export function offsetForLine(html, line) {
	const src = String(html || '');
	if (!line || line <= 1) return 0;
	let seen = 0;
	for (let i = 0; i < src.length; i++) {
		if (src[i] !== '\n') continue;
		if (++seen === line - 1) return i + 1;
	}
	return src.length;
}
