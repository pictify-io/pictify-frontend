<script>
	import { createEventDispatcher } from 'svelte';
	import { selectedComponent, editor, editorActions } from '../../../store/editor.store';
	import { canUndo, canRedo, triggerUndo, triggerRedo } from '../../../store/history.store';
	
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
</script>

<div class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm z-20 relative flex-shrink-0">
	<div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 mr-4">
		<a href="/dashboard/template" class="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 group">
			<i class="fa fa-arrow-left group-hover:-translate-x-0.5 transition-transform"></i>
		</a>
		<div class="h-6 w-px bg-gray-200 hidden sm:block flex-shrink-0"></div>
		<div class="flex-1 min-w-0 max-w-md relative group">
			<input
				type="text"
				bind:value={templateName}
				placeholder="Untitled Design"
				class="w-full text-base sm:text-lg font-semibold text-gray-900 border-transparent focus:border-blue-500 focus:ring-0 p-0 bg-transparent rounded px-2 transition-all placeholder-gray-400 hover:bg-gray-50 focus:bg-white"
			/>
			<i class="fa fa-pencil absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></i>
		</div>
	</div>
	<div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
		<div class="hidden sm:flex items-center gap-1 mr-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
			<button 
				class="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow"
				on:click={undo}
				disabled={!$canUndo}
				title="Undo (Cmd+Z)"
			>
				<i class="fa fa-undo text-sm"></i>
			</button>
			<button 
				class="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow"
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
		
		<button
			class="px-4 sm:px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-gray-200"
			on:click={save}
			disabled={isSaving}
		>
			{#if isSaving}
				<i class="fa fa-spinner fa-spin"></i>
			{/if}
			<span class="hidden sm:inline">Save Changes</span>
			<span class="sm:hidden">Save</span>
		</button>
	</div>
</div>
