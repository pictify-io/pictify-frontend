/**
 * What will happen to pasted HTML before anything is drawn. PS-6 (board
 * PS-04 `K7R-0`, note `KD5-0`).
 *
 * Someone pasting a working page from their own site is the most common way a
 * template starts, and the things that will NOT survive the trip are invisible
 * in a browser that already has them cached and same-origin. So the report is
 * shown BEFORE the paste is accepted, not discovered later as a render that
 * looks wrong for no stated reason.
 *
 * Three findings, in the order they cost the buyer something:
 *
 *   ASSETS  images and fonts loaded from a host the renderer will not fetch.
 *           They are the visible failure — a logo that silently disappears —
 *           and the fix is to re-host them, which is what S3 is for.
 *   SCRIPT  <script>, event handlers and javascript: urls. Stripped on save,
 *           always, and said so plainly: a template is rendered on a server
 *           and a script that ran there would run with our privileges.
 *   STYLE   remote stylesheets other than Google Fonts. They load in a browser
 *           and are blocked in the preview, so a design that depends on one
 *           will look right where it was copied from and wrong here.
 *
 * A SCANNER, not a DOM parse, for the same reason as code-map.js: this reports
 * on the buyer's own text, and a parse-and-reserialise would report offsets and
 * markup that are not the ones they pasted.
 */

/** Hosts the renderer and the preview will actually load. See PREVIEW_CSP. */
const ASSET_HOSTS = ['htgf.s3.amazonaws.com', 'media.pictify.io'];
const FONT_CSS_HOST = 'fonts.googleapis.com';

/**
 * `null` when nothing is fetched, `{ host }` for an absolute url, and
 * `{ relative: true }` for a path.
 *
 * A RELATIVE PATH IS A FINDING, not a pass. `/logo.png` works on the site it
 * was copied from and resolves against nothing here — the renderer is handed a
 * bare document with no base url, so the image is simply absent. Resolving it
 * against our own origin to decide would report the host as pictify.io, which
 * is both wrong and unhelpful.
 */
const originOf = (url) => {
	const raw = String(url || '').trim();
	if (!raw) return null;
	// A data: or blob: url carries its own bytes — nothing is fetched.
	if (/^(data:|blob:|#)/i.test(raw)) return null;
	if (!/^[a-z][a-z0-9+.-]*:/i.test(raw) && !raw.startsWith('//')) return { relative: true };
	try {
		return { host: new URL(raw.startsWith('//') ? `https:${raw}` : raw).hostname.toLowerCase() };
	} catch {
		return null;
	}
};

const attr = (tag, name) => {
	const m = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
	return m ? (m[2] ?? m[3] ?? m[4] ?? '') : '';
};

const tagsNamed = (html, name) =>
	String(html || '').match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];

/**
 * `{ ok, assets, scripts, styles, counts }`.
 *
 * `ok` means nothing will change on the way in — NOT that the design is good.
 * It is the difference between "paste this and it is what you pasted" and
 * "paste this and some of it goes away".
 */
export function inspectPastedHtml(html) {
	const src = String(html || '');

	// Assets: <img src>, and url(...) inside inline styles or <style> blocks.
	const assets = [];
	const seen = new Set();
	const addAsset = (url, kind) => {
		const origin = originOf(url);
		if (!origin) return;
		if (origin.host && ASSET_HOSTS.includes(origin.host)) return;
		// Google Fonts CSS is reported as a stylesheet, not an asset.
		if (origin.host === FONT_CSS_HOST) return;
		const key = `${kind}:${url}`;
		if (seen.has(key)) return;
		seen.add(key);
		assets.push({ url, kind, host: origin.host || null, relative: Boolean(origin.relative) });
	};

	for (const tag of tagsNamed(src, 'img')) addAsset(attr(tag, 'src'), 'image');
	for (const m of src.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) addAsset(m[1], 'css');

	// Scripts: the tag, inline handlers, and javascript: urls. All three are
	// removed on save, so all three are named.
	const scripts = [];
	if (/<script\b/i.test(src)) scripts.push('<script> blocks');
	const handlers = [...src.matchAll(/\son([a-z]+)\s*=/gi)].map((m) => `on${m[1].toLowerCase()}`);
	const uniqueHandlers = [...new Set(handlers)];
	if (uniqueHandlers.length) scripts.push(`inline handlers (${uniqueHandlers.slice(0, 4).join(', ')})`);
	if (/javascript:/i.test(src)) scripts.push('javascript: links');

	// Stylesheets from elsewhere. Google Fonts is the one allowed exception.
	const styles = [];
	for (const tag of tagsNamed(src, 'link')) {
		if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) continue;
		const href = attr(tag, 'href');
		const origin = originOf(href);
		if (!origin || origin.relative || origin.host === FONT_CSS_HOST) continue;
		styles.push({ href, host: origin.host });
	}
	if (/@import\b/i.test(src)) styles.push({ href: '@import in a <style> block', host: null });

	return {
		ok: assets.length === 0 && scripts.length === 0 && styles.length === 0,
		assets,
		scripts,
		styles,
		counts: { assets: assets.length, scripts: scripts.length, styles: styles.length }
	};
}

/** One line per finding, in the order they cost something. */
export function reportLines(report) {
	if (!report) return [];
	const lines = [];
	const remote = report.assets.filter((a) => a.host);
	const relative = report.assets.filter((a) => a.relative);
	if (remote.length) {
		const hosts = [...new Set(remote.map((a) => a.host))];
		lines.push({
			tone: 'alarm',
			label: `${remote.length} asset${remote.length === 1 ? '' : 's'} load from ${hosts
				.slice(0, 2)
				.join(', ')}${hosts.length > 2 ? ` and ${hosts.length - 2} more` : ''}`,
			detail: 'The renderer will not fetch these. Re-host them, or they render empty.'
		});
	}
	if (relative.length) {
		lines.push({
			tone: 'alarm',
			label: `${relative.length} relative path${relative.length === 1 ? '' : 's'}`,
			detail:
				'A render has no page to resolve these against, so they arrive empty. Use full https URLs.'
		});
	}
	if (report.scripts.length) {
		lines.push({
			tone: 'field',
			label: `Scripts removed on save · ${report.scripts.join(', ')}`,
			detail: 'A template renders on our servers, so nothing in it is allowed to execute.'
		});
	}
	if (report.styles.length) {
		lines.push({
			tone: 'field',
			label: `${report.styles.length} remote stylesheet${report.styles.length === 1 ? '' : 's'}`,
			detail: 'Only Google Fonts is loaded. Paste the CSS in instead, or the design will differ.'
		});
	}
	return lines;
}
