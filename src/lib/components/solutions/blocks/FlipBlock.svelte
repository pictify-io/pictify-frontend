<script>
	export let heading;
	export let headingAccent = '';
	export let body;
	export let bullets = [];
</script>

<section class="max-w-4xl mx-auto mb-16">
	<div
		class="bg-gray-900 text-white border-[3px] border-gray-900 rounded-2xl shadow-brutal-accent p-8 md:p-10"
	>
		<h2 class="text-2xl md:text-3xl font-black mb-4">
			{heading}{#if headingAccent} <span class="text-data-green">{headingAccent}</span>{/if}
		</h2>
		<p class="text-gray-300 font-medium leading-relaxed mb-6">
			{body}
		</p>
		{#if bullets.length > 0}
			<ul class="grid sm:grid-cols-2 gap-3 text-sm font-bold">
				{#each bullets as bullet}
					<li class="bg-white/10 rounded-lg px-4 py-3">✓ {bullet}</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
