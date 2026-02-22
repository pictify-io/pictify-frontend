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
    const angleId = generateId();

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
			const rect = pickerButton.getBoundingClientRect();
			const modalWidth = 280;
			const modalHeight = 550; // Conservative estimate for gradient mode
			const gap = 8;
			const margin = 10; // Minimum distance from viewport edges

			let top = rect.top;
			let left = rect.left - modalWidth - gap;

			// Horizontal: prefer left, fallback to right, clamp to viewport
			if (left < margin) {
				left = rect.right + gap;
			}
			if (left + modalWidth > window.innerWidth - margin) {
				left = window.innerWidth - modalWidth - margin;
			}
			if (left < margin) {
				left = margin;
			}

			// Vertical: clamp to viewport
			if (top + modalHeight > window.innerHeight - margin) {
				top = window.innerHeight - modalHeight - margin;
			}
			if (top < margin) {
				top = margin;
			}

			modalPosition = { top, left };
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
		<div class="text-[11px] font-medium text-gray-500">{label}</div>
		<button
			bind:this={pickerButton}
			type="button"
			class="flex items-center gap-2 px-2 py-1 rounded-lg border-[2px] border-gray-300 hover:border-gray-400 transition-all bg-white"
			on:click={(e) => { console.log('[ColorPicker] Button clicked!'); e.stopPropagation(); toggleColorPicker(); }}
		>
			<!-- Color Preview Swatch -->
			<div class="relative w-5 h-5 rounded overflow-hidden border border-gray-300">
				<!-- Checkerboard background -->
				<div class="absolute inset-0 opacity-30" 
					 style="background-image: repeating-conic-gradient(#ddd 0% 25%, white 0% 50%); background-size: 8px 8px;">
				</div>
				<div class="absolute inset-0" style="background: {previewBackground}"></div>
			</div>
			<i class="fa fa-chevron-down text-[10px] text-gray-900"></i>
		</button>
	</div>
</div>

