/**
 * FAQ Generation System
 * Generates contextual FAQs for different page types
 */

/**
 * FAQ templates per page type
 * Each template has questions and answer patterns
 */
const faqTemplates = {
	tool: [
		{
			q: 'Is the HTML to {format} converter free?',
			a: 'Yes! Pictify offers a generous free tier for HTML to {format} conversion. You can generate images without a credit card. Paid plans are available for higher volume and advanced features.'
		},
		{
			q: 'How do I convert HTML to {format} programmatically?',
			a: 'Pictify provides a simple REST API. Send your HTML/CSS to our endpoint and receive a {format} image URL. We support popular languages with SDKs for Node.js, Python, Ruby, and more.'
		},
		{
			q: 'What HTML/CSS features are supported?',
			a: 'Pictify supports modern HTML5, CSS3, Flexbox, Grid, custom fonts (Google Fonts), and external images. You can render anything a modern browser can display.'
		},
		{
			q: 'How fast is the {format} generation?',
			a: 'Most images generate in under 2 seconds. We use edge computing for low latency worldwide. Enterprise customers get dedicated resources for consistent performance.'
		},
		{
			q: 'Can I use custom fonts in my {format} images?',
			a: 'Absolutely! Pictify supports Google Fonts out of the box. For custom fonts, upload them to your account or reference them via CDN in your HTML.'
		}
	],

	toolDimension: [
		{
			q: 'Why use {dimensions} for my images?',
			a: '{dimensions} is optimized for {context}. This size ensures your images display correctly without cropping or scaling issues.'
		},
		{
			q: 'Can I generate {dimensions} images in bulk?',
			a: 'Yes! Our API supports batch generation. Create thousands of {dimensions} images programmatically with a single API call or webhook integration.'
		},
		{
			q: 'What file formats support {dimensions}?',
			a: 'Generate {dimensions} images in PNG, JPG, or WebP. PNG offers transparency, JPG is smallest for photos, WebP provides the best quality-to-size ratio.'
		}
	],

	comparison: [
		{
			q: 'Is Pictify better than {competitor}?',
			a: 'It depends on your needs. Pictify excels at HTML-to-image conversion with a simple API. {competitor} may be better if you need {competitorStrength}. Try both with free tiers.'
		},
		{
			q: 'How much cheaper is Pictify vs {competitor}?',
			a: 'Pictify pricing starts at $19/month for 5,000 images. Compare this to {competitor} pricing for your volume. Most customers see 30-60% savings switching to Pictify.'
		},
		{
			q: 'How hard is it to migrate from {competitor}?',
			a: 'Migration is typically straightforward. Our API is designed to be simple. Most teams complete migration in {migrationTime}. We offer migration guides and support.'
		},
		{
			q: 'Does Pictify have all the features of {competitor}?',
			a: 'Pictify focuses on HTML-to-image conversion and does it exceptionally well. We may not have every feature {competitor} offers, but our core functionality is superior for image generation.'
		}
	],

	glossary: [
		{
			q: 'What is {title}?',
			a: '{shortDefinition}'
		},
		{
			q: 'Why is {title} important for image generation?',
			a: '{title} is crucial for ensuring your generated images display correctly across platforms. Understanding this concept helps you create better, more compatible images.'
		},
		{
			q: 'How does Pictify handle {title}?',
			a: 'Pictify automatically handles {title} best practices. Our templates and API are designed with {title} in mind, so you get optimal results without extra configuration.'
		}
	],

	integration: [
		{
			q: 'How do I connect {name} with Pictify?',
			a: 'Integration takes just a few minutes. {setupSteps} Our documentation includes step-by-step guides and video tutorials.'
		},
		{
			q: 'What can I automate with {name} + Pictify?',
			a: 'Generate images automatically when {triggerExample}. Popular automations include social media images, email headers, certificates, and dynamic marketing materials.'
		},
		{
			q: 'Is the {name} integration free?',
			a: 'The integration itself is free. You only pay for Pictify usage based on your plan. {name} may have its own pricing for automation features.'
		}
	],

	persona: [
		{
			q: 'Is Pictify good for {persona}?',
			a: 'Yes! Pictify is built with {persona} in mind. {personaBenefit} Many {persona} use Pictify daily for their image generation needs.'
		},
		{
			q: 'What do other {persona} use Pictify for?',
			a: 'Common use cases include {useCases}. {persona} particularly love our {favoriteFeature} feature.'
		},
		{
			q: 'Can {persona} use Pictify without coding?',
			a: 'Absolutely! While we have a powerful API, our template editor and integrations (Zapier, Make) let you create images without writing code.'
		}
	]
};

/**
 * Generate FAQs for a page
 * @param {string} pageType - Type of page
 * @param {Object} data - Data for interpolation
 * @param {number} [count] - Number of FAQs to generate (default: all)
 * @returns {Array<{q: string, a: string}>} Array of FAQ objects
 */
export function generateFAQs(pageType, data, count = null) {
	const templates = faqTemplates[pageType];
	if (!templates) return [];

	// Enrich data with defaults
	const enrichedData = enrichDataForFAQs(pageType, data);

	// Generate FAQs from templates
	const faqs = templates.map((template) => ({
		q: interpolate(template.q, enrichedData),
		a: interpolate(template.a, enrichedData)
	}));

	// Return requested count or all
	return count ? faqs.slice(0, count) : faqs;
}

/**
 * Generate FAQs with additional custom questions
 * @param {string} pageType - Type of page
 * @param {Object} data - Data for interpolation
 * @param {Array<{q: string, a: string}>} customFAQs - Additional custom FAQs
 * @returns {Array<{q: string, a: string}>} Combined FAQ array
 */
export function generateFAQsWithCustom(pageType, data, customFAQs = []) {
	const baseFAQs = generateFAQs(pageType, data);
	return [...baseFAQs, ...customFAQs];
}

/**
 * Merge existing FAQs with generated ones (deduplicates by question)
 * @param {Array<{q: string, a: string}>} existingFAQs - Existing FAQs (take priority)
 * @param {string} pageType - Type of page
 * @param {Object} data - Data for interpolation
 * @returns {Array<{q: string, a: string}>} Merged FAQ array
 */
export function mergeFAQs(existingFAQs, pageType, data) {
	const generated = generateFAQs(pageType, data);
	const existingQuestions = new Set(existingFAQs.map((f) => f.q.toLowerCase()));

	// Add generated FAQs that don't duplicate existing ones
	const newFAQs = generated.filter((faq) => !existingQuestions.has(faq.q.toLowerCase()));

	return [...existingFAQs, ...newFAQs];
}

/**
 * Enrich data with FAQ-specific defaults
 * @param {string} pageType - Type of page
 * @param {Object} data - Raw data
 * @returns {Object} Enriched data
 */
function enrichDataForFAQs(pageType, data) {
	const defaults = {
		context: 'social media and marketing',
		competitorStrength: 'specific features they excel at',
		migrationTime: 'under a day',
		setupSteps: 'Connect your account, configure your trigger, and set up your template.',
		triggerExample: 'new data is added to your system',
		personaBenefit: 'Our features are designed for your specific workflow.',
		useCases: 'social media images, email headers, and automated graphics',
		favoriteFeature: 'template editor'
	};

	return { ...defaults, ...data };
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
