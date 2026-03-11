/**
 * Related Pages Algorithm
 * Calculates relevance scores and returns related pages for internal linking
 */

/**
 * Get related pages based on content similarity
 * @param {string} pageType - Type of current page
 * @param {Object} currentPage - Current page data
 * @param {Object[]} allPages - All pages to search from
 * @param {number} maxResults - Maximum number of results (default 5)
 * @returns {Object[]} Array of related pages sorted by relevance
 */
export function getRelatedPages(pageType, currentPage, allPages, maxResults = 5) {
	if (!allPages || allPages.length === 0) return [];

	// Filter out the current page
	const candidates = allPages.filter((p) => getPageId(p) !== getPageId(currentPage));

	// Calculate relevance scores
	const scored = candidates.map((page) => ({
		page,
		score: calculateRelevanceScore(currentPage, page, pageType)
	}));

	// Sort by score descending and return top results
	return scored
		.sort((a, b) => b.score - a.score)
		.slice(0, maxResults)
		.map((s) => s.page);
}

/**
 * Calculate relevance score between two pages
 * @param {Object} source - Source page
 * @param {Object} target - Target page
 * @param {string} pageType - Type of page for context-specific scoring
 * @returns {number} Relevance score (higher = more relevant)
 */
export function calculateRelevanceScore(source, target, pageType = 'default') {
	let score = 0;

	// Shared keywords (10 points each)
	const sourceKeywords = getKeywords(source);
	const targetKeywords = getKeywords(target);
	const sharedKeywords = intersection(sourceKeywords, targetKeywords);
	score += sharedKeywords.length * 10;

	// Same category (20 points)
	if (source.category && source.category === target.category) {
		score += 20;
	}

	// Same page type (15 points)
	if (source.pageType && source.pageType === target.pageType) {
		score += 15;
	}

	// Explicit related items (50 points)
	const sourceRelated = source.relatedTerms || source.related || [];
	const targetId = getPageId(target);
	if (sourceRelated.includes(targetId)) {
		score += 50;
	}

	// Shared tags (8 points each)
	const sourceTags = source.tags || [];
	const targetTags = target.tags || [];
	const sharedTags = intersection(sourceTags, targetTags);
	score += sharedTags.length * 8;

	// Title/name similarity (fuzzy match bonus)
	const titleSimilarity = calculateTitleSimilarity(
		source.title || source.name || source.label,
		target.title || target.name || target.label
	);
	score += Math.floor(titleSimilarity * 15);

	return score;
}

/**
 * Get keywords from a page object
 * @param {Object} page - Page object
 * @returns {string[]} Array of keywords (lowercase)
 */
function getKeywords(page) {
	const keywords = page.seoKeywords || page.keywords || [];
	return keywords.map((k) => k.toLowerCase().trim());
}

/**
 * Get unique identifier for a page
 * @param {Object} page - Page object
 * @returns {string} Page identifier
 */
function getPageId(page) {
	return page.id || page.slug || page.term || page.uid || '';
}

/**
 * Calculate array intersection
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {Array} Intersection of both arrays
 */
function intersection(arr1, arr2) {
	const set2 = new Set(arr2.map((item) => String(item).toLowerCase()));
	return arr1.filter((item) => set2.has(String(item).toLowerCase()));
}

/**
 * Calculate title similarity (simple word overlap)
 * @param {string} title1 - First title
 * @param {string} title2 - Second title
 * @returns {number} Similarity score between 0 and 1
 */
function calculateTitleSimilarity(title1, title2) {
	if (!title1 || !title2) return 0;

	const words1 = title1
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 2);
	const words2 = title2
		.toLowerCase()
		.split(/\s+/)
		.filter((w) => w.length > 2);

	if (words1.length === 0 || words2.length === 0) return 0;

	const shared = intersection(words1, words2);
	return shared.length / Math.max(words1.length, words2.length);
}

/**
 * Get cross-type related content (e.g., glossary terms related to a comparison)
 * @param {Object} currentPage - Current page data
 * @param {Object} contentSources - Object with arrays of different content types
 * @param {number} maxPerType - Maximum items per content type
 * @returns {Object} Object with related items per type
 */
export function getCrossTypeRelated(currentPage, contentSources, maxPerType = 3) {
	const result = {};

	for (const [type, pages] of Object.entries(contentSources)) {
		result[type] = getRelatedPages(type, currentPage, pages, maxPerType);
	}

	return result;
}

/**
 * Get hub page link for a given page type
 * @param {string} pageType - Type of page
 * @returns {Object|null} Hub page info with label and href
 */
export function getHubPageLink(pageType) {
	const hubs = {
		useCase: { label: 'All Tools', href: '/tools' },
		tool: { label: 'All Tools', href: '/tools' },
		toolDimension: { label: 'All Tools', href: '/tools' },
		comparison: { label: 'All Comparisons', href: '/compare' },
		glossary: { label: 'Full Glossary', href: '/glossary' },
		integration: { label: 'All Integrations', href: '/integrations' },
		template: { label: 'All Templates', href: '/templates' },
		templateCategory: { label: 'All Templates', href: '/templates' },
		persona: { label: 'All Solutions', href: '/tools' },
		ogPlatform: { label: 'OG Image Generator', href: '/tools/og-image-generator' }
	};

	return hubs[pageType] || null;
}

/**
 * Build internal link suggestions for a page
 * @param {Object} pageData - Current page data
 * @param {string} pageType - Type of page
 * @param {Object} allContent - All available content
 * @returns {Object} Link suggestions by category
 */
export function buildLinkSuggestions(pageData, pageType, allContent) {
	const suggestions = {
		sameType: [],
		relatedTypes: {},
		hub: getHubPageLink(pageType)
	};

	// Get same-type related
	const sameTypeContent = allContent[pageType] || [];
	suggestions.sameType = getRelatedPages(pageType, pageData, sameTypeContent, 5);

	// Get cross-type related (exclude current type)
	const crossTypeContent = { ...allContent };
	delete crossTypeContent[pageType];
	suggestions.relatedTypes = getCrossTypeRelated(pageData, crossTypeContent, 3);

	return suggestions;
}
