/**
 * PLG (Product-Led Growth) API Client
 */

import backend from '../service/backend';

/**
 * Increment feature usage
 */
export const incrementFeatureUsage = async (feature, amount = 1) => {
	try {
		const response = await backend.post(`/api/plg/feature-usage/${feature}`, { amount });
		return response;
	} catch (error) {
		return { success: false };
	}
};

/**
 * Check if feature can be used
 */
export const checkFeatureLimit = async (feature, amount = 1) => {
	try {
		const response = await backend.get(`/api/plg/feature-check/${feature}?amount=${amount}`);
		return response;
	} catch (error) {
		// Fail open - allow the feature if API fails
		return { allowed: true, remaining: -1 };
	}
};

/**
 * Record milestone
 */
export const recordMilestone = async (milestoneId) => {
	try {
		const response = await backend.post(`/api/plg/milestone/${milestoneId}`);
		return response;
	} catch (error) {
		return { success: false };
	}
};

/**
 * Record upgrade prompt interaction
 */
export const recordUpgradePrompt = async (action, promptType, context = {}) => {
	try {
		const response = await backend.post('/api/plg/upgrade-prompt', { action, promptType, context });
		return response;
	} catch (error) {
		return { success: false };
	}
};

/**
 * Get discount code
 */
export const getDiscountCode = async (percentage) => {
	try {
		const response = await backend.get(`/api/plg/discount-code/${percentage}`);
		return response;
	} catch (error) {
		return { code: null, valid: false };
	}
};
