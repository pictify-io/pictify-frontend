<script>
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { onMount, tick } from 'svelte';
	import TopBar from './TopBar.svelte';
	import AnimatedBackground from './AnimatedBackground.svelte';
	import PageNavigator from './PageNavigator.svelte';

	const dispatch = createEventDispatcher();
	import LeftSidebar from './LeftSidebar.svelte';
	import AssetPanel from './AssetPanel.svelte';
	import Canvas from './Canvas.svelte';
	import PropertiesPanel from './PropertiesPanel.svelte';
	import LayersPanel from './LayersPanel.svelte';
	import VariablesPanel from './VariablesPanel.svelte';
	import AlignmentGuides from './AlignmentGuides.svelte';
	import { selectedComponent, canvasZoom, activeSidebarTab, activeRightSidebarTab, editorActions } from '../../../store/editor.store';
	import FloatingCopilot from './FloatingCopilot.svelte';
	import { outputFormat } from '../../../store/pages.store';

	export let templateName = '';
	export let isSaving = false;
	export let guestMode = false;

	function setRightTab(tab) {
		editorActions.toggleRightSidebarTab(tab);
	}

	function handlePageSwitch(event) {
		// Dispatch event for parent components to save current canvas state
		dispatch('pageSwitch', event.detail);
	}

	// Keyboard shortcut: Cmd+K / Ctrl+K to toggle Copilot panel
	function handleGlobalKeydown(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			// Toggle copilot panel
			if ($activeSidebarTab === 'copilot') {
				editorActions.toggleLeftSidebarTab(null); // Close panel
			} else {
				editorActions.toggleLeftSidebarTab('copilot'); // Open copilot
			}
		}
	}

	onMount(() => {
		// Register global keyboard shortcut
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleGlobalKeydown);
		}
		// Make the full editor discoverable in guest mode:
		// keep both sidebars open and land on Variables (API/preview) tab.
		if (guestMode) {
			// Left sidebar: only open if currently closed (toggle is not idempotent).
			if (!$activeSidebarTab) {
				editorActions.toggleLeftSidebarTab('elements');
			}

			// Right sidebar: ensure it's open AND points to variables.
			if ($activeRightSidebarTab !== 'variables') {
				editorActions.toggleRightSidebarTab('variables');
			}
		}
	});

	onDestroy(() => {
		// Clean up global keyboard shortcut listener
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleGlobalKeydown);
		}
	});
</script>

<div class="flex flex-col h-full w-full bg-[#FFFDF8] overflow-hidden relative">
	<!-- Animated Background -->
	<AnimatedBackground />

	<!-- Top Bar (Full Width) -->
	<TopBar bind:templateName {isSaving} {guestMode} on:save={() => { console.log('EditorLayout: save event received'); dispatch('save'); }} />
	
	<!-- Page Navigator (for PDF templates) -->
	<PageNavigator 
		on:beforeSwitch={handlePageSwitch}
		on:afterSwitch
		on:pageAdded
		on:pageDeleted
	/>
	
	<!-- Main Content Area -->
	<div class="flex flex-1 w-full overflow-hidden relative min-h-0">
		<!-- Left Sidebar -->
		<LeftSidebar />
		
		<!-- Asset Panel -->
		<div class="asset-panel-container h-full flex-shrink-0 z-10 relative bg-[#FFFDF8] border-gray-900 transition-all duration-300 overflow-hidden border-r-[3px]"
			style="width: {$activeSidebarTab ? '288px' : '0px'}; border-right-width: {$activeSidebarTab ? '3px' : '0px'};">
			<div class="w-72 h-full">
				<AssetPanel />
			</div>
		</div>

		<!-- Canvas Area -->
		<div class="relative flex-1 overflow-hidden bg-transparent">
			<AlignmentGuides />
			<Canvas />
			
			{#if $selectedComponent && import.meta.env.PUBLIC_ENABLE_COPILOT === 'true'}
				<FloatingCopilot element={$selectedComponent} scale={$canvasZoom / 100} />
			{/if}
		</div>
		
		<!-- Right Sidebar Container (Full Height) -->
		<div class="right-sidebar-container flex flex-col h-full bg-[#FFFDF8] border-l-[3px] border-gray-900 z-10 transition-all duration-300 flex-shrink-0"
		style="width: {$activeRightSidebarTab ? '280px' : '48px'};">
			
			<!-- Right Sidebar Tabs -->
			<div class="{$activeRightSidebarTab ? 'flex border-b-[3px]' : 'flex flex-col'} border-gray-900 bg-[#FFFDF8]">
				<button 
					class="py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors relative group
					{$activeRightSidebarTab ? 'flex-1 border-r-[2px] border-gray-900 last:border-r-0' : 'w-full border-b-[2px] border-gray-900'}
					{$activeRightSidebarTab === 'properties' ? 'bg-[#ffc480] text-gray-900' : 'text-gray-500'}"
					on:click={() => setRightTab('properties')}
					title="Properties"
				>
					<i class="fa fa-sliders-h text-sm {$activeRightSidebarTab ? 'mb-1' : ''} block"></i>
                    {#if !$activeRightSidebarTab}
                        <span class="sr-only">Properties</span>
                    {/if}
				</button>
				<button 
					class="py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors relative group
					{$activeRightSidebarTab ? 'flex-1 border-r-[2px] border-gray-900 last:border-r-0' : 'w-full border-b-[2px] border-gray-900'}
					{$activeRightSidebarTab === 'layers' ? 'bg-[#ffc480] text-gray-900' : 'text-gray-500'}"
					on:click={() => setRightTab('layers')}
					title="Layers"
				>
					<i class="fa fa-layer-group text-sm {$activeRightSidebarTab ? 'mb-1' : ''} block"></i>
                    {#if !$activeRightSidebarTab}
                        <span class="sr-only">Layers</span>
                    {/if}
				</button>
				<button 
					class="py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors relative group
					{$activeRightSidebarTab ? 'flex-1' : 'w-full border-b-[2px] border-gray-900'}
					{$activeRightSidebarTab === 'variables' ? 'bg-[#ffc480] text-gray-900' : 'text-gray-500'}"
					on:click={() => setRightTab('variables')}
					title="Variables & Preview"
				>
					<i class="fa fa-code text-sm {$activeRightSidebarTab ? 'mb-1' : ''} block"></i>
                    {#if !$activeRightSidebarTab}
                        <span class="sr-only">Variables</span>
                    {/if}
				</button>
			</div>

			<!-- Right Sidebar Content -->
			<div class="flex-1 overflow-hidden relative bg-[#FFFDF8]">
				{#if $activeRightSidebarTab === 'properties'}
					<div class="absolute inset-0 overflow-y-auto custom-scrollbar">
						<PropertiesPanel />
					</div>
				{:else if $activeRightSidebarTab === 'layers'}
					<div class="absolute inset-0 overflow-y-auto custom-scrollbar">
						<LayersPanel />
					</div>
				{:else if $activeRightSidebarTab === 'variables'}
					<div class="absolute inset-0 overflow-hidden">
						<VariablesPanel {guestMode} />
					</div>
				{/if}
			</div>
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
			box-shadow: 8px 0 0 0 rgba(0, 0, 0, 0.1); /* Hard shadow for mobile */
            max-width: calc(100vw - 64px);
		}
		
		.right-sidebar-container {
			position: absolute;
			right: 0;
			top: 0;
			bottom: 0;
			box-shadow: -8px 0 0 0 rgba(0, 0, 0, 0.1); /* Hard shadow for mobile */
		}
	}
</style>