<script>
	/**
	 * HtmlVariablesPanel — card-based editor for variableDefinitions.
	 *
	 * Dialect matches the dashboard's loud-brutalist language used by
	 * src/lib/components/dashboard/Template.svelte and the fabric
	 * editor's TopBar. Variables render as rounded-lg bordered CARDS
	 * (not a sharp table) so the overall surface feels like a sibling
	 * of the dashboard's template list + filter chips.
	 *
	 * AUTO-added variables show a red pill (matches the NEW badge on
	 * the engine picker modal). Randomize cycles ephemeral testValues
	 * only — persisted defaults are never overwritten implicitly.
	 */
	import { createEventDispatcher } from 'svelte';
	import { sampleAll } from '../../../utils/sample-variable-generator';

	/** @type {Array} — variableDefinitions persisted on the template */
	export let variableDefinitions = [];
	/** @type {object} — ephemeral {name: sampleValue} overlay, consumed by preview */
	export let testValues = {};
	/** @type {string[]} — names auto-added since the last user-triggered save */
	export let autoAdded = [];

	const dispatch = createEventDispatcher();

	const TYPES = [
		{ value: 'text', label: 'Text' },
		{ value: 'image', label: 'Image' },
		{ value: 'color', label: 'Color' },
		{ value: 'chart', label: 'Chart' },
		{ value: 'table', label: 'Table' }
	];

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

	function ackAutoAdded() {
		if (autoAdded.length === 0) return;
		autoAdded = [];
		dispatch('ackAutoAdded');
	}
</script>

