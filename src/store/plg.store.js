/**
 * PLG (Product-Led Growth) Store
 *
 * Manages usage tracking, milestones, feature limits, and upgrade prompts
 */

import { writable, derived, get } from 'svelte/store';
import { getPlanDetails } from '../api/user';
import {
  incrementFeatureUsage,
  checkFeatureLimit,
  recordMilestone,
  recordUpgradePrompt,
  getDiscountCode,
} from '../api/plg';
import { analytics } from '$lib/analytics.js';

// ============================================
// Stores
// ============================================

// Main PLG status
export const plgStatus = writable({
  plan: 'starter',
  isPaidPlan: false,
  usage: {
    current: 0,
    limit: 50,
    percentage: 0,
    remaining: 50,
  },
  featureUsage: {},
  featureLimits: {},
  milestones: {
    current: null,
    next: null,
    achieved: [],
  },
  threshold: null,
  timeSaved: { value: 0, unit: 'minutes', display: '0 minutes' },
  resetDate: null,
  loaded: false,
});

// Usage widget (compact version for header)
export const usageWidget = writable({
  current: 0,
  limit: 50,
  percentage: 0,
  plan: 'starter',
  isPaidPlan: false,
  showUpgrade: false,
  urgency: 'normal',
});

// Active milestone celebration
export const activeMilestone = writable(null);

// Active upgrade prompt
export const activeUpgradePrompt = writable(null);

// Feature gate status (for checking before using features)
export const featureGates = writable({});

// Loading states
export const plgLoading = writable(false);

// Nudge tracking stores
export const nudgeState = writable({
  bannerDismissedAt: null,
  proactiveModalShownThisCycle: false,
});

// ============================================
// Derived Stores
// ============================================

// Is user on free plan
export const isFreePlan = derived(plgStatus, ($plgStatus) => !$plgStatus.isPaidPlan);

// Usage percentage
export const usagePercentage = derived(plgStatus, ($plgStatus) => $plgStatus.usage.percentage);

// Should show upgrade nudge
export const shouldShowUpgradeNudge = derived(
  [plgStatus, usageWidget],
  ([$plgStatus, $usageWidget]) => {
    if ($plgStatus.isPaidPlan) return false;
    return $usageWidget.percentage >= 30;
  }
);

// Urgency level for UI styling
export const urgencyLevel = derived(usageWidget, ($usageWidget) => $usageWidget.urgency);

// ============================================
// Actions
// ============================================

/**
 * Initialize PLG status using existing plan details endpoint
 */
export const initPLG = async () => {
  plgLoading.set(true);
  try {
    // Use the existing plan details endpoint
    const planDetails = await getPlanDetails();
    
    if (!planDetails) {
      console.warn('Failed to get plan details');
      plgLoading.set(false);
      return null;
    }
    
    // Extract data from plan details response
    const usage = typeof planDetails.usage === 'number' 
      ? planDetails.usage 
      : planDetails.usage?.count ?? planDetails.windowUsage?.monthly?.count ?? 0;
    const limit = planDetails.monthlyLimit ?? planDetails.windowUsage?.monthly?.limit ?? 50;
    const percentage = limit > 0 ? Math.round((usage / limit) * 100) : 0;
    const remaining = Math.max(0, limit - usage);
    
    // Determine plan from limit (you might want to get this from user store)
    let plan = 'starter';
    if (limit > 50) plan = 'basic';
    if (limit > 1500) plan = 'standard';
    if (limit > 3500) plan = 'professional';
    if (limit > 7500) plan = 'business';
    
    const isPaidPlan = plan !== 'starter';
    
    // Calculate time saved (10 min per render)
    const minutesSaved = usage * 10;
    const timeSaved = minutesSaved >= 60 
      ? { value: Math.round(minutesSaved / 60), unit: 'hours', display: `${Math.round(minutesSaved / 60)} hour${Math.round(minutesSaved / 60) !== 1 ? 's' : ''}` }
      : { value: minutesSaved, unit: 'minutes', display: `${minutesSaved} minutes` };
    
    // Get threshold
    const threshold = getThresholdConfig(percentage);
    
    // Get milestone info
    const currentMilestone = getMilestoneConfig('renders', usage);
    const nextMilestone = getNextMilestoneConfig('renders', usage);
    
    // Determine urgency
    let urgency = 'normal';
    if (percentage >= 95) urgency = 'critical';
    else if (percentage >= 85) urgency = 'urgent';
    else if (percentage >= 75) urgency = 'warning';
    else if (percentage >= 65) urgency = 'soft_warning';
    else if (percentage >= 50) urgency = 'info';

    const status = {
      plan,
      isPaidPlan,
      usage: {
        current: usage,
        limit,
        percentage,
        remaining,
      },
      featureUsage: {},
      featureLimits: {},
      milestones: {
        current: currentMilestone,
        next: nextMilestone,
        achieved: [],
      },
      threshold,
      timeSaved,
      resetDate: planDetails.nextReset,
      loaded: true,
    };
    
    plgStatus.set(status);
    
    // Update usage widget
    usageWidget.set({
      current: usage,
      limit,
      percentage,
      plan,
      isPaidPlan,
      showUpgrade: !isPaidPlan && percentage >= 30,
      urgency,
    });
    
    // Check for milestone celebration
    if (currentMilestone && usage === currentMilestone.count) {
      // Check if we should show the milestone (would need to track shown milestones)
      // For now, skip auto-showing on init to avoid annoying users
    }
    
    return status;
  } catch (error) {
    console.error('Failed to init PLG:', error);
  } finally {
    plgLoading.set(false);
  }
};

