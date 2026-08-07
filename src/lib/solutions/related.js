/**
 * Registry of /solutions/* pages. Single source of truth for sibling cross-links
 * and the solutions sitemap. Adding a new solution page means adding one entry
 * here — every consumer picks it up automatically.
 *
 * 2026-08 repositioning: the image-automation cluster (automated-image-generation
 * pillar + 10 supporting pages) was purged — near-zero clicks over 3 months and
 * off-positioning after the workflows pivot. Old URLs 301 in hooks.server.js.
 * This cluster now targets the document-delivery wedge.
 *
 * Fields:
 *   slug      — URL path segment after /solutions/
 *   label     — breadcrumb label + cross-link text
 *   keyword   — primary target keyword (for docs + SEO audits)
 *   summary   — 1-line description used in Related-solutions blocks
 *   priority  — 'pillar' | 'p0' | 'p1' | 'p2' | 'p3'
 *   isPillar  — true for the top-of-cluster page
 */

export const solutions = [
	{
		slug: 'mail-merge-with-attachments',
		label: 'Mail Merge with Attachments',
		keyword: 'mail merge with attachments',
		summary:
			'Word mail merge cannot attach the file. Generate a personalized PDF per row and email it to each recipient with per-person delivery status.',
		priority: 'pillar',
		isPillar: true
	}
];

/**
 * Return up to `limit` sibling solutions for the current page (excluding itself).
 * Prefers pages of the same or higher priority tier; falls back to any sibling.
 */
export function getRelatedSolutions(currentSlug, limit = 3) {
	const me = solutions.find((s) => s.slug === currentSlug);
	const others = solutions.filter((s) => s.slug !== currentSlug);
	if (!me) return others.slice(0, limit);
	// Bubble the pillar first when current page isn't the pillar.
	const withPillarFirst = [
		...others.filter((s) => s.isPillar),
		...others.filter((s) => !s.isPillar)
	];
	return withPillarFirst.slice(0, limit);
}

export function getPillar() {
	return solutions.find((s) => s.isPillar);
}

/** Slugs whose pages exist — used by the sitemap generator and Nav. */
export function publishedSolutions() {
	return solutions.filter((s) => !s.draft);
}
