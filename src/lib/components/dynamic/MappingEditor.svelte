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

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-black text-gray-900 uppercase tracking-wide flex items-center gap-3">
			<span class="w-8 h-8 bg-gray-900 border-2 border-gray-900 rounded-lg flex items-center justify-center shadow-[3px_3px_0_0_#9ca3af]">
				<span class="text-white text-lg font-black">2</span>
			</span>
			Variable Mapping
		</h2>
	</div>

	<div class="p-4 bg-[#fffdf8] border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937]">
		<p class="text-sm text-gray-900 font-bold flex items-center gap-2">
			<svg class="w-5 h-5 text-[#a855f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			How to map:
		</p>
		<p class="text-xs text-gray-600 font-medium mt-1 ml-7">
			Use JSONPath to select data from your source. Example: <code class="bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded border border-gray-300 font-mono font-bold">$.products[0].name</code>
		</p>
	</div>

	{#if variables.length === 0}
		<div class="text-center py-12 bg-gray-50 rounded-xl border-[3px] border-dashed border-gray-300">
			<div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
				<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
				</svg>
			</div>
			<p class="font-black text-gray-900 uppercase tracking-wide text-lg">No Variables Found</p>
			<p class="text-sm text-gray-500 font-medium mt-2">This template doesn't have any dynamic variables to map.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Variables List -->
			<div class="space-y-5">
				<div class="flex items-center gap-2 pb-2 border-b-[3px] border-gray-900">
					<span class="w-3 h-3 bg-indigo-500 rounded-full border-2 border-black"></span>
					<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Template Variables</h3>
				</div>
				<div class="space-y-4">
				{#each variables as variable (variable.name)}
					<div class="p-5 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#1f2937]">
						<div class="flex items-center justify-between mb-4">
							<span class="font-black text-gray-900 text-lg tracking-tight">{variable.name}</span>
							{#if variable.type}
								<span class="px-2 py-1 text-[10px] font-black uppercase bg-gray-900 text-white rounded border border-gray-900 shadow-[2px_2px_0_0_#9ca3af]">
									{variable.type}
								</span>
							{/if}
						</div>

						<!-- JSONPath Input with Dropdown -->
						<div class="mb-4">
							<label class="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Source Path (JSON)</label>
							<div class="relative z-20">
								<input
									type="text"
									class="w-full px-4 py-3 pr-10 border-[3px] border-gray-200 rounded-lg text-sm font-bold font-mono focus:outline-none focus:border-[#a855f7] focus:bg-purple-50 transition-colors"
									placeholder={suggestedPaths.length > 0 ? "Select or type path..." : "$.data.field"}
									value={mapping[variable.name] || ''}
									on:input={(e) => handleMappingChange(variable.name, e.target.value)}
									on:focus={() => handleFocus(variable.name)}
									on:blur={handleBlur}
								/>
								{#if suggestedPaths.length > 0}
									<button
										type="button"
										class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-900 transition-colors"
										on:click={() => openDropdown = openDropdown === variable.name ? null : variable.name}
									>
										<svg class="w-5 h-5 transition-transform {openDropdown === variable.name ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/>
										</svg>
									</button>
								{/if}

								<!-- Dropdown suggestions -->
								{#if openDropdown === variable.name && suggestedPaths.length > 0}
									<div class="absolute z-50 left-0 right-0 top-full mt-2 bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] max-h-64 overflow-y-auto">
										<div class="sticky top-0 bg-gray-50 px-3 py-2 border-b-[3px] border-gray-100 flex justify-between items-center">
											<p class="text-[10px] font-black text-gray-500 uppercase tracking-wide">
												Available Paths
											</p>
											<span class="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{getFilteredPaths(variable.name).length}</span>
										</div>
										{#each getFilteredPaths(variable.name) as { path, value, type, isLeaf }}
											<button
												type="button"
												class="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center justify-between gap-3 group"
												on:mousedown|preventDefault={() => handleSelectPath(variable.name, path)}
											>
												<div class="flex-1 min-w-0">
													<span class="font-mono text-xs font-bold text-gray-900 block truncate group-hover:text-[#a855f7] transition-colors">{path}</span>
													{#if isLeaf}
														<span class="text-[10px] font-mono {getTypeColor(type)} truncate block mt-0.5 opacity-75">
															{formatPreviewValue(value)}
														</span>
													{/if}
												</div>
												<span class="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border {
													type === 'string' ? 'bg-green-50 text-green-700 border-green-200' :
													type === 'number' ? 'bg-blue-50 text-blue-700 border-blue-200' :
													type === 'boolean' ? 'bg-purple-50 text-purple-700 border-purple-200' :
													type === 'array' ? 'bg-orange-50 text-orange-700 border-orange-200' :
													'bg-gray-50 text-gray-600 border-gray-200'
												}">
													{type}
												</span>
											</button>
										{/each}
										{#if getFilteredPaths(variable.name).length === 0}
											<div class="px-3 py-4 text-center text-gray-500 text-xs font-bold uppercase tracking-wide">
												No matching paths
											</div>
										{/if}
									</div>
								{/if}
							</div>
							{#if mapping[variable.name] && sampleData}
								{@const preview = getPreviewValue(mapping[variable.name])}
								{#if preview !== null && preview !== undefined}
									<p class="text-xs text-green-600 mt-2 font-mono font-bold flex items-center gap-1.5 pl-1">
										<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
										Value: <span class="text-gray-900 bg-green-50 px-1 rounded">{typeof preview === 'object' ? JSON.stringify(preview) : String(preview)}</span>
									</p>
								{:else}
									<p class="text-xs text-orange-600 mt-2 font-bold flex items-center gap-1.5 pl-1">
										<span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
										Path not found in data
									</p>
								{/if}
							{/if}
						</div>

						<!-- Default Value -->
						<div>
							<label class="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Fallback Value</label>
							<input
								type="text"
								class="w-full px-4 py-2 border-[3px] border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:border-gray-400 transition-colors"
								placeholder="Use this if data is missing..."
								value={defaults[variable.name] || ''}
								on:input={(e) => handleDefaultChange(variable.name, e.target.value)}
							/>
						</div>
					</div>
				{/each}
				</div>
			</div>

			<!-- Sample Data Preview -->
			<div class="space-y-5">
				<div class="flex items-center gap-2 pb-2 border-b-[3px] border-gray-900">
					<span class="w-3 h-3 bg-green-500 rounded-full border-2 border-black"></span>
					<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Source Data Preview</h3>
				</div>
				{#if sampleData}
					<div class="bg-[#1a1a1a] rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#9ca3af] overflow-hidden flex flex-col h-[600px]">
						<div class="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center shrink-0">
							<span class="text-[10px] font-black uppercase text-gray-400 tracking-wide">Response JSON</span>
							<span class="text-[10px] font-black text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded border border-[#4ade80]/20">Live Data</span>
						</div>
						<div class="p-4 overflow-auto flex-1">
							<pre class="text-xs font-mono text-[#4ade80]/90 whitespace-pre-wrap">{JSON.stringify(sampleData, null, 2)}</pre>
						</div>
					</div>
				{:else}
					<div class="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-[3px] border-dashed border-gray-300">
						<svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
						</svg>
						<p class="text-sm font-black uppercase tracking-wide text-gray-400">No Sample Data</p>
						<p class="text-xs mt-1 font-medium">Run a test in "Data Source" to see live data here.</p>
					</div>
				{/if}

				{#if suggestedPaths.length > 0}
					<div class="p-4 bg-gray-50 border-[3px] border-gray-200 rounded-xl">
						<div class="flex items-center justify-between mb-3">
							<h4 class="text-xs font-black text-gray-500 uppercase tracking-wide">Quick Copy Paths</h4>
							<span class="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 rounded">{suggestedPaths.length}</span>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each suggestedPaths.filter(p => p.isLeaf).slice(0, 24) as { path, value, type }}
								<button
									class="group px-2 py-1 text-[10px] font-bold font-mono rounded border-[2px] transition-all flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 {
										type === 'string' ? 'bg-green-50 hover:bg-green-100 text-green-800 border-green-200' :
										type === 'number' ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200' :
										type === 'boolean' ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200' :
										'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm'
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
							<p class="text-[10px] text-gray-400 italic font-bold mt-2 text-center">
								...and {suggestedPaths.filter(p => p.isLeaf).length - 24} more paths
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex justify-between gap-3 pt-6 mt-6 border-t-[3px] border-gray-900">
		<button
			class="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-black text-sm uppercase tracking-widest rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#9ca3af] hover:shadow-[3px_3px_0_0_#9ca3af] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
			on:click={handleBack}
		>
			Back
		</button>
		<button
			class="px-8 py-4 bg-[#a855f7] hover:bg-[#9333ea] text-white font-black text-sm uppercase tracking-widest rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all group flex items-center gap-2"
			on:click={handleNext}
		>
			Next: Refresh Strategy
			<svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
		</button>
	</div>
</div>
