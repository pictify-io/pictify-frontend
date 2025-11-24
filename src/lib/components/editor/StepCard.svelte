<script>
/**
 * Step Card Component
 * 
 * Displays a single execution step with validation results
 */
import { fade, fly } from 'svelte/transition';

export let step;
export let stepIndex;
export let isActive = false;
export let onApprove = () => {};
export let onReject = () => {};
export let onRegenerate = () => {};

let feedbackText = '';

$: statusColor = {
  pending: 'bg-yellow-50 border-yellow-200',
  executing: 'bg-blue-50 border-blue-200',
  validated: 'bg-green-50 border-green-200',
  approved: 'bg-green-50 border-green-200',
  rejected: 'bg-red-50 border-red-200',
  needs_correction: 'bg-orange-50 border-orange-200',
  self_corrected: 'bg-purple-50 border-purple-200'
}[step.status] || 'bg-gray-50 border-gray-200';

$: statusIcon = {
  pending: '⏳',
  executing: '⚙️',
  validated: '✅',
  approved: '✅',
  rejected: '❌',
  needs_correction: '⚠️',
  self_corrected: '🔧'
}[step.status] || '❓';

$: hasDiffSummary = Boolean(
  step?.diffSummary &&
  ((step.diffSummary.added && step.diffSummary.added.length) ||
    (step.diffSummary.removed && step.diffSummary.removed.length) ||
    (step.diffSummary.updated && step.diffSummary.updated.length) ||
    step.diffSummary.backgroundChanged)
);

const summarizeElement = (element = {}) => {
  if (!element) return 'element';
  if (element.text) {
    const text = element.text.length > 24 ? `${element.text.slice(0, 24)}…` : element.text;
    return `${element.type || 'element'} "${text}"`;
  }
  return element.type || element.id || 'element';
};
</script>

<div 
  class="step-card border-2 rounded-xl p-4 mb-3 transition-all {statusColor}"
  class:ring-2={isActive}
  class:ring-blue-400={isActive}
  transition:fly={{ y: 20, duration: 300 }}
