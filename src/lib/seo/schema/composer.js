/**
 * Schema.org JSON-LD Composer
 * Composes multiple schema objects into a single @graph structure
 */

import { BASE_URL, SITE_NAME } from '../metadata/templates.js';

/**
 * Compose multiple schema objects into a single @graph JSON-LD
 * @param {Array<Object|null>} schemas - Array of schema objects (nulls are filtered)
 * @returns {Object|null} Composed schema with @graph, or null if no valid schemas
 */
export function composeSchema(schemas) {
	const valid = schemas.filter(Boolean);
	if (valid.length === 0) return null;

	// If only one schema, return it directly
	if (valid.length === 1) {
		return {
			'@context': 'https://schema.org',
			...valid[0]
		};
	}

	// Multiple schemas - use @graph
	return {
		'@context': 'https://schema.org',
		'@graph': valid
	};
}

/**
 * Create the Organization schema for Pictify (used across all pages)
 * @returns {Object} Organization schema
 */
export function createOrganizationSchema() {
	return {
		'@type': 'Organization',
		'@id': `${BASE_URL}/#organization`,
		name: SITE_NAME,
		url: BASE_URL,
		logo: {
			'@type': 'ImageObject',
			url: `${BASE_URL}/logo.png`,
			width: 512,
			height: 512
		},
		sameAs: ['https://twitter.com/pictifyio', 'https://github.com/pictify']
	};
}

/**
 * Create the WebSite schema (for homepage and site-wide)
 * @returns {Object} WebSite schema
 */
export function createWebSiteSchema() {
	return {
		'@type': 'WebSite',
		'@id': `${BASE_URL}/#website`,
		url: BASE_URL,
		name: SITE_NAME,
		publisher: {
			'@id': `${BASE_URL}/#organization`
		},
		potentialAction: {
			'@type': 'SearchAction',
			target: `${BASE_URL}/search?q={search_term_string}`,
			'query-input': 'required name=search_term_string'
		}
	};
}

/**
 * Create the SoftwareApplication schema for Pictify
 * @returns {Object} SoftwareApplication schema
 */
export function createSoftwareApplicationSchema() {
	return {
		'@type': 'SoftwareApplication',
		name: SITE_NAME,
		applicationCategory: 'DesignApplication',
		operatingSystem: 'Web',
		url: BASE_URL,
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			description: 'Free tier available'
		},
		aggregateRating: {
			'@type': 'AggregateRating',
			ratingValue: '4.8',
			ratingCount: '150',
			bestRating: '5'
		}
	};
}

/**
 * Serialize schema to JSON-LD string for embedding in HTML
 * @param {Object} schema - Schema object
 * @returns {string} JSON string safe for HTML embedding
 */
export function serializeSchema(schema) {
	if (!schema) return '';
	return JSON.stringify(schema, null, 0)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026');
}
