<script>
	import { editor } from '../../../store/editor.store';
	import { generatePalette, extractCanvasColors } from '../../utils/palette';
	
	let canvasColors = [];
	let generatedPalette = [];
	let copiedColor = null;
	
	// Extract colors whenever editor changes
	$: if ($editor) {
		canvasColors = extractCanvasColors($editor);
	}
	
	function generateHarmony(type) {
		// Use first canvas color as base, or black if no colors
		const baseColor = canvasColors.length > 0 ? canvasColors[0] : '#000000';
		generatedPalette = generatePalette(baseColor, type);
	}
	
	async function copyToClipboard(color) {
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
</script>

<div class="space-y-3">
	<div class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Color Palette</div>
	
	<!-- Canvas Colors -->
	{#if canvasColors.length}
		<div>
			<div class="text-[10px] text-gray-500 mb-2 uppercase font-semibold tracking-wide">
				Canvas Colors ({canvasColors.length})
			</div>
			<div class="flex flex-wrap gap-2">
				{#each canvasColors as color}
					<div class="flex flex-col items-center">
						<div 
							class="w-12 h-12 rounded-lg shadow-sm border-2 border-white"
							style="background-color: {color}"
							title={color}
						/>
						<div class="text-[9px] text-gray-600 mt-1 text-center font-mono">
							{color.substring(0, 7)}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="text-xs text-gray-400 italic py-2">
			No colors detected. Add elements to see colors.
		</div>
	{/if}
	
	<!-- Harmony Generators -->
	<div class="pt-3 border-t border-gray-200">
		<div class="text-[10px] text-gray-500 mb-2 uppercase font-semibold tracking-wide">
			Generate Harmonies {canvasColors.length > 0 ? `(from ${canvasColors[0]})` : ''}
		</div>
		<div class="grid grid-cols-2 gap-1.5">
			<button 
				type="button"
				class="btn-harmony" 
				on:click={() => generateHarmony('complementary')}
				disabled={canvasColors.length === 0}
			>
				Complementary
			</button>
			<button 
				type="button"
				class="btn-harmony" 
				on:click={() => generateHarmony('analogous')}
				disabled={canvasColors.length === 0}
			>
				Analogous
			</button>
			<button 
				type="button"
				class="btn-harmony" 
				on:click={() => generateHarmony('triadic')}
				disabled={canvasColors.length === 0}
			>
				Triadic
			</button>
			<button 
				type="button"
				class="btn-harmony" 
				on:click={() => generateHarmony('tetradic')}
				disabled={canvasColors.length === 0}
			>
				Tetradic
			</button>
		</div>
	</div>
	
	<!-- Generated Palette -->
	{#if generatedPalette.length}
		<div class="pt-3 border-t border-gray-200">
			<div class="text-[10px] text-gray-500 mb-2 uppercase font-semibold tracking-wide">
				Generated ({generatedPalette.length})
			</div>
			<div class="flex flex-wrap gap-2">
				{#each generatedPalette as color}
					<button
						type="button"
						class="group relative flex flex-col items-center"
						on:click={() => copyToClipboard(color)}
						title="Click to copy {color}"
					>
						<div 
							class="w-10 h-10 rounded-lg shadow-sm border-2 border-white hover:scale-110 transition-transform cursor-pointer relative"
							style="background-color: {color}"
						>
							{#if copiedColor === color}
								<div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
									<i class="fa fa-check text-white text-xs"></i>
								</div>
							{/if}
						</div>
						<div class="text-[9px] text-gray-600 mt-1 text-center font-mono">
							{color.substring(0, 7)}
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
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
		border-color: #3b82f6;
		background-color: #eff6ff;
	}
	
	.btn-harmony:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
