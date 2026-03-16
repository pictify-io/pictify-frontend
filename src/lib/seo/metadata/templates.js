/**
 * SEO Metadata Templates
 * Title and description patterns per page type for consistent, scalable SEO
 */

export const BASE_URL = 'https://pictify.io';
export const SITE_NAME = 'Pictify';

/**
 * Title templates per page type
 * Use {placeholders} for dynamic content
 */
export const titleTemplates = {
	// Use case pages (e.g., /tools/og-image-generator)
	useCase: '{label} | Free Online Tool | Pictify',

	// Tool format pages (e.g., /tools/html-to-png)
	tool: 'HTML to {format} Converter - Free Online Tool | Pictify',

	// Tool dimension pages (e.g., /tools/html-to-png/1200x630)
	toolDimension: 'HTML to {format} {dimensions} Converter | Pictify',

	// Comparison pages (e.g., /compare/pictify-vs-cloudinary)
	comparison: '{title} ({year}) | Honest Comparison | Pictify',

	// Alternative pages
	alternative: 'Best {competitor} Alternative | Pictify',

	// Glossary pages (e.g., /glossary/og-image)
	glossary: '{title} | Image Generation Glossary | Pictify',

	// Integration pages (e.g., /integrations/zapier)
	integration: '{name} Integration | Pictify',

	// Persona pages (e.g., /for/developers)
	persona: 'Pictify for {persona} | HTML to Image API',

	// Template category pages
	templateCategory: '{category} Templates | Pictify',

	// Individual template pages
	template: '{name} Template | Pictify',

	// OG platform pages (e.g., /tools/og-image-generator/wordpress)
	ogPlatform: 'OG Image Generator for {platform} | Pictify',

	// Blog pages
	blog: '{title} | Pictify Blog',

	// Static pages
	home: 'Pictify | HTML to Image API - Design Once, Render via API',
	pricing: 'Pricing | Pictify - HTML to Image API',
	tools: 'Free Online Image Tools | Pictify',
	templates: 'Image Templates | Pictify',
	compare: 'Compare Pictify vs Alternatives | Pictify',
	glossaryHub: 'Image Generation Glossary | Pictify',
	integrationsHub: 'Integrations | Pictify'
};

/**
 * Description templates per page type
 * Use {placeholders} for dynamic content
 */
export const descriptionTemplates = {
	// Use case pages
	useCase: '{description} Design once, render via API. Free to start, no credit card required.',

	// Tool format pages
	tool: 'Convert HTML to {format} images instantly. Free online {format} converter with API access. Perfect for social media images, marketing materials, and automated workflows.',

	// Tool dimension pages
	toolDimension:
		'Generate {dimensions} {format} images from HTML. Perfect for {useCaseContext}. Free online tool with API access for automation.',

	// Comparison pages
	comparison:
		'Compare Pictify and {competitor}. See pricing, features, and why teams choose Pictify for HTML to image generation. Updated {year}.',

	// Alternative pages
	alternative:
		'Looking for a {competitor} alternative? See why developers and marketers choose Pictify for HTML to image generation. Better pricing, simpler API.',

	// Glossary pages
	glossary: '{shortDefinition} Learn more about {title} and how it applies to image generation.',

	// Integration pages
	integration:
		'Connect Pictify with {name}. {description} Set up in minutes with our easy integration guide.',

	// Persona pages
	persona:
		'{description} Pictify helps {persona} create beautiful images at scale with our HTML to image API.',

	// Template category pages
	templateCategory:
		'Browse {count}+ professional {category} templates. Customize and generate images via API. Perfect for {useCase}.',

	// Individual template pages
	template: '{description} Customize this template and generate images via API.',

	// OG platform pages
	ogPlatform:
		'Generate perfect OG images for {platform}. Recommended size: {recommendedSize}. Free online tool with {platform} setup guide.',

	// Blog pages
	blog: '{excerpt}',

	// Static pages
	home: 'Design beautiful images with HTML/CSS and render them via API. Perfect for social media images, marketing materials, and automated workflows. Free to start.',
	pricing:
		'Simple, transparent pricing for Pictify HTML to Image API. Start free, scale as you grow. No credit card required.',
	tools:
		'Free online tools for image generation. Convert HTML to PNG, JPG, WebP. Generate OG images, social media graphics, and more.',
	templates:
		'Browse professional image templates. Customize and generate images via API. OG images, social media graphics, marketing materials.',
	compare:
		'Compare Pictify with alternatives like Cloudinary, imgix, and Placid. See why teams choose Pictify for HTML to image generation.',
	glossaryHub:
		'Learn image generation terminology. Definitions for OG images, Open Graph, social previews, and more.',
	integrationsHub:
		'Connect Pictify with your favorite tools. Zapier, Make, n8n, and more. Automate image generation in your workflow.'
};

/**
 * Keywords per page type (base keywords, augmented with page-specific ones)
 */
export const keywordTemplates = {
	useCase: ['html to image', 'image api', 'automated image generation', '{keywords}'],
	tool: [
		'html to {format}',
		'{format} converter',
		'html to {format} api',
		'convert html to {format}'
	],
	toolDimension: ['html to {format} {dimensions}', '{dimensions} image', '{dimensions} {format}'],
	comparison: ['{competitor} alternative', 'pictify vs {competitor}', '{competitor} comparison'],
	glossary: ['{term}', 'what is {term}', '{term} definition', '{term} meaning'],
	integration: ['{name} integration', 'pictify {name}', '{name} image generation'],
	persona: ['image api for {persona}', 'html to image {persona}'],
	templateCategory: ['{category} templates', '{category} image templates'],
	ogPlatform: ['og image {platform}', '{platform} og image', '{platform} social preview']
};

/**
 * Generate title from template
 * @param {string} pageType - The type of page
 * @param {Object} data - Data to interpolate into template
 * @returns {string} Generated title
 */
export function generateTitle(pageType, data = {}) {
	const template = titleTemplates[pageType];
	if (!template) {
		return data.title || SITE_NAME;
	}
	return interpolate(template, { ...data, year: data.year || new Date().getFullYear() });
}

/**
 * Generate description from template
 * @param {string} pageType - The type of page
 * @param {Object} data - Data to interpolate into template
 * @returns {string} Generated description
 */
export function generateDescription(pageType, data = {}) {
	const template = descriptionTemplates[pageType];
	if (!template) {
		return data.description || '';
	}
	const description = interpolate(template, data);
	// Truncate to 160 characters for optimal SEO
	return description.length > 160 ? description.slice(0, 157) + '...' : description;
}

/**
 * Generate keywords from template
 * @param {string} pageType - The type of page
 * @param {Object} data - Data to interpolate into template
 * @returns {string[]} Generated keywords array
 */
export function generateKeywords(pageType, data = {}) {
	const template = keywordTemplates[pageType];
	if (!template) return [];

	return template.map((keyword) => interpolate(keyword, data).toLowerCase());
}

/**
 * Interpolate placeholders in template string
 * @param {string} template - Template with {placeholders}
 * @param {Object} data - Data object for interpolation
 * @returns {string} Interpolated string
 */
function interpolate(template, data) {
	return template.replace(/\{(\w+)\}/g, (match, key) => {
		return data[key] !== undefined ? data[key] : match;
	});
}
