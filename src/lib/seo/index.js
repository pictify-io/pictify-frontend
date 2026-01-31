/**
 * Pictify SEO System
 * Centralized SEO infrastructure for scalable programmatic SEO
 *
 * Components:
 * - SEOHead.svelte: Universal SEO meta component
 * - RelatedLinks.svelte: Internal linking component
 *
 * Modules:
 * - metadata/: Title, description, keyword generators
 * - schema/: JSON-LD structured data builders
 * - canonical/: Canonical URL generators
 * - linking/: Related content algorithms
 */

// Components (import directly from paths)
// import SEOHead from '$lib/seo/SEOHead.svelte';
// import RelatedLinks from '$lib/seo/linking/RelatedLinks.svelte';

// Metadata
export {
	BASE_URL,
	SITE_NAME,
	titleTemplates,
	descriptionTemplates,
	keywordTemplates,
	generateTitle,
	generateDescription,
	generateKeywords
} from './metadata/templates.js';

export {
	generateMetadata,
	generateUseCaseMetadata,
	generateToolFormatMetadata,
	generateToolDimensionMetadata,
	generateComparisonMetadata,
	generateGlossaryMetadata,
	generateIntegrationMetadata,
	generatePersonaMetadata,
	generateOGPlatformMetadata,
	generateTemplateCategoryMetadata,
	generateBreadcrumbs
} from './metadata/generator.js';

// Canonical URLs
export {
	generateCanonical,
	getCanonicalOverride,
	generateToolDimensionCanonical,
	generateComparisonCanonical,
	generateGlossaryCanonical,
	generateIntegrationCanonical,
	generateTemplateCanonical,
	generateTemplateCategoryCanonical,
	generatePersonaCanonical,
	generateBlogCanonical
} from './canonical/generator.js';

// Schema Builders
export {
	composeSchema,
	createOrganizationSchema,
	createWebSiteSchema,
	createSoftwareApplicationSchema,
	serializeSchema,
	buildFAQSchema,
	buildQuestionSchema,
	buildArticleSchema,
	buildTechArticleSchema,
	buildComparisonArticleSchema,
	buildHowToSchema,
	buildStepSchema,
	buildMigrationHowToSchema,
	buildBreadcrumbSchema,
	getBreadcrumbItems,
	buildWebApplicationSchema,
	buildConverterToolSchema,
	buildOGImageGeneratorSchema,
	buildUseCaseToolSchema,
	buildToolPageSchema,
	buildDefinedTermSchema,
	buildDefinedTermSetSchema,
	buildEducationalContentSchema
} from './schema/index.js';

// Internal Linking
export {
	getRelatedPages,
	calculateRelevanceScore,
	getCrossTypeRelated,
	getHubPageLink,
	buildLinkSuggestions
} from './linking/related.js';

/**
 * Quick helper to build complete SEO data for a page
 * @param {string} pageType - Type of page
 * @param {Object} pageData - Page-specific data
 * @param {string} pathname - URL pathname
 * @returns {Object} Complete SEO data including metadata and schema
 */
export function buildSEO(pageType, pageData, pathname) {
	const { generateMetadata } = require('./metadata/generator.js');
	const { generateCanonical } = require('./canonical/generator.js');
	const { getBreadcrumbItems, buildBreadcrumbSchema } = require('./schema/index.js');

	// Generate metadata
	const metadata = generateMetadata(pageType, pageData, pathname);

	// Generate breadcrumbs
	const breadcrumbItems = getBreadcrumbItems(pageType, pageData);
	const breadcrumbSchema = buildBreadcrumbSchema(
		breadcrumbItems,
		pageData.title || pageData.name || pageData.label
	);

	return {
		...metadata,
		breadcrumbs: {
			items: breadcrumbItems,
			currentLabel: pageData.title || pageData.name || pageData.label,
			schema: breadcrumbSchema
		}
	};
}
