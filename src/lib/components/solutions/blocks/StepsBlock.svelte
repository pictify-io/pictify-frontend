<script>
	export let heading;
	export let steps = [];
</script>

<section class="max-w-5xl mx-auto mb-16">
	<h2 class="text-2xl md:text-3xl font-black text-gray-900 mb-8 text-center">
		{heading}
	</h2>
	<div class="grid md:grid-cols-3 gap-5">
		{#each steps as step, i}
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-brutal-lg p-6">
				<div
					class="w-10 h-10 flex items-center justify-center bg-brand-accent border-[3px] border-gray-900 rounded-lg font-black text-lg mb-4"
				>
					{i + 1}
				</div>
				<h3 class="font-black text-gray-900 mb-2">{step.name}</h3>
				<p class="text-sm text-gray-700 leading-relaxed">{step.text}</p>
			</div>
		{/each}
	</div>
</section>
