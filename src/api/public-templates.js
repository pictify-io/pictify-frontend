/**
 * Public Templates API
 *
 * API functions for public template gallery and shared results
 */

import backend from '../service/backend';

/**
 * Get list of public templates with filters and pagination
 * @param {Object} options - Filter and pagination options
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.type] - Filter by type
 * @param {string} [options.tag] - Filter by tag
 * @param {string} [options.search] - Search query
 * @param {string} [options.sort] - Sort order: 'featured', 'popular', 'newest'
 * @param {number} [options.page] - Page number (default: 1)
 * @param {number} [options.limit] - Items per page (default: 12)
 */
export async function getPublicTemplates(options = {}) {
	const params = {};

	if (options.category) params.category = options.category;
	if (options.type) params.type = options.type;
	if (options.tag) params.tag = options.tag;
	if (options.search) params.search = options.search;
	if (options.sort) params.sort = options.sort;
	if (options.page) params.page = options.page;
	if (options.limit) params.limit = options.limit;

	return backend.get('/public/templates', { params });
}

/**
 * Get a single public template by UID
 * @param {string} uid - Template UID
 */
export async function getPublicTemplate(uid) {
	return backend.get(`/public/templates/${uid}`);
}

/**
 * Fork a public template into user's account
 * @param {string} uid - Template UID to fork
 */
export async function forkTemplate(uid) {
	return backend.post(`/public/templates/${uid}/fork`);
}

/**
 * Create a shareable result page
 * @param {Object} data - Result data
 * @param {string} data.assetUrl - URL to the generated asset
 * @param {string} data.contentType - 'image' or 'gif'
 * @param {number} [data.width] - Width in pixels
 * @param {number} [data.height] - Height in pixels
 * @param {string} [data.format] - Format (png, jpg, webp, gif)
 * @param {string} [data.source] - Source: 'tool', 'template', 'api', 'dashboard'
 * @param {string} [data.toolName] - Name of tool used
 * @param {string} [data.templateUid] - Template UID if from template
 * @param {string} [data.assetId] - Original asset ID
 * @param {string} [data.title] - Optional title
 */
export async function createShareResult(data) {
	return backend.post('/public/results', data);
}

/**
 * Get a shared result by UID
 * @param {string} uid - Result UID
 */
export async function getShareResult(uid) {
	return backend.get(`/public/results/${uid}`);
}
