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

	// AI Features — the ONLY sold AI allowance is AI_CREDITS: one monthly
	// pool covering the copilot (templates & video), AI video generation and
	// captions. Values mirror backend util/ai-credits.js AI_LIMITS — keep in
	// sync. A SEPARATE pool from render credits.
	//
	// AI_BACKGROUND_REMOVER and AI_COPILOT are LEGACY buckets — not sold on
	// any pricing surface. Keys kept only so feature gates on grandfathered
	// users' pages keep working (e.g. the background-remove button in the
	// canvas editor). Do not add these back to pricing/upgrade UI.
	AI_BACKGROUND_REMOVER: 'aiBackgroundRemover',
	AI_COPILOT: 'aiCopilot',
	AI_CREDITS: 'aiCredits',

	// Team & Collaboration
	TEAM_SEATS: 'teamSeats',

	// Integrations
	WEBHOOKS: 'webhooks',
	DYNAMIC_LINKS: 'dynamicLinks',
	STORAGE_CONNECTORS: 'storageConnectors',

	// Experiments — RETIRED (July 2026 repositioning). Not sold on any pricing
	// surface. Keys kept only so feature gates on grandfathered users' pages
	// keep working. Do not add these back to pricing/upgrade UI.
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
		[FEATURES.AI_CREDITS]: 25,

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
		[FEATURES.AI_CREDITS]: 300,

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
		[FEATURES.AI_CREDITS]: 1000,

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
		// Backend util/ai-credits.js AI_LIMITS has no 'professional' entry, so
		// grandfathered Professional users fall back to the starter pool (25).
		[FEATURES.AI_CREDITS]: 25,

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
		[FEATURES.BATCH_ITEMS_PER_REQUEST]: 1000, // Mirrors backend config/plg.js maxItems + workflow MAX_ROWS
		[FEATURES.BATCH_MONTHLY_LIMIT]: null,

		// AI Features
		[FEATURES.AI_BACKGROUND_REMOVER]: 500,
		[FEATURES.AI_COPILOT]: 500,
		[FEATURES.AI_CREDITS]: 4000,

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
	// Legacy AI bucket metadata — RETIRED from sale. Neutral labels kept only
	// for feature gates grandfathered users may still hit.
	[FEATURES.AI_BACKGROUND_REMOVER]: {
		name: 'AI Background Remover',
		description: 'Legacy background removal',
		icon: 'wand',
		category: 'ai'
	},
	[FEATURES.AI_COPILOT]: {
		name: 'AI Copilot',
		description: 'Legacy per-plan copilot bucket (now covered by AI Credits)',
		icon: 'sparkles',
		category: 'ai'
	},
	[FEATURES.AI_CREDITS]: {
		name: 'AI Credits',
		description:
			'Monthly AI credit pool for the copilot (templates & video), AI video generation and captions',
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
	// Experiments metadata — RETIRED features (July 2026). Neutral labels kept
	// only for feature gates grandfathered users may still hit.
	[FEATURES.AB_TESTING]: {
		name: 'A/B Testing',
		description: 'Legacy image variant testing',
		icon: 'split',
		category: 'experiments'
	},
	[FEATURES.SMART_LINKS]: {
		name: 'Smart Links',
		description: 'Legacy context-based image links',
		icon: 'target',
		category: 'experiments'
	},
	[FEATURES.SCHEDULED_IMAGES]: {
		name: 'Scheduled Images',
		description: 'Legacy scheduled image changes',
		icon: 'clock',
		category: 'experiments'
	},
	[FEATURES.AUTO_OPTIMIZATION]: {
		name: 'Auto-Optimization',
		description: 'Legacy automatic variant optimization',
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
		description: 'Full REST API access on every plan',
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
// Active plans: Free (starter), Basic, Pro (standard), Business
// Legacy: Professional (grandfathered users only)
export const PLAN_ORDER = [
	PLANS.STARTER,
	PLANS.BASIC,
	PLANS.STANDARD, // Pro tier
	PLANS.PROFESSIONAL, // Legacy - grandfathered users only
	PLANS.BUSINESS,
	PLANS.ENTERPRISE
];

// Minimum plan required for each feature (used for upgrade prompts)
// 4-tier system: Free (starter), Basic, Pro (standard), Business
export const FEATURE_MIN_PLAN = {
	[FEATURES.RENDERS]: PLANS.STARTER,
	[FEATURES.PDF_OUTPUT]: PLANS.BASIC,
	[FEATURES.TEMPLATES_SAVED]: PLANS.STARTER, // Limited on starter
	[FEATURES.BATCH_RENDER]: PLANS.BASIC,
	[FEATURES.AI_BACKGROUND_REMOVER]: PLANS.BASIC,
	[FEATURES.AI_COPILOT]: PLANS.BASIC,
	[FEATURES.TEAM_SEATS]: PLANS.STARTER, // 1 seat on starter
	[FEATURES.WEBHOOKS]: PLANS.BASIC,
	[FEATURES.DYNAMIC_LINKS]: PLANS.BASIC,
	[FEATURES.STORAGE_CONNECTORS]: PLANS.BASIC,
	[FEATURES.BRAND_ASSETS]: PLANS.BASIC,
	[FEATURES.AB_TESTING]: PLANS.STARTER,
	[FEATURES.SMART_LINKS]: PLANS.BASIC,
	[FEATURES.SCHEDULED_IMAGES]: PLANS.BASIC,
	[FEATURES.AUTO_OPTIMIZATION]: PLANS.STANDARD,
	[FEATURES.SSO_SAML]: PLANS.BUSINESS,
	[FEATURES.AUDIT_LOGS]: PLANS.BUSINESS,
	[FEATURES.WHITE_LABEL]: PLANS.BUSINESS,
	[FEATURES.API_ACCESS]: PLANS.STARTER
};

// Upgrade messages for each feature (4-tier: Free, Basic, Pro, Business)
export const FEATURE_UPGRADE_MESSAGES = {
	[FEATURES.PDF_OUTPUT]: {
		title: 'PDF Export Available on All Paid Plans',
		message: 'Export your designs as high-quality PDF documents.',
		benefit: 'Perfect for print materials and professional documents'
	},
	[FEATURES.TEMPLATES_SAVED]: {
		title: 'Save More Templates',
		message: "You've reached your template limit.",
		benefit: 'Get 25 templates on Basic, unlimited on Pro'
	},
	[FEATURES.BATCH_RENDER]: {
		title: 'Unlock Batch Rendering',
		message: 'Process multiple images at once with batch rendering.',
		benefit: 'Save hours with automated processing'
	},
	// AI Background Remover and the per-plan AI Copilot bucket are no longer
	// sold — their upsells were removed alongside the experiments ones. The
	// copilot is covered by the unified AI credits pool on every plan.
	[FEATURES.WEBHOOKS]: {
		title: 'Webhooks Available on All Paid Plans',
		message: 'Automate your workflow with custom webhooks.',
		benefit: 'Integrate with your existing tools and systems'
	},
	[FEATURES.DYNAMIC_LINKS]: {
		title: 'Live Links Available on All Paid Plans',
		message: 'Create images with real-time data bindings.',
		benefit: 'Perfect for personalized content at scale'
	},
	[FEATURES.STORAGE_CONNECTORS]: {
		title: 'Storage Connectors on All Paid Plans',
		message: 'Connect to S3, GCS, or Cloudinary.',
		benefit: 'Store renders directly in your cloud storage'
	}
	// Experiments (A/B testing, smart links, scheduled images, auto-optimization)
	// were retired in the July 2026 repositioning. Their upgrade upsells were
	// removed — getFeatureUpgradePrompt falls back to neutral generated copy for
	// any grandfathered user who still hits those gates.
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
