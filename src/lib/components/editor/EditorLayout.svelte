<script>
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
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
	import FigmaImportModal from './FigmaImportModal.svelte';
	import {
		selectedComponent,
		canvasZoom,
		activeSidebarTab,
		activeRightSidebarTab,
		editorActions
	} from '../../../store/editor.store';
	import FloatingCopilot from './FloatingCopilot.svelte';
	import { outputFormat } from '../../../store/pages.store';

	export let templateName = '';
	export let isSaving = false;
	export let guestMode = false;

	// Keyboard shortcuts modal
	let showShortcutsModal = false;

	// Figma import modal
	let showFigmaModal = false;

	const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
	const modKey = isMac ? 'Cmd' : 'Ctrl';

	const shortcuts = [
		{ keys: `${modKey}+Z`, description: 'Undo' },
		{ keys: `${modKey}+Shift+Z`, description: 'Redo' },
		{ keys: `${modKey}+K`, description: 'Toggle Copilot' },
		{ keys: `${modKey}+S`, description: 'Save' },
		{ keys: 'Delete', description: 'Remove selected element' },
		{ keys: `${modKey}+C`, description: 'Copy' },
		{ keys: `${modKey}+V`, description: 'Paste' },
		{ keys: `${modKey}+D`, description: 'Duplicate' },
		{ keys: 'Arrow keys', description: 'Nudge selected element' },
		{ keys: '?', description: 'Show this dialog' }
	];

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

		// Escape to close shortcuts modal
		if (e.key === 'Escape' && showShortcutsModal) {
			showShortcutsModal = false;
		}
	}

	function handleShortcutsClickOutside(e) {
		if (showShortcutsModal && e.target.classList.contains('shortcuts-backdrop')) {
			showShortcutsModal = false;
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
	<TopBar
		bind:templateName
		{isSaving}
		{guestMode}
		on:save={() => {
			console.log('EditorLayout: save event received');
			dispatch('save');
		}}
	/>

	<!-- Page Navigator (for PDF templates) -->
	<PageNavigator on:beforeSwitch={handlePageSwitch} on:afterSwitch on:pageAdded on:pageDeleted />

	<!-- Main Content Area -->
	<div class="flex flex-1 w-full overflow-hidden relative min-h-0">
		<!-- Left Sidebar -->
		<LeftSidebar on:openFigma={() => (showFigmaModal = true)} />

		<!-- Asset Panel -->
		<div
			class="asset-panel-container h-full flex-shrink-0 z-10 relative bg-[#FFFDF8] border-gray-900 transition-all duration-300 overflow-hidden border-r-[3px]"
			style="width: {$activeSidebarTab ? '288px' : '0px'}; border-right-width: {$activeSidebarTab
				? '3px'
				: '0px'};"
		>
			<div class="w-72 h-full">
				<AssetPanel />
			</div>
		</div>

		<!-- Canvas Area -->
		<div class="relative flex-1 overflow-hidden bg-transparent">
			<AlignmentGuides />
			<Canvas
				on:autosave={() => {
					console.log('EditorLayout: autosave event received');
					dispatch('save');
				}}
			/>

			{#if $selectedComponent && import.meta.env.PUBLIC_ENABLE_COPILOT === 'true'}
				<FloatingCopilot element={$selectedComponent} scale={$canvasZoom / 100} />
			{/if}
		</div>

		<!-- Right Sidebar Container (Full Height) -->
		<div
			class="right-sidebar-container flex flex-col h-full bg-[#FFFDF8] border-l-[3px] border-gray-900 z-10 transition-all duration-300 flex-shrink-0"
			style="width: {$activeRightSidebarTab ? '280px' : '48px'};"
		>
			<!-- Right Sidebar Tabs -->
			<div
				class="{$activeRightSidebarTab
					? 'flex gap-1 p-1 border-b-[2px] border-gray-300'
					: 'flex flex-col border-b-[3px] border-gray-900'} bg-[#FFFDF8]"
				role="tablist"
			>
				<button
					class="py-1.5 px-2 text-[10px] font-black uppercase tracking-widest transition-colors relative group
					{$activeRightSidebarTab
						? 'flex-1 rounded border-[2px]'
						: 'w-full border-b-[2px] border-gray-900 hover:bg-gray-100'}
					{$activeRightSidebarTab === 'properties'
						? 'bg-[#ffc480] text-gray-900 border-gray-900 shadow-[2px_2px_0_0_#000]'
						: $activeRightSidebarTab
						? 'text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-300'
						: 'text-gray-500'}"
					on:click={() => setRightTab('properties')}
					title="Properties"
					role="tab"
					aria-selected={$activeRightSidebarTab === 'properties'}
				>
					<i class="fa fa-sliders-h text-sm {$activeRightSidebarTab ? 'mb-1' : ''} block" />
					{#if !$activeRightSidebarTab}
						<span class="sr-only">Properties</span>
					{/if}
				</button>
				<button
					class="py-1.5 px-2 text-[10px] font-black uppercase tracking-widest transition-colors relative group
					{$activeRightSidebarTab
						? 'flex-1 rounded border-[2px]'
						: 'w-full border-b-[2px] border-gray-900 hover:bg-gray-100'}
					{$activeRightSidebarTab === 'layers'
						? 'bg-[#ffc480] text-gray-900 border-gray-900 shadow-[2px_2px_0_0_#000]'
						: $activeRightSidebarTab
						? 'text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-300'
						: 'text-gray-500'}"
					on:click={() => setRightTab('layers')}
					title="Layers"
					role="tab"
					aria-selected={$activeRightSidebarTab === 'layers'}
				>
					<i class="fa fa-layer-group text-sm {$activeRightSidebarTab ? 'mb-1' : ''} block" />
					{#if !$activeRightSidebarTab}
						<span class="sr-only">Layers</span>
					{/if}
				</button>
				<button
					class="py-1.5 px-2 text-[10px] font-black uppercase tracking-widest transition-colors relative group
					{$activeRightSidebarTab
						? 'flex-1 rounded border-[2px]'
						: 'w-full border-b-[2px] border-gray-900 hover:bg-gray-100'}
					{$activeRightSidebarTab === 'variables'
						? 'bg-[#ffc480] text-gray-900 border-gray-900 shadow-[2px_2px_0_0_#000]'
						: $activeRightSidebarTab
						? 'text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-300'
						: 'text-gray-500'}"
					on:click={() => setRightTab('variables')}
					title="Variables & Preview"
					role="tab"
					aria-selected={$activeRightSidebarTab === 'variables'}
				>
					<i class="fa fa-code text-sm {$activeRightSidebarTab ? 'mb-1' : ''} block" />
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

	<!-- Keyboard Shortcuts Button -->
	<button
		class="fixed bottom-4 right-4 z-30 w-9 h-9 flex items-center justify-center bg-white border-[3px] border-gray-900 rounded-full text-gray-900 font-black text-sm shadow-[3px_3px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all hover:bg-[#ffc480]"
		on:click={() => (showShortcutsModal = true)}
		title="Keyboard Shortcuts"
	>
		?
	</button>

	<!-- Keyboard Shortcuts Modal -->
	{#if showShortcutsModal}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="shortcuts-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/30"
			on:click={handleShortcutsClickOutside}
			transition:fly={{ y: 0, duration: 150 }}
		>
			<div
				class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] w-full max-w-sm mx-4"
				transition:fly={{ y: 20, duration: 200 }}
			>
				<!-- Header -->
				<div
					class="flex items-center justify-between px-5 py-3 border-b-[3px] border-gray-900 bg-[#FFFDF8] rounded-t-lg"
				>
					<h3 class="text-sm font-black uppercase tracking-widest text-gray-900">
						Keyboard Shortcuts
					</h3>
					<button
						class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
						on:click={() => (showShortcutsModal = false)}
					>
						<i class="fa fa-times text-gray-500 text-sm" />
					</button>
				</div>

				<!-- Shortcuts List -->
				<div class="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
					{#each shortcuts as shortcut}
						<div class="flex items-center justify-between py-1.5">
							<span class="text-sm text-gray-700">{shortcut.description}</span>
							<kbd
								class="text-[11px] font-mono font-bold bg-gray-100 border-[2px] border-gray-900 rounded-md px-2 py-1 shadow-[2px_2px_0_0_#e5e7eb] text-gray-900"
								>{shortcut.keys}</kbd
							>
						</div>
					{/each}
				</div>

				<!-- Footer -->
				<div class="px-5 py-3 border-t-[2px] border-gray-200 bg-[#FFFDF8] rounded-b-lg">
					<p class="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
						Press Escape to close
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Figma Import Modal -->
	{#if showFigmaModal}
		<FigmaImportModal
			on:close={() => (showFigmaModal = false)}
			on:imported={() => (showFigmaModal = false)}
		/>
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
