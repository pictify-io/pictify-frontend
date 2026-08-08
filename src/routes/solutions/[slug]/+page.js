import { error } from '@sveltejs/kit';
import { sanityEnabled, getSanitySolution } from '$lib/sanity/solutions';

// No legacy fallback here (unlike blog/comparisons) — this document type has
// no prior data-file source. A genuine miss, a disabled flag, OR a transient
// Sanity fetch failure all degrade to 404 rather than an unhandled 500 —
// there's nothing else to fall back to, so fail safe into "not found".
export async function load({ params, fetch }) {
	if (!sanityEnabled()) {
		throw error(404, 'Not found');
	}
	let solution;
	try {
		solution = await getSanitySolution(params.slug, fetch);
	} catch (e) {
		console.error('Sanity solution fetch failed:', e);
		throw error(404, 'Not found');
	}
	if (!solution) {
		throw error(404, 'Not found');
	}
	return { solution };
}
