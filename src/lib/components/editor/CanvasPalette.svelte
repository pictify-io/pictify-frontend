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
		} catch (err) { /* ignored */ }
	}
</script>

<div class="space-y-3">
	<div class="text-xs font-black text-gray-900 uppercase tracking-wider">Color Palette</div>

	<!-- Canvas Colors -->
	{#if canvasColors.length}
		<div>
			<div class="text-[10px] text-gray-500 mb-2 uppercase font-black tracking-widest">
				Canvas Colors ({canvasColors.length})
			</div>
			<div class="flex flex-wrap gap-2">
				{#each canvasColors as color}
					<div class="flex flex-col items-center">
						<div
							class="w-12 h-12 rounded border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937]"
							style="background-color: {color}"
							title={color}
						/>
						<div class="text-[9px] text-gray-900 mt-1 text-center font-mono font-bold">
							{color.substring(0, 7)}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="text-xs text-gray-500 italic py-2 font-medium">
			No colors detected. Add elements to see colors.
		</div>
	{/if}

	<!-- Harmony Generators -->
	<div class="pt-3 border-t-2 border-gray-900">
		<div class="text-[10px] text-gray-500 mb-2 uppercase font-black tracking-widest">
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
		<div class="pt-3 border-t-2 border-gray-900">
			<div class="text-[10px] text-gray-500 mb-2 uppercase font-black tracking-widest">
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
							class="w-10 h-10 rounded border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#ffc480] hover:-translate-y-0.5 transition-all cursor-pointer relative"
							style="background-color: {color}"
						>
							{#if copiedColor === color}
								<div
									class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded"
								>
									<i class="fa fa-check text-white text-xs" />
								</div>
							{/if}
						</div>
						<div class="text-[9px] text-gray-900 mt-1 text-center font-mono font-bold">
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
