/**
 * OG Image HTML Template — Pictify Brand
 *
 * Neo-brutalist design: cream bg, 3px borders, offset shadows, #ffc480 accent.
 * Renders at 1200×630 via Pictify HTML-to-image API.
 *
 * Usage:
 *   import { buildOgImageHTML } from '$lib/seo/og-image/template.js';
 *   const html = buildOgImageHTML({ tag: 'Free Tool', title: '...', subtitle: '...' });
 */

/**
 * @typedef {Object} OgImageConfig
 * @property {string}  tag         – Pill label above title (e.g. "FREE TOOL", "API DOCS")
 * @property {string}  title       – Main headline (1-3 short lines)
 * @property {string}  subtitle    – One-liner description
 * @property {string}  [accentColor]  – Pill / underline accent  (default #ffc480)
 * @property {string}  [badge1Text]   – Right-side floating card top text  (default "API")
 * @property {string}  [badge1Label]  – Right-side floating card label     (default "<200ms")
 * @property {string}  [badge2Text]   – Second floating card text          (default "99.9%")
 * @property {string}  [badge2Label]  – Second floating card label         (default "UPTIME")
 * @property {string}  [highlightWord] – Word/phrase in title to underline with accent (default: last word)
 */

/**
 * Build the full HTML string for a branded OG image.
 * The root div uses position:absolute + explicit 1200×630 so the renderer
 * captures exactly that size.
 *
 * @param {OgImageConfig} config
 * @returns {string} Complete HTML document ready for Pictify rendering
 */
export function buildOgImageHTML({
	tag = 'FREE TOOL',
	title = 'Image Generation API\nfor Developers',
	subtitle = 'Generate images from templates and data with one API call.',
	accentColor = '#ffc480',
	badge1Text = 'API',
	badge1Label = '<200ms',
	badge2Text = '99.9%',
	badge2Label = 'UPTIME',
	highlightWord = ''
} = {}) {
	// Escape HTML entities to prevent injection
	const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

	// Build title HTML with optional highlight span
	const escapedTitle = esc(title);
	let titleHTML;
	if (highlightWord) {
		const escapedHL = esc(highlightWord);
		titleHTML = escapedTitle.replace(escapedHL, `<span class="hl">${escapedHL}</span>`);
	} else {
		// Default: highlight the last word
		const words = escapedTitle.split(/(\s+)/);
		const lastWord = words.filter((w) => w.trim()).pop();
		if (lastWord) {
			const idx = escapedTitle.lastIndexOf(lastWord);
			titleHTML = escapedTitle.slice(0, idx) + `<span class="hl">${lastWord}</span>` + escapedTitle.slice(idx + lastWord.length);
		} else {
			titleHTML = escapedTitle;
		}
	}

	return `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body,html{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.root{
  position:absolute;top:0;left:0;width:1200px;height:630px;
  background:#FFFDF8;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:56px 72px 120px;
}

/* dot grid */
.dots{position:absolute;inset:0;background:radial-gradient(#1f2937 1px,transparent 1px);background-size:24px 24px;opacity:.04;pointer-events:none}

/* colour blobs */
.blob1{position:absolute;top:-80px;right:-40px;width:420px;height:420px;background:${esc(accentColor)};border-radius:50%;opacity:.16;filter:blur(80px)}
.blob2{position:absolute;bottom:-100px;left:-40px;width:340px;height:340px;background:#4ade80;border-radius:50%;opacity:.10;filter:blur(80px)}

/* tag pill — inline-flex so it shrink-wraps the text */
.tag{
  display:inline-flex;align-items:center;padding:7px 18px;margin-bottom:22px;
  background:${esc(accentColor)};border:3px solid #1f2937;border-radius:999px;
  font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#1f2937;
  box-shadow:3px 3px 0 0 #1f2937;transform:rotate(-1.5deg);position:relative;z-index:2;
  width:fit-content;
}

/* title */
.title{
  font-size:56px;font-weight:900;line-height:1.15;letter-spacing:-.03em;
  color:#1f2937;max-width:780px;position:relative;z-index:2;margin-bottom:18px;white-space:pre-line;
}
/* inline highlight on a word/phrase */
.title .hl{
  position:relative;display:inline;
}
.title .hl::after{
  content:'';position:absolute;left:-3px;right:-3px;bottom:4px;
  height:14px;background:${esc(accentColor)};opacity:.45;border-radius:2px;
  z-index:-1;transform:rotate(-.5deg);
}

/* subtitle */
.sub{font-size:20px;font-weight:500;color:#6b7280;max-width:680px;line-height:1.5;position:relative;z-index:2}

/* floating cards — right side */
.card{
  position:absolute;background:#fff;border:3px solid #1f2937;border-radius:14px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;
}
.c1{right:60px;top:56px;width:185px;height:130px;box-shadow:6px 6px 0 0 #1f2937;transform:rotate(3deg)}
.c2{right:100px;top:210px;width:155px;height:105px;background:${esc(accentColor)};box-shadow:5px 5px 0 0 #1f2937;transform:rotate(-2deg)}
.c3{right:48px;top:340px;width:140px;height:95px;background:#4ade80;box-shadow:4px 4px 0 0 #1f2937;transform:rotate(1.5deg)}
.card .big{font-size:32px;font-weight:900;color:#1f2937;line-height:1}
.card .sm{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#1f2937;opacity:.7;margin-top:6px}

/* bottom bar */
.bar{
  position:absolute;bottom:0;left:0;right:0;height:62px;background:#1f2937;
  display:flex;align-items:center;justify-content:space-between;padding:0 72px;
}
.logo{display:flex;align-items:center;gap:10px}
.logo-icon svg{width:22px;height:22px;stroke:#FFFDF8;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.logo-name{font-size:19px;font-weight:900;color:#FFFDF8;letter-spacing:.02em;text-transform:uppercase}
.domain{font-size:15px;font-weight:600;color:#9ca3af}
</style>

<div class="root">
  <div class="dots"></div>
  <div class="blob1"></div>
  <div class="blob2"></div>

  <div class="tag">${esc(tag)}</div>
  <div class="title">${titleHTML}</div>
  <div class="sub">${esc(subtitle)}</div>

  <div class="card c1">
    <div class="big">${esc(badge1Text)}</div>
    <div class="sm">${esc(badge1Label)}</div>
  </div>
  <div class="card c2">
    <div class="big">${esc(badge2Text)}</div>
    <div class="sm">${esc(badge2Label)}</div>
  </div>
  <div class="card c3">
    <div class="big">FREE</div>
    <div class="sm">TO START</div>
  </div>

  <div class="bar">
    <div class="logo">
      <div class="logo-icon"><svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
      <div class="logo-name">Pictify</div>
    </div>
    <div class="domain">pictify.io</div>
  </div>
</div>`;
}
