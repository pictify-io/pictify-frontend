<script>
  import { fade, fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import {
    usageWidget,
    handleUpgradeClick,
  } from '../../../store/plg.store';

  export let show = false;
  export let type = 'info'; // 'info', 'warning', 'success', 'milestone'
  export let message = '';
  export let duration = 5000;
  export let showUpgrade = false;
  export let discount = null;
  export let onDismiss = () => {};

  let timeoutId;

  $: if (show && duration > 0) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      show = false;
      onDismiss();
    }, duration);
  }

  function getTypeStyles(type) {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          icon: '⚠️',
        };
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          icon: '✅',
        };
      case 'milestone':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-800',
          icon: '🎉',
        };
      case 'limit':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: '🚨',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'ℹ️',
        };
    }
  }

  $: styles = getTypeStyles(type);

  function dismiss() {
    show = false;
    onDismiss();
  }

  function handleUpgrade() {
    handleUpgradeClick(null, discount);
  }
</script>

{#if show}
  <div 
    class="fixed bottom-4 right-4 z-50 max-w-sm"
    transition:fly={{ y: 20, duration: 300 }}
  >
    <div class="flex items-start gap-3 p-4 {styles.bg} {styles.border} border rounded-xl shadow-lg">
      <span class="text-xl flex-shrink-0">{styles.icon}</span>
      
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium {styles.text}">
          {message}
        </p>
        
        <!-- Usage bar -->
        {#if $usageWidget.percentage > 0}
          <div class="mt-2 flex items-center gap-2">
            <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                style="width: {$usageWidget.percentage}%"
              />
            </div>
            <span class="text-xs text-gray-500">{$usageWidget.percentage}%</span>
          </div>
        {/if}

        {#if showUpgrade}
          <button
            class="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
            on:click={handleUpgrade}
          >
            Upgrade now {discount ? `- ${discount}% off` : ''} →
          </button>
        {/if}
      </div>

      <button
        class="flex-shrink-0 text-gray-400 hover:text-gray-600"
        on:click={dismiss}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
{/if}

