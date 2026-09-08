/**
 * Splitting a saved design into its shell and its body, and putting it back
 * together unchanged. PS-10.
 *
 * A platform template is usually a WHOLE DOCUMENT, and the parts outside
 * `<body>`'s contents are not decoration:
 *
 *   <html style="background-color:#1B0316">        the page colour
 *   <link href="fonts.googleapis.com/css2?…">      the typeface it is set in
 *   <body style="width:1080px;height:1080px;…">    the canvas size, and a
 *                                                  radial-gradient background
 *
 * The stage used to mount `<body>`'s inner html into a frame of its own and
 * throw the rest away, so a 1080×1080 design on a plum gradient in Bricolage
 * Grotesque arrived as unsized black-on-white Times. That is most of what
 * "this template is messed up" looks like.
 *
 * A SCANNER, NOT A PARSE, for the same reason as code-map.js: the body slice
 * this returns is the text the code pane edits and logic.js reads, so it has to
 * be literally the characters that were saved. `DOMParser` + `innerHTML` gives
 * back equivalent markup, not identical markup — `<img />` becomes `<img>`,
 * `class='x'` becomes `class="x"` — and every one of those differences would
 * show up as a spurious edit in the diff and move every offset in the map.
 *
 * The contract is therefore: `join(split(src), split(src).body) === src`, for
 * whole documents and bare fragments alike.
 */

/** Case-insensitive `<tag …>`; captures the attribute text. */
const openTag = (tag) => new RegExp(`<${tag}(\\s[^>]*)?>`, 'i');

/** Only these stylesheets may come from off-origin. See PREVIEW_CSP. */
const FONT_HOST = 'fonts.googleapis.com';

/**
 * `{ whole, prefix, htmlAttrs, head, bodyAttrs, body, suffix }`.
 *
 * `whole` is false for a bare fragment, and then everything but `body` is
 * empty — a fragment stays a fragment, because re-wrapping one in `<html>` on
 * save would change what the renderer receives.
 */
export function splitDocument(source) {
	const src = String(source ?? '');
	const bare = { whole: false, prefix: '', htmlAttrs: '', head: '', bodyAttrs: '', body: src, suffix: '' };

	const bodyOpen = openTag('body').exec(src);
	if (!bodyOpen) return bare;

	// `</body>` from the end: one inside a comment or a `<script>` string would
	// otherwise cut the document short.
	const closeAt = src.toLowerCase().lastIndexOf('</body');
	if (closeAt === -1 || closeAt < bodyOpen.index) return bare;
	const closeEnd = src.indexOf('>', closeAt);
	if (closeEnd === -1) return bare;

	const bodyStart = bodyOpen.index + bodyOpen[0].length;
	const htmlOpen = openTag('html').exec(src.slice(0, bodyOpen.index));

	// Everything before `<body>` is kept verbatim as `prefix` — doctype, the
	// `<html>` tag, the whole `<head>`. `htmlAttrs`/`head` are read out of it
	// for the preview to apply, but the prefix is what gets written back, so
	// nothing in the head is lost by not being understood here.
	return {
		whole: true,
		prefix: src.slice(0, bodyStart),
		htmlAttrs: htmlOpen ? (htmlOpen[1] || '').trim() : '',
		head: headOf(src.slice(0, bodyOpen.index)),
		bodyAttrs: (bodyOpen[1] || '').trim(),
		body: src.slice(bodyStart, closeAt),
		suffix: src.slice(closeAt)
	};
}

/** Reassemble. With an unchanged body this returns the original characters. */
export function joinDocument(shell, body) {
	const text = String(body ?? '');
	if (!shell?.whole) return text;
	return `${shell.prefix}${text}${shell.suffix}`;
}

function headOf(beforeBody) {
	const open = openTag('head').exec(beforeBody);
	if (!open) return '';
	const close = beforeBody.toLowerCase().indexOf('</head', open.index);
	return beforeBody.slice(open.index + open[0].length, close === -1 ? undefined : close);
}

/**
 * The `<link rel="stylesheet">` tags a preview is allowed to keep.
 *
 * Google Fonts only, and by host — not by "it is a stylesheet". An arbitrary
 * remote stylesheet is a request to a host the buyer did not choose, which is
 * the tracking channel PREVIEW_CSP exists to close; the fonts host is named in
 * that policy precisely so this one case can be allowed deliberately.
 */
export function fontLinks(head) {
	const out = [];
	const re = /<link\b[^>]*>/gi;
	let m;
	while ((m = re.exec(String(head ?? '')))) {
		const tag = m[0];
		if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) continue;
		const href = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
		const url = fontHref(href ? (href[2] ?? href[3] ?? href[4] ?? '') : '');
		if (!url) continue;
		// The PARSED url, not the source text. Checking one string and emitting a
		// different one is how an allowlist gets walked past: `//host/x` was
		// validated as https and would have been emitted scheme-relative, which
		// resolves against the parent page's scheme at fetch time.
		out.push(`<link rel="stylesheet" href="${escapeAttr(url)}">`);
	}
	return out;
}

/**
 * The absolute https url of a font stylesheet, or '' for anything else.
 *
 * Parsed, not string-matched. `https://evil.example/?x=fonts.googleapis.com`
 * contains the host name and is not it; `fonts.googleapis.com.evil.example`
 * starts with it and is not it. Returning the parsed url rather than a boolean
 * is deliberate — it makes the string that was checked and the string that is
 * emitted the same string.
 */
function fontHref(url) {
	const raw = String(url || '').trim();
	if (!raw) return '';
	try {
		const parsed = new URL(raw.startsWith('//') ? `https:${raw}` : raw, 'https://pictify.io');
		if (parsed.protocol !== 'https:') return '';
		if (parsed.hostname.toLowerCase() !== FONT_HOST) return '';
		return parsed.href;
	} catch {
		return '';
	}
}

const escapeAttr = (value) =>
	String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * `<style>` blocks from the source `<head>`.
 *
 * A design's CSS lives in one of two places and BOTH have to survive. Inline
 * `style=` attributes ride along on the elements; a `<style>` block in the head
 * does not, and dropping it strips the design to unstyled markup — measured on
 * the OG-image templates, which put all of their CSS there and came back as
 * black text on white with the layout gone.
 *
 * Returned as raw text and written into the preview head, where the CSP's
 * `style-src 'unsafe-inline'` already permits it. It is the same CSS the
 * renderer will apply, so the canvas and the file agree.
 */
export function styleBlocks(head) {
	const out = [];
	const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
	let m;
	while ((m = re.exec(String(head ?? '')))) out.push(m[1]);
	return out;
}

/**
 * Attributes to copy onto the preview frame's own `<html>` and `<body>`.
 *
 * `style` and `class` only. Everything else on those tags is either the
 * renderer's business (`lang`, `dir` — harmless but not visual) or a handle for
 * something that must not exist in a preview (`onload`, `id` targets), and a
 * shell is exactly the place where a forgotten attribute would slip past the
 * body sanitizer without ever being sanitized.
 */
export function shellAttributes(attrText) {
	const out = {};
	const re = /([A-Za-z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
	let m;
	while ((m = re.exec(String(attrText ?? '')))) {
		const name = m[1].toLowerCase();
		if (name !== 'style' && name !== 'class') continue;
		out[name] = m[3] ?? m[4] ?? m[5] ?? '';
	}
	return out;
}
