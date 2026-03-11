/**
 * Body Content Generator
 * Generates unique body content for PSEO pages
 */

import { generateTitle, generateUniqueTitle } from './title.js';
import { generateDescription, generateUniqueDescription } from './description.js';
import { generateFAQs, mergeFAQs } from './faq.js';

/**
 * Content uniqueness thresholds per page type
 */
export const contentThresholds = {
	useCase: { minWords: 800, minFAQs: 5, minBenefits: 4 },
	comparison: { minWords: 1200, minFAQs: 6, minFeatures: 5 },
	toolDimension: { minWords: 600, minFAQs: 3, minUseCases: 3 },
	glossary: { minWords: 400, minFAQs: 3, minRelated: 2 },
	integration: { minWords: 500, minFAQs: 4, minSteps: 3 },
	persona: { minWords: 700, minFAQs: 4, minBenefits: 4 }
};

/**
 * Generate complete page data for a page type
 * @param {string} pageType - Type of page
 * @param {Object} baseData - Base data from config
 * @returns {Object} Complete page data with generated content
 */
export function generatePageData(pageType, baseData) {
	const pageData = {
		...baseData,
		seo: {
			title: generateUniqueTitle(pageType, baseData),
			description: generateUniqueDescription(pageType, baseData),
			h1: generateH1(pageType, baseData)
		},
		content: {
			overview: generateOverview(pageType, baseData),
			benefits: generateBenefits(pageType, baseData),
			faqs: baseData.faqs
				? mergeFAQs(baseData.faqs, pageType, baseData)
				: generateFAQs(pageType, baseData),
			workflow: generateWorkflow(pageType, baseData)
		},
		validation: validateContent(pageType, baseData)
	};

	return pageData;
}

/**
 * Generate H1 heading (slightly different from title)
 * @param {string} pageType - Type of page
 * @param {Object} data - Page data
 * @returns {string} H1 heading
 */
export function generateH1(pageType, data) {
	const h1Patterns = {
		useCase: '{label}',
		tool: 'HTML to {format} Converter',
		toolDimension: 'HTML to {format} {dimensions}',
		comparison: '{competitor} vs Pictify',
		glossary: '{title}',
		integration: 'Pictify + {name} Integration',
		persona: 'Pictify for {persona}',
		ogPlatform: 'OG Images for {platform}'
	};

	const pattern = h1Patterns[pageType] || '{title}';
	return interpolate(pattern, {
		...data,
		format: data.format || data.id?.toUpperCase()
	});
}

/**
 * Generate overview paragraphs
 * @param {string} pageType - Type of page
 * @param {Object} data - Page data
 * @returns {string[]} Array of overview paragraphs
 */
export function generateOverview(pageType, data) {
	const overviewTemplates = {
		useCase: [
			'{description}',
			'With Pictify, you can design your {label} once and generate them programmatically via our API. No more manual image creation for every variation.',
			'Our HTML to image API makes it easy to create {label} at scale. Use your existing web development skills to design templates, then render them with dynamic data.'
		],

		tool: [
			'Convert HTML and CSS to {format} images instantly with Pictify. Our free online converter handles modern web technologies including Flexbox, Grid, and custom fonts.',
			"{format} is ideal for {formatBenefit}. Pictify's conversion engine produces high-quality results that look exactly like your HTML renders in a browser.",
			'Use our API to generate {format} images programmatically, or try the online tool for quick one-off conversions.'
		],

		toolDimension: [
			'Generate {dimensions} {format} images from HTML and CSS. This size is optimized for {context}.',
			"Pictify's converter handles {dimensions} resolution perfectly, ensuring your images display correctly without quality loss.",
			'Use our API for automated {dimensions} image generation, or try the online tool to test your designs.'
		],

		comparison: [
			'{competitor} and Pictify both offer image generation capabilities, but they approach the problem differently.',
			'Pictify focuses on converting HTML/CSS to images, making it ideal for developers who want to use web technologies for design. {competitor} offers {competitorFocus}.',
			'This comparison will help you understand the key differences and choose the right tool for your needs.'
		],

		glossary: ['{shortDefinition}', '{longDefinition}'],

		integration: [
			'Connect Pictify with {name} to automate your image generation workflows. This integration enables you to {integrationBenefit}.',
			'{name} users can trigger image generation automatically based on events in their {name} workflows.',
			'Set up takes just a few minutes. Follow our guide to start generating images with {name} + Pictify.'
		]
	};

	const templates = overviewTemplates[pageType] || [];
	return templates.map((template) => interpolate(template, enrichData(pageType, data)));
}

/**
 * Generate benefits list
 * @param {string} pageType - Type of page
 * @param {Object} data - Page data
 * @returns {string[]} Array of benefits
 */
