<script>
  import { overageWarningModal, confirmOverageRender, dismissOverageWarning } from '../../../store/plg.store.js';
  import { goto } from '$app/navigation';

  $: show = $overageWarningModal.show;
  $: overageCost = $overageWarningModal.overageCost;
  $: currentCycleCost = $overageWarningModal.currentCycleCost;
  $: remainingBudget = $overageWarningModal.remainingBudget;
  $: rateFormatted = $overageWarningModal.rateFormatted;

  $: overageCostFormatted = overageCost ? `$${(overageCost / 100).toFixed(3)}` : '$0.00';
  $: currentCycleCostFormatted = `$${(currentCycleCost / 100).toFixed(2)}`;
  $: remainingBudgetFormatted = remainingBudget !== null ? `$${(remainingBudget / 100).toFixed(2)}` : null;

  function handleConfirm() {
    confirmOverageRender();
  }

  function handleCancel() {
    dismissOverageWarning();
  }

  function handleUpgrade() {
    dismissOverageWarning();
    goto('/dashboard/upgrade');
  }
</script>

{#if show}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click={handleCancel}
    on:keydown={(e) => e.key === 'Escape' && handleCancel()}
    role="presentation"
  >
    <!-- Modal -->
    <div
      class="bg-[#FFFDF8] border-3 border-gray-900 rounded-xl shadow-brutal-2xl max-w-md w-full overflow-hidden"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
      aria-labelledby="overage-warning-title"
    >
      <!-- Header -->
      <div class="p-6 border-b-3 border-gray-900 bg-[#ff6b6b]/10">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-[#ffc480] border-2 border-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-brutal-sm">
            <svg class="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 id="overage-warning-title" class="text-xl font-black text-gray-900">
              Overage Render
            </h2>
            <p class="text-sm font-medium text-gray-600 mt-1">
              You've reached your monthly limit
            </p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4">
        <p class="text-gray-700 font-medium">
          This render will be billed as an overage at <span class="font-black text-gray-900">{rateFormatted || overageCostFormatted}</span> per render.
        </p>

        <!-- Current cycle summary -->
        <div class="bg-white border-2 border-gray-200 rounded-lg p-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 font-medium">This billing cycle:</span>
            <span class="font-bold text-gray-900">{currentCycleCostFormatted}</span>
          </div>
          {#if remainingBudgetFormatted !== null}
            <div class="flex justify-between text-sm mt-1">
              <span class="text-gray-600 font-medium">Remaining budget:</span>
              <span class="font-bold text-gray-900">{remainingBudgetFormatted}</span>
            </div>
          {/if}
        </div>

        <!-- Cost breakdown -->
        <div class="flex items-center justify-between p-3 bg-[#ffc480]/20 border-2 border-[#ffc480] rounded-lg">
          <span class="text-gray-700 font-medium">This render will cost:</span>
          <span class="text-lg font-black text-gray-900">{overageCostFormatted}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 pt-0 flex flex-col gap-2">
        <button
          on:click={handleConfirm}
          class="w-full px-4 py-3 bg-gray-900 text-white font-black text-sm uppercase tracking-wider
                 border-3 border-gray-900 rounded-xl shadow-brutal-lg
                 hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px]
                 active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
                 transition-all duration-100"
        >
          Continue ({overageCostFormatted})
        </button>

        <button
          on:click={handleUpgrade}
          class="w-full px-4 py-2.5 bg-[#ffc480] text-gray-900 font-bold text-sm
                 border-2 border-gray-900 rounded-xl
                 hover:bg-[#ffb560] transition-colors"
        >
          Upgrade Plan (Save 40%+)
        </button>

        <button
          on:click={handleCancel}
          class="w-full px-4 py-2 text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}
