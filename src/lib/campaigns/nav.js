/**
 * Every campaigns URL is built here.
 *
 * Two jobs, and the second is the reason this is a module rather than template
 * strings scattered through the routes:
 *
 *   1. One place that knows the shape of a campaigns URL, so a renamed step
 *      does not leave dead links behind in five components.
 *   2. One place that decides whether a `redirect` or `intent` arriving from
 *      the query string may be acted on. Both cross a trust boundary — they
 *      reach us from a link someone else can write — so they are validated
 *      here and nowhere else.
 *
 * INV-06: campaign data is private by default. A link is not an access policy,
 * so nothing here grants access; these helpers only decide where the browser
 * may be pointed.
 */

/** The steps of an edition, in the order the step strip shows them. */
export const EDITION_STEPS = ['setup', 'data', 'review', 'preview', 'generate', 'export'];

/**
 * Intents a signup link may carry. An allowlist, not a pattern: an intent
 * selects a product experience, and the set of experiences is small and known.
 */
export const CAMPAIGN_INTENTS = ['customer-value-update'];

export const campaignsHome = () => '/dashboard/campaigns';

export const campaignUrl = (campaignUid) =>
	`/dashboard/campaigns/${encodeURIComponent(campaignUid)}`;

/**
 * An edition's step. An unknown step falls back to the first rather than
 * throwing: a stale bookmark should land somewhere useful.
 */
export function editionUrl(campaignUid, editionUid, step = EDITION_STEPS[0]) {
	const safeStep = EDITION_STEPS.includes(step) ? step : EDITION_STEPS[0];
	return `${campaignUrl(campaignUid)}/editions/${encodeURIComponent(editionUid)}/${safeStep}`;
}

/** `null` for anything off the allowlist, so a caller cannot forward junk. */
export function safeIntent(intent) {
	return CAMPAIGN_INTENTS.includes(intent) ? intent : null;
}

/**
 * Is this a redirect we are willing to follow after login?
 *
 * Only a same-origin absolute PATH qualifies. The rejections matter more than
 * the acceptance:
 *
 *   `//evil.com`       protocol-relative — the browser reads this as a host, so
 *                      it is an off-site redirect wearing a path's clothes.
 *   `https://evil.com` absolute, obviously.
 *   `/\evil.com`       backslash: some parsers normalise `\` to `/`, which turns
 *                      this back into the protocol-relative case.
 *   `javascript:…`     a scheme, not a path.
 *
 * Anything not starting with a single `/` is rejected outright, which also
 * covers relative paths — they resolve against whatever page is current, so
 * where they land is not knowable here.
 */
export function isSafeReturnPath(path) {
	if (typeof path !== 'string' || path.length === 0 || path.length > 2048) return false;
	if (!path.startsWith('/')) return false;
	// Protocol-relative, in either slash direction.
	if (path.startsWith('//') || path.startsWith('/\\')) return false;
	// Control characters, including the tab/newline/CR some parsers strip before
	// re-reading the value — `/\thttps://evil.com` must not survive that trim.
	if (/[\u0000-\u001F\u007F]/.test(path)) return false;
	// A colon inside the first segment would make this a scheme.
	const firstSegment = path.slice(1).split(/[/?#]/)[0];
	if (firstSegment.includes(':')) return false;
	return true;
}

/** The path to return to, or campaigns home when it cannot be trusted. */
export function safeReturnPath(path, fallback = campaignsHome()) {
	return isSafeReturnPath(path) ? path : fallback;
}

/**
 * Where a login/signup should land.
 *
 * A validated invitation or deep link beats an intent: someone following a
 * specific link asked for a specific place, while an intent only says which
 * experience they arrived wanting.
 */
export function postAuthDestination({ redirect, intent } = {}) {
	if (isSafeReturnPath(redirect)) return redirect;
	if (safeIntent(intent)) return campaignsHome();
	return '/dashboard';
}

/** Carry intent + redirect onto an auth URL, dropping either if untrusted. */
export function authUrl(base, { redirect, intent } = {}) {
	const params = new URLSearchParams();
	const okIntent = safeIntent(intent);
	if (okIntent) params.set('intent', okIntent);
	if (isSafeReturnPath(redirect)) params.set('redirect', redirect);
	const qs = params.toString();
	return qs ? `${base}?${qs}` : base;
}

/**
 * Is this a usable destination for a campaign's Next action?
 *
 * NOT a variant of `isSafeReturnPath`, despite doing a similar-sounding job.
 * That one accepts same-origin paths and rejects every absolute URL; this one
 * is its inverse and accepts only absolute external https. Reusing either for
 * the other's purpose rejects everything it should allow.
 *
 * https only: the destination is printed on a summary a customer will read and
 * click from the buyer's email, so a downgrade to http is not something to
 * shrug at. Credentials in the URL are refused because they would be rendered
 * into an image and mailed out.
 */
export function isSafeExternalUrl(value) {
	if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;
	if (/[\u0000-\u001F\u007F]/.test(value)) return false;

	let url;
	try {
		url = new URL(value);
	} catch {
		return false;
	}

	if (url.protocol !== 'https:') return false;
	// Credentials would be baked into a rendered image.
	if (url.username || url.password) return false;
	// A hostname with no dot is a local name, not somewhere a customer can reach.
	if (!url.hostname.includes('.') || url.hostname.endsWith('.')) return false;
	return true;
}
