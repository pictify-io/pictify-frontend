/**
 * OG Image URL Map
 *
 * Generated via Pictify API using the brand template in ./template.js
 * Each page type has a unique, branded 1200×630 OG image.
 * For dynamic pages (usecase, glossary term, comparison, etc.),
 * fall back to the closest hub-level image.
 */

export const ogImages = {
	// ─── Static pages ───────────────────────────────────────
	home: 'https://media.pictify.io/v3g37-1775406808141.png',
	pricing: 'https://media.pictify.io/cmnij-1775406943351.png',

	// ─── Tools ──────────────────────────────────────────────
	toolsHub: 'https://media.pictify.io/qyl7z-1775406830860.png',
	htmlToFormat: 'https://media.pictify.io/gre6p-1775406841745.png',
	urlToImage: 'https://media.pictify.io/vombm-1775406853373.png',
	ogImageGenerator: 'https://media.pictify.io/31hxg-1775406864453.png',
	codeToImage: 'https://media.pictify.io/by55n-1775406886142.png',

	// ─── Content hubs ───────────────────────────────────────
	glossary: 'https://media.pictify.io/8ixg5-1775406897273.png',
	compare: 'https://media.pictify.io/qyw0z-1775406908773.png',
	integrations: 'https://media.pictify.io/fbap2-1775406920888.png',
	templates: 'https://media.pictify.io/x9rnt-1775406954406.png',

	// ─── Fallbacks for dynamic routes ───────────────────────
	// [usecase] pages, [persona] pages → toolsHub
	// [term] glossary pages → glossary
	// [slug] comparison pages → compare
	// [slug] integration pages → integrations
	// [category] / [uid] template pages → templates
};

/**
 * Get the OG image URL for a page type.
 * Falls back to the tools hub image if no specific image exists.
 * @param {string} pageType - Key from ogImages map
 * @returns {string} OG image URL
 */
export function getOgImage(pageType) {
	return ogImages[pageType] || ogImages.toolsHub;
}
