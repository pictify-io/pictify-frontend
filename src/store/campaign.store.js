import { writable } from 'svelte/store';
import { getCapabilities } from '../api/campaign';

/**
 * The server's answer about what this team may do with campaigns.
 *
 * Held in one place because several surfaces need it — the rail's allowance
 * card, the list's empty states, the access-request card — and because the
 * limits in it are authoritative. Nothing in the UI may compute an allowance,
 * a cap or an entitlement locally; if the server has not said it, the surface
 * shows nothing rather than a plausible-looking number (spec: every word from
 * server state).
 *
 * `null` therefore means "not answered yet", and is deliberately distinct from
 * an answer of zero.
 */
export const capabilities = writable(null);

/** The reason capabilities are unavailable, for surfaces that must explain it. */
export const capabilitiesError = writable(null);

let inflight = null;

/**
 * Load once per page life. Concurrent callers share the same request rather
 * than each firing one, since the rail and the route both want it on mount.
 */
export function initCampaignCapabilities({ force = false } = {}) {
	if (inflight && !force) return inflight;
	capabilitiesError.set(null);
	inflight = getCapabilities()
		.then((data) => {
			capabilities.set(data);
			return data;
		})
		.catch((err) => {
			// A 403 here is a normal state (no pilot access), not a broken page.
			// Callers decide how to render it; the store only records it.
			capabilities.set(null);
			capabilitiesError.set(err);
			throw err;
		})
		.finally(() => {
			inflight = null;
		});
	return inflight;
}
