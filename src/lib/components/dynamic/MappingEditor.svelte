<script>
	import { createEventDispatcher } from 'svelte';

	export let variables = [];
	export let mapping = {};
	export let defaults = {};
	export let sampleData = null;

	const dispatch = createEventDispatcher();

	// Extract suggested paths from sample data
	$: suggestedPaths = sampleData ? extractPaths(sampleData) : [];

	const extractPaths = (obj, prefix = '$', maxDepth = 10) => {
		const paths = [];
		const traverse = (current, currentPath, depth = 0) => {
			if (depth > maxDepth) return;
			if (current === null || current === undefined) return;

			if (typeof current === 'object' && !Array.isArray(current)) {
				for (const key of Object.keys(current)) {
					const newPath = `${currentPath}.${key}`;
					paths.push({ path: newPath, value: current[key] });
					traverse(current[key], newPath, depth + 1);
				}
			} else if (Array.isArray(current) && current.length > 0) {
				const newPath = `${currentPath}[0]`;
				paths.push({ path: newPath, value: current[0] });
				traverse(current[0], newPath, depth + 1);
			}
		};
		traverse(obj, prefix, 0);
		return paths.slice(0, 50); // Limit suggestions
	};

	const handleMappingChange = (variableName, path) => {
		dispatch('change', { name: variableName, path });
	};

	const handleDefaultChange = (variableName, value) => {
		dispatch('change', { name: variableName, path: mapping[variableName], defaultValue: value });
	};

	const handleBack = () => {
		dispatch('back');
	};

	const handleNext = () => {
		dispatch('next');
	};

	const getPreviewValue = (path) => {
		if (!sampleData || !path) return null;
		try {
			// Simple JSONPath evaluation
			const parts = path.replace(/^\$\.?/, '').split(/[.\[\]]/).filter(Boolean);
			let result = sampleData;
			for (const part of parts) {
				if (result === null || result === undefined) return null;
				result = result[part];
			}
			return result;
		} catch {
			return null;
		}
	};
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
			</svg>
			Variable Mapping
		</h2>
	</div>

	<p class="text-sm text-gray-500 font-medium">
		Map your template variables to data from the source using JSONPath syntax (e.g., <code class="bg-gray-100 px-1 rounded">$.product.name</code>)
	</p>

	{#if variables.length === 0}
		<div class="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
			<svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
			</svg>
			<p class="font-bold">No Variables to Map</p>
			<p class="text-sm mt-1">This template doesn't have any dynamic variables</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Variables List -->
			<div class="space-y-4">
				<h3 class="text-sm font-bold text-gray-700 uppercase tracking-wide">Template Variables</h3>
				{#each variables as variable (variable.name)}
					<div class="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl space-y-3">
						<div class="flex items-center justify-between">
							<span class="font-bold text-gray-900">{variable.name}</span>
							{#if variable.type}
								<span class="px-2 py-0.5 text-[9px] font-bold uppercase bg-gray-200 text-gray-600 rounded">
									{variable.type}
								</span>
							{/if}
						</div>

						<!-- JSONPath Input -->
						<div>
							<label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">JSONPath</label>
							<div class="relative">
								<input
									type="text"
									class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-[#a855f7] transition-colors"
									placeholder="$.data.field"
									value={mapping[variable.name] || ''}
									on:input={(e) => handleMappingChange(variable.name, e.target.value)}
									list="paths-{variable.name}"
								/>
								{#if suggestedPaths.length > 0}
									<datalist id="paths-{variable.name}">
										{#each suggestedPaths as { path }}
											<option value={path}>{path}</option>
										{/each}
									</datalist>
								{/if}
							</div>
							{#if mapping[variable.name] && sampleData}
								{@const preview = getPreviewValue(mapping[variable.name])}
								{#if preview !== null && preview !== undefined}
									<p class="text-xs text-green-600 mt-1 font-mono">
										Preview: {typeof preview === 'object' ? JSON.stringify(preview) : String(preview)}
									</p>
								{:else}
									<p class="text-xs text-orange-600 mt-1">Path not found in sample data</p>
								{/if}
							{/if}
						</div>

						<!-- Default Value -->
						<div>
							<label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Default Value</label>
							<input
								type="text"
								class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
								placeholder="Fallback if data is missing"
								value={defaults[variable.name] || ''}
								on:input={(e) => handleDefaultChange(variable.name, e.target.value)}
							/>
						</div>
					</div>
				{/each}
			</div>

			<!-- Sample Data Preview -->
			<div class="space-y-4">
				<h3 class="text-sm font-bold text-gray-700 uppercase tracking-wide">Sample Data</h3>
				{#if sampleData}
					<div class="bg-gray-900 rounded-xl p-4 max-h-[500px] overflow-auto">
						<pre class="text-xs font-mono text-green-400 whitespace-pre-wrap">{JSON.stringify(sampleData, null, 2)}</pre>
					</div>
				{:else}
					<div class="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
						<svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
						</svg>
						<p class="text-sm font-bold">No Sample Data</p>
						<p class="text-xs mt-1">Test your data source to see sample data</p>
					</div>
				{/if}

				{#if suggestedPaths.length > 0}
					<div class="space-y-2">
						<h4 class="text-xs font-bold text-gray-600 uppercase tracking-wide">Available Paths</h4>
						<div class="flex flex-wrap gap-1">
							{#each suggestedPaths.slice(0, 20) as { path, value }}
								<button
									class="px-2 py-1 text-[10px] font-mono bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200 transition-colors"
									title={typeof value === 'object' ? JSON.stringify(value) : String(value)}
									on:click={() => navigator.clipboard.writeText(path)}
								>
									{path}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

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
			Next: Refresh Strategy
		</button>
	</div>
</div>
