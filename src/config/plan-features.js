/**
 * Plan Features Configuration
 *
 * Central source of truth for all feature limits and access rules per tier.
 * This configuration drives the feature gating UI and upgrade prompts.
 */

// Plan identifiers (lowercase, match backend)
export const PLANS = {
	STARTER: 'starter',
	FREE: 'starter', // Alias
	BASIC: 'basic',
	STANDARD: 'standard',
	PRO: 'standard', // Alias - 'pro' maps to 'standard'
	PROFESSIONAL: 'professional',
	BUSINESS: 'business',
	ENTERPRISE: 'enterprise'
};

// Plan display names
export const PLAN_DISPLAY_NAMES = {
	[PLANS.STARTER]: 'Free',
	free: 'Free', // Alias
	[PLANS.BASIC]: 'Basic',
	[PLANS.STANDARD]: 'Pro',
	pro: 'Pro', // Alias
	[PLANS.PROFESSIONAL]: 'Professional',
	[PLANS.BUSINESS]: 'Business',
	[PLANS.ENTERPRISE]: 'Enterprise'
};

// Plan pricing (monthly)
export const PLAN_PRICING = {
	[PLANS.STARTER]: { monthly: 0, annual: 0 },
	free: { monthly: 0, annual: 0 }, // Alias
	[PLANS.BASIC]: { monthly: 19, annual: 15 },
	[PLANS.STANDARD]: { monthly: 49, annual: 39 },
	pro: { monthly: 49, annual: 39 }, // Alias for standard
	[PLANS.PROFESSIONAL]: { monthly: 99, annual: 79 },
	[PLANS.BUSINESS]: { monthly: 249, annual: 199 },
	[PLANS.ENTERPRISE]: { monthly: null, annual: null } // Custom pricing
};

// Overage pricing per render (in cents)
// Only paid plans are eligible for overages
export const OVERAGE_PRICING = {
	[PLANS.STARTER]: { eligible: false, ratePerRenderCents: null },
	free: { eligible: false, ratePerRenderCents: null }, // Alias
	[PLANS.BASIC]: { eligible: true, ratePerRenderCents: 2 }, // $0.02/render
	[PLANS.STANDARD]: { eligible: true, ratePerRenderCents: 1 }, // $0.01/render (Pro)
	pro: { eligible: true, ratePerRenderCents: 1 }, // Alias for standard
	[PLANS.PROFESSIONAL]: { eligible: true, ratePerRenderCents: 1 }, // $0.01/render
	[PLANS.BUSINESS]: { eligible: true, ratePerRenderCents: 0.5 }, // $0.005/render
	[PLANS.ENTERPRISE]: { eligible: true, ratePerRenderCents: null } // Custom
};

/**
 * Normalize plan name to canonical form.
 * Mirrors backend util/plan.js normalizePlan — keep in sync.
 * Handles: casing ("Starter"→"starter"), aliases ("pro"→"standard"),
 * whitespace ("Pro Plus"→"pro-plus"), and nulls (→"starter").
 */
export function normalizePlan(plan) {
	if (!plan) return 'starter';
	const slug = plan.toLowerCase().replace(/\s+/g, '-');
	const aliases = {
		pro: 'standard',
		free: 'starter'
	};
	return aliases[slug] || slug || 'starter';
}

// Helper to format overage rate for display
export function formatOverageRate(plan) {
	const pricing = OVERAGE_PRICING[normalizePlan(plan)];
	if (!pricing || !pricing.eligible || !pricing.ratePerRenderCents) {
		return null;
	}
	return `$${(pricing.ratePerRenderCents / 100).toFixed(3)}`;
}

// Check if plan is eligible for overages
export function isOverageEligible(plan) {
	const pricing = OVERAGE_PRICING[normalizePlan(plan)];
	return pricing?.eligible && pricing?.ratePerRenderCents !== null;
}

