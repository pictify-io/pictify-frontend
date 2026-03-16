import { writable, derived, get } from 'svelte/store';
import {
	getOnboardingStatus as getStatusAPI,
	dismissOnboarding as dismissAPI,
	completeOnboardingStep as completeStepAPI,
	savePersonalization as savePersonalizationAPI,
	skipPersonalization as skipPersonalizationAPI
} from '../api/onboarding';
import { analytics } from '$lib/analytics.js';

/**
 * Onboarding Store - Manages onboarding checklist state
 *
 * State structure:
 * - steps: Array of step objects with completion status
 * - progress: Percentage of completion (0-100)
 * - completedCount: Number of completed steps
 * - totalSteps: Total number of steps
 * - isComplete: Whether all steps are completed
 * - isDismissed: Whether user has dismissed the checklist
 * - isCollapsed: Whether the card is collapsed
 * - loading: Loading state
 * - error: Error message if any
 */

const createDefaultState = () => ({
	steps: [],
	progress: 0,
	completedCount: 0,
	totalSteps: 4,
	isComplete: false,
	isDismissed: false,
	isCollapsed: false,
	loading: false,
	error: null,
	completedAt: null,
	dismissedAt: null,
	startedAt: null,
	personalization: null,
	showWelcomeWizard: false
});

export const onboardingStore = writable(createDefaultState());

// Derived stores for convenience
export const onboardingSteps = derived(onboardingStore, ($store) => $store.steps);
export const onboardingProgress = derived(onboardingStore, ($store) => $store.progress);
export const isOnboardingComplete = derived(onboardingStore, ($store) => $store.isComplete);
export const isOnboardingDismissed = derived(onboardingStore, ($store) => $store.isDismissed);
export const isOnboardingLoading = derived(onboardingStore, ($store) => $store.loading);

// Derived: Should show the onboarding card
export const showOnboarding = derived(
	onboardingStore,
	($store) => !$store.isComplete && !$store.isDismissed && $store.steps.length > 0
);

// Derived: Personalization data
export const personalization = derived(onboardingStore, ($store) => $store.personalization);

// Derived: Should show the welcome wizard
export const showWelcomeWizard = derived(onboardingStore, ($store) => $store.showWelcomeWizard);

// Derived: Get the current (first incomplete) step
export const currentStep = derived(onboardingStore, ($store) => {
	return $store.steps.find((step) => !step.completed) || null;
});

// Setters
const setLoading = (loading) => {
	onboardingStore.update((state) => ({ ...state, loading }));
};

const setError = (error) => {
	onboardingStore.update((state) => ({
		...state,
		error: error?.message || error || null
	}));
};

export const clearOnboardingStore = () => {
	onboardingStore.set(createDefaultState());
};

// Actions

/**
 * Initialize onboarding state - call after user/team is loaded
 */
export const initOnboarding = async () => {
	setLoading(true);
	setError(null);

	try {
		const status = await getStatusAPI();

		const p = status.personalization || null;
		const hasPersonalization = p?.completedAt || p?.skippedAt;
		const completedCount = status.completedCount || 0;
		// Show wizard whenever personalization hasn't been completed or skipped.
		// Skip for users who dismissed the onboarding checklist (existing users).
		const shouldShowWizard = !hasPersonalization && !status.isDismissed;

		onboardingStore.update((state) => ({
			...state,
			steps: status.steps || [],
			progress: status.progress || 0,
			completedCount,
			totalSteps: status.totalSteps || 4,
			isComplete: status.isComplete || false,
			isDismissed: status.isDismissed || false,
			completedAt: status.completedAt,
			dismissedAt: status.dismissedAt,
			startedAt: status.startedAt,
			personalization: p,
			showWelcomeWizard: shouldShowWizard,
			loading: false
		}));

		return status;
	} catch (error) {
		setError(error);
		setLoading(false);
		// Don't throw - just hide the onboarding if there's an error
		onboardingStore.update((state) => ({ ...state, isDismissed: true }));
		return null;
	}
};

/**
 * Refresh onboarding status - call after actions that might complete steps
 */
