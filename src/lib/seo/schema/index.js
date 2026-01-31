/**
 * Schema.org JSON-LD Builders
 * Central export for all schema builders
 */

// Composer
export {
	composeSchema,
	createOrganizationSchema,
	createWebSiteSchema,
	createSoftwareApplicationSchema,
	serializeSchema
} from './composer.js';

// FAQ Schema
export { buildFAQSchema, buildQuestionSchema } from './builders/FAQ.js';

// Article Schema
export {
	buildArticleSchema,
	buildTechArticleSchema,
	buildComparisonArticleSchema
} from './builders/Article.js';

// HowTo Schema
export {
	buildHowToSchema,
	buildStepSchema,
	buildMigrationHowToSchema
} from './builders/HowTo.js';

// Breadcrumb Schema
export { buildBreadcrumbSchema, getBreadcrumbItems } from './builders/Breadcrumb.js';

// WebApplication Schema
export {
	buildWebApplicationSchema,
	buildConverterToolSchema,
	buildOGImageGeneratorSchema,
	buildUseCaseToolSchema,
	buildToolPageSchema
} from './builders/WebApplication.js';

// DefinedTerm Schema
export {
	buildDefinedTermSchema,
	buildDefinedTermSetSchema,
	buildEducationalContentSchema
} from './builders/DefinedTerm.js';

/**
 * Build complete schema for a page type
 * @param {string} pageType - Type of page
 * @param {Object} pageData - Page-specific data
 * @returns {Object|null} Complete composed schema
 */
export function buildPageSchema(pageType, pageData) {
	const {
		composeSchema,
		buildBreadcrumbSchema,
		getBreadcrumbItems,
		buildFAQSchema,
		buildArticleSchema,
		buildComparisonArticleSchema,
		buildMigrationHowToSchema,
		buildDefinedTermSchema,
		buildConverterToolSchema,
		buildOGImageGeneratorSchema,
		buildUseCaseToolSchema
	} = {
		composeSchema: require('./composer.js').composeSchema,
		buildBreadcrumbSchema: require('./builders/Breadcrumb.js').buildBreadcrumbSchema,
		getBreadcrumbItems: require('./builders/Breadcrumb.js').getBreadcrumbItems,
		buildFAQSchema: require('./builders/FAQ.js').buildFAQSchema,
		buildArticleSchema: require('./builders/Article.js').buildArticleSchema,
		buildComparisonArticleSchema: require('./builders/Article.js').buildComparisonArticleSchema,
		buildMigrationHowToSchema: require('./builders/HowTo.js').buildMigrationHowToSchema,
		buildDefinedTermSchema: require('./builders/DefinedTerm.js').buildDefinedTermSchema,
		buildConverterToolSchema: require('./builders/WebApplication.js').buildConverterToolSchema,
		buildOGImageGeneratorSchema: require('./builders/WebApplication.js').buildOGImageGeneratorSchema,
		buildUseCaseToolSchema: require('./builders/WebApplication.js').buildUseCaseToolSchema
	};

	// This function is here for reference - actual usage should import specific builders
	// and compose them as needed for each page
	return null;
}
