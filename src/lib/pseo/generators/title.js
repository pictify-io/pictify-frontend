/**
 * Title Pattern Generator
 * Generates unique, SEO-optimized titles for different page types
 */

/**
 * Title patterns with variations to avoid duplication
 * Each pattern has a base and variations
 */
const titlePatterns = {
	useCase: [
		'{label} - Free Online Tool | Pictify',
		'{label} | Generate Images from HTML | Pictify',
		'{label} Tool - HTML to Image API | Pictify',
		'Create {label} with HTML to Image | Pictify'
	],

	tool: [
		'HTML to {format} Converter - Free Online Tool | Pictify',
		'Convert HTML to {format} - Free Image Generator | Pictify',
		'HTML to {format} Online - Generate Images from Code | Pictify',
		'{format} from HTML - Free Converter Tool | Pictify'
	],

	toolDimension: [
		'HTML to {format} {dimensions} - Free Converter | Pictify',
		'{dimensions} {format} from HTML - Generator Tool | Pictify',
		'Convert HTML to {dimensions} {format} | Pictify',
		'Generate {dimensions} {format} Images from HTML | Pictify'
	],

	comparison: [
		'{competitor} vs Pictify ({year}) - Honest Comparison',
		'Pictify vs {competitor} - Which Is Better in {year}?',
		'{competitor} Alternative: Why Teams Choose Pictify ({year})',
		'Compare {competitor} and Pictify ({year}) | Pictify'
	],

	glossary: [
		'{title} - Definition & Examples | Pictify Glossary',
		'What is {title}? | Image Generation Glossary',
		'{title} Explained | Pictify Glossary',
		'Understanding {title} | Pictify'
	],

	integration: [
		'{name} Integration | Automate Image Generation | Pictify',
		'Connect Pictify with {name} | Integration Guide',
		'{name} + Pictify - Automated Image Generation',
		'Pictify {name} Integration | Generate Images Automatically'
	],

	persona: [
		'Pictify for {persona} - HTML to Image API',
		'Image Generation for {persona} | Pictify',
		'{persona}: Create Images at Scale | Pictify',
		'HTML to Image API for {persona} | Pictify'
	],

	ogPlatform: [
		'OG Image Generator for {platform} | Pictify',
		'{platform} OG Images - Free Generator | Pictify',
		'Create Open Graph Images for {platform} | Pictify',
		'{platform} Social Preview Generator | Pictify'
	]
};

/**
 * Generate a unique title for a page
 * @param {string} pageType - Type of page
 * @param {Object} data - Data for interpolation
 * @param {number} [variationIndex] - Specific variation to use (0-based)
 * @returns {string} Generated title
 */
export function generateTitle(pageType, data, variationIndex = 0) {
	const patterns = titlePatterns[pageType];
	if (!patterns) {
		return data.title || data.label || data.name || 'Pictify';
	}

	// Select pattern based on variation index (wraps around)
	const pattern = patterns[variationIndex % patterns.length];

	// Add current year to data
	const enrichedData = {
		...data,
		year: data.year || new Date().getFullYear()
	};

	return interpolate(pattern, enrichedData);
}

/**
 * Generate title with automatic variation based on page data
 * Uses a hash of the page identifier for consistent variation
 * @param {string} pageType - Type of page
 * @param {Object} data - Data for interpolation
 * @returns {string} Generated title
 */
export function generateUniqueTitle(pageType, data) {
	const identifier = data.id || data.slug || data.term || data.name || '';
	const variationIndex = hashString(identifier);
	return generateTitle(pageType, data, variationIndex);
}

/**
 * Get all title variations for a page type (for testing/preview)
 * @param {string} pageType - Type of page
 * @param {Object} data - Data for interpolation
 * @returns {string[]} Array of all possible titles
 */
export function getAllTitleVariations(pageType, data) {
	const patterns = titlePatterns[pageType];
	if (!patterns) return [];

	const enrichedData = {
		...data,
		year: data.year || new Date().getFullYear()
	};

	return patterns.map(pattern => interpolate(pattern, enrichedData));
}

/**
 * Simple string interpolation
 * @param {string} template - Template with {placeholders}
 * @param {Object} data - Data for interpolation
 * @returns {string} Interpolated string
 */
function interpolate(template, data) {
	return template.replace(/\{(\w+)\}/g, (match, key) => {
		return data[key] !== undefined ? data[key] : match;
	});
}

/**
 * Simple hash function for consistent variation selection
 * @param {string} str - String to hash
 * @returns {number} Hash value (non-negative integer)
 */
function hashString(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}