// Feature identifiers
export const FEATURES = {
	// Render limits
	RENDERS: 'renders',

	// Output formats
	PDF_OUTPUT: 'pdfOutput',

	// Templates
	TEMPLATES_SAVED: 'templatesSaved',

	// Batch processing
	BATCH_RENDER: 'batchRender',
	BATCH_ITEMS_PER_REQUEST: 'batchItemsPerRequest',
	BATCH_MONTHLY_LIMIT: 'batchMonthlyLimit',

	// AI Features
	AI_BACKGROUND_REMOVER: 'aiBackgroundRemover',
	AI_COPILOT: 'aiCopilot',

	// Team & Collaboration
	TEAM_SEATS: 'teamSeats',

	// Integrations
	WEBHOOKS: 'webhooks',
	DYNAMIC_LINKS: 'dynamicLinks',
	STORAGE_CONNECTORS: 'storageConnectors',

	// Experiments
	AB_TESTING: 'abTesting',
	SMART_LINKS: 'smartLinks',
	SCHEDULED_IMAGES: 'scheduledImages',
	AUTO_OPTIMIZATION: 'autoOptimization',

	// Enterprise
	BRAND_ASSETS: 'brandAssets',
	SSO_SAML: 'ssoSaml',
	AUDIT_LOGS: 'auditLogs',
	WHITE_LABEL: 'whiteLabel',

	// API (available to all, no rate limits)
	API_ACCESS: 'apiAccess'
};

/**
 * Plan feature limits configuration
 *
 * Values can be:
 * - number: Limited to that amount
 * - true: Feature available (unlimited)
 * - false: Feature not available
 * - null: Unlimited
 */
