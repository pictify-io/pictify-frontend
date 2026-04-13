<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let fabricJSData = null;
	export let width = 1200;
	export let height = 630;

	let canvasEl;
	let fabricCanvas;
	let selectedText = null;
	let canvasReady = false;
	let loading = false;
	let loadError = false;
	let loadGeneration = 0;
	let lastLoadedData = null; // Track what we've already loaded to prevent re-render loop

	const MAX_DISPLAY_WIDTH = 640;

	onMount(() => {
		if (fabricJSData) {
			lastLoadedData = fabricJSData;
			loadCanvas(fabricJSData);
		}
	});

	// Only re-load when fabricJSData actually changes (template gallery selection)
	$: if (browser && canvasEl && fabricJSData && fabricJSData !== lastLoadedData) {
		lastLoadedData = fabricJSData;
		loadCanvas(fabricJSData);
	}

	async function loadCanvas(data) {
		const thisGeneration = ++loadGeneration;
		loading = true;
		canvasReady = false;
		loadError = false;

		// Dispose previous canvas if exists
		if (fabricCanvas) {
			fabricCanvas.dispose();
			fabricCanvas = null;
		}

		try {
			const fabric = await import('fabric');
			if (thisGeneration !== loadGeneration) return;
			if (!canvasEl) return; // Element gone (component destroyed)

			const scale = Math.min(1, MAX_DISPLAY_WIDTH / width);
			const displayWidth = Math.round(width * scale);
			const displayHeight = Math.round(height * scale);

			canvasEl.width = displayWidth;
			canvasEl.height = displayHeight;

			fabricCanvas = new fabric.Canvas(canvasEl, {
				width: displayWidth,
				height: displayHeight,
				selection: false,
				defaultCursor: 'default',
				hoverCursor: 'pointer'
			});

			fabricCanvas.setZoom(scale);
			await fabricCanvas.loadFromJSON(data);
			if (thisGeneration !== loadGeneration) {
				fabricCanvas.dispose();
				return;
			}

			fabricCanvas.getObjects().forEach((obj) => {
				const isText =
					obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox';
				obj.set({
					selectable: isText,
					evented: isText,
					hasControls: false,
					hasBorders: isText,
					lockMovementX: true,
					lockMovementY: true,
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
					borderColor: '#4ade80',
					borderScaleFactor: 3
				});
				if (isText) obj.set({ editable: true });
			});

			fabricCanvas.renderAll();
			canvasReady = true;

			fabricCanvas.on('selection:created', (e) => {
				const obj = e.selected?.[0];
				if (obj && (obj.type === 'i-text' || obj.type === 'textbox')) {
					selectedText = obj;
				}
			});
			fabricCanvas.on('selection:cleared', () => {
				selectedText = null;
			});
		} catch (err) {
			loadError = true;
		} finally {
			loading = false;
		}
	}

	onDestroy(() => {
		loadGeneration++;
		if (fabricCanvas) fabricCanvas.dispose();
	});

	export function getEditedFabricData() {
		if (!fabricCanvas) return null;
		return fabricCanvas.toJSON();
	}

	export function setVariableValue(variableName, value) {
		if (!fabricCanvas) return;
		fabricCanvas.getObjects().forEach((obj) => {
			const bindings = obj.variableBindings;
			if (!bindings || !Array.isArray(bindings)) return;
			for (const binding of bindings) {
				if (binding.variableName === variableName) {
					obj.set('text', value);
					break;
				}
			}
		});
		fabricCanvas.renderAll();
	}

	export function setVariableValues(map) {
		if (!fabricCanvas || !map) return;
		fabricCanvas.getObjects().forEach((obj) => {
			const bindings = obj.variableBindings;
			if (!bindings || !Array.isArray(bindings)) return;
			for (const binding of bindings) {
				if (binding.variableName in map) {
					obj.set('text', map[binding.variableName]);
				}
			}
		});
		fabricCanvas.renderAll();
	}

	export function getVariables() {
		if (!fabricCanvas) return [];
		const variables = [];
		fabricCanvas.getObjects().forEach((obj) => {
			const bindings = obj.variableBindings;
			if (!bindings || !Array.isArray(bindings) || bindings.length === 0) return;
			for (const binding of bindings) {
				variables.push({
					name: binding.variableName,
					value: obj.text,
					description: binding.description
				});
			}
		});
		return variables;
	}
</script>

<div class="relative">
	{#if loadError}
		<div
			class="absolute inset-0 z-20 flex items-center justify-center bg-gray-50 border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937]"
		>
			<div class="flex flex-col items-center gap-2 text-center px-4">
				<span class="text-lg font-bold text-gray-900">Failed to load editor</span>
				<span class="text-sm text-gray-500">The template could not be rendered. Please try selecting another template.</span>
			</div>
		</div>
	{:else if loading}
		<div
			class="absolute inset-0 z-20 flex items-center justify-center bg-gray-50 border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937]"
		>
			<div class="flex items-center gap-3">
				<div
					class="w-5 h-5 border-[3px] border-gray-900 border-t-transparent rounded-full animate-spin"
				/>
				<span class="text-sm font-bold text-gray-500">Loading editor...</span>
			</div>
		</div>
	{/if}

	{#if canvasReady && !selectedText}
		<div
			class="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-full shadow-lg pointer-events-none"
		>
			Click any text to edit it
		</div>
	{/if}

	<div class="border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] bg-white overflow-hidden">
		<canvas bind:this={canvasEl}>
			<p>Interactive template preview — click text elements to edit</p>
		</canvas>
	</div>

	{#if selectedText}
		<div class="mt-2 text-xs text-[#4ade80] font-bold">Double-click text to type</div>
	{/if}
</div>
