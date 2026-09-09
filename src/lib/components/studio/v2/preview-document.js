import { fontLinks, shellAttributes, styleBlocks } from './document-shell.js';

/**
 * The document wrapper every in-browser preview of a design is written into.
 * B06-1.
 *
 * One place, because the interesting part is a policy and a policy that exists
 * in two copies is a policy that will disagree with itself.
 *
 * WHY A CSP AND NOT JUST SANITISING. DOMPurify removes scripts and event
 * handlers; it does not touch URLs inside CSS. Measured, not assumed — every
 * one of these survives `cleanHtml` today:
 *
 *   <style>@import url(https://elsewhere/x.css)</style>
 *   <style>.a{background:url(https://elsewhere/t.png?id=…)}</style>
 *   <style>@font-face{src:url(https://elsewhere/f.woff)}</style>
 *   <img src="https://elsewhere/pixel.png">
 *
 * In a preview each of those is a request the buyer's browser makes to a host
 * chosen by whoever wrote the markup — which, for an AI result or an imported
 * file, is not the buyer. That is a tracking channel, and with a query string
 * it is an exfiltration one. The sanitizer cannot close it; the CSP can.
 */

/**
 * Where a design's own images legitimately come from.
 *
 * Brand assets are served from S3 today. Keeping this list explicit rather than
 * allowing `https:` is the entire point: `img-src https:` would permit every
 * host on the internet, which is the thing being prevented.
 */
const ASSET_ORIGINS = ['https://htgf.s3.amazonaws.com', 'https://media.pictify.io'];

/**
 * Google Fonts, and only Google Fonts.
 *
 * Platform templates are set in webfonts loaded from here, and a preview that
 * drops them shows the design in Times — which is not the design. Two hosts,
 * because the CSS and the font files it points at are served separately:
 * `fonts.googleapis.com` is a style-src fetch, `fonts.gstatic.com` a font-src
 * one, and allowing the first without the second loads a stylesheet whose
 * every `@font-face` is then blocked.
 *
 * This is a deliberate hole in `default-src 'none'`, kept as narrow as the
 * mechanism allows: two named hosts, no wildcard, and `document-shell.js`
 * admits a `<link>` only after parsing its href and matching the host exactly.
 */
const FONT_CSS = 'https://fonts.googleapis.com';
const FONT_FILES = 'https://fonts.gstatic.com';

/**
 * `script-src 'none'` even though the sanitizer strips scripts, and
 * `connect-src 'none'` even though there is nothing to connect with. Each rule
 * is here to hold when the layer above it has been got past — that is what
 * makes it defence in depth rather than a restatement.
 *
 * `style-src 'unsafe-inline'` is required: a design IS inline style. It permits
 * the styles to APPLY, and still blocks `@import` and `@font-face` from
 * fetching, because those are style-src fetches against hosts this list does
 * not name.
 */
/**
 * WHO IS LOOKING DECIDES WHAT IMAGES MAY LOAD.
 *
 * `assets` (the default) is the campaign and template studio. There, the
 * markup can come from an AI result or an imported file and the person looking
 * at it is the BUYER — someone else chose what it fetches. A remote image is
 * then a request to a host the buyer never picked, which is a tracking channel
 * and, with a query string, an exfiltration one. Two named hosts only.
 *
 * `any` is the public tool editor. There the author and the viewer are the
 * same person: the templates are ours, and the whole feature is "read my site
 * and use my logo" — a logo that lives, by definition, on a host we cannot
 * enumerate. Refusing it does not protect that person from anything; it just
 * means the tool does not work. Measured: every OG template loads its mark
 * from res.cloudinary.com and every one of them came back blank.
 *
 * ONLY `img-src` WIDENS. Scripts, connections, frames, objects, forms and the
 * base uri stay at `none` in both modes, so a design still cannot execute,
 * phone home, or navigate the page it sits in.
 */
const IMG_SRC = {
	assets: `'self' data: blob: ${ASSET_ORIGINS.join(' ')}`,
	any: `'self' data: blob: https:`
};

export const previewCsp = (images = 'assets') =>
	[
		"default-src 'none'",
		`img-src ${IMG_SRC[images] || IMG_SRC.assets}`,
		`style-src 'unsafe-inline' ${FONT_CSS}`,
		`font-src data: ${FONT_FILES} ${ASSET_ORIGINS.join(' ')}`,
		"script-src 'none'",
		"connect-src 'none'",
		"frame-src 'none'",
		"object-src 'none'",
		"form-action 'none'",
		"base-uri 'none'"
	].join('; ');