export const PLAN_FEATURES = {
	[PLANS.STARTER]: {
		// Renders (Free tier)
		[FEATURES.RENDERS]: 50,

		// Output formats
		[FEATURES.PDF_OUTPUT]: false,

		// Templates
		[FEATURES.TEMPLATES_SAVED]: 3,

		// Batch processing
		[FEATURES.BATCH_RENDER]: false,
		[FEATURES.BATCH_ITEMS_PER_REQUEST]: 0,
		[FEATURES.BATCH_MONTHLY_LIMIT]: 0,

		// AI Features
		[FEATURES.AI_BACKGROUND_REMOVER]: false,
		[FEATURES.AI_COPILOT]: false,

		// Team
		[FEATURES.TEAM_SEATS]: 1,

		// Integrations
		[FEATURES.WEBHOOKS]: false,
		[FEATURES.DYNAMIC_LINKS]: false,
		[FEATURES.STORAGE_CONNECTORS]: false,

		// Experiments
		[FEATURES.AB_TESTING]: 1,
		[FEATURES.SMART_LINKS]: false,
		[FEATURES.SCHEDULED_IMAGES]: false,
		[FEATURES.AUTO_OPTIMIZATION]: false, // Auto-optimize is an opt-in toggle on A/B tests

		// Enterprise
		[FEATURES.BRAND_ASSETS]: false,
		[FEATURES.SSO_SAML]: false,
		[FEATURES.AUDIT_LOGS]: false,
		[FEATURES.WHITE_LABEL]: false,

		// API
		[FEATURES.API_ACCESS]: true
	},

	[PLANS.BASIC]: {
		// Renders
		[FEATURES.RENDERS]: 1000,

		// Output formats
		[FEATURES.PDF_OUTPUT]: true,

		// Templates
		[FEATURES.TEMPLATES_SAVED]: 25,

		// Batch processing
		[FEATURES.BATCH_RENDER]: true,
		[FEATURES.BATCH_ITEMS_PER_REQUEST]: 50,
		[FEATURES.BATCH_MONTHLY_LIMIT]: 500,

		// AI Features
		[FEATURES.AI_BACKGROUND_REMOVER]: 25,
		[FEATURES.AI_COPILOT]: 15,

		// Team
		[FEATURES.TEAM_SEATS]: 2,

		// Integrations
		[FEATURES.WEBHOOKS]: true,
		[FEATURES.DYNAMIC_LINKS]: true,
		[FEATURES.STORAGE_CONNECTORS]: true,

		// Experiments
		[FEATURES.AB_TESTING]: 2,
		[FEATURES.SMART_LINKS]: 1,
		[FEATURES.SCHEDULED_IMAGES]: 1,
		[FEATURES.AUTO_OPTIMIZATION]: false, // Auto-optimize is an opt-in toggle on A/B tests

		// Enterprise
		[FEATURES.BRAND_ASSETS]: true,
		[FEATURES.SSO_SAML]: false,
		[FEATURES.AUDIT_LOGS]: false,
		[FEATURES.WHITE_LABEL]: false,

		// API
		[FEATURES.API_ACCESS]: true
	},

	[PLANS.STANDARD]: {
		// Renders - Pro tier (new users get 10k, legacy standard users have 3.5k)
		[FEATURES.RENDERS]: 10000,

		// Output formats
		[FEATURES.PDF_OUTPUT]: true,

		// Templates
		[FEATURES.TEMPLATES_SAVED]: null, // Unlimited

		// Batch processing
		[FEATURES.BATCH_RENDER]: true,
		[FEATURES.BATCH_ITEMS_PER_REQUEST]: 250,
		[FEATURES.BATCH_MONTHLY_LIMIT]: null, // Unlimited

		// AI Features - included in Pro tier
		[FEATURES.AI_BACKGROUND_REMOVER]: 100,
		[FEATURES.AI_COPILOT]: 50,

		// Team
		[FEATURES.TEAM_SEATS]: 5,

		// Integrations
		[FEATURES.WEBHOOKS]: true,
		[FEATURES.DYNAMIC_LINKS]: true,
		[FEATURES.STORAGE_CONNECTORS]: true,

		// Experiments
		[FEATURES.AB_TESTING]: 5,
		[FEATURES.SMART_LINKS]: 3,
		[FEATURES.SCHEDULED_IMAGES]: 3,
		[FEATURES.AUTO_OPTIMIZATION]: true,

		// Enterprise
		[FEATURES.BRAND_ASSETS]: true,
		[FEATURES.SSO_SAML]: false,
		[FEATURES.AUDIT_LOGS]: false,
		[FEATURES.WHITE_LABEL]: false,

		// API
		[FEATURES.API_ACCESS]: true
	},

	[PLANS.PROFESSIONAL]: {
		// Renders - Legacy tier (grandfathered users)
		[FEATURES.RENDERS]: 10000,

		// Output formats
		[FEATURES.PDF_OUTPUT]: true,

		// Templates
		[FEATURES.TEMPLATES_SAVED]: null,

		// Batch processing
		[FEATURES.BATCH_RENDER]: true,
		[FEATURES.BATCH_ITEMS_PER_REQUEST]: 500,
		[FEATURES.BATCH_MONTHLY_LIMIT]: null,

		// AI Features
		[FEATURES.AI_BACKGROUND_REMOVER]: 200,
		[FEATURES.AI_COPILOT]: 100,

		// Team
		[FEATURES.TEAM_SEATS]: 10,

		// Integrations
		[FEATURES.WEBHOOKS]: true,
		[FEATURES.DYNAMIC_LINKS]: null, // Unlimited
		[FEATURES.STORAGE_CONNECTORS]: true,

		// Experiments
		[FEATURES.AB_TESTING]: 10,
		[FEATURES.SMART_LINKS]: 5,
		[FEATURES.SCHEDULED_IMAGES]: 5,
		[FEATURES.AUTO_OPTIMIZATION]: true,

		// Enterprise
		[FEATURES.BRAND_ASSETS]: true,
		[FEATURES.SSO_SAML]: false,
		[FEATURES.AUDIT_LOGS]: false,
		[FEATURES.WHITE_LABEL]: false,

		// API
		[FEATURES.API_ACCESS]: true
	},

	[PLANS.BUSINESS]: {
		// Renders - Top tier
		[FEATURES.RENDERS]: 40000,

		// Output formats
		[FEATURES.PDF_OUTPUT]: true,

		// Templates
		[FEATURES.TEMPLATES_SAVED]: null,

		// Batch processing
		[FEATURES.BATCH_RENDER]: true,
		[FEATURES.BATCH_ITEMS_PER_REQUEST]: null, // Unlimited
		[FEATURES.BATCH_MONTHLY_LIMIT]: null,

		// AI Features
		[FEATURES.AI_BACKGROUND_REMOVER]: 500,
		[FEATURES.AI_COPILOT]: 500,

		// Team
		[FEATURES.TEAM_SEATS]: 10,

		// Integrations
		[FEATURES.WEBHOOKS]: true,
		[FEATURES.DYNAMIC_LINKS]: null,
		[FEATURES.STORAGE_CONNECTORS]: true,

		// Experiments
		[FEATURES.AB_TESTING]: null,
		[FEATURES.SMART_LINKS]: null,
		[FEATURES.SCHEDULED_IMAGES]: null,
		[FEATURES.AUTO_OPTIMIZATION]: true,

		// Enterprise
		[FEATURES.BRAND_ASSETS]: true,
		[FEATURES.SSO_SAML]: false, // SSO not yet implemented — enable when ready
		[FEATURES.AUDIT_LOGS]: true,
		[FEATURES.WHITE_LABEL]: true,

		// API
		[FEATURES.API_ACCESS]: true
	},

	[PLANS.ENTERPRISE]: {
		// All unlimited/custom
		[FEATURES.RENDERS]: null,
		[FEATURES.PDF_OUTPUT]: true,
		[FEATURES.TEMPLATES_SAVED]: null,
		[FEATURES.BATCH_RENDER]: true,
		[FEATURES.BATCH_ITEMS_PER_REQUEST]: null,
		[FEATURES.BATCH_MONTHLY_LIMIT]: null,
		[FEATURES.AI_BACKGROUND_REMOVER]: null,
		[FEATURES.AI_COPILOT]: 1000,
		[FEATURES.TEAM_SEATS]: null,
		[FEATURES.WEBHOOKS]: true,
		[FEATURES.DYNAMIC_LINKS]: null,
		[FEATURES.STORAGE_CONNECTORS]: true,
		// Experiments
		[FEATURES.AB_TESTING]: null,
		[FEATURES.SMART_LINKS]: null,
		[FEATURES.SCHEDULED_IMAGES]: null,
		[FEATURES.AUTO_OPTIMIZATION]: true,
		[FEATURES.BRAND_ASSETS]: true,
		[FEATURES.SSO_SAML]: true,
		[FEATURES.AUDIT_LOGS]: true,
		[FEATURES.WHITE_LABEL]: true,
		[FEATURES.API_ACCESS]: true
	}
};

