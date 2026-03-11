<script>
	const stats = [
		{ value: '10M+', label: 'Images Rendered' },
		{ value: '<200ms', label: 'Avg Latency' },
		{ value: '99.9%', label: 'Uptime' },
		{ value: '50+', label: 'Expression Functions' }
	];
</script>

<section class="w-full py-10 bg-[#FFFDF8] relative">
	<div class="max-w-6xl mx-auto px-6">
		<!-- Stat Pills Row -->
		<div class="flex flex-wrap justify-center gap-4 mb-6">
			{#each stats as stat}
				<div
					class="flex items-center gap-3 px-5 py-3 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 transition-transform"
				>
					<span class="font-black text-2xl text-gray-900">{stat.value}</span>
					<span class="text-sm font-bold text-gray-500 uppercase">{stat.label}</span>
				</div>
			{/each}
		</div>

		<!-- Badges Row -->
		<div class="flex flex-wrap justify-center gap-3">
			<div class="flex items-center gap-2 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg">
				<svg class="w-4 h-4 text-[#4ade80]" fill="currentColor" viewBox="0 0 20 20"
					><path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/></svg
				>
				<span class="text-xs font-bold text-gray-500 uppercase tracking-wider"
					>Featured on Peerlist</span
				>
			</div>
			<div class="flex items-center gap-2 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg">
				<svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
					/></svg
				>
				<span class="text-xs font-bold text-gray-500 uppercase tracking-wider">REST API</span>
			</div>
			<div class="flex items-center gap-2 px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg">
				<svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
					/></svg
				>
				<span class="text-xs font-bold text-gray-500 uppercase tracking-wider">SOC 2 Ready</span>
			</div>
		</div>
	</div>
</section>
