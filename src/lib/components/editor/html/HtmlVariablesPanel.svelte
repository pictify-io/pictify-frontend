<script>
	/**
	 * HtmlVariablesPanel — table-like editor for variableDefinitions.
	 *
	 * Per design spec: name (mono) · type · default · required · allowRawHtml.
	 * Auto-added variables show a yellow "AUTO" pill until the next user
	 * interaction. Randomize cycles ephemeral `testValues` (NOT defaults).
	 */
	import { createEventDispatcher, onMount } from 'svelte';
	import { sampleAll } from '../../../utils/sample-variable-generator';

	/** @type {Array} — variableDefinitions persisted on the template */
	export let variableDefinitions = [];
	/** @type {object} — ephemeral {name: sampleValue} overlay, consumed by preview */
	export let testValues = {};
	/** @type {string[]} — names auto-added since the last user-triggered save */
	export let autoAdded = [];

	const dispatch = createEventDispatcher();

	const TYPES = ['text', 'image', 'color', 'chart', 'table'];

	function emitChange() {
		dispatch('change', { variableDefinitions, testValues });
	}

	function updateVar(index, patch) {
		variableDefinitions = variableDefinitions.map((v, i) =>
			i === index ? { ...v, ...patch } : v
		);
		emitChange();
	}

	function removeVar(index) {
		variableDefinitions = variableDefinitions.filter((_, i) => i !== index);
		emitChange();
	}

	function addVar() {
		const placeholder = `var_${variableDefinitions.length + 1}`;
		variableDefinitions = [
			...variableDefinitions,
			{
				name: placeholder,
				type: 'text',
				defaultValue: '',
				validation: { required: false }
			}
		];
		emitChange();
	}

	async function randomize() {
		const generated = await sampleAll(variableDefinitions);
		testValues = { ...generated };
		emitChange();
	}

	// Clear the "auto-added" pills on any user interaction with the panel.
	function ackAutoAdded() {
		if (autoAdded.length === 0) return;
		autoAdded = [];
		dispatch('ackAutoAdded');
	}
</script>

<div class="flex h-full w-full flex-col bg-brand-bg" on:click={ackAutoAdded} role="presentation">
	<!-- Header -->
	<div
		class="flex items-center justify-between border-b-3 border-gray-800 px-6 py-4"
	>
		<h2 class="font-heading text-xl text-gray-900">Variables</h2>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="border-3 border-gray-800 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm transition-transform duration-150 hover:-translate-y-[1px] hover:shadow-brutal-md focus-brutal"
				on:click={randomize}
			>
				Randomize
			</button>
			<button
				type="button"
				class="border-3 border-gray-800 bg-brand-accent px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm transition-transform duration-150 hover:-translate-y-[1px] hover:shadow-brutal-md focus-brutal"
				on:click={addVar}
			>
				+ Add variable
			</button>
		</div>
	</div>

	<!-- Table -->
	<div class="flex-1 overflow-auto">
		{#if variableDefinitions.length === 0}
			<div
				class="m-6 border-3 border-dashed border-gray-400 p-8 text-center text-sm text-gray-500"
			>
				<p class="font-mono">No variables declared yet.</p>
				<p class="mt-2">
					Type <code class="bg-gray-100 px-1">{'{{'}anything{'}}'}</code> in the editor —
					variables auto-add on save.
				</p>
			</div>
		{:else}
			<table class="w-full border-separate border-spacing-0">
				<thead class="sticky top-0 z-10 bg-brand-bg">
					<tr class="border-b-2 border-gray-800">
						<th
							class="border-b-2 border-gray-800 px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700"
						>Name</th>
						<th
							class="border-b-2 border-gray-800 px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700"
						>Type</th>
						<th
							class="border-b-2 border-gray-800 px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700"
						>Default</th>
						<th
							class="border-b-2 border-gray-800 px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700"
						>Required</th>
						<th
							class="border-b-2 border-gray-800 px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700"
						>Raw HTML</th>
						<th
							class="border-b-2 border-gray-800 px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700"
						>Test value</th>
						<th class="border-b-2 border-gray-800"></th>
					</tr>
				</thead>
				<tbody>
					{#each variableDefinitions as v, i (i)}
						<tr class="border-b border-gray-200 hover:bg-brand-accent/10">
							<td class="px-4 py-2">
								<div class="flex items-center gap-2">
									<input
										type="text"
										value={v.name}
										on:input={(e) => updateVar(i, { name: e.target.value })}
										class="w-full border-2 border-gray-800 bg-white px-2 py-1 font-mono text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-accent"
									/>
									{#if autoAdded.includes(v.name)}
										<span
											class="border-2 border-gray-800 bg-brand-accent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-900"
										>
											Auto
										</span>
									{/if}
								</div>
							</td>
							<td class="px-4 py-2">
								<select
									value={v.type || 'text'}
									on:change={(e) => updateVar(i, { type: e.target.value })}
									class="border-2 border-gray-800 bg-white px-2 py-1 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent"
								>
									{#each TYPES as t}
										<option value={t}>{t}</option>
									{/each}
								</select>
							</td>
							<td class="px-4 py-2">
								<input
									type="text"
									value={v.defaultValue || ''}
									on:input={(e) =>
										updateVar(i, { defaultValue: e.target.value })}
									class="w-full border-2 border-gray-800 bg-white px-2 py-1 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent"
									placeholder="—"
								/>
							</td>
							<td class="px-4 py-2">
								<input
									type="checkbox"
									checked={v.validation?.required || false}
									on:change={(e) =>
										updateVar(i, {
											validation: {
												...(v.validation || {}),
												required: e.target.checked
											}
										})}
									class="h-4 w-4 border-2 border-gray-800 accent-brand-accent"
								/>
							</td>
							<td class="px-4 py-2">
								<label
									class="inline-flex items-center gap-1.5"
									title="Allow triple-brace {'{{{raw}}}'} rendering for this variable. DANGEROUS — user values become raw HTML."
								>
									<input
										type="checkbox"
										checked={v.allowRawHtml || false}
										on:change={(e) =>
											updateVar(i, { allowRawHtml: e.target.checked })}
										class="h-4 w-4 border-2 border-gray-800 accent-brand-danger"
									/>
									{#if v.allowRawHtml}
										<span
											class="font-mono text-[10px] font-bold uppercase text-brand-danger"
											>danger</span
										>
									{/if}
								</label>
							</td>
							<td class="px-4 py-2">
								<input
									type="text"
									value={testValues[v.name] || ''}
									on:input={(e) => {
										testValues = { ...testValues, [v.name]: e.target.value };
										emitChange();
									}}
									class="w-full border-2 border-gray-300 bg-white px-2 py-1 font-mono text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-accent"
									placeholder="sample"
								/>
							</td>
							<td class="px-4 py-2 text-right">
								<button
									type="button"
									on:click={() => removeVar(i)}
									class="font-mono text-xs text-gray-400 hover:text-brand-danger"
									aria-label="Remove variable {v.name}"
								>
									×
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