// Feature display metadata
export const FEATURE_METADATA = {
	[FEATURES.RENDERS]: {
		name: 'Renders',
		description: 'Monthly image render limit',
		icon: 'image',
		category: 'core'
	},
	[FEATURES.PDF_OUTPUT]: {
		name: 'PDF Output',
		description: 'Export as PDF documents',
		icon: 'file-text',
		category: 'output'
	},
	[FEATURES.TEMPLATES_SAVED]: {
		name: 'Saved Templates',
		description: 'Number of templates you can save',
		icon: 'folder',
		category: 'templates'
	},
	[FEATURES.BATCH_RENDER]: {
		name: 'Batch Rendering',
		description: 'Process multiple images at once',
		icon: 'layers',
		category: 'automation'
	},
	[FEATURES.BATCH_ITEMS_PER_REQUEST]: {
		name: 'Batch Size',
		description: 'Items per batch request',
		icon: 'list',
		category: 'automation'
	},
	[FEATURES.AI_BACKGROUND_REMOVER]: {
		name: 'AI Background Remover',
		description: 'Remove backgrounds with AI',
		icon: 'wand',
		category: 'ai'
	},
	[FEATURES.AI_COPILOT]: {
		name: 'AI Copilot',
		description: 'AI-powered design assistance',
		icon: 'sparkles',
		category: 'ai'
	},
	[FEATURES.TEAM_SEATS]: {
		name: 'Team Seats',
		description: 'Team member accounts',
		icon: 'users',
		category: 'team'
	},
	[FEATURES.WEBHOOKS]: {
		name: 'Webhooks',
		description: 'Custom webhook integrations',
		icon: 'zap',
		category: 'integrations'
	},
	[FEATURES.DYNAMIC_LINKS]: {
		name: 'Live Links',
		description: 'Real-time data bindings',
		icon: 'link',
		category: 'integrations'
	},
	[FEATURES.STORAGE_CONNECTORS]: {
		name: 'Storage Connectors',
		description: 'S3, GCS, Cloudinary integration',
		icon: 'cloud',
		category: 'integrations'
	},
	[FEATURES.AB_TESTING]: {
		name: 'A/B Testing',
		description: 'Test image variants to find the best performer',
		icon: 'split',
		category: 'experiments'
	},
	[FEATURES.SMART_LINKS]: {
		name: 'Smart Links',
		description: 'Show different images based on viewer context',
		icon: 'target',
		category: 'experiments'
	},
	[FEATURES.SCHEDULED_IMAGES]: {
		name: 'Scheduled Images',
		description: 'Schedule image changes and set expiration dates',
		icon: 'clock',
		category: 'experiments'
	},
	[FEATURES.AUTO_OPTIMIZATION]: {
		name: 'Auto-Optimization',
		description: 'AI-powered variant optimization with Thompson Sampling',
		icon: 'trending-up',
		category: 'experiments'
	},
	[FEATURES.BRAND_ASSETS]: {
		name: 'Brand Assets',
		description: 'Store and manage brand assets',
		icon: 'briefcase',
		category: 'branding'
	},
	[FEATURES.SSO_SAML]: {
		name: 'SSO/SAML',
		description: 'Enterprise single sign-on',
		icon: 'shield',
		category: 'enterprise'
	},
	[FEATURES.AUDIT_LOGS]: {
		name: 'Audit Logs',
		description: 'Track team activity',
		icon: 'clipboard',
		category: 'enterprise'
	},
	[FEATURES.WHITE_LABEL]: {
		name: 'White Label',
		description: 'Custom branding option',
		icon: 'tag',
		category: 'enterprise'
	},
	[FEATURES.API_ACCESS]: {
		name: 'API Access',
		description: 'Full API access with no rate limits',
		icon: 'code',
		category: 'core'
	}
};