/** The strict policy, which is still the default everywhere. */
export const PREVIEW_CSP = previewCsp('assets');

/**
 * The `<head>` for a preview document.
 *
 * The CSP goes in a meta tag because these documents are written into an
 * iframe rather than served, so there is no response to put a header on. A meta
 * CSP is honoured for everything the parser reaches after it, which is why it
 * is the FIRST thing in the head — content before it would load unpoliced.
 */
export const previewHead = (
	extraCss = 'html,body{margin:0;padding:0}',
	links = [],
	styles = [],
	images = 'assets'
) =>
	`<meta http-equiv="Content-Security-Policy" content="${previewCsp(images)}">` +
	`<meta charset="utf-8">` +
	`<style>${extraCss}</style>` +
	links.join('') +
	// The design's OWN css, after the reset so it wins, before nothing else.
	styles.map((css) => `<style>${css}</style>`).join('');

/**
 * Options are `{ css, shell }`. `shell` is a `splitDocument` result, and
 * carrying it is what makes a preview look like the saved design rather than
 * like its body: the source `<html>` and `<body>` style/class are applied to
 * the frame's own tags, and the source's font links go in the head.
 *
 * A bare string is still accepted as `css` — several callers only ever had
 * that to say.
 */
const options = (arg) => (typeof arg === 'string' ? { css: arg } : arg || {});

/** A whole preview document, head policy included. */
export function previewDocument(body, arg) {
	const { css, shell, images } = options(arg);
	const html = shell ? shellAttributes(shell.htmlAttrs) : {};
	const bodyAttrs = shell ? shellAttributes(shell.bodyAttrs) : {};
	const links = shell ? fontLinks(shell.head) : [];
	const styles = shell ? styleBlocks(shell.head) : [];
	return (
		`<!doctype html><html${attrText(html)}>` +
		`<head>${previewHead(css, links, styles, images)}</head>` +
		`<body${attrText(bodyAttrs)}>${body}</body></html>`
	);
}

const attrText = (attrs) =>
	Object.entries(attrs)
		.map(([name, value]) => ` ${name}="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
		.join('');

/**
 * Put a preview document into a same-origin frame.
 *
 * `documentElement.innerHTML` rather than `doc.open()/write()/close()`: the
 * write pair REPLACES the Document object, and this frame is rewritten on every
 * committed transaction, so anything holding a reference across a remount ends
 * up talking to a document that is no longer in the frame. Setting innerHTML
 * keeps one Document for the life of the stage.
 *
 * (It does NOT silence Chrome's "Blocked script execution … the document's
 * frame is sandboxed" line — that is logged once for any sandboxed frame
 * without `allow-scripts`, whatever puts the content there. It is the sandbox
 * announcing itself, not an error; see the iframe in StudioStage.)
 *
 * Synchronous on purpose: the editor attaches to `contentDocument` on the next
 * line, and `srcdoc` would make that a load-event dance for no gain.
 */
export function writePreviewDocument(frame, body, arg) {
	const doc = frame.contentDocument;
	if (!doc?.documentElement) return null;
	const { css, shell, images } = options(arg);
	const links = shell ? fontLinks(shell.head) : [];
	const styles = shell ? styleBlocks(shell.head) : [];
	doc.documentElement.innerHTML =
		`<head>${previewHead(css, links, styles, images)}</head><body>${body}</body>`;

	/*
	 * Set on the live elements rather than written into the markup, because
	 * `documentElement.innerHTML` replaces the CONTENT of `<html>` and cannot
	 * touch the tag itself — an `<html style>` in that string would be parsed
	 * as stray markup inside the head and dropped. Cleared first so that
	 * remounting a design that no longer has a shell does not keep the last
	 * one's background.
	 */
	applyShellAttributes(doc.documentElement, shell?.htmlAttrs);
	applyShellAttributes(doc.body, shell?.bodyAttrs);
	return doc;
}

function applyShellAttributes(el, attrText) {
	if (!el) return;
	const attrs = shellAttributes(attrText);
	for (const name of ['style', 'class']) {
		if (attrs[name] === undefined) el.removeAttribute(name);
		else el.setAttribute(name, attrs[name]);
	}
}
