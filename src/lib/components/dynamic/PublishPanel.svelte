<script>
	import { createEventDispatcher } from 'svelte';
	import { toast } from '../../../store/toast.store';
	import { formatTtl } from '$lib/utils/format';

	export let template = null;
	export let publishedBinding = null;
	export let mapping = {};
	export let refreshPolicy = {};
	export let outputConfig = {};
	export let isPublishing = false;

	const dispatch = createEventDispatcher();

	$: dynamicUrl = publishedBinding?.dynamicUrl || null;
	$: bindingId = publishedBinding?.uid || null;
	$: lastRenderAt = publishedBinding?.lastRenderAt ? new Date(publishedBinding.lastRenderAt) : null;
	$: lastError = publishedBinding?.lastError || null;

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		toast.set({ message: 'Copied to clipboard', type: 'success', duration: 2000 });
	};

	const generateEmbedCode = () => {
		if (!dynamicUrl) return '';
		return `<img src="${dynamicUrl}" alt="${template?.name || 'Dynamic Image'}" />`;
	};

	const handlePublish = () => {
		dispatch('publish');
	};

	const handleBack = () => {
		dispatch('back');
	};

	const formatDate = (date) => {
		if (!date) return 'Never';
		return date.toLocaleString();
	};
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
			</svg>
			{publishedBinding ? 'Dynamic Asset Live' : 'Publish Dynamic Asset'}
		</h2>
		{#if publishedBinding}
			<span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wide rounded-full border border-green-300 flex items-center gap-1">
				<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
				Live
			</span>
		{/if}
	</div>

	{#if !publishedBinding}
		<!-- Pre-publish Summary -->
		<div class="space-y-4">
			<p class="text-sm text-gray-500 font-medium">
				Review your configuration and publish to get your dynamic asset URL
			</p>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
					<h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Variables Mapped</h4>
					<p class="text-2xl font-black text-gray-900">{Object.values(mapping).filter(v => v).length}</p>
				</div>
				<div class="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
					<h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Refresh Rate</h4>
					<p class="text-2xl font-black text-gray-900">{formatTtl(refreshPolicy.ttlSeconds)}</p>
				</div>
				<div class="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
					<h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Output Format</h4>
					<p class="text-2xl font-black text-gray-900 uppercase">{outputConfig.format}</p>
				</div>
			</div>

			<div class="flex justify-between gap-3 pt-4">
				<button
					class="px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm uppercase tracking-wide rounded-xl border-2 border-gray-300 transition-all"
					on:click={handleBack}
				>
					Back
				</button>
				<button
					class="px-8 py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white font-black text-sm uppercase tracking-wide rounded-xl border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 flex items-center gap-2"
					on:click={handlePublish}
					disabled={isPublishing}
				>
					{#if isPublishing}
						<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Publishing...
					{:else}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
						</svg>
						Publish Dynamic Asset
					{/if}
				</button>
			</div>
		</div>
	{:else}
		<!-- Published State -->
		<div class="space-y-6">
			<!-- Dynamic URL -->
			<div class="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-[#a855f7] rounded-xl">
				<h3 class="text-sm font-bold text-[#a855f7] uppercase tracking-wide mb-2 flex items-center gap-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
					</svg>
					Dynamic URL
				</h3>
				<div class="flex items-center gap-2">
					<code class="flex-1 px-3 py-2 bg-white rounded-lg text-sm font-mono text-gray-700 border border-purple-200 truncate">
						{dynamicUrl}
					</code>
					<button
						class="px-3 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-bold uppercase rounded-lg transition-colors"
						on:click={() => copyToClipboard(dynamicUrl)}
					>
						Copy
					</button>
				</div>
				<p class="text-xs text-gray-500 mt-2">This URL automatically updates with your data source</p>
			</div>

			<!-- Embed Code -->
			<div class="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
				<h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
					</svg>
					Embed Code
				</h3>
				<div class="flex items-center gap-2">
					<code class="flex-1 px-3 py-2 bg-gray-900 rounded-lg text-xs font-mono text-green-400 truncate">
						{generateEmbedCode()}
					</code>
					<button
						class="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold uppercase rounded-lg transition-colors"
						on:click={() => copyToClipboard(generateEmbedCode())}
					>
						Copy
					</button>
				</div>
			</div>

			<!-- Preview -->
			{#if dynamicUrl}
				<div class="space-y-2">
					<h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
						</svg>
						Preview
					</h3>
					<div class="bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] border-2 border-gray-200 rounded-xl p-4 flex items-center justify-center min-h-[200px]">
						<img
							src={dynamicUrl}
							alt="Dynamic asset preview"
							class="max-w-full max-h-[300px] object-contain shadow-lg rounded"
						/>
					</div>
				</div>
			{/if}

			<!-- Status -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="p-4 bg-white border-2 border-gray-200 rounded-xl">
					<h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Last Rendered</h4>
					<p class="text-sm font-bold text-gray-900">{formatDate(lastRenderAt)}</p>
				</div>
				<div class="p-4 bg-white border-2 border-gray-200 rounded-xl">
					<h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Next Refresh</h4>
					<p class="text-sm font-bold text-gray-900">~ {formatTtl(refreshPolicy.ttlSeconds)}</p>
				</div>
				<div class="p-4 bg-white border-2 border-gray-200 rounded-xl">
					<h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Status</h4>
					{#if lastError}
						<p class="text-sm font-bold text-red-600 flex items-center gap-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
							Error
						</p>
					{:else}
						<p class="text-sm font-bold text-green-600 flex items-center gap-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
							</svg>
							Healthy
						</p>
					{/if}
				</div>
			</div>

			{#if lastError}
				<div class="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
					<h4 class="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Last Error</h4>
					<p class="text-sm text-red-600">{lastError}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
