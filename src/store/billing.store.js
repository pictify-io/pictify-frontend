/**
 * Billing Store
 *
 * Manages subscription, invoices, and billing dashboard state.
 * Follows simplified store pattern: plain writable + functions
 */

import { writable, derived, get } from 'svelte/store';
import {
	getBillingDashboard,
	getSubscription,
	pauseSubscription,
	resumeSubscription,
	cancelSubscription,
	reactivateSubscription,
	getInvoices,
	getTimeline
} from '../api/billing.js';

// ============================================
// Stores
// ============================================

// Main billing state
export const billingState = writable({
	loaded: false,
	loading: false,
	error: null,
	subscription: null,
	invoices: [],
	timeline: [],
	usage: null,
	customerPortalUrl: null
});

// Action loading states (for button spinners)
export const billingActions = writable({
	pausing: false,
	resuming: false,
	cancelling: false,
	reactivating: false
});

// ============================================
// Derived Stores
// ============================================

// Current subscription status
export const subscriptionStatus = derived(billingState, ($state) => {
	if (!$state.subscription) return 'none';
	return $state.subscription.status;
});

// Is subscription active (not cancelled/paused)
export const isSubscriptionActive = derived(billingState, ($state) => {
	if (!$state.subscription) return false;
	return $state.subscription.status === 'active';
});

// Is subscription paused
export const isSubscriptionPaused = derived(billingState, ($state) => {
	if (!$state.subscription) return false;
	return $state.subscription.status === 'paused';
});

// Is subscription cancelled (but still active until period end)
export const isSubscriptionCancelled = derived(billingState, ($state) => {
	if (!$state.subscription) return false;
	return $state.subscription.status === 'cancelled' || $state.subscription.endsAt !== null;
});

// Has active subscription (any non-free plan)
export const hasSubscription = derived(billingState, ($state) => {
	return $state.subscription !== null;
});

// Current plan name for display
export const currentPlanName = derived(billingState, ($state) => {
	if (!$state.subscription) return 'Free';
	return $state.subscription.productName || $state.subscription.variantName || 'Pro';
});

// Next billing date (formatted)
export const nextBillingDate = derived(billingState, ($state) => {
	if (!$state.subscription?.renewsAt) return null;
	return new Date($state.subscription.renewsAt).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
});

// ============================================
// Actions
// ============================================

/**
 * Initialize billing state with dashboard data
 * Call this on page mount
 * @param {Object} options
 * @param {boolean} [options.refresh=false] - Force refresh from server (bypass cache)
 */
export const initBilling = async ({ refresh = false } = {}) => {
	billingState.update((s) => ({ ...s, loading: true, error: null }));

	try {
		const dashboard = await getBillingDashboard({ refresh });

		billingState.set({
			loaded: true,
			loading: false,
			error: null,
			subscription: dashboard.subscription,
			invoices: dashboard.invoices || [],
			timeline: dashboard.timeline || [],
			usage: dashboard.usage,
			// customerPortalUrl is nested inside subscription from the API
			customerPortalUrl: dashboard.subscription?.customerPortalUrl || null
		});

		return dashboard;
	} catch (error) {
		billingState.update((s) => ({
			...s,
			loading: false,
			error: error.message || 'Failed to load billing data'
		}));
		return null;
	}
};

/**
 * Refresh subscription data only
 */
export const refreshSubscription = async () => {
	try {
		const subscription = await getSubscription();
		billingState.update((s) => ({ ...s, subscription }));
		return subscription;
	} catch (error) {
		return null;
	}
};

/**
 * Refresh invoices
 */
export const refreshInvoices = async (limit = 10) => {
	try {
		const invoices = await getInvoices({ limit });
		billingState.update((s) => ({ ...s, invoices }));
		return invoices;
	} catch (error) {
		return [];
	}
};

/**
 * Refresh timeline
 */
export const refreshTimeline = async (limit = 20) => {
	try {
		const timeline = await getTimeline({ limit });
		billingState.update((s) => ({ ...s, timeline }));
		return timeline;
	} catch (error) {
		return [];
	}
};

/**
 * Pause subscription
 * @param {Object} options
 * @param {string} [options.resumesAt] - ISO date for auto-resume
 */
export const doPauseSubscription = async ({ resumesAt } = {}) => {
	billingActions.update((a) => ({ ...a, pausing: true }));

	try {
		await pauseSubscription({ resumesAt });
		await initBilling({ refresh: true });
		return { success: true };
	} catch (error) {
		return { success: false, error: error.message || 'Failed to pause subscription' };
	} finally {
		billingActions.update((a) => ({ ...a, pausing: false }));
	}
};

/**
 * Resume paused subscription
 */
export const doResumeSubscription = async () => {
	billingActions.update((a) => ({ ...a, resuming: true }));

	try {
		await resumeSubscription();
		await initBilling({ refresh: true });
		return { success: true };
	} catch (error) {
		return { success: false, error: error.message || 'Failed to resume subscription' };
	} finally {
		billingActions.update((a) => ({ ...a, resuming: false }));
	}
};

/**
 * Cancel subscription
 */
export const doCancelSubscription = async () => {
	billingActions.update((a) => ({ ...a, cancelling: true }));

	try {
		await cancelSubscription();
		await initBilling({ refresh: true });
		return { success: true };
	} catch (error) {
		return { success: false, error: error.message || 'Failed to cancel subscription' };
	} finally {
		billingActions.update((a) => ({ ...a, cancelling: false }));
	}
};

/**
 * Reactivate cancelled subscription
 */
export const doReactivateSubscription = async () => {
	billingActions.update((a) => ({ ...a, reactivating: true }));

	try {
		await reactivateSubscription();
		await initBilling({ refresh: true });
		return { success: true };
	} catch (error) {
		return { success: false, error: error.message || 'Failed to reactivate subscription' };
	} finally {
		billingActions.update((a) => ({ ...a, reactivating: false }));
	}
};

/**
 * Open LemonSqueezy customer portal
 */
export const openCustomerPortal = () => {
	const state = get(billingState);
	if (state.customerPortalUrl) {
		window.open(state.customerPortalUrl, '_blank');
	}
};

// ============================================
// Helpers
// ============================================

/**
 * Format currency amount
 * @param {number} cents - Amount in cents
 * @param {string} currency - Currency code (default: USD)
 */
export const formatCurrency = (cents, currency = 'USD') => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency
	}).format(cents / 100);
};

/**
 * Get human-readable status label
 * @param {string} status - Subscription status
 */
export const getStatusLabel = (status) => {
	const labels = {
		active: 'Active',
		paused: 'Paused',
		cancelled: 'Cancelled',
		past_due: 'Past Due',
		unpaid: 'Unpaid',
		on_trial: 'Trial',
		expired: 'Expired'
	};
	return labels[status] || status;
};

/**
 * Get status color class
 * @param {string} status - Subscription status
 */
export const getStatusColor = (status) => {
	const colors = {
		active: 'text-green-600 bg-green-50',
		paused: 'text-yellow-600 bg-yellow-50',
		cancelled: 'text-red-600 bg-red-50',
		past_due: 'text-red-600 bg-red-50',
		unpaid: 'text-red-600 bg-red-50',
		on_trial: 'text-blue-600 bg-blue-50',
		expired: 'text-gray-600 bg-gray-50'
	};
	return colors[status] || 'text-gray-600 bg-gray-50';
};
