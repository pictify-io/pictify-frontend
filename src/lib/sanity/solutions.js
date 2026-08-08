/**
 * Sanity client for /solutions/* pages — Phase 2 Track B of the CMS
 * migration. Same zero-dep GROQ wrapper as client.js (blog) and
 * comparisons.js (alternatives).
 *
 * No legacy-shape adapter here, unlike blog/comparisons: this document type
 * has no prior data-file source to map onto (see studio/schemaTypes/solutionPage.js) —
 * callers consume the Sanity document shape directly.
 */
import { sanityEnabled, sanityQuery } from './client';

export { sanityEnabled };

const SOLUTION_PROJECTION = `{
	title, "slug": slug.current, metaDescription, breadcrumbLabel, summary, keyword,
	priority, isPillar, ogImage, ogImageAlt, eyebrow, headline, headlineAccent, subhead,
	ctaButtons, body, faqs
}`;

/** One solution page by slug. */
export async function getSanitySolution(slug, fetchFn = fetch) {
	return sanityQuery(
		`*[_type == "solutionPage" && !(_id in path("drafts.**")) && slug.current == $slug][0] ${SOLUTION_PROJECTION}`,
		{ slug },
		fetchFn
	);
}

/** All solution pages, pillar first then priority order — for /solutions and related-links. */
export async function getSanitySolutions(fetchFn = fetch) {
	const docs = await sanityQuery(
		`*[_type == "solutionPage" && !(_id in path("drafts.**"))] | order(isPillar desc, priority asc) ${SOLUTION_PROJECTION}`,
		{},
		fetchFn
	);
	return docs || [];
}
