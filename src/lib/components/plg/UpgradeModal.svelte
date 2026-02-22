<script>
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import {
    activeUpgradePrompt,
    dismissUpgradePrompt,
    handleUpgradeClick,
    plgStatus,
    PLANS,
    PLAN_DISPLAY_NAMES,
    FEATURES,
    PLAN_FEATURES,
    getFeatureLimit,
    formatLimit,
    getNextPlan,
  } from '../../../store/plg.store';

  $: prompt = $activeUpgradePrompt;
  $: plan = $plgStatus.plan || PLANS.STARTER;
  $: usage = $plgStatus.usage;
  $: timeSaved = $plgStatus.timeSaved;
  $: nextPlan = getNextPlan(plan);

  const iconPaths = {
    lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    alert: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    check: 'M5 13l4 4L19 7'
  };

  function getTypeStyles(type) {
    switch (type) {
      case 'feature_limit':
      case 'feature_gate':
        return {
          headerBg: 'bg-[#ffc480]',
          icon: 'lock',
          label: 'Feature Locked'
        };
      case 'threshold':
        if (prompt?.percentage >= 95) {
          return {
            headerBg: 'bg-[#ff6b6b]',
            icon: 'alert',
            label: 'Limit Critical'
          };
        } else if (prompt?.percentage >= 80) {
          return {
            headerBg: 'bg-[#ffc480]',
            icon: 'warning',
            label: 'Limit Warning'
          };
        }
        return {
          headerBg: 'bg-[#ffc480]',
          icon: 'chart',
          label: 'Usage Alert'
        };
      default:
        return {
          headerBg: 'bg-[#ffc480]',
          icon: 'sparkles',
          label: 'Unlock Potential'
        };
    }
  }

  $: styles = prompt ? getTypeStyles(prompt.type) : {};

  function handleCTAClick() {
    handleUpgradeClick(prompt, prompt?.cta?.discount);
  }

  // Feature comparison based on plan-features.js
  $: currentFeatures = {
    renders: getFeatureLimit(plan, FEATURES.RENDERS),
    aiCopilot: getFeatureLimit(plan, FEATURES.AI_COPILOT),
    templates: getFeatureLimit(plan, FEATURES.TEMPLATES_SAVED),
    gifOutput: getFeatureLimit(plan, FEATURES.GIF_OUTPUT),
    batchRender: getFeatureLimit(plan, FEATURES.BATCH_RENDER),
    aiBackgroundRemover: getFeatureLimit(plan, FEATURES.AI_BACKGROUND_REMOVER),
  };

  $: nextFeatures = nextPlan ? {
    renders: getFeatureLimit(nextPlan, FEATURES.RENDERS),
    aiCopilot: getFeatureLimit(nextPlan, FEATURES.AI_COPILOT),
    templates: getFeatureLimit(nextPlan, FEATURES.TEMPLATES_SAVED),
    gifOutput: getFeatureLimit(nextPlan, FEATURES.GIF_OUTPUT),
    batchRender: getFeatureLimit(nextPlan, FEATURES.BATCH_RENDER),
    aiBackgroundRemover: getFeatureLimit(nextPlan, FEATURES.AI_BACKGROUND_REMOVER),
  } : null;

  // Format feature value for display
  function formatFeatureValue(value, unit = '/mo') {
    if (value === null) return 'Unlimited';
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (typeof value === 'number') {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K${unit}`;
      }
      return `${value}${unit}`;
    }
    return String(value);
  }

  // Features to show in comparison
  const featureDisplay = [
    { key: 'renders', label: 'Renders', unit: '/mo' },
    { key: 'templates', label: 'Templates', unit: '' },
    { key: 'gifOutput', label: 'GIF Renders', unit: '/mo' },
    { key: 'aiCopilot', label: 'AI Copilot', unit: '/mo' },
    { key: 'aiBackgroundRemover', label: 'AI Background Remover', unit: '/mo' },
    { key: 'batchRender', label: 'Batch Render', unit: '' },
  ];
</script>

{#if prompt}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    transition:fade={{ duration: 150 }}
    on:click={dismissUpgradePrompt}
    on:keydown={(e) => e.key === 'Escape' && dismissUpgradePrompt()}
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal -->
    <div
      class="relative bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] max-w-lg w-full overflow-hidden"
      transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <!-- Header -->
      <div class="{styles.headerBg} p-6 relative overflow-hidden border-b-[3px] border-gray-900">
        <!-- Decorative elements -->
        <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]"></div>

        <div class="relative z-10 flex gap-5 items-start">
          <div class="w-16 h-16 bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center flex-shrink-0 text-gray-900 transform -rotate-2">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPaths[styles.icon]} />
            </svg>
          </div>
          <div>
            <div class="inline-block px-2 py-0.5 rounded bg-black/10 border border-black/10 text-[10px] font-black uppercase tracking-widest text-gray-900 mb-2">
              {styles.label || 'Upgrade'}
            </div>
            <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-2">{prompt.title}</h2>
            <p class="text-gray-900 text-sm font-bold leading-relaxed opacity-90">{prompt.message}</p>
          </div>
        </div>

        <!-- Close button -->
        <button
          class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/30 hover:bg-white/50 text-gray-900 transition-colors border-2 border-transparent hover:border-gray-900/20"
          on:click={dismissUpgradePrompt}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Current vs Upgrade comparison -->
        {#if nextPlan && nextFeatures}
          <div class="grid grid-cols-2 gap-4 mb-6">
            <!-- Current plan -->
            <div class="p-4 bg-white rounded-lg border-2 border-gray-200 text-center opacity-70">
              <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Current: {PLAN_DISPLAY_NAMES[plan]}</p>
              
              <div class="space-y-1.5 text-sm text-left opacity-60">
                {#each featureDisplay.slice(0, 4) as { key, label, unit }}
                   <div class="flex justify-between items-center text-xs">
                    <span>{label}</span>
                    <span class="font-bold">{formatFeatureValue(currentFeatures[key], unit)}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Next plan -->
            <div class="p-4 bg-[#ffc480]/10 rounded-lg border-2 border-gray-900 shadow-[3px_3px_0_0_#1f2937] relative text-center relative overflow-hidden">
               <!-- Highlight bg -->
               <div class="absolute inset-0 bg-[#ffc480] opacity-5"></div>
               
              {#if prompt?.cta?.discount}
                <div class="absolute top-0 right-0 px-2 py-1 bg-[#ff6b6b] text-white text-[9px] font-black uppercase tracking-wider rounded-bl-lg border-l-2 border-b-2 border-gray-900 z-10">
                  {prompt.cta.discount}% OFF
                </div>
              {/if}
              
              <p class="text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-2">To: {PLAN_DISPLAY_NAMES[nextPlan]}</p>
              
              <div class="space-y-1.5 text-sm text-left relative z-10">
                {#each featureDisplay.slice(0, 4) as { key, label, unit }}
                  {@const currentVal = currentFeatures[key]}
                  {@const nextVal = nextFeatures[key]}
                  {@const isUpgrade = nextVal !== currentVal && (nextVal === null || nextVal === true || (typeof nextVal === 'number' && (currentVal === false || nextVal > currentVal)))}
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-gray-600">{label}</span>
                    <span class="font-black {isUpgrade ? 'text-[#059669]' : 'text-gray-900'}">{formatFeatureValue(nextVal, unit)}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Time saved stat -->
        {#if timeSaved && timeSaved.value > 0}
          <div class="flex items-center gap-3 p-3 bg-[#10b981] rounded-lg mb-6 border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937]">
            <div class="p-1.5 bg-black/10 rounded-md">
              <svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-black text-gray-900">You've saved ~{timeSaved.display}</p>
              <p class="text-[10px] uppercase font-bold text-gray-800/80 tracking-wide">With more renders, imagine what you could do!</p>
            </div>
          </div>
        {/if}

        <!-- CTA Buttons -->
        <div class="space-y-3">
          <button
            class="w-full py-3 px-6 bg-[#ffc480] text-gray-900 font-black uppercase tracking-widest text-sm rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 group"
            on:click={handleCTAClick}
          >
            {prompt.cta?.text || 'Upgrade Now'}
             <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>

          <button
            class="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors"
            on:click={dismissUpgradePrompt}
          >
            Not right now
          </button>
        </div>

        <!-- Trust signals -->
        <div class="mt-4 pt-4 border-t-2 border-gray-100 flex items-center justify-center gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
          <span class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPaths.check} />
            </svg>
            Cancel anytime
          </span>
          <span class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPaths.lock} />
            </svg>
            Secure payment
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}
