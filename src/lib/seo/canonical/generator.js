/**
 * Canonical URL Generator
 * Rules for generating canonical URLs to prevent duplicate content
 */

import { BASE_URL } from '../metadata/templates.js';

/**
 * Generate canonical URL for a given path
 * @param {string} pathname - URL pathname
 * @returns {string} Full canonical URL
 */
export function generateCanonical(pathname) {
	// Ensure path starts with /
	const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

	// Remove trailing slash (except for root)
	const normalizedPath = cleanPath === '/' ? cleanPath : cleanPath.replace(/\/$/, '');

	// Remove query parameters and hash
	const pathOnly = normalizedPath.split('?')[0].split('#')[0];

	return `${BASE_URL}${pathOnly}`;
}

/**
 * Check if a path should have a canonical pointing elsewhere
 * (for handling parameter variations, pagination, etc.)
 * @param {string} pathname - URL pathname
 * @param {Object} params - URL parameters
 * @returns {string|null} Canonical URL if different from current, null otherwise
 */
export function getCanonicalOverride(pathname, params = {}) {
	// Handle pagination - canonical should point to page 1
	if (params.page && parseInt(params.page) > 1) {
		return generateCanonical(pathname);
	}

	// Handle sort/filter params - canonical should point to unfiltered
	const filterParams = ['sort', 'filter', 'order', 'q'];
	const hasFilterParams = filterParams.some((p) => params[p]);
	if (hasFilterParams) {
		return generateCanonical(pathname);
	}

	return null;
}

/**
 * Generate canonical URL for tool dimension pages
 * Ensures consistent URL format for dimension variants
 * @param {string} format - Format (png, jpg, webp)
 * @param {string} dimensions - Dimensions string
 * @returns {string} Canonical URL
 */
export function generateToolDimensionCanonical(format, dimensions) {
	// Normalize dimensions format (e.g., "1200x630" not "1200X630")
	const normalizedDimensions = dimensions.toLowerCase();
	return `${BASE_URL}/tools/html-to-${format.toLowerCase()}/${normalizedDimensions}`;
}

/**
 * Generate canonical URL for comparison pages
 * @param {string} slug - Comparison slug
 * @returns {string} Canonical URL
 */
export function generateComparisonCanonical(slug) {
	// Ensure slug format is "pictify-vs-competitor"
	const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-');
	return `${BASE_URL}/compare/${normalizedSlug}`;
}

/**
 * Generate canonical URL for glossary terms
 * @param {string} term - Term slug
 * @returns {string} Canonical URL
 */
export function generateGlossaryCanonical(term) {
	const normalizedTerm = term.toLowerCase().replace(/\s+/g, '-');
	return `${BASE_URL}/glossary/${normalizedTerm}`;
}

/**
 * Generate canonical URL for integration pages
 * @param {string} slug - Integration slug
 * @returns {string} Canonical URL
 */
export function generateIntegrationCanonical(slug) {
	return `${BASE_URL}/integrations/${slug.toLowerCase()}`;
}

/**
 * Generate canonical URL for template pages
 * @param {string} uid - Template UID
 * @returns {string} Canonical URL
 */
export function generateTemplateCanonical(uid) {
	return `${BASE_URL}/templates/${uid}`;
}

/**
 * Generate canonical URL for template category pages
 * @param {string} categoryId - Category ID
 * @returns {string} Canonical URL
 */
export function generateTemplateCategoryCanonical(categoryId) {
	return `${BASE_URL}/templates/category/${categoryId.toLowerCase()}`;
}

/**
 * Generate canonical URL for persona pages
 * @param {string} slug - Persona slug
 * @returns {string} Canonical URL
 */
export function generatePersonaCanonical(slug) {
	return `${BASE_URL}/for/${slug.toLowerCase()}`;
}

/**
 * Generate canonical URL for blog posts
 * @param {string} slug - Blog post slug
 * @returns {string} Canonical URL
 */
export function generateBlogCanonical(slug) {
	return `${BASE_URL}/blogs/${slug}`;
}
