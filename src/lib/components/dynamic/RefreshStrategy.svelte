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
	<!-- Header removed as it is now in parent -->

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- TTL Configuration -->
		<div class="space-y-6">
			<div class="flex items-center gap-2 pb-2 border-b-[3px] border-gray-900">
				<span class="w-3 h-3 bg-[#3b82f6] rounded-full border-2 border-black"></span>
				<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Cache Duration (TTL)</h3>
			</div>
			
			<div class="p-6 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937]">
				<p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Select Duration</p>

				<!-- Presets -->
				<div class="flex flex-wrap gap-3 mb-6">
					{#each ttlPresets as preset}
						<button
							class="px-3 py-2 text-xs font-black uppercase tracking-wide rounded-lg border-[3px] transition-all hover:-translate-y-0.5 active:translate-y-0
								{refreshPolicy.ttlSeconds === preset.value
									? 'bg-gray-900 text-white border-gray-900 shadow-[2px_2px_0_0_#9ca3af]'
									: 'bg-white text-gray-500 border-gray-200 hover:border-gray-900 hover:text-gray-900'}"
							on:click={() => handleRefreshChange({ ttlSeconds: preset.value })}
						>
							{preset.label}
						</button>
					{/each}
				</div>

				<!-- Custom Input -->
				<div>
					<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Custom Duration (seconds)</label>
					<div class="flex items-center gap-3">
						<input
							type="number"
							min="30"
							max="604800"
							class="flex-1 px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-black font-mono focus:outline-none focus:shadow-[4px_4px_0_0_#9ca3af] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all"
							value={refreshPolicy.ttlSeconds}
							on:input={(e) => handleRefreshChange({ ttlSeconds: parseInt(e.target.value) || 300 })}
						/>
						<div class="px-4 py-3 bg-gray-100 border-[3px] border-gray-200 rounded-lg">
							<span class="text-sm font-bold text-gray-600 font-mono">= {formatTtl(refreshPolicy.ttlSeconds)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Error Policy -->
		<div class="space-y-6">
			<div class="flex items-center gap-2 pb-2 border-b-[3px] border-gray-900">
				<span class="w-3 h-3 bg-red-400 rounded-full border-2 border-black"></span>
				<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Error Handling</h3>
			</div>

			<div class="space-y-3">
				<label class="flex items-center gap-4 p-4 bg-white border-[3px] rounded-xl cursor-pointer transition-all group
					{refreshPolicy.onError === 'serve_stale' ? 'border-gray-900 shadow-[4px_4px_0_0_#1f2937] bg-blue-50' : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'}">
					<div class="relative flex items-center justify-center">
						<input
							type="radio"
							name="errorPolicy"
							value="serve_stale"
							checked={refreshPolicy.onError === 'serve_stale'}
							on:change={() => handleRefreshChange({ onError: 'serve_stale' })}
							class="appearance-none w-6 h-6 border-[3px] border-gray-900 rounded-full checked:bg-gray-900 transition-colors cursor-pointer"
						/>
						<div class="absolute w-2 h-2 bg-white rounded-full pointer-events-none opacity-0 {refreshPolicy.onError === 'serve_stale' ? 'opacity-100' : ''}"></div>
					</div>
					<div>
						<p class="font-black text-gray-900 text-sm uppercase tracking-wide">Serve Stale Content</p>
						<p class="text-xs font-medium text-gray-500 mt-1">If refresh fails, show the last successful image (Recommended)</p>
					</div>
				</label>

				<label class="flex items-center gap-4 p-4 bg-white border-[3px] rounded-xl cursor-pointer transition-all group
					{refreshPolicy.onError === 'serve_default' ? 'border-gray-900 shadow-[4px_4px_0_0_#1f2937] bg-blue-50' : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'}">
					<div class="relative flex items-center justify-center">
						<input
							type="radio"
							name="errorPolicy"
							value="serve_default"
							checked={refreshPolicy.onError === 'serve_default'}
							on:change={() => handleRefreshChange({ onError: 'serve_default' })}
							class="appearance-none w-6 h-6 border-[3px] border-gray-900 rounded-full checked:bg-gray-900 transition-colors cursor-pointer"
						/>
						<div class="absolute w-2 h-2 bg-white rounded-full pointer-events-none opacity-0 {refreshPolicy.onError === 'serve_default' ? 'opacity-100' : ''}"></div>
					</div>
					<div>
						<p class="font-black text-gray-900 text-sm uppercase tracking-wide">Serve Default Template</p>
						<p class="text-xs font-medium text-gray-500 mt-1">Render with fallback/default values defined in mapping</p>
					</div>
				</label>

				<label class="flex items-center gap-4 p-4 bg-white border-[3px] rounded-xl cursor-pointer transition-all group
					{refreshPolicy.onError === 'error' ? 'border-gray-900 shadow-[4px_4px_0_0_#1f2937] bg-blue-50' : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'}">
					<div class="relative flex items-center justify-center">
						<input
							type="radio"
							name="errorPolicy"
							value="error"
							checked={refreshPolicy.onError === 'error'}
							on:change={() => handleRefreshChange({ onError: 'error' })}
							class="appearance-none w-6 h-6 border-[3px] border-gray-900 rounded-full checked:bg-gray-900 transition-colors cursor-pointer"
						/>
						<div class="absolute w-2 h-2 bg-white rounded-full pointer-events-none opacity-0 {refreshPolicy.onError === 'error' ? 'opacity-100' : ''}"></div>
					</div>
					<div>
						<p class="font-black text-gray-900 text-sm uppercase tracking-wide">Return Error</p>
						<p class="text-xs font-medium text-gray-500 mt-1">Fail the request with a 500 status code</p>
					</div>
				</label>
			</div>
		</div>
	</div>

	<!-- Output Configuration -->
	<div class="mt-8 pt-8 border-t-[3px] border-gray-200 border-dashed">
		<div class="flex items-center gap-2 pb-4">
			<span class="w-3 h-3 bg-[#3b82f6] rounded-full border-2 border-black"></span>
			<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Output Format</h3>
		</div>

		<div class="p-6 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937]">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<div>
					<label class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-2">Image Format</label>
					<div class="relative">
						<select
							class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#3b82f6] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all bg-white appearance-none"
							value={outputConfig.format}
							on:change={(e) => handleOutputChange({ format: e.target.value })}
						>
							<option value="png">PNG (Lossless)</option>
							<option value="jpeg">JPEG (Compressed)</option>
							<option value="webp">WebP (Optimized)</option>
							<option value="pdf">PDF (Document)</option>
						</select>
						<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
							<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
						</div>
					</div>
				</div>
				<div>
					<div class="flex justify-between mb-2">
						<label class="block text-xs font-black text-gray-900 uppercase tracking-wide">Quality</label>
						<span class="text-xs font-black text-[#3b82f6] bg-blue-50 px-2 rounded border border-blue-100">{outputConfig.quality}%</span>
					</div>
					<input
						type="range"
						min="50"
						max="100"
						step="5"
						class="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#3b82f6] border-2 border-gray-300"
						value={outputConfig.quality}
						on:input={(e) => handleOutputChange({ quality: parseInt(e.target.value) })}
					/>
					<div class="flex justify-between mt-2 text-[10px] font-black uppercase text-gray-400">
						<span>Small File</span>
						<span>High Quality</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex justify-between gap-3 pt-6 mt-6 border-t-[3px] border-gray-900">
		<button
			class="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-black text-xs uppercase tracking-wide rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#9ca3af] hover:shadow-[1px_1px_0_0_#9ca3af] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
			on:click={handleBack}
		>
			Back
		</button>
		<button
			class="px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-xs uppercase tracking-wide rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all group flex items-center gap-2"
			on:click={handleNext}
		>
			Next: Publish
			<svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
		</button>
	</div>
</div>
