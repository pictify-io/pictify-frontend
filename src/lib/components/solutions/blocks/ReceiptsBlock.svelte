<script>
	export let heading;
	export let subheading = '';
	export let items = [];
</script>

<section class="max-w-5xl mx-auto mb-16">
	<h2 class="text-2xl md:text-3xl font-black text-gray-900 mb-2 text-center">
		{heading}
	</h2>
	{#if subheading}
		<p class="text-gray-600 font-medium text-center max-w-2xl mx-auto mb-8">
			{subheading}
		</p>
	{/if}
	<div class="grid md:grid-cols-2 gap-5">
		{#each items as r}
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-brutal-lg p-5">
				<div class="flex items-center justify-between gap-3 mb-2">
					<h3 class="font-black text-gray-900">{r.tool}</h3>
					<span
						class="shrink-0 bg-brand-danger text-white text-xs font-black uppercase tracking-wide px-2 py-1 rounded-md border-2 border-gray-900"
						>{r.wall}</span
					>
				</div>
				<p class="text-sm text-gray-700 leading-relaxed">{r.detail}</p>
			</div>
		{/each}
	</div>
</section>
