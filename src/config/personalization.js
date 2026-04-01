/**
 * Personalization config — maps use cases / intents to dashboard content
 */

import { PUBLIC_BACKEND_URL } from '$env/static/public';

// ──────────────────────────────────────────────
// Getting Started guide steps per engineer intent
// ──────────────────────────────────────────────

export const GETTING_STARTED_STEPS = {
	'ai-agent': [
		{
			number: 1,
			title: 'Get your API key',
			description: 'Generate a key to authenticate requests from your agent.',
			href: '/dashboard/api-token',
			cta: 'Generate Key',
			color: '#ffc480',
			icon: 'key',
			completedCheck: 'hasApiKey',
			code: null,
			showApiKey: true
		},
		{
			number: 2,
			title: 'Set your API key as an env variable',
			description: 'Your agent needs this to authenticate with Pictify. Add it to your shell profile so it persists.',
			href: null,
			cta: null,
			color: '#ff6b6b',
			icon: 'terminal',
			completedCheck: null,
			code: null,
			installCommand: 'export PICTIFY_API_KEY={{API_KEY}}'
		},
		{
			number: 3,
			title: 'Install Pictify skills',
			description: 'Add Pictify image generation skills to Claude Code, Cursor, or Windsurf with a single command.',
			href: null,
			cta: null,
			color: '#a78bfa',
			icon: 'terminal',
			completedCheck: null,
			code: null,
			installCommand: 'npx skills add pictify-io/skills'
		},
		{
			number: 4,
			title: 'Generate your first image',
			description: 'Paste this prompt into your AI agent to generate your first image with Pictify.',
			href: null,
			cta: null,
			color: '#4ade80',
			icon: 'chat',
			completedCheck: 'hasImages',
			code: null,
			samplePrompt: 'Generate a 1200x630 image with a dark background and the text "Hello World" centered in white. Use Pictify.'
		}
	],
	'api-integration': [
		{
			number: 1,
			title: 'Get your API key',
			description: 'You\'ll need this to authenticate API requests from your backend.',
			href: '/dashboard/api-token',
			cta: 'Generate Key',
			color: '#ffc480',
			icon: 'key',
			completedCheck: 'hasApiKey',
			code: null,
			showApiKey: true
		},
		{
			number: 2,
			title: 'Create your first image via API',
			description: 'Run this curl command to generate an image directly — no template needed.',
			href: null,
			cta: null,
			color: '#ff6b6b',
			icon: 'code',
			completedCheck: 'hasImages',
			code: null,
			showCurl: true
		},
		{
			number: 3,
			title: 'Create a template for dynamic images',
			description: 'Templates let you swap variables (name, title, price) on each render. Open the editor to build one.',
			href: '/template-workspace/create',
			cta: 'Open Editor',
			color: '#4ade80',
			icon: 'layout',
			completedCheck: 'hasTemplates',
			code: null
		}
	],
	'no-code': [
		{
			number: 1,
			title: 'Get your API key',
			description: 'You\'ll paste this into your automation tool to connect it with Pictify.',
			href: '/dashboard/api-token',
			cta: 'Generate Key',
			color: '#ffc480',
			icon: 'key',
			completedCheck: 'hasApiKey',
			code: null,
			showApiKey: true
		},
		{
			number: 2,
			title: 'Connect your automation tool',
			description: 'Pick your tool below and follow the steps to generate images automatically.',
			href: null,
			cta: null,
			color: '#a78bfa',
			icon: 'link',
			completedCheck: null,
			code: null,
			tabbedGuide: {
				tabs: [
					{
						id: 'zapier',
						label: 'Zapier',
						steps: [
							{ text: 'Create a new Zap and pick your trigger (e.g. new row in Google Sheets)' },
							{ text: 'Add an action, search "Webhooks by Zapier", choose POST' },
							{ text: 'Set the URL', code: '{{BACKEND_URL}}/images' },
							{ text: 'Add these headers', code: 'Authorization: Bearer {{API_KEY}}\nContent-Type: application/json' },
							{ text: 'Set the body to your HTML payload', code: '{"html": "<div>Your HTML here</div>"}' },
							{ text: 'Test & turn on your Zap' }
						]
					},
					{
						id: 'make',
						label: 'Make',
						steps: [
							{ text: 'Create a new scenario and add your trigger module' },
							{ text: 'Add an HTTP module, choose "Make a request"' },
							{ text: 'Set Method to POST and the URL', code: '{{BACKEND_URL}}/images' },
							{ text: 'Add these headers', code: 'Authorization: Bearer {{API_KEY}}\nContent-Type: application/json' },
							{ text: 'Set Body type to Raw with this content', code: '{"html": "<div>Your HTML here</div>"}' },
							{ text: 'Run once to test, then activate the scenario' }
						]
					},
					{
						id: 'n8n',
						label: 'n8n',
						steps: [
							{ text: 'Add your trigger node (e.g. Webhook, Cron, Google Sheets)' },
							{ text: 'Add an HTTP Request node' },
							{ text: 'Set Method to POST and the URL', code: '{{BACKEND_URL}}/images' },
							{ text: 'Set Authentication to Header Auth', code: 'Name: Authorization\nValue: Bearer {{API_KEY}}' },
							{ text: 'Set Body Content Type to JSON with this body', code: '{"html": "<div>Your HTML here</div>"}' },
							{ text: 'Execute the workflow to test' }
						]
					}
				]
			}
		},
		{
			number: 3,
			title: 'Create a template for dynamic images',
			description: 'Want to swap text/images on each render? Build a template with variables in the editor.',
			href: '/template-workspace/create',
			cta: 'Open Editor',
			color: '#4ade80',
			icon: 'layout',
			completedCheck: 'hasTemplates',
			code: null
		}
	],
	'template-builder': [
		{
			number: 1,
			title: 'Create your first template',
			description: 'Open the drag-and-drop editor to design a reusable image template.',
			href: '/template-workspace/create',
			cta: 'Open Editor',
			color: '#ffc480',
			icon: 'layout',
			completedCheck: 'hasTemplates',
			code: null
		},
		{
			number: 2,
			title: 'Add variables',
			description: 'Select any text or image in your template and mark it as a variable. This lets you swap content on each render.',
			href: null,
			cta: null,
			color: '#ff6b6b',
			icon: 'code',
			completedCheck: null,
			code: '{"title": "Hello World", "subtitle": "Dynamic text", "logo": "https://..."}'
		},
		{
			number: 3,
			title: 'Render your template',
			description: 'Generate an image from your template — try it right from the template page or use bulk render with a CSV.',
			href: null,
			cta: null,
			color: '#4ade80',
			icon: 'image',
			completedCheck: 'hasImages',
			code: null
		}
	],
	exploring: [
		{
			number: 1,
			title: 'Generate an image with HTML',
			description: 'Paste any HTML/CSS below and get an image back — no signup or template needed.',
			href: '/tools/html-to-image',
			cta: 'Try It',
			color: '#ffc480',
			icon: 'code',
			completedCheck: null,
			code: null
		},
		{
			number: 2,
			title: 'Open the template editor',
			description: 'Build a reusable template with the drag-and-drop editor.',
			href: '/template-workspace/create',
			cta: 'Open Editor',
			color: '#ff6b6b',
			icon: 'layout',
			completedCheck: 'hasTemplates',
			code: null
		},
		{
			number: 3,
			title: 'Try the API playground',
			description: 'Test API endpoints interactively and see live responses.',
			href: '/dashboard/api-playground',
			cta: 'Open Playground',
			color: '#4ade80',
			icon: 'code',
			completedCheck: null,
			code: null
		}
	]
};

