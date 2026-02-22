<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    usageWidget,
    overageState,
    isOverageEnabled,
    initPLG,
    refreshUsageWidget,
    initOverageState,
  } from '../../../store/plg.store';
  import { openUpgradeModal } from '../../../store/upgrade-modal.store';
  import { formatCompactNumber } from '$lib/utils/format.js';

  export let compact = false;
  export let showPlan = true;

  // Overage state
  $: overageEnabled = $isOverageEnabled;
  $: currentOverages = $overageState.currentCycleOverages || 0;
  $: currentOverageCost = $overageState.currentCycleOverageCostCents || 0;
  $: overageRate = $overageState.ratePerRenderFormatted;
  $: showOverageInfo = overageEnabled && ($usageWidget.percentage >= 100 || currentOverages > 0);

  let isHovered = false;
  let refreshInterval;
  let hoverTimeout;

  function handleMouseEnter() {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    isHovered = true;
  }

  function handleMouseLeave() {
    hoverTimeout = setTimeout(() => {
      isHovered = false;
    }, 150);
  }

  onMount(async () => {
    // initPLG() is called by PLGProvider - no need to duplicate here.
    // Just ensure overage state is loaded.
    await initOverageState();
    // No separate polling - PLGProvider handles the refresh interval.
  });

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });

  $: progressColor = getProgressColor($usageWidget.percentage);
  $: urgencyBg = getUrgencyBg($usageWidget.urgency);

  function getProgressColor(percentage) {
    if (percentage >= 95) return '#ff6b6b';
    if (percentage >= 85) return '#ff6b6b';
    if (percentage >= 75) return '#f59e0b';
    if (percentage >= 65) return '#ffc480';
    if (percentage >= 50) return '#ffc480';
    return '#10b981';
  }

  function getUrgencyBg(urgency) {
    if (urgency === 'critical') return 'bg-[#ff6b6b]/15';
    if (urgency === 'urgent') return 'bg-[#ff6b6b]/10';
    if (urgency === 'warning') return 'bg-[#f59e0b]/15';
    if (urgency === 'soft_warning') return 'bg-[#ffc480]/20';
    return 'bg-white';
  }

  const formatNumber = formatCompactNumber;
</script>

