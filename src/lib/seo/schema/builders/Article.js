/**
 * Article Schema Builder
 * Generates Article schema for blog posts, comparisons, and content pages
 */

import { BASE_URL, SITE_NAME } from '../../metadata/templates.js';

/**
 * @typedef {Object} ArticleData
 * @property {string} headline - Article headline/title
 * @property {string} description - Article description/excerpt
 * @property {string} url - Full URL to the article
 * @property {string} [image] - URL to article image
 * @property {string} [datePublished] - ISO date published
 * @property {string} [dateModified] - ISO date modified
 * @property {string} [authorName] - Author name
 * @property {string[]} [keywords] - Article keywords
 */

/**
 * Build Article schema
 * @param {ArticleData} data - Article data
 * @returns {Object} Article schema
 */
export function buildArticleSchema(data) {
	const schema = {
		'@type': 'Article',
		headline: data.headline,
		description: data.description,
		url: data.url,
		author: {
			'@type': 'Organization',
			name: data.authorName || SITE_NAME,
			url: BASE_URL
		},
		publisher: {
			'@type': 'Organization',
			name: SITE_NAME,
			url: BASE_URL,
			logo: {
				'@type': 'ImageObject',
				url: `${BASE_URL}/logo.png`
			}
		}
	};

	// Optional fields
	if (data.image) {
		schema.image = {
			'@type': 'ImageObject',
			url: data.image
		};
	}

	if (data.datePublished) {
		schema.datePublished = data.datePublished;
	}

	if (data.dateModified) {
		schema.dateModified = data.dateModified;
	}

	if (data.keywords && data.keywords.length > 0) {
		schema.keywords = data.keywords.join(', ');
	}

	return schema;
}

/**
 * Build TechArticle schema (for technical/how-to content)
 * @param {ArticleData} data - Article data
 * @returns {Object} TechArticle schema
 */
export function buildTechArticleSchema(data) {
	return {
		...buildArticleSchema(data),
		'@type': 'TechArticle'
	};
}

/**
 * Build comparison article schema with additional metadata
 * @param {Object} comparison - Comparison data
 * @returns {Object} Article schema for comparison
 */
export function buildComparisonArticleSchema(comparison) {
	const today = new Date().toISOString().slice(0, 10);

	return buildArticleSchema({
		headline: comparison.title,
		description: comparison.metaDescription,
		url: `${BASE_URL}/compare/${comparison.slug}`,
		datePublished: comparison.datePublished || today,
		dateModified: today,
		keywords: [
			`${comparison.competitor} alternative`,
			`pictify vs ${comparison.competitor}`,
			'html to image comparison'
		]
	});
}
