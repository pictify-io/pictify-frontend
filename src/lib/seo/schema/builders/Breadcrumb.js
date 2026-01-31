/**
 * Breadcrumb Schema Builder
 * Generates BreadcrumbList schema for navigation
 */

import { BASE_URL } from '../../metadata/templates.js';

/**
 * @typedef {Object} BreadcrumbItem
 * @property {string} label - Display label
 * @property {string} href - URL path (relative or absolute)
 */

/**
 * Build BreadcrumbList schema
 * @param {BreadcrumbItem[]} items - Array of breadcrumb items (excluding current page)
 * @param {string} [currentLabel] - Label for current page (not linked)
 * @returns {Object} BreadcrumbList schema
 */
export function buildBreadcrumbSchema(items, currentLabel = '') {
	const listItems = items.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		name: item.label,
		item: item.href.startsWith('http') ? item.href : `${BASE_URL}${item.href}`
	}));

	// Add current page as last item (without link)
	if (currentLabel) {
		listItems.push({
			'@type': 'ListItem',
			position: items.length + 1,
			name: currentLabel
		});
	}

	return {
		'@type': 'BreadcrumbList',
		itemListElement: listItems
	};
}

/**
 * Build breadcrumb items for common page types
 * @param {string} pageType - Type of page
 * @param {Object} pageData - Page-specific data
 * @returns {BreadcrumbItem[]} Array of breadcrumb items
 */
export function getBreadcrumbItems(pageType, pageData = {}) {
	const home = { label: 'Home', href: '/' };

	const breadcrumbMap = {
		// Tools section
		tool: [home, { label: 'Tools', href: '/tools' }],
		toolDimension: [
			home,
			{ label: 'Tools', href: '/tools' },
			{ label: `HTML to ${pageData.format || 'Image'}`, href: `/tools/html-to-${pageData.formatId || 'png'}` }
		],
		useCase: [home, { label: 'Tools', href: '/tools' }],
		ogPlatform: [
			home,
			{ label: 'Tools', href: '/tools' },
			{ label: 'OG Image Generator', href: '/tools/og-image-generator' }
		],

		// Content sections
		comparison: [home, { label: 'Compare', href: '/compare' }],
		glossary: [home, { label: 'Glossary', href: '/glossary' }],
		integration: [home, { label: 'Integrations', href: '/integrations' }],
		blog: [home, { label: 'Blog', href: '/blogs' }],

		// Templates
		templateCategory: [home, { label: 'Templates', href: '/templates' }],
		template: [
			home,
			{ label: 'Templates', href: '/templates' },
			...(pageData.category ? [{ label: pageData.category.name, href: `/templates/category/${pageData.category.id}` }] : [])
		],

		// Persona
		persona: [home],

		// Static pages
		pricing: [home],
		tools: [home],
		templates: [home],
		compare: [home],
		glossaryHub: [home],
		integrationsHub: [home]
	};

	return breadcrumbMap[pageType] || [home];
}
