/**
 * Keyword Cannibalization Prevention
 * Ensures each keyword maps to exactly one canonical page
 */

/**
 * Intent-based page type selection
 * Maps search intent categories to appropriate page types
 */
export const intentPageTypeMapping = {
	// Informational intent - user wants to learn
	informational: ['glossary', 'blog', 'guide'],

	// Transactional intent - user wants to use/buy
	transactional: ['tool', 'useCase', 'toolDimension', 'pricing'],

	// Navigational intent - user looking for specific thing
	navigational: ['persona', 'integration', 'templateCategory'],

	// Comparative intent - user evaluating options
	comparative: ['comparison', 'alternative']
};

/**
 * Canonical keyword mapping
 * Each keyword should map to exactly ONE page
 * This prevents multiple pages from competing for the same keyword
 */
export const keywordMap = {
	// Core product keywords -> Tool pages
	'html to png': '/tools/html-to-png',
	'html to png converter': '/tools/html-to-png',
	'convert html to png': '/tools/html-to-png',
	'html to jpg': '/tools/html-to-jpg',
	'html to jpg converter': '/tools/html-to-jpg',
	'html to webp': '/tools/html-to-webp',
	'html to image': '/tools',
	'html to image api': '/tools',
	'html to image converter': '/tools',

	// Dimension-specific keywords -> Dimension pages
	'og image size': '/tools/html-to-png/1200x630',
	'og image dimensions': '/tools/html-to-png/1200x630',
	'og image 1200x630': '/tools/html-to-png/1200x630',
	'twitter card size': '/tools/html-to-png/1200x628',
	'instagram image size': '/tools/html-to-png/1080x1080',
	'linkedin banner size': '/tools/html-to-png/1584x396',

	// Educational keywords -> Glossary pages
	'what is og image': '/glossary/og-image',
	'what is open graph': '/glossary/open-graph',
	'og image meaning': '/glossary/og-image',
	'social preview image': '/glossary/social-preview',
	'what is twitter card': '/glossary/twitter-card',

	// Comparison keywords -> Comparison pages
	'cloudinary alternative': '/compare/pictify-vs-cloudinary',
	'pictify vs cloudinary': '/compare/pictify-vs-cloudinary',
	'imgix alternative': '/compare/pictify-vs-imgix',
	'placid alternative': '/compare/pictify-vs-placid',
	'puppeteer alternative': '/compare/pictify-vs-puppeteer',

	// Platform-specific keywords -> OG platform pages
	'wordpress og image': '/tools/og-image-generator/wordpress',
	'notion og image': '/tools/og-image-generator/notion',
	'shopify og image': '/tools/og-image-generator/shopify',
	'ghost og image': '/tools/og-image-generator/ghost',
	'github og image': '/tools/og-image-generator/github',

	// Integration keywords -> Integration pages
	'zapier image generation': '/integrations/zapier',
	'make image automation': '/integrations/make',
	'n8n image generation': '/integrations/n8n',

	// Persona keywords -> Persona pages
	'image api for developers': '/for/developers',
	'image generation for marketers': '/for/marketers',
	'og image generator for saas': '/for/saas-founders'
};

/**
 * Content differentiation matrix
 * Defines unique angles for similar pages to avoid cannibalization
 */
export const contentDifferentiation = {
	// Format pages - differentiated by format benefits
	'/tools/html-to-png': {
		angle: 'Transparency and sharp text',
		focus: ['png converter', 'transparent images', 'lossless quality'],
		avoid: ['jpg', 'webp', 'compression']
	},
	'/tools/html-to-jpg': {
		angle: 'Small file size for photos',
		focus: ['jpg converter', 'photo images', 'smaller files'],
		avoid: ['png', 'transparency', 'lossless']
	},
	'/tools/html-to-webp': {
		angle: 'Best quality-to-size ratio',
		focus: ['webp converter', 'modern format', 'optimized images'],
		avoid: ['legacy browsers', 'compatibility issues']
	},

	// Dimension pages - differentiated by use case
	'/tools/html-to-png/1200x630': {
		angle: 'OG images and social previews',
		focus: ['og image', 'social preview', 'link sharing'],
		avoid: ['instagram', 'profile picture', 'banner']
	},
	'/tools/html-to-png/1080x1080': {
		angle: 'Instagram and social squares',
		focus: ['instagram post', 'square image', 'social media'],
		avoid: ['og image', 'twitter card', 'banner']
	},
	'/tools/html-to-png/1920x1080': {
		angle: 'Video thumbnails and presentations',
		focus: ['thumbnail', 'presentation', 'HD', '16:9'],
		avoid: ['social media', 'og image', 'square']
	}
};