// Feature categories for grouping in UI
export const FEATURE_CATEGORIES = {
	core: { name: 'Core Features', order: 1 },
	output: { name: 'Output Formats', order: 2 },
	templates: { name: 'Templates', order: 3 },
	automation: { name: 'Automation', order: 4 },
	ai: { name: 'AI Features', order: 5 },
	team: { name: 'Team & Collaboration', order: 6 },
	integrations: { name: 'Integrations', order: 7 },
	experiments: { name: 'Experiments', order: 7.5 },
	branding: { name: 'Branding', order: 8 },
	enterprise: { name: 'Enterprise', order: 9 }
};

// Plan order for comparison (lowest to highest)
// Includes legacy plans (Basic, Professional) for grandfathered users
// New users only see: Free (starter), Pro (standard), Business
export const PLAN_ORDER = [
	PLANS.STARTER,
	PLANS.BASIC, // Legacy - grandfathered users only
	PLANS.STANDARD, // Pro tier
	PLANS.PROFESSIONAL, // Legacy - grandfathered users only
	PLANS.BUSINESS,
	PLANS.ENTERPRISE
];

// Minimum plan required for each feature (used for upgrade prompts)
// 3-tier system: Free (starter), Pro (standard), Business
export const FEATURE_MIN_PLAN = {
	[FEATURES.RENDERS]: PLANS.STARTER,
	[FEATURES.PDF_OUTPUT]: PLANS.STANDARD, // Pro tier
	[FEATURES.TEMPLATES_SAVED]: PLANS.STARTER, // Limited on starter
	[FEATURES.BATCH_RENDER]: PLANS.STANDARD, // Pro tier
	[FEATURES.AI_BACKGROUND_REMOVER]: PLANS.STANDARD, // Pro tier
	[FEATURES.AI_COPILOT]: PLANS.STANDARD, // Pro tier (was Professional, now included in Pro)
	[FEATURES.TEAM_SEATS]: PLANS.STARTER, // 1 seat on starter
	[FEATURES.WEBHOOKS]: PLANS.STANDARD, // Pro tier
	[FEATURES.DYNAMIC_LINKS]: PLANS.STANDARD, // Pro tier
	[FEATURES.STORAGE_CONNECTORS]: PLANS.STANDARD, // Pro tier (was Professional)
	[FEATURES.BRAND_ASSETS]: PLANS.STANDARD, // Pro tier (was Basic)
	[FEATURES.AB_TESTING]: PLANS.STARTER,
	[FEATURES.SMART_LINKS]: PLANS.BASIC,
	[FEATURES.SCHEDULED_IMAGES]: PLANS.BASIC,
	[FEATURES.AUTO_OPTIMIZATION]: PLANS.STANDARD,
	[FEATURES.SSO_SAML]: PLANS.BUSINESS,
	[FEATURES.AUDIT_LOGS]: PLANS.BUSINESS,
	[FEATURES.WHITE_LABEL]: PLANS.BUSINESS,
	[FEATURES.API_ACCESS]: PLANS.STARTER
};

