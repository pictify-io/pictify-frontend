/**
 * An .html file, read in the browser. TS-07 B (board TS-07 `LMJ-0`, frame B).
 *
 * The visitor on /tools/html-to-* usually HAS a file — an invoice their app
 * writes, a page they saved — and asking them to open it, select all and
 * paste is a step that loses people. So the code pane takes the file itself.
 *
 * NOTHING HERE TALKS TO A SERVER. The file is read with the File API and goes
 * into the same pane a paste does; the only request is the render, when they
 * press Download. That is the promise the drop target makes, and it is also
 * why the checks below run client-side: a 40 MB video dropped by mistake
 * should be refused before it is read, not after it is uploaded.
 *
 * Pure functions over plain `{ name, size, type }` objects wherever possible,
 * so they run under node:test without a DOM.
 */
// Relative, not `$lib`: the tests run under plain node:test, which has no alias.
import { inspectPastedHtml } from '../components/studio/v2/paste-report.js';

export const MAX_HTML_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 1024 * 1024;

const HTML_NAME = /\.html?$/i;

/** `14 KB`, `1.4 MB` — the size as the pane header shows it. */
export function formatBytes(bytes) {
	const n = Number(bytes) || 0;
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
	return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * `{ file }` when there is exactly one acceptable file, else `{ error, kind }`
 * with a one-line reason the pane can show as it is.
 *
 * The reason names the file and the rule it broke. "Invalid file" makes the
 * visitor guess which of four rules they hit; "logo.png isn't an HTML file"
 * tells them what to do next.
 */
export function checkHtmlFiles(files) {
	const list = [...(files || [])];
	if (!list.length) return { error: null, kind: 'none' };
	if (list.length > 1) {
		return { error: `One file at a time. You dropped ${list.length}.`, kind: 'multiple' };
	}
	const [file] = list;
	const name = String(file?.name || 'That file');
	if (/\.zip$/i.test(name)) {
		return {
			error: 'A .zip isn’t supported yet. Upload the .html file itself.',
			kind: 'zip'
		};
	}
	// The name decides, not the MIME type: browsers report .htm as `text/html`
	// on some systems and as nothing at all on others.
	if (!HTML_NAME.test(name)) {
		return { error: `${name} isn’t an HTML file. Upload an .html or .htm file.`, kind: 'type' };
	}
	if (!file.size) return { error: `${name} is empty.`, kind: 'empty' };
	if (file.size > MAX_HTML_BYTES) {
		// "Over", because a file a few bytes past the limit prints as 2.0 MB and
		// "2.0 MB. The limit is 2 MB." reads as a contradiction.
		return { error: `${name} is ${formatBytes(file.size)}, over the 2 MB limit.`, kind: 'size' };
	}
	return { file };
}

/** What the loaded card says: `Loaded · 214 lines · styles kept`. */
export function documentFacts(text) {
	const src = String(text || '');
	return {
		lineCount: src ? src.split('\n').length : 0,
		stylesKept: /<style\b|\sstyle\s*=/i.test(src)
	};
}

/** The relative paths the renderer will not resolve, each once, in document order. */
export function relativeAssetPaths(html) {
	const seen = new Set();
	for (const asset of inspectPastedHtml(html).assets) {
		if (asset.relative) seen.add(asset.url.trim());
	}
	return [...seen];
}

/**
 * `img/logo.png?v=3` → `logo.png`. The picker only ever gives us a bare file
 * name, so that is the one thing a path and a picked file can agree on.
 */
const baseName = (path) => {
	const clean = String(path || '').split(/[?#]/)[0];
	let decoded = clean;
	try {
		decoded = decodeURIComponent(clean);
	} catch {
		/* a stray % — compare it as written */
	}
	return decoded.split('/').pop().toLowerCase();
};

/**
 * Pair picked files with the paths that point at them, by file name.
 *
 * `{ matched: [{ path, file }], missing: [path] }`. Two paths naming the same
 * file both take it — `logo.png` in an `<img>` and again in a CSS `url()` is
 * one image, and asking for it twice would be absurd.
 */
export function matchImages(paths, files) {
	const byName = new Map();
	for (const file of files || []) byName.set(String(file?.name || '').toLowerCase(), file);
	const matched = [];
	const missing = [];
	for (const path of paths || []) {
		const file = byName.get(baseName(path));
		if (file) matched.push({ path, file });
		else missing.push(path);
	}
	return { matched, missing };
}

/**
 * Point each replaced path at its data URL, in `src` attributes and CSS
 * `url()`s — the two places `inspectPastedHtml` finds them.
 *
 * Whole values only: `logo.png` must not rewrite inside `old-logo.png`, and a
 * value the report never flagged is left exactly as the visitor wrote it.
 */
export function embedImages(html, replacements) {
	const map = replacements instanceof Map ? replacements : new Map(Object.entries(replacements || {}));
	if (!map.size) return String(html || '');
	return String(html || '')
		.replace(/(\bsrc\s*=\s*)("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (whole, lead, _v, dq, sq, bare) => {
			const next = map.get(String(dq ?? sq ?? bare ?? '').trim());
			return next ? `${lead}"${next}"` : whole;
		})
		.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (whole, _q, value) => {
			const next = map.get(String(value).trim());
			return next ? `url("${next}")` : whole;
		});
}

/**
 * The one line under the report after an image upload.
 *
 * Says what is STILL wrong rather than only what worked: "2 embedded" over a
 * render with a hole in it would read as success.
 */
export function describeEmbed({ embedded = 0, total = 0, missing = [], tooBig = [] }) {
	const parts = [`Embedded ${embedded} of ${total}`];
	if (tooBig.length) {
		parts.push(`${tooBig.slice(0, 2).join(', ')} over 1 MB, left as is`);
	}
	if (missing.length) {
		const names = missing.slice(0, 2).map(baseName).join(', ');
		parts.push(`still missing ${names}${missing.length > 2 ? ` and ${missing.length - 2} more` : ''}`);
	}
	return {
		tone: embedded === total && total > 0 ? 'proof' : embedded ? 'field' : 'alarm',
		text: parts.join(' · ')
	};
}

/**
 * Remove what the report promises is removed: `<script>` blocks, inline
 * `on*=` handlers and `javascript:` urls.
 *
 * Run on the way to the renderer, NOT on the pane. The pane keeps the
 * visitor's text as they wrote it, marked (locked decision 9: deleting what
 * someone just pasted is how an editor loses trust); the render is where a
 * script would actually execute, with our browser, so that is where it goes.
 *
 * A scanner, like the report, so what is stripped is exactly what was named.
 */
export function stripScripts(html) {
	return String(html || '')
		.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
		.replace(/<script\b[^>]*>/gi, '')
		.replace(/<[a-z][^>]*>/gi, (tag) =>
			tag
				.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
				.replace(/(\s(?:href|src|action|formaction)\s*=\s*)(["']?)\s*javascript:[^"'\s>]*\2/gi, '$1$2#$2')
		);
}

/** The browser half. Kept out of the pure functions above so tests need no FileReader. */
export const readAsDataUrl = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ''));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
