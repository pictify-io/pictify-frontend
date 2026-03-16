<script>
	import { onDestroy } from 'svelte';
	import { StaticCanvas } from 'fabric';

	export let templateUid = '';
	export let variables = {};
	export let templateDataCache = {};
	export let variantName = '';

	let preview = { url: null, loading: false, error: null };
	let previewTimeout;

	$: tplData = templateDataCache[templateUid];
	// Single reactive trigger: depend on both tplData and variables to avoid double-render
	$: if (templateUid && tplData?.fabricJSData && variables !== undefined) {
		triggerRender();
	}

	function triggerRender() {
		if (previewTimeout) clearTimeout(previewTimeout);
		previewTimeout = setTimeout(() => renderPreview(), 300);
	}

	async function renderPreview() {
		if (!templateUid || !tplData?.fabricJSData) {
			preview = {
				url: null,
				loading: false,
				error: templateUid ? 'No canvas data available for this template' : null
			};
			return;
		}

		preview = { loading: true, error: null, url: preview.url };

		try {
			const canvasEl = document.createElement('canvas');
			const width = tplData.width || 800;
			const height = tplData.height || 600;
			canvasEl.width = width;
			canvasEl.height = height;

			const staticCanvas = new StaticCanvas(canvasEl, { width, height });
			await staticCanvas.loadFromJSON(tplData.fabricJSData);

			const objects = staticCanvas.getObjects();
			for (const obj of objects) {
				if ((obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') && obj.text) {
					if (obj.text.includes('{{')) {
						const processed = obj.text.replace(/\{\{\s*(.+?)\s*\}\}/g, (match, varName) => {
							const val = variables[varName.trim()];
							return val !== undefined && val !== null ? String(val) : match;
						});
						obj.set('text', processed);
					}
				}
				if (obj.isVariable && obj.variableBindings && Array.isArray(obj.variableBindings)) {
					for (const binding of obj.variableBindings) {
						if (binding.variableName && variables[binding.variableName] !== undefined) {
							const val = variables[binding.variableName];
							if (
								binding.property === 'text' &&
								(obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')
							) {
								obj.set('text', String(val));
							} else if (binding.property === 'fill') {
								obj.set('fill', String(val));
							}
						}
					}
				}
			}

			staticCanvas.renderAll();
			const dataUrl = staticCanvas.toDataURL({ format: 'png', multiplier: 1 });
			preview = { url: dataUrl, loading: false, error: null };
			staticCanvas.dispose();
		} catch (err) {
			preview = { url: null, loading: false, error: err?.message || 'Preview render failed' };
		}
	}

	onDestroy(() => {
		if (previewTimeout) clearTimeout(previewTimeout);
	});
</script>

<div class="flex flex-col h-full">
	<div class="flex items-center justify-between mb-3 border-b-[3px] border-gray-900 pb-2">
		<label
			class="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-2"
		>
			<svg class="w-5 h-5 text-[#ffc480]" fill="currentColor" viewBox="0 0 24 24"
				><path
					d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"
				/></svg
			>
			Live Preview
		</label>
		{#if preview.loading}
			<span
				class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#ffc480] bg-gray-900 px-2 py-1 rounded"
			>
				<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					/>
				</svg>
				Rendering...
			</span>
		{/if}
	</div>

	<div
		class="flex-1 bg-gray-900 rounded-xl border-[4px] border-gray-900 overflow-hidden flex flex-col shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]"
	>
		<div class="h-6 bg-gray-800 flex items-center px-3 gap-1.5 shrink-0">
			<div class="w-2.5 h-2.5 rounded-full bg-red-500" />
			<div class="w-2.5 h-2.5 rounded-full bg-yellow-500" />
			<div class="w-2.5 h-2.5 rounded-full bg-green-500" />
		</div>
		<div
			class="flex-1 bg-[url('/noise.png')] bg-repeat bg-[#e5e7eb] flex items-center justify-center p-4 relative overflow-hidden min-h-[250px] lg:min-h-0"
		>
			<div
				class="absolute inset-0 z-0 bg-[linear-gradient(to_right,#d1d5db_1px,transparent_1px),linear-gradient(to_bottom,#d1d5db_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none"
			/>

			<div class="relative z-10 w-full h-full flex items-center justify-center">
				{#if preview.url}
					<img
						src={preview.url}
						alt="Preview {variantName}"
						class="max-w-full max-h-[300px] lg:max-h-full object-contain pointer-events-none drop-shadow-[0_20px_25px_rgba(0,0,0,0.2)]"
					/>
				{:else if preview.error}
					<div
						class="bg-white px-6 py-4 rounded-xl border-[3px] border-red-500 shadow-[4px_4px_0_0_#ef4444] text-center max-w-xs"
					>
						<svg
							class="w-8 h-8 text-red-500 mx-auto mb-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p class="text-xs font-black uppercase text-red-900">{preview.error}</p>
					</div>
				{:else}
					<div
						class="bg-white/80 backdrop-blur px-6 py-4 rounded-xl border-[3px] border-dashed border-gray-400 text-center text-gray-500 font-bold text-sm"
					>
						Awaiting template...
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
