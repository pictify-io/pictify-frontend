// PLG (Product-Led Growth) Components
export { default as UsageWidget } from './UsageWidget.svelte';
export { default as MilestoneCelebration } from './MilestoneCelebration.svelte';
export { default as FeatureGate } from './FeatureGate.svelte';
export { default as UpgradeModal } from './UpgradeModal.svelte';
export { default as PLGProvider } from './PLGProvider.svelte';
export { default as UsageBanner } from './UsageBanner.svelte';
export { default as ProactiveUpgradeModal } from './ProactiveUpgradeModal.svelte';
export { default as FeatureUpgradePrompt } from './FeatureUpgradePrompt.svelte';
export { default as FeatureBadge } from './FeatureBadge.svelte';

// Re-export plan features config for convenience
export {
  PLANS,
  PLAN_DISPLAY_NAMES,
  FEATURES,
  PLAN_FEATURES,
  FEATURE_METADATA,
  getFeatureLimit,
  hasFeatureAccess,
  formatLimit,
} from '../../../config/plan-features.js';

