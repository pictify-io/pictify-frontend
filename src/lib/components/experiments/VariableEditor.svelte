<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {Array<{key: string, value: string}>} */
	export let rows = [];

	/** @type {Array<{name: string, type: string, defaultValue: any, description: string}>} */
	export let templateVars = [];

	export let disabled = false;

	// Keys already used
	$: usedKeys = rows.map((r) => r.key);
	$: availableVars = templateVars.filter((v) => !usedKeys.includes(v.name));

	function addRow() {
		rows = [...rows, { key: '', value: '' }];
		dispatch('change');
	}

	function removeRow(index) {
		rows = rows.filter((_, i) => i !== index);
		dispatch('change');
	}

	function handleInput() {
		dispatch('change');
	}

	function selectVariable(varName, defaultValue) {
		if (!usedKeys.includes(varName)) {
			rows = [...rows, { key: varName, value: defaultValue != null ? String(defaultValue) : '' }];
			dispatch('change');
		}
	}
</script>

<div>
	<div class="flex items-center justify-between mb-3 border-b-[3px] border-gray-900 pb-2">
		<label class="text-sm font-black uppercase tracking-widest text-gray-900"> Variables </label>
		{#if rows.length > 0}
			<span
				class="text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white px-2 py-1 rounded"
			>
				{rows.length} Editable
			</span>
		{/if}
	</div>

	{#if rows.length > 0}
		<div class="space-y-3 bg-gray-50 p-4 rounded-xl border-[3px] border-gray-200">
			{#each rows as row, rowIndex}
				<div class="flex flex-col sm:flex-row sm:items-center gap-2">
					<label
						class="sm:w-1/3 px-3 py-2 bg-gray-200 border-[2px] border-gray-300 rounded-lg text-xs font-black text-gray-700 truncate font-mono shadow-[inset_1px_1px_0_0_rgba(255,255,255,0.7)]"
						title={row.key}
					>
						{row.key}
					</label>
					<input
						type="text"
						bind:value={row.value}
						on:input={handleInput}
						placeholder="Override value"
						{disabled}
						class="flex-1 px-3 py-2 border-[2px] border-gray-400 rounded-lg text-sm font-bold font-mono focus:outline-none focus:border-gray-900 focus:bg-[#FFFDF8] transition-colors"
					/>
					{#if !disabled}
						<button
							type="button"
							on:click={() => removeRow(rowIndex)}
							class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 self-center"
							title="Remove"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="bg-gray-50 border-[3px] border-dashed border-gray-300 rounded-xl p-6 text-center">
			<svg
				class="w-8 h-8 text-gray-300 mx-auto mb-2"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
				/>
			</svg>
			<p class="text-sm font-bold text-gray-500 uppercase tracking-widest">
				{templateVars.length > 0 ? 'No variables overridden.' : 'No variables defined.'}
			</p>
		</div>
	{/if}

	{#if availableVars.length > 0 && !disabled}
		<div class="mt-3 flex flex-wrap gap-2">
			<span class="text-[10px] font-black uppercase tracking-widest text-gray-500 self-center"
				>Quick add:</span
			>
			{#each availableVars as v}
				<button
					type="button"
					on:click={() => selectVariable(v.name, v.defaultValue)}
					class="px-2.5 py-1 border-[2px] border-gray-300 rounded-lg text-[10px] font-black uppercase tracking-wide text-gray-600 bg-white hover:border-gray-900 hover:text-gray-900 transition-all"
				>
					+ {v.name}
				</button>
			{/each}
		</div>
	{/if}
</div>