// Upgrade messages for each feature (3-tier: Free, Pro, Business)
export const FEATURE_UPGRADE_MESSAGES = {
	[FEATURES.PDF_OUTPUT]: {
		title: 'PDF Export Available on Pro',
		message: 'Export your designs as high-quality PDF documents.',
		benefit: 'Perfect for print materials and professional documents'
	},
	[FEATURES.TEMPLATES_SAVED]: {
		title: 'Save More Templates',
		message: "You've reached your template limit.",
		benefit: 'Get unlimited templates on Pro plan'
	},
	[FEATURES.BATCH_RENDER]: {
		title: 'Unlock Batch Rendering',
		message: 'Process multiple images at once with batch rendering.',
		benefit: 'Available on Pro plan - save hours with automated processing'
	},
	[FEATURES.AI_BACKGROUND_REMOVER]: {
		title: 'AI Background Remover',
		message: 'Remove backgrounds instantly with AI.',
		benefit: 'Available on Pro plan with 100 uses/month'
	},
	[FEATURES.AI_COPILOT]: {
		title: 'Unlock AI Copilot',
		message: 'Get AI-powered design assistance.',
		benefit: 'Available on Pro plan with 50 generations/month'
	},
	[FEATURES.WEBHOOKS]: {
		title: 'Webhooks Available on Pro',
		message: 'Automate your workflow with custom webhooks.',
		benefit: 'Integrate with your existing tools and systems'
	},
	[FEATURES.DYNAMIC_LINKS]: {
		title: 'Live Links Available on Pro',
		message: 'Create images with real-time data bindings.',
		benefit: 'Perfect for personalized content at scale'
	},
	[FEATURES.STORAGE_CONNECTORS]: {
		title: 'Storage Connectors on Pro',
		message: 'Connect to S3, GCS, or Cloudinary.',
		benefit: 'Store renders directly in your cloud storage'
	},
	[FEATURES.AB_TESTING]: {
		title: 'Unlock More A/B Tests',
		message: "You've reached your A/B test limit.",
		benefit: 'Test more variants and find what performs best'
	},
	[FEATURES.SMART_LINKS]: {
		title: 'Smart Links Available on Basic+',
		message: 'Show different images based on device, location, or time.',
		benefit: 'Personalize images for every viewer automatically'
	},
	[FEATURES.SCHEDULED_IMAGES]: {
		title: 'Scheduled Images on Basic+',
		message: 'Schedule image changes for campaigns and promotions.',
		benefit: 'Set it and forget it - images change on your schedule'
	},
	[FEATURES.AUTO_OPTIMIZATION]: {
		title: 'Auto-Optimization on Pro',
		message: 'Let AI pick the best performing variant automatically.',
		benefit: 'Thompson Sampling finds winners faster than manual A/B tests'
	}
};

// Helper functions

/**
 * Get feature limit for a plan
 * @param {string} plan - Plan identifier
 * @param {string} feature - Feature identifier
 * @returns {number|boolean|null} - Limit value
 */
export function getFeatureLimit(plan, feature) {
	const planFeatures = PLAN_FEATURES[plan];
	if (!planFeatures) return false;
	return planFeatures[feature];
}

/**
 * Check if a feature is available on a plan
 * @param {string} plan - Plan identifier
 * @param {string} feature - Feature identifier
 * @returns {boolean}
 */