// Default steps (fallback when no intent is set)
export const DEFAULT_GETTING_STARTED_STEPS = GETTING_STARTED_STEPS['api-integration'];

// Curl example generator
export function getCurlExample(apiKey) {
	const key = apiKey || 'YOUR_API_KEY';
	return `curl -X POST ${PUBLIC_BACKEND_URL}/images \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"html": "<div style=\\"width:1200px;height:630px;background:#1a1a2e;display:flex;align-items:center;justify-content:center\\"><h1 style=\\"color:white;font-size:48px\\">Hello World</h1></div>"}'`;
}

// Quick action definitions (id → action metadata)
const ACTIONS = {
	bulk_render: {
		id: 'bulk_render',
		label: 'Bulk Render',
		desc: 'Generate 100s of images from a CSV',
		href: '/dashboard/template',
		icon: 'batch',
		color: '#ff6b6b'
	},
	live_links: {
		id: 'live_links',
		label: 'Live Links',
		desc: 'Live images that update via URL params',
		href: '/dashboard/template',
		icon: 'link',
		color: '#3b82f6'
	},
	ab_test: {
		id: 'ab_test',
		label: 'A/B Test',
		desc: 'Test image variants to find the best',
		href: '/dashboard/experiments/create?type=ab_test',
		icon: 'chart',
		color: '#f59e0b'
	},
	smart_links: {
		id: 'smart_links',
		label: 'Smart Links',
		desc: 'Route viewers to the best-performing link',
		href: '/dashboard/experiments/create?type=smart_link',
		icon: 'shield',
		color: '#4ade80'
	},
	scheduled: {
		id: 'scheduled',
		label: 'Scheduled',
		desc: 'Auto-swap images on a schedule',
		href: '/dashboard/experiments/create?type=scheduled',
		icon: 'clock',
		color: '#a78bfa'
	},
	auto_optimize: {
		id: 'auto_optimize',
		label: 'Auto-Optimize',
		desc: 'Enable on any A/B test to auto-pick winners',
		href: '/dashboard/experiments/create',
		icon: 'lightning',
		color: '#a855f7'
	},
	api_playground: {
		id: 'api_playground',
		label: 'API Playground',
		desc: 'Test API endpoints interactively',
		href: '/dashboard/api-playground',
		icon: 'code',
		color: '#06b6d4'
	},
	api_keys: {
		id: 'api_keys',
		label: 'API Keys',
		desc: 'Get your API key for automation',
		href: '/dashboard/api-token',
		icon: 'key',
		color: '#8b5cf6'
	},
	create_template: {
		id: 'create_template',
		label: 'New Template',
		desc: 'Start building a new template',
		href: '/dashboard/template/create',
		icon: 'plus',
		color: '#ec4899'
	}
};