export function generateBenefits(pageType, data) {
	// Return existing benefits if provided
	if (data.benefits && data.benefits.length > 0) {
		return data.benefits;
	}

	const benefitTemplates = {
		useCase: [
			'Generate {label} at scale with API',
			'Design once, render unlimited variations',
			'Use familiar HTML/CSS for design',
			'Fast rendering under 2 seconds',
			'Free tier available to get started'
		],

		tool: [
			'Free online {format} converter',
			'API access for automation',
			'Support for modern HTML/CSS',
			'Custom fonts and external images',
			'High-quality output'
		],

		toolDimension: [
			'Optimized for {context}',
			'Pixel-perfect {dimensions} output',
			'Fast bulk generation',
			'Multiple format options'
		],

		comparison: [
			'Simpler API than {competitor}',
			'Competitive pricing',
			'Focused HTML-to-image solution',
			'Generous free tier',
			'Easy migration path'
		],

		integration: [
			'No-code automation',
			'Real-time image generation',
			'Easy {name} setup',
			'Pre-built templates available'
		]
	};

	const templates = benefitTemplates[pageType] || [];
	return templates.map((template) => interpolate(template, enrichData(pageType, data)));
}

/**
 * Generate workflow steps
 * @param {string} pageType - Type of page
 * @param {Object} data - Page data
 * @returns {Object[]|null} Array of workflow steps or null
 */
export function generateWorkflow(pageType, data) {
	// Return existing workflow if provided
	if (data.workflow) return data.workflow;

	const workflowTemplates = {
		tool: [
			{
				title: 'Write HTML/CSS',
				description: 'Create your design using familiar web technologies'
			},
			{ title: 'Call the API', description: 'Send your HTML to our conversion endpoint' },
			{ title: 'Get your {format}', description: 'Receive a URL to your generated image' }
		],

		integration: [
			{ title: 'Connect {name}', description: 'Authorize Pictify in your {name} account' },
			{ title: 'Set up trigger', description: 'Choose when to generate images' },
			{ title: 'Configure template', description: 'Select or create your image template' },
			{ title: 'Activate workflow', description: 'Start generating images automatically' }
		]
	};

	const templates = workflowTemplates[pageType];
	if (!templates) return null;

	return templates.map((step) => ({
		title: interpolate(step.title, enrichData(pageType, data)),
		description: interpolate(step.description, enrichData(pageType, data))
	}));
}

/**
 * Validate content meets minimum thresholds
 * @param {string} pageType - Type of page
 * @param {Object} data - Page data
 * @returns {Object} Validation result with pass/fail and details
 */
export function validateContent(pageType, data) {
	const thresholds = contentThresholds[pageType];
	if (!thresholds) {
		return { valid: true, issues: [] };
	}

	const issues = [];

	// Check word count (estimate from text fields)
	const textContent = [
		data.description || '',
		data.longDefinition || '',
		data.shortDefinition || '',
		...(data.benefits || []),
		...(data.faqs || []).map((f) => f.q + ' ' + f.a)
	].join(' ');

	const wordCount = textContent.split(/\s+/).filter(Boolean).length;
	if (wordCount < thresholds.minWords) {
		issues.push(`Word count (${wordCount}) below minimum (${thresholds.minWords})`);
	}

	// Check FAQ count
	const faqCount = (data.faqs || []).length;
	if (faqCount < thresholds.minFAQs) {
		issues.push(`FAQ count (${faqCount}) below minimum (${thresholds.minFAQs})`);
	}

	// Check benefits count
	if (thresholds.minBenefits) {
		const benefitCount = (data.benefits || data.advantages || []).length;
		if (benefitCount < thresholds.minBenefits) {
			issues.push(`Benefits count (${benefitCount}) below minimum (${thresholds.minBenefits})`);
		}
	}

	return {
		valid: issues.length === 0,
		issues,
		stats: {
			wordCount,
			faqCount,
			benefitCount: (data.benefits || data.advantages || []).length
		}
	};
}

/**
 * Enrich data with computed/default values
 * @param {string} pageType - Type of page
 * @param {Object} data - Raw data
 * @returns {Object} Enriched data
 */
function enrichData(pageType, data) {
	const formatBenefits = {
		png: 'images with transparency and sharp text',
		jpg: 'photos and images where file size matters',
		webp: 'the best balance of quality and file size'
	};

	const dimensionContexts = {
		'1200x630': 'OG images and social media previews',
		'1080x1080': 'Instagram posts and social media squares',
		'1920x1080': 'video thumbnails and presentations'
	};

	return {
		...data,
		format: data.format || data.id?.toUpperCase() || 'PNG',
		formatBenefit: formatBenefits[data.format?.toLowerCase()] || 'general purpose images',
		context: data.context || dimensionContexts[data.dimensions] || 'various applications',
		competitorFocus: data.competitorFocus || 'different capabilities',
		integrationBenefit: data.integrationBenefit || 'automate image creation in your workflow'
	};
}

/**
 * Simple string interpolation
 * @param {string} template - Template string
 * @param {Object} data - Data for interpolation
 * @returns {string} Interpolated string
 */
function interpolate(template, data) {
	return template.replace(/\{(\w+)\}/g, (match, key) => {
		return data[key] !== undefined ? data[key] : match;
	});
}
