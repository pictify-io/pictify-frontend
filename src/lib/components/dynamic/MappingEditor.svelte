<script>
	import { createEventDispatcher, onDestroy } from 'svelte';

	export let variables = [];
	export let mapping = {};
	export let defaults = {};
	export let sampleData = null;

	const dispatch = createEventDispatcher();

	// Track which dropdown is open
	let openDropdown = null;
	let searchFilter = {};

	// Memoize extracted paths to prevent recalculation on every render
	let cachedSampleData = null;
	let cachedPaths = [];

	// Only re-extract paths when sampleData reference actually changes
	$: {
		if (sampleData !== cachedSampleData) {
			cachedSampleData = sampleData;
			cachedPaths = sampleData ? extractPaths(sampleData) : [];
		}
	}
	$: suggestedPaths = cachedPaths;

	const extractPaths = (obj, prefix = '$', maxDepth = 10) => {
		const paths = [];
		const traverse = (current, currentPath, depth = 0) => {
			if (depth > maxDepth) return;
			if (current === null || current === undefined) return;

			if (typeof current === 'object' && !Array.isArray(current)) {
				for (const key of Object.keys(current)) {
					const newPath = `${currentPath}.${key}`;
					const val = current[key];
					// Only add leaf nodes (primitives) or objects with a preview
					const isLeaf = val === null || typeof val !== 'object';
					paths.push({
						path: newPath,
						value: val,
						type: val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val,
						isLeaf
					});
					traverse(val, newPath, depth + 1);
				}
			} else if (Array.isArray(current) && current.length > 0) {
				const newPath = `${currentPath}[0]`;
				const val = current[0];
				const isLeaf = val === null || typeof val !== 'object';
				paths.push({
					path: newPath,
					value: val,
					type: val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val,
					isLeaf
				});
				traverse(val, newPath, depth + 1);
			}
		};
		traverse(obj, prefix, 0);
		return paths.slice(0, 100); // Limit suggestions
	};

	// Filter paths based on search input
	const getFilteredPaths = (variableName) => {
		const filter = (searchFilter[variableName] || '').toLowerCase();
		if (!filter) return suggestedPaths;
		return suggestedPaths.filter(p => p.path.toLowerCase().includes(filter));
	};

	const handleMappingChange = (variableName, path) => {
		searchFilter[variableName] = path;
		dispatch('change', { name: variableName, path });
	};

	const handleSelectPath = (variableName, path) => {
		handleMappingChange(variableName, path);
		openDropdown = null;
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

	const handleFocus = (variableName) => {
		if (suggestedPaths.length > 0) {
			openDropdown = variableName;
		}
	};

	// Track blur timeout for cleanup
	let blurTimeout = null;

	const handleBlur = (e) => {
		// Delay closing to allow click on dropdown item
		blurTimeout = setTimeout(() => {
			openDropdown = null;
		}, 200);
	};

	// Clean up timeout on component destroy
	onDestroy(() => {
		if (blurTimeout) {
			clearTimeout(blurTimeout);
		}
	});

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

	const formatPreviewValue = (value) => {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';
		if (typeof value === 'string') return `"${value.length > 30 ? value.slice(0, 30) + '...' : value}"`;
		if (typeof value === 'object') return Array.isArray(value) ? `[${value.length} items]` : '{...}';
		return String(value);
	};

	const getTypeColor = (type) => {
		switch (type) {
			case 'string': return 'text-green-600';
			case 'number': return 'text-blue-600';
			case 'boolean': return 'text-purple-600';
			case 'array': return 'text-orange-600';
			case 'object': return 'text-gray-500';
			default: return 'text-gray-400';
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

						<!-- JSONPath Input with Dropdown -->
						<div>
							<label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">JSONPath</label>
							<div class="relative">
								<input
									type="text"
									class="w-full px-3 py-2 pr-8 border-2 border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-[#a855f7] transition-colors"
									placeholder={suggestedPaths.length > 0 ? "Type or select from dropdown..." : "$.data.field"}
									value={mapping[variable.name] || ''}
									on:input={(e) => handleMappingChange(variable.name, e.target.value)}
									on:focus={() => handleFocus(variable.name)}
									on:blur={handleBlur}
								/>
								{#if suggestedPaths.length > 0}
									<button
										type="button"
										class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
										on:click={() => openDropdown = openDropdown === variable.name ? null : variable.name}
									>
										<svg class="w-4 h-4 transition-transform {openDropdown === variable.name ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
										</svg>
									</button>
								{/if}

								<!-- Dropdown suggestions -->
								{#if openDropdown === variable.name && suggestedPaths.length > 0}
									<div class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border-2 border-gray-900 rounded-lg shadow-[4px_4px_0_0_#1f2937] max-h-64 overflow-y-auto">
										<div class="sticky top-0 bg-gray-100 px-3 py-2 border-b border-gray-200">
											<p class="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
												{getFilteredPaths(variable.name).length} paths available
											</p>
										</div>
										{#each getFilteredPaths(variable.name) as { path, value, type, isLeaf }}
											<button
												type="button"
												class="w-full px-3 py-2 text-left hover:bg-purple-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center justify-between gap-2"
												on:mousedown|preventDefault={() => handleSelectPath(variable.name, path)}
											>
												<div class="flex-1 min-w-0">
													<span class="font-mono text-sm text-gray-900 block truncate">{path}</span>
													{#if isLeaf}
														<span class="text-[10px] {getTypeColor(type)} truncate block">
															{formatPreviewValue(value)}
														</span>
													{/if}
												</div>
												<span class="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded {
													type === 'string' ? 'bg-green-100 text-green-700' :
													type === 'number' ? 'bg-blue-100 text-blue-700' :
													type === 'boolean' ? 'bg-purple-100 text-purple-700' :
													type === 'array' ? 'bg-orange-100 text-orange-700' :
													'bg-gray-100 text-gray-600'
												}">
													{type}
												</span>
											</button>
										{/each}
										{#if getFilteredPaths(variable.name).length === 0}
											<div class="px-3 py-4 text-center text-gray-500 text-sm">
												No matching paths found
											</div>
										{/if}
									</div>
								{/if}
							</div>
							{#if mapping[variable.name] && sampleData}
								{@const preview = getPreviewValue(mapping[variable.name])}
								{#if preview !== null && preview !== undefined}
									<p class="text-xs text-green-600 mt-1 font-mono flex items-center gap-1">
										<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
										</svg>
										Preview: {typeof preview === 'object' ? JSON.stringify(preview) : String(preview)}
									</p>
								{:else}
									<p class="text-xs text-orange-600 mt-1 flex items-center gap-1">
										<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
										</svg>
										Path not found in sample data
									</p>
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
						<div class="flex items-center justify-between">
							<h4 class="text-xs font-bold text-gray-600 uppercase tracking-wide">Available Paths</h4>
							<span class="text-[10px] text-gray-400">{suggestedPaths.length} total</span>
						</div>
						<div class="flex flex-wrap gap-1.5">
							{#each suggestedPaths.filter(p => p.isLeaf).slice(0, 24) as { path, value, type }}
								<button
									class="group px-2 py-1 text-[10px] font-mono rounded border transition-all flex items-center gap-1.5 {
										type === 'string' ? 'bg-green-50 hover:bg-green-100 text-green-800 border-green-200' :
										type === 'number' ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200' :
										type === 'boolean' ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200' :
										'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
									}"
									title="Click to copy: {path}&#10;Value: {formatPreviewValue(value)}"
									on:click={() => navigator.clipboard.writeText(path)}
								>
									<span class="truncate max-w-[150px]">{path}</span>
									<svg class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
									</svg>
								</button>
							{/each}
						</div>
						{#if suggestedPaths.filter(p => p.isLeaf).length > 24}
							<p class="text-[10px] text-gray-400 italic">
								+{suggestedPaths.filter(p => p.isLeaf).length - 24} more paths (use dropdown to see all)
							</p>
						{/if}
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
