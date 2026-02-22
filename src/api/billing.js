/**
 * Billing API Client
 *
 * Handles billing dashboard, subscription management, and billing preferences
 */

import backend from '../service/backend';

// ============================================
// Billing Dashboard (Aggregated)
// ============================================

/**
 * Get complete billing dashboard data (subscription, invoices, usage)
 * This is the primary endpoint - use it for initial page load
 * @returns {Promise<Object>} Complete billing dashboard data
 */
export async function getBillingDashboard({ refresh = false } = {}) {
  try {
    const url = refresh ? '/api/billing/dashboard?refresh=true' : '/api/billing/dashboard';
    const response = await backend.get(url);
    return response;
  } catch (error) {
    console.error('Failed to get billing dashboard:', error);
    return {
      subscription: null,
      invoices: [],
      timeline: [],
      usage: null,
      customerPortalUrl: null,
    };
  }
}

// ============================================
// Subscription Management
// ============================================

/**
 * Get current subscription details
 * @returns {Promise<Object|null>} Subscription data or null
 */
export async function getSubscription() {
  try {
    const response = await backend.get('/api/billing/subscription');
    return response;
  } catch (error) {
    console.error('Failed to get subscription:', error);
    return null;
  }
}

/**
 * Pause subscription
 * @param {Object} options
 * @param {string} [options.resumesAt] - ISO date string for auto-resume
 * @returns {Promise<Object>} Updated subscription
 */
export async function pauseSubscription({ resumesAt } = {}) {
  const response = await backend.post('/api/billing/subscription/pause', { resumesAt });
  return response;
}

/**
 * Resume a paused subscription
 * @returns {Promise<Object>} Updated subscription
 */
export async function resumeSubscription() {
  const response = await backend.post('/api/billing/subscription/resume');
  return response;
}

/**
 * Cancel subscription
 * @returns {Promise<Object>} Updated subscription (will be active until period end)
 */
export async function cancelSubscription() {
  const response = await backend.post('/api/billing/subscription/cancel');
  return response;
}

/**
 * Reactivate a cancelled subscription (before period ends)
 * @returns {Promise<Object>} Updated subscription
 */
export async function reactivateSubscription() {
  const response = await backend.post('/api/billing/subscription/reactivate');
  return response;
}

/**
 * Get fresh signed customer portal URL
 * This URL bypasses LemonSqueezy authentication - users go directly to their portal
 * The URL is valid for 24 hours from the time of request
 * @returns {Promise<Object>} { customerPortalUrl, updatePaymentMethodUrl }
 */
export async function getPortalUrl() {
  const response = await backend.get('/api/billing/portal-url');
  return response;
}

// ============================================
// Invoices & History
// ============================================

/**
 * Get invoice history
 * @param {Object} options
 * @param {number} [options.limit=10] - Number of invoices to return
 * @returns {Promise<Array>} List of invoices
 */
export async function getInvoices({ limit = 10 } = {}) {
  try {
    const response = await backend.get('/api/billing/invoices', { params: { limit } });
    return response.invoices || [];
  } catch (error) {
    console.error('Failed to get invoices:', error);
    return [];
  }
}

/**
 * Get subscription timeline (status changes, payments)
 * @param {Object} options
 * @param {number} [options.limit=20] - Number of events to return
 * @returns {Promise<Array>} List of timeline events
 */
export async function getTimeline({ limit = 20 } = {}) {
  try {
    const response = await backend.get('/api/billing/timeline', { params: { limit } });
    return response.timeline || [];
  } catch (error) {
    console.error('Failed to get timeline:', error);
    return [];
  }
}

// ============================================
// Billing Preferences (Overages)
// ============================================

/**
 * Get billing preferences (overage settings)
 * @returns {Promise<Object>} Billing preferences
 */
export async function getBillingPreferences() {
  try {
    const response = await backend.get('/api/billing-preferences');
    return response;
  } catch (error) {
    console.error('Failed to get billing preferences:', error);
    return {
      allowOverages: false,
      spendingCapCents: null,
      currentCycleOverages: 0,
      currentCycleOverageCostCents: 0,
      overagePricing: { eligible: false },
    };
  }
}

/**
 * Update billing preferences
 * @param {Object} preferences
 * @param {boolean} [preferences.allowOverages] - Enable/disable overage billing
 * @param {number|null} [preferences.spendingCapCents] - Spending cap in cents (null = unlimited)
 * @returns {Promise<Object>} Updated preferences
 */
export async function updateBillingPreferences({ allowOverages, spendingCapCents }) {
  try {
    const response = await backend.put('/api/billing-preferences', {
      allowOverages,
      spendingCapCents,
    });
    return response;
  } catch (error) {
    console.error('Failed to update billing preferences:', error);
    throw error;
  }
}

/**
 * Get overage summary for current billing cycle
 * @returns {Promise<Object>} Overage summary
 */
export async function getOverageSummary() {
  try {
    const response = await backend.get('/api/billing-preferences/overage-summary');
    return response;
  } catch (error) {
    console.error('Failed to get overage summary:', error);
    return {
      allowOverages: false,
      currentCycleOverages: 0,
      currentCycleOverageCostCents: 0,
      spendingCapCents: null,
      remainingBudgetCents: null,
      capReached: false,
    };
  }
}