/**
 * Refresh usage widget (lightweight update)
 */
export const refreshUsageWidget = async () => {
  try {
    const planDetails = await getPlanDetails();
    
    if (!planDetails) return null;
    
    const usage = typeof planDetails.usage === 'number' 
      ? planDetails.usage 
      : planDetails.usage?.count ?? planDetails.windowUsage?.monthly?.count ?? 0;
    const limit = planDetails.monthlyLimit ?? planDetails.windowUsage?.monthly?.limit ?? 50;
    const percentage = limit > 0 ? Math.round((usage / limit) * 100) : 0;
    const remaining = Math.max(0, limit - usage);
    
    // Determine plan from limit
    let plan = 'starter';
    if (limit > 50) plan = 'basic';
    if (limit > 1500) plan = 'standard';
    if (limit > 3500) plan = 'professional';
    if (limit > 7500) plan = 'business';
    
    const isPaidPlan = plan !== 'starter';

    // Determine urgency
    let urgency = 'normal';
    if (percentage >= 95) urgency = 'critical';
    else if (percentage >= 85) urgency = 'urgent';
    else if (percentage >= 75) urgency = 'warning';
    else if (percentage >= 65) urgency = 'soft_warning';
    else if (percentage >= 50) urgency = 'info';

    const widget = {
      current: usage,
      limit,
      percentage,
      plan,
      isPaidPlan,
      showUpgrade: !isPaidPlan && percentage >= 30,
      urgency,
    };
    
    usageWidget.set(widget);
    
    // Also update plgStatus usage
    plgStatus.update(status => ({
      ...status,
      plan,
      isPaidPlan,
      usage: {
        current: usage,
        limit,
        percentage,
        remaining,
      },
      resetDate: planDetails.nextReset,
    }));
    
    // Calculate and update time saved
    const minutesSaved = usage * 10;
    const timeSaved = minutesSaved >= 60 
      ? { value: Math.round(minutesSaved / 60), unit: 'hours', display: `${Math.round(minutesSaved / 60)} hour${Math.round(minutesSaved / 60) !== 1 ? 's' : ''}` }
      : { value: minutesSaved, unit: 'minutes', display: `${minutesSaved} minutes` };
    
    plgStatus.update(status => ({
      ...status,
      timeSaved,
    }));
    
    return widget;
  } catch (error) {
    console.error('Failed to refresh usage widget:', error);
  }
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = async (feature, amount = 1) => {
  try {
    const result = await incrementFeatureUsage(feature, amount);

    // Update local state
    plgStatus.update((status) => ({
      ...status,
      featureUsage: {
        ...status.featureUsage,
        [feature]: result.usage,
      },
    }));

    // Send to PostHog
    analytics.trackFeatureUsed({
      feature_name: feature,
      context: { usage_after: result.usage, amount },
    });

    // Check for milestone
    if (result.milestone?.isNew) {
      showMilestoneCelebration(result.milestone);
      // Track milestone in PostHog
      analytics.trackMilestoneAchieved({
        milestone_id: result.milestone.id,
        milestone_type: result.milestone.type,
        count: result.milestone.count,
      });
    }

    // Show upgrade prompt if limit exceeded
    if (result.limitExceeded) {
      showFeatureLimitPrompt(feature, result);
    }

    // Refresh usage widget
    await refreshUsageWidget();

    return result;
  } catch (error) {
    console.error('Failed to track feature usage:', error);
    throw error;
  }
};

/**
 * Check feature availability before using
 */
export const canUseFeature = async (feature, amount = 1) => {
  try {
    const result = await checkFeatureLimit(feature, amount);
    
    // Update feature gates
    featureGates.update((gates) => ({
      ...gates,
      [feature]: result,
    }));
    
    return result;
  } catch (error) {
    console.error('Failed to check feature limit:', error);
    return { allowed: true }; // Fail open
  }
};

/**
 * Show milestone celebration
 */
export const showMilestoneCelebration = (milestone) => {
  activeMilestone.set(milestone);
  
  // Auto-dismiss after 8 seconds for celebrations
  if (milestone.type === 'celebration') {
    setTimeout(() => {
      dismissMilestone();
    }, 8000);
  }
};

/**
 * Dismiss milestone celebration
 */
export const dismissMilestone = async () => {
  const milestone = get(activeMilestone);
  if (milestone) {
    // Record that we've shown this milestone
    try {
      const milestoneId = milestone.id || `${milestone.feature || 'renders'}-${milestone.count}`;
      await recordMilestone(milestoneId);
    } catch (error) {
      console.error('Failed to record milestone:', error);
    }
  }
  activeMilestone.set(null);
};

/**
 * Show feature limit upgrade prompt
 */
export const showFeatureLimitPrompt = (feature, result) => {
  activeUpgradePrompt.set({
    type: 'feature_limit',
    feature,
    title: `${formatFeatureName(feature)} Limit Reached`,
    message: result.message || `You've reached your ${formatFeatureName(feature)} limit.`,
    cta: {
      text: 'Upgrade for unlimited access',
      action: 'upgrade',
    },
  });

  // Record prompt shown (backend)
  recordUpgradePrompt('shown', 'feature_limit', { feature });

  // Track in PostHog
  analytics.trackUpgradePromptShown({
    prompt_type: 'feature_limit',
    trigger: feature,
  });
};

/**
 * Show usage threshold upgrade prompt
 */
export const showThresholdPrompt = (threshold) => {
  if (!threshold || threshold.type === 'info') return;

  activeUpgradePrompt.set({
    type: 'threshold',
    ...threshold,
  });

  recordUpgradePrompt('shown', 'threshold', { percentage: threshold.percentage });

  // Track in PostHog
  analytics.trackUpgradePromptShown({
    prompt_type: 'threshold',
    trigger: `${threshold.percentage}%`,
    discount: threshold.cta?.discount,
  });
};

/**
 * Dismiss upgrade prompt
 */
export const dismissUpgradePrompt = () => {
  const prompt = get(activeUpgradePrompt);
  if (prompt) {
    recordUpgradePrompt('dismissed', prompt.type, prompt);
    analytics.trackUpgradePromptDismissed({ prompt_type: prompt.type });
  }
  activeUpgradePrompt.set(null);
};

// Discount percentage to code mapping
const DISCOUNT_CODE_MAP = {
  5: 'EARLY5',
  10: 'POWER10',
  15: 'GROW15',
  20: 'UNLOCK20',
  25: 'MILESTONE25',
};

/**
 * Map discount percentage to code
 */
const mapDiscountToCode = (percentage) => {
  return DISCOUNT_CODE_MAP[percentage] || null;
};

/**
 * Get discount info based on usage percentage
 * @param {number} usagePercentage - Current usage percentage
 * @returns {{ discountPercent: number, discountCode: string, urgency: string } | null}
 */
export const getDiscountForUsage = (usagePercentage) => {
  if (usagePercentage >= 100) {
    return { discountPercent: 20, discountCode: 'UNLOCK20', urgency: 'limit' };
  }
  if (usagePercentage >= 95) {
    return { discountPercent: 15, discountCode: 'GROW15', urgency: 'critical' };
  }
  if (usagePercentage >= 85) {
    return { discountPercent: 10, discountCode: 'POWER10', urgency: 'urgent' };
  }
  if (usagePercentage >= 75) {
    return { discountPercent: 5, discountCode: 'EARLY5', urgency: 'warning' };
  }
  return null;
};

/**
 * Handle upgrade click - now uses in-dashboard modal
 * @deprecated Use openUpgradeModal from upgrade-modal.store.js instead
 */
export const handleUpgradeClick = async (prompt, discount = null) => {
  recordUpgradePrompt('clicked', prompt?.type || 'general', prompt);

  // Track in PostHog
  analytics.trackUpgradePromptClicked({
    prompt_type: prompt?.type || 'general',
    discount,
  });

  // Convert discount percentage to code if needed
  const discountCode = typeof discount === 'number' ? mapDiscountToCode(discount) : discount;

  // Import and use the upgrade modal store dynamically to avoid circular deps
  const { openUpgradeModal } = await import('./upgrade-modal.store.js');
  openUpgradeModal(prompt?.type || 'general', discountCode);
};

/**
 * Trigger render milestone check (called after each render)
 */
export const checkRenderMilestone = async (newCount) => {
  const status = get(plgStatus);
  const milestones = [1, 5, 10, 25, 40, 50];
  
  if (milestones.includes(newCount)) {
    // Refresh full status to get milestone info
    await initPLG();
  } else {
    // Just refresh widget
    await refreshUsageWidget();
  }
  
  // Check usage thresholds
  const percentage = status.usage.limit > 0 
    ? Math.round((newCount / status.usage.limit) * 100) 
    : 0;
  
  const thresholds = [30, 50, 65, 75, 85, 95, 100];
  if (thresholds.includes(percentage)) {
    const threshold = getThresholdConfig(percentage);
    if (threshold && threshold.showUpgrade) {
      showThresholdPrompt(threshold);
    }
  }
};

// ============================================
// Helpers
// ============================================

/**
 * Format feature name for display
 */
const formatFeatureName = (feature) => {
  const names = {
    aiCopilot: 'AI Copilot',
    backgroundRemover: 'Background Remover',
    batchRender: 'Batch Render',
    templates: 'Templates',
  };
  return names[feature] || feature;
};

/**
 * Get threshold config for a percentage
 */
const getThresholdConfig = (percentage) => {
  const thresholds = [
    { percentage: 30, type: 'info', title: 'Great Progress! 🎉', showUpgrade: false },
    { percentage: 50, type: 'info', title: 'Halfway There!', showUpgrade: true, cta: { text: 'View plans', action: 'pricing' } },
    { percentage: 65, type: 'soft_warning', title: 'You\'re Creating Amazing Content!', showUpgrade: true, nudgeType: 'inline_banner', cta: { text: 'View plans', action: 'pricing' } },
    { percentage: 75, type: 'warning', title: 'You\'re on a Roll!', showUpgrade: true, nudgeType: 'proactive_modal', cta: { text: 'Upgrade - 5% off', action: 'upgrade', discount: 5 } },
    { percentage: 85, type: 'urgent', title: 'Running Low!', showUpgrade: true, nudgeType: 'toast', cta: { text: 'Upgrade - 10% off', action: 'upgrade', discount: 10 } },
    { percentage: 95, type: 'critical', title: 'Almost Out!', showUpgrade: true, cta: { text: 'Upgrade - 15% off', action: 'upgrade', discount: 15 } },
    { percentage: 100, type: 'limit', title: 'Limit Reached', showUpgrade: true, cta: { text: 'Upgrade - 20% off', action: 'upgrade', discount: 20 } },
  ];

  // Find the highest threshold that the percentage has reached
  const reached = thresholds.filter(t => percentage >= t.percentage);
  return reached.length > 0 ? reached[reached.length - 1] : null;
};

/**
 * Milestone definitions
 */
const MILESTONES = {
  renders: [
    { count: 1, type: 'celebration', title: '🎉 First Image Created!', message: 'You just created your first image with Pictify!' },
    { count: 5, type: 'celebration', title: '🚀 You\'re Getting Started!', message: 'You\'ve created 5 images. You\'re on your way!' },
    { count: 10, type: 'soft_upsell', title: '🔥 You\'re on Fire!', message: 'You\'ve saved ~2 hours of design time!', timeSaved: '2 hours' },
    { count: 25, type: 'soft_upsell', title: '⭐ Power User Status!', message: 'You\'re in the top 20% of Pictify users!' },
    { count: 40, type: 'urgent_upsell', title: '⚠️ Almost at Your Limit', message: 'You\'ve used 80% of your free tier.' },
    { count: 50, type: 'limit_reached', title: '🎯 Impressive Work!', message: 'You\'ve maxed out your free tier this month.' },
  ],
};

/**
 * Get milestone config for a specific count
 */
const getMilestoneConfig = (feature, count) => {
  const featureMilestones = MILESTONES[feature] || [];
  return featureMilestones.find(m => m.count === count) || null;
};

/**
 * Get next milestone config
 */
const getNextMilestoneConfig = (feature, currentCount) => {
  const featureMilestones = MILESTONES[feature] || [];
  return featureMilestones.find(m => m.count > currentCount) || null;
};

/**
 * Get urgency color class (using design system colors)
 */
export const getUrgencyColor = (urgency) => {
  const colors = {
    normal: 'text-gray-600',
    info: 'text-gray-800',
    soft_warning: 'text-[#f59e0b]',
    warning: 'text-[#f59e0b]',
    urgent: 'text-[#ff6b6b]',
    critical: 'text-[#ff6b6b]',
  };
  return colors[urgency] || colors.normal;
};

/**
 * Get urgency background class (using design system colors)
 */
export const getUrgencyBg = (urgency) => {
  const colors = {
    normal: 'bg-white',
    info: 'bg-[#ffc480]/10',
    soft_warning: 'bg-[#ffc480]/15',
    warning: 'bg-[#ffc480]/20',
    urgent: 'bg-[#ff6b6b]/10',
    critical: 'bg-[#ff6b6b]/15',
  };
  return colors[urgency] || colors.normal;
};

// ============================================
// Nudge State Management
// ============================================

const BANNER_DISMISS_KEY = 'pictify_usage_banner_dismissed';
const PROACTIVE_MODAL_KEY = 'pictify_proactive_modal_shown';

/**
 * Initialize nudge state from localStorage
 */
export const initNudgeState = () => {
  if (typeof window === 'undefined') return;

  try {
    const bannerDismissedAt = localStorage.getItem(BANNER_DISMISS_KEY);
    const proactiveModalData = localStorage.getItem(PROACTIVE_MODAL_KEY);

    let proactiveModalShownThisCycle = false;
    if (proactiveModalData) {
      const data = JSON.parse(proactiveModalData);
      const resetDate = get(plgStatus).resetDate;
      if (resetDate && data.shownAt && new Date(data.shownAt) >= new Date(resetDate)) {
        proactiveModalShownThisCycle = true;
      }
    }

    nudgeState.set({
      bannerDismissedAt: bannerDismissedAt ? parseInt(bannerDismissedAt, 10) : null,
      proactiveModalShownThisCycle,
    });
  } catch (e) {
    console.warn('Failed to init nudge state:', e);
  }
};

/**
 * Check if usage banner should be shown
 */
export const shouldShowUsageBanner = () => {
  const status = get(plgStatus);
  const nudge = get(nudgeState);

  // Don't show for paid users
  if (status.isPaidPlan) return false;

  // Show at 65%+ usage
  const percentage = status.usage.percentage;
  if (percentage < 65) return false;

  // Check if dismissed within last 24 hours
  if (nudge.bannerDismissedAt) {
    const hoursSinceDismiss = (Date.now() - nudge.bannerDismissedAt) / (1000 * 60 * 60);
    if (hoursSinceDismiss < 24) return false;
  }

  return true;
};

/**
 * Dismiss the usage banner (24h cooldown)
 */
export const dismissUsageBanner = () => {
  const now = Date.now();
  nudgeState.update(s => ({ ...s, bannerDismissedAt: now }));

  try {
    localStorage.setItem(BANNER_DISMISS_KEY, now.toString());
  } catch (e) {
    console.warn('Failed to save banner dismiss:', e);
  }
};

/**
 * Check if proactive modal should be shown
 */
export const shouldShowProactiveModal = () => {
  const status = get(plgStatus);
  const nudge = get(nudgeState);

  // Don't show for paid users
  if (status.isPaidPlan) return false;

  // Only show at/above 75%
  if (status.usage.percentage < 75) return false;

  // Only show once per billing cycle
  if (nudge.proactiveModalShownThisCycle) return false;

  return true;
};

/**
 * Mark proactive modal as shown for this billing cycle
 */
export const markProactiveModalShown = () => {
  nudgeState.update(s => ({ ...s, proactiveModalShownThisCycle: true }));

  try {
    localStorage.setItem(PROACTIVE_MODAL_KEY, JSON.stringify({ shownAt: new Date().toISOString() }));
  } catch (e) {
    console.warn('Failed to save proactive modal state:', e);
  }
};

