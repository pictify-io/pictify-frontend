import { goto } from '$app/navigation';

/**
 * Navigate to the upgrade page
 * @param {string} context - What triggered the upgrade (for analytics)
 * @param {string|null} discountCode - Optional discount code
 */
export function openUpgradeModal(context = 'general', discountCode = null) {
  // Navigate to the upgrade page
  const url = discountCode 
    ? `/dashboard/upgrade?discount=${discountCode}&source=${context}`
    : `/dashboard/upgrade?source=${context}`;
  
  goto(url);
}

// Alias for backwards compatibility
export const navigateToUpgrade = openUpgradeModal;
