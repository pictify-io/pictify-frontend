<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const openTemplateCreator = () => {
		dispatch('create');
	};
</script>

<div class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-[3px] border-gray-900 border-dashed shadow-sm">
	<div
		class="w-24 h-24 bg-brand-accent/30 rounded-2xl border-[3px] border-gray-900 flex items-center justify-center mb-6 shadow-brutal-lg -rotate-3 hover:rotate-0 transition-transform duration-300"
	>
		<svg class="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
			/>
		</svg>
	</div>
	<h2 class="text-2xl font-black text-gray-900 uppercase tracking-wide mb-2">
		No templates yet
	</h2>
	<p class="text-gray-500 font-bold max-w-sm text-center text-sm mb-8">
		Templates are reusable designs you render into images, GIFs, or PDFs via the API or dashboard.
	</p>
	<button
		class="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-gray-900 font-black text-xs uppercase tracking-wider rounded-lg border-[3px] border-gray-900 shadow-brutal-md hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
		on:click={openTemplateCreator}
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
		</svg>
		Create your first template
		<svg
			class="w-4 h-4 group-hover:translate-x-1 transition-transform"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			><path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="3"
				d="M14 5l7 7m0 0l-7 7m7-7H3"
			/></svg
		>
	</button>
</div>
