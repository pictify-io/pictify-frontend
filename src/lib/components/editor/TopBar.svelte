<script>
	import { createEventDispatcher } from 'svelte';
	import { selectedComponent, editor, editorActions } from '../../../store/editor.store';
	import { canUndo, canRedo, triggerUndo, triggerRedo, isDirty, triggerMarkSaved } from '../../../store/history.store';
	import { outputFormat, pdfPreset, pageActions } from '../../../store/pages.store';
	import { showToast } from '../../../store/toast.store';

	export let templateName = '';
	export let isSaving = false;
	export let guestMode = false;
	export let backHref = '/dashboard/template';

	const dispatch = createEventDispatcher();

	// Auto-saved indicator
	let showAutoSaved = false;
	let autoSavedTimer = null;

	// PDF presets for dropdown
	const pdfPresets = [
		{ value: 'A4', label: 'A4' },
		{ value: 'A4_LANDSCAPE', label: 'A4 Landscape' },
		{ value: 'LETTER', label: 'Letter' },
		{ value: 'LETTER_LANDSCAPE', label: 'Letter Landscape' },
		{ value: 'LEGAL', label: 'Legal' },
		{ value: 'A3', label: 'A3' },
		{ value: 'TABLOID', label: 'Tabloid' }
	];

	function save() {
		console.log('TopBar: Save clicked');
		dispatch('save');
	}

	export function showAutoSavedIndicator() {
		showAutoSaved = true;
		if (autoSavedTimer) clearTimeout(autoSavedTimer);
		autoSavedTimer = setTimeout(() => {
			showAutoSaved = false;
		}, 2000);
		showToast('Auto-saved', 'success', 1500);
	}

	function deleteSelected() {
		if ($editor && $selectedComponent) {
			const active = $selectedComponent;
			// Handle multi-selection (ActiveSelection contains multiple objects)
			if (active.type === 'activeselection' || active.type === 'ActiveSelection') {
				const objects = active.getObjects().concat();
				$editor.discardActiveObject();
				objects.forEach(obj => $editor.remove(obj));
			} else {
				$editor.remove(active);
				$editor.discardActiveObject();
			}
			$editor.renderAll();
			editorActions.clearSelection();
		}
	}

	function undo() {
		triggerUndo.update(n => n + 1);
	}

	function redo() {
		triggerRedo.update(n => n + 1);
	}

	function toggleOutputFormat() {
		const newFormat = $outputFormat === 'image' ? 'pdf' : 'image';
		pageActions.setOutputFormat(newFormat);
	}

	function handlePresetChange(event) {
		pageActions.setPdfPreset(event.target.value);
	}

	// Watch for save completion to mark as clean
	$: if (isSaving === false) {
		// We need to know if we just finished saving.
		// Since isSaving is a prop, we can't easily know the previous value without a local var.
		// However, if we assume the parent handles the save and sets isSaving back to false,
		// we might need a more robust way.
		// But let's try this: when isSaving becomes false, if we were dirty, we mark as saved.
		// Actually, better to just trigger it when isSaving goes false, assuming it was true before.
		// But wait, isSaving is false initially.
	}

	let wasSaving = false;
	$: {
		if (wasSaving && !isSaving) {
			console.log('TopBar: Save completed, marking as clean');
			triggerMarkSaved.update(n => n + 1);
		}
		wasSaving = isSaving;
	}
</script>

<div class="h-16 bg-[#FFFDF8] border-b-[3px] border-gray-900 flex items-center justify-between px-4 sm:px-6 shadow-sm z-20 relative flex-shrink-0">
	<div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 mr-4">
		<a href={guestMode ? '/tools#workflows' : backHref} class="flex items-center justify-center w-10 h-10 bg-white border-[3px] border-gray-900 rounded-lg text-gray-900 hover:bg-gray-900 hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0_0_#1f2937] transition-all flex-shrink-0 group">
			<i class="fa fa-arrow-left text-sm group-hover:-translate-x-0.5 transition-transform"></i>
		</a>
		<div class="h-8 w-[3px] bg-gray-900 hidden sm:block flex-shrink-0 rounded-full"></div>
		<div class="flex-1 min-w-0 max-w-md relative group">
			<input
				type="text"
				bind:value={templateName}
				placeholder="UNTITLED DESIGN"
				class="w-full text-sm sm:text-base font-black uppercase tracking-wider text-gray-900 border-2 border-transparent focus:border-gray-900 focus:bg-white focus:shadow-[4px_4px_0_0_#ffc480] p-2 bg-transparent rounded-lg transition-all placeholder-gray-400 hover:bg-white hover:border-gray-200"
			/>
			<i class="fa fa-pencil absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></i>
		</div>

		<!-- Output Format Toggle Removed (Moved to separate routes) -->
	</div>
