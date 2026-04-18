<script>
	/**
	 * VariablePropertyPanel — floating inspector anchored to a triggering
	 * row (Notion/Figma pattern).
	 *
	 * Opens when the user clicks a variable row. Closes on:
	 *   - Escape key
	 *   - Click outside the panel or the trigger
	 *   - Explicit close button
	 *
	 * Positioning strategy:
	 *   - anchor = the triggering row's bounding rect
	 *   - panel is placed to the RIGHT of the panel pane when there's space,
	 *     otherwise flips LEFT
	 *   - vertically aligns to the row's top, clamped into the viewport
	 *
	 * Design matches the dashboard dialect: rounded-xl border-[3px] frame,
	 * 4px brutal shadow, font-black uppercase labels, press-in input focus.
	 */
	import { createEventDispatcher, onMount, onDestroy, tick } from 'svelte';

	/** @type {object | null} — the variable being edited */
	export let variable = null;
	/** @type {DOMRect | null} — bounding rect of the triggering row */
	export let anchorRect = null;
	/** @type {string[]} — all variable names, for duplicate validation */
	export let allNames = [];

	const dispatch = createEventDispatcher();

	const TYPES = [
		{ value: 'text', label: 'Text' },
		{ value: 'image', label: 'Image URL' },
		{ value: 'color', label: 'Color' },
		{ value: 'chart', label: 'Chart' },
		{ value: 'table', label: 'Table' }
	];

	// Local draft — apply on blur or explicit save to avoid flooding the
	// parent (and the backend preview) with keystroke-level updates.
	let draft = null;
	let nameError = null;
	let panelEl;
	let style = '';

	// Seed draft only when the `variable` prop changes identity. If we
	// reassigned on every reactive tick, bind:value={draft.name} would
	// race the reseed on every keystroke and the input would appear to
	// swallow keys (Svelte keeps reverting draft back to `variable`).
	let lastSeededVariable = null;
	$: if (variable && variable !== lastSeededVariable) {
		draft = { ...variable };
		lastSeededVariable = variable;
	}

	// Name validation runs on every draft change; independent from the
	// draft-seeding statement above so the two reactive groups don't
	// cross-invalidate.
	$: nameError = (() => {
		if (!draft || !draft.name) return draft ? 'Name is required' : null;
		if (!draft.name.trim()) return 'Name is required';
		if (!/^[a-zA-Z_][\w]*$/.test(draft.name)) {
			return 'Letters, numbers, underscores — start with a letter';
		}
		if (
			allNames.filter((n) => n !== variable?.name).includes(draft.name)
		) {
			return 'Another variable already uses this name';
		}
		return null;
	})();

	/**
	 * Compute panel position from the anchor rect.
	 * Uses tick() so the panel element exists in the DOM before we measure it.
	 */
	async function computePosition() {
		if (!anchorRect) return;
		await tick();
		if (!panelEl) return;

		const margin = 12;
		const panelWidth = panelEl.offsetWidth;
		const panelHeight = panelEl.offsetHeight;
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		// Prefer to anchor to the RIGHT of the row (row is in left pane, panel
		// floats out into the preview pane). If that doesn't fit, flip left.
		let left = anchorRect.right + margin;
		if (left + panelWidth + margin > vw) {
			left = anchorRect.left - panelWidth - margin;
		}
		// Clamp to viewport on both axes.
		left = Math.max(margin, Math.min(left, vw - panelWidth - margin));
		let top = Math.max(margin, anchorRect.top);
		if (top + panelHeight + margin > vh) {
			top = Math.max(margin, vh - panelHeight - margin);
		}

		style = `position: fixed; top: ${top}px; left: ${left}px; z-index: 60;`;
	}

	function onKeydown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		}
	}

	function onClickOutside(e) {
		if (!panelEl) return;
		// Ignore clicks on the triggering row — the parent is responsible
		// for toggling via its own click handler.
		if (panelEl.contains(e.target)) return;
		// Ignore clicks on the row that opened us.
		const triggerRow = anchorRect?.trigger;
		if (triggerRow && triggerRow.contains && triggerRow.contains(e.target)) return;
		close();
	}

	function close() {
		dispatch('close');
	}

	function apply() {
		if (nameError) return;
		dispatch('apply', { patch: draft });
	}

	function remove() {
		dispatch('remove');
	}

	onMount(() => {
		computePosition();
		window.addEventListener('keydown', onKeydown);
		// Use capture to see outside clicks before they're swallowed.
		window.addEventListener('mousedown', onClickOutside, true);
		window.addEventListener('resize', computePosition);
		return () => {
			window.removeEventListener('keydown', onKeydown);
			window.removeEventListener('mousedown', onClickOutside, true);
			window.removeEventListener('resize', computePosition);
		};
	});

	// Recompute when the anchor changes (row re-renders).
	$: if (anchorRect) computePosition();
