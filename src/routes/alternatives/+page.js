import { alternatives as legacyAlternatives } from '$lib/pseo/comparisons.js';
import { sanityEnabled, getSanityComparisons } from '$lib/sanity/comparisons';

// CMS first — same pattern as the blog cutover (src/lib/sanity/client.js).
export async function load({ fetch }) {
	if (sanityEnabled()) {
		try {
			const alternatives = await getSanityComparisons(fetch);
			if (alternatives.length) return { alternatives };
		} catch (e) {
			console.error('Sanity comparisons fetch failed, falling back to legacy data:', e);
		}
	}

	return { alternatives: legacyAlternatives };
}
