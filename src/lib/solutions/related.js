/**
 * Registry of /solutions/* pages. Single source of truth for sibling cross-links,
 * the Nav dropdown, and the solutions sitemap. Adding a new solution page means
 * adding one entry here — every consumer picks it up automatically.
 *
 * Fields:
 *   slug      — URL path segment after /solutions/
 *   label     — breadcrumb label + Nav dropdown text
 *   keyword   — primary target keyword (for docs + SEO audits)
 *   summary   — 1-line description used in Related-solutions blocks
 *   priority  — 'pillar' | 'p0' | 'p1' | 'p2' | 'p3' — controls Nav dropdown order
 *   isPillar  — true for the top-of-cluster page
 *
 * See plan: docs/plans/2026-04-15-003-strategy-automated-images-cluster-plan.md
 */

export const solutions = [
	{
		slug: 'automated-image-generation',
		label: 'Automated Image Generation',
		keyword: 'automated images',
		summary:
			'The complete guide to automating image creation — templates, APIs, expressions, and live data bindings.',
		priority: 'pillar',
		isPillar: true
	},
	{
		slug: 'image-generation-api',
		label: 'Image Generation API',
		keyword: 'image generation api',
		summary:
			'Render images from templates + variables via a single HTTP call. Curl, Node, Python code in every doc.',
		priority: 'p0'
	},
	{
		slug: 'automate-product-images',
		label: 'Automate Product Images',
		keyword: 'automate product images',
		summary:
			'Render catalog-scale product cards, seasonal variants, and inventory-aware banners from one template.',
		priority: 'p1'
	},
	{
		slug: 'automate-social-media-images',
		label: 'Automate Social Media Images',
		keyword: 'automate social media images',
		summary:
			'Personalized social cards at scale — one template, thousands of variants, zero manual design work.',
		priority: 'p1'
	},
	{
		slug: 'automate-og-images',
		label: 'Automate OG Images',
		keyword: 'automate og images',
		summary:
			'Dynamic Open Graph images for every blog post, product, or page — rendered on-demand from your data.',
		priority: 'p1'
	},
	{
		slug: 'bulk-image-generation',
		label: 'Bulk Image Generation',
		keyword: 'bulk image generation',
		summary:
			'Generate thousands of images from a spreadsheet, CSV, or JSON batch with async jobs and webhooks.',
		priority: 'p1'
	},
	{
		slug: 'dynamic-image-generation',
		label: 'Dynamic Image Generation',
		keyword: 'dynamic image generation',
		summary:
			'Images that change based on the request — user context, product state, time of day, anything you can bind.',
		priority: 'p2'
	},
	{
		slug: 'generate-images-from-data',
		label: 'Generate Images from Data',
		keyword: 'generate images from data',
		summary:
			'Bind templates to Google Sheets, HTTP endpoints, or webhooks. When data changes, images follow.',
		priority: 'p2'
	},
	{
		slug: 'personalized-images-at-scale',
		label: 'Personalized Images at Scale',
		keyword: 'personalized images at scale',
		summary:
			'One template × N users = N personalized images. Powers lifecycle emails, in-app onboarding, and ads.',
		priority: 'p2'
	},
	{
		slug: 'automate-marketing-images',
		label: 'Automate Marketing Images',
		keyword: 'automate marketing images',
		summary:
			'Scale your marketing visuals without scaling the design team. Campaign variants, landing pages, ad creatives.',
		priority: 'p2'
	},
	{
		slug: 'automate-email-headers',
		label: 'Automate Email Headers',
		keyword: 'automated email images',
		summary:
			'Personalized email header images generated per-recipient — higher open rates, zero manual work.',
		priority: 'p3'
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
