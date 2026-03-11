<script>
	import { onMount } from 'svelte';

	export let html = '';
	export let width = 1200;
	export let height = 630;
	export let scale = 0.3;

	let loaded = false;
	let container;
	let loadTimeout;

	function handleLoad() {
		clearTimeout(loadTimeout);
		loaded = true;
	}

	// Reset loaded state when html changes and set fallback timeout
	$: if (html) {
		loaded = false;
		// Fallback: show content after 500ms even if onload doesn't fire
		clearTimeout(loadTimeout);
		loadTimeout = setTimeout(() => {
			loaded = true;
		}, 500);
	}

	onMount(() => {
		return () => clearTimeout(loadTimeout);
	});
</script>

<div
	class="relative overflow-hidden bg-white select-none group"
	style="width: {width * scale}px; height: {height * scale}px;"
	bind:this={container}
>
	<!-- Checkerboard Pattern for Transparency -->
	<div
		class="absolute inset-0 opacity-40 pointer-events-none"
		style="background-image: radial-gradient(#9ca3af 1px, transparent 1px); background-size: 12px 12px;"
	/>

	<!-- Loading State -->
	{#if !loaded}
		<div class="absolute inset-0 flex items-center justify-center z-10 bg-gray-50">
			<div
				class="w-8 h-8 border-[3px] border-gray-200 border-t-[#ff6b6b] rounded-full animate-spin"
			/>
		</div>
	{/if}

	<!-- Iframe Container -->
	<div
		class="origin-top-left transition-opacity duration-300 ease-out"
		class:opacity-0={!loaded}
		class:opacity-100={loaded}
		style="width: {width}px; height: {height}px; transform: scale({scale});"
	>
		<iframe
			title="og-image-template"
			srcdoc={html}
			class="w-full h-full border-none bg-transparent"
			scrolling="no"
			sandbox="allow-scripts allow-same-origin"
			on:load={handleLoad}
		/>
	</div>

	<!-- Border Overlay (Optional visual polish) -->
	<div class="absolute inset-0 border border-black/5 pointer-events-none" />
</div>
