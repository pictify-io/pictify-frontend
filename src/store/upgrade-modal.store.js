import { goto } from '$app/navigation';

/**
 * Navigate to the upgrade page (or a direct checkout, if provided)
 * @param {string} context - What triggered the upgrade (for analytics)
 * @param {string|null} discountCode - Optional discount code
 * @param {string|null} checkoutUrl - Optional prefilled checkout URL (e.g. from a
 *   quota_exceeded 429). When present, opens it directly instead of the upgrade page.
 */
export function openUpgradeModal(context = 'general', discountCode = null, checkoutUrl = null) {
	// Direct one-click checkout when the backend supplied a prefilled URL.
	if (checkoutUrl && typeof window !== 'undefined') {
		window.open(checkoutUrl, '_blank', 'noopener');
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