>
  <!-- Header -->
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <span class="text-lg font-bold text-gray-700">Step {stepIndex + 1}</span>
      <span class="text-2xl">{statusIcon}</span>
      <span class="text-xs font-semibold px-2 py-1 rounded bg-white/50">
        {step.status}
      </span>
    </div>
  </div>

  <!-- Description & Reasoning -->
  <div class="mb-3">
    <p class="text-sm font-medium text-gray-800 mb-1">
      💭 {step.description || step.reasoning}
    </p>
    {#if step.reasoning && step.description !== step.reasoning}
      <p class="text-xs text-gray-600 italic">
        {step.reasoning}
      </p>
    {/if}
  </div>

  <!-- Preview -->
  {#if step.thumbnail}
    <div class="mb-3">
      <img
        src={step.thumbnail}
        alt="Preview for step {stepIndex + 1}"
        class="w-full rounded-lg border border-gray-200 bg-white object-contain max-h-48"
      />
    </div>
  {/if}

  <!-- Tool Info -->
  <details class="mb-3">
    <summary class="text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-800">
      🛠️ Tool: <code class="bg-white px-1 py-0.5 rounded">{step.tool}</code>
    </summary>
    <pre class="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-32">{JSON.stringify(step.args || {}, null, 2)}</pre>
  </details>

  {#if hasDiffSummary}
    <div class="diff-summary border rounded-lg p-3 mb-3 bg-white/60">
      <p class="text-xs font-semibold text-gray-700 mb-2">🔍 Canvas changes</p>
      {#if step.diffSummary.backgroundChanged}
        <p class="text-xs text-gray-600 mb-1">• Background color updated</p>
      {/if}
      {#if step.diffSummary.added?.length}
        <p class="text-xs text-green-700 font-semibold">Added</p>
        <ul class="text-xs text-gray-600 list-disc list-inside mb-1">
          {#each step.diffSummary.added.slice(0, 3) as addedEl}
            <li>{summarizeElement(addedEl)}</li>
          {/each}
          {#if step.diffSummary.added.length > 3}
            <li>+{step.diffSummary.added.length - 3} more…</li>
          {/if}
        </ul>
      {/if}
      {#if step.diffSummary.removed?.length}
        <p class="text-xs text-red-700 font-semibold mt-1">Removed</p>
        <ul class="text-xs text-gray-600 list-disc list-inside mb-1">
          {#each step.diffSummary.removed.slice(0, 3) as removedEl}
            <li>{summarizeElement(removedEl)}</li>
          {/each}
          {#if step.diffSummary.removed.length > 3}
            <li>+{step.diffSummary.removed.length - 3} more…</li>
          {/if}
        </ul>
      {/if}
      {#if step.diffSummary.updated?.length}
        <p class="text-xs text-blue-700 font-semibold mt-1">Updated</p>
        <ul class="text-xs text-gray-600 list-disc list-inside">
          {#each step.diffSummary.updated.slice(0, 3) as updatedEl}
            <li>
              {summarizeElement(updatedEl.after)} –
              {updatedEl.changes.length} change{updatedEl.changes.length > 1 ? 's' : ''}
            </li>
          {/each}
          {#if step.diffSummary.updated.length > 3}
            <li>+{step.diffSummary.updated.length - 3} more…</li>
          {/if}
        </ul>
      {/if}
    </div>
  {/if}

  <!-- Vision Validation Results -->
  {#if step.validation}
    <div class="validation-section border-t pt-3 mt-3" transition:fade>
      <div class="flex items-start gap-2 mb-2">
        <span class="text-lg">{step.validation.isValid ? '✅' : '⚠️'}</span>
        <div class="flex-1">
          <p class="text-xs font-semibold mb-1">
            {step.validation.isValid ? 'Validation Passed' : 'Issues Detected'}
          </p>
          <p class="text-xs text-gray-700">
            🤖 {step.validation.analysis}
          </p>
        </div>
      </div>

      <!-- Screenshot -->
      {#if step.validation.screenshot}
        <div class="mt-2">
          <img 
            src={step.validation.screenshot} 
            alt="Canvas after step {stepIndex + 1}"
            class="w-full rounded border border-gray-200 max-h-40 object-contain bg-white"
          />
        </div>
      {/if}

      <!-- Issues -->
      {#if step.validation.issues && step.validation.issues.length > 0}
        <div class="mt-2 bg-red-50 p-2 rounded">
          <p class="text-xs font-semibold text-red-700 mb-1">Issues:</p>
          <ul class="text-xs text-red-600 list-disc list-inside">
            {#each step.validation.issues as issue}
              <li>{issue}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Self-Corrections -->
      {#if step.validation.suggestions && step.validation.suggestions.length > 0}
        <div class="mt-2 bg-purple-50 p-2 rounded">
          <p class="text-xs font-semibold text-purple-700 mb-1">🔧 Self-corrections applied:</p>
          {#each step.validation.suggestions as correction}
            <div class="text-xs text-purple-600 mb-1">
              <code class="bg-white px-1 rounded">{correction.tool}</code>: {correction.reasoning}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Actions -->
  {#if step.status === 'pending' || step.status === 'validated'}
    <div class="flex gap-2 mt-3 pt-3 border-t">
      <button
        on:click={() => onApprove(stepIndex)}
        class="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
      >
        ✓ Approve
      </button>
      <button
        on:click={() => onReject(stepIndex)}
        class="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
      >
        ✗ Reject
      </button>
    </div>
  {/if}

  {#if step.status === 'rejected'}
    <div class="mt-3 pt-3 border-t" transition:fade>
      <textarea
        bind:value={feedbackText}
        placeholder="Why did you reject this? (helps copilot improve)"
        class="w-full text-xs border border-gray-300 rounded p-2 mb-2 min-h-[60px]"
      />
      <button
        on:click={() => onRegenerate(stepIndex, feedbackText)}
        class="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
      >
        ↻ Regenerate with Feedback
      </button>
    </div>
  {/if}
</div>

<style>
  .step-card {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .step-card.ring-2 {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
</style>
