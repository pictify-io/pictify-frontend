<script>
	/**
	 * HtmlVariablesPanel — compact list + floating property editor.
	 *
	 * UX pattern (mirrors the canvas VariablesPanel + Figma/Notion):
	 *   - Each variable renders as a single-row chip showing name + type +
	 *     quick signals (required, allowRawHtml, auto-added).
	 *   - Clicking a row opens a FLOATING VariablePropertyPanel anchored to
	 *     the row. All properties (name, type, default, description,
	 *     required, allowRawHtml) live there, not inline.
	 *   - Top toolbar: Search, Randomize, Add, Select mode (bulk delete).
	 *
	 * Why the shift from the previous inline table:
	 *   - Scannability — 8 variables fit in the viewport now vs 2-3 before.
	 *   - Focus — editing one variable doesn't reflow the surrounding list.
	 *   - Consistency — matches the canvas editor's per-item properties
	 *     pattern (click a fabric object → PropertiesPanel).
	 */
	import { createEventDispatcher, tick } from 'svelte';
	import { sampleAll } from '../../../utils/sample-variable-generator';
	import VariablePropertyPanel from './VariablePropertyPanel.svelte';

	/** @type {Array} */
	export let variableDefinitions = [];
	/** @type {object} — ephemeral {name: value} overlay, consumed by preview */
	export let testValues = {};
	/** @type {string[]} */
	export let autoAdded = [];

	const dispatch = createEventDispatcher();

	// Floating-panel state: which row is open + its bounding rect
	let openIndex = null;
	let openAnchor = null;
	let rowEls = [];

	// Search + bulk select
	let searchQuery = '';
	let selectMode = false;
	let selectedNames = new Set();

	$: filteredDefinitions = searchQuery.trim()
		? variableDefinitions
				.map((v, i) => ({ v, i }))
				.filter(({ v }) =>
					v.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
				)
		: variableDefinitions.map((v, i) => ({ v, i }));

	$: allNames = variableDefinitions.map((v) => v && v.name).filter(Boolean);

	function emitChange() {
		dispatch('change', { variableDefinitions, testValues });
	}

	function ackAutoAdded() {
		if (autoAdded.length === 0) return;
		autoAdded = [];
		dispatch('ackAutoAdded');
	}

	async function openProperty(index, event) {
		if (selectMode) {
			toggleSelection(variableDefinitions[index].name);
			return;
		}
		// Toggle — clicking the already-open row closes it.
		if (openIndex === index) {
			openIndex = null;
			openAnchor = null;
			return;
		}
		openIndex = index;
		await tick();
		const rowEl = rowEls[index];
		if (rowEl) {
			const rect = rowEl.getBoundingClientRect();
			openAnchor = {
				top: rect.top,
				right: rect.right,
				bottom: rect.bottom,
				left: rect.left,
				width: rect.width,
				height: rect.height,
				trigger: rowEl
			};
		}
		ackAutoAdded();
	}

	function closePanel() {
		openIndex = null;
		openAnchor = null;
	}

	function applyPatch(event) {
		if (openIndex === null) return;
		const { patch } = event.detail;
		const oldName = variableDefinitions[openIndex]?.name;
		variableDefinitions = variableDefinitions.map((v, i) =>
			i === openIndex ? { ...v, ...patch } : v
		);
		// If the variable was renamed, migrate its test value too.
		if (patch.name && oldName && patch.name !== oldName) {
			if (testValues[oldName] !== undefined) {
				const next = { ...testValues };
				next[patch.name] = next[oldName];
				delete next[oldName];
				testValues = next;
			}
		}
		emitChange();
		closePanel();
	}

	function removeAtOpenIndex() {
		if (openIndex === null) return;
		const target = variableDefinitions[openIndex];
		if (!target?.name) return;
		// Defer the actual removal to the parent — it owns template.html and
		// can confirm + strip tokens before mutating variableDefinitions.
		dispatch('requestRemove', { names: [target.name] });
		closePanel();
	}

	function addVar() {
		const placeholder = `var_${variableDefinitions.length + 1}`;
		variableDefinitions = [
			...variableDefinitions,
			{
				name: placeholder,
				type: 'text',
				defaultValue: '',
				description: '',
				validation: { required: false }
			}
		];
		emitChange();
		// Auto-open the new row so the user can rename it immediately.
		openIndex = variableDefinitions.length - 1;
		tick().then(() => {
			const rowEl = rowEls[openIndex];
			if (rowEl) {
				const rect = rowEl.getBoundingClientRect();
				openAnchor = {
					top: rect.top,
					right: rect.right,
					bottom: rect.bottom,
					left: rect.left,
					width: rect.width,
					height: rect.height,
					trigger: rowEl
				};
			}
		});
	}

	async function randomize() {
		const generated = await sampleAll(variableDefinitions);
		testValues = { ...generated };
		emitChange();
	}

	// Bulk select
	function toggleSelection(name) {
		if (selectedNames.has(name)) selectedNames.delete(name);
		else selectedNames.add(name);
		selectedNames = new Set(selectedNames);
	}

	function toggleSelectAll() {
		if (selectedNames.size === variableDefinitions.length) {
			selectedNames = new Set();
		} else {
			selectedNames = new Set(variableDefinitions.map((v) => v.name));
		}
	}

	function exitSelectMode() {
		selectMode = false;
		selectedNames = new Set();
	}

	function bulkDelete() {
		if (selectedNames.size === 0) return;
		// Parent handles the confirm + HTML strip; we just announce intent.
		dispatch('requestRemove', { names: Array.from(selectedNames) });
		exitSelectMode();
		closePanel();
	}

	// Test-value handling — stays inline on the row for fast edit.
	function setTestValue(name, value) {
		testValues = { ...testValues, [name]: value };
		emitChange();
	}

	// Label helpers
	function typeLabel(type) {
		return (type || 'text').toUpperCase();
	}