const DEFAULT_ACTIONS = [
	'bulk_render',
	'live_links',
	'ab_test',
	'smart_links',
	'scheduled',
	'auto_optimize'
];

// Which 6 quick actions to show per use case (ordered by relevance)
export const QUICK_ACTION_PRESETS = {
	'social-media': [
		'create_template',
		'ab_test',
		'scheduled',
		'bulk_render',
		'smart_links',
		'live_links'
	],
	'email-marketing': [
		'create_template',
		'ab_test',
		'bulk_render',
		'live_links',
		'smart_links',
		'scheduled'
	],
	'e-commerce': [
		'create_template',
		'bulk_render',
		'ab_test',
		'live_links',
		'smart_links',
		'scheduled'
	],
	'dashboard-reporting': [
		'api_playground',
		'api_keys',
		'live_links',
		'bulk_render',
		'create_template',
		'scheduled'
	],
	certificates: [
		'create_template',
		'bulk_render',
		'live_links',
		'api_playground',
		'api_keys',
		'ab_test'
	],
	'personalized-images': [
		'api_playground',
		'api_keys',
		'bulk_render',
		'live_links',
		'create_template',
		'ab_test'
	],
	'content-marketing': [
		'create_template',
		'ab_test',
		'smart_links',
		'bulk_render',
		'scheduled',
		'live_links'
	],
	// Engineer-centric intents
	'ai-agent': [
		'api_keys',
		'api_playground',
		'create_template',
		'bulk_render',
		'live_links',
		'ab_test'
	],
	'api-integration': [
		'api_keys',
		'api_playground',
		'create_template',
		'bulk_render',
		'live_links',
		'ab_test'
	],
	'no-code': [
		'create_template',
		'bulk_render',
		'live_links',
		'ab_test',
		'scheduled',
		'smart_links'
	],
	'template-builder': [
		'create_template',
		'bulk_render',
		'live_links',
		'ab_test',
		'api_playground',
		'api_keys'
	],
	exploring: [
		'create_template',
		'api_playground',
		'bulk_render',
		'live_links',
		'ab_test',
		'smart_links'
	]
};

// Personalized hero copy per use case / intent
export const WELCOME_MESSAGES = {
	'social-media': {
		title: 'Create scroll-stopping visuals.',
		subtitle: 'Design social media graphics that drive engagement across every platform.'
	},
	'email-marketing': {
		title: 'Make every email impossible to ignore.',
		subtitle: 'Create eye-catching email headers and campaign banners at scale.'
	},
	'e-commerce': {
		title: 'Sell more with better visuals.',
		subtitle: 'Generate product banners, pricing cards, and promo graphics automatically.'
	},
	'dashboard-reporting': {
		title: 'Automate your visual reports.',
		subtitle: 'Generate KPI cards, charts, and leaderboard images from live data.'
	},
	certificates: {
		title: 'Award excellence at scale.',
		subtitle: 'Generate certificates, badges, and diplomas automatically from your data.'
	},
	'personalized-images': {
		title: 'One template, millions of images.',
		subtitle: 'Generate personalized visuals with user-specific data via API.'
	},
	'content-marketing': {
		title: 'Never design another blog image by hand.',
		subtitle: 'Auto-generate featured images and thumbnails for every piece of content.'
	},
	// Engineer-centric intents
	'ai-agent': {
		title: 'Give your AI agent the power of images.',
		subtitle: 'Connect Pictify to your agent via MCP or REST and let it generate visuals autonomously.'
	},
	'api-integration': {
		title: 'Generate images from your codebase.',
		subtitle: 'Design a template once, then render thousands of variants via a single API call.'
	},
	'no-code': {
		title: 'Beautiful images, zero code.',
		subtitle: 'Design in the editor, bulk-generate from CSV, and share live links — no coding required.'
	},
	'template-builder': {
		title: 'Design once, render thousands.',
		subtitle: 'Build reusable templates with variables, then generate personalized images at scale.'
	},
	exploring: {
		title: 'Welcome to Pictify.',
		subtitle: 'Explore templates, try the editor, and see what programmatic image generation can do.'
	}
};

