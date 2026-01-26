import backend from '../service/backend';

/**
 * Get onboarding status for the current team
 */
export const getOnboardingStatus = async () => {
	try {
		return await backend.get('/api/onboarding');
	} catch (error) {
		if (error.status === 400) {
			return { isDismissed: true, steps: [], progress: 0 };
		}
		throw new Error('Error fetching onboarding status');
	}
};

/**
 * Dismiss the onboarding checklist
 */
export const dismissOnboarding = async () => {
	try {
		return await backend.post('/api/onboarding/dismiss');
	} catch (error) {
		throw new Error('Error dismissing onboarding');
	}
};

/**
 * Complete an onboarding step manually
 */
export const completeOnboardingStep = async (stepId) => {
	try {
		return await backend.post(`/api/onboarding/complete/${stepId}`);
	} catch (error) {
		if (error.status === 400) throw new Error('Invalid step');
		throw new Error('Error completing step');
	}
};
