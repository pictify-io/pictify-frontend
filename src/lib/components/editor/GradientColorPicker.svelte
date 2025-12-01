<script>
	import { onMount } from 'svelte';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { editor } from '../../../store/editor.store';
	import { clamp, gradientStopsToCss, normalizeStops, toGradientStops, isGradientValue, extractGradientAngle } from '../../utils/gradient';
	import { extractCanvasColors, generateCanvasPalette } from '../../utils/palette';

	export let label = 'Color';
	export let value;
	export let defaultColor = '#000000';
	export let supportsGradient = true;
	export let onSolidChange = (color) => {};
	export let onGradientChange = (stops, angle) => {};
	export let gradientAngle = 90; // Default angle for gradient (90 = left to right)

	// Helper to generate IDs
	const generateId = () => Math.random().toString(36).substr(2, 9);

	// Ensure stops have unique IDs
	const ensureIds = (stops) => {
		const seenIds = new Set();
		return stops.map(s => {
			// If no ID or duplicate ID, generate a new one
			if (!s.id || seenIds.has(s.id)) {
				const newId = generateId();
				seenIds.add(newId);
				return { ...s, id: newId };
			}
			seenIds.add(s.id);
			return s;
		});
	};

	let localStops = [];
	let activeStopId = null;
	let draggingId = null;
	let gradientBarElement;
	let showColorPicker = false;
	let pickerButton;
	let modalPosition = { top: 0, left: 0 };
	let supportsEyeDropper = false;
	
	// Canvas palette state
	let canvasColors = [];
	let generatedPalette = [];
	let copiedColor = null;
	
	// Extract canvas colors reactively and clear generated palette when canvas changes
	$: if ($editor) {
		const newColors = extractCanvasColors($editor);
		// Only update if colors actually changed
		if (JSON.stringify(newColors) !== JSON.stringify(canvasColors)) {
			canvasColors = newColors;
			// Clear generated palette when canvas colors change
			generatedPalette = [];
		}
	}

	// Initialize local stops from value
	// We use a function to avoid circular dependency on localStops in the reactive statement
	function updateLocalStopsFromValue(val) {
		if (supportsGradient && isGradientValue(val)) {
			const parsedStops = normalizeStops(toGradientStops(val, defaultColor));
			
			// Check if stops are effectively the same to avoid losing IDs/selection
			// This prevents resetting activeStopId when value round-trips from parent
			const isSame = localStops.length === parsedStops.length && localStops.every((s, i) => {
				const p = parsedStops[i];
				const offsetMatch = Math.abs(s.offset - p.offset) < 0.001;
				const colorMatch = s.color === p.color;
				return offsetMatch && colorMatch;
			});
			
			if (!draggingId && !isSame) {
				localStops = ensureIds(parsedStops);
				if (!activeStopId || !localStops.find(s => s.id === activeStopId)) {
					activeStopId = localStops[0]?.id;
				}
				// Extract and restore gradient angle
				if (typeof val === 'object' && val.coords) {
					gradientAngle = extractGradientAngle(val);
				}
			}
		} else if (!isGradientValue(val)) {
            // Reset to default stops for solid colors
            localStops = ensureIds(toGradientStops(val, defaultColor));
            activeStopId = localStops[0]?.id;
        }
	}

	$: updateLocalStopsFromValue(value);

	$: solidColor = typeof value === 'string' && value && !isGradientValue(value) ? value : defaultColor;
	$: mode = supportsGradient && isGradientValue(value) ? 'gradient' : 'solid';
	
	$: displayColor = mode === 'solid' ? solidColor : (localStops[0]?.color || defaultColor);
	$: previewBackground = mode === 'gradient' ? gradientStopsToCss(localStops, gradientAngle) : solidColor;

	function handleSolidChange(e) {
		const color = e.detail.hex;
		solidColor = color;
		onSolidChange?.(color);
	}

	function updateGradient() {
		const normalized = normalizeStops(localStops);
		// Ensure all stops have IDs after normalization
		localStops = ensureIds(normalized);
		onGradientChange?.(normalized, gradientAngle);
	}
	
	function handleAngleChange(e) {
		gradientAngle = parseInt(e.target.value);
		updateGradient();
	}
	
	// Gradient presets
	const gradientPresets = [
		{ name: 'Sunset', colors: ['#FF512F', '#F09819'], angle: 90 },
		{ name: 'Ocean', colors: ['#2E3192', '#1BFFFF'], angle: 90 },
		{ name: 'Purple', colors: ['#667eea', '#764ba2'], angle: 135 },
		{ name: 'Fire', colors: ['#f83600', '#f9d423'], angle: 45 },
		{ name: 'Forest', colors: ['#134E5E', '#71B280'], angle: 90 },
		{ name: 'Rose', colors: ['#ee0979', '#ff6a00'], angle: 90 }
	];
	
	function applyPreset(preset) {
		localStops = ensureIds(preset.colors.map((color, index) => ({
			color,
			offset: index / (preset.colors.length - 1)
		})));
		activeStopId = localStops[0]?.id;
		gradientAngle = preset.angle;
		updateGradient();
	}

	function handleStopColorChange(e) {
		if (!activeStopId) return;
		const color = e.detail.hex;
		localStops = localStops.map(s => s.id === activeStopId ? { ...s, color } : s);
		updateGradient();
	}

	function switchToGradient() {
		if (!supportsGradient) return;
		if (!localStops.length || localStops.length < 2) {
            localStops = ensureIds([
                { color: solidColor, offset: 0 },
                { color: solidColor, offset: 1 }
            ]);
        }
        if (!activeStopId) activeStopId = localStops[0]?.id;
        
		updateGradient();
	}

	function switchToSolid() {
        const color = mode === 'gradient' ? (localStops[0]?.color || defaultColor) : solidColor;
		onSolidChange?.(color);
	}

	function handleBarMouseDown(e) {
		if (e.target !== gradientBarElement) return;
		const rect = gradientBarElement.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const offset = clamp(x / rect.width);
		
		const color = interpolateGradientColor(localStops, offset);
		
		const newStop = {
			id: generateId(),
			color,
			offset
		};
		
		localStops = [...localStops, newStop];
		activeStopId = newStop.id;
		draggingId = newStop.id;
		updateGradient();
	}

	function interpolateGradientColor(stops, offset) {
		if (stops.length === 0) return '#ffffff';
		if (stops.length === 1) return stops[0].color;
		
		const sorted = [...stops].sort((a, b) => a.offset - b.offset);
		
		let before = sorted[0];
		let after = sorted[sorted.length - 1];
		
		for (let i = 0; i < sorted.length - 1; i++) {
			if (sorted[i].offset <= offset && sorted[i + 1].offset >= offset) {
				before = sorted[i];
				after = sorted[i + 1];
				break;
			}
		}
		
		return before.color;
	}

	function handleStopMouseDown(e, id) {
		e.stopPropagation();
		activeStopId = id;
		draggingId = id;
	}
    
    function handleStopDelete(id) {
        if (localStops.length <= 2) return;
        localStops = localStops.filter(s => s.id !== id);
        if (activeStopId === id) {
            activeStopId = localStops[0].id;
        }
        updateGradient();
    }

	function handleWindowMouseMove(e) {
		if (!draggingId) return;
        
        if (!gradientBarElement) return;
		const rect = gradientBarElement.getBoundingClientRect();
		
        let x = e.clientX - rect.left;
        let offset = clamp(x / rect.width);
        
        localStops = localStops.map(s => s.id === draggingId ? { ...s, offset } : s);
        updateGradient();
	}

	let justFinishedDragging = false;

	function handleWindowMouseUp() {
		if (draggingId) {
			justFinishedDragging = true;
			setTimeout(() => {
				justFinishedDragging = false;
			}, 100);
		}
		draggingId = null;
	}
    
    $: activeStopColor = localStops.find(s => s.id === activeStopId)?.color || '#ffffff';

	function toggleColorPicker() {
		showColorPicker = !showColorPicker;
		
		if (showColorPicker && pickerButton) {
			// Calculate position - open to the left
			const rect = pickerButton.getBoundingClientRect();
			const modalWidth = 280;
			const gap = 8;
			
			// Position to the left of the button
			modalPosition = {
				top: rect.top,
				left: rect.left - modalWidth - gap
			};
			
			// Adjust if off-screen
			if (modalPosition.left < 10) {
				// If not enough space on left, open to right
				modalPosition.left = rect.right + gap;
			}
			
			// Adjust vertical position if needed
			const modalHeight = 450;
			if (modalPosition.top + modalHeight > window.innerHeight - 20) {
				modalPosition.top = window.innerHeight - modalHeight - 20;
			}
		} else {
			// Removed debug log
		}
	}

	function handleClickOutside(e) {
		if (!showColorPicker) return;
		
		// Ignore clicks on elements that were removed from DOM (e.g. due to re-render)
		if (!e.target.isConnected) {
			console.log('[ColorPicker] Ignoring click on detached element');
			return;
		}
		
		const isInsideButton = pickerButton && pickerButton.contains(e.target);
		const isInsideModal = e.target.closest('.color-picker-modal');
		
		if (!isInsideButton && !isInsideModal) {
			console.log('[ColorPicker] Click outside detected, closing');
			showColorPicker = false;
		}
	}

	async function handleEyedropper() {
		if (!window.EyeDropper) {
			alert('Eyedropper not supported in this browser. Please use Chrome or Edge.');
			return;
		}
		
		try {
			const eyeDropper = new EyeDropper();
			const result = await eyeDropper.open();
			
			if (result && result.sRGBHex) {
				if (mode === 'solid') {
					solidColor = result.sRGBHex;
					onSolidChange?.(result.sRGBHex);
				} else if (mode === 'gradient' && activeStopId) {
					localStops = localStops.map(s => 
						s.id === activeStopId ? { ...s, color: result.sRGBHex } : s
					);
					updateGradient();
				}
			}
		} catch (err) {
			// User cancelled the eyedropper
			console.log('Eyedropper cancelled');
		}
	}
	
	// Generate smart palette from all canvas colors
	function generateSmartPalette(type) {
		generatedPalette = generateCanvasPalette(canvasColors, type);
	}
	
	// Apply a palette color
	function applyPaletteColor(color) {
		if (mode === 'solid') {
			solidColor = color;
			onSolidChange?.(color);
		} else if (mode === 'gradient' && activeStopId) {
			localStops = localStops.map(s => 
				s.id === activeStopId ? { ...s, color } : s
			);
			updateGradient();
		}
	}
	
	// Copy color to clipboard
	async function copyColorToClipboard(color) {
		try {
			await navigator.clipboard.writeText(color);
			copiedColor = color;
			setTimeout(() => {
				copiedColor = null;
			}, 1500);
		} catch (err) {
			console.error('Failed to copy color:', err);
		}
	}

	onMount(() => {
		// Check if EyeDropper API is supported
		supportsEyeDropper = 'EyeDropper' in window;
		
		window.addEventListener('click', handleClickOutside);
		return () => {
			window.removeEventListener('click', handleClickOutside);
		};
	});

	// Portal action to move element to body
	function portal(node) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}
