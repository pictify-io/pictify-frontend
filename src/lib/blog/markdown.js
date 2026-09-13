/**
 * Blog markdown helpers: heading slugs, the table of contents, and the two
 * pieces of structure we read out of the body when the CMS has not been given
 * them as fields.
 *
 * ── One slugger, used twice ───────────────────────────────────────────────
 *
 * The TOC is built from the SOURCE and the ids are stamped on by the Heading
 * renderer at render time. Those are two different passes over the same
 * document, so they have to agree exactly or every anchor scrolls nowhere.
 *
 * They agree because both call `headingSlugger()` here — the renderer through
 * a Svelte context, the rail directly. svelte-markdown ships its own slugger
 * for this, but its context key is not an exported subpath, and reaching into
 * `svelte-markdown/src/context` would make anchor correctness depend on a
 * package internal. Owning the function is the cheaper guarantee.
 *
 * `slugify` is a port of marked's `Slugger.serialize` so ids stay stable
 * against what the default renderer produced before this existed. Old links
 * into headings keep working.
 */

/** Port of marked's Slugger.serialize. */
export function slugify(value) {
	return String(value ?? '')
		.toLowerCase()
		.trim()
		.replace(/<[!/a-z].*?>/gi, '')
		.replace(/[ -⁯⸀-⹿\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
		.replace(/\s/g, '-');
}

/**
 * Strip the markdown a heading's text may carry, so "## Use **bold** here"
 * reads as "Use bold here" in the rail rather than with its asterisks.
 */
function plainText(value) {
	return String(value ?? '')
		.replace(/`([^`]*)`/g, '$1')
		.replace(/\*\*([^*]*)\*\*/g, '$1')
		.replace(/\*([^*]*)\*/g, '$1')
		.replace(/_([^_]*)_/g, '$1')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.trim();
}

/** Fenced code can contain lines that look like headings. Blank them out. */
function withoutFences(markdown) {
	return String(markdown ?? '').replace(/```[\s\S]*?(?:```|$)/g, (block) =>
		block.replace(/[^\n]/g, ' ')
	);
}

/**
 * A stateful slugger: marked's getNextSafeSlug, so a document with two
 * "## Pricing" headings yields `pricing` then `pricing-1`.
 *
 * Stateful on purpose. Both consumers must feed it EVERY heading in document
 * order, at every depth, or their counters diverge — an H3 that collides with
 * an H2 shifts the suffix for everything after it.
 */
export function headingSlugger() {
	const seen = Object.create(null);
	return (raw) => {
		const base = slugify(raw);
		let id = base;
		if (Object.prototype.hasOwnProperty.call(seen, base)) {
			let n = seen[base];
			do {
				n++;
				id = `${base}-${n}`;
			} while (Object.prototype.hasOwnProperty.call(seen, id));
			seen[base] = n;
		} else {
			seen[base] = 0;
		}
		seen[id] = 0;
		return id;
	};
}

/**
 * H2s only, in document order, with the ids the rendered headings will carry.
 *
 * H3s are excluded from the OUTPUT but not from the slugger: the counter has
 * to see every heading the renderer will see. A rail that also listed the H3s
 * would be a second article down the side of the first — the longest post runs
 * 14 H2s as it is.
 *
 * @returns {Array<{ id: string, text: string }>}
 */
export function tableOfContents(markdown) {
	const nextId = headingSlugger();
	const out = [];
	const source = withoutFences(markdown);
	const re = /^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm;
	let match;
	while ((match = re.exec(source)) !== null) {
		const id = nextId(match[2]);
		if (match[1].length !== 2) continue;
		const text = plainText(match[2]);
		if (text) out.push({ id, text });
	}
	return out;
}

/**
 * The TL;DR, when the post carries one as a markdown convention rather than as
 * a CMS field.
 *
 * The convention in the existing posts is a leading blockquote whose first
 * line is bold "TL;DR". Only a LEADING one counts: a "> **TL;DR**" halfway
 * down is the author quoting something, not summarising the piece.
 *
 * @returns {{ claim: string, points: string[], rest: string } | null}
 *   `rest` is the body with the block removed, so it is not rendered twice.
 */
export function extractTldr(markdown) {
	const source = String(markdown ?? '');
	const match = source.match(/^\s*((?:>[^\n]*\n?)+)/);
	if (!match) return null;
	const block = match[1];
	const inner = block
		.split('\n')
		.map((line) => line.replace(/^>\s?/, ''))
		.join('\n')
		.trim();
	if (!/^\*\*\s*TL;?DR\s*:?\s*\*\*/i.test(inner) && !/^TL;?DR\s*[:—-]/i.test(inner)) return null;

	const body = inner.replace(/^\*\*\s*TL;?DR\s*:?\s*\*\*\s*:?\s*/i, '').replace(/^TL;?DR\s*[:—-]\s*/i, '');
	const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
	const points = [];
	const claimParts = [];
	for (const line of lines) {
		if (/^[-*+]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
			points.push(plainText(line.replace(/^[-*+]\s+/, '').replace(/^\d+[.)]\s+/, '')));
		} else if (!points.length) {
			claimParts.push(plainText(line));
		}
	}
	const claim = claimParts.join(' ').trim();
	if (!claim && !points.length) return null;
	return { claim, points, rest: source.slice(match[0].length) };
}

/**
 * The page renders its own <h1> from the title, so a body that opens with
 * "# Title" would produce a second one — an ambiguous topic signal.
 */
export function stripLeadingH1(markdown) {
	if (!markdown) return markdown;
	return markdown.replace(/^\s*#\s+.+\n+/, '');
}

/**
 * A date that may be missing, as a display string and nothing else.
 *
 * One post in the CMS has a null publishedAt, which `new Date(null)` turns
 * into 1970 and `new Date(undefined)` turns into "Invalid Date" — both of
 * which the page happily printed. Absent is absent: callers hide the field.
 */
export function formatDate(value, { month = 'short' } = {}) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString('en-GB', { day: 'numeric', month, year: 'numeric' });
}

/**
 * The UPDATED chip's date: "AUG 9" this year, "AUG 9, 2024" otherwise.
 *
 * The year is dropped only when it cannot mislead. Every post in the CMS today
 * carries a 2026 `_updatedAt` because they were migrated together, but the
 * moment one of them stops being touched, "UPD AUG 9" on a two-year-old page
 * would claim freshness it does not have — which is the one thing this chip
 * exists to tell the truth about.
 */
export function formatUpdated(value, now = new Date()) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
	const day = date.getDate();
	return date.getFullYear() === now.getFullYear()
		? `${month} ${day}`
		: `${month} ${day}, ${date.getFullYear()}`;
}

/** ~200 wpm, matching the CMS client's estimate so the two never disagree. */
export function readingMinutes(post) {
	if (post?.readingTime) return post.readingTime;
	const words = String(post?.content ?? '').trim().split(/\s+/).filter(Boolean).length;
	return words ? Math.max(1, Math.round(words / 200)) : null;
}
