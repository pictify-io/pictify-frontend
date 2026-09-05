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
export const PREVIEW_CSP = [
	"default-src 'none'",
	`img-src 'self' data: blob: ${ASSET_ORIGINS.join(' ')}`,
	"style-src 'unsafe-inline'",
	`font-src data: ${ASSET_ORIGINS.join(' ')}`,
	"script-src 'none'",
	"connect-src 'none'",
	"frame-src 'none'",
	"object-src 'none'",
	"form-action 'none'",
	"base-uri 'none'"
].join('; ');

/**
 * The `<head>` for a preview document.
 *
 * The CSP goes in a meta tag because these documents are written into an
 * iframe rather than served, so there is no response to put a header on. A meta
 * CSP is honoured for everything the parser reaches after it, which is why it
 * is the FIRST thing in the head — content before it would load unpoliced.
 */
export const previewHead = (extraCss = 'html,body{margin:0;padding:0}') =>
	`<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">` +
	`<meta charset="utf-8">` +
	`<style>${extraCss}</style>`;

/** A whole preview document, head policy included. */
export const previewDocument = (body, extraCss) =>
	`<!doctype html><html><head>${previewHead(extraCss)}</head><body>${body}</body></html>`;

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
export function writePreviewDocument(frame, body, extraCss) {
	const doc = frame.contentDocument;
	if (!doc?.documentElement) return null;
	doc.documentElement.innerHTML = `<head>${previewHead(extraCss)}</head><body>${body}</body>`;
	return doc;
}
