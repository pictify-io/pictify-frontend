<script>
	import { onDestroy, onMount } from 'svelte';
	import { gifs, images, fetchGifs, fetchImages } from '../../../../store/media.store';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';

	export let mediaType = 'images';

	let isLoading = true;
	let isLoadingMore = false;
	let unsubscribe = () => {};
	let mediaList = [];
	let pagination = { total: 0, limit: 12, offset: 0, hasMore: false };
	let currentPage = 1;
	let itemsPerPage = 12;
	let selectedMedia = null;
	let showLightbox = false;

	// Calculate total pages
	$: totalPages = Math.ceil(pagination.total / itemsPerPage);
	$: hasPrev = currentPage > 1;
	$: hasNext = currentPage < totalPages;

	function copyToClipboard(text, event) {
		event?.stopPropagation();
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'URL copied to clipboard!', duration: 2000 });
		});
	}

	function downloadMedia(url, event) {
		event?.stopPropagation();
		const link = document.createElement('a');
		link.href = url;
		link.download = url.split('/').pop() || `media-${Date.now()}`;
		link.target = '_blank';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.set({ message: 'Download started!', duration: 2000 });
	}

	function openLightbox(media) {
		selectedMedia = media;
		showLightbox = true;
		document.body.style.overflow = 'hidden';
	}

	function closeLightbox() {
		showLightbox = false;
		selectedMedia = null;
		document.body.style.overflow = '';
	}

	function handleKeydown(e) {
		if (e.key === 'Escape' && showLightbox) {
			closeLightbox();
		}
	}

	async function loadPage(page) {
		if (page < 1 || page > totalPages || isLoadingMore) return;
		
		isLoadingMore = true;
		currentPage = page;
		const offset = (page - 1) * itemsPerPage;

		try {
			if (mediaType === 'images') {
				await fetchImages({ limit: itemsPerPage, offset });
			} else if (mediaType === 'gifs') {
				await fetchGifs({ limit: itemsPerPage, offset });
			}
		} finally {
			isLoadingMore = false;
		}
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now - date);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 1) return 'Today';
		if (diffDays === 2) return 'Yesterday';
		if (diffDays <= 7) return `${diffDays - 1} days ago`;
		
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const pages = [];
		const maxVisible = 5;
		
		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (currentPage <= 3) {
				for (let i = 1; i <= 4; i++) pages.push(i);
				pages.push('...');
				pages.push(totalPages);
			} else if (currentPage >= totalPages - 2) {
				pages.push(1);
				pages.push('...');
				for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
			} else {
				pages.push(1);
				pages.push('...');
				for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
				pages.push('...');
				pages.push(totalPages);
			}
		}
		
		return pages;
	};

	onMount(async () => {
		if (unsubscribe) unsubscribe();

		if (mediaType === 'images') {
			unsubscribe = images.subscribe((data) => {
				mediaList = data.images || [];
				pagination = data.pagination || { total: 0, limit: 12, offset: 0, hasMore: false };
			});
			await fetchImages({ limit: itemsPerPage, offset: 0 });
		} else if (mediaType === 'gifs') {
			unsubscribe = gifs.subscribe((data) => {
				mediaList = data.gifs || [];
				pagination = data.pagination || { total: 0, limit: 12, offset: 0, hasMore: false };
			});
			await fetchGifs({ limit: itemsPerPage, offset: 0 });
		}
		isLoading = false;
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
		mediaList = [];
		if (showLightbox) {
			document.body.style.overflow = '';
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="w-full min-h-screen bg-white">
	<div class="max-w-7xl mx-auto p-6">
		<!-- Header -->
		<div class="flex items-center gap-3 mb-8">
		<h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
			{#if mediaType === 'images'}
				<svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
				Images
			{:else}
				<svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
				</svg>
				GIFs
			{/if}
		</h1>
		{#if !isLoading && pagination.total > 0}
			<span class="bg-[#ff6b6b] text-white text-xs font-semibold px-3 py-1 rounded-full">
				{pagination.total} {mediaType}
			</span>
		{/if}
	</div>

	<!-- Content -->
	{#if isLoading}
		<div class="flex flex-col items-center justify-center py-20">
			<Loader size="16" show={isLoading} />
			<p class="text-gray-500 mt-4">Loading your {mediaType}...</p>
		</div>
	{:else if mediaList.length === 0}
		<div class="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl">
			<div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
				{#if mediaType === 'images'}
					<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
					</svg>
				{:else}
					<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
					</svg>
				{/if}
			</div>
			<h2 class="text-lg font-semibold text-gray-900 mb-1">No {mediaType} yet</h2>
			<p class="text-gray-500 text-sm">Create your first {mediaType === 'images' ? 'image' : 'GIF'} using the editor or API</p>
		</div>
	{:else}
		<!-- Media Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" class:opacity-50={isLoadingMore}>
			{#each mediaList as media, index (media.id || index)}
				<div
					role="button"
					tabindex="0"
					class="media-card group bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#ff6b6b]"
					on:click={() => openLightbox(media)}
					on:keydown={(e) => e.key === 'Enter' && openLightbox(media)}
				>
					<!-- Preview Container -->
					<div class="relative bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200 overflow-hidden" style="height: 180px;">
						<img 
							src={media.url} 
							alt="Media item"
							class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
							loading="lazy"
						/>
						
						<!-- Dimension badge -->
						{#if media.width && media.height}
							<div class="absolute bottom-2 left-2 z-20">
								<span class="text-[10px] font-medium text-gray-500 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
									{media.width} × {media.height}
								</span>
							</div>
						{/if}
						
						<!-- Hover overlay -->
						<div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-10 pointer-events-none" />
						
						<!-- Action buttons on hover -->
						<div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex gap-2">
							<button
								on:click={(e) => copyToClipboard(media.url, e)}
								class="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
								title="Copy URL"
							>
								<svg class="w-4 h-4 text-gray-700 hover:text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
								</svg>
							</button>
							<button
								on:click={(e) => downloadMedia(media.url, e)}
								class="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
								title="Download"
							>
								<svg class="w-4 h-4 text-gray-700 hover:text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
								</svg>
							</button>
						</div>
						
						<!-- Expand icon -->
						<div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
							<div class="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
								<svg class="w-4 h-4 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
								</svg>
							</div>
						</div>
					</div>
					
					<!-- Info -->
					<div class="p-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-xs text-gray-500">
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
								</svg>
								<span>{formatDate(media.createdAt)}</span>
							</div>
							<span class="text-[10px] font-medium text-gray-400 uppercase">
								{mediaType === 'images' ? 'PNG' : 'GIF'}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
				<!-- Results count -->
				<div class="text-sm text-gray-500">
					Showing <span class="font-medium text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span>
					to <span class="font-medium text-gray-700">{Math.min(currentPage * itemsPerPage, pagination.total)}</span>
					of <span class="font-medium text-gray-700">{pagination.total}</span> {mediaType}
				</div>

				<!-- Page controls -->
				<div class="flex items-center gap-1">
					<!-- Previous button -->
					<button
						on:click={() => loadPage(currentPage - 1)}
						disabled={!hasPrev || isLoadingMore}
						class="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
							{hasPrev 
								? 'text-gray-700 hover:bg-gray-100 hover:text-[#ff6b6b]' 
								: 'text-gray-300 cursor-not-allowed'}"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
						</svg>
						<span class="hidden sm:inline">Previous</span>
					</button>

					<!-- Page numbers -->
					<div class="flex items-center gap-1 mx-2">
						{#each getPageNumbers() as pageNum}
							{#if pageNum === '...'}
								<span class="px-2 py-1 text-gray-400">...</span>
							{:else}
								<button
									on:click={() => loadPage(pageNum)}
									disabled={isLoadingMore}
									class="w-9 h-9 text-sm font-medium rounded-lg transition-all duration-200
										{pageNum === currentPage 
											? 'bg-[#ff6b6b] text-white shadow-md shadow-[#ff6b6b]/30' 
											: 'text-gray-600 hover:bg-gray-100 hover:text-[#ff6b6b]'}"
								>
									{pageNum}
								</button>
							{/if}
						{/each}
					</div>

					<!-- Next button -->
					<button
						on:click={() => loadPage(currentPage + 1)}
						disabled={!hasNext || isLoadingMore}
						class="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
							{hasNext 
								? 'text-gray-700 hover:bg-gray-100 hover:text-[#ff6b6b]' 
								: 'text-gray-300 cursor-not-allowed'}"
					>
						<span class="hidden sm:inline">Next</span>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
						</svg>
					</button>
				</div>
			</div>
		{/if}
	{/if}
	</div>
</div>

<!-- Lightbox Modal -->
{#if showLightbox && selectedMedia}
	<div 
		class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
		on:click={closeLightbox}
		on:keydown={(e) => e.key === 'Escape' && closeLightbox()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Close button -->
		<button 
			class="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
			on:click={closeLightbox}
		>
			<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
			</svg>
		</button>
		
		<div class="max-w-5xl max-h-[90vh] flex flex-col" on:click|stopPropagation>
			<!-- Image -->
			<img 
				src={selectedMedia.url} 
				alt="Full size media" 
				class="max-w-full max-h-[calc(90vh-80px)] object-contain rounded-lg shadow-2xl"
			/>
			
			<!-- Toolbar -->
			<div class="flex items-center justify-between mt-4 px-2">
				<div class="flex items-center gap-4 text-white/80 text-sm">
					{#if selectedMedia.width && selectedMedia.height}
						<span>{selectedMedia.width} × {selectedMedia.height}</span>
					{/if}
					{#if selectedMedia.createdAt}
						<span>{formatDate(selectedMedia.createdAt)}</span>
					{/if}
				</div>
				<div class="flex gap-3">
					<button 
						class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
						on:click={(e) => copyToClipboard(selectedMedia.url, e)}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
						</svg>
						Copy URL
					</button>
					<button 
						class="flex items-center gap-2 px-4 py-2 bg-[#ff6b6b] hover:bg-[#ff5252] text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-[#ff6b6b]/30"
						on:click={(e) => downloadMedia(selectedMedia.url, e)}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
						</svg>
						Download
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<Toast />

<style>
	.media-card {
		will-change: transform;
	}
</style>
