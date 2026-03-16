<script>
	import { useCaseDetails } from '$lib/pseo/config.js';

	export let tools = [];
</script>

{#if tools.length > 0}
	<section class="py-16 px-4 border-t-[3px] border-gray-900 bg-[#FFFDF8]">
		<div class="max-w-5xl mx-auto">
			<h3 class="text-2xl font-black uppercase tracking-widest text-gray-400 mb-8">
				More Tools You'll Love
			</h3>
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each tools as toolId}
					{#if useCaseDetails[toolId]}
						<a
							href="/tools/{toolId}"
							class="p-5 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all block rounded-xl"
						>
							<h4 class="font-black text-gray-900 mb-1">{useCaseDetails[toolId].label}</h4>
							<p class="text-xs text-gray-500 line-clamp-2">{useCaseDetails[toolId].description}</p>
						</a>
					{/if}
				{/each}
			</div>
			<div class="mt-6 text-center">
				<a href="/tools" class="text-sm font-bold text-gray-500 hover:text-gray-900 underline">
					View all tools →
				</a>
			</div>
		</div>
	</section>
{/if}
