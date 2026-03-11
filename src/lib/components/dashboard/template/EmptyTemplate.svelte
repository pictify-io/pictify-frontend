<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const openTemplateCreator = () => {
		dispatch('create');
	};
</script>

<div class="m-auto max-w-6xl h-full flex justify-center">
	<div class="text-center mt-20">
		<div class="mb-6 inline-flex">
			<div
				class="w-24 h-24 bg-[#ffc480]/30 rounded-2xl border-[3px] border-gray-900 flex items-center justify-center shadow-[6px_6px_0_0_#1f293780]"
			>
				<svg class="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			</div>
		</div>
		<div class="mb-3 text-2xl font-bold text-gray-900">No Templates Yet</div>
		<div class="mb-6 text-gray-600">
			Create your first template to get started with automated image generation
		</div>
		<div>
			<button
				class="bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-bold py-3 px-6 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780] hover:shadow-[2px_2px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
				on:click={openTemplateCreator}
			>
				<div class="flex justify-between items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					<span>Create Template</span>
				</div>
			</button>
		</div>
	</div>
</div>
