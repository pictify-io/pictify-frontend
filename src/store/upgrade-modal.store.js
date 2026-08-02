import { goto } from '$app/navigation';
import { analytics } from '$lib/analytics.js';

/**
 * Navigate to the upgrade page (or a direct checkout, if provided)
 * @param {string} context - What triggered the upgrade (for analytics)
 * @param {string|null} discountCode - Optional discount code
 * @param {string|null} checkoutUrl - Optional prefilled checkout URL (e.g. from a
 *   quota_exceeded 429). When present, opens it directly instead of the upgrade page.
 */
// Throttle direct-checkout tab opening so several in-flight 429s arriving at once
// (e.g. a page firing multiple backend calls on mount) can't open a storm of tabs.
let lastCheckoutOpenAt = 0;

export function openUpgradeModal(context = 'general', discountCode = null, checkoutUrl = null) {
	// Buying signal — fired here because every upgrade path (usage banner, proactive
	// modal, feature gate, quota wall) funnels through this one function.
	const usingDirectCheckout =
		!!checkoutUrl && /^https:\/\//i.test(checkoutUrl) && typeof window !== 'undefined';
	analytics.trackUpgradePromptTriggered({ context, direct_checkout: usingDirectCheckout });

	// Direct one-click checkout when the backend supplied a prefilled URL.
	// Only honor https (the URL comes from the 429 body; reject javascript:/data:
	// and other schemes as defense-in-depth). Anything else falls through to the
	// in-app upgrade page below.
	if (checkoutUrl && /^https:\/\//i.test(checkoutUrl) && typeof window !== 'undefined') {
		const now = Date.now();
		if (now - lastCheckoutOpenAt > 3000) {
			lastCheckoutOpenAt = now;
			window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
		}
		return;
	}

	// Otherwise navigate to the in-app upgrade page.
	const url = discountCode
		? `/dashboard/upgrade?discount=${discountCode}&source=${context}`
		: `/dashboard/upgrade?source=${context}`;

	goto(url);
}

// Alias for backwards compatibility
export const navigateToUpgrade = openUpgradeModal;
