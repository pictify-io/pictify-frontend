<script>
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import {
    handleUpgradeClick,
    FEATURES,
    FEATURE_METADATA,
    FEATURE_UPGRADE_MESSAGES,
    PLAN_DISPLAY_NAMES,
    getFeatureLimit,
    formatLimit,
  } from '../../../store/plg.store';

  /**
   * Feature to show upgrade prompt for
   */
  export let feature;

  /**
   * Current plan
   */
  export let currentPlan;

  /**
   * Target plan for upgrade
   */
  export let targetPlan;

  /**
   * Whether to show as inline banner or modal
   */
  export let variant = 'inline'; // 'inline' | 'modal' | 'card'

  /**
   * Whether to show the prompt
   */
  export let show = true;

  /**
   * Callback when dismissed
   */
  export let onDismiss = () => {};

  // Feature metadata
  $: metadata = FEATURE_METADATA[feature] || { name: feature, icon: 'zap' };
  $: upgradeMessages = FEATURE_UPGRADE_MESSAGES[feature] || {};
  $: currentLimit = getFeatureLimit(currentPlan, feature);
  $: targetLimit = targetPlan ? getFeatureLimit(targetPlan, feature) : null;

  // Icon paths (24x24 viewbox)
  const iconPaths = {
    image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    film: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
    'file-text': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    layers: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    list: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    wand: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V8m0-6v2m4-2v2m16.071 2.071l-1.414-1.414m0 0l-2.828 2.828m2.828-2.828l1.414 1.414m-12.071 8l-2.828 2.828m0 0l-1.414-1.414m1.414 1.414L3.93 19.93', // Magic wand approximation or use sparkles
    sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    zap: 'M13 10V3L4 14h7v7l9-11h-7z',
    link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
    cloud: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
    briefcase: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 8V3c0-1.105.895-2 2-2z',
    code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  };
  
  $: iconPath = iconPaths[metadata.icon] || iconPaths.zap;

  function handleUpgrade() {
    handleUpgradeClick({
      type: 'feature_upgrade_prompt',
      feature,
      targetPlan,
    });
  }
</script>