</script>

{#if draft}
	<div
		bind:this={panelEl}
		{style}
		role="dialog"
		aria-modal="false"
		aria-label="Edit variable"
		class="w-[360px] rounded-xl border-[3px] border-gray-900 bg-white shadow-[6px_6px_0_0_#1f2937]"
	>
		<!-- Header -->
		<div
			class="flex items-center justify-between gap-3 border-b-[3px] border-gray-900 bg-[#ffc480] px-4 py-3"
		>
			<div class="flex items-center gap-2">
				<div class="flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937]">
					<i class="fa fa-cube text-[11px] text-gray-900"></i>
				</div>
				<h3 class="text-[11px] font-black uppercase tracking-widest text-gray-900">
					Variable
				</h3>
			</div>
			<button
				type="button"
				on:click={close}
				aria-label="Close"
				class="flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white text-gray-700 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-900 hover:text-white hover:shadow-none"
			>
				<i class="fa fa-xmark text-[11px]"></i>
			</button>
		</div>

		<!-- Body -->
		<div class="space-y-4 p-4">
			<!-- Name -->
			<div class="space-y-1">
				<label class="block text-[10px] font-black uppercase tracking-widest text-gray-900"
					>Name</label>
				<input
					type="text"
					value={draft.name ?? ''}
					on:input={(e) => (draft = { ...draft, name: e.target.value })}
					autocomplete="off"
					spellcheck="false"
					class="w-full rounded-lg border-[2px] border-gray-900 bg-white px-3 py-2 font-mono text-sm font-bold text-gray-900 transition-all focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#ffc480] focus:outline-none"
				/>
				{#if nameError}
					<p class="text-[10px] font-black uppercase tracking-wider text-[#ff5252]">
						<i class="fa fa-triangle-exclamation mr-1 text-[9px]"></i>
						{nameError}
					</p>
				{:else}
					<p class="text-[10px] font-mono text-gray-500">
						Reference as <code class="text-[#c88a3b]">{'{{' + draft.name + '}}'}</code>
					</p>
				{/if}
			</div>

			<!-- Type -->
			<div class="space-y-1">
				<label class="block text-[10px] font-black uppercase tracking-widest text-gray-900"
					>Type</label>
				<div class="grid grid-cols-5 gap-1.5">
					{#each TYPES as t}
						<button
							type="button"
							on:click={() => (draft = { ...draft, type: t.value })}
							class="rounded-md border-[2px] border-gray-900 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all
								{draft.type === t.value
									? 'bg-gray-900 text-white shadow-[2px_2px_0_0_#1f2937]'
									: 'bg-white text-gray-700 hover:shadow-[1px_1px_0_0_#1f2937]'}"
							title={t.label}
						>
							{t.label.slice(0, 4)}
						</button>
					{/each}
				</div>
			</div>

			<!-- Default value -->
			<div class="space-y-1">
				<label class="block text-[10px] font-black uppercase tracking-widest text-gray-900"
					>Default</label>
				<input
					type="text"
					value={draft.defaultValue ?? ''}
					on:input={(e) => (draft = { ...draft, defaultValue: e.target.value })}
					placeholder="—"
					autocomplete="off"
					class="w-full rounded-lg border-[2px] border-gray-900 bg-white px-3 py-2 font-mono text-xs text-gray-900 transition-all focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#ffc480] focus:outline-none"
				/>
			</div>

			<!-- Description -->
			<div class="space-y-1">
				<label class="block text-[10px] font-black uppercase tracking-widest text-gray-900"
					>Description <span class="text-gray-400">(optional)</span></label>
				<textarea
					value={draft.description ?? ''}
					on:input={(e) => (draft = { ...draft, description: e.target.value })}
					rows="2"
					placeholder="What is this variable for?"
					class="w-full resize-none rounded-lg border-[2px] border-gray-900 bg-white px-3 py-2 text-xs text-gray-700 transition-all focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#ffc480] focus:outline-none"
				></textarea>
			</div>

			<!-- Toggles -->
			<div class="space-y-2">
				<!-- Required -->
				<label
					class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border-[2px] border-gray-900 bg-white px-3 py-2 transition-all hover:shadow-[2px_2px_0_0_#1f2937]"
				>
					<div class="flex items-center gap-2">
						<i class="fa fa-asterisk text-[10px] text-gray-700"></i>
						<span class="text-[10px] font-black uppercase tracking-widest text-gray-900"
							>Required</span>
					</div>
					<input
						type="checkbox"
						checked={draft.validation?.required || false}
						on:change={(e) => {
							draft = {
								...draft,
								validation: {
									...(draft.validation || {}),
									required: e.target.checked
								}
							};
						}}
						class="h-4 w-4 accent-[#ffc480]"
					/>
				</label>

				<!-- Raw HTML — danger treatment when ON -->
				<label
					class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border-[2px] px-3 py-2 transition-all
						{draft.allowRawHtml
							? 'border-gray-900 bg-[#ff6b6b] text-white shadow-[2px_2px_0_0_#1f2937]'
							: 'border-gray-900 bg-white text-gray-900 hover:shadow-[2px_2px_0_0_#1f2937]'}"
				>
					<div class="flex items-center gap-2">
						<i
							class="fa {draft.allowRawHtml
								? 'fa-triangle-exclamation'
								: 'fa-code'} text-[10px]"
						></i>
						<span class="text-[10px] font-black uppercase tracking-widest">
							{draft.allowRawHtml ? 'Raw HTML · dangerous' : 'Allow raw HTML'}
						</span>
					</div>
					<input
						type="checkbox"
						checked={draft.allowRawHtml || false}
						on:change={(e) => (draft = { ...draft, allowRawHtml: e.target.checked })}
						class="h-4 w-4 accent-white"
					/>
				</label>

				{#if draft.allowRawHtml}
					<p
						class="rounded-md border-[2px] border-gray-900 bg-[#ff6b6b]/10 px-3 py-2 text-[10px] font-bold text-gray-800"
					>
						<i class="fa fa-info-circle mr-1"></i>
						Use <code class="text-[#c88a3b]">{'{{{' + draft.name + '}}}'}</code> in the
						template to render this variable's value as raw HTML.
					</p>
				{/if}
			</div>
		</div>

		<!-- Footer -->
		<div
			class="flex items-center justify-between gap-2 border-t-[3px] border-gray-900 bg-gray-50 px-4 py-3"
		>
			<button
				type="button"
				on:click={remove}
				class="inline-flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-700 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#ff6b6b] hover:text-white hover:shadow-none"
			>
				<i class="fa fa-trash text-[10px]"></i>
				Delete
			</button>
			<div class="flex items-center gap-2">
				<button
					type="button"
					on:click={close}
					class="rounded-md border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={apply}
					disabled={!!nameError}
					class="rounded-md border-[2px] border-gray-900 bg-gray-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0_0_#1f2937]"
				>
					<i class="fa fa-check mr-1 text-[10px]"></i>
					Apply
				</button>
			</div>
		</div>
	</div>
{/if}
