/*
 * SERVER load, like /blogs. A universal load runs again in the browser on
 * hydration, and on the server SvelteKit's fetch simulates CORS: either way a
 * Sanity request from an origin outside the project's allowlist (every dev
 * server) failed and the shelf rendered empty. Here the query goes out with the
 * platform fetch, once, and the result ships inside the page.
 */
import { sanityEnabled, getSanitySolutions } from '$lib/sanity/solutions';

export async function load() {
	if (!sanityEnabled()) return { solutions: [] };
	try {
		return { solutions: await getSanitySolutions() };
	} catch (e) {
		console.error('Sanity solutions fetch failed:', e);
		return { solutions: [] };
	}
}
