<script>
	import { createEventDispatcher } from 'svelte';
	import TopBar from './TopBar.svelte';
	
	const dispatch = createEventDispatcher();
	import LeftSidebar from './LeftSidebar.svelte';
	import AssetPanel from './AssetPanel.svelte';
	import Canvas from './Canvas.svelte';
	import PropertiesPanel from './PropertiesPanel.svelte';
	import LayersPanel from './LayersPanel.svelte';
	import AlignmentGuides from './AlignmentGuides.svelte';
	import { selectedComponent, canvasZoom, activeSidebarTab, activeRightSidebarTab, editorActions } from '../../../store/editor.store';
	import FloatingCopilot from './FloatingCopilot.svelte';

	export let templateName = '';
	export let isSaving = false;

	function setRightTab(tab) {
		editorActions.toggleRightSidebarTab(tab);
	}
</script>

<div class="flex h-full w-full bg-white overflow-hidden relative">
	<!-- Left Sidebar (Full Height) -->
	<LeftSidebar />
	
	<!-- Asset Panel (Full Height, Collapsible) -->
	{#if $activeSidebarTab}
		<div class="asset-panel-container h-full flex-shrink-0 z-10 relative w-72 bg-white border-r border-gray-200">
			<AssetPanel />
		</div>
	{/if}

	<!-- Central Area (TopBar + Canvas) -->
	<div class="flex flex-col flex-1 overflow-hidden relative min-w-0">
		<TopBar bind:templateName {isSaving} on:save={() => { console.log('EditorLayout: save event received'); dispatch('save'); }} />
		<div class="relative flex-1 overflow-hidden">
			<AlignmentGuides />
			<Canvas />
			
			{#if $selectedComponent}
				<FloatingCopilot element={$selectedComponent} scale={$canvasZoom / 100} />
			{/if}
		</div>
	</div>
	
	<!-- Right Sidebar Container (Full Height) -->
	<div class="right-sidebar-container flex flex-col h-full border-l border-gray-200 bg-white shadow-sm z-10 transition-all duration-300 flex-shrink-0"
			style="width: {$activeRightSidebarTab ? '280px' : '40px'};">
		
		<!-- Right Sidebar Tabs -->
		<div class="flex border-b border-gray-200 bg-gray-50">
			<button 
				class="flex-1 py-3 text-xs font-medium uppercase tracking-wider hover:bg-white hover:text-black transition-colors relative
				{$activeRightSidebarTab === 'properties' ? 'bg-white text-black' : 'text-gray-500'}"
				on:click={() => setRightTab('properties')}
				title="Properties"
			>
				<i class="fa fa-sliders-h text-lg mb-1 block"></i>
				{#if $activeRightSidebarTab === 'properties'}
					<div class="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>
				{/if}
			</button>
			<button 
				class="flex-1 py-3 text-xs font-medium uppercase tracking-wider hover:bg-white hover:text-black transition-colors relative
				{$activeRightSidebarTab === 'layers' ? 'bg-white text-black' : 'text-gray-500'}"
				on:click={() => setRightTab('layers')}
				title="Layers"
			>
				<i class="fa fa-layer-group text-lg mb-1 block"></i>
				{#if $activeRightSidebarTab === 'layers'}
					<div class="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>
				{/if}
			</button>
		</div>

		<!-- Right Sidebar Content -->
		<div class="flex-1 overflow-hidden relative">
			{#if $activeRightSidebarTab === 'properties'}
				<div class="absolute inset-0 overflow-y-auto custom-scrollbar">
					<PropertiesPanel />
				</div>
			{:else if $activeRightSidebarTab === 'layers'}
				<div class="absolute inset-0 overflow-y-auto custom-scrollbar">
					<LayersPanel />
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Mobile/Tablet Responsiveness */
	@media (max-width: 1024px) {
		.asset-panel-container {
			position: absolute;
			left: 64px; /* Width of LeftSidebar */
			top: 0;
			bottom: 0;
			box-shadow: 4px 0 24px -4px rgba(0, 0, 0, 0.1);
            max-width: calc(100vw - 64px);
		}
		
		.right-sidebar-container {
			position: absolute;
			right: 0;
			top: 0;
			bottom: 0;
			box-shadow: -4px 0 24px -4px rgba(0, 0, 0, 0.1);
		}
	}
</style>
