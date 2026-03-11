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
	export let isEditing = false;
	export let isUpdating = false;
	export let isDeleting = false;

	const dispatch = createEventDispatcher();

	const handleEdit = () => {
		dispatch('edit');
	};

	const handleDelete = () => {
		dispatch('delete');
	};

	const handleCancelEdit = () => {
		dispatch('cancelEdit');
	};

	$: dynamicUrl = publishedBinding?.renderUrl || null;
	$: lastRenderAt = publishedBinding?.lastRenderAt ? new Date(publishedBinding.lastRenderAt) : null;
	$: lastError = publishedBinding?.lastError || null;

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		toast.set({ message: 'Copied to clipboard', type: 'success', duration: 2000 });
	};

	const generateEmbedCode = () => {
		if (!dynamicUrl) return '';
		return `<img src="${dynamicUrl}" alt="${template?.name || 'Live Image'}" />`;
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
		<!-- Edit/Delete actions for existing binding -->
		{#if publishedBinding && !isEditing}
			<div class="flex items-center gap-2">
				<button
					class="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-black uppercase tracking-wide rounded-lg border-[2px] border-gray-300 hover:border-gray-900 shadow-[2px_2px_0_0_#9ca3af] hover:shadow-[1px_1px_0_0_#9ca3af] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2"
					on:click={handleEdit}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
						/></svg
					>
					Edit
				</button>
				<button
					class="px-4 py-2 bg-white hover:bg-red-50 text-red-600 text-xs font-black uppercase tracking-wide rounded-lg border-[2px] border-red-200 hover:border-red-600 shadow-[2px_2px_0_0_#fecaca] hover:shadow-[1px_1px_0_0_#fecaca] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2 disabled:opacity-50"
					on:click={handleDelete}
					disabled={isDeleting}
				>
					{#if isDeleting}
						<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/></svg
						>
					{/if}
					Delete
				</button>
			</div>
		{:else if isEditing}
			<button
				class="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-black uppercase tracking-wide rounded-lg border-[2px] border-gray-300 hover:border-gray-900 transition-all"
				on:click={handleCancelEdit}
			>
				Cancel Edit
			</button>
		{:else}
			<div />
		{/if}
		{#if publishedBinding}
			<span
				class="px-3 py-1 bg-green-100 text-green-900 text-xs font-black uppercase tracking-wide rounded border-[2px] border-green-900 flex items-center gap-2 shadow-[2px_2px_0_0_#064e3b]"
			>
				<span class="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
				{isEditing ? 'Editing' : 'Live'}
			</span>
		{/if}
	</div>

	{#if !publishedBinding || isEditing}
		<!-- Pre-publish Summary / Edit Mode -->
		<div class="space-y-6">
			<div
				class="p-6 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937]"
			>
				<p class="text-sm text-gray-900 font-bold mb-6 flex items-center gap-2">
					{#if isEditing}
						<span
							class="w-6 h-6 bg-white border-2 border-gray-900 rounded-full flex items-center justify-center text-xs"
							>✏️</span
						>
						Review your updated configuration:
					{:else}
						<span
							class="w-6 h-6 bg-white border-2 border-gray-900 rounded-full flex items-center justify-center text-xs"
							>🚀</span
						>
						Ready to launch? Review your configuration:
					{/if}
				</p>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div
						class="p-4 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#9ca3af]"
					>
						<h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
							Variables Mapped
						</h4>
						<p class="text-2xl font-black text-gray-900">
							{Object.values(mapping).filter((v) => v).length}
						</p>
					</div>
					<div
						class="p-4 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#9ca3af]"
					>
						<h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
							Refresh Rate
						</h4>
						<p class="text-2xl font-black text-gray-900">{formatTtl(refreshPolicy.ttlSeconds)}</p>
					</div>
					<div
						class="p-4 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#9ca3af]"
					>
						<h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
							Output Format
						</h4>
						<p class="text-3xl font-black text-gray-900 uppercase">{outputConfig.format}</p>
					</div>
				</div>
			</div>

			<div class="flex justify-between gap-3 pt-4 border-t-[3px] border-gray-900">
				<button
					class="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-black text-xs uppercase tracking-wide rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#9ca3af] hover:shadow-[1px_1px_0_0_#9ca3af] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					on:click={isEditing ? handleCancelEdit : handleBack}
				>
					{isEditing ? 'Cancel' : 'Back'}
				</button>
				<button
					class="px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-xs uppercase tracking-wide rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-50 flex items-center gap-2 group"
					on:click={handlePublish}
					disabled={isEditing ? isUpdating : isPublishing}
				>
					{#if isEditing}
						{#if isUpdating}
							<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							Saving...
						{:else}
							Save Changes
							<svg
								class="w-5 h-5 transition-transform group-hover:translate-x-1"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/></svg
							>
						{/if}
					{:else if isPublishing}
						<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
						Publishing...
					{:else}
						Publish Live Asset
						<svg
							class="w-5 h-5 transition-transform group-hover:translate-x-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M13 7l5 5m0 0l-5 5m5-5H6"
							/></svg
						>
					{/if}
				</button>
			</div>
		</div>
	{:else}
		<!-- Published State -->
		<div class="space-y-6">
			<!-- Live URL -->
			<div
				class="p-6 bg-gradient-to-br from-gray-50 to-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937]"
			>
				<div class="flex items-center gap-2 pb-2 border-b-[3px] border-gray-200 mb-4">
					<span class="w-3 h-3 bg-gray-900 rounded-full border-2 border-black" />
					<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Live Asset URL</h3>
				</div>

				<div class="flex items-stretch gap-3">
					<code
						class="flex-1 px-4 py-3 bg-white border-[3px] border-gray-200 rounded-lg text-sm font-black font-mono text-gray-700 truncate"
					>
						{dynamicUrl}
					</code>
					<button
						class="px-6 py-2 bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-wide rounded-lg border-[3px] border-gray-900 shadow-[3px_3px_0_0_#9ca3af] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#9ca3af] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
						on:click={() => copyToClipboard(dynamicUrl)}
					>
						Copy
					</button>
				</div>
				<p class="text-xs font-bold text-gray-500 mt-2 flex items-center gap-1.5">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/></svg
					>
					This URL automatically updates with your data source
				</p>
			</div>

			<!-- Embed Code -->
			<div
				class="p-6 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937]"
			>
				<h3 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
					Embed Code (HTML)
				</h3>
				<div class="flex items-stretch gap-3">
					<code
						class="flex-1 px-4 py-3 bg-[#1a1a1a] border-[3px] border-gray-900 rounded-lg text-xs font-mono text-green-400 truncate"
					>
						{generateEmbedCode()}
					</code>
					<button
						class="px-6 py-2 bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-wide rounded-lg border-[3px] border-gray-900 shadow-[3px_3px_0_0_#9ca3af] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#9ca3af] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
						on:click={() => copyToClipboard(generateEmbedCode())}
					>
						Copy
					</button>
				</div>
			</div>

			<!-- Preview -->
			{#if dynamicUrl}
				<div class="space-y-3">
					<h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Live Preview</h3>
					<div
						class="bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] border-[3px] border-gray-900 rounded-xl p-6 flex items-center justify-center min-h-[300px] shadow-[4px_4px_0_0_#1f2937] bg-white"
					>
						<img
							src={dynamicUrl}
							alt="Live asset preview"
							class="max-w-full max-h-[300px] object-contain shadow-2xl rounded-lg border-2 border-gray-900"
						/>
					</div>
				</div>
			{/if}

			<!-- Status -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div
					class="p-4 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#9ca3af]"
				>
					<h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
						Last Rendered
					</h4>
					<p class="text-sm font-black text-gray-900">{formatDate(lastRenderAt)}</p>
				</div>
				<div
					class="p-4 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#9ca3af]"
				>
					<h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
						Next Refresh
					</h4>
					<p class="text-sm font-black text-gray-900">~ {formatTtl(refreshPolicy.ttlSeconds)}</p>
				</div>
				<div
					class="p-4 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#9ca3af]"
				>
					<h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
						Health Status
					</h4>
					{#if lastError}
						<div class="flex items-center gap-2">
							<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
							<p class="text-sm font-black text-red-600 uppercase tracking-wide">Error</p>
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
							<p class="text-sm font-black text-green-600 uppercase tracking-wide">Healthy</p>
						</div>
					{/if}
				</div>
			</div>

			{#if lastError}
				<div class="p-4 bg-red-50 border-[3px] border-red-200 rounded-xl flex items-start gap-4">
					<div class="p-2 bg-red-100 rounded-full border-2 border-red-200 shrink-0">
						<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/></svg
						>
					</div>
					<div>
						<h4 class="text-sm font-black text-red-900 uppercase tracking-wide mb-1">
							Error Details
						</h4>
						<p class="text-xs font-bold font-mono text-red-600">{lastError}</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