<div class="flex h-full w-full flex-col bg-[#FFFDF8]" on:click={ackAutoAdded} role="presentation">
	<!-- Header strip — accent bg matching the engine picker modal + fabric TopBar's
	     yellow pills. Right side carries the two primary actions. -->
	<div
		class="flex flex-col gap-3 border-b-[3px] border-gray-900 bg-[#ffc480] px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
	>
		<div>
			<h2 class="text-lg font-black uppercase tracking-widest text-gray-900">
				Variables
			</h2>
			<p class="mt-0.5 text-[11px] font-bold text-gray-800">
				Declare the values your template accepts. Auto-added on save.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				on:click={randomize}
				class="flex items-center gap-2 rounded-xl border-[3px] border-gray-900 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-[3px_3px_0_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
			>
				<i class="fa fa-dice text-[11px]"></i>
				Randomize
			</button>
			<button
				type="button"
				on:click={addVar}
				class="flex items-center gap-2 rounded-xl border-[3px] border-gray-900 bg-gray-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
			>
				<i class="fa fa-plus text-[11px]"></i>
				Add
			</button>
		</div>
	</div>

	<!-- Cards list -->
	<div class="flex-1 overflow-auto p-6">
		{#if variableDefinitions.length === 0}
			<div
				class="mx-auto max-w-lg rounded-2xl border-[3px] border-dashed border-gray-300 bg-white p-10 text-center shadow-[6px_6px_0_0_#1f2937]/10"
			>
				<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-[3px] border-gray-900 bg-[#ffe066] shadow-[2px_2px_0_0_#1f2937]">
					<i class="fa fa-cube text-gray-900"></i>
				</div>
				<p class="text-sm font-black uppercase tracking-wider text-gray-900">No variables yet</p>
				<p class="mt-2 text-xs font-bold text-gray-600">
					Type
					<code class="rounded-md border-[2px] border-gray-900 bg-gray-900 px-1.5 py-0.5 font-mono text-[11px] text-[#ffc480]"
						>{'{{'}anything{'}}'}</code>
					in the editor — we'll auto-declare on save.
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each variableDefinitions as v, i (i)}
					<div
						class="group rounded-xl border-[3px] border-gray-900 bg-white p-4 shadow-[3px_3px_0_0_#1f2937] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_#1f2937]"
					>
						<!-- Top row: name + AUTO pill + remove -->
						<div class="flex items-start gap-3">
							<div class="flex-1 space-y-1">
								<div class="flex items-center gap-2">
									<label class="text-[10px] font-black uppercase tracking-widest text-gray-500"
										>Name</label>
									{#if autoAdded.includes(v.name)}
										<span
											class="inline-flex items-center gap-1 rounded border-[2px] border-gray-900 bg-[#ff6b6b] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#1f2937]"
										>
											<i class="fa fa-bolt text-[8px]"></i>
											Auto
										</span>
									{/if}
								</div>
								<input
									type="text"
									value={v.name}
									on:input={(e) => updateVar(i, { name: e.target.value })}
									class="w-full rounded-lg border-[2px] border-gray-900 bg-white px-3 py-2 font-mono text-sm font-bold text-gray-900 transition-all focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#ffc480] focus:outline-none"
								/>
							</div>

							<button
								type="button"
								on:click={() => removeVar(i)}
								aria-label="Remove variable {v.name}"
								class="mt-5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border-[2px] border-gray-900 bg-white text-gray-500 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#ff6b6b] hover:text-white hover:shadow-none"
							>
								<i class="fa fa-trash text-xs"></i>
							</button>
						</div>

						<!-- Second row: type + default + test -->
						<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
							<div class="space-y-1">
								<label class="text-[10px] font-black uppercase tracking-widest text-gray-500"
									>Type</label>
								<select
									value={v.type || 'text'}
									on:change={(e) => updateVar(i, { type: e.target.value })}
									class="w-full rounded-lg border-[2px] border-gray-900 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-900 transition-all focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#ffc480] focus:outline-none"
								>
									{#each TYPES as t}
										<option value={t.value}>{t.label}</option>
									{/each}
								</select>
							</div>

							<div class="space-y-1">
								<label class="text-[10px] font-black uppercase tracking-widest text-gray-500"
									>Default</label>
								<input
									type="text"
									value={v.defaultValue || ''}
									on:input={(e) => updateVar(i, { defaultValue: e.target.value })}
									class="w-full rounded-lg border-[2px] border-gray-900 bg-white px-3 py-2 font-mono text-xs text-gray-900 transition-all focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#ffc480] focus:outline-none"
									placeholder="—"
								/>
							</div>

							<div class="space-y-1">
								<label class="text-[10px] font-black uppercase tracking-widest text-gray-500"
									>Test value</label>
								<input
									type="text"
									value={testValues[v.name] || ''}
									on:input={(e) => {
										testValues = { ...testValues, [v.name]: e.target.value };
										emitChange();
									}}
									class="w-full rounded-lg border-[2px] border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700 transition-all focus:-translate-y-0.5 focus:border-gray-900 focus:bg-white focus:shadow-[3px_3px_0_0_#ffc480] focus:outline-none"
									placeholder="sample"
								/>
							</div>
						</div>

						<!-- Third row: toggles -->
						<div class="mt-3 flex flex-wrap items-center gap-3">
							<label
								class="inline-flex cursor-pointer items-center gap-2 rounded-lg border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 transition-all hover:shadow-[2px_2px_0_0_#1f2937]"
							>
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
									class="h-3.5 w-3.5 accent-[#ffc480]"
								/>
								Required
							</label>

							<label
								class="inline-flex cursor-pointer items-center gap-2 rounded-lg border-[2px] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all
									{v.allowRawHtml
										? 'border-gray-900 bg-[#ff6b6b] text-white shadow-[2px_2px_0_0_#1f2937]'
										: 'border-gray-900 bg-white text-gray-900 hover:shadow-[2px_2px_0_0_#1f2937]'}"
								title="Triple-brace raw HTML rendering — dangerous with untrusted values."
							>
								<input
									type="checkbox"
									checked={v.allowRawHtml || false}
									on:change={(e) => updateVar(i, { allowRawHtml: e.target.checked })}
									class="h-3.5 w-3.5 accent-white"
								/>
								{v.allowRawHtml ? '⚠ Raw HTML' : 'Raw HTML'}
							</label>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
