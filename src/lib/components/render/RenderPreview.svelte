<script>
	import { createEventDispatcher } from 'svelte';

	export let renderResult = null;
	export let renderError = null;
	export let isRendering = false;
	export let templateThumbnail = null;

	const dispatch = createEventDispatcher();

	const handleDownload = () => {
		dispatch('download');
	};

	const handleCopyUrl = () => {
		dispatch('copyUrl');
	};
</script>

<div class="space-y-4">
	<!-- Preview Area -->
	<div class="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl min-h-[300px] flex items-center justify-center overflow-hidden">
		{#if isRendering}
			<div class="text-center py-12">
				<div class="relative w-16 h-16 mx-auto mb-4">
					<div class="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
					<div class="absolute inset-0 border-4 border-[#ff6b6b] rounded-full border-t-transparent animate-spin"></div>
				</div>
				<p class="text-sm font-bold text-gray-600 uppercase tracking-wide">Rendering...</p>
			</div>
		{:else if renderError}
			<div class="text-center py-12 px-4">
				<div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
					<svg class="w-8 h-8 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<p class="text-sm font-bold text-gray-900 mb-1">Render Failed</p>
				<p class="text-xs text-gray-500 max-w-xs mx-auto">{renderError}</p>
			</div>
		{:else if renderResult?.url}
			<img
				src={renderResult.url}
				alt="Rendered output"
				class="max-w-full max-h-[400px] object-contain"
			/>
		{:else if templateThumbnail}
			<div class="text-center py-8">
				<img
					src={templateThumbnail}
					alt="Template thumbnail"
					class="max-w-full max-h-[250px] object-contain mx-auto opacity-50 mb-4"
				/>
				<p class="text-sm font-bold text-gray-500 uppercase tracking-wide">
					Fill variables and click Render
				</p>
			</div>
		{:else}
			<div class="text-center py-12">
				<svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
				<p class="text-sm font-bold text-gray-500 uppercase tracking-wide">
					Preview will appear here
				</p>
			</div>
		{/if}
	</div>

	<!-- Result Info & Actions -->
	{#if renderResult?.url}
		<div class="bg-green-50 border-2 border-green-200 rounded-xl p-4">
			<div class="flex items-start justify-between gap-4">
				<div class="flex-1 min-w-0">
					<p class="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">
						Render Complete
					</p>
					<p class="text-xs text-green-600 truncate font-mono">
						{renderResult.width}x{renderResult.height} • {renderResult.format?.toUpperCase() || 'PNG'}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						class="p-2 bg-white border-2 border-green-300 rounded-lg hover:bg-green-100 transition-colors"
						on:click={handleCopyUrl}
						title="Copy URL"
					>
						<svg class="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
						</svg>
					</button>
					<button
						class="p-2 bg-green-600 border-2 border-green-700 rounded-lg hover:bg-green-700 transition-colors"
						on:click={handleDownload}
						title="Download"
					>
						<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
						</svg>
					</button>
				</div>
			</div>
		</div>

		<!-- URL Display -->
		<div class="bg-gray-100 rounded-lg p-3">
			<p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">CDN URL</p>
			<p class="text-xs text-gray-700 font-mono break-all select-all">{renderResult.url}</p>
		</div>
	{/if}
</div>
