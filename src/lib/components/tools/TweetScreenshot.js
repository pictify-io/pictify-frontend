/**
 * Builds the HTML markup for a tweet screenshot card.
 * Consumed by:
 *   - The live preview on /tools/tweet-screenshot (injected via {@html})
 *   - The POST /image/public payload for Download (server-rendered to PNG)
 *   - The API snippet shown on-page (as the exact curl that produces the same image)
 *
 * KEEP IN SYNC across all three call sites — the API snippet's promise is that
 * pasting the shown curl produces the exact image the user previewed.
 */

/**
 * Tokenize a tweet body using Twitter's entity indices.
 * Entities are character-index-based; we convert them to a token stream.
 *
 * @param {string} body
 * @param {object} entities  { urls: [...], user_mentions: [...], hashtags: [...] }
 * @returns {Array<{type: 'text'|'url'|'mention'|'hashtag', text: string, href?: string, display?: string}>}
 */
export function tokenize(body, entities) {
	if (!body || typeof body !== 'string') return [];
	const raw = [
		...(entities?.urls || []).map((e) => ({ type: 'url', start: e.start, end: e.end, display: e.display_url, href: e.expanded_url })),
		...(entities?.user_mentions || []).map((e) => ({ type: 'mention', start: e.start, end: e.end, handle: e.handle })),
		...(entities?.hashtags || []).map((e) => ({ type: 'hashtag', start: e.start, end: e.end, tag: e.text }))
	]
		.filter((e) => Number.isInteger(e.start) && Number.isInteger(e.end) && e.end > e.start)
		.sort((a, b) => a.start - b.start);

	// Index into the body by Unicode code points (handles emoji correctly).
	const codepoints = Array.from(body);
	const out = [];
	let cursor = 0;

	for (const ent of raw) {
		if (ent.start < cursor) continue; // overlap — skip
		if (ent.start > cursor) {
			out.push({ type: 'text', text: codepoints.slice(cursor, ent.start).join('') });
		}
		const entText = codepoints.slice(ent.start, ent.end).join('');
		if (ent.type === 'url') {
			out.push({ type: 'url', text: ent.display || entText, href: ent.href || entText });
		} else if (ent.type === 'mention') {
			out.push({ type: 'mention', text: entText, handle: ent.handle });
		} else if (ent.type === 'hashtag') {
			out.push({ type: 'hashtag', text: entText, tag: ent.tag });
		}
		cursor = ent.end;
	}
	if (cursor < codepoints.length) {
		out.push({ type: 'text', text: codepoints.slice(cursor).join('') });
	}
	return out;
}

