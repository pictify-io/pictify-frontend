/**
 * Dynamic OG Image URL generators for pSEO pages
 *
 * These functions generate OG image URLs using Pictify's own API,
 * creating dynamic, content-specific preview images for each page type.
 */

const BASE_URL = 'https://pictify.io';
const API_BASE = 'https://api.pictify.io';

// Fallback static OG image
export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image-tools.jpg`;

/**
 * Generate OG image URL for a use case page
 * @param {string} useCaseId - The use case ID (e.g., 'og-image', 'youtube-thumbnail')
 * @param {string} label - The display label for the use case
 * @returns {string} OG image URL
 */
export function getUseCaseOgImage(useCaseId, label) {
	const params = new URLSearchParams({
		title: label,
		subtitle: 'Free Online Tool',
		badge: 'PICTIFY',
		accent: '#ff6b6b',
		bg: '#FFFDF8'
	});
	return `${API_BASE}/og/usecase?${params.toString()}`;
}

/**
 * Generate OG image URL for a template category page
 * @param {string} categoryId - The category ID
 * @param {string} label - The display label
 * @returns {string} OG image URL
 */
export function getTemplateCategoryOgImage(categoryId, label) {
	const params = new URLSearchParams({
		title: `${label} Templates`,
		subtitle: 'Professional Templates for Every Need',
		badge: 'TEMPLATES',
		accent: '#ffc480',
		bg: '#FFFDF8'
	});
	return `${API_BASE}/og/category?${params.toString()}`;
}

/**
 * Generate OG image URL for a comparison page
 * @param {string} competitor - The competitor name
 * @returns {string} OG image URL
 */
export function getComparisonOgImage(competitor) {
	const params = new URLSearchParams({
		title: `Pictify vs ${competitor}`,
		subtitle: 'Feature Comparison',
		badge: 'COMPARE',
		accent: '#4ade80',
		bg: '#FFFDF8'
	});
	return `${API_BASE}/og/compare?${params.toString()}`;
}

/**
 * Generate OG image URL for a glossary term page
 * @param {string} termTitle - The term title
 * @returns {string} OG image URL
 */
export function getGlossaryOgImage(termTitle) {
	const params = new URLSearchParams({
		title: termTitle,
		subtitle: 'Image Generation Glossary',
		badge: 'DEFINITION',
		accent: '#6366f1',
		bg: '#FFFDF8'
	});
	return `${API_BASE}/og/glossary?${params.toString()}`;
}

/**
 * Generate OG image URL for an integration page
 * @param {string} integrationName - The integration name
 * @param {string} categoryLabel - The category label
 * @returns {string} OG image URL
 */
export function getIntegrationOgImage(integrationName, categoryLabel) {
	const params = new URLSearchParams({
		title: `${integrationName} + Pictify`,
		subtitle: categoryLabel || 'Integration',
		badge: 'INTEGRATION',
		accent: '#0ea5e9',
		bg: '#FFFDF8'
	});
	return `${API_BASE}/og/integration?${params.toString()}`;
}

/**
 * Generate OG image URL for a persona page
 * @param {string} personaTitle - The persona title
 * @returns {string} OG image URL
 */
export function getPersonaOgImage(personaTitle) {
	const params = new URLSearchParams({
		title: personaTitle,
		subtitle: 'Image Generation at Scale',
		badge: 'FOR YOU',
		accent: '#ff6b6b',
		bg: '#FFFDF8'
	});
	return `${API_BASE}/og/persona?${params.toString()}`;
}

/**
 * Generate OG image URL for a tool page with dimensions
 * @param {string} format - The output format (png, jpg, etc.)
 * @param {string} size - The dimensions (e.g., '1200x630')
 * @returns {string} OG image URL
 */
export function getToolOgImage(format, size) {
	const title = size
		? `HTML to ${format.toUpperCase()} · ${size}`
		: `HTML to ${format.toUpperCase()}`;

	const params = new URLSearchParams({
		title,
		subtitle: 'Convert HTML to Images',
		badge: 'TOOL',
		accent: '#ff6b6b',
		bg: '#FFFDF8'
	});
	return `${API_BASE}/og/tool?${params.toString()}`;
}

/**
 * Generate a generic OG image with custom parameters
 * @param {Object} options - Configuration options
 * @param {string} options.title - Main title
 * @param {string} options.subtitle - Subtitle text
 * @param {string} options.badge - Badge text (optional)
 * @param {string} options.accent - Accent color (optional)
 * @param {string} options.bg - Background color (optional)
 * @returns {string} OG image URL
 */
export function getCustomOgImage({
	title,
	subtitle,
	badge = 'PICTIFY',
	accent = '#ff6b6b',
	bg = '#FFFDF8'
}) {
	const params = new URLSearchParams({
		title,
		subtitle,
		badge,
		accent,
		bg
	});
	return `${API_BASE}/og/custom?${params.toString()}`;
}

/**
 * Helper to get OG image with fallback
 * Uses the dynamic URL if available, falls back to static image
 * @param {Function} generator - OG image generator function
 * @param {...any} args - Arguments for the generator
 * @returns {string} OG image URL
 */
export function getOgImageWithFallback(generator, ...args) {
	try {
		const url = generator(...args);
		return url || DEFAULT_OG_IMAGE;
	} catch {
		return DEFAULT_OG_IMAGE;
	}
}
