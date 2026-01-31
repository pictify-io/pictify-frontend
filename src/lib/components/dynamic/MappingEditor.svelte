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
	<!-- Header removed as it is now in parent -->

	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
		<!-- Main Mapping Section -->
		<div class="lg:col-span-8">
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
				<div class="bg-[#60a5fa] border-b-[3px] border-gray-900 px-6 py-4">
					<h2 class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 text-shadow-sm">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
						Map Variables to Data
					</h2>
				</div>
				<div class="p-6 sm:p-8">
					{#if variables.length === 0}
						<div class="text-center py-12 text-gray-500">
							<p>No variables found in this template.</p>
						</div>
					{:else}
						<div class="space-y-6 mb-8">
							{#each variables as variable (variable.name)}
								<div class="group">
									<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
										<!-- Variable Label -->
										<label class="w-48 font-bold flex items-center gap-2 text-gray-900 shrink-0">
											<div class="w-6 h-6 rounded bg-gray-100 border-2 border-gray-900 flex items-center justify-center text-xs font-black shrink-0 shadow-[2px_2px_0_0_#ccc]">
												{variable.name.charAt(0).toUpperCase()}
											</div>
											<span class="truncate">{variable.name}</span>
											{#if variable.required}<span class="text-red-500 text-lg leading-none">*</span>{/if}
										</label>
										
										<!-- Input Area -->
										<div class="flex-1 flex items-center gap-3 min-w-0">
											<div class="relative flex-1">
												<input
													type="text"
													class="w-full pl-4 pr-10 py-3 bg-white border-[3px] border-gray-900 rounded-lg text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#60a5fa] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all font-mono placeholder:font-sans placeholder:font-normal placeholder:text-gray-400"
													placeholder={suggestedPaths.length > 0 ? "Select or type path..." : "$.data.field"}
													value={mapping[variable.name] || ''}
													on:input={(e) => handleMappingChange(variable.name, e.target.value)}
													on:focus={() => handleFocus(variable.name)}
													on:blur={handleBlur}
												/>
												
												{#if suggestedPaths.length > 0}
													<div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
														<button
															type="button"
															class="p-1 text-gray-400 hover:text-gray-900 transition-colors"
															on:click={() => openDropdown = openDropdown === variable.name ? null : variable.name}
														>
															<svg class="w-4 h-4 transition-transform {openDropdown === variable.name ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
															</svg>
														</button>
													</div>
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
																class="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center justify-between gap-3 group/item"
																on:mousedown|preventDefault={() => handleSelectPath(variable.name, path)}
															>
																<div class="flex-1 min-w-0">
																	<span class="font-mono text-xs font-bold text-gray-900 block truncate group-hover/item:text-[#3b82f6] transition-colors">{path}</span>
																	{#if isLeaf}
																		<span class="text-[10px] font-mono {getTypeColor(type)} truncate block mt-0.5 opacity-75">
																			{formatPreviewValue(value)}
																		</span>
																	{/if}
																</div>
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
											
											<!-- Visual arrow -->
											<div class="hidden lg:block text-gray-300">
												<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
											</div>
										</div>
									</div>
									
									<!-- Preview & Default Value Row -->
									<div class="sm:pl-[210px] flex flex-col sm:flex-row gap-4 mb-2">
										<!-- Preview -->
										<div class="flex-1 min-w-0 h-8 flex items-center">
											{#if mapping[variable.name] && sampleData}
												{@const preview = getPreviewValue(mapping[variable.name])}
												{#if preview !== null && preview !== undefined}
													<div class="inline-block px-3 py-1.5 bg-[#eff6ff] border border-blue-200 rounded text-xs font-mono text-blue-900 max-w-full truncate">
														<span class="font-bold text-blue-500 mr-1">Preview:</span> 
														"{typeof preview === 'object' ? 'Object' : String(preview)}"
													</div>
												{:else}
													<div class="inline-block px-3 py-1.5 bg-orange-50 border border-orange-200 rounded text-xs font-bold text-orange-800">
														Path not found
													</div>
												{/if}
											{/if}
										</div>

										<!-- Fallback Input -->
										<div class="w-full sm:w-48">
											<input
												type="text"
												class="w-full px-3 py-1.5 bg-gray-50 border-2 border-gray-200 rounded text-xs font-medium focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
												placeholder="Fallback value..."
												value={defaults[variable.name] || ''}
												on:input={(e) => handleDefaultChange(variable.name, e.target.value)}
											/>
										</div>
									</div>
									<hr class="border-gray-100 last:hidden mt-4">
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Right Column: Instructions & Source Data -->
		<div class="lg:col-span-4 space-y-6">
			<!-- Tips Box (Matches Bulk) -->
			<div class="bg-[#eff6ff] border-[3px] border-[#60a5fa] rounded-xl p-6 shadow-[8px_8px_0_0_#bfdbfe]">
				<h3 class="font-black text-blue-900 uppercase tracking-widest text-sm mb-4">JSON Mapping Tips</h3>
				<ul class="space-y-3">
					<li class="flex gap-2 text-sm text-blue-900 font-medium">
						<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
						<span>Use <code>$.field</code> format to access root properties.</span>
					</li>
					<li class="flex gap-2 text-sm text-blue-900 font-medium">
						<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
						<span>Type in the box if the path you need isn't suggested.</span>
					</li>
				</ul>
			</div>

			<!-- Source Data Preview -->
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden flex flex-col max-h-[500px]">
				<div class="bg-gray-100 border-b-[3px] border-gray-900 px-4 py-3 flex justify-between items-center shrink-0">
					<h3 class="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
						<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
						Source Data
					</h3>
				</div>
				<div class="p-4 overflow-auto bg-[#1a1a1a] flex-1">
					{#if sampleData}
						<pre class="text-xs font-mono text-[#4ade80]/90 whitespace-pre-wrap">{JSON.stringify(sampleData, null, 2)}</pre>
					{:else}
						<div class="text-gray-500 text-xs text-center py-8">No data available</div>
					{/if}
				</div>
				{#if suggestedPaths.length > 0}
					<div class="border-t-[3px] border-gray-900 p-3 bg-gray-50">
						<p class="text-[10px] font-bold text-gray-500 uppercase mb-2">Quick Copy Paths</p>
						<div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
							{#each suggestedPaths.filter(p => p.isLeaf).slice(0, 15) as { path }}
								<button
									class="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono hover:border-gray-900 hover:bg-gray-100"
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
	</div>

	<!-- Actions -->
	<div class="flex justify-between gap-3 pt-6 mt-6 border-t-[3px] border-gray-900">
		<button
			class="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-black text-sm uppercase tracking-widest rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#9ca3af] hover:shadow-[3px_3px_0_0_#9ca3af] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
			on:click={handleBack}
		>
			Back
		</button>
		<button
			class="px-8 py-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-sm uppercase tracking-widest rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all group flex items-center gap-2"
			on:click={handleNext}
		>
			Next: Refresh Strategy
			<svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
		</button>
	</div>
</div>
