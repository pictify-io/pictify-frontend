<script>
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import {
    activeUpgradePrompt,
    dismissUpgradePrompt,
    handleUpgradeClick,
    plgStatus,
  } from '../../../store/plg.store';

  $: prompt = $activeUpgradePrompt;
  $: plan = $plgStatus.plan;
  $: usage = $plgStatus.usage;
  $: timeSaved = $plgStatus.timeSaved;

  function getTypeStyles(type) {
    switch (type) {
      case 'feature_limit':
        return {
          headerBg: 'bg-[#ffc480]',
          icon: '🔒',
        };
      case 'threshold':
        if (prompt?.percentage >= 95) {
          return {
            headerBg: 'bg-[#ff6b6b]',
            icon: '🚨',
          };
        } else if (prompt?.percentage >= 80) {
          return {
            headerBg: 'bg-[#ffc480]',
            icon: '⚠️',
          };
        }
        return {
          headerBg: 'bg-[#ffc480]',
          icon: '📊',
        };
      default:
        return {
          headerBg: 'bg-[#ffc480]',
          icon: '✨',
        };
    }
  }

  $: styles = prompt ? getTypeStyles(prompt.type) : {};

  function handleCTAClick() {
    handleUpgradeClick(prompt, prompt?.cta?.discount);
  }

  // Feature comparison for upgrade prompts
  const planFeatures = {
    starter: {
      renders: 50,
      aiCopilot: 3,
      templates: 10,
    },
    basic: {
      renders: 1500,
      aiCopilot: 50,
      templates: 50,
    },
    professional: {
      renders: 7500,
      aiCopilot: 200,
      templates: 200,
    },
  };

  $: currentFeatures = planFeatures[plan] || planFeatures.starter;
  $: nextPlan = plan === 'starter' ? 'basic' : plan === 'basic' ? 'professional' : 'business';
  $: nextFeatures = planFeatures[nextPlan] || { renders: 'Unlimited', aiCopilot: 'Unlimited', templates: 'Unlimited' };
</script>

{#if prompt}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    transition:fade={{ duration: 150 }}
    on:click={dismissUpgradePrompt}
    on:keydown={(e) => e.key === 'Escape' && dismissUpgradePrompt()}
  >
    <!-- Modal -->
    <div 
      class="relative bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] max-w-lg w-full overflow-hidden"
      transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="{styles.headerBg} p-6 relative overflow-hidden">
        <!-- Decorative elements -->
        <div class="absolute -top-6 -right-6 w-24 h-24 bg-white/20 rounded-full" />
        <div class="absolute -bottom-4 -left-4 w-20 h-20 bg-white/20 rounded-full" />
        
        <div class="relative">
          <span class="text-4xl mb-2 block">{styles.icon}</span>
          <h2 class="text-xl font-bold text-gray-900">{prompt.title}</h2>
          <p class="text-gray-800/80 text-sm mt-1 font-medium">{prompt.message}</p>
        </div>

        <!-- Close button -->
        <button
          class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/50 text-gray-900 transition-colors border border-gray-900/20"
          on:click={dismissUpgradePrompt}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Current vs Upgrade comparison -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <!-- Current plan -->
          <div class="p-4 bg-white rounded-xl border-2 border-gray-200">
            <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Current</p>
            <p class="text-lg font-bold text-gray-900 capitalize mb-3">{plan}</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Renders</span>
                <span class="font-bold">{currentFeatures.renders}/mo</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">AI Copilot</span>
                <span class="font-bold">{currentFeatures.aiCopilot}/mo</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Templates</span>
                <span class="font-bold">{currentFeatures.templates}</span>
              </div>
            </div>
          </div>

          <!-- Next plan -->
          <div class="p-4 bg-[#ffc480]/20 rounded-xl border-2 border-gray-900 relative">
            {#if prompt?.cta?.discount}
              <div class="absolute -top-2 -right-2 px-2 py-0.5 bg-[#ff6b6b] text-white text-xs font-bold rounded-full border border-gray-900">
                {prompt.cta.discount}% OFF
              </div>
            {/if}
            <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Upgrade to</p>
            <p class="text-lg font-bold text-gray-900 capitalize mb-3">{nextPlan}</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Renders</span>
                <span class="font-bold text-[#10b981]">{typeof nextFeatures.renders === 'number' ? `${nextFeatures.renders}/mo` : nextFeatures.renders}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">AI Copilot</span>
                <span class="font-bold text-[#10b981]">{typeof nextFeatures.aiCopilot === 'number' ? `${nextFeatures.aiCopilot}/mo` : nextFeatures.aiCopilot}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Templates</span>
                <span class="font-bold text-[#10b981]">{typeof nextFeatures.templates === 'number' ? nextFeatures.templates : nextFeatures.templates}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Time saved stat -->
        {#if timeSaved && timeSaved.value > 0}
          <div class="flex items-center gap-3 p-3 bg-[#10b981]/10 rounded-xl mb-6 border border-[#10b981]/30">
            <div class="w-10 h-10 bg-[#10b981]/20 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-[#059669]">You've saved ~{timeSaved.display}</p>
              <p class="text-xs text-[#10b981]">With more renders, imagine what you could accomplish!</p>
            </div>
          </div>
        {/if}

        <!-- CTA Buttons -->
        <div class="space-y-3">
          <button
            class="w-full py-3 px-6 bg-[#ffc480] text-gray-900 font-bold rounded-full border-2 border-gray-900 hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 transition-all"
            on:click={handleCTAClick}
          >
            {prompt.cta?.text || 'Upgrade Now'}
          </button>
          
          <button
            class="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            on:click={dismissUpgradePrompt}
          >
            Not right now
          </button>
        </div>

        <!-- Trust signals -->
        <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-6 text-xs text-gray-500 font-medium">
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Cancel anytime
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Secure payment
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}
