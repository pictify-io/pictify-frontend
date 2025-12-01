<script>
	import { createEventDispatcher } from 'svelte';
	import TopBar from './TopBar.svelte';
	import AnimatedBackground from './AnimatedBackground.svelte';
	
	const dispatch = createEventDispatcher();
	import LeftSidebar from './LeftSidebar.svelte';
	import AssetPanel from './AssetPanel.svelte';
	import Canvas from './Canvas.svelte';
	import PropertiesPanel from './PropertiesPanel.svelte';
	import LayersPanel from './LayersPanel.svelte';
	import VariablesPanel from './VariablesPanel.svelte';
	import AlignmentGuides from './AlignmentGuides.svelte';
	import CopilotDrawer from './CopilotDrawer.svelte';
	import { selectedComponent, canvasZoom, activeSidebarTab, activeRightSidebarTab, editorActions } from '../../../store/editor.store';
	import FloatingCopilot from './FloatingCopilot.svelte';

	export let templateName = '';
	export let isSaving = false;

	function setRightTab(tab) {
		editorActions.toggleRightSidebarTab(tab);
	}
</script>

<div class="flex h-full w-full bg-[#FFFDF8] overflow-hidden relative">
	<!-- Animated Background -->
	<AnimatedBackground />
	
	<!-- Left Sidebar (Full Height) -->
	<LeftSidebar />
	
	<!-- Asset Panel (Full Height, Collapsible) -->
	<!-- Asset Panel (Full Height, Collapsible) -->
	<div class="asset-panel-container h-full flex-shrink-0 z-10 relative bg-white/90 backdrop-blur-sm border-black transition-all duration-300 overflow-hidden"
		style="width: {$activeSidebarTab ? '288px' : '0px'}; border-right-width: {$activeSidebarTab ? '2px' : '0px'};">
		<div class="w-72 h-full">
			<AssetPanel />
		</div>
	</div>

	<!-- Central Area (TopBar + Canvas) -->
	<div class="flex flex-col flex-1 overflow-hidden relative min-w-0">
		<TopBar bind:templateName {isSaving} on:save={() => { console.log('EditorLayout: save event received'); dispatch('save'); }} />
		<div class="relative flex-1 overflow-hidden bg-white/90 backdrop-blur-sm">
			<AlignmentGuides />
			<Canvas />
			
			{#if $selectedComponent && import.meta.env.PUBLIC_ENABLE_COPILOT === 'true'}
				<FloatingCopilot element={$selectedComponent} scale={$canvasZoom / 100} />
			{/if}
		</div>
	</div>
	
	<!-- Right Sidebar Container (Full Height) -->
	<div class="right-sidebar-container flex flex-col h-full bg-white/90 backdrop-blur-sm border-l-2 border-black shadow-lg z-10 transition-all duration-300 flex-shrink-0"
	style="width: {$activeRightSidebarTab ? '280px' : '48px'};">
		
		<!-- Right Sidebar Tabs -->
		<div class="{$activeRightSidebarTab ? 'flex border-b-2' : 'flex flex-col'} border-black bg-[#FFFDF8]">
			<button 
				class="py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/50 hover:text-[#ff6b6b] transition-colors relative
				{$activeRightSidebarTab ? 'flex-1' : 'w-full'}
				{$activeRightSidebarTab === 'properties' ? 'bg-white text-[#ff6b6b]' : 'text-gray-500'}"
				on:click={() => setRightTab('properties')}
				title="Properties"
			>
				<i class="fa fa-sliders-h text-base {$activeRightSidebarTab ? 'mb-1' : ''} block"></i>
				{#if $activeRightSidebarTab === 'properties'}
					<div class="absolute {$activeRightSidebarTab ? 'bottom-0 left-0 w-full h-0.5' : 'left-0 top-0 w-0.5 h-full'} bg-[#ff6b6b]"></div>
				{/if}
			</button>
			<button 
				class="py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/50 hover:text-[#ff6b6b] transition-colors relative
				{$activeRightSidebarTab ? 'flex-1' : 'w-full'}
				{$activeRightSidebarTab === 'layers' ? 'bg-white text-[#ff6b6b]' : 'text-gray-500'}"
				on:click={() => setRightTab('layers')}
				title="Layers"
			>
				<i class="fa fa-layer-group text-base {$activeRightSidebarTab ? 'mb-1' : ''} block"></i>
				{#if $activeRightSidebarTab === 'layers'}
					<div class="absolute {$activeRightSidebarTab ? 'bottom-0 left-0 w-full h-0.5' : 'left-0 top-0 w-0.5 h-full'} bg-[#ff6b6b]"></div>
				{/if}
			</button>
			<button 
				class="py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/50 hover:text-[#ff6b6b] transition-colors relative
				{$activeRightSidebarTab ? 'flex-1' : 'w-full'}
				{$activeRightSidebarTab === 'variables' ? 'bg-white text-[#ff6b6b]' : 'text-gray-500'}"
				on:click={() => setRightTab('variables')}
				title="Variables"
			>
				<i class="fa fa-code text-base {$activeRightSidebarTab ? 'mb-1' : ''} block"></i>
				{#if $activeRightSidebarTab === 'variables'}
					<div class="absolute {$activeRightSidebarTab ? 'bottom-0 left-0 w-full h-0.5' : 'left-0 top-0 w-0.5 h-full'} bg-[#ff6b6b]"></div>
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
			{:else if $activeRightSidebarTab === 'variables'}
				<div class="absolute inset-0 overflow-y-auto custom-scrollbar">
					<VariablesPanel />
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Copilot Drawer (Bottom) -->
	{#if import.meta.env.PUBLIC_ENABLE_COPILOT === 'true'}
		<CopilotDrawer />
	{/if}
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