</script>

<svelte:window on:mousemove={handleWindowMouseMove} on:mouseup={handleWindowMouseUp} />

<div class="space-y-2">
	<!-- Label and Color Preview Button -->
	<div class="flex items-center justify-between">
		<div class="text-xs font-medium text-gray-700">{label}</div>
		<button
			bind:this={pickerButton}
			type="button"
			class="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-gray-300 hover:border-gray-400 transition-colors bg-white"
			on:click={(e) => { console.log('[ColorPicker] Button clicked!'); e.stopPropagation(); toggleColorPicker(); }}
		>
			<!-- Color Preview Swatch -->
			<div class="relative w-6 h-6 rounded overflow-hidden border border-gray-200">
				<!-- Checkerboard background -->
				<div class="absolute inset-0 opacity-30" 
					 style="background-image: repeating-conic-gradient(#ddd 0% 25%, white 0% 50%); background-size: 8px 8px;">
				</div>
				<div class="absolute inset-0" style="background: {previewBackground}"></div>
			</div>
			<i class="fa fa-chevron-down text-[10px] text-gray-400"></i>
		</button>
	</div>
</div>

<!-- Modal Color Picker -->
{#if showColorPicker}
	<div 
		use:portal
		class="fixed color-picker-modal"
		style="top: {modalPosition.top}px; left: {modalPosition.left}px; width: 280px; z-index: 999999 !important;"
	>
		<div class="bg-white rounded-lg shadow-2xl overflow-hidden">
			<!-- Header with close button -->
		<div class="px-3 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
			<span class="text-xs font-semibold text-gray-700">{label}</span>
			<div class="flex items-center gap-1">
				<!-- Eyedropper Button -->
				{#if supportsEyeDropper}
					<button
						type="button"
						class="p-1.5 rounded hover:bg-gray-200 transition-colors"
						on:click={handleEyedropper}
						title="Pick color from screen"
					>
						<i class="fa fa-eye-dropper text-xs text-gray-600"></i>
					</button>
				{/if}
				<!-- Close Button -->
				<button
					type="button"
					class="text-gray-400 hover:text-gray-600 transition-colors p-1"
					on:click={() => showColorPicker = false}
				>
					<i class="fa fa-times text-sm"></i>
				</button>
			</div>
		</div>

			<!-- Mode Switcher (only if gradient supported) -->
			{#if supportsGradient}
				<div class="px-3 py-2 bg-white border-b border-gray-200">
					<div class="flex bg-gray-100 rounded-md p-0.5">
						<button
							type="button"
							class="flex-1 px-3 py-1.5 text-xs font-medium rounded transition-all {mode === 'solid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
							on:click={switchToSolid}
						>
							Solid
						</button>
						<button
							type="button"
							class="flex-1 px-3 py-1.5 text-xs font-medium rounded transition-all {mode === 'gradient' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
							on:click={switchToGradient}
						>
							Gradient
						</button>
					</div>
				</div>
			{/if}
			
			<!-- Gradient Presets (shown in gradient mode) -->
			{#if mode === 'gradient'}
				<div class="px-3 py-2 bg-gray-50 border-b border-gray-200">
					<div class="text-[10px] text-gray-500 mb-1.5 uppercase font-semibold tracking-wide">Quick Presets</div>
					<div class="grid grid-cols-3 gap-1.5">
						{#each gradientPresets as preset}
							<button
								type="button"
								class="h-8 rounded overflow-hidden border border-gray-200 hover:border-[#ff6b6b] transition-all hover:scale-105"
								style="background: linear-gradient({preset.angle}deg, {preset.colors.join(', ')})"
								on:click={() => applyPreset(preset)}
								title={preset.name}
							>
								<span class="sr-only">{preset.name}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Gradient Bar (shown in gradient mode) -->
			{#if mode === 'gradient'}
				<div class="px-3 py-3 bg-white border-b border-gray-200">
					<div class="text-[10px] text-gray-500 mb-2">
						Click to add stops • Drag to move • Double-click to delete
					</div>
					<div class="relative h-8 w-full select-none rounded overflow-hidden mb-2">
						<!-- Checkerboard background -->
						<div class="absolute inset-0 opacity-30" 
							 style="background-image: repeating-conic-gradient(#ddd 0% 25%, white 0% 50%); background-size: 8px 8px;">
						</div>
						
						<!-- Gradient Preview -->
						<div
							role="button"
							tabindex="0"
							bind:this={gradientBarElement}
							class="absolute inset-0 cursor-crosshair"
							style="background: {gradientStopsToCss(localStops, gradientAngle)}"
							on:mousedown={handleBarMouseDown}
						></div>
						
						<!-- Stops -->
						{#each localStops as stop (stop.id)}
							<button
								type="button"
								class="absolute -ml-2.5 w-5 h-full flex items-center justify-center outline-none focus:outline-none z-10"
								style="left: {stop.offset * 100}%"
								on:mousedown={(e) => handleStopMouseDown(e, stop.id)}
								on:dblclick={() => handleStopDelete(stop.id)}
							>
								<div 
									class="w-5 h-5 rounded-full border-2 shadow-lg transition-all hover:scale-110 {activeStopId === stop.id ? 'border-[#ff6b6b] scale-110 ring-2 ring-[#ff6b6b]/30' : 'border-white'}"
									style="background-color: {stop.color}"
								></div>
							</button>
						{/each}
					</div>
					
					<!-- Gradient Angle Control -->
					<div class="mt-3">
						<div class="flex items-center justify-between mb-1.5">
							<label class="text-xs text-gray-600 font-medium">Angle</label>
							<span class="text-xs text-gray-500">{gradientAngle}°</span>
						</div>
						<input
							type="range"
							min="0"
							max="360"
							step="1"
							value={gradientAngle}
							on:input={handleAngleChange}
							class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff6b6b]"
						/>
						<div class="flex justify-between text-[9px] text-gray-400 mt-0.5">
							<span>0°</span>
							<span>90°</span>
							<span>180°</span>
							<span>270°</span>
							<span>360°</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Gradient Stop Delete Button -->
			{#if mode === 'gradient' && activeStopId && localStops.length > 2}
				<div class="px-3 pb-2 bg-white border-b border-gray-200">
					<button 
						type="button"
						class="w-full text-xs text-red-600 hover:text-red-700 px-2 py-1.5 rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
						on:click={() => handleStopDelete(activeStopId)}
					>
						<i class="fa fa-trash"></i>
						<span>Delete</span>
					</button>
				</div>
			{/if}

			<!-- Color Picker -->
			<div class="bg-white p-3 flex justify-center">
				<div class="w-full max-w-[254px]">
					{#if mode === 'solid'}
						<ColorPicker
							hex={solidColor}
							isDialog={false}
							on:input={handleSolidChange}
						/>
					{:else if activeStopId}
						<ColorPicker
							hex={activeStopColor}
							isDialog={false}
							on:input={handleStopColorChange}
						/>
					{/if}
					
					<!-- Canvas Palette Section -->
					<div class="px-3 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
						<!-- Canvas Colors -->
						{#if canvasColors.length > 0}
							<div>
								<div class="text-[10px] text-gray-500 mb-1.5 uppercase font-semibold tracking-wide">
									Canvas Colors ({canvasColors.length})
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each canvasColors.slice(0, 8) as color}
										<button
											type="button"
											class="w-7 h-7 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer"
											style="background-color: {color}"
											on:click={() => applyPaletteColor(color)}
											title="Apply {color}"
										/>
									{/each}
								</div>
							</div>
						{/if}
						
						<!-- Generate Harmonies -->
						<div>
							<div class="text-[10px] text-gray-500 mb-1.5 uppercase font-semibold tracking-wide">
								Generate Harmony
							</div>
							<div class="grid grid-cols-2 gap-1">
								<button 
									type="button"
									class="btn-harmony" 
									on:click={() => generateSmartPalette('complementary')}
									disabled={canvasColors.length === 0}
								>
									Complementary
								</button>
								<button 
									type="button"
									class="btn-harmony" 
									on:click={() => generateSmartPalette('analogous')}
									disabled={canvasColors.length === 0}
								>
									Analogous
								</button>
								<button 
									type="button"
									class="btn-harmony" 
									on:click={() => generateSmartPalette('triadic')}
									disabled={canvasColors.length === 0}
								>
									Triadic
								</button>
								<button 
									type="button"
									class="btn-harmony" 
									on:click={() => generateSmartPalette('tetradic')}
									disabled={canvasColors.length === 0}
								>
									Tetradic
								</button>
							</div>
						</div>
						
						<!-- Generated Palette -->
						{#if generatedPalette.length > 0}
							<div>
								<div class="text-[10px] text-gray-500 mb-1.5 uppercase font-semibold tracking-wide">
									Generated Colors
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each generatedPalette as color}
										<button
											type="button"
											class="relative w-8 h-8 rounded border-2 border-white shadow hover:scale-110 transition-transform cursor-pointer"
											style="background-color: {color}"
											on:click={() => applyPaletteColor(color)}
											title="Click to apply {color}"
										>
											{#if copiedColor === color}
												<div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
													<i class="fa fa-check text-white text-xs"></i>
												</div>
											{/if}
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Make color picker fit within modal */
	:global(.color-picker) {
		width: 100% !important;
		max-width: 100% !important;
		border: none !important;
		margin: 0 !important;
		padding: 0 !important;
	}
	
	:global(.color-picker canvas) {
		max-width: 100% !important;
		width: 100% !important;
		border: none !important;
		margin: 0 auto !important;
		display: block !important;
	}
	
	:global(.color-picker .picker-wrapper) {
		max-width: 100% !important;
		border: none !important;
		margin: 0 !important;
		padding: 0 !important;
	}
	
	:global(.color-picker-wrapper) {
		border: none !important;
		margin: 0 !important;
		padding: 0 !important;
	}
	
	:global(.color-picker input[type="text"]) {
		max-width: 100% !important;
	}
	
	:global(.color-picker .slider-wrapper) {
		max-width: 100% !important;
		margin: 0 !important;
	}

	/* Remove all borders from color picker components */
	:global(.color-picker *) {
		border-color: transparent !important;
	}

	/* Center all color picker elements */
	:global(.color-picker > *) {
		margin-left: auto !important;
		margin-right: auto !important;
	}

	/* Smooth entrance animation */
	.color-picker-modal {
		animation: slideIn 0.15s ease-out;
	}
	
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	
	.btn-harmony {
		padding: 0.375rem 0.5rem;
		font-size: 10px;
		font-weight: 500;
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		transition: all 0.2s;
		cursor: pointer;
	}
	
	.btn-harmony:hover:not(:disabled) {
		border-color: #ff6b6b;
		background-color: #ff6b6b/5;
	}
	
	.btn-harmony:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

