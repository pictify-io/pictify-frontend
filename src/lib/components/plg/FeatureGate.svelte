<script>
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import {
    plgStatus,
    canUseFeature,
    trackFeatureUsage,
    handleUpgradeClick,
    featureGates,
  } from '../../../store/plg.store';

  /**
   * Feature name to gate
   * Options: 'aiCopilot', 'backgroundRemover', 'batchRender', 'templates'
   */
  export let feature;
  
  /**
   * Amount to check/consume (default 1)
   */
  export let amount = 1;
  
  /**
   * Whether to show inline warning when limit is close
   */
  export let showWarning = true;
  
  /**
   * Custom message when limit reached
   */
  export let limitMessage = null;
  
  /**
   * Callback when feature is allowed
   */
  export let onAllowed = () => {};
  
  /**
   * Callback when feature is blocked
   */
  export let onBlocked = () => {};

  let checking = false;
  let featureStatus = null;
  let showLimitBanner = false;

  // Feature display names
  const featureNames = {
    aiCopilot: 'AI Copilot',
    backgroundRemover: 'Background Remover',
    batchRender: 'Batch Render',
    templates: 'Templates',
  };

  // Feature icons
  const featureIcons = {
    aiCopilot: '🤖',
    backgroundRemover: '✨',
    batchRender: '📦',
    templates: '📁',
  };

  $: featureName = featureNames[feature] || feature;
  $: featureIcon = featureIcons[feature] || '⚡';
  $: featureData = $featureGates[feature];
  $: isPaidPlan = $plgStatus.isPaidPlan;

  onMount(async () => {
    await checkFeature();
  });

  async function checkFeature() {
    if (isPaidPlan) {
      featureStatus = { allowed: true, remaining: -1 };
      return;
    }

    checking = true;
    try {
      featureStatus = await canUseFeature(feature, amount);
      
      // Show warning if limit is close
      if (featureStatus.remaining <= 2 && featureStatus.remaining > 0) {
        showLimitBanner = true;
      }
      
      // Show limit reached if exceeded
      if (!featureStatus.allowed) {
        showLimitBanner = true;
      }
    } catch (error) {
      console.error('Failed to check feature:', error);
      featureStatus = { allowed: true }; // Fail open
    } finally {
      checking = false;
    }
  }

  /**
   * Check if feature can be used and optionally consume usage
   */
  export async function tryUseFeature(consume = true) {
    await checkFeature();
    
    if (!featureStatus?.allowed) {
      onBlocked();
      return false;
    }

    if (consume) {
      await trackFeatureUsage(feature, amount);
      await checkFeature(); // Refresh status
    }

    onAllowed();
    return true;
  }

  function dismissBanner() {
    showLimitBanner = false;
  }
</script>

<!-- Slot for gated content -->
{#if checking}
  <slot name="loading">
    <div class="flex items-center justify-center p-4">
      <div class="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
    </div>
  </slot>
{:else if featureStatus?.allowed}
  <!-- Feature is available -->
  <div class="relative">
    <!-- Warning banner when limit is close -->
    {#if showLimitBanner && featureStatus?.remaining > 0 && showWarning}
      <div 
        class="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3"
        transition:slide={{ duration: 200 }}
      >
        <span class="text-amber-500 text-lg">⚠️</span>
        <div class="flex-1">
          <p class="text-sm text-amber-800 font-medium">
            Only {featureStatus.remaining} {featureName} use{featureStatus.remaining !== 1 ? 's' : ''} remaining
          </p>
          <p class="text-xs text-amber-600 mt-0.5">
            Upgrade to get unlimited access
          </p>
        </div>
        <button
          class="text-amber-500 hover:text-amber-700"
          on:click={dismissBanner}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {/if}

    <slot />
  </div>
{:else}
  <!-- Feature limit reached -->
  <div class="relative">
    <!-- Limit reached overlay -->
    <div class="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
      <div class="text-center p-6 max-w-sm">
        <div class="text-4xl mb-3">{featureIcon}</div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">
          {featureName} Limit Reached
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          {limitMessage || `You've used all your free ${featureName.toLowerCase()} for this period.`}
        </p>
        <button
          class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          on:click={() => handleUpgradeClick({ feature })}
        >
          Upgrade for Unlimited Access
        </button>
      </div>
    </div>

    <!-- Blurred content preview -->
    <div class="filter blur-sm pointer-events-none">
      <slot />
    </div>
  </div>
{/if}

<!-- Usage indicator badge (can be positioned absolutely) -->
{#if featureStatus && !isPaidPlan && featureStatus.remaining > 0}
  <slot name="usage-badge">
    <!-- Default usage badge -->
  </slot>
{/if}