{#if show}
  {#if variant === 'inline'}
    <!-- Inline Banner -->
    <div
      class="p-4 bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center gap-4 relative overflow-hidden"
      transition:fade={{ duration: 200 }}
    >
      <!-- Decorative pattern -->
      <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none"></div>

      <div class="relative z-10 w-10 h-10 flex items-center justify-center bg-[#ffc480] rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937]">
        <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath} />
        </svg>
      </div>
      
      <div class="flex-1 relative z-10">
        <h4 class="font-black text-gray-900 text-lg uppercase tracking-tight">{upgradeMessages.title || `Unlock ${metadata.name}`}</h4>
        <p class="text-sm font-medium text-gray-700 mt-0.5">{upgradeMessages.message || metadata.description}</p>
      </div>
      <button
        class="relative z-10 px-4 py-2 bg-[#ffc480] text-gray-900 font-black text-xs uppercase tracking-widest rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#1f2937] transition-all whitespace-nowrap"
        on:click={handleUpgrade}
      >
        Upgrade to {PLAN_DISPLAY_NAMES[targetPlan]}
      </button>
      <button
        class="relative z-10 p-1.5 text-gray-900 hover:bg-gray-900/10 rounded-lg border-2 border-transparent hover:border-gray-900 transition-colors"
        on:click={onDismiss}
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {:else if variant === 'card'}
    <!-- Card Style -->
    <div
      class="p-6 bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] relative overflow-hidden"
      transition:scale={{ duration: 200, easing: quintOut, start: 0.95 }}
    >
      <!-- Background decoration -->
      <div class="absolute -top-10 -right-10 w-32 h-32 bg-[#ffc480]/20 rounded-full border-2 border-gray-900 dashed" />

      <div class="relative">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-[#ffc480] rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath} />
            </svg>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-black text-gray-900 text-lg uppercase tracking-tight">{metadata.name}</h4>
              <span class="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                {PLAN_DISPLAY_NAMES[targetPlan]}+
              </span>
            </div>
            <p class="text-sm font-medium text-gray-700 mt-2 leading-relaxed">{upgradeMessages.message || metadata.description}</p>

            {#if upgradeMessages.benefit}
              <div class="inline-block mt-3 px-2 py-1 bg-[#10b981]/10 border border-[#10b981]/30 rounded text-[10px] font-bold text-[#059669] uppercase flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPaths.sparkles} />
                </svg>
                {upgradeMessages.benefit}
              </div>
            {/if}

            <!-- Limit comparison -->
            {#if currentLimit !== false && targetLimit !== null}
              <div class="flex items-center gap-4 mt-4 text-sm bg-gray-50 p-3 rounded-lg border-2 border-gray-200 border-dashed">
                <div class="flex items-center gap-2">
                  <span class="text-gray-500 font-bold text-xs uppercase">Current:</span>
                  <span class="font-bold text-gray-900">
                    {currentLimit === false ? 'None' : formatLimit(currentLimit)}
                  </span>
                </div>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div class="flex items-center gap-2">
                  <span class="text-gray-500 font-bold text-xs uppercase">Upgrade:</span>
                  <span class="font-black text-[#10b981]">
                    {targetLimit === null ? 'Unlimited' : formatLimit(targetLimit)}
                  </span>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            class="flex-1 py-2.5 bg-[#ffc480] text-gray-900 font-black text-xs uppercase tracking-widest rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            on:click={handleUpgrade}
          >
            Upgrade Now
          </button>
          <button
            class="px-4 py-2.5 text-gray-500 hover:text-gray-900 font-bold text-xs uppercase tracking-widest transition-colors"
            on:click={onDismiss}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  {:else if variant === 'modal'}
    <!-- Modal Style -->
    <div
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      transition:fade={{ duration: 150 }}
      on:click={onDismiss}
      on:keydown={(e) => e.key === 'Escape' && onDismiss()}
      role="dialog"
      aria-modal="true"
    >
      <div
        class="relative bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] max-w-md w-full overflow-hidden"
        transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
        on:click|stopPropagation
        on:keydown|stopPropagation
      >
        <!-- Header -->
        <div class="bg-[#ffc480] p-6 relative overflow-hidden border-b-[3px] border-gray-900">
           <!-- Decorative pattern -->
           <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]"></div>
           
           <div class="relative z-10">
             <div class="w-16 h-16 bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
               <svg class="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath} />
               </svg>
             </div>
             
             <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">{upgradeMessages.title || `Unlock ${metadata.name}`}</h2>
             <p class="text-gray-900 text-sm mt-2 font-bold leading-relaxed opacity-90">{upgradeMessages.message || metadata.description}</p>
           </div>

           <button
             class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/30 hover:bg-white/50 text-gray-900 transition-colors border-2 border-gray-900/20"
             on:click={onDismiss}
           >
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          {#if upgradeMessages.benefit}
            <div class="flex items-start gap-3 p-3 bg-[#10b981] rounded-lg mb-6 border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937]">
              <div class="p-1 bg-black/10 rounded">
                <svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPaths.sparkles} />
                </svg>
              </div>
              <p class="text-sm font-black text-gray-900 mt-0.5">{upgradeMessages.benefit}</p>
            </div>
          {/if}

          <!-- Limit comparison -->
          {#if targetLimit !== null}
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-white rounded-lg border-2 border-gray-200 text-center">
                <p class="text-xs text-gray-500 uppercase tracking-wide font-bold">Current</p>
                <p class="text-2xl font-black text-gray-400 mt-1">
                  {currentLimit === false ? 'None' : formatLimit(currentLimit)}
                </p>
              </div>
              <div class="p-4 bg-[#ffc480]/20 rounded-lg text-center border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937]">
                <p class="text-xs text-gray-500 uppercase tracking-wide font-bold">With {PLAN_DISPLAY_NAMES[targetPlan]}</p>
                <p class="text-2xl font-black text-[#10b981] mt-1">
                  {targetLimit === null ? 'Unlimited' : formatLimit(targetLimit)}
                </p>
              </div>
            </div>
          {/if}

          <div class="space-y-3">
            <button
              class="w-full py-3 px-6 bg-[#ffc480] text-gray-900 font-black uppercase tracking-widest text-sm rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              on:click={handleUpgrade}
            >
              Upgrade to {PLAN_DISPLAY_NAMES[targetPlan]}
            </button>

            <button
              class="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors"
              on:click={onDismiss}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
{/if}
