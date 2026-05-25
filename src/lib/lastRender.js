/**
 * Persist the last successful free-tool render so we can rehydrate it
 * on the post-signup /welcome page. The whole purpose is to give the
 * brand-new user a one-click "render this from your terminal" moment.
 */

import { browser } from '$app/environment';

const KEY = 'pictify_last_render';

export function saveLastRender(payload = {}) {
	if (!browser) return;
	try {
		const record = {
			tool: payload.tool || null,
			type: payload.url ? 'url' : 'html',
			html: payload.html || null,
			url: payload.url || null,
			width: payload.width || null,
			height: payload.height || null,
			format: payload.format || 'png',
			imageUrl: payload.imageUrl || null,
			createdAt: new Date().toISOString()
		};
		// Cap HTML size so we don't blow out localStorage with hostile pastes.
		if (record.html && record.html.length > 100_000) {
			record.html = record.html.slice(0, 100_000);
		}
		localStorage.setItem(KEY, JSON.stringify(record));
	} catch {
		/* localStorage may be unavailable in private mode — ignore */
	}
}

export function getLastRender() {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function clearLastRender() {
	if (!browser) return;
	try {
		localStorage.removeItem(KEY);
	} catch {
		/* ignore */
	}
}
