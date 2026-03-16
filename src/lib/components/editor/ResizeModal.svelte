<script>
	import { createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { resizeTemplate } from '../../../api/copilot-simple';
	import { editor } from '../../../store/editor.store';
	import { toast } from '../../../store/toast.store';
	import { analytics } from '$lib/analytics.js';
	import { canUseFeature } from '../../../store/plg.store';
	import { page } from '$app/stores';

	export let show = false;

	// Get template UID from the route params
	$: templateUid = $page?.params?.uid || '';

	const dispatch = createEventDispatcher();

	const PLATFORM_PRESETS = [
		{ id: 'instagram-post', width: 1080, height: 1080, label: 'Instagram Post', iconPath: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
		{ id: 'instagram-story', width: 1080, height: 1920, label: 'Instagram Story', iconPath: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
		{ id: 'facebook-post', width: 1200, height: 630, label: 'Facebook Post', iconPath: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
		{ id: 'linkedin-post', width: 1200, height: 627, label: 'LinkedIn Post', iconPath: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
		{ id: 'twitter-post', width: 1200, height: 675, label: 'Twitter/X Post', iconPath: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
		{ id: 'youtube-thumbnail', width: 1280, height: 720, label: 'YouTube Thumbnail', iconPath: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
		{ id: 'og-image', width: 1200, height: 630, label: 'OG Image', iconPath: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
		{ id: 'pinterest-pin', width: 1000, height: 1500, label: 'Pinterest Pin', iconPath: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' }
	];

	let selectedPresets = new Set();
	let isResizing = false;
	let resizeResults = [];
	let resizeProgress = '';
	let savedLayouts = new Set(); // Track which results have been saved as layouts

	// "Generate All Sizes" throttle (60s cooldown)
	let lastBatchTime = 0;
	let completedCount = 0;
	let totalCount = 0;

	function generateAllSizes() {
		const now = Date.now();
		if (now - lastBatchTime < 60000 && lastBatchTime > 0) {
			toast.set({ message: 'Please wait before generating again', type: 'warning' });
			return;
		}
		lastBatchTime = now;
		selectedPresets = new Set(PLATFORM_PRESETS.map((p) => p.id));
		handleResize();
	}

	// Custom size
	let showCustom = false;
	let customWidth = 800;
	let customHeight = 600;
	let customName = '';
	let customAdded = false;

	// Dynamic list: platform presets + any custom sizes added this session
	let customPresets = [];
	$: allPresets = [...PLATFORM_PRESETS, ...customPresets];

	function addCustomSize() {
		const w = Math.round(customWidth);
		const h = Math.round(customHeight);
		if (w < 100 || w > 4096 || h < 100 || h > 4096) {
			toast.set({ message: 'Dimensions must be between 100 and 4096', type: 'error' });
			return;
		}
		const name = customName.trim() || `Custom ${w}x${h}`;
		const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
		if (allPresets.find((p) => p.id === id)) {
			toast.set({ message: 'A size with that name already exists', type: 'error' });
			return;
		}
		customPresets = [
			...customPresets,
			{
				id,
				width: w,
				height: h,
				label: name,
				iconPath:
					'M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm2 2v10h12V7H6z'
			}
		];
		selectedPresets.add(id);
		selectedPresets = new Set(selectedPresets);
		customName = '';
		customWidth = 800;
		customHeight = 600;
		showCustom = false;
		customAdded = true;
	}

	function togglePreset(id) {
		if (selectedPresets.has(id)) {
			selectedPresets.delete(id);
		} else {
			selectedPresets.add(id);
		}
		selectedPresets = new Set(selectedPresets); // trigger reactivity
	}

	async function resizeSingle(preset) {
		try {
			const result = await resizeTemplate(templateUid, preset.width, preset.height);
			return {
				preset,
				success: result.success,
				canvasState: result.canvasState
			};
		} catch (err) {
			return { preset, success: false, error: err.message || 'Resize failed' };
		}
	}

	async function handleResize() {
		if (selectedPresets.size === 0) {
			toast.set({ message: 'Select at least one platform size', type: 'error' });
			return;
		}

		const canUse = canUseFeature('aiCopilot');
		if (!canUse) {
			toast.set({ message: 'AI Copilot limit reached. Upgrade your plan.', type: 'error' });
			return;
		}

		isResizing = true;
		resizeResults = [];
		completedCount = 0;
		const presetsToResize = allPresets.filter((p) => selectedPresets.has(p.id));
		totalCount = presetsToResize.length;
		resizeProgress = `Resizing for ${presetsToResize.length} platform${presetsToResize.length > 1 ? 's' : ''}...`;

		// Run resizes with concurrency limit of 3
		const results = [];
		const CONCURRENCY = 3;
		for (let i = 0; i < presetsToResize.length; i += CONCURRENCY) {
			const batch = presetsToResize.slice(i, i + CONCURRENCY);
			resizeProgress = `Resizing ${i + 1}-${Math.min(i + CONCURRENCY, presetsToResize.length)} of ${presetsToResize.length}...`;
			const batchResults = await Promise.all(batch.map((preset) => resizeSingle(preset)));
			results.push(...batchResults);
			completedCount = results.length;
		}

		resizeResults = results;
		isResizing = false;
		resizeProgress = '';
		totalCount = 0;

		// Track usage
		presetsToResize.forEach((p) => {
			analytics.track('ai_resize_completed', { platform: p.id, width: p.width, height: p.height });
		});
	}

	function useResult(result) {
		dispatch('saveLayout', {
			key: result.preset.id,
			canvasState: result.canvasState,
			width: result.preset.width,
			height: result.preset.height,
			name: result.preset.label
		});
		savedLayouts.add(result.preset.id);
		savedLayouts = new Set(savedLayouts); // trigger reactivity
	}

	function close() {
		show = false;
		selectedPresets = new Set();
		resizeResults = [];
		savedLayouts = new Set();
		customPresets = [];
		showCustom = false;
		customAdded = false;
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 150 }}
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/50" on:click={close} on:keydown={() => {}} />

		<!-- Modal -->
		<div
			class="relative bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] max-w-2xl w-full max-h-[80vh] overflow-y-auto"
			transition:fly={{ y: 20, duration: 200 }}
		>
			<!-- Header -->
			<div class="px-6 py-4 border-b-[3px] border-gray-900 bg-[#ffc480]/10 flex items-center justify-between">
				<div>
					<h2 class="text-xl font-black text-gray-900">Resize with AI</h2>
					<p class="text-sm text-gray-600 mt-1">
						Current: {$editor.width}x{$editor.height} — select target platforms
					</p>
				</div>
				<button on:click={close} class="p-1 hover:bg-gray-200 rounded transition-colors">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Platform Grid -->
			{#if resizeResults.length === 0}
				<div class="p-6">
					<!-- Generate All Sizes button -->
					<button
						on:click={generateAllSizes}
						disabled={isResizing}
						class="w-full mb-4 py-3 px-4 font-bold text-sm border-[3px] border-gray-900
							bg-[#ffc480] shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937]
							hover:translate-x-[2px] hover:translate-y-[2px] transition-all
							disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{#if isResizing}
							<div class="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
							Generating... ({completedCount}/{totalCount})
						{:else}
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
							</svg>
							Generate All Sizes
						{/if}
					</button>

					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
						{#each allPresets as preset}
							<button
								on:click={() => togglePreset(preset.id)}
								class="p-3 text-center border-2 transition-all duration-150
									{selectedPresets.has(preset.id)
										? 'border-gray-900 bg-[#ffc480]/20 shadow-[3px_3px_0_0_#1f2937]'
										: 'border-gray-200 hover:border-gray-400'}"
							>
								<div class="w-8 h-8 bg-gray-100 border border-gray-300 rounded-lg mx-auto mb-1 flex items-center justify-center">
									<svg class="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d={preset.iconPath} />
									</svg>
								</div>
								<span class="text-xs font-bold text-gray-900 block">{preset.label}</span>
								<span class="text-[10px] text-gray-500">{preset.width}x{preset.height}</span>
							</button>
						{/each}

						<!-- Add Custom Size button -->
						{#if !showCustom}
							<button
								on:click={() => (showCustom = true)}
								class="p-3 text-center border-2 border-dashed border-gray-300 hover:border-gray-500 transition-all duration-150 flex flex-col items-center justify-center gap-1"
							>
								<div class="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg mx-auto mb-1 flex items-center justify-center">
									<svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
									</svg>
								</div>
								<span class="text-xs font-bold text-gray-500 block">Custom Size</span>
							</button>
						{/if}
					</div>

					<!-- Custom Size Form -->
					{#if showCustom}
						<div class="mt-4 p-4 border-2 border-gray-900 bg-gray-50">
							<div class="flex items-center gap-3 mb-3">
								<div class="flex-1">
									<label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Name</label>
									<input
										type="text"
										bind:value={customName}
										placeholder="e.g. Email Header"
										class="w-full px-3 py-2 text-sm border-2 border-gray-300 focus:border-gray-900 outline-none font-bold"
									/>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<div class="flex-1">
									<label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Width</label>
									<input
										type="number"
										bind:value={customWidth}
										min="100"
										max="4096"
										class="w-full px-3 py-2 text-sm border-2 border-gray-300 focus:border-gray-900 outline-none font-bold"
									/>
								</div>
								<span class="text-gray-400 font-bold mt-4">x</span>
								<div class="flex-1">
									<label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Height</label>
									<input
										type="number"
										bind:value={customHeight}
										min="100"
										max="4096"
										class="w-full px-3 py-2 text-sm border-2 border-gray-300 focus:border-gray-900 outline-none font-bold"
									/>
								</div>
								<button
									on:click={addCustomSize}
									class="mt-4 px-4 py-2 bg-gray-900 text-white font-bold text-xs border-2 border-gray-900
										shadow-[3px_3px_0_0_#ffc480] hover:shadow-[1px_1px_0_0_#ffc480] hover:translate-x-[1px] hover:translate-y-[1px]
										transition-all duration-150"
								>
									Add
								</button>
								<button
									on:click={() => (showCustom = false)}
									class="mt-4 p-2 text-gray-400 hover:text-gray-600"
								>
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
					{/if}

					<div class="mt-6 flex items-center justify-between">
						<span class="text-sm text-gray-500">{selectedPresets.size} selected</span>
						<button
							on:click={handleResize}
							disabled={selectedPresets.size === 0 || isResizing}
							class="px-6 py-3 bg-gray-900 text-white font-bold border-2 border-gray-900
								shadow-[4px_4px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px]
								transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{#if isResizing}
								<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								{resizeProgress}
							{:else}
								Resize with AI →
							{/if}
						</button>
					</div>
				</div>
			{:else}
				<!-- Results -->
				<div class="p-6">
					<h3 class="font-bold text-gray-900 mb-4">Results</h3>
					<div class="space-y-3">
						{#each resizeResults as result}
							<div class="flex items-center justify-between p-4 border-2 border-gray-200 bg-gray-50">
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 bg-gray-100 border border-gray-300 rounded flex items-center justify-center flex-shrink-0">
									<svg class="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d={result.preset.iconPath} />
									</svg>
								</div>
									<div>
										<span class="font-bold text-sm text-gray-900">{result.preset.label}</span>
										<span class="text-xs text-gray-500 ml-2">{result.preset.width}x{result.preset.height}</span>
									</div>
								</div>
								{#if result.success}
									{#if savedLayouts.has(result.preset.id)}
										<span class="px-4 py-2 bg-green-600 text-white font-bold text-xs border-2 border-green-700 inline-flex items-center gap-1">
											<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
											</svg>
											Saved
										</span>
									{:else}
										<button
											on:click={() => useResult(result)}
											class="px-4 py-2 bg-gray-900 text-white font-bold text-xs border-2 border-gray-900
												shadow-[3px_3px_0_0_#4ade80] hover:shadow-[1px_1px_0_0_#4ade80] hover:translate-x-[2px] hover:translate-y-[2px]
												transition-all duration-150"
										>
											Save Layout
										</button>
									{/if}
								{:else}
									<span class="text-xs text-red-500 font-bold">Failed</span>
								{/if}
							</div>
						{/each}
					</div>

					<div class="mt-4 flex justify-between">
						<button
							on:click={() => { resizeResults = []; selectedPresets = new Set(); }}
							class="text-sm text-gray-500 hover:text-gray-700 font-bold"
						>
							← Resize More
						</button>
						<button
							on:click={close}
							class="text-sm text-gray-500 hover:text-gray-700 font-bold"
						>
							Done
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