<div class="flex items-center gap-3 sm:gap-4 flex-shrink-0">
		<!-- Status indicators -->
		{#if $isDirty && !isSaving}
			<div class="hidden sm:flex items-center px-3 py-1.5 bg-[#ffe066] border-[2px] border-gray-900 rounded-md shadow-[2px_2px_0_0_#1f2937] transform -rotate-1 hover:rotate-0 transition-all cursor-help" title="Don't forget to save!">
				<div class="relative flex h-2.5 w-2.5 mr-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6b6b] opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff5252] border-[1.5px] border-gray-900"></span>
				</div>
				<span class="text-[10px] font-black text-gray-900 uppercase tracking-widest mt-[1px]">
					Unsaved
				</span>
			</div>
		{:else if showAutoSaved}
			<div class="hidden sm:flex items-center px-3 py-1.5 bg-[#4ade80] border-[2px] border-gray-900 rounded-md shadow-[2px_2px_0_0_#1f2937] transform rotate-1 hover:rotate-0 transition-all cursor-default">
				<i class="fa fa-sparkles text-[10px] text-gray-900 mr-1.5"></i>
				<span class="text-[10px] font-black text-gray-900 uppercase tracking-widest mt-[1px]">
					Auto-saved
				</span>
			</div>
		{/if}

		<div class="hidden sm:flex items-center gap-2 mr-2">
			<button
				class="w-9 h-9 flex items-center justify-center bg-white border-[3px] border-gray-900 rounded-lg text-gray-900 transition-all shadow-[3px_3px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:bg-gray-100"
				on:click={undo}
				disabled={!$canUndo}
				title="Undo (Cmd+Z)"
			>
				<i class="fa fa-undo text-xs"></i>
			</button>
			<button
				class="w-9 h-9 flex items-center justify-center bg-white border-[3px] border-gray-900 rounded-lg text-gray-900 transition-all shadow-[3px_3px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:bg-gray-100"
				on:click={redo}
				disabled={!$canRedo}
				title="Redo (Cmd+Shift+Z)"
			>
				<i class="fa fa-redo text-xs"></i>
			</button>
		</div>

		{#if $selectedComponent}
			<div class="h-8 w-[3px] bg-gray-900 hidden sm:block rounded-full"></div>
			<button
				class="w-9 h-9 flex items-center justify-center bg-[#ff6b6b] border-[3px] border-gray-900 rounded-lg text-white transition-all shadow-[3px_3px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#ff5252]"
				on:click={deleteSelected}
				title="Delete selected element"
			>
				<i class="fa fa-trash text-xs"></i>
			</button>
		{/if}

		<div class="h-8 w-[3px] bg-gray-900 hidden sm:block rounded-full"></div>

		<div class="relative">
			<button
				class="px-4 sm:px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl border-[3px] border-gray-900 transition-all flex items-center gap-2
				{guestMode
					? 'bg-[#ff6b6b] text-white shadow-[4px_4px_0_0_#1f2937] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#ff5252]'
					: ($isDirty
						? 'bg-[#4ade80] text-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]'
						: 'bg-gray-100 text-gray-400 cursor-default')}"
				on:click={save}
				disabled={guestMode ? isSaving : (isSaving || !$isDirty)}
			>
				{#if isSaving}
					<i class="fa fa-spinner fa-spin"></i>
					<span class="hidden sm:inline">Saving...</span>
				{:else if guestMode}
					<i class="fa fa-lock"></i>
					<span class="hidden sm:inline">Save (free account)</span>
					<span class="sm:hidden">Save</span>
				{:else if $isDirty}
					<i class="fa fa-save"></i>
					<span class="hidden sm:inline">Save</span>
					<span class="sm:hidden">Save</span>
				{:else}
					<i class="fa fa-check"></i>
					<span class="hidden sm:inline">Saved</span>
					<span class="sm:hidden">Saved</span>
				{/if}
			</button>
		</div>
	</div>
</div>
