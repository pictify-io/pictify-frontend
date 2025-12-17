<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { editElement } from '../../../api/copilot';
	import { editor } from '../../../store/editor.store';
	import { fade, scale as scaleAnim, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	export let element;
	export let scale = 1;

// Normalize provided scale (store passes percentage, but we operate on ratios)
$: zoomFactor = Math.max(Number(scale) || 1, 0.01);

	let prompt = '';
	let isLoading = false;
	let error = '';
	let isOpen = false;
	let textarea;

	// Calculate position
	// We want it to appear at the top-right corner of the element
	$: coords = element && element.aCoords ? element.aCoords.tr : { x: 0, y: 0 };
	
// Add a visual gap
$: gap = 12 * zoomFactor; // Scale the gap too

	// Get canvas position on screen
	$: canvasRect = element && element.canvas && element.canvas.getElement().getBoundingClientRect();

// Calculate screen coordinates
// element.left/top are relative to canvas. We need to multiply by zoomFactor and add canvas offset.
// coords.x/y are already transformed coordinates on the canvas.
$: screenX = canvasRect ? canvasRect.left + (coords.x * zoomFactor) : 0;
$: screenY = canvasRect ? canvasRect.top + (coords.y * zoomFactor) : 0;

	// Calculate clamped position
	$: iconSize = 40; // Fixed size in pixels (not scaled)
	$: expandedWidth = 300; // Approx width of expanded box
	
	$: leftPos = (() => {
		if (!canvasRect) return 0;
		
		const targetX = screenX + gap;
		const widthToCheck = isOpen ? expandedWidth : iconSize;
		
		// Clamp to window width
		if (typeof window !== 'undefined') {
			if (targetX + widthToCheck > window.innerWidth - 20) { // 20px padding
				return window.innerWidth - widthToCheck - 20;
			}
		}
		return targetX;
	})();

	$: topPos = (() => {
		if (!canvasRect) return 0;

		const targetY = screenY - gap;
		// If we are near the top edge, ensure we don't go off-screen
		// The transform is -100% Y, so the bottom of the icon is at topPos.
		if (targetY - iconSize < 60) { // 60px for top bar
			return targetY + iconSize + gap; // Flip to bottom if too close to top
		}
		return targetY;
	})();

	// Position fixed relative to viewport
	$: style = `
		left: ${leftPos}px; 
		top: ${topPos}px; 
		transform: translate(0, ${topPos > screenY ? '0' : '-100%'}); 
		position: fixed;
		z-index: 9999;
	`;

	async function handleGenerate() {
		if (!prompt.trim() || !element) return;
		
		isLoading = true;
		error = '';

		try {
			const elementData = element.toObject();
			const context = {
				width: $editor.width,
				height: $editor.height,
				background: $editor.backgroundColor
			};

			const response = await editElement(elementData, prompt, context);

			if (response.element) {
				element.set(response.element);
				element.setCoords();
				$editor.renderAll();
				prompt = '';
				// Keep open for iteration, but maybe show success state?
			}
		} catch (err) {
			console.error(err);
			error = 'Failed to update. Try a different prompt.';
		} finally {
			isLoading = false;
			// Re-focus textarea
			if (textarea) textarea.focus();
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleGenerate();
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			isOpen = false;
		}
	}

	function toggleOpen() {
		isOpen = !isOpen;
	}

	// Global ESC handler
	function handleGlobalKeydown(e) {
		if (isOpen && e.key === 'Escape') {
			isOpen = false;
		}
	}
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

{#if element}
	<div 
		class="absolute z-50 pointer-events-none"
		style={style}
	>
		<!-- Inner container with pointer-events-auto to capture clicks -->
		<div class="pointer-events-auto">
			{#if !isOpen}
				<button
					class="group flex items-center justify-center w-10 h-10 bg-[#ffc480] rounded-full shadow-[4px_4px_0_0_#1f2937] border-[3px] border-gray-900 hover:scale-110 transition-all duration-300 hover:shadow-xl"
					on:click={toggleOpen}
					title="Edit with Copilot (Cmd+K)"
					in:scaleAnim={{ duration: 300, start: 0.8, easing: cubicOut }}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M5 16C5.55228 16 6 15.5523 6 15C6 14.4477 5.55228 14 5 14C4.44772 14 4 14.4477 4 15C4 15.5523 4.44772 16 5 16Z" fill="white"/>
						<path d="M17 4C17.5523 4 18 3.55228 18 3C18 2.44772 17.5523 2 17 2C16.4477 2 16 2.44772 16 3C16 3.55228 16.4477 4 17 4Z" fill="white"/>
						<path d="M19 16C19.5523 16 20 15.5523 20 15C20 14.4477 19.5523 14 19 14C18.4477 14 18 14.4477 18 15C18 15.5523 18.4477 16 19 16Z" fill="white"/>
						<path d="M12 19C12.5523 19 13 18.5523 13 18C13 17.4477 12.5523 17 12 17C11.4477 17 11 17.4477 11 18C11 18.5523 11.4477 19 12 19Z" fill="white"/>
						<path fill-rule="evenodd" clip-rule="evenodd" d="M15.5858 5.58579C16.3668 4.80474 17.6332 4.80474 18.4142 5.58579C19.1953 6.36683 19.1953 7.63316 18.4142 8.41421L8.41421 18.4142C7.63316 19.1953 6.36683 19.1953 5.58579 18.4142C4.80474 17.6332 4.80474 16.3668 5.58579 15.5858L15.5858 5.58579ZM17 7L7 17L8.41421 18.4142L18.4142 8.41421L17 7Z" fill="white"/>
					</svg>
				</button>
			{:else}
				<div 
					class="w-[320px] bg-[#FFFDF8] rounded-xl shadow-[8px_8px_0_0_#1f2937] border-[3px] border-gray-900 overflow-hidden"
					transition:fly={{ y: 10, duration: 300, easing: cubicOut }}
				>
					<!-- Header -->
					<div class="px-4 py-3 bg-[#FFFDF8] border-b-[3px] border-gray-900 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ffc480] flex items-center justify-center shadow-sm ring-2 ring-white">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
									<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
								</svg>
							</div>
							<span class="text-sm font-bold text-gray-800 tracking-tight">Magic Edit</span>
						</div>
						<button 
							class="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
							on:click={toggleOpen}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					</div>
					
					<!-- Content -->
					<div class="p-4">
						<textarea
							bind:this={textarea}
							bind:value={prompt}
							on:keydown={handleKeydown}
							placeholder="Describe how you want to change this element..."
							class="w-full text-sm border-2 border-gray-900 rounded-lg p-3 focus:shadow-[4px_4px_0_0_#ffc480] focus:border-gray-900 focus:ring-0 min-h-[100px] resize-none bg-white mb-3 placeholder-gray-500 transition-all shadow-[4px_4px_0_0_#1f2937] font-medium"
							disabled={isLoading}
							autofocus
						></textarea>
						
						{#if error}
							<div class="flex items-center gap-2 text-xs text-red-500 mb-3 px-1 bg-red-50 p-2 rounded-lg border border-red-100" transition:fly={{ y: -5 }}>
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="12" y1="8" x2="12" y2="12"></line>
									<line x1="12" y1="16" x2="12.01" y2="16"></line>
								</svg>
								{error}
							</div>
						{/if}

						<div class="flex justify-between items-center">
							<span class="text-[11px] text-gray-400 font-medium px-1 flex items-center gap-1">
								{#if isLoading}
									<span class="animate-pulse text-[#ff6b6b] font-semibold">Generating changes...</span>
								{:else}
									<span class="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-[10px]">Enter</span> to generate
								{/if}
							</span>

							<button
								class="bg-gray-900 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#ffc480] hover:-translate-y-0.5 active:scale-95"
								on:click={handleGenerate}
								disabled={isLoading || !prompt.trim()}
							>
								{#if isLoading}
									<svg class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
								{:else}
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<line x1="22" y1="2" x2="11" y2="13"></line>
										<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
									</svg>
								{/if}
								Generate
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>

	</div>
{/if}
