import { error } from '@sveltejs/kit';
import { sanityEnabled, getSanitySolution } from '$lib/sanity/solutions';

// No legacy fallback here (unlike blog/comparisons) — this document type has
// no prior data-file source. A genuine miss or a disabled flag is a 404.
export async function load({ params, fetch }) {
	if (!sanityEnabled()) {
		throw error(404, 'Not found');
	}
	const solution = await getSanitySolution(params.slug, fetch);
	if (!solution) {
		throw error(404, 'Not found');
	}
	return { solution };
}
