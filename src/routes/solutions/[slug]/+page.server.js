/*
 * SERVER load, like /blogs/[slug]. As a universal load each guide 404'd outside
 * Sanity's origin allowlist (every dev server): SvelteKit's fetch simulates CORS
 * on the server, and the load runs again in the browser on hydration. Here the
 * query goes out once with the platform fetch and the guide ships in the page.
 */
import { error } from '@sveltejs/kit';
import { sanityEnabled, getSanitySolution } from '$lib/sanity/solutions';

// No legacy fallback here (unlike blog/comparisons) — this document type has
// no prior data-file source. A genuine miss, a disabled flag, OR a transient
// Sanity fetch failure all degrade to 404 rather than an unhandled 500 —
// there's nothing else to fall back to, so fail safe into "not found".
export async function load({ params }) {
	if (!sanityEnabled()) {
		throw error(404, 'Not found');
	}
	let solution;
	try {
		solution = await getSanitySolution(params.slug);
	} catch (e) {
		console.error('Sanity solution fetch failed:', e);
		throw error(404, 'Not found');
	}
	if (!solution) {
		throw error(404, 'Not found');
	}
	return { solution };
}
