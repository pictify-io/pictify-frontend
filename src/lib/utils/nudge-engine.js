/**
 * Nudge Engine — evaluates behavioral conditions and returns contextual nudges
 *
 * Pure function: no side effects, no API calls.
 * Dismissed IDs are tracked in localStorage by the caller.
 */

const NUDGES = [
	{
		id: 'suggest-experiment',
		priority: 1,
		condition: (ctx) => ctx.templateCount >= 3 && ctx.experimentCount === 0,
		message:
			"You've created {templateCount} templates — try A/B testing to find which performs best.",
		cta: 'Create Experiment',
		href: '/dashboard/experiments/create?type=ab_test'
	},
	{
		id: 'suggest-api-key',
		priority: 2,
		condition: (ctx) => ctx.integrationMode === 'api' && !ctx.hasApiKey,
		message: 'Get your API key to start generating images programmatically.',
		cta: 'Get API Key',
		href: '/dashboard/api-token'
	},
	{
		id: 'suggest-tracking',
		priority: 3,
		condition: (ctx) => ctx.experimentCount > 0 && !ctx.hasTracking,
		message: 'Install the tracking script to measure experiment performance.',
		cta: 'Install Tracking',
		href: '/dashboard/install'
	},
	{
		id: 'suggest-bulk-render',
		priority: 4,
		condition: (ctx) => ctx.templateCount >= 1 && !ctx.hasBulkRendered,
		message: 'Generate images at scale — try bulk rendering from a CSV or API.',
		cta: 'Try Bulk Render',
		href: '/dashboard/template'
	}
];

/**
 * Evaluate nudges against current user context
 * @param {Object} context - User state context
 * @param {number} context.templateCount - Number of templates
 * @param {number} context.experimentCount - Number of experiments
 * @param {string|null} context.integrationMode - 'editor' | 'api' | 'both' | null
 * @param {boolean} context.hasApiKey - Whether user has an API key
 * @param {boolean} context.hasTracking - Whether tracking is installed
 * @param {boolean} context.hasBulkRendered - Whether user has done bulk rendering
 * @param {string[]} dismissedIds - IDs of dismissed nudges
 * @returns {Array} Up to 2 applicable nudges, sorted by priority
 */
export function evaluateNudges(context, dismissedIds = []) {
	const dismissed = new Set(dismissedIds);

	return NUDGES.filter((nudge) => !dismissed.has(nudge.id) && nudge.condition(context))
		.sort((a, b) => a.priority - b.priority)
		.slice(0, 2)
		.map((nudge) => ({
			id: nudge.id,
			message: nudge.message.replace('{templateCount}', context.templateCount || 0),
			cta: nudge.cta,
			href: nudge.href
		}));
}

const STORAGE_KEY = 'pictify_dismissed_nudges';

export function getDismissedNudges() {
	if (typeof localStorage === 'undefined') return [];
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
	} catch {
		return [];
	}
}

export function dismissNudge(id) {
	const dismissed = getDismissedNudges();
	if (!dismissed.includes(id)) {
		dismissed.push(id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
	}
}
