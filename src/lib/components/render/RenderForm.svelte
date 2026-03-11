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
		if (
			variable.type === 'image' ||
			variable.name.toLowerCase().includes('image') ||
			variable.name.toLowerCase().includes('url')
		) {
			return 'url';
		}
		if (
			variable.type === 'number' ||
			variable.name.toLowerCase().includes('price') ||
			variable.name.toLowerCase().includes('amount')
		) {
			return 'number';
		}
		if (variable.type === 'color') {
			return 'color';
		}
		return 'text';
	};
</script>

<div class="space-y-6">
	{#if variables.length === 0}
		<div class="text-center py-12 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
			<svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				/>
			</svg>
			<p class="font-black uppercase tracking-wider text-sm text-gray-900">No Variables Defined</p>
			<p class="text-xs font-bold mt-1">This template is static</p>
		</div>
	{:else}
		<!-- Variable Inputs -->
		{#each variables as variable (variable.name)}
			<div class="space-y-2">
				<label class="block text-xs font-black text-gray-900 uppercase tracking-wide">
					{variable.name}
					{#if variable.required}
						<span class="text-[#ff6b6b]">*</span>
					{/if}
				</label>
				{#if variable.type === 'text' && (variable.name
						.toLowerCase()
						.includes('description') || variable.name.toLowerCase().includes('content'))}
					<textarea
						class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all resize-none placeholder-gray-400"
						rows="3"
						placeholder={variable.placeholder || `ENTER ${variable.name.toUpperCase()}...`}
						value={variableValues[variable.name] || ''}
						on:input={(e) => handleInputChange(variable.name, e.target.value)}
					/>
				{:else if getInputType(variable) === 'color'}
					<div class="flex gap-3">
						<div class="relative w-12 h-12 flex-shrink-0">
							<input
								type="color"
								class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
								value={variableValues[variable.name] || '#000000'}
								on:input={(e) => handleInputChange(variable.name, e.target.value)}
							/>
							<div
								class="w-full h-full border-[3px] border-gray-900 rounded-lg shadow-[2px_2px_0_0_#9ca3af]"
								style="background-color: {variableValues[variable.name] || '#000000'}"
							/>
						</div>
						<input
							type="text"
							class="flex-1 px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-bold font-mono focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all uppercase"
							value={variableValues[variable.name] || ''}
							on:input={(e) => handleInputChange(variable.name, e.target.value)}
							placeholder="#000000"
						/>
					</div>
				{:else}
					<input
						type={getInputType(variable)}
						class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-lg text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all placeholder-gray-400"
						placeholder={variable.placeholder || `ENTER ${variable.name.toUpperCase()}...`}
						value={variableValues[variable.name] || ''}
						on:input={(e) => handleInputChange(variable.name, e.target.value)}
					/>
				{/if}
				{#if variable.description}
					<p class="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
						{variable.description}
					</p>
				{/if}
			</div>
		{/each}
	{/if}

	<!-- JSON Input Toggle -->
	<div class="pt-6 border-t-[3px] border-gray-100 border-dashed">
		<button
			class="text-xs font-black text-gray-500 hover:text-gray-900 uppercase tracking-widest flex items-center gap-2 transition-colors group"
			on:click={toggleJsonInput}
		>
			<div
				class="w-5 h-5 border-[2px] border-gray-400 group-hover:border-gray-900 rounded flex items-center justify-center transition-colors"
			>
				<svg
					class="w-3 h-3 transition-transform {showJsonInput ? 'rotate-90' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
				</svg>
			</div>
			{showJsonInput ? 'Hide' : 'Show'} JSON Input
		</button>

		{#if showJsonInput}
			<div class="mt-4 space-y-4 animate-fadeIn">
				<textarea
					class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-lg text-xs font-mono focus:outline-none focus:shadow-[4px_4px_0_0_#a78bfa] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all resize-none bg-gray-50 text-gray-800"
					rows="6"
					placeholder={'{\n  "key": "value"\n}'}
					bind:value={jsonInput}
				/>
				{#if jsonError}
					<div
						class="px-3 py-2 bg-red-100 border-[2px] border-red-200 rounded text-xs font-bold text-red-600 flex items-center gap-2"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
						{jsonError}
					</div>
				{/if}
				<button
					class="w-full py-2 bg-[#4ecdc4] text-white font-black uppercase tracking-wide border-[3px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all text-xs"
					on:click={applyJsonInput}
				>
					Apply JSON Configuration
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fadeIn {
		animation: fadeIn 0.2s ease-out;
	}
</style>
