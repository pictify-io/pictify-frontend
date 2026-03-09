/**
 * Personalization config — maps use cases to dashboard content
 */

// Quick action definitions (id → action metadata)
const ACTIONS = {
	bulk_render: { id: 'bulk_render', label: 'Bulk Render', desc: 'Generate 100s of images from a CSV', href: '/dashboard/template', icon: 'batch', color: '#ff6b6b' },
	live_links: { id: 'live_links', label: 'Live Links', desc: 'Live images that update via URL params', href: '/dashboard/template', icon: 'link', color: '#3b82f6' },
	ab_test: { id: 'ab_test', label: 'A/B Test', desc: 'Test image variants to find the best', href: '/dashboard/experiments/create?type=ab_test', icon: 'chart', color: '#f59e0b' },
	smart_links: { id: 'smart_links', label: 'Smart Links', desc: 'Route viewers to the best-performing link', href: '/dashboard/experiments/create?type=smart_link', icon: 'shield', color: '#4ade80' },
	scheduled: { id: 'scheduled', label: 'Scheduled', desc: 'Auto-swap images on a schedule', href: '/dashboard/experiments/create?type=scheduled', icon: 'clock', color: '#a78bfa' },
	auto_optimize: { id: 'auto_optimize', label: 'Auto-Optimize', desc: 'Enable on any A/B test to auto-pick winners', href: '/dashboard/experiments/create', icon: 'lightning', color: '#a855f7' },
	api_playground: { id: 'api_playground', label: 'API Playground', desc: 'Test API endpoints interactively', href: '/dashboard/api-playground', icon: 'code', color: '#06b6d4' },
	api_keys: { id: 'api_keys', label: 'API Keys', desc: 'Get your API key for automation', href: '/dashboard/api-token', icon: 'key', color: '#8b5cf6' },
	create_template: { id: 'create_template', label: 'New Template', desc: 'Start building a new template', href: '/dashboard/template/create', icon: 'plus', color: '#ec4899' },
};

const DEFAULT_ACTIONS = ['bulk_render', 'live_links', 'ab_test', 'smart_links', 'scheduled', 'auto_optimize'];

// Which 6 quick actions to show per use case (ordered by relevance)
export const QUICK_ACTION_PRESETS = {
	'social-media': ['create_template', 'ab_test', 'scheduled', 'bulk_render', 'smart_links', 'live_links'],
	'email-marketing': ['create_template', 'ab_test', 'bulk_render', 'live_links', 'smart_links', 'scheduled'],
	'e-commerce': ['create_template', 'bulk_render', 'ab_test', 'live_links', 'smart_links', 'scheduled'],
	'dashboard-reporting': ['api_playground', 'api_keys', 'live_links', 'bulk_render', 'create_template', 'scheduled'],
	'certificates': ['create_template', 'bulk_render', 'live_links', 'api_playground', 'api_keys', 'ab_test'],
	'personalized-images': ['api_playground', 'api_keys', 'bulk_render', 'live_links', 'create_template', 'ab_test'],
	'content-marketing': ['create_template', 'ab_test', 'smart_links', 'bulk_render', 'scheduled', 'live_links'],
};

// Personalized hero copy per use case
export const WELCOME_MESSAGES = {
	'social-media': {
		title: 'Create scroll-stopping visuals.',
		subtitle: 'Design social media graphics that drive engagement across every platform.',
	},
	'email-marketing': {
		title: 'Make every email impossible to ignore.',
		subtitle: 'Create eye-catching email headers and campaign banners at scale.',
	},
	'e-commerce': {
		title: 'Sell more with better visuals.',
		subtitle: 'Generate product banners, pricing cards, and promo graphics automatically.',
	},
	'dashboard-reporting': {
		title: 'Automate your visual reports.',
		subtitle: 'Generate KPI cards, charts, and leaderboard images from live data.',
	},
	'certificates': {
		title: 'Award excellence at scale.',
		subtitle: 'Generate certificates, badges, and diplomas automatically from your data.',
	},
	'personalized-images': {
		title: 'One template, millions of images.',
		subtitle: 'Generate personalized visuals with user-specific data via API.',
	},
	'content-marketing': {
		title: 'Never design another blog image by hand.',
		subtitle: 'Auto-generate featured images and thumbnails for every piece of content.',
	},
};

// Recommended template use-case IDs (must match keys in useCaseTemplateMap)
export const STARTER_TEMPLATES = {
	'social-media': ['youtube-thumbnail', 'twitter-header', 'linkedin-banner'],
	'email-marketing': ['email-header', 'webinar-promo', 'event-invitation'],
	'e-commerce': ['product-banner', 'pricing-card', 'discount-coupon'],
	'dashboard-reporting': ['kpi-card', 'leaderboard', 'report-cover'],
	'certificates': ['course-certificate', 'certificate', 'membership-card'],
	'personalized-images': ['badge', 'membership-card', 'certificate'],
	'content-marketing': ['blog-featured-image', 'quote-card', 'tweet-card'],
};

// Personalized empty state copy per use case
export const EMPTY_STATE_MESSAGES = {
	'social-media': {
		heading: 'No social media templates yet',
		subtitle: 'Create your first social media graphic to start engaging your audience.',
		cta: 'Create Social Template',
	},
	'email-marketing': {
		heading: 'No email templates yet',
		subtitle: 'Create your first email banner to start boosting your campaigns.',
		cta: 'Create Email Template',
	},
	'e-commerce': {
		heading: 'No product templates yet',
		subtitle: 'Create your first product visual to start driving sales.',
		cta: 'Create Product Template',
	},
	'dashboard-reporting': {
		heading: 'No reporting templates yet',
		subtitle: 'Create your first data visual to automate your reporting.',
		cta: 'Create Report Template',
	},
	'certificates': {
		heading: 'No certificate templates yet',
		subtitle: 'Create your first certificate to start awarding achievements at scale.',
		cta: 'Create Certificate Template',
	},
	'personalized-images': {
		heading: 'No personalized templates yet',
		subtitle: 'Create your first template to start generating dynamic images.',
		cta: 'Create Dynamic Template',
	},
	'content-marketing': {
		heading: 'No content templates yet',
		subtitle: 'Create your first blog image template to automate your content visuals.',
		cta: 'Create Content Template',
	},
};

// Personalized primary CTA per use case
export const PRIMARY_CTA = {
	'social-media': { label: 'Create Social Post', href: '/dashboard/template/create' },
	'email-marketing': { label: 'Create Email Banner', href: '/dashboard/template/create' },
	'e-commerce': { label: 'Create Product Visual', href: '/dashboard/template/create' },
	'dashboard-reporting': { label: 'Create Report Visual', href: '/dashboard/template/create' },
	'certificates': { label: 'Create Certificate', href: '/dashboard/template/create' },
	'personalized-images': { label: 'Try API Playground', href: '/dashboard/api-playground' },
	'content-marketing': { label: 'Create Blog Image', href: '/dashboard/template/create' },
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

