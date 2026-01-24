// Target personas for /for/[persona] pages

export const personas = [
	{
		slug: 'developers',
		title: 'Pictify for Developers',
		headline: 'Ship image generation without managing browsers',
		description: 'Stop wrestling with Puppeteer infrastructure. Our API handles headless browsers, scaling, and caching so you can focus on building features.',
		benefits: [
			'Simple REST API with SDKs for Node.js, Python, Go, Ruby',
			'No browser infrastructure to manage or scale',
			'Built-in CDN hosting for generated images',
			'Webhooks and async processing for large batches'
		],
		useCases: [
			'Generate OG images dynamically at request time',
			'Create personalized images from user data',
			'Automate certificate and badge generation',
			'Build internal tools with image export'
		],
		cta: 'Get Your API Key',
		ctaUrl: '/signup',
		testimonial: {
			quote: 'We replaced 500 lines of Puppeteer code with a single API call.',
			author: 'Senior Engineer',
			company: 'Series B Startup'
		}
	},
	{
		slug: 'marketers',
		title: 'Pictify for Marketers',
		headline: 'Create on-brand visuals at scale',
		description: 'Design once, generate thousands. Build templates in our visual editor and produce variations automatically for campaigns, social, and ads.',
		benefits: [
			'Visual template editor—no code required',
			'Brand asset library for logos and fonts',
			'Bulk generation from spreadsheets or CRM',
			'Multi-size export for every platform'
		],
		useCases: [
			'Social media content at scale',
			'Personalized email images',
			'Ad creative variations for A/B testing',
			'Event and webinar graphics'
		],
		cta: 'Try the Editor Free',
		ctaUrl: '/signup',
		testimonial: {
			quote: 'We produce more social content in one day than we used to in a month.',
			author: 'Head of Marketing',
			company: 'D2C Brand'
		}
	},
	{
		slug: 'product-teams',
		title: 'Pictify for Product Teams',
		headline: 'Add image generation to your product',
		description: 'Give your users the ability to generate, customize, and export images. White-label our engine or use the API to power in-app experiences.',
		benefits: [
			'API-first for easy product integration',
			'White-label options available',
			'Usage-based pricing that scales',
			'99.9% uptime SLA for production'
		],
		useCases: [
			'Let users export designs as images',
			'Generate social sharing previews',
			'Automated report and chart exports',
			'Dynamic email image personalization'
		],
		cta: 'Talk to Sales',
		ctaUrl: '/contact',
		testimonial: {
			quote: 'Our users generate 50k images per month through our app.',
			author: 'Product Manager',
			company: 'SaaS Platform'
		}
	},
	{
		slug: 'agencies',
		title: 'Pictify for Agencies',
		headline: 'Scale creative production for clients',
		description: 'Deliver more client work without hiring more designers. Build reusable templates and generate client-specific variations on demand.',
		benefits: [
			'Manage multiple client workspaces',
			'Template library for common formats',
			'White-label generated images',
			'Bulk export for campaigns'
		],
		useCases: [
			'Client social media management',
			'Multi-brand content production',
			'Rapid ad creative iteration',
			'Report and dashboard exports'
		],
		cta: 'Start Agency Plan',
		ctaUrl: '/pricing',
		testimonial: {
			quote: 'We handle 3x the client volume with the same team.',
			author: 'Creative Director',
			company: 'Digital Agency'
		}
	},
	{
		slug: 'saas-founders',
		title: 'Pictify for SaaS Founders',
		headline: 'Add a growth loop to your product',
		description: 'Dynamic OG images increase social sharing and engagement. Auto-generate preview images for user content and watch your link clicks grow.',
		benefits: [
			'Increase social sharing with rich previews',
			'Personalized images boost engagement',
			'Quick integration—launch in hours',
			'Free tier to validate before scaling'
		],
		useCases: [
			'Dynamic OG images for user-generated pages',
			'Share cards that include user data',
			'Achievement and milestone badges',
			'Email images with personalization'
		],
		cta: 'Start Free',
		ctaUrl: '/signup',
		testimonial: {
			quote: 'Our link click-through rate jumped 40% after adding dynamic OG images.',
			author: 'Founder',
			company: 'Developer Tool Startup'
		}
	},
	{
		slug: 'e-commerce',
		title: 'Pictify for E-Commerce',
		headline: 'Automate product visuals',
		description: 'Generate product social cards, promo graphics, and sale banners automatically. Connect to Shopify, WooCommerce, or your custom store.',
		benefits: [
			'Product image automation',
			'Sale and promo banner generation',
			'Social cards for product shares',
			'Platform integrations (Shopify, WooCommerce)'
		],
		useCases: [
			'Product launch graphics',
			'Flash sale banners',
			'Social proof cards with reviews',
			'Dynamic pricing images'
		],
		cta: 'Connect Your Store',
		ctaUrl: '/integrations/shopify',
		testimonial: {
			quote: 'We launch products with full social assets automatically.',
			author: 'E-commerce Manager',
			company: 'Fashion Brand'
		}
	}
];