</script>

<div class="flex h-full w-full flex-col bg-[#FFFDF8]">
	<!-- Header strip -->
	<div class="border-b-[3px] border-gray-900 bg-[#ffc480] px-6 py-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-lg font-black uppercase tracking-widest text-gray-900">
					Variables
				</h2>
				<p class="mt-0.5 text-[11px] font-bold text-gray-800">
					{variableDefinitions.length} declared · click to edit
				</p>
			</div>

			<div class="flex items-center gap-2">
				{#if selectMode}
					<button
						type="button"
						on:click={toggleSelectAll}
						class="rounded-lg border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
					>
						{selectedNames.size === variableDefinitions.length ? 'Clear' : 'All'}
					</button>
					<button
						type="button"
						on:click={bulkDelete}
						disabled={selectedNames.size === 0}
						class="flex items-center gap-1.5 rounded-lg border-[2px] border-gray-900 bg-[#ff6b6b] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						<i class="fa fa-trash text-[10px]"></i>
						Delete ({selectedNames.size})
					</button>
					<button
						type="button"
						on:click={exitSelectMode}
						class="rounded-lg border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
					>
						Done
					</button>
				{:else}
					<button
						type="button"
						on:click={randomize}
						title="Fill test values with faker data"
						class="flex items-center gap-1.5 rounded-lg border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
					>
						<i class="fa fa-dice text-[10px]"></i>
						Randomize
					</button>
					<button
						type="button"
						on:click={() => (selectMode = true)}
						title="Bulk select"
						class="flex items-center gap-1.5 rounded-lg border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
					>
						<i class="fa fa-list-check text-[10px]"></i>
						Select
					</button>
					<button
						type="button"
						on:click={addVar}
						class="flex items-center gap-1.5 rounded-lg border-[2px] border-gray-900 bg-gray-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
					>
						<i class="fa fa-plus text-[10px]"></i>
						Add
					</button>
				{/if}
			</div>
		</div>

		<!-- Search row -->
		{#if !selectMode && variableDefinitions.length > 3}
			<div class="mt-3 relative">
				<i
					class="fa fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500"
				></i>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="SEARCH VARIABLES..."
					class="w-full rounded-lg border-[2px] border-gray-900 bg-white py-2 pl-9 pr-3 text-[11px] font-black uppercase tracking-widest text-gray-900 placeholder-gray-400 transition-all focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#1f2937] focus:outline-none"
				/>
			</div>
		{/if}
	</div>

	<!-- Rows list -->
	<div class="flex-1 overflow-auto p-4">
		{#if variableDefinitions.length === 0}
			<div
				class="mx-auto mt-6 max-w-xl rounded-2xl border-[3px] border-gray-900 bg-white p-8 text-center shadow-[6px_6px_0_0_#1f2937]"
			>
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-[3px] border-gray-900 bg-[#ffe066] shadow-[2px_2px_0_0_#1f2937]"
				>
					<i class="fa fa-cube text-gray-900"></i>
				</div>
				<p class="text-sm font-black uppercase tracking-wider text-gray-900">
					No variables yet
				</p>
				<p class="mt-2 text-[13px] font-bold leading-relaxed text-gray-600">
					Two ways to declare a variable:
				</p>

				<!-- Two-path hint grid — shows both entry points so users don't
				     have to guess whether they're supposed to type in code or
				     click a button. -->
				<div class="mt-4 grid grid-cols-2 gap-3 text-left">
					<div class="rounded-lg border-[2px] border-gray-900 bg-[#FFFDF8] p-3">
						<div class="mb-2 flex items-center gap-2">
							<span class="flex h-5 w-5 items-center justify-center rounded-md border-[2px] border-gray-900 bg-[#ffc480] text-[9px] font-black text-gray-900">1</span>
							<span class="text-[10px] font-black uppercase tracking-widest text-gray-900">In code</span>
						</div>
						<p class="text-[11px] font-semibold leading-snug text-gray-700">
							Type <code class="rounded border-[1.5px] border-gray-900 bg-gray-900 px-1 py-0.5 font-mono text-[10px] text-[#ffc480]">{'{{'}name{'}}'}</code> anywhere. We auto-declare it.
						</p>
					</div>
					<div class="rounded-lg border-[2px] border-gray-900 bg-[#FFFDF8] p-3">
						<div class="mb-2 flex items-center gap-2">
							<span class="flex h-5 w-5 items-center justify-center rounded-md border-[2px] border-gray-900 bg-[#4ade80] text-[9px] font-black text-gray-900">2</span>
							<span class="text-[10px] font-black uppercase tracking-widest text-gray-900">Right here</span>
						</div>
						<p class="text-[11px] font-semibold leading-snug text-gray-700">
							Click <span class="font-mono text-gray-900">+ Add variable</span> below to declare manually.
						</p>
					</div>
				</div>

				<button
					type="button"
					on:click={addVar}
					class="mt-5 inline-flex items-center gap-2 rounded-lg border-[2px] border-gray-900 bg-gray-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_0_#ffc480] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				>
					<i class="fa fa-plus text-[10px]"></i>
					Add variable
				</button>
			</div>
		{:else if filteredDefinitions.length === 0}
			<div class="mt-6 text-center text-xs font-bold text-gray-500">
				No variables match "<span class="font-mono text-gray-900">{searchQuery}</span>"
			</div>
		{:else}
			<div class="space-y-2">
				{#each filteredDefinitions as { v, i } (i)}
					<div
						bind:this={rowEls[i]}
						role="button"
						tabindex="0"
						aria-expanded={openIndex === i}
						on:click={(e) => openProperty(i, e)}
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								openProperty(i, e);
							}
						}}
						class="group flex cursor-pointer items-center gap-3 rounded-lg border-[2px] px-3 py-2 transition-all
							{openIndex === i
								? 'border-gray-900 bg-[#ffc480]/20 shadow-[3px_3px_0_0_#1f2937] -translate-x-[1px] -translate-y-[1px]'
								: selectMode && selectedNames.has(v.name)
									? 'border-gray-900 bg-[#ffc480]/30 shadow-[2px_2px_0_0_#1f2937]'
									: 'border-gray-900 bg-white hover:shadow-[2px_2px_0_0_#1f2937] hover:-translate-x-[1px] hover:-translate-y-[1px]'}"
					>
						<!-- Selection checkbox (visible only in select mode) -->
						{#if selectMode}
							<input
								type="checkbox"
								checked={selectedNames.has(v.name)}
								on:click|stopPropagation
								on:change={() => toggleSelection(v.name)}
								class="h-4 w-4 flex-shrink-0 accent-[#ffc480]"
							/>
						{:else}
							<!-- Drag handle (visual only for now — a proper dnd lib is out of scope) -->
							<div class="flex h-6 w-6 flex-shrink-0 items-center justify-center text-gray-300 group-hover:text-gray-500">
								<i class="fa fa-grip-vertical text-[10px]"></i>
							</div>
						{/if}

						<!-- Name + signals -->
						<div class="flex min-w-0 flex-1 items-center gap-2">
							<span
								class="truncate font-mono text-sm font-bold text-gray-900"
								title={v.name}
							>
								{v.name}
							</span>
							<span
								class="inline-flex flex-shrink-0 items-center rounded-md border-[1.5px] border-gray-900 bg-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-gray-600"
							>
								{typeLabel(v.type)}
							</span>
							{#if v.validation?.required}
								<i
									class="fa fa-asterisk text-[9px] text-gray-500"
									title="Required"
								></i>
							{/if}
							{#if v.allowRawHtml}
								<span
									class="inline-flex flex-shrink-0 items-center gap-1 rounded-md border-[1.5px] border-gray-900 bg-[#ff6b6b] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white"
									title="Renders as raw HTML"
								>
									<i class="fa fa-triangle-exclamation text-[8px]"></i>
									Raw
								</span>
							{/if}
							{#if autoAdded.includes(v.name)}
								<span
									class="inline-flex flex-shrink-0 items-center gap-1 rounded-md border-[1.5px] border-gray-900 bg-[#ffc480] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-gray-900"
								>
									<i class="fa fa-bolt text-[8px]"></i>
									Auto
								</span>
							{/if}
						</div>

						<!-- Inline test value (stays on row — it's the most-edited field).
						     Array/object types edit their sample data in the floating
						     inspector instead, so we show a read-only preview chip here. -->
						{#if !selectMode}
							{#if v.type === 'array' || v.type === 'object'}
								<span
									class="hidden w-40 flex-shrink-0 items-center gap-1.5 overflow-hidden rounded-md border-[1.5px] border-gray-300 bg-gray-50 px-2 py-1 font-mono text-[11px] text-gray-500 sm:inline-flex"
									title="Edit {v.type} data in the inspector"
								>
									<i class="fa {v.type === 'array' ? 'fa-brackets-square' : 'fa-braces'} text-[9px]"></i>
									<span class="truncate">
										{#if v.type === 'array' && Array.isArray(v.defaultValue)}
											{v.defaultValue.length} item{v.defaultValue.length === 1 ? '' : 's'}
										{:else if v.type === 'object' && v.defaultValue && typeof v.defaultValue === 'object'}
											{Object.keys(v.defaultValue).length} field{Object.keys(v.defaultValue).length === 1 ? '' : 's'}
										{:else}
											empty
										{/if}
									</span>
								</span>
							{:else}
								<input
									type="text"
									value={testValues[v.name] || ''}
									on:click|stopPropagation
									on:input={(e) => setTestValue(v.name, e.target.value)}
									placeholder={v.defaultValue || 'test value'}
									class="hidden w-40 flex-shrink-0 rounded-md border-[1.5px] border-gray-300 bg-gray-50 px-2 py-1 font-mono text-[11px] text-gray-700 focus:-translate-y-0.5 focus:border-gray-900 focus:bg-white focus:shadow-[2px_2px_0_0_#ffc480] focus:outline-none sm:inline-block"
								/>
							{/if}
						{/if}

						<!-- Chevron affordance -->
						<i
							class="fa fa-chevron-right flex-shrink-0 text-[10px] text-gray-400 transition-transform
								{openIndex === i ? 'rotate-90 text-gray-900' : ''}"
						></i>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Floating inspector -->
{#if openIndex !== null && variableDefinitions[openIndex]}
	<VariablePropertyPanel
		variable={variableDefinitions[openIndex]}
		anchorRect={openAnchor}
		{allNames}
		on:apply={applyPatch}
		on:remove={removeAtOpenIndex}
		on:close={closePanel}
	/>
{/if}
