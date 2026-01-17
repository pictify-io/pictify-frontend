<script>
	import { createEventDispatcher } from 'svelte';
	import { formatTtl } from '$lib/utils/format';

	export let refreshPolicy = { ttlSeconds: 300, onError: 'serve_stale' };
	export let outputConfig = { format: 'png', quality: 90 };

	const dispatch = createEventDispatcher();

	const ttlPresets = [
		{ label: '1 min', value: 60 },
		{ label: '5 min', value: 300 },
		{ label: '15 min', value: 900 },
		{ label: '1 hour', value: 3600 },
		{ label: '6 hours', value: 21600 },
		{ label: '24 hours', value: 86400 }
	];

	const handleRefreshChange = (updates) => {
		dispatch('refreshChange', { ...refreshPolicy, ...updates });
	};

	const handleOutputChange = (updates) => {
		dispatch('outputChange', { ...outputConfig, ...updates });
	};

	const handleBack = () => {
		dispatch('back');
	};

	const handleNext = () => {
		dispatch('next');
	};
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
			</svg>
			Refresh Strategy
		</h2>
	</div>

	<p class="text-sm text-gray-500 font-medium">
		Configure how often the dynamic asset refreshes and how to handle errors
	</p>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- TTL Configuration -->
		<div class="space-y-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
			<h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Cache Duration (TTL)</h3>
			<p class="text-xs text-gray-500">How long before the asset refreshes from the data source</p>

			<!-- Presets -->
			<div class="flex flex-wrap gap-2">
				{#each ttlPresets as preset}
					<button
						class="px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg border-2 transition-all
							{refreshPolicy.ttlSeconds === preset.value
								? 'bg-[#a855f7] text-white border-[#a855f7]'
								: 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}"
						on:click={() => handleRefreshChange({ ttlSeconds: preset.value })}
					>
						{preset.label}
					</button>
				{/each}
			</div>

			<!-- Custom Input -->
			<div>
				<label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Custom (seconds)</label>
				<div class="flex items-center gap-2">
					<input
						type="number"
						min="30"
						max="604800"
						class="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-[#a855f7] transition-colors"
						value={refreshPolicy.ttlSeconds}
						on:input={(e) => handleRefreshChange({ ttlSeconds: parseInt(e.target.value) || 300 })}
					/>
					<span class="text-sm text-gray-500 font-medium">= {formatTtl(refreshPolicy.ttlSeconds)}</span>
				</div>
			</div>
		</div>

		<!-- Error Policy -->
		<div class="space-y-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
			<h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">On Fetch Error</h3>
			<p class="text-xs text-gray-500">What to do if data fetching fails</p>

			<div class="space-y-2">
				<label class="flex items-start gap-3 p-3 bg-white border-2 rounded-lg cursor-pointer transition-all
					{refreshPolicy.onError === 'serve_stale' ? 'border-[#a855f7] ring-2 ring-purple-100' : 'border-gray-200 hover:border-gray-300'}">
					<input
						type="radio"
						name="errorPolicy"
						value="serve_stale"
						checked={refreshPolicy.onError === 'serve_stale'}
						on:change={() => handleRefreshChange({ onError: 'serve_stale' })}
						class="mt-0.5 accent-[#a855f7]"
					/>
					<div>
						<p class="font-bold text-gray-900 text-sm">Serve Stale (Recommended)</p>
						<p class="text-xs text-gray-500">Show last successful render if fetch fails</p>
					</div>
				</label>

				<label class="flex items-start gap-3 p-3 bg-white border-2 rounded-lg cursor-pointer transition-all
					{refreshPolicy.onError === 'serve_default' ? 'border-[#a855f7] ring-2 ring-purple-100' : 'border-gray-200 hover:border-gray-300'}">
					<input
						type="radio"
						name="errorPolicy"
						value="serve_default"
						checked={refreshPolicy.onError === 'serve_default'}
						on:change={() => handleRefreshChange({ onError: 'serve_default' })}
						class="mt-0.5 accent-[#a855f7]"
					/>
					<div>
						<p class="font-bold text-gray-900 text-sm">Serve Default</p>
						<p class="text-xs text-gray-500">Show template with default values</p>
					</div>
				</label>

				<label class="flex items-start gap-3 p-3 bg-white border-2 rounded-lg cursor-pointer transition-all
					{refreshPolicy.onError === 'error' ? 'border-[#a855f7] ring-2 ring-purple-100' : 'border-gray-200 hover:border-gray-300'}">
					<input
						type="radio"
						name="errorPolicy"
						value="error"
						checked={refreshPolicy.onError === 'error'}
						on:change={() => handleRefreshChange({ onError: 'error' })}
						class="mt-0.5 accent-[#a855f7]"
					/>
					<div>
						<p class="font-bold text-gray-900 text-sm">Return Error</p>
						<p class="text-xs text-gray-500">Return HTTP 500 error</p>
					</div>
				</label>
			</div>
		</div>
	</div>

	<!-- Output Configuration -->
	<div class="space-y-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
		<h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Output Format</h3>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Format</label>
				<select
					class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#a855f7] transition-colors bg-white"
					value={outputConfig.format}
					on:change={(e) => handleOutputChange({ format: e.target.value })}
				>
					<option value="png">PNG</option>
					<option value="jpeg">JPEG</option>
					<option value="webp">WebP</option>
					<option value="pdf">PDF</option>
				</select>
			</div>
			<div>
				<label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Quality ({outputConfig.quality}%)</label>
				<input
					type="range"
					min="50"
					max="100"
					step="5"
					class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#a855f7]"
					value={outputConfig.quality}
					on:input={(e) => handleOutputChange({ quality: parseInt(e.target.value) })}
				/>
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex justify-between gap-3 pt-4 border-t-2 border-gray-200">
		<button
			class="px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm uppercase tracking-wide rounded-xl border-2 border-gray-300 transition-all"
			on:click={handleBack}
		>
			Back
		</button>
		<button
			class="px-6 py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold text-sm uppercase tracking-wide rounded-xl border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
			on:click={handleNext}
		>
			Next: Publish
		</button>
	</div>
</div>
