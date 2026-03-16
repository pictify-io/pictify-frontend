<script>
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import TopBar from './TopBar.svelte';
	import ResizeModal from './ResizeModal.svelte';
	import AnimatedBackground from './AnimatedBackground.svelte';
	import PageNavigator from './PageNavigator.svelte';

	let showResizeModal = false;

	const dispatch = createEventDispatcher();

	// Layout variant state (local, no separate store needed)
	export let currentLayoutKey = null;
	export let isLayoutSwitching = false;

	function handleSaveLayout(event) {
		const { key, canvasState, width, height, name } = event.detail;
		if (!canvasState) {
			toast.set({ message: 'Failed to save layout', type: 'error' });
			return;
		}

		template.update((t) => ({
			...t,
			layouts: {
				...(t.layouts || {}),
				[key]: { fabricJSData: canvasState, width, height, name, createdAt: new Date().toISOString() }
			}
		}));
		toast.set({ message: `Saved ${name} layout`, type: 'success' });

		// Auto-save to persist layouts to backend
		dispatch('save');
	}

	async function handleLayoutSwitch(key) {
		if (isLayoutSwitching) return;

		const target =
			key === null
				? {
						fabricJSData: $template.fabricJSData,
						width: $template.width,
						height: $template.height
					}
				: ($template.layouts || {})[key];

		if (!target?.fabricJSData) {
			toast.set({ message: 'Layout data not found', type: 'error' });
			return;
		}

		// Canvas owns the full switch sequence (H1)
		const prevKey = currentLayoutKey;
		currentLayoutKey = key;
		isLayoutSwitching = true;
		if (canvasComponent?.handleLayoutSwitch) {
			try {
				await canvasComponent.handleLayoutSwitch({
					fromLayoutKey: prevKey,
					toLayoutKey: key,
					targetData: target
				});
			} finally {
				isLayoutSwitching = false;
			}
		} else {
			isLayoutSwitching = false;
		}
	}
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
		editor,
		canvasZoom,
		activeSidebarTab,
		activeRightSidebarTab,
		editorActions
	} from '../../../store/editor.store';
	import { toast } from '../../../store/toast.store';
	import { template } from '../../../store/template.store';
	import FloatingCopilot from './FloatingCopilot.svelte';
	import { outputFormat } from '../../../store/pages.store';

	export let templateName = '';
	export let isSaving = false;
	export let guestMode = false;

	// Layout thumbnail generation
	let layoutThumbnails = {};
	let thumbnailVersions = {};
	let pendingThumbnails = new Set();

	async function generateThumbnail(fabricJSData, width, height) {
		if (typeof window === 'undefined' || !fabricJSData) return null;
		try {
			const { StaticCanvas } = await import('fabric');
			const scale = 48 / Math.max(width, height);
			const canvas = new StaticCanvas(null, {
				width: Math.round(width * scale),
				height: Math.round(height * scale),
				renderOnAddRemove: false,
				enableRetinaScaling: false
			});
			canvas.setZoom(scale);
			await canvas.loadFromJSON(fabricJSData);
			canvas.renderAll();
			const dataUrl = canvas.toDataURL({ format: 'png', quality: 0.5 });
			canvas.setWidth(0);
			canvas.setHeight(0);
			canvas.dispose();
			return dataUrl;
		} catch {
			return null;
		}
	}

	function quickHash(obj) {
		const str = JSON.stringify(obj).slice(0, 200);
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
		}
		return hash;
	}

	$: if ($template.layouts || $template.fabricJSData) {
		regenerateThumbnails();
	}

	async function regenerateThumbnails() {
		const entries = Object.entries($template.layouts || {});
		const allLayouts = [
			['__default__', { fabricJSData: $template.fabricJSData, width: $template.width, height: $template.height }],
			...entries
		];

		for (const [key, layout] of allLayouts) {
			if (!layout?.fabricJSData || pendingThumbnails.has(key)) continue;
			const version = quickHash(layout.fabricJSData);
			if (thumbnailVersions[key] === version) continue;

			pendingThumbnails.add(key);
			try {
				const dataUrl = await generateThumbnail(layout.fabricJSData, layout.width, layout.height);
				if (dataUrl) {
					layoutThumbnails[key] = dataUrl;
					thumbnailVersions[key] = version;
					layoutThumbnails = layoutThumbnails;
				}
			} finally {
				pendingThumbnails.delete(key);
			}
		}
	}

	// Canvas component reference for layout switching
	let canvasComponent;

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
			dispatch('save');
		}}
		on:resize={() => (showResizeModal = true)}
	/>

	<ResizeModal bind:show={showResizeModal} on:saveLayout={handleSaveLayout} />

	<!-- Page Navigator (for PDF templates) -->
	<PageNavigator on:beforeSwitch={handlePageSwitch} on:afterSwitch on:pageAdded on:pageDeleted />

	<!-- Layout Tabs (only show when layouts exist and not PDF) -->
	{#if Object.keys($template.layouts || {}).length > 0 && $outputFormat !== 'pdf'}
		<div class="flex items-center gap-1 px-4 py-2 border-b-[3px] border-gray-900 bg-gray-50 overflow-x-auto relative z-10">
			<button
				on:click={() => handleLayoutSwitch(null)}
				disabled={isLayoutSwitching}
				class="px-2 py-1.5 text-xs font-bold border-2 whitespace-nowrap transition-all flex items-center gap-2
					{currentLayoutKey === null
					? 'border-gray-900 bg-[#ffc480]/20 shadow-[2px_2px_0_0_#1f2937]'
					: 'border-gray-200 hover:border-gray-400'}
					disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if layoutThumbnails['__default__']}
					<img src={layoutThumbnails['__default__']} alt="" class="w-10 h-7 border border-gray-300 object-contain bg-white" />
				{/if}
				<div class="text-left">
					<div class="text-xs font-bold">Default</div>
					<div class="text-[10px] text-gray-400">{$template.width}x{$template.height}</div>
				</div>
			</button>

			{#each Object.entries($template.layouts || {}) as [key, layout]}
				<button
					on:click={() => handleLayoutSwitch(key)}
					disabled={isLayoutSwitching}
					class="px-2 py-1.5 text-xs font-bold border-2 whitespace-nowrap transition-all flex items-center gap-2
						{currentLayoutKey === key
						? 'border-gray-900 bg-[#ffc480]/20 shadow-[2px_2px_0_0_#1f2937]'
						: 'border-gray-200 hover:border-gray-400'}
						disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if layoutThumbnails[key]}
						<img src={layoutThumbnails[key]} alt="" class="w-10 h-7 border border-gray-300 object-contain bg-white" />
					{/if}
					<div class="text-left">
						<div class="text-xs font-bold">{layout.name || key}</div>
						<div class="text-[10px] text-gray-400">{layout.width}x{layout.height}</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}

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
				bind:this={canvasComponent}
				on:autosave={() => {
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
						<VariablesPanel {guestMode} {currentLayoutKey} />
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
