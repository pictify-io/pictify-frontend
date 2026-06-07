<script>
	import { createEventDispatcher } from 'svelte';

	export let templates = [];
	export let selectedId = null;

	const dispatch = createEventDispatcher();

	function selectTemplate(tmpl) {
		selectedId = tmpl.id;
		dispatch('select', tmpl);
	}
</script>

{#if templates.length > 1}
	<div class="mb-4">
		<div class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
			Choose a design
		</div>
		<div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
			{#each templates as tmpl}
				<button
					on:click={() => selectTemplate(tmpl)}
					class="flex-shrink-0 border-2 rounded-lg overflow-hidden transition-all
						{selectedId === tmpl.id
						? 'border-gray-900 shadow-[3px_3px_0_0_#4ade80] scale-105'
						: 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'}"
				>
					{#if tmpl.thumbnail}
						<img src={tmpl.thumbnail} alt={tmpl.name} class="w-28 h-20 object-cover" />
					{:else}
						<div
							class="w-28 h-20 flex flex-col items-center justify-center gap-1 px-2"
							style="background-color: {tmpl.accentColor || '#f3f4f6'}"
						>
							<span class="text-[10px] font-black text-gray-700 text-center leading-tight">
								{tmpl.name}
							</span>
							<span class="text-[8px] text-gray-400">{tmpl.width}x{tmpl.height}</span>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}
