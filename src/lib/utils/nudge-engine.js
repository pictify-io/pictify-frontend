/**
 * Nudge Engine — evaluates behavioral conditions and returns contextual nudges
 *
 * Pure function: no side effects, no API calls.
 * Dismissed IDs are tracked in localStorage by the caller.
 */

const NUDGES = [
	{
		id: 'suggest-api-key',
		priority: 1,
		condition: (ctx) => ctx.integrationMode === 'api' && !ctx.hasApiKey,
		message: 'Get your API key to start generating images programmatically.',
		cta: 'Get API Key',
		href: '/dashboard/api-token'
	},
	{
		id: 'suggest-workflow',
		priority: 2,
		condition: (ctx) => ctx.templateCount >= 1 && !ctx.hasBulkRendered,
		message: 'Generate images at scale — run a workflow from a CSV or webhook.',
		cta: 'Run a Workflow',
		href: '/dashboard/workflows/new'
	}
];

/**
 * Evaluate nudges against current user context
 * @param {Object} context - User state context
 * @param {number} context.templateCount - Number of templates
 * @param {string|null} context.integrationMode - 'editor' | 'api' | 'both' | null
 * @param {boolean} context.hasApiKey - Whether user has an API key
 * @param {boolean} context.hasBulkRendered - Whether user has run a workflow / bulk render
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
