import { sanityEnabled, getSanitySolutions } from '$lib/sanity/solutions';

export async function load({ fetch }) {
	if (!sanityEnabled()) return { solutions: [] };
	try {
		return { solutions: await getSanitySolutions(fetch) };
	} catch (e) {
		console.error('Sanity solutions fetch failed:', e);
		return { solutions: [] };
	}
}
