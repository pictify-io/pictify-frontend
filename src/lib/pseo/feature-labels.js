/**
 * Human labels for the capability keys in `comparisons.js` / Sanity.
 *
 * Every comparison scores both products 1–5 across its own set of keys, and
 * there are 50-odd of them across all competitors. Rather than a hand-written
 * map that silently falls out of date the moment someone adds a key in the CMS,
 * this de-camel-cases whatever it is given and fixes the words that a naive
 * split gets wrong — acronyms, product names, hyphenated terms.
 *
 * The fallback is always readable, so a brand-new key renders as a sensible
 * label instead of an empty cell.
 */

/** Words a plain de-camel-case would render with the wrong casing. */
const CASINGS = {
	api: 'API',
	cdn: 'CDN',
	css: 'CSS',
	html: 'HTML',
	pdf: 'PDF',
	og: 'OG',
	s3: 'S3',
	url: 'URL',
	ai: 'AI',
	seo: 'SEO',
	figma: 'Figma',
	canva: 'Canva',
	zapier: 'Zapier'
};

/** Keys whose plain reading would be accurate but clumsy. */
const OVERRIDES = {
	htmlToImage: 'HTML to image rendering',
	templateEditor: 'Template editor with typed variables',
	aiTemplates: 'AI template generation',
	multiPagePdf: 'Multi-page PDF',
	setupTime: 'Time to first render',
	useCaseVariety: 'Range of use cases',
	pricing: 'Price at volume'
};

export function featureLabel(key) {
	if (!key) return '';
	if (OVERRIDES[key]) return OVERRIDES[key];

	const words = String(key)
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.split(/\s+/)
		.filter(Boolean);

	return words
		.map((word, index) => {
			const lower = word.toLowerCase();
			if (CASINGS[lower]) return CASINGS[lower];
			if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
			return lower;
		})
		.join(' ');
}