export function hasFeatureAccess(plan, feature) {
	const limit = getFeatureLimit(plan, feature);
	return limit !== false && limit !== 0;
}

/**
 * Check if a feature has unlimited access on a plan
 * @param {string} plan - Plan identifier
 * @param {string} feature - Feature identifier
 * @returns {boolean}
 */
export function hasUnlimitedAccess(plan, feature) {
	const limit = getFeatureLimit(plan, feature);
	return limit === null || limit === true;
}

/**
 * Get the minimum plan required for a feature
 * @param {string} feature - Feature identifier
 * @returns {string} - Plan identifier
 */
export function getMinimumPlan(feature) {
	return FEATURE_MIN_PLAN[feature] || PLANS.STARTER;
}

/**
 * Get the next plan upgrade from current plan
 * @param {string} currentPlan - Current plan identifier
 * @returns {string|null} - Next plan identifier or null if at max
 */
export function getNextPlan(currentPlan) {
	const currentIndex = PLAN_ORDER.indexOf(currentPlan);
	if (currentIndex === -1 || currentIndex >= PLAN_ORDER.length - 1) {
		return null;
	}
	return PLAN_ORDER[currentIndex + 1];
}

/**
 * Get the plan that unlocks a specific feature
 * @param {string} currentPlan - Current plan identifier
 * @param {string} feature - Feature identifier
 * @returns {string|null} - Plan that unlocks the feature
 */
export function getPlanToUnlock(currentPlan, feature) {
	const minPlan = getMinimumPlan(feature);
	const currentIndex = PLAN_ORDER.indexOf(currentPlan);
	const minIndex = PLAN_ORDER.indexOf(minPlan);

	if (currentIndex >= minIndex) {
		// Already have access, find plan with better limits
		for (let i = currentIndex + 1; i < PLAN_ORDER.length; i++) {
			const plan = PLAN_ORDER[i];
			const currentLimit = getFeatureLimit(currentPlan, feature);
			const newLimit = getFeatureLimit(plan, feature);

			// If current is limited and new plan has more/unlimited
			if (typeof currentLimit === 'number' && (newLimit === null || newLimit > currentLimit)) {
				return plan;
			}
		}
		return null;
	}

	return minPlan;
}

/**
 * Format a feature limit for display
 * @param {number|boolean|null} limit - Limit value
 * @returns {string} - Formatted string
 */
export function formatLimit(limit) {
	if (limit === null) return 'Unlimited';
	if (limit === true) return 'Yes';
	if (limit === false) return 'No';
	if (typeof limit === 'number') {
		if (limit >= 1000) {
			return `${(limit / 1000).toFixed(limit % 1000 === 0 ? 0 : 1)}K`;
		}
		return limit.toString();
	}
	return String(limit);
}

/**
 * Format a feature limit with unit
 * @param {number|boolean|null} limit - Limit value
 * @param {string} unit - Unit string (e.g., '/mo', ' seats')
 * @returns {string} - Formatted string
 */
export function formatLimitWithUnit(limit, unit = '/mo') {
	const formatted = formatLimit(limit);
	if (formatted === 'Unlimited' || formatted === 'Yes' || formatted === 'No') {
		return formatted;
	}
	return `${formatted}${unit}`;
}

/**
 * Compare two plans
 * @param {string} plan1 - First plan
 * @param {string} plan2 - Second plan
 * @returns {number} - -1 if plan1 < plan2, 0 if equal, 1 if plan1 > plan2
 */
export function comparePlans(plan1, plan2) {
	const index1 = PLAN_ORDER.indexOf(plan1);
	const index2 = PLAN_ORDER.indexOf(plan2);
	if (index1 < index2) return -1;
	if (index1 > index2) return 1;
	return 0;
}

/**
 * Check if current plan meets minimum requirement
 * @param {string} currentPlan - Current plan
 * @param {string} requiredPlan - Required minimum plan
 * @returns {boolean}
 */
export function meetsMinimumPlan(currentPlan, requiredPlan) {
	return comparePlans(currentPlan, requiredPlan) >= 0;
}
