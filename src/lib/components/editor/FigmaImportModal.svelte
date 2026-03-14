<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { editor } from '../../../store/editor.store';
	import { Group } from 'fabric';
	import backend from '../../../service/backend';
	import { convertFigmaToFabric } from '../../utils/figma-converter';

	const dispatch = createEventDispatcher();

	/**
	 * Recursively flatten nested groups so only leaf objects remain.
	 * The top-level group is created separately — this processes its children.
	 */
	function flattenNestedGroups(objects) {
		const flat = [];
		for (const obj of objects) {
			if (obj.type === 'group' && obj._objects) {
				// Bake the group's transform into each child
				const groupLeft = obj.left || 0;
				const groupTop = obj.top || 0;
				const groupScaleX = obj.scaleX || 1;
				const groupScaleY = obj.scaleY || 1;
				const groupAngle = obj.angle || 0;
				const groupOpacity = obj.opacity ?? 1;

				// Ungroup: get the children with their absolute positions
				const children = obj.removeAll();
				for (const child of children) {
					child.set({ opacity: (child.opacity ?? 1) * groupOpacity });
					flat.push(child);
				}
				// Recurse in case children are also groups
				const deeper = flattenNestedGroups(flat.splice(flat.length - children.length, children.length));
				flat.push(...deeper);
			} else {
				flat.push(obj);
			}
		}
		return flat;
	}

	let pendingImports = [];
	let loading = true;
	let importing = false;
	let importProgress = '';
	let error = '';
	let pollInterval = null;
	let lastDebugDump = null;

	onMount(() => {
		loadPendingImports();
		// Poll for new imports every 5 seconds
		pollInterval = setInterval(loadPendingImports, 5000);
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});

	function close() {
		dispatch('close');
	}

	async function loadPendingImports() {
		try {
			const result = await backend.get('/figma/plugin/imports');
			pendingImports = result.imports || [];
		} catch {
			// Silent fail — imports section is optional
		} finally {
			loading = false;
		}
	}

	async function importFromPending(importId) {
		if (!$editor || importing) return;

		importing = true;
		importProgress = 'Fetching design data...';
		error = '';
		lastDebugDump = null;

		let data;
		try {
			data = await backend.get(`/figma/plugin/import/${importId}`);
			const nodeTree = data.nodeTree;

			if (!nodeTree) {
				throw new Error('Import data is empty or expired');
			}

			console.log('[FigmaImport] Input nodeTree:', nodeTree);
			console.log('[FigmaImport] Fallback images:', Object.keys(data.fallbackImages || {}));
			console.log('[FigmaImport] Metadata:', data.metadata);

			importProgress = 'Converting design...';
			const result = await convertFigmaToFabric(nodeTree, {
				fallbackImages: data.fallbackImages || {},
				metadata: data.metadata
			});

			const { objects, fonts, _debug } = result;

			console.log('[FigmaImport] Conversion result:', {
				objectCount: objects.length,
				fonts: [...fonts],
				errors: _debug?.errors || [],
				elapsed: _debug?.elapsed
			});

			// Store debug info for download if there were errors
			if (_debug?.errorCount > 0) {
				console.warn(`[FigmaImport] ${_debug.errorCount} conversion errors occurred`);
				lastDebugDump = buildDebugDump(importId, data, _debug, null);
			}

			if (objects.length === 0) {
				lastDebugDump = buildDebugDump(importId, data, _debug, 'No objects converted');
				throw new Error('No objects could be converted from this design');
			}

			importProgress = 'Loading fonts...';
			for (const fontFamily of fonts) {
				try {
					await document.fonts.load(`16px "${fontFamily}"`);
				} catch {
					// Font not available
				}
			}

			importProgress = 'Adding to canvas...';
			if (window.__historyBatchStart) window.__historyBatchStart();

			// Flatten nested groups so all elements are directly accessible
			const flatObjects = flattenNestedGroups(objects);
			console.log(`[FigmaImport] Flattened ${objects.length} objects → ${flatObjects.length} leaf objects`);

			const importGroup = new Group(flatObjects, {
				figmaImport: true,
				name: data.metadata?.frameName || 'Figma Import',
				subTargetCheck: true,
				interactive: true
			});

			const canvas = $editor;
			const maxWidth = canvas.width * 0.9;
			const maxHeight = canvas.height * 0.9;
			const scaleX = maxWidth / (importGroup.width || 1);
			const scaleY = maxHeight / (importGroup.height || 1);
			const scale = Math.min(scaleX, scaleY, 1);

			importGroup.set({
				left: canvas.width / 2,
				top: canvas.height / 2,
				originX: 'center',
				originY: 'center',
				scaleX: scale,
				scaleY: scale
			});

			canvas.add(importGroup);
			canvas.setActiveObject(importGroup);
			canvas.renderAll();

			if (window.__historyBatchEnd) window.__historyBatchEnd();

			// Log partial errors even on success
			if (_debug?.errorCount > 0) {
				console.warn(
					`[FigmaImport] Import succeeded with ${_debug.errorCount} partial errors — some nodes may be missing or incorrect`
				);
			}

			dispatch('imported', { objectCount: objects.length, frameName: data.metadata?.frameName });
			close();
		} catch (err) {
			console.error('[FigmaImport] Import failed:', err);
			if (!lastDebugDump) {
				lastDebugDump = buildDebugDump(importId, data, null, err.message || 'Unknown error');
			}
			error = err.message || 'Import failed';
			importing = false;
		}
	}

	function buildDebugDump(importId, data, debug, errorMsg) {
		return {
			importId,
			timestamp: new Date().toISOString(),
			error: errorMsg,
			metadata: data?.metadata || null,
			fallbackImageKeys: Object.keys(data?.fallbackImages || {}),
			inputTree: data?.nodeTree || null,
			conversion: debug
				? {
						logs: debug.logs,
						errors: debug.errors,
						errorCount: debug.errorCount,
						warnCount: debug.warnCount,
						elapsed: debug.elapsed,
						nodeCount: debug.nodeCount,
						inputTreeSummary: debug.inputTreeSummary
				  }
				: null
		};
	}

	function downloadDebugLog() {
		if (!lastDebugDump) return;
		const json = JSON.stringify(lastDebugDump, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `figma-import-debug-${lastDebugDump.importId || 'unknown'}-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') close();
	}

	function timeAgo(dateStr) {
		const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		return `${Math.floor(seconds / 3600)}h ago`;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
	on:click|self={close}
>
	<div
		class="bg-[#FFFDF8] border-[3px] border-gray-900 rounded-xl shadow-[8px_8px_0_0_#1f2937] w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
	>
		<!-- Header -->
		<div
			class="px-6 py-4 border-b-[3px] border-gray-900 flex items-center justify-between flex-shrink-0"
		>
			<div class="flex items-center gap-3">
				<div
					class="w-8 h-8 rounded-lg bg-[#a259ff] border-[2px] border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_#1f2937]"
				>
					<svg width="16" height="16" viewBox="0 0 38 57" fill="none">
						<path
							d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z"
							fill="white"
						/>
						<path
							d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z"
							fill="white"
						/>
						<path
							d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z"
							fill="white"
						/>
						<path
							d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z"
							fill="white"
						/>
						<path
							d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z"
							fill="white"
						/>
					</svg>
				</div>
				<h2 class="font-black text-sm text-gray-900 uppercase tracking-widest">
					Import from Figma
				</h2>
			</div>
			<button
				class="w-8 h-8 rounded-lg bg-white border-[2px] border-gray-900 flex items-center justify-center hover:bg-red-50 hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
				on:click={close}
			>
				<i class="fa fa-times text-sm text-gray-900" />
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto custom-scrollbar p-6">
			{#if importing}
				<!-- Importing state -->
				<div class="flex flex-col items-center justify-center py-10">
					<div
						class="w-16 h-16 rounded-full bg-[#a259ff] border-[3px] border-gray-900 flex items-center justify-center mb-4 shadow-[4px_4px_0_0_#1f2937] animate-pulse"
					>
						<i class="fa fa-spinner fa-spin text-2xl text-white" />
					</div>
					<p class="text-sm font-black text-gray-900 uppercase tracking-widest">{importProgress}</p>
					<p class="text-xs font-medium text-gray-500 mt-2">
						This may take a moment for complex designs
					</p>
				</div>
			{:else}
				<!-- How it works -->
				<div class="mb-6">
					<p class="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3">
						How it works
					</p>
					<div class="grid grid-cols-3 gap-3">
						<div class="text-center">
							<div
								class="w-10 h-10 rounded-lg bg-white border-[2px] border-gray-900 flex items-center justify-center mx-auto mb-2 shadow-[2px_2px_0_0_#1f2937]"
							>
								<span class="text-sm font-black text-gray-900">1</span>
							</div>
							<p class="text-[10px] font-bold text-gray-900">Install plugin</p>
							<p class="text-[9px] font-medium text-gray-500">in Figma</p>
						</div>
						<div class="text-center">
							<div
								class="w-10 h-10 rounded-lg bg-white border-[2px] border-gray-900 flex items-center justify-center mx-auto mb-2 shadow-[2px_2px_0_0_#1f2937]"
							>
								<span class="text-sm font-black text-gray-900">2</span>
							</div>
							<p class="text-[10px] font-bold text-gray-900">Select frames</p>
							<p class="text-[9px] font-medium text-gray-500">& click Send</p>
						</div>
						<div class="text-center">
							<div
								class="w-10 h-10 rounded-lg bg-white border-[2px] border-gray-900 flex items-center justify-center mx-auto mb-2 shadow-[2px_2px_0_0_#1f2937]"
							>
								<span class="text-sm font-black text-gray-900">3</span>
							</div>
							<p class="text-[10px] font-bold text-gray-900">Import here</p>
							<p class="text-[9px] font-medium text-gray-500">to your canvas</p>
						</div>
					</div>
				</div>

				<!-- Install plugin CTA -->
				<div class="p-4 bg-[#a259ff]/5 border-[2px] border-[#a259ff] rounded-xl mb-6">
					<div class="flex items-start gap-3">
						<div
							class="w-10 h-10 rounded-lg bg-[#a259ff] border-[2px] border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]"
						>
							<svg width="18" height="18" viewBox="0 0 38 57" fill="none">
								<path
									d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z"
									fill="white"
								/>
								<path
									d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z"
									fill="white"
								/>
								<path
									d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z"
									fill="white"
								/>
								<path
									d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z"
									fill="white"
								/>
								<path
									d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z"
									fill="white"
								/>
							</svg>
						</div>
						<div class="flex-1">
							<p class="text-xs font-black text-gray-900 mb-1">Send to Pictify — Figma Plugin</p>
							<p class="text-[10px] font-medium text-gray-500 mb-3">
								Select frames in Figma and send them directly to your canvas as editable objects.
							</p>
							<a
								href="https://www.figma.com/community/plugin/pictify-send-to-pictify"
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-2 px-4 py-2 bg-[#a259ff] text-white border-[2px] border-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
							>
								<i class="fa fa-external-link" />
								Get Plugin
							</a>
						</div>
					</div>
				</div>

				<!-- Pending imports -->
				<div>
					<div class="flex items-center justify-between mb-3">
						<p class="text-[10px] font-black text-gray-900 uppercase tracking-widest">
							Pending Imports
						</p>
						{#if !loading}
							<button
								class="text-[10px] font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wide"
								on:click={loadPendingImports}
							>
								<i class="fa fa-refresh mr-1" />Refresh
							</button>
						{/if}
					</div>

					{#if loading}
						<div class="flex items-center justify-center py-6">
							<i class="fa fa-spinner fa-spin text-gray-400 mr-2" />
							<p class="text-xs font-medium text-gray-500">Loading...</p>
						</div>
					{:else if pendingImports.length === 0}
						<div
							class="text-center py-8 px-4 bg-gray-50 border-[2px] border-dashed border-gray-300 rounded-xl"
						>
							<i class="fa fa-inbox text-2xl text-gray-300 mb-2" />
							<p class="text-xs font-bold text-gray-500 mb-1">No pending imports</p>
							<p class="text-[10px] font-medium text-gray-400">
								Use the Figma plugin to send designs here
							</p>
						</div>
					{:else}
						<div class="space-y-2">
							{#each pendingImports as imp}
								<div
									class="flex items-center gap-3 p-3 bg-white border-[2px] border-gray-900 rounded-lg hover:shadow-[3px_3px_0_0_#1f2937] hover:-translate-y-0.5 transition-all"
								>
									{#if imp.previewPng}
										<img
											src={imp.previewPng}
											alt={imp.metadata?.frameName || 'Preview'}
											class="w-14 h-14 rounded border-[2px] border-gray-200 object-contain bg-gray-50 flex-shrink-0"
										/>
									{:else}
										<div
											class="w-14 h-14 rounded border-[2px] border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0"
										>
											<i class="fa fa-image text-gray-300" />
										</div>
									{/if}
									<div class="flex-1 min-w-0">
										<p class="text-xs font-bold text-gray-900 truncate">
											{imp.metadata?.frameName || 'Untitled'}
										</p>
										<p class="text-[10px] font-medium text-gray-500">
											{#if imp.metadata?.width && imp.metadata?.height}
												{imp.metadata.width} x {imp.metadata.height} &middot;
											{/if}
											{timeAgo(imp.createdAt)}
										</p>
									</div>
									<button
										class="px-3 py-1.5 bg-[#a259ff] text-white border-[2px] border-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex-shrink-0"
										on:click={() => importFromPending(imp.importId)}
									>
										Import
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				{#if error}
					<div class="mt-4 p-3 bg-red-50 border-[2px] border-red-300 rounded-lg">
						<p class="text-xs font-bold text-red-700">{error}</p>
						{#if lastDebugDump}
							<button
								class="mt-2 px-3 py-1.5 bg-white text-red-700 border-[2px] border-red-300 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-red-100 transition-all"
								on:click={downloadDebugLog}
							>
								<i class="fa fa-download mr-1" />Download Debug Log
							</button>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