// HTML-escape — used for every user-supplied string
function esc(s) {
	return String(s == null ? '' : s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function formatMetric(n) {
	if (n === null || n === undefined || Number.isNaN(Number(n))) return '';
	const num = Number(n);
	if (num < 1000) return String(num);
	if (num < 10_000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
	if (num < 1_000_000) return `${Math.round(num / 1000)}K`;
	return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

function formatDate(iso) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return esc(iso);
	const h = d.getUTCHours().toString().padStart(2, '0');
	const m = d.getUTCMinutes().toString().padStart(2, '0');
	const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
	return `${h}:${m} · ${month} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function renderBody(body, entities) {
	const tokens = tokenize(body, entities);
	return tokens
		.map((t) => {
			if (t.type === 'url') {
				return `<a href="${esc(t.href)}" style="color:#1d9bf0;text-decoration:none">${esc(t.text)}</a>`;
			}
			if (t.type === 'mention') return `<span style="color:#1d9bf0">${esc(t.text)}</span>`;
			if (t.type === 'hashtag') return `<span style="color:#1d9bf0">${esc(t.text)}</span>`;
			return esc(t.text);
		})
		.join('');
}

function renderAvatar(avatarUrl, name) {
	if (avatarUrl) {
		return `<img src="${esc(avatarUrl)}" alt="" style="width:48px;height:48px;border-radius:9999px;object-fit:cover;flex-shrink:0" />`;
	}
	const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
	return `<div style="width:48px;height:48px;border-radius:9999px;background:#7856ff;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;flex-shrink:0">${esc(initial)}</div>`;
}

function renderVerifiedBadge(isBlue, isVerified) {
	if (!isBlue && !isVerified) return '';
	const color = isBlue ? '#1d9bf0' : '#e7a33e';
	return `<svg viewBox="0 0 22 22" width="20" height="20" style="margin-left:4px;flex-shrink:0"><path fill="${color}" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>`;
}

function renderMedia(media) {
	if (!Array.isArray(media) || media.length === 0) return '';
	const count = Math.min(media.length, 4);
	const layouts = {
		1: 'grid-template-columns:1fr;grid-template-rows:1fr;aspect-ratio:16/9',
		2: 'grid-template-columns:1fr 1fr;grid-template-rows:1fr;aspect-ratio:16/9',
		3: 'grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;aspect-ratio:16/9',
		4: 'grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;aspect-ratio:16/9'
	};
	const cells = media
		.slice(0, count)
		.map(
			(m, i) =>
				`<div style="${i === 0 && count === 3 ? 'grid-row:1/span 2;' : ''}overflow:hidden"><img src="${esc(m.url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" /></div>`
		)
		.join('');
	return `<div style="margin-top:12px;border-radius:16px;overflow:hidden;border:1px solid #cfd9de;display:grid;gap:2px;${layouts[count]}">${cells}</div>`;
}

/**
 * Build the full HTML for a tweet card, sized to the given width/height
 * (height is a minimum — content may expand).
 */
export function buildTweetHtml(t, { width = 600 } = {}) {
	const name = esc(t?.author?.name || '');
	const handle = esc(t?.author?.handle || '');
	const bodyHtml = renderBody(t?.body || '', t?.entities || {});
	const verified = renderVerifiedBadge(!!t?.author?.is_verified_blue, !!t?.author?.is_verified);
	const avatarHtml = renderAvatar(t?.author?.avatar_url || '', t?.author?.name || '');
	const mediaHtml = renderMedia(t?.media || []);
	const date = formatDate(t?.created_at);
	const likes = formatMetric(t?.metrics?.likes);
	const replies = formatMetric(t?.metrics?.replies);
	const retweets = formatMetric(t?.metrics?.retweets);

	return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${width}px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f1419}
.card{width:${width}px;padding:20px;background:#fff}
.header{display:flex;align-items:flex-start;gap:12px}
.identity{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
.name-row{display:flex;align-items:center;gap:4px;font-weight:800;font-size:16px;color:#0f1419}
.handle{font-size:15px;color:#536471}
.body{margin-top:12px;font-size:20px;line-height:1.35;color:#0f1419;white-space:pre-wrap;word-wrap:break-word}
.date{margin-top:16px;font-size:15px;color:#536471}
.metrics{margin-top:16px;padding-top:16px;border-top:1px solid #eff3f4;display:flex;gap:24px;font-size:14px;color:#536471}
.metric strong{color:#0f1419;font-weight:700;margin-right:4px}
.logo{margin-left:auto;width:22px;height:22px;flex-shrink:0}
</style></head><body>
<div class="card">
  <div class="header">
    ${avatarHtml}
    <div class="identity">
      <div class="name-row"><span>${name}</span>${verified}</div>
      <div class="handle">@${handle}</div>
    </div>
    <svg class="logo" viewBox="0 0 24 24" fill="#0f1419"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  </div>
  <div class="body">${bodyHtml}</div>
  ${mediaHtml}
  ${date ? `<div class="date">${date}</div>` : ''}
  ${(likes || replies || retweets) ? `<div class="metrics">
    ${replies ? `<div class="metric"><strong>${replies}</strong>Replies</div>` : ''}
    ${retweets ? `<div class="metric"><strong>${retweets}</strong>Retweets</div>` : ''}
    ${likes ? `<div class="metric"><strong>${likes}</strong>Likes</div>` : ''}
  </div>` : ''}
</div>
</body></html>`;
}

/** Default tweet shown before a user fetches — placeholder/SEO preview */
export const DEFAULT_TWEET = {
	id: 'demo',
	author: {
		name: 'Pictify',
		handle: 'pictify_io',
		avatar_url: null,
		is_verified_blue: true,
		is_verified: false
	},
	body: 'Generate tweet screenshots programmatically via a simple HTTP call. Paste any tweet URL above, tweak the fields, and download — or copy the API snippet and automate it. #API #SaaS',
	entities: {
		urls: [],
		user_mentions: [],
		hashtags: [
			{ start: 151, end: 155, text: 'API' },
			{ start: 156, end: 161, text: 'SaaS' }
		]
	},
	media: [],
	created_at: '2026-04-14T10:00:00.000Z',
	metrics: { likes: 1234, retweets: null, replies: 42 }
};
