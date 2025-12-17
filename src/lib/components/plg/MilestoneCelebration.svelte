<script>
  import { fade, scale, fly } from 'svelte/transition';
  import { elasticOut, quintOut } from 'svelte/easing';
  import {
    activeMilestone,
    dismissMilestone,
  } from '../../../store/plg.store';
  import { openUpgradeModal } from '../../../store/upgrade-modal.store';
  import { goto } from '$app/navigation';

  // Confetti particles
  let particles = [];
  
  $: if ($activeMilestone) {
    createConfetti();
  }

  function createConfetti() {
    particles = [];
    const colors = ['#ff6b6b', '#ffc480', '#10b981', '#6366f1', '#f59e0b'];
    
    for (let i = 0; i < 40; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      });
    }
    particles = particles;
  }

  function handleCTA() {
    const milestone = $activeMilestone;
    if (!milestone?.cta) {
      dismissMilestone();
      return;
    }

    const action = milestone.cta.action;
    
    switch (action) {
      case 'upgrade':
      case 'pricing':
        dismissMilestone();
        openUpgradeModal('milestone');
        break;
      case 'templates':
        dismissMilestone();
        goto('/dashboard/template');
        break;
      case 'share':
        dismissMilestone();
        break;
      case 'continue':
      default:
        dismissMilestone();
    }
  }

  function getMilestoneEmoji(type) {
    const emojis = {
      celebration: '🎉',
      soft_upsell: '⭐',
      urgent_upsell: '🚀',
      limit_reached: '🎯',
    };
    return emojis[type] || '🎉';
  }

  function getHeaderBg(type) {
    switch (type) {
      case 'celebration':
        return 'bg-[#10b981]';
      case 'soft_upsell':
        return 'bg-[#ffc480]';
      case 'urgent_upsell':
        return 'bg-[#ff6b6b]';
      case 'limit_reached':
        return 'bg-[#ff6b6b]';
      default:
        return 'bg-[#ffc480]';
    }
  }

  function getButtonBg(type) {
    switch (type) {
      case 'celebration':
        return 'bg-[#10b981] hover:bg-[#059669]';
      case 'soft_upsell':
      case 'urgent_upsell':
      case 'limit_reached':
        return 'bg-[#ffc480] hover:bg-[#ffb347]';
      default:
        return 'bg-[#ffc480] hover:bg-[#ffb347]';
    }
  }
</script>

{#if $activeMilestone}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    transition:fade={{ duration: 200 }}
    on:click={dismissMilestone}
    on:keydown={(e) => e.key === 'Escape' && dismissMilestone()}
  >
    <!-- Confetti -->
    {#if $activeMilestone.type === 'celebration'}
      <div class="fixed inset-0 pointer-events-none overflow-hidden">
        {#each particles as particle (particle.id)}
          <div
            class="absolute w-2 h-2 rounded-full"
            style="
              left: {particle.x}%;
              background-color: {particle.color};
              width: {particle.size}px;
              height: {particle.size}px;
              animation: confetti-fall 3s ease-out {particle.delay}s forwards;
              transform: rotate({particle.rotation}deg);
            "
          />
        {/each}
      </div>
    {/if}

    <!-- Modal -->
    <div 
      class="relative bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] max-w-md w-full overflow-hidden"
      transition:scale={{ duration: 400, easing: elasticOut, start: 0.8 }}
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="{getHeaderBg($activeMilestone.type)} py-8 relative overflow-hidden">
        <!-- Decorative circles -->
        <div class="absolute -top-6 -right-6 w-24 h-24 bg-white/20 rounded-full" />
        <div class="absolute -bottom-4 -left-4 w-20 h-20 bg-white/20 rounded-full" />
        
        <!-- Large emoji -->
        <div class="relative flex items-center justify-center">
          <span 
            class="text-6xl drop-shadow-lg"
            in:fly={{ y: -30, duration: 500, delay: 200, easing: quintOut }}
          >
            {getMilestoneEmoji($activeMilestone.type)}
          </span>
        </div>

        <!-- Close button -->
        <button
          class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/50 text-gray-900 transition-colors border border-gray-900/20"
          on:click={dismissMilestone}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 text-center">
        <h2 
          class="text-2xl font-bold text-gray-900 mb-2"
          in:fly={{ y: 20, duration: 400, delay: 300 }}
        >
          {$activeMilestone.title}
        </h2>
        
        <p 
          class="text-gray-600 mb-6 font-medium"
          in:fly={{ y: 20, duration: 400, delay: 400 }}
        >
          {$activeMilestone.message}
        </p>

        <!-- Time saved badge -->
        {#if $activeMilestone.timeSaved}
          <div 
            class="inline-flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 text-[#059669] rounded-full text-sm font-bold mb-6 border border-[#10b981]/30"
            in:fly={{ y: 20, duration: 400, delay: 450 }}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ~{$activeMilestone.timeSaved} saved
          </div>
        {/if}

        <!-- Discount badge -->
        {#if $activeMilestone.cta?.discount}
          <div 
            class="inline-flex items-center gap-2 px-4 py-2 bg-[#ffc480]/30 text-gray-900 rounded-full text-sm font-bold mb-6 border-2 border-gray-900"
            in:scale={{ duration: 400, delay: 500, start: 0.8 }}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            {$activeMilestone.cta.discount}% OFF - Limited Time!
          </div>
        {/if}

        <!-- CTA Button -->
        {#if $activeMilestone.cta}
          <div 
            class="space-y-3"
            in:fly={{ y: 20, duration: 400, delay: 500 }}
          >
            <button
              class="w-full py-3 px-6 {getButtonBg($activeMilestone.type)} text-gray-900 font-bold rounded-full border-2 border-gray-900 hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 transition-all"
              on:click={handleCTA}
            >
              {$activeMilestone.cta.text}
            </button>
            
            {#if $activeMilestone.type !== 'celebration'}
              <button
                class="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                on:click={dismissMilestone}
              >
                Maybe later
              </button>
            {/if}
          </div>
        {:else}
          <button
            class="w-full py-3 px-6 bg-gray-900 text-white font-bold rounded-full border-2 border-gray-900 hover:bg-gray-800 transition-colors"
            on:click={dismissMilestone}
          >
            Continue Creating
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes confetti-fall {
    0% {
      transform: translateY(-100vh) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
</style>
