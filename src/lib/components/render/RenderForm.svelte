<script>
	import { createEventDispatcher } from 'svelte';

	export let variables = [];
	export let variableValues = {};

	const dispatch = createEventDispatcher();

	let jsonInput = '';
	let showJsonInput = false;
	let jsonError = '';

	const handleInputChange = (name, value) => {
		dispatch('change', { name, value });
	};

	const toggleJsonInput = () => {
		showJsonInput = !showJsonInput;
		jsonError = '';
		if (showJsonInput) {
			jsonInput = JSON.stringify(variableValues, null, 2);
		}
	};

	const applyJsonInput = () => {
		try {
			const parsed = JSON.parse(jsonInput);
			if (typeof parsed !== 'object' || parsed === null) {
				jsonError = 'JSON must be an object';
				return;
			}
			dispatch('jsonImport', { values: parsed });
			jsonError = '';
			showJsonInput = false;
		} catch (e) {
			jsonError = 'Invalid JSON: ' + e.message;
		}
	};

	const getInputType = (variable) => {
		if (variable.type === 'image' || variable.name.toLowerCase().includes('image') || variable.name.toLowerCase().includes('url')) {
			return 'url';
		}
		if (variable.type === 'number' || variable.name.toLowerCase().includes('price') || variable.name.toLowerCase().includes('amount')) {
			return 'number';
		}
		if (variable.type === 'color') {
			return 'color';
		}
		return 'text';
	};
</script>

<div class="space-y-4">
	{#if variables.length === 0}
		<div class="text-center py-8 text-gray-500">
			<svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
			</svg>
			<p class="font-bold">No Variables Defined</p>
			<p class="text-sm mt-1">This template doesn't have any dynamic variables</p>
		</div>
	{:else}
		<!-- Variable Inputs -->
		{#each variables as variable (variable.name)}
			<div class="space-y-1">
				<label class="block text-xs font-bold text-gray-700 uppercase tracking-wide">
					{variable.name}
					{#if variable.required}
						<span class="text-[#ff6b6b]">*</span>
					{/if}
				</label>
				{#if variable.type === 'text' && (variable.name.toLowerCase().includes('description') || variable.name.toLowerCase().includes('content'))}
					<textarea
						class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-0 transition-colors resize-none"
						rows="3"
						placeholder={variable.placeholder || `Enter ${variable.name}...`}
						value={variableValues[variable.name] || ''}
						on:input={(e) => handleInputChange(variable.name, e.target.value)}
					/>
				{:else if getInputType(variable) === 'color'}
					<div class="flex gap-2">
						<input
							type="color"
							class="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
							value={variableValues[variable.name] || '#000000'}
							on:input={(e) => handleInputChange(variable.name, e.target.value)}
						/>
						<input
							type="text"
							class="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-0 transition-colors font-mono"
							value={variableValues[variable.name] || ''}
							on:input={(e) => handleInputChange(variable.name, e.target.value)}
							placeholder="#000000"
						/>
					</div>
				{:else}
					<input
						type={getInputType(variable)}
						class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-0 transition-colors"
						placeholder={variable.placeholder || `Enter ${variable.name}...`}
						value={variableValues[variable.name] || ''}
						on:input={(e) => handleInputChange(variable.name, e.target.value)}
					/>
				{/if}
				{#if variable.description}
					<p class="text-xs text-gray-400">{variable.description}</p>
				{/if}
			</div>
		{/each}
	{/if}

	<!-- JSON Input Toggle -->
	<div class="pt-4 border-t border-gray-200">
		<button
			class="text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-wide flex items-center gap-1"
			on:click={toggleJsonInput}
		>
			<svg class="w-4 h-4 transition-transform {showJsonInput ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
			</svg>
			{showJsonInput ? 'Hide' : 'Show'} JSON Input
		</button>

		{#if showJsonInput}
			<div class="mt-3 space-y-2">
				<textarea
					class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-gray-900 focus:ring-0 transition-colors resize-none"
					rows="6"
					placeholder={'{"key": "value"}'}
					bind:value={jsonInput}
				/>
				{#if jsonError}
					<p class="text-xs text-[#ff6b6b] font-medium">{jsonError}</p>
				{/if}
				<button
					class="text-xs font-bold text-[#4ecdc4] hover:text-[#3dbdb5] uppercase tracking-wide"
					on:click={applyJsonInput}
				>
					Apply JSON
				</button>
			</div>
		{/if}
	</div>
</div>
