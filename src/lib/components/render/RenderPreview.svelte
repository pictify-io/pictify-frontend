<script>
	import { createEventDispatcher, onDestroy } from 'svelte';

	export let renderResult = null;
	export let renderError = null;
	export let isRendering = false;
	export let templateThumbnail = null;
	export let isCopyingUrl = false;

	const dispatch = createEventDispatcher();

	const handleDownload = () => {
		dispatch('download');
	};

	const handleCopyUrl = () => {
		dispatch('copyUrl');
	};

	// Retry logic for images that aren't available on S3 yet
	const MAX_RETRIES = 10;
	const RETRY_DELAY_MS = 1500;
	let retryCount = 0;
	let retryTimer = null;
	let imgSrc = '';
	let imgLoaded = false;
	let lastResultUrl = '';

	// Reset retry state only when the URL actually changes (new render)
	$: if (renderResult?.url && renderResult.url !== lastResultUrl) {
		lastResultUrl = renderResult.url;
		retryCount = 0;
		imgLoaded = false;
		clearTimeout(retryTimer);
		imgSrc = renderResult.url;
	}

	function handleImgError() {
		if (retryCount < MAX_RETRIES && renderResult?.url) {
			retryCount++;
			retryTimer = setTimeout(() => {
				const sep = renderResult.url.includes('?') ? '&' : '?';
				imgSrc = `${renderResult.url}${sep}_r=${retryCount}`;
			}, RETRY_DELAY_MS);
		}
	}

	function handleImgLoad() {
		imgLoaded = true;
		retryCount = 0;
	}

	onDestroy(() => {
		clearTimeout(retryTimer);
	});
</script>

<div class="space-y-6">
	<!-- Preview Area -->
	<div
		class="relative bg-gray-50 border-[3px] border-gray-900 rounded-xl min-h-[400px] flex items-center justify-center overflow-hidden shadow-inner"
	>
		<!-- Background Grid Pattern -->
		<div
			class="absolute inset-0 opacity-10 pointer-events-none"
			style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"
		/>

		{#if isRendering}
			<div class="text-center py-12 relative z-10">
				<div class="relative w-20 h-20 mx-auto mb-6">
					<div class="absolute inset-0 border-[6px] border-gray-200 rounded-full" />
					<div
						class="absolute inset-0 border-[6px] border-[#ff6b6b] rounded-full border-t-transparent animate-spin"
					/>
				</div>
				<p class="text-sm font-black text-gray-900 uppercase tracking-widest animate-pulse">
					Running Render Job...
				</p>
			</div>
		{:else if renderError}
			<div class="text-center py-12 px-6 relative z-10 max-w-sm">
				<div
					class="w-20 h-20 mx-auto mb-6 bg-red-100 border-[3px] border-red-200 rounded-full flex items-center justify-center"
				>
					<svg
						class="w-10 h-10 text-[#ff6b6b]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<p class="text-lg font-black text-gray-900 uppercase tracking-wide mb-2">Render Failed</p>
				<p class="text-sm font-bold text-gray-500">{renderError}</p>
			</div>
		{:else if renderResult?.url}
			<div
				class="relative w-full h-full p-6 flex items-center justify-center bg-[#FFFDF8]"
				style="min-height: 400px;"
			>
				{#if !imgLoaded}
					<div class="text-center py-8">
						<div class="relative w-16 h-16 mx-auto mb-4">
							<div class="absolute inset-0 border-[5px] border-gray-200 rounded-full" />
							<div
								class="absolute inset-0 border-[5px] border-[#ffc480] rounded-full border-t-transparent animate-spin"
							/>
						</div>
						<p class="text-xs font-black text-gray-500 uppercase tracking-widest">
							Loading image...
						</p>
					</div>
				{/if}
				<img
					src={imgSrc}
					alt="Rendered output"
					class="max-w-full max-h-[500px] object-contain shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border-[2px] border-gray-200"
					class:hidden={!imgLoaded}
					on:error={handleImgError}
					on:load={handleImgLoad}
				/>
			</div>
		{:else if templateThumbnail}
			<div class="text-center py-8 relative z-10 opacity-60 hover:opacity-100 transition-opacity">
				<img
					src={templateThumbnail}
					alt="Template thumbnail"
					class="max-w-[80%] max-h-[300px] object-contain mx-auto mb-6 border-[2px] border-gray-300 shadow-sm"
				/>
				<p class="text-xs font-black text-gray-400 uppercase tracking-widest">Template Preview</p>
			</div>
		{:else}
			<div class="text-center py-12 relative z-10">
				<div
					class="w-20 h-20 mx-auto mb-6 border-[3px] border-dashed border-gray-300 rounded-full flex items-center justify-center"
				>
					<svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<p class="text-sm font-black text-gray-400 uppercase tracking-widest">
					Waiting for input...
				</p>
			</div>
		{/if}
	</div>

	<!-- Result Info & Actions -->
	{#if renderResult?.url}
		<div
			class="bg-[#f0fdf4] border-[3px] border-[#4ade80] rounded-xl p-5 shadow-[4px_4px_0_0_#166534]"
		>
			<div class="flex items-start justify-between gap-4">
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2 mb-2">
						<span class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
						<p class="text-xs font-black text-green-800 uppercase tracking-widest">
							Success (200 OK)
						</p>
					</div>
					<div class="flex items-baseline gap-2">
						<p class="text-2xl font-black text-gray-900 font-mono">
							{renderResult.width}x{renderResult.height}
						</p>
						<span class="px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase rounded">
							{renderResult.format?.toUpperCase() || 'PNG'}
						</span>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<button
						class="p-3 bg-white border-[3px] border-gray-900 rounded-lg shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
						on:click={handleCopyUrl}
						disabled={isCopyingUrl}
						title="Copy share link"
					>
						{#if isCopyingUrl}
							<svg class="w-5 h-5 text-gray-900 animate-spin" viewBox="0 0 24 24"
								><circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
									fill="none"
								/><path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/></svg
							>
						{:else}
							<svg
								class="w-5 h-5 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
								/>
							</svg>
						{/if}
					</button>
					<button
						class="p-3 bg-gray-900 border-[3px] border-gray-900 rounded-lg shadow-[2px_2px_0_0_#9ca3af] hover:bg-gray-800 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						on:click={handleDownload}
						title="Download"
					>
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
					</button>
				</div>
			</div>

			<div class="mt-4 pt-4 border-t-2 border-green-200/50">
				<p class="text-[10px] font-black text-green-800/70 uppercase tracking-widest mb-1.5">
					Asset URL <span class="text-green-600/40 normal-case font-bold"
						>&mdash; Copy URL creates a trackable share link</span
					>
				</p>
				<div
					class="bg-white/50 border-[2px] border-green-200 rounded p-2 font-mono text-xs text-green-900 break-all select-all"
				>
					{renderResult.url}
				</div>
			</div>
		</div>
	{/if}
</div>
