/**
 * How an API key is shown when it must not be shown.
 *
 * New keys start with `pic_live_` (backend models/ApiToken.js). Keys issued
 * before 2026-09-14 are bare 64-char hex and keep working. The mask reflects
 * the key the user actually holds: a prefixed key masks to
 * `pic_live_••••c41d`, a legacy key to `••••c41d`. Inventing the prefix for a
 * legacy key, as the dashboard did, made the stub disagree with the secret
 * the user was pasting into their own config.
 */
export const API_KEY_PREFIX = 'pic_live_';

export const hasKeyPrefix = (token) => typeof token === 'string' && token.startsWith(API_KEY_PREFIX);

/**
 * @param {string|null|undefined} token
 * @param {{ tail?: number, fallback?: string }} [opts]
 * @returns {string}
 */
export function maskApiKey(token, { tail = 5, fallback = 'YOUR_API_KEY' } = {}) {
	if (!token || typeof token !== 'string') return fallback;
	const last = token.slice(-tail);
	return hasKeyPrefix(token) ? `${API_KEY_PREFIX}••••${last}` : `••••${last}`;
}
