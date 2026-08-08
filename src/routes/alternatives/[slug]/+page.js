import { redirect } from '@sveltejs/kit';
import { alternatives } from '$lib/pseo/comparisons.js';
import { sanityEnabled, getSanityComparison } from '$lib/sanity/comparisons';

// CMS first (see src/lib/sanity/comparisons.js — env-gated, same pattern as
// the blog cutover). Falls back to the legacy static array on any Sanity
// error or a genuine miss, since not every legacy alternative is guaranteed
// migrated yet — unlike the blog, this is a live rolling migration, not a
// one-time completed cutover.
export async function load({ params, fetch }) {
	if (sanityEnabled()) {
		try {
			const alt = await getSanityComparison(params.slug, fetch);
			if (alt) return { alt };
		} catch (e) {
			console.error('Sanity comparison fetch failed, falling back to legacy data:', e);
		}
	}

	const alt = alternatives.find((a) => a.slug === params.slug);
	if (!alt) {
		throw redirect(301, '/alternatives');
	}
	return { alt };
}
