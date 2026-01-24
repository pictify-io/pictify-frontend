// OG Platform configurations

export const ogPlatforms = [
	{ id: 'wordpress', label: 'WordPress' },
	{ id: 'notion', label: 'Notion' },
	{ id: 'shopify', label: 'Shopify' },
	{ id: 'ghost', label: 'Ghost' },
	{ id: 'github', label: 'GitHub' },
	{ id: 'linkedin', label: 'LinkedIn' },
	{ id: 'twitter', label: 'X (Twitter)' }
];

export const platformGuides = {
	wordpress: [
		'Install a SEO plugin (Yoast/RankMath) or edit theme head',
		'Upload the OG image and copy its absolute URL',
		'Set og:image, og:title, og:description in plugin/theme',
		'Purge caches; verify in Facebook Sharing Debugger'
	],
	notion: [
		'Publish page (or proxy via custom domain)',
		'Host OG image on a CDN and copy URL',
		'Add OG meta in the proxy/front (e.g., Vercel middleware)',
		'Test with Facebook/X debuggers'
	],
	shopify: [
		'Admin → Online Store → Preferences → Social sharing image',
		'For per‑product/blog, set featured image/template override',
		'Ensure theme.liquid renders og:image and twitter:card',
		'Save and validate in debuggers'
	],
	ghost: [
		'In Post/Page settings, set Social preview image',
		'Ensure theme includes og:* tags',
		'Update and verify in debuggers'
	],
	github: [
		'For GitHub Pages, add OG meta to index.html',
		'Commit OG image or use external CDN URL',
		'Push and validate in debuggers'
	],
	linkedin: [
		'LinkedIn pulls og:image from your page',
		'Use absolute HTTPS URL, 1200×630 recommended',
		'Use Post Inspector to refresh cache'
	],
	twitter: [
		'Add twitter:card=summary_large_image and twitter:image',
		'Use 1200×630 (≤5MB). PNG/JPG/WebP supported',
		'Validate in Card Validator'
	]
};

export const platformRecommendedSizes = {
	wordpress: ['1200x630'],
	notion: ['1200x630'],
	shopify: ['1200x630'],
	ghost: ['1200x630'],
	github: ['1200x630'],
	linkedin: ['1200x630'],
	twitter: ['1200x675']
};
