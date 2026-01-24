<script>
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  /**
   * Social Proof Banner
   * Displays generation stats and recent activity to build trust
   */

  export let totalGenerated = 50000;
  export let showRecentActivity = true;
  export let variant = 'default'; // 'default' | 'compact' | 'minimal'

  // Animated counter
  const animatedCount = tweened(0, {
    duration: 2000,
    easing: cubicOut
  });

  // Recent activity simulation (could be replaced with real data)
  const recentActivity = [
    { user: 'Developer in SF', action: 'generated 12 OG images', time: '2m ago' },
    { user: 'Marketing team', action: 'created batch of 500', time: '5m ago' },
    { user: 'Startup founder', action: 'saved new template', time: '8m ago' }
  ];

  let currentActivityIndex = 0;
  let activityInterval;

  onMount(() => {
    // Animate the counter on mount
    animatedCount.set(totalGenerated);

    // Rotate through recent activity
    if (showRecentActivity) {
      activityInterval = setInterval(() => {
        currentActivityIndex = (currentActivityIndex + 1) % recentActivity.length;
      }, 4000);
    }

    return () => {
      if (activityInterval) clearInterval(activityInterval);
    };
  });

  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }
</script>

{#if variant === 'minimal'}
  <!-- Minimal: just the counter -->
  <div class="inline-flex items-center gap-2 text-sm font-bold text-gray-600">
    <span class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></span>
    <span>{formatNumber(Math.floor($animatedCount))}+ images generated</span>
  </div>

{:else if variant === 'compact'}
  <!-- Compact: counter with brief social proof -->
  <div class="flex items-center justify-center gap-4 py-2 px-4 bg-gray-50 border-y border-gray-200">
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></span>
      <span class="text-sm font-bold">
        <span class="text-black">{formatNumber(Math.floor($animatedCount))}</span>
        <span class="text-gray-500"> images generated</span>
      </span>
    </div>
    <span class="text-gray-300">|</span>
    <span class="text-sm font-bold text-gray-500">Trusted by 10,000+ developers</span>
  </div>

{:else}
  <!-- Default: full banner with activity feed -->
  <div class="w-full max-w-5xl mx-auto mb-8">
    <div class="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0_0_#e5e7eb]">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <!-- Stats -->
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#4ade80] border-[2px] border-black flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div class="text-2xl font-black text-black tracking-tight">
                {formatNumber(Math.floor($animatedCount))}
              </div>
              <div class="text-xs font-bold text-gray-500 uppercase tracking-wide">Images Generated</div>
            </div>
          </div>

          <div class="hidden sm:block w-px h-10 bg-gray-200"></div>

          <div class="hidden sm:flex items-center gap-3">
            <div class="w-10 h-10 bg-[#ffc480] border-[2px] border-black flex items-center justify-center">
              <svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <div class="text-2xl font-black text-black tracking-tight">10K+</div>
              <div class="text-xs font-bold text-gray-500 uppercase tracking-wide">Developers</div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        {#if showRecentActivity}
          <div class="flex items-center gap-2 px-4 py-2 bg-gray-50 border-[2px] border-gray-200">
            <span class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></span>
            <span class="text-sm font-medium text-gray-600">
              <span class="font-bold text-gray-800">{recentActivity[currentActivityIndex].user}</span>
              {recentActivity[currentActivityIndex].action}
              <span class="text-gray-400">· {recentActivity[currentActivityIndex].time}</span>
            </span>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