<!-- Modal Color Picker -->
{#if showColorPicker}
	<div 
		use:portal
		class="fixed color-picker-modal border-[3px] border-gray-900 rounded-lg shadow-[8px_8px_0_0_#1f2937] bg-white"
		style="top: {modalPosition.top}px; left: {modalPosition.left}px; width: 280px; max-height: calc(100vh - 20px); overflow-y: auto; z-index: 999999 !important;"
	>
		<div class="bg-white">
			<!-- Header with close button -->
		<div class="px-3 py-2 border-b-[2px] border-gray-900 flex items-center justify-between bg-[#FFFDF8]">
			<span class="text-xs font-black text-gray-900 uppercase tracking-widest">{label}</span>
			<div class="flex items-center gap-1">
				<!-- Eyedropper Button -->
				{#if supportsEyeDropper}
					<button
						type="button"
						class="p-1.5 rounded border-[2px] border-transparent hover:border-gray-900 hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
						on:click={handleEyedropper}
						title="Pick color from screen"
					>
						<i class="fa fa-eye-dropper text-xs text-gray-900"></i>
					</button>
				{/if}
				<!-- Close Button -->
				<button
					type="button"
					class="text-gray-900 hover:text-red-600 transition-colors p-1"
					on:click={() => showColorPicker = false}
				>
					<i class="fa fa-times text-sm"></i>
				</button>
			</div>
		</div>

			<!-- Mode Switcher (only if gradient supported) -->
			{#if supportsGradient}
				<div class="px-3 py-2 bg-white border-b-[2px] border-gray-900">
					<div class="flex bg-gray-900 rounded-md p-1 border-[2px] border-gray-900">
						<button
							type="button"
							class="flex-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition-all {mode === 'solid' ? 'bg-[#ffc480] text-gray-900 border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000]' : 'text-white hover:text-[#ffc480]'}"
							on:click={switchToSolid}
						>
							Solid
						</button>
						<button
							type="button"
							class="flex-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition-all {mode === 'gradient' ? 'bg-[#ffc480] text-gray-900 border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000]' : 'text-white hover:text-[#ffc480]'}"
							on:click={switchToGradient}
						>
							Gradient
						</button>
					</div>
				</div>
			{/if}
			
			<!-- Gradient Presets (shown in gradient mode) -->
			{#if mode === 'gradient'}
				<div class="px-3 py-2 bg-[#FFFDF8] border-b-[2px] border-gray-900">
					<div class="text-[10px] text-gray-500 mb-1.5 uppercase font-black tracking-widest">Quick Presets</div>
					<div class="grid grid-cols-3 gap-1.5">
						{#each gradientPresets as preset}
							<button
								type="button"
								class="h-8 rounded overflow-hidden border-[2px] border-gray-900 hover:shadow-[2px_2px_0_0_#ffc480] transition-all hover:-translate-y-0.5"
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
				<div class="px-3 py-3 bg-white border-b-[2px] border-gray-900">
					<div class="text-[10px] text-gray-500 mb-2 font-bold uppercase">
						Click to add • Drag to move • Dbl-click delete
					</div>
					<div class="relative h-8 w-full select-none rounded overflow-hidden mb-2 border-[2px] border-gray-900">
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
									class="w-5 h-5 rounded-full border-[2px] shadow-sm transition-all hover:scale-110 {activeStopId === stop.id ? 'border-gray-900 scale-110 shadow-[0_0_0_2px_#ffc480]' : 'border-white ring-1 ring-gray-900'}"
									style="background-color: {stop.color}"
								></div>
							</button>
						{/each}
					</div>
					
					<!-- Gradient Angle Control -->
					<div class="mt-3">
						<div class="flex items-center justify-between mb-1.5">
							<label for="{angleId}" class="text-xs text-gray-900 font-black uppercase">Angle</label>
							<span class="text-xs text-gray-900 font-mono bg-gray-100 px-1 rounded border border-gray-900">{gradientAngle}°</span>
						</div>
						<input
                            id="{angleId}"
							type="range"
							min="0"
							max="360"
							step="1"
							value={gradientAngle}
							on:input={handleAngleChange}
							class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900 border border-gray-900"
						/>
						<div class="flex justify-between text-[9px] text-gray-400 mt-0.5 font-mono">
							<span>0°</span>
							<span>180°</span>
							<span>360°</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Gradient Stop Delete Button -->
			{#if mode === 'gradient' && activeStopId && localStops.length > 2}
				<div class="px-3 pb-2 bg-white border-b-[2px] border-gray-900 pt-2">
					<button 
						type="button"
						class="w-full text-xs font-black uppercase tracking-wider text-white bg-[#ff6b6b] px-2 py-1.5 rounded border-[2px] border-gray-900 hover:shadow-[2px_2px_0_0_#1f2937] transition-all flex items-center justify-center gap-1.5"
						on:click={() => handleStopDelete(activeStopId)}
					>
						<i class="fa fa-trash"></i>
						<span>Delete Stop</span>
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
					<div class="px-3 py-3 bg-[#FFFDF8] border-t-[2px] border-gray-900 space-y-3 mt-3 rounded border-[2px]">
						<!-- Canvas Colors -->
						{#if canvasColors.length > 0}
							<div>
								<div class="text-[10px] text-gray-500 mb-1.5 uppercase font-black tracking-widest">
									Canvas Colors
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each canvasColors.slice(0, 8) as color}
										<button
											type="button"
											class="w-7 h-7 rounded border-[2px] border-gray-900 shadow-sm hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all cursor-pointer"
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
							<div class="text-[10px] text-gray-500 mb-1.5 uppercase font-black tracking-widest">
								Harmony
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
								<div class="text-[10px] text-gray-500 mb-1.5 uppercase font-black tracking-widest">
									Generated
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each generatedPalette as color}
										<button
											type="button"
											class="relative w-8 h-8 rounded border-[2px] border-gray-900 shadow hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 transition-all cursor-pointer"
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
		font-weight: 800;
        text-transform: uppercase;
		background-color: white;
		border: 2px solid #111827;
		border-radius: 0.375rem;
		transition: all 0.2s;
		cursor: pointer;
        color: #111827;
	}
	
	.btn-harmony:hover:not(:disabled) {
		background-color: #ffc480;
        box-shadow: 2px 2px 0 0 #1f2937;
        transform: translate(-1px, -1px);
	}
	
	.btn-harmony:disabled {
		opacity: 0.5;
		cursor: not-allowed;
        border-color: #d1d5db;
	}
</style>
