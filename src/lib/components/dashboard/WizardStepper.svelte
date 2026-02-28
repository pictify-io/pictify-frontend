<script>
	import { createEventDispatcher } from 'svelte';

	/** @type {Array<{ id: string, label: string }>} */
	export let steps = [];

	/** @type {string} */
	export let currentStep = '';

	const dispatch = createEventDispatcher();

	$: currentIndex = steps.findIndex(s => s.id === currentStep);

	function handleClick(step, index) {
		if (index < currentIndex) {
			dispatch('step', step.id);
		}
	}
</script>

<div class="flex items-center justify-between gap-3 mb-6">
	{#each steps as step, i}
		<button
			type="button"
			on:click={() => handleClick(step, i)}
			class="flex-1 flex flex-col items-start p-4 border-[3px] rounded-xl transition-all relative overflow-hidden group
				{i < currentIndex ? 'cursor-pointer bg-[#4ade80] border-gray-900 hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1' : ''}
				{i === currentIndex ? 'bg-[#ffc480] border-gray-900 shadow-[4px_4px_0_0_#1f2937]' : ''}
				{i > currentIndex ? 'cursor-default opacity-60 bg-white border-gray-300' : ''}"
		>
			<div class="flex items-center justify-between w-full relative z-10">
				<span class="text-[10px] font-black uppercase tracking-widest
					{i === currentIndex ? 'text-gray-900' : i < currentIndex ? 'text-green-950' : 'text-gray-400'}">
					Step {i + 1}
				</span>
				{#if i < currentIndex}
					<div class="w-5 h-5 rounded-full bg-green-900/20 flex items-center justify-center">
						<svg class="w-3 h-3 text-green-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
						</svg>
					</div>
				{/if}
			</div>
			<span class="text-sm sm:text-base font-black uppercase tracking-tight mt-1 relative z-10
				{i === currentIndex ? 'text-gray-900' : i < currentIndex ? 'text-green-950' : 'text-gray-400'}">
				{step.label}
			</span>
		</button>
	{/each}
</div>