{#if compact}
  <!-- Compact version for header -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div 
    class="relative group h-full flex items-center"
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
  >
    <button
      class="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg border-2 border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
      on:click={() => goto('/dashboard/api-token')}
    >
      <!-- Progress ring -->
      <div class="relative w-4 h-4 sm:w-5 sm:h-5">
        <svg class="w-4 h-4 sm:w-5 sm:h-5 -rotate-90" viewBox="0 0 36 36">
          <path
            class="text-gray-200"
            stroke="currentColor"
            stroke-width="6"
            fill="none"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            stroke="{progressColor}"
            stroke-width="6"
            stroke-linecap="round"
            fill="none"
            stroke-dasharray="{$usageWidget.percentage}, 100"
            class="transition-all duration-500"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
      </div>
      
      <!-- Count -->
      <div class="text-left hidden md:block leading-none">
        <div class="text-[10px] sm:text-xs font-black text-gray-900 tracking-tight">
          {formatNumber($usageWidget.current)} / {formatNumber($usageWidget.limit)}
        </div>
      </div>
    </button>

    <!-- Hover tooltip -->
    {#if isHovered}
      <div class="absolute top-full right-0 pt-2 sm:pt-4 w-72 sm:w-80 z-50 animate-fade-in">
        <div class="bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
          <!-- Header -->
          <div class="bg-gray-100 border-b-[3px] border-gray-900 p-3 sm:p-4 flex items-center justify-between">
            <span class="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-widest">Monthly Usage</span>
            <span class="text-[9px] sm:text-[10px] font-black px-2 py-1 rounded bg-[#ffc480] text-gray-900 border border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase tracking-wider">
              {$usageWidget.plan}
            </span>
          </div>

          <div class="p-4 sm:p-5 space-y-4">
            <!-- Progress bar -->
            <div class="space-y-2">
              <div class="flex justify-between text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                <span>Used: {Math.round($usageWidget.percentage)}%</span>
                <span>Remaining: {Math.round(100 - $usageWidget.percentage)}%</span>
              </div>
              <div class="h-4 sm:h-5 bg-white rounded-lg overflow-hidden border-2 border-gray-900 relative">
                <!-- Pattern background for empty part -->
                <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 4px 4px;"></div>
                <div 
                  class="h-full transition-all duration-500 border-r-2 border-gray-900 relative z-10"
                  style="width: {$usageWidget.percentage}%; background-color: {progressColor}"
                />
              </div>
              <div class="flex justify-between text-[10px] font-black text-gray-900 uppercase tracking-wide mt-1">
                <span>{$usageWidget.current} renders</span>
                <span>{$usageWidget.limit} total</span>
              </div>
            </div>

            <!-- Overage info -->
            {#if showOverageInfo}
              <div class="bg-[#ffc480]/20 border-2 border-[#ffc480] rounded-lg p-3">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-black text-gray-900 uppercase tracking-wider">Overages Active</span>
                  <span class="text-[9px] font-bold text-gray-600">{overageRate}/render</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600">{currentOverages} overage renders</span>
                  <span class="font-bold text-gray-900">${(currentOverageCost / 100).toFixed(2)}</span>
                </div>
              </div>
            {/if}

            {#if $usageWidget.showUpgrade}
              <button
                class="w-full py-2.5 px-3 bg-[#ffc480] text-gray-900 text-xs font-black rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1f2937] transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                on:click|stopPropagation={() => openUpgradeModal('usage_limit')}
              >
                <span>Upgrade Plan</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>
            {:else}
              <a 
                href="/dashboard/api-token" 
                class="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded border-2 border-transparent hover:border-gray-900 transition-all uppercase tracking-wide"
              >
                <span>View Full Details</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </a>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

{:else}
  <!-- Full version for dashboard -->
  <div class="bg-white rounded-xl border-[3px] border-gray-900 overflow-hidden relative shadow-[8px_8px_0_0_#1f2937]">
    <!-- Header Strip -->
    <div class="bg-gray-100 border-b-[3px] border-gray-900 p-4 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        <h3 class="text-xs font-black text-gray-900 uppercase tracking-widest">System Load</h3>
      </div>
      {#if showPlan}
        <span class="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border-2 border-gray-200 text-gray-900 uppercase tracking-wider">
          {$usageWidget.plan} Plan
        </span>
      {/if}
    </div>

    <div class="p-6">
      <!-- Digital Readout Grid -->
      <div class="flex items-end justify-between mb-6">
        <div class="text-right">
          <div class="text-5xl font-black text-gray-900 leading-none tracking-tighter">
            {Math.round($usageWidget.percentage)}<span class="text-xl text-gray-400">%</span>
          </div>
        </div>
        <div class="flex flex-col items-end">
          <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Capacity</div>
          <div class="font-mono text-sm font-black text-gray-900 bg-gray-50 px-2 py-1 rounded border-2 border-gray-200">
            {formatNumber($usageWidget.current)} / {formatNumber($usageWidget.limit)}
          </div>
        </div>
      </div>

      <!-- Segmented Progress Bar -->
      <div class="space-y-2 mb-8">
        <div class="flex gap-1 h-8">
          {#each Array(10) as _, i}
            <div 
              class="flex-1 rounded-sm border border-gray-900 transition-all duration-300
              {i < Math.floor($usageWidget.percentage / 10) 
                ? 'opacity-100' 
                : 'opacity-10 bg-gray-100'}"
              style="background-color: {i < Math.floor($usageWidget.percentage / 10) ? progressColor : ''}"
            ></div>
          {/each}
        </div>
        <div class="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <!-- Footer / Actions -->
      {#if $usageWidget.showUpgrade}
        <div class="bg-[#FFFDF8] rounded-xl border-2 border-dashed border-gray-300 p-4 text-center">
          <p class="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide flex items-center justify-center gap-2">
            {#if $usageWidget.percentage >= 80}
              <svg class="w-4 h-4 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Capacity Critical
            {:else}
              <svg class="w-4 h-4 text-[#ffc480]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Need More Power?
            {/if}
          </p>
          <button
            class="w-full py-3 px-4 bg-gray-900 text-white text-xs font-black rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#ffc480] transition-all uppercase tracking-widest group flex items-center justify-center gap-2"
            on:click={() => openUpgradeModal('usage_limit')}
          >
            Increase Limits
            <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.15s ease-out;
  }
</style>