/**
 * Get canonical page for a keyword
 * @param {string} keyword - Search keyword
 * @returns {string|null} Canonical page path or null if not mapped
 */
export function getCanonicalPageForKeyword(keyword) {
	const normalizedKeyword = keyword.toLowerCase().trim();
	return keywordMap[normalizedKeyword] || null;
}

/**
 * Check if a keyword belongs to a specific page
 * @param {string} keyword - Search keyword
 * @param {string} pagePath - Page path to check
 * @returns {boolean} True if keyword is canonically mapped to this page
 */
export function isKeywordCanonicalForPage(keyword, pagePath) {
	const canonical = getCanonicalPageForKeyword(keyword);
	return canonical === pagePath;
}

/**
 * Get all keywords for a specific page
 * @param {string} pagePath - Page path
 * @returns {string[]} Array of keywords mapped to this page
 */
export function getKeywordsForPage(pagePath) {
	return Object.entries(keywordMap)
		.filter(([_, path]) => path === pagePath)
		.map(([keyword]) => keyword);
}

/**
 * Detect potential cannibalization issues
 * @param {Object[]} pages - Array of page objects with path and keywords
 * @returns {Object[]} Array of cannibalization issues
 */
export function detectCannibalization(pages) {
	const keywordPages = new Map();
	const issues = [];

	// Build keyword -> pages mapping
	pages.forEach(page => {
		const keywords = page.seoKeywords || page.keywords || [];
		keywords.forEach(keyword => {
			const normalizedKeyword = keyword.toLowerCase();
			if (!keywordPages.has(normalizedKeyword)) {
				keywordPages.set(normalizedKeyword, []);
			}
			keywordPages.get(normalizedKeyword).push(page.path);
		});
	});

	// Find keywords used by multiple pages
	keywordPages.forEach((paths, keyword) => {
		if (paths.length > 1) {
			const canonical = getCanonicalPageForKeyword(keyword);
			issues.push({
				keyword,
				pages: paths,
				canonical,
				recommendation: canonical
					? `Move all uses of "${keyword}" to ${canonical}`
					: `Designate one canonical page for "${keyword}"`
			});
		}
	});

	return issues;
}

/**
 * Suggest keywords for a page based on its type and content
 * @param {string} pageType - Type of page
 * @param {Object} pageData - Page data
 * @returns {string[]} Suggested keywords (avoiding cannibalization)
 */
export function suggestKeywords(pageType, pageData) {
	const baseKeywords = [];

	switch (pageType) {
		case 'tool':
			baseKeywords.push(
				`html to ${pageData.format}`,
				`${pageData.format} converter`,
				`html to ${pageData.format} converter`,
				`convert html to ${pageData.format}`
			);
			break;

		case 'toolDimension':
			baseKeywords.push(
				`${pageData.dimensions} image`,
				`html to ${pageData.format} ${pageData.dimensions}`,
				`${pageData.dimensions} ${pageData.format}`
			);
			break;

		case 'comparison':
			baseKeywords.push(
				`${pageData.competitor} alternative`,
				`pictify vs ${pageData.competitor}`,
				`${pageData.competitor} vs pictify`
			);
			break;

		case 'glossary':
			baseKeywords.push(
				pageData.term,
				`what is ${pageData.term}`,
				`${pageData.term} meaning`,
				`${pageData.term} definition`
			);
			break;

		case 'integration':
			baseKeywords.push(
				`${pageData.name} image generation`,
				`pictify ${pageData.name}`,
				`${pageData.name} integration`
			);
			break;
	}

	// Filter out keywords that are canonical for other pages
	const pagePath = getPagePath(pageType, pageData);
	return baseKeywords.filter(keyword => {
		const canonical = getCanonicalPageForKeyword(keyword);
		return !canonical || canonical === pagePath;
	});
}

/**
 * Get page path for page type and data
 * @param {string} pageType - Type of page
 * @param {Object} pageData - Page data
 * @returns {string} Page path
 */
function getPagePath(pageType, pageData) {
	switch (pageType) {
		case 'tool':
			return `/tools/html-to-${pageData.format}`;
		case 'toolDimension':
			return `/tools/html-to-${pageData.format}/${pageData.dimensions}`;
		case 'comparison':
			return `/compare/${pageData.slug}`;
		case 'glossary':
			return `/glossary/${pageData.term}`;
		case 'integration':
			return `/integrations/${pageData.slug}`;
		default:
			return pageData.path || '/';
	}
}
