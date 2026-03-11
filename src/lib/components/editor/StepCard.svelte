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

	$: statusColor =
		{
			pending: 'bg-yellow-50',
			executing: 'bg-[#ff6b6b]/10',
			validated: 'bg-green-50',
			approved: 'bg-green-100',
			rejected: 'bg-red-50',
			needs_correction: 'bg-orange-50',
			self_corrected: 'bg-purple-50'
		}[step.status] || 'bg-gray-50';

	$: statusIcon =
		{
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
	class="step-card border-[3px] border-gray-900 rounded-lg p-4 mb-3 transition-all shadow-[4px_4px_0_0_#1f2937] {statusColor}"
	class:ring-2={isActive}
	class:ring-[#ff6b6b]={isActive}
	transition:fly={{ y: 20, duration: 300 }}
>
	<!-- Header -->
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			<span class="text-lg font-black text-gray-900 uppercase tracking-wide"
				>Step {stepIndex + 1}</span
			>
			<span class="text-2xl">{statusIcon}</span>
			<span
				class="text-xs font-bold uppercase px-2 py-1 rounded bg-white border-2 border-gray-900 shadow-[2px_2px_0_0_#000]"
			>
				{step.status}
			</span>
		</div>
	</div>

	<!-- Description & Reasoning -->
	<div class="mb-3">
		<p class="text-sm font-bold text-gray-900 mb-1">
			💭 {step.description || step.reasoning}
		</p>
		{#if step.reasoning && step.description !== step.reasoning}
			<p class="text-xs text-gray-700 italic font-medium">
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
				class="w-full rounded-lg border-2 border-gray-900 bg-white object-contain max-h-48 shadow-[2px_2px_0_0_#1f2937]"
			/>
		</div>
	{/if}

	<!-- Tool Info -->
	<details class="mb-3">
		<summary
			class="text-xs font-bold text-gray-700 cursor-pointer hover:text-black uppercase tracking-wider"
		>
			🛠️ Tool: <code class="bg-white border border-gray-900 px-1 py-0.5 rounded">{step.tool}</code>
		</summary>
		<pre
			class="text-xs bg-white border-2 border-gray-900 p-2 rounded-lg mt-2 overflow-auto max-h-32 shadow-[2px_2px_0_0_#1f2937]">{JSON.stringify(
				step.args || {},
				null,
				2
			)}</pre>
	</details>

	{#if hasDiffSummary}
		<div
			class="diff-summary border-2 border-gray-900 rounded-lg p-3 mb-3 bg-white shadow-[2px_2px_0_0_#1f2937]"
		>
			<p class="text-xs font-black text-gray-900 mb-2 uppercase">🔍 Canvas changes</p>
			{#if step.diffSummary.backgroundChanged}
				<p class="text-xs text-gray-700 mb-1 font-medium">• Background color updated</p>
			{/if}
			{#if step.diffSummary.added?.length}
				<p class="text-xs text-green-700 font-bold uppercase">Added</p>
				<ul class="text-xs text-gray-700 list-disc list-inside mb-1 font-medium">
					{#each step.diffSummary.added.slice(0, 3) as addedEl}
						<li>{summarizeElement(addedEl)}</li>
					{/each}
					{#if step.diffSummary.added.length > 3}
						<li>+{step.diffSummary.added.length - 3} more…</li>
					{/if}
				</ul>
			{/if}
			{#if step.diffSummary.removed?.length}
				<p class="text-xs text-red-700 font-bold uppercase mt-1">Removed</p>
				<ul class="text-xs text-gray-700 list-disc list-inside mb-1 font-medium">
					{#each step.diffSummary.removed.slice(0, 3) as removedEl}
						<li>{summarizeElement(removedEl)}</li>
					{/each}
					{#if step.diffSummary.removed.length > 3}
						<li>+{step.diffSummary.removed.length - 3} more…</li>
					{/if}
				</ul>
			{/if}
			{#if step.diffSummary.updated?.length}
				<p class="text-xs text-[#ff6b6b] font-bold uppercase mt-1">Updated</p>
				<ul class="text-xs text-gray-700 list-disc list-inside font-medium">
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
		<div class="validation-section border-t-2 border-gray-900 pt-3 mt-3" transition:fade>
			<div class="flex items-start gap-2 mb-2">
				<span class="text-lg">{step.validation.isValid ? '✅' : '⚠️'}</span>
				<div class="flex-1">
					<p class="text-xs font-black uppercase mb-1">
						{step.validation.isValid ? 'Validation Passed' : 'Issues Detected'}
					</p>
					<p class="text-xs text-gray-700 font-medium">
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
						class="w-full rounded-lg border-2 border-gray-900 max-h-40 object-contain bg-white shadow-[2px_2px_0_0_#1f2937]"
					/>
				</div>
			{/if}

			<!-- Issues -->
			{#if step.validation.issues && step.validation.issues.length > 0}
				<div
					class="mt-2 bg-red-50 border-2 border-gray-900 p-2 rounded-lg shadow-[2px_2px_0_0_#1f2937]"
				>
					<p class="text-xs font-black text-red-700 mb-1 uppercase">Issues:</p>
					<ul class="text-xs text-red-700 list-disc list-inside font-medium">
						{#each step.validation.issues as issue}
							<li>{issue}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Self-Corrections -->
			{#if step.validation.suggestions && step.validation.suggestions.length > 0}
				<div
					class="mt-2 bg-purple-50 border-2 border-gray-900 p-2 rounded-lg shadow-[2px_2px_0_0_#1f2937]"
				>
					<p class="text-xs font-black text-purple-700 mb-1 uppercase">
						🔧 Self-corrections applied:
					</p>
					{#each step.validation.suggestions as correction}
						<div class="text-xs text-purple-700 mb-1 font-medium">
							<code class="bg-white border border-purple-200 px-1 rounded">{correction.tool}</code>: {correction.reasoning}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Actions -->
	{#if step.status === 'pending' || step.status === 'validated'}
		<div class="flex gap-2 mt-3 pt-3 border-t-2 border-gray-900">
			<button
				on:click={() => onApprove(stepIndex)}
				class="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-gray-900 text-xs font-black uppercase tracking-wide py-2 px-3 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 transition-all"
			>
				✓ Approve
			</button>
			<button
				on:click={() => onReject(stepIndex)}
				class="flex-1 bg-[#f87171] hover:bg-[#ef4444] text-white text-xs font-black uppercase tracking-wide py-2 px-3 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 transition-all"
			>
				✗ Reject
			</button>
		</div>
	{/if}

	{#if step.status === 'rejected'}
		<div class="mt-3 pt-3 border-t-2 border-gray-900" transition:fade>
			<textarea
				bind:value={feedbackText}
				placeholder="Why did you reject this? (helps copilot improve)"
				class="w-full text-xs border-2 border-gray-900 rounded-lg p-2 mb-2 min-h-[60px] focus:shadow-[4px_4px_0_0_#ffc480] font-medium"
			/>
			<button
				on:click={() => onRegenerate(stepIndex, feedbackText)}
				class="w-full bg-[#ffc480] hover:bg-[#ffb040] text-gray-900 text-xs font-black uppercase tracking-wide py-2 px-3 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 transition-all"
			>
				↻ Regenerate with Feedback
			</button>
		</div>
	{/if}
</div>