// Recommended template use-case IDs (must match keys in useCaseTemplateMap)
export const STARTER_TEMPLATES = {
	'social-media': ['youtube-thumbnail', 'twitter-header', 'linkedin-banner'],
	'email-marketing': ['email-header', 'webinar-promo', 'event-invitation'],
	'e-commerce': ['product-banner', 'pricing-card', 'discount-coupon'],
	'dashboard-reporting': ['kpi-card', 'leaderboard', 'report-cover'],
	certificates: ['course-certificate', 'certificate', 'membership-card'],
	'personalized-images': ['badge', 'membership-card', 'certificate'],
	'content-marketing': ['blog-featured-image', 'quote-card', 'tweet-card']
};

// Personalized empty state copy per use case
export const EMPTY_STATE_MESSAGES = {
	'social-media': {
		heading: 'No social media templates yet',
		subtitle: 'Create your first social media graphic to start engaging your audience.',
		cta: 'Create Social Template'
	},
	'email-marketing': {
		heading: 'No email templates yet',
		subtitle: 'Create your first email banner to start boosting your campaigns.',
		cta: 'Create Email Template'
	},
	'e-commerce': {
		heading: 'No product templates yet',
		subtitle: 'Create your first product visual to start driving sales.',
		cta: 'Create Product Template'
	},
	'dashboard-reporting': {
		heading: 'No reporting templates yet',
		subtitle: 'Create your first data visual to automate your reporting.',
		cta: 'Create Report Template'
	},
	certificates: {
		heading: 'No certificate templates yet',
		subtitle: 'Create your first certificate to start awarding achievements at scale.',
		cta: 'Create Certificate Template'
	},
	'personalized-images': {
		heading: 'No personalized templates yet',
		subtitle: 'Create your first template to start generating dynamic images.',
		cta: 'Create Dynamic Template'
	},
	'content-marketing': {
		heading: 'No content templates yet',
		subtitle: 'Create your first blog image template to automate your content visuals.',
		cta: 'Create Content Template'
	}
};

// Personalized primary CTA per use case
export const PRIMARY_CTA = {
	'social-media': { label: 'Create Social Post', href: '/dashboard/template/create' },
	'email-marketing': { label: 'Create Email Banner', href: '/dashboard/template/create' },
	'e-commerce': { label: 'Create Product Visual', href: '/dashboard/template/create' },
	'dashboard-reporting': { label: 'Create Report Visual', href: '/dashboard/template/create' },
	certificates: { label: 'Create Certificate', href: '/dashboard/template/create' },
	'personalized-images': { label: 'Try API Playground', href: '/dashboard/api-playground' },
	'content-marketing': { label: 'Create Blog Image', href: '/dashboard/template/create' },
	// Engineer-centric intents
	'ai-agent': { label: 'API Playground', href: '/dashboard/api-playground' },
	'api-integration': { label: 'API Playground', href: '/dashboard/api-playground' },
	'no-code': { label: 'Create Template', href: '/dashboard/template/create' },
	'template-builder': { label: 'Create Template', href: '/template-workspace/create' },
	exploring: { label: 'Browse Templates', href: '/dashboard/template' }
};

// Override primary CTA for API-first integration modes
export const API_PRIMARY_CTA = { label: 'API Playground', href: '/dashboard/api-playground' };

/**
 * Get the ordered quick actions for a use case
 */
export function getQuickActions(useCase) {
	const preset = QUICK_ACTION_PRESETS[useCase] || DEFAULT_ACTIONS;
	return preset.map((id) => ACTIONS[id]).filter(Boolean);
}

/**
 * Get welcome message for a use case
 */
export function getWelcomeMessage(useCase) {
	return WELCOME_MESSAGES[useCase] || null;
}

/**
 * Get empty state message for a use case
 */
export function getEmptyStateMessage(useCase) {
	return EMPTY_STATE_MESSAGES[useCase] || null;
}

/**
 * Get personalized primary CTA
 */
export function getPrimaryCTA(useCase, integrationMode) {
	if (integrationMode === 'api') return API_PRIMARY_CTA;
	return PRIMARY_CTA[useCase] || null;
}
