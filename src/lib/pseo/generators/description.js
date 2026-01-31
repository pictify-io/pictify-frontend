/**
 * Meta Description Generator
 * Generates unique, SEO-optimized meta descriptions for different page types
 */

/**
 * Description patterns with variations
 * Each pattern designed to be under 160 characters when interpolated
 */
const descriptionPatterns = {
	useCase: [
		'{description} Design once, render via API. Free to start.',
		'{description} Generate images programmatically. No design skills needed.',
		'{description} Create images at scale with HTML/CSS. Try free.',
		'{description} Automate image creation with our API.'
	],

	tool: [
		'Convert HTML to {format} images instantly. Free online {format} converter with API access for automation.',
		'Generate {format} images from HTML/CSS. Free converter tool with API support for developers.',
		'Free HTML to {format} converter. Create images programmatically or use our online tool.',
		'Transform HTML into {format} images. Simple API, free tier available. Perfect for social media.'
	],

	toolDimension: [
		'Generate {dimensions} {format} images from HTML. Perfect for {context}. Free online tool with API.',
		'Create {dimensions} {format} images. Optimized for {context}. Free converter with API access.',
		'Convert HTML to {dimensions} {format}. Ideal for {context}. Free tool, no signup required.',
		'{dimensions} {format} generator from HTML/CSS. Built for {context}. API available.'
	],

	comparison: [
		'Compare Pictify vs {competitor}. Pricing, features, and why teams switch. Updated {year}.',
		'Pictify vs {competitor}: See the difference. Honest comparison for {year}.',
		'{competitor} alternative? Compare features and pricing with Pictify. {year} guide.',
		'Detailed {competitor} vs Pictify comparison. Make an informed choice. {year}.'
	],

	glossary: [
		'{shortDefinition} Learn how it applies to image generation and APIs.',
		'{shortDefinition} Practical examples and usage in image automation.',
		'{shortDefinition} See how Pictify implements this concept.',
		'{shortDefinition} A complete guide for developers and marketers.'
	],

	integration: [
		'Connect Pictify with {name}. {categoryDesc} Set up automated image generation in minutes.',
		'Integrate {name} with Pictify. {categoryDesc} Automate your image workflows.',
		'{name} + Pictify integration. {categoryDesc} Generate images automatically.',
		'Automate image generation with {name} and Pictify. {categoryDesc}'
	],

	persona: [
		'Pictify for {persona}. {description} Create images at scale with our HTML to image API.',
		'HTML to image API for {persona}. {description} Design once, render via API.',
		'Image generation built for {persona}. {description} Start free today.',
		'{persona} love Pictify. {description} Scale your image creation.'
	],

	ogPlatform: [
		'Generate perfect OG images for {platform}. Recommended size: {size}. Free tool with setup guide.',
		'Create Open Graph images for {platform}. Optimized for {size}. Free online generator.',
		'{platform} OG image generator. {size} recommended. Free tool, API access available.',
		'Social preview images for {platform}. {size} format. Free generator with {platform} guide.'
	]
};

/**
 * Context mappings for dimension-specific descriptions
 */
const dimensionContexts = {
	'1200x630': 'OG images, social previews, link shares',
	'1200x628': 'Facebook posts, LinkedIn articles',
	'1080x1080': 'Instagram posts, social media squares',
	'1080x1350': 'Instagram portraits, Pinterest pins',
	'1920x1080': 'video thumbnails, presentations, HD displays',
	'800x600': 'email headers, blog images',
	'600x315': 'Facebook thumbnails, compact previews',
	'1500x500': 'Twitter headers, LinkedIn banners',
	'1584x396': 'LinkedIn profile banners',
	'400x400': 'profile pictures, avatars',
	'768x1024': 'iPad screenshots, tablet displays'
};

/**
 * Category descriptions for integrations
 */
const integrationCategoryDescriptions = {
	automation: 'Automate workflows with no-code tools.',
	sdk: 'Native SDK integration for developers.',
	frameworks: 'Framework integration for modern stacks.',
	cms: 'CMS integration for content management.',
	ecommerce: 'E-commerce integration for product images.'
};

/**
 * Generate a unique meta description for a page
 * @param {string} pageType - Type of page
 * @param {Object} data - Data for interpolation
 * @param {number} [variationIndex] - Specific variation to use
 * @returns {string} Generated description (max 160 chars)
 */
export function generateDescription(pageType, data, variationIndex = 0) {
	const patterns = descriptionPatterns[pageType];
	if (!patterns) {
		return data.description || data.shortDefinition || '';
	}

	const pattern = patterns[variationIndex % patterns.length];

	// Enrich data with computed values
	const enrichedData = {
		...data,
		year: data.year || new Date().getFullYear(),
		context: data.context || getDimensionContext(data.dimensions),
		categoryDesc: data.categoryDesc || getIntegrationCategoryDesc(data.category),
		size: data.size || data.recommendedSize || '1200x630'
	};

	const description = interpolate(pattern, enrichedData);

	// Truncate to 160 characters
	return truncate(description, 160);
}

/**
 * Generate description with automatic variation based on identifier
 * @param {string} pageType - Type of page
 * @param {Object} data - Data for interpolation
 * @returns {string} Generated description
 */
export function generateUniqueDescription(pageType, data) {
	const identifier = data.id || data.slug || data.term || data.name || '';
	const variationIndex = hashString(identifier);
	return generateDescription(pageType, data, variationIndex);
}

/**
 * Get context text for a dimension
 * @param {string} dimensions - Dimension string (e.g., "1200x630")
 * @returns {string} Context description
 */
function getDimensionContext(dimensions) {
	return dimensionContexts[dimensions] || 'various applications';
}

/**
 * Get category description for integrations
 * @param {string} category - Integration category
 * @returns {string} Category description
 */
function getIntegrationCategoryDesc(category) {
	return integrationCategoryDescriptions[category] || '';
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
 * Truncate string to max length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncate(str, maxLength) {
	if (str.length <= maxLength) return str;
	return str.slice(0, maxLength - 3).trim() + '...';
}

/**
 * Simple hash function for consistent variation selection
 * @param {string} str - String to hash
 * @returns {number} Hash value
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
