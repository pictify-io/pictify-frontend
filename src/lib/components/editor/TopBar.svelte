<script>
	import { createEventDispatcher } from 'svelte';
	import { selectedComponent, editor, editorActions } from '../../../store/editor.store';
	import { canUndo, canRedo, triggerUndo, triggerRedo, isDirty, triggerMarkSaved } from '../../../store/history.store';
	
	export let templateName = '';
	export let isSaving = false;

	const dispatch = createEventDispatcher();

	function save() {
		console.log('TopBar: Save clicked');
		dispatch('save');
	}

	function deleteSelected() {
		if ($editor && $selectedComponent) {
			$editor.remove($selectedComponent);
			$editor.discardActiveObject();
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

<div class="h-16 bg-[#FFFDF8] border-b-2 border-black flex items-center justify-between px-4 sm:px-6 shadow-sm z-20 relative flex-shrink-0">
	<div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 mr-4">
		<a href="/dashboard/template" class="text-gray-500 hover:text-[#ff6b6b] transition-colors p-2 hover:bg-white/50 rounded-lg flex-shrink-0 group">
			<i class="fa fa-arrow-left group-hover:-translate-x-0.5 transition-transform"></i>
		</a>
		<div class="h-6 w-px bg-black/20 hidden sm:block flex-shrink-0"></div>
		<div class="flex-1 min-w-0 max-w-md relative group">
			<input
				type="text"
				bind:value={templateName}
				placeholder="Untitled Design"
				class="w-full text-base sm:text-lg font-semibold text-gray-900 border border-transparent focus:border-[#ff6b6b] focus:ring-2 focus:ring-[#ff6b6b]/20 p-0 bg-transparent rounded px-2 transition-all placeholder-gray-400 hover:bg-white/50 focus:bg-white"
			/>
			<i class="fa fa-pencil absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></i>
		</div>
	</div>
	<div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
		<div class="hidden sm:flex items-center gap-1 mr-2 bg-white/50 p-1 rounded-lg border-2 border-black/10">
			<button 
				class="p-2 text-gray-500 hover:text-[#ff6b6b] hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow"
				on:click={undo}
				disabled={!$canUndo}
				title="Undo (Cmd+Z)"
			>
				<i class="fa fa-undo text-sm"></i>
			</button>
			<button 
				class="p-2 text-gray-500 hover:text-[#ff6b6b] hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow"
				on:click={redo}
				disabled={!$canRedo}
				title="Redo (Cmd+Shift+Z)"
			>
				<i class="fa fa-redo text-sm"></i>
			</button>
		</div>
		
		{#if $selectedComponent}
			<div class="h-6 w-px bg-gray-200 hidden sm:block"></div>
			<button
				class="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
				on:click={deleteSelected}
				title="Delete selected element"
			>
				<i class="fa fa-trash"></i>
			</button>
		{/if}
		
		<div class="h-6 w-px bg-gray-200 hidden sm:block"></div>
		
		<div class="relative group">
			{#if $isDirty}
				<div class="w-full rounded-lg bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10 transition-transform duration-300 ease-out group-hover:translate-y-2 group-hover:translate-x-2" />
			{/if}
			<button
				class="px-4 sm:px-5 py-2 text-sm font-semibold rounded-lg z-20 relative border-[3px] transition-all flex items-center gap-2
				{$isDirty 
					? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffc480] text-white border-gray-900 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 shadow-md hover:shadow-lg' 
					: 'bg-white text-gray-500 border-gray-200 cursor-default'}"
				on:click={save}
				disabled={isSaving}
			>
				{#if isSaving}
					<i class="fa fa-spinner fa-spin"></i>
					<span class="hidden sm:inline">Saving...</span>
				{:else if $isDirty}
					<span class="hidden sm:inline">Save Changes</span>
					<span class="sm:hidden">Save</span>
				{:else}
					<i class="fa fa-check text-green-500"></i>
					<span class="hidden sm:inline">Saved</span>
					<span class="sm:hidden">Saved</span>
				{/if}
			</button>
		</div>
	</div>
</div>
