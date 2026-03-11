<script>
	import { createShareResult } from '../../../api/public-templates.js';
	import { toast } from '../../../store/toast.store.js';

	/**
	 * ShareResultButton
	 *
	 * A button that creates a shareable result page for generated images/gifs.
	 *
	 * Usage:
	 * <ShareResultButton
	 *   assetUrl={generatedImageUrl}
	 *   contentType="image"
	 *   width={1200}
	 *   height={630}
	 *   format="png"
	 *   source="tool"
	 *   toolName="HTML to Image"
	 * />
	 */

	export let assetUrl = '';
	export let contentType = 'image';
	export let width = null;
	export let height = null;
	export let format = 'png';
	export let source = 'tool';
	export let toolName = '';
	export let templateUid = '';
	export let assetId = '';
	export let title = '';

	// Styling options
	export let variant = 'default'; // 'default', 'small', 'icon-only'
	export let className = '';

	let isSharing = false;
	let shareUrl = null;

	async function handleShare() {
		if (!assetUrl) {
			toast.set({ message: 'No image to share', type: 'warning', duration: 2000 });
			return;
		}

		isSharing = true;

		try {
			const response = await createShareResult({
				assetUrl,
				contentType,
				width,
				height,
				format,
				source,
				toolName,
				templateUid: templateUid || undefined,
				assetId: assetId || undefined,
				title: title || undefined
			});

			if (response.success && response.shareUrl) {
				shareUrl = `${window.location.origin}${response.shareUrl}`;

				// Copy to clipboard
				try {
					await navigator.clipboard.writeText(shareUrl);
					toast.set({
						message: 'Share link copied to clipboard!',
						type: 'success',
						duration: 2500
					});
				} catch (e) {
					// Fallback: show the URL
					toast.set({ message: `Share link: ${shareUrl}`, type: 'default', duration: 5000 });
				}
			}
		} catch (e) {
			console.error('Failed to create share:', e);
			toast.set({
				message: e.message || 'Failed to create share link',
				type: 'error',
				duration: 3000
			});
		} finally {
			isSharing = false;
		}
	}

	// Reset share URL when asset changes
	$: if (assetUrl) {
		shareUrl = null;
	}
</script>

{#if variant === 'icon-only'}
	<button
		on:click={handleShare}
		disabled={isSharing || !assetUrl}
		class="p-2 bg-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed {className}"
		title="Share result"
		aria-label="Share result"
	>
		{#if isSharing}
			<svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24">
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
					fill="none"
				/>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg>
		{:else}
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
				/>
			</svg>
		{/if}
	</button>
{:else if variant === 'small'}
	<button
		on:click={handleShare}
		disabled={isSharing || !assetUrl}
		class="px-3 py-1.5 bg-white border-[2px] border-gray-900 font-black text-xs uppercase shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 {className}"
	>
		{#if isSharing}
			<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24">
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
					fill="none"
				/>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg>
			Sharing...
		{:else if shareUrl}
			<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			Copied!
		{:else}
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
				/>
			</svg>
			Share
		{/if}
	</button>
{:else}
	<button
		on:click={handleShare}
		disabled={isSharing || !assetUrl}
		class="px-4 py-2 bg-white border-[3px] border-gray-900 font-black text-sm uppercase shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 {className}"
	>
		{#if isSharing}
			<svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24">
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
					fill="none"
				/>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg>
			Creating link...
		{:else if shareUrl}
			<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			Link copied!
		{:else}
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
				/>
			</svg>
			Share result
		{/if}
	</button>
{/if}