export const refreshOnboarding = async () => {
	try {
		const status = await getStatusAPI();
		const currentState = get(onboardingStore);

		// Track any newly completed steps
		if (status.steps) {
			const previouslyCompleted = new Set(
				currentState.steps.filter((s) => s.completed).map((s) => s.id)
			);

			status.steps.forEach((step) => {
				if (step.completed && !previouslyCompleted.has(step.id)) {
					analytics.track('Onboarding Step Completed', {
						step_id: step.id,
						step_title: step.title,
						progress: status.progress
					});
				}
			});
		}

		// Track onboarding completion
		if (status.isComplete && !currentState.isComplete) {
			analytics.track('Onboarding Completed', {
				total_steps: status.totalSteps,
				time_to_complete: status.completedAt
					? new Date(status.completedAt) - new Date(status.startedAt)
					: null
			});
		}

		onboardingStore.update((state) => ({
			...state,
			steps: status.steps || state.steps,
			progress: status.progress ?? state.progress,
			completedCount: status.completedCount ?? state.completedCount,
			totalSteps: status.totalSteps ?? state.totalSteps,
			isComplete: status.isComplete ?? state.isComplete,
			isDismissed: status.isDismissed ?? state.isDismissed,
			completedAt: status.completedAt,
			dismissedAt: status.dismissedAt
		}));

		return status;
	} catch (error) {
		return null;
	}
};

/**
 * Dismiss the onboarding checklist
 */
export const dismissOnboardingAction = async () => {
	setError(null);

	try {
		const status = await dismissAPI();

		analytics.track('Onboarding Dismissed', {
			completed_steps: status.completedCount,
			progress: status.progress
		});

		onboardingStore.update((state) => ({
			...state,
			isDismissed: true,
			dismissedAt: status.dismissedAt
		}));

		return status;
	} catch (error) {
		setError(error);
		throw error;
	}
};

/**
 * Toggle collapsed state of the onboarding card
 */
export const toggleOnboardingCollapse = () => {
	onboardingStore.update((state) => ({
		...state,
		isCollapsed: !state.isCollapsed
	}));
};

/**
 * Complete a step manually (for testing or specific workflows)
 */
export const completeStepAction = async (stepId) => {
	setError(null);

	try {
		const status = await completeStepAPI(stepId);

		analytics.track('Onboarding Step Completed', {
			step_id: stepId,
			progress: status.progress
		});

		onboardingStore.update((state) => ({
			...state,
			steps: status.steps || state.steps,
			progress: status.progress ?? state.progress,
			completedCount: status.completedCount ?? state.completedCount,
			isComplete: status.isComplete ?? state.isComplete,
			completedAt: status.completedAt
		}));

		return status;
	} catch (error) {
		setError(error);
		throw error;
	}
};

/**
 * Save personalization preferences from welcome wizard
 */
export const savePersonalizationAction = async ({ useCase, integrationMode }) => {
	setError(null);

	try {
		const status = await savePersonalizationAPI({ useCase, integrationMode });

		analytics.track('Personalization Completed', { useCase, integrationMode });

		onboardingStore.update((state) => ({
			...state,
			personalization: status.personalization || {
				useCase,
				integrationMode,
				completedAt: new Date().toISOString()
			},
			showWelcomeWizard: false
		}));

		return status;
	} catch (error) {
		setError(error);
		throw error;
	}
};

/**
 * Skip the personalization wizard
 */
export const skipPersonalizationAction = async () => {
	setError(null);

	try {
		const status = await skipPersonalizationAPI();

		analytics.track('Personalization Skipped');

		onboardingStore.update((state) => ({
			...state,
			personalization: status.personalization || { skippedAt: new Date().toISOString() },
			showWelcomeWizard: false
		}));

		return status;
	} catch (error) {
		setError(error);
		throw error;
	}
};

// Getters

export const getOnboardingState = () => {
	return get(onboardingStore);
};

export const isStepCompleted = (stepId) => {
	const state = get(onboardingStore);
	return state.steps.some((step) => step.id === stepId && step.completed);
};
