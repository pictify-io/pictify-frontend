/**
 * WebApplication Schema Builder
 * Generates SoftwareApplication/WebApplication schema for tool pages
 */

import { BASE_URL, SITE_NAME } from '../../metadata/templates.js';

/**
 * @typedef {Object} WebAppData
 * @property {string} name - Application/tool name
 * @property {string} description - Tool description
 * @property {string} url - Tool URL
 * @property {string} [category] - Application category
 * @property {Object} [offers] - Pricing offers
 * @property {string[]} [features] - Feature list
 */

/**
 * Build SoftwareApplication schema for tools
 * @param {WebAppData} data - Tool data
 * @returns {Object} SoftwareApplication schema
 */
export function buildWebApplicationSchema(data) {
	return {
		'@type': 'SoftwareApplication',
		name: data.name,
		description: data.description,
		url: data.url,
		applicationCategory: data.category || 'DesignApplication',
		operatingSystem: 'Web',
		offers: data.offers || {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock',
			description: 'Free tier available'
		},
		provider: {
			'@type': 'Organization',
			name: SITE_NAME,
			url: BASE_URL
		}
	};
}

/**
 * Build schema for HTML to image converter tools
 * @param {string} format - Output format (png, jpg, webp)
 * @param {string} [dimensions] - Optional dimensions (e.g., "1200x630")
 * @returns {Object} SoftwareApplication schema
 */
export function buildConverterToolSchema(format, dimensions = null) {
	const formatUpper = typeof format === 'string' ? format.toUpperCase() : 'IMAGE';
	const formatLower = typeof format === 'string' ? format.toLowerCase() : 'image';
	const name = dimensions
		? `HTML to ${formatUpper} ${dimensions} Converter`
		: `HTML to ${formatUpper} Converter`;

	const description = dimensions
		? `Convert HTML to ${formatUpper} images at ${dimensions} resolution. Free online tool with API access.`
		: `Convert HTML to ${formatUpper} images instantly. Free online converter with API access for automation.`;

	const url = dimensions
		? `${BASE_URL}/tools/html-to-${formatLower}/${dimensions}`
		: `${BASE_URL}/tools/html-to-${formatLower}`;

	return buildWebApplicationSchema({
		name,
		description,
		url,
		category: 'MultimediaApplication'
	});
}

/**
 * Build schema for OG Image Generator
 * @param {Object} [platform] - Optional platform data
 * @returns {Object} SoftwareApplication schema
 */
export function buildOGImageGeneratorSchema(platform = null) {
	const name = platform ? `OG Image Generator for ${platform.name}` : 'OG Image Generator';

	const description = platform
		? `Generate optimized OG images for ${platform.name}. Recommended size: ${
				platform.recommendedSize || '1200x630'
		  }.`
		: 'Generate beautiful Open Graph images for social media. Free online tool with API access.';

	const url = platform
		? `${BASE_URL}/tools/og-image-generator/${platform.id}`
		: `${BASE_URL}/tools/og-image-generator`;

	return buildWebApplicationSchema({
		name,
		description,
		url,
		category: 'DesignApplication'
	});
}

/**
 * Build schema for general use case tools
 * @param {Object} useCase - Use case data
 * @returns {Object} SoftwareApplication schema
 */
export function buildUseCaseToolSchema(useCase) {
	return buildWebApplicationSchema({
		name: useCase.label || useCase.name,
		description: useCase.description,
		url: `${BASE_URL}/tools/${useCase.id}`,
		category: 'DesignApplication'
	});
}

/**
 * Build WebPage schema with software application context
 * @param {Object} pageData - Page data
 * @returns {Object} WebPage schema
 */
export function buildToolPageSchema(pageData) {
	return {
		'@type': 'WebPage',
		name: pageData.title,
		description: pageData.description,
		url: pageData.url,
		isPartOf: {
			'@id': `${BASE_URL}/#website`
		},
		about: buildWebApplicationSchema({
			name: pageData.toolName || pageData.title,
			description: pageData.description,
			url: pageData.url
		})
	};
}
