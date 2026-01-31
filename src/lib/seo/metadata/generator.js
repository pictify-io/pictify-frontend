/**
 * SEO Metadata Generator
 * Generates complete SEO metadata objects for different page types
 */

import { generateTitle, generateDescription, generateKeywords, BASE_URL, SITE_NAME } from './templates.js';

/**
 * @typedef {Object} SEOMetadata
 * @property {string} title - Page title
 * @property {string} description - Meta description
 * @property {string} canonical - Canonical URL
 * @property {string[]} keywords - Keywords array
 * @property {Object} openGraph - Open Graph data
 * @property {Object} twitter - Twitter card data
 */

/**
 * Generate complete SEO metadata for a page
 * @param {string} pageType - Type of page (useCase, tool, comparison, etc.)
 * @param {Object} pageData - Page-specific data
 * @param {string} pathname - URL pathname (e.g., /tools/html-to-png)
 * @returns {SEOMetadata} Complete SEO metadata object
 */
export function generateMetadata(pageType, pageData, pathname) {
	const title = generateTitle(pageType, pageData);
	const description = generateDescription(pageType, pageData);
	const keywords = generateKeywords(pageType, pageData);
	const canonical = `${BASE_URL}${pathname}`;

	// Default OG image - can be overridden by pageData
	const ogImage = pageData.ogImage || `${BASE_URL}/og-image-tools.jpg`;

	return {
		title,
		description,
		canonical,
		keywords,
		openGraph: {
			title: pageData.ogTitle || title,
			description: pageData.ogDescription || description,
			url: canonical,
			type: getOGType(pageType),
			image: ogImage,
			siteName: SITE_NAME
		},
		twitter: {
			card: 'summary_large_image',
			title: pageData.twitterTitle || title,
			description: pageData.twitterDescription || description,
			image: pageData.twitterImage || ogImage
		}
	};
}

/**
 * Generate metadata for use case pages
 * @param {Object} useCase - Use case data from config
 * @returns {SEOMetadata}
 */
export function generateUseCaseMetadata(useCase) {
	return generateMetadata('useCase', {
		label: useCase.label,
		description: useCase.description,
		keywords: useCase.seoKeywords?.join(', ') || ''
	}, `/tools/${useCase.id}`);
}

/**
 * Generate metadata for tool format pages (e.g., html-to-png)
 * @param {Object} format - Format data (id, name)
 * @returns {SEOMetadata}
 */
export function generateToolFormatMetadata(format) {
	const formatId = format?.id || 'image';
	const formatName = format?.name || (typeof formatId === 'string' ? formatId.toUpperCase() : 'Image');
	return generateMetadata('tool', {
		format: formatName
	}, `/tools/html-to-${formatId}`);
}

/**
 * Generate metadata for tool dimension pages (e.g., html-to-png/1200x630)
 * @param {Object} format - Format data
 * @param {string} dimensions - Dimensions string (e.g., "1200x630")
 * @param {string} useCaseContext - Context for the dimension (e.g., "OG images, social previews")
 * @returns {SEOMetadata}
 */
export function generateToolDimensionMetadata(format, dimensions, useCaseContext = 'social media, marketing') {
	const formatId = format?.id || 'image';
	const formatName = format?.name || (typeof formatId === 'string' ? formatId.toUpperCase() : 'Image');
	return generateMetadata('toolDimension', {
		format: formatName,
		dimensions,
		useCaseContext
	}, `/tools/html-to-${formatId}/${dimensions}`);
}

/**
 * Generate metadata for comparison pages
 * @param {Object} comparison - Comparison data from config
 * @returns {SEOMetadata}
 */
export function generateComparisonMetadata(comparison) {
	return generateMetadata('comparison', {
		title: comparison.title,
		competitor: comparison.competitor,
		description: comparison.metaDescription,
		year: new Date().getFullYear()
	}, `/compare/${comparison.slug}`);
}

/**
 * Generate metadata for glossary term pages
 * @param {Object} term - Glossary term data
 * @returns {SEOMetadata}
 */
export function generateGlossaryMetadata(term) {
	return generateMetadata('glossary', {
		title: term.title,
		term: term.term,
		shortDefinition: term.shortDefinition,
		keywords: term.seoKeywords?.join(', ') || ''
	}, `/glossary/${term.term}`);
}

/**
 * Generate metadata for integration pages
 * @param {Object} integration - Integration data
 * @returns {SEOMetadata}
 */
export function generateIntegrationMetadata(integration) {
	return generateMetadata('integration', {
		name: integration.name,
		description: integration.description || `Integrate Pictify with ${integration.name}`
	}, `/integrations/${integration.slug}`);
}

/**
 * Generate metadata for persona pages
 * @param {Object} persona - Persona data
 * @returns {SEOMetadata}
 */
export function generatePersonaMetadata(persona) {
	return generateMetadata('persona', {
		persona: persona.title,
		description: persona.description
	}, `/for/${persona.slug}`);
}

/**
 * Generate metadata for OG platform pages
 * @param {Object} platform - Platform data
 * @returns {SEOMetadata}
 */
export function generateOGPlatformMetadata(platform) {
	return generateMetadata('ogPlatform', {
		platform: platform.name,
		recommendedSize: platform.recommendedSize || '1200x630'
	}, `/tools/og-image-generator/${platform.id}`);
}

/**
 * Generate metadata for template category pages
 * @param {Object} category - Category data
 * @param {number} templateCount - Number of templates in category
 * @returns {SEOMetadata}
 */
export function generateTemplateCategoryMetadata(category, templateCount = 0) {
	return generateMetadata('templateCategory', {
		category: category.name || category.label,
		count: templateCount,
		useCase: category.useCase || 'marketing materials and social media'
	}, `/templates/category/${category.id}`);
}

/**
 * Get appropriate Open Graph type for page type
 * @param {string} pageType - Type of page
 * @returns {string} OG type
 */
function getOGType(pageType) {
	const typeMap = {
		blog: 'article',
		comparison: 'article',
		glossary: 'article',
		template: 'product',
		default: 'website'
	};
	return typeMap[pageType] || typeMap.default;
}

/**
 * Generate breadcrumb items for a page
 * @param {string} pageType - Type of page
 * @param {Object} pageData - Page data
 * @returns {Array<{label: string, href: string}>} Breadcrumb items
 */
export function generateBreadcrumbs(pageType, pageData) {
	const home = { label: 'Home', href: '/' };

	const breadcrumbMap = {
		useCase: [home, { label: 'Tools', href: '/tools' }],
		tool: [home, { label: 'Tools', href: '/tools' }],
		toolDimension: [
			home,
			{ label: 'Tools', href: '/tools' },
			{ label: `HTML to ${pageData.format}`, href: `/tools/html-to-${pageData.formatId}` }
		],
		comparison: [home, { label: 'Compare', href: '/compare' }],
		glossary: [home, { label: 'Glossary', href: '/glossary' }],
		integration: [home, { label: 'Integrations', href: '/integrations' }],
		persona: [home],
		templateCategory: [home, { label: 'Templates', href: '/templates' }],
		template: [home, { label: 'Templates', href: '/templates' }],
		ogPlatform: [
			home,
			{ label: 'Tools', href: '/tools' },
			{ label: 'OG Image Generator', href: '/tools/og-image-generator' }
		],
		blog: [home, { label: 'Blog', href: '/blogs' }]
	};

	return breadcrumbMap[pageType] || [home];
}
