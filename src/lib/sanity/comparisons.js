/**
 * Sanity client for /alternatives (competitor comparisons) — Phase 2 of the
 * CMS migration, same shape as src/lib/sanity/client.js (blog, phase 1):
 * env-gated, CDN read, falls back to the legacy static data on any error.
 *
 * Reuses sanityEnabled/sanityQuery from client.js rather than duplicating
 * the fetch wrapper.
 */
import { sanityEnabled, sanityQuery } from './client';

export { sanityEnabled };

/** Sanity stores pricing/features as arrays (tiers vary per competitor);
 * the templates read them as plain {tierName: price} objects — same shape
 * the legacy src/lib/pseo/comparisons.js used. Convert back at the edge so
 * the Svelte templates don't need to change. */
function tiersToObject(tiers) {
	if (!tiers || !tiers.length) return {};
	return Object.fromEntries(tiers.map((t) => [t.tier, t.price]));
}

/** Map a Sanity comparison document onto the legacy `alternatives[]` shape
 * (see src/lib/pseo/comparisons.js's `alternatives = comparisons.map(...)`). */
export function toLegacyAlt(doc) {
	if (!doc) return null;
	const comparison = {
		tldr: doc.tldr,
		subhead: doc.subhead,
		audienceLabel: doc.audienceLabel,
		advantages: doc.advantages || [],
		competitorAdvantages: doc.competitorAdvantages || [],
		bestFor: doc.bestFor || {},
		pricing: {
			pictify: tiersToObject(doc.pictifyPricing),
			competitor: tiersToObject(doc.competitorPricing)
		},
		migration: doc.migration || null,
		faqs: doc.faqs || []
	};
	return {
		slug: doc.slug,
		competitor: doc.competitor,
		metaDescription: doc.metaDescription,
		whySwitch: (doc.advantages || []).slice(0, 4),
		comparison,
		cta: doc.cta || 'Try Pictify Free'
	};
}

const COMPARISON_PROJECTION = `{
	competitor, "slug": slug.current, metaDescription, tldr, subhead, audienceLabel,
	advantages, competitorAdvantages, bestFor,
	pictifyPricing, competitorPricing, features,
	migration, faqs, cta
}`;

/** One comparison by slug. */
export async function getSanityComparison(slug, fetchFn = fetch) {
	const doc = await sanityQuery(
		`*[_type == "comparison" && !(_id in path("drafts.**")) && slug.current == $slug][0] ${COMPARISON_PROJECTION}`,
		{ slug },
		fetchFn
	);
	return toLegacyAlt(doc);
}

/** All comparisons, competitor A-Z (matches the legacy array's authoring order closely enough for list display). */
export async function getSanityComparisons(fetchFn = fetch) {
	const docs = await sanityQuery(
		`*[_type == "comparison" && !(_id in path("drafts.**"))] | order(competitor asc) ${COMPARISON_PROJECTION}`,
		{},
		fetchFn
	);
	return (docs || []).map(toLegacyAlt);
}
