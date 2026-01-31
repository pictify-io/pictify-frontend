/**
 * DefinedTerm Schema Builder
 * Generates DefinedTerm schema for glossary terms
 */

import { BASE_URL } from '../../metadata/templates.js';

/**
 * @typedef {Object} TermData
 * @property {string} term - Term slug/ID
 * @property {string} title - Term title/name
 * @property {string} shortDefinition - Brief definition
 * @property {string} longDefinition - Full definition
 * @property {string[]} [relatedTerms] - Related term slugs
 * @property {string[]} [seoKeywords] - SEO keywords
 */

/**
 * Build DefinedTerm schema for glossary terms
 * @param {TermData} term - Term data
 * @returns {Object} DefinedTerm schema
 */
export function buildDefinedTermSchema(term) {
	const schema = {
		'@type': 'DefinedTerm',
		name: term.title,
		description: term.longDefinition || term.shortDefinition,
		url: `${BASE_URL}/glossary/${term.term}`,
		inDefinedTermSet: {
			'@type': 'DefinedTermSet',
			name: 'Image Generation Glossary',
			url: `${BASE_URL}/glossary`
		}
	};

	// Add term code/identifier if available
	if (term.term) {
		schema.termCode = term.term;
	}

	return schema;
}

/**
 * Build DefinedTermSet schema for the glossary hub
 * @param {TermData[]} terms - Array of all glossary terms
 * @returns {Object} DefinedTermSet schema
 */
export function buildDefinedTermSetSchema(terms) {
	return {
		'@type': 'DefinedTermSet',
		name: 'Image Generation Glossary',
		description: 'Comprehensive glossary of image generation terminology including OG images, Open Graph, social previews, and more.',
		url: `${BASE_URL}/glossary`,
		hasDefinedTerm: terms.map(term => ({
			'@type': 'DefinedTerm',
			name: term.title,
			termCode: term.term,
			url: `${BASE_URL}/glossary/${term.term}`
		}))
	};
}

/**
 * Build educational content schema that references defined terms
 * @param {Object} contentData - Content data
 * @param {TermData[]} referencedTerms - Terms referenced in the content
 * @returns {Object} Article schema with term references
 */
export function buildEducationalContentSchema(contentData, referencedTerms = []) {
	const schema = {
		'@type': 'Article',
		headline: contentData.title,
		description: contentData.description,
		url: contentData.url,
		author: {
			'@type': 'Organization',
			name: 'Pictify',
			url: BASE_URL
		}
	};

	if (referencedTerms.length > 0) {
		schema.about = referencedTerms.map(term => ({
			'@type': 'DefinedTerm',
			name: term.title,
			url: `${BASE_URL}/glossary/${term.term}`
		}));
	}

	return schema;
}
