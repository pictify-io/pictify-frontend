<script>
	import { onDestroy, onMount } from 'svelte';
	import { gifs, images, pdfs, fetchGifs, fetchImages, fetchPdfs } from '../../../../store/media.store';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';
	import { copyToClipboard as sharedCopy, formatRelativeDate, getPageNumbers as sharedGetPageNumbers } from '$lib/utils/format.js';
	import { createShareResult } from '../../../../api/public-templates.js';

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

	// Cache share URLs by CDN URL to avoid re-creating
	const shareUrlCache = new Map();
	let isCopyingLink = false;

	async function copyToClipboard(cdnUrl, event) {
		event?.stopPropagation();
		if (!cdnUrl) return;
		isCopyingLink = true;
		try {
			if (!shareUrlCache.has(cdnUrl)) {
				const contentType = mediaType === 'gifs' ? 'gif' : 'image';
				const format = mediaType === 'gifs' ? 'gif' : mediaType === 'pdfs' ? 'pdf' : 'png';
				// Find the matching media item to get dimensions
				const media = mediaList.find(m => m.url === cdnUrl);
				const res = await createShareResult({
					assetUrl: cdnUrl,
					contentType,
					format,
					source: 'dashboard',
					width: media?.width,
					height: media?.height,
				});
				if (res.success && res.shareUrl) {
					shareUrlCache.set(cdnUrl, `${window.location.origin}${res.shareUrl}`);
				}
			}
			const shareUrl = shareUrlCache.get(cdnUrl) || cdnUrl;
			await navigator.clipboard.writeText(shareUrl);
			toast.set({ message: 'Share link copied!', type: 'success', duration: 1500 });
		} catch (e) {
			// Fallback to raw CDN URL
			sharedCopy(cdnUrl, 'URL copied to clipboard!');
		} finally {
			isCopyingLink = false;
		}
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
		toast.set({ message: 'Download started!', type: 'success', duration: 2000 });
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
			} else if (mediaType === 'pdfs') {
				await fetchPdfs({ limit: itemsPerPage, offset });
			}
		} finally {
			isLoadingMore = false;
		}
	}

	function formatDate(dateString) {
		return formatRelativeDate(dateString);
	}

	const getPageNumbers = () => sharedGetPageNumbers(currentPage, totalPages);

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
		} else if (mediaType === 'pdfs') {
			unsubscribe = pdfs.subscribe((data) => {
				mediaList = data.pdfs || [];
				pagination = data.pagination || { total: 0, limit: 12, offset: 0, hasMore: false };
			});
			await fetchPdfs({ limit: itemsPerPage, offset: 0 });
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

<section class="min-h-full">
	<div>
		<!-- Header -->
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
			<div>
				<div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-3">
					<span class="w-2 h-2 bg-[#ffc480] rounded-full animate-pulse"></span>
					Media Library
				</div>
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					{mediaType === 'images' ? 'Image' : mediaType === 'gifs' ? 'GIF' : 'PDF'} <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">Gallery</span>
				</h1>
			</div>

			<!-- Stats -->
			<div class="flex items-center gap-4 sm:gap-6 md:gap-8">
				<div class="text-right">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Items</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 tabular-nums">{pagination.total || 0}</div>
				</div>
				<div class="text-right border-l-2 border-gray-200 pl-4 sm:pl-6 md:pl-8">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Type</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 uppercase">{mediaType === 'images' ? 'PNG' : mediaType === 'gifs' ? 'GIF' : 'PDF'}</div>
				</div>
			</div>
		</div>

		<!-- Content -->
		{#if isLoading}
			<div class="flex flex-col items-center justify-center py-32">
				<Loader size="16" show={isLoading} />
				<p class="text-gray-400 text-xs font-black uppercase tracking-widest mt-6 animate-pulse">Loading Media Assets...</p>
			</div>
		{:else if mediaList.length === 0}
			<div class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-[3px] border-gray-900 border-dashed shadow-sm">
				<div class="w-24 h-24 bg-gray-100 rounded-full border-[3px] border-gray-900 flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#1f2937]">
					{#if mediaType === 'images'}
						<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
						</svg>
					{:else if mediaType === 'gifs'}
						<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
						</svg>
					{:else}
						<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
						</svg>
					{/if}
				</div>
				<h2 class="text-2xl font-black text-gray-900 uppercase tracking-wide mb-2">No {mediaType} Generated</h2>
				<p class="text-gray-500 font-bold max-w-md text-center">
					Start generating {mediaType === 'images' ? 'images' : mediaType === 'gifs' ? 'GIFs' : 'PDFs'} from your templates to see them appear here.
				</p>
				<a href="/dashboard/template" class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#ffc480] hover:text-gray-900 transition-colors border-2 border-gray-900">
					Open Templates
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
				</a>
			</div>
		{:else}
			<!-- Media Grid -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10" class:opacity-50={isLoadingMore}>
				{#each mediaList as media, index (media.id || index)}
					<div
						role="button"
						tabindex="0"
						class="media-card group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 shadow-[6px_6px_0_0_#1f2937] hover:shadow-[8px_8px_0_0_#1f2937] hover:-translate-y-1"
						on:click={() => openLightbox(media)}
						on:keydown={(e) => e.key === 'Enter' && openLightbox(media)}
					>
						<!-- Preview Container -->
						<div class="relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] border-b-[3px] border-gray-900 overflow-hidden h-[220px] group-hover:bg-gray-50 transition-colors">
							{#if mediaType === 'pdfs'}
								<div class="relative w-full h-full bg-white flex items-center justify-center">
									<!-- PDF Icon as preview (since iframe may have CORS issues) -->
									<div class="p-8">
										<svg class="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17h6M9 13h6M13 3v5a1 1 0 001 1h5"/>
										</svg>
									</div>
									<!-- PDF Badge -->
									<div class="absolute top-3 left-3 z-20">
										<span class="text-[10px] font-black text-gray-900 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md border-[2px] border-gray-900 uppercase tracking-wide shadow-sm">
											PDF
										</span>
									</div>
								</div>
							{:else}
								<img
									src={media.url}
									alt="Media item"
									class="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
									loading="lazy"
								/>
							{/if}
							
							<!-- Dimension/Page badge -->
							{#if mediaType === 'pdfs' && media.pageCount}
								<div class="absolute bottom-3 left-3 z-20">
									<span class="text-[10px] font-black text-gray-900 bg-white px-2 py-1 rounded border-[2px] border-gray-900 uppercase tracking-wide shadow-sm">
										{media.pageCount} {media.pageCount === 1 ? 'PAGE' : 'PAGES'}
									</span>
								</div>
							{:else if media.width && media.height}
								<div class="absolute bottom-3 left-3 z-20">
									<span class="text-[10px] font-black text-gray-900 bg-white px-2 py-1 rounded border-[2px] border-gray-900 uppercase tracking-wide shadow-sm">
										{media.width} × {media.height}
									</span>
								</div>
							{/if}
							
							<!-- Hover overlay -->
							<div class="absolute inset-0 bg-gray-900/5 group-hover:bg-gray-900/10 transition-colors duration-300 z-10 pointer-events-none" />
							
							<!-- Action buttons on hover -->
							<div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-30 flex gap-2">
								<button
									on:click={(e) => copyToClipboard(media.url, e)}
									class="bg-white rounded-lg w-9 h-9 border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center"
									title="Copy URL"
								>
									<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
									</svg>
								</button>
								<button
									on:click={(e) => downloadMedia(media.url, e)}
									class="bg-[#ff6b6b] rounded-lg w-9 h-9 border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center"
									title="Download"
								>
									<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
									</svg>
								</button>
							</div>
						</div>
						
						<!-- Info -->
						<div class="p-4 bg-white">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="w-2 h-2 rounded-full bg-gray-300"></div>
									<span class="text-xs text-gray-500 font-bold uppercase tracking-wide">{formatDate(media.createdAt)}</span>
								</div>
								<span class="text-[9px] font-black text-gray-900 bg-[#ffc480]/30 px-2 py-0.5 rounded border border-[#ffc480] uppercase tracking-wider">
									{mediaType === 'images' ? 'PNG' : mediaType === 'gifs' ? 'GIF' : 'PDF'}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex items-center justify-between mt-12 pt-8 border-t-[3px] border-gray-900">
					<!-- Results count -->
					<div class="bg-white border-[2px] border-gray-900 px-4 py-2 rounded-lg shadow-sm">
						<span class="text-xs font-bold text-gray-500 uppercase tracking-wide">Showing</span>
						<span class="text-sm font-black text-gray-900 ml-1">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, pagination.total)}</span>
					</div>

					<!-- Page controls -->
					<div class="flex items-center gap-2">
						<!-- Previous button -->
						<button
							on:click={() => loadPage(currentPage - 1)}
							disabled={!hasPrev || isLoadingMore}
							class="w-10 h-10 flex items-center justify-center rounded-lg border-[2px] border-gray-900 transition-all duration-200
							{hasPrev 
								? 'bg-white text-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]' 
								: 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 border-gray-300'}"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
							</svg>
						</button>

						<!-- Page numbers -->
						<div class="flex items-center gap-2 px-2">
							{#each getPageNumbers() as pageNum}
								{#if pageNum === '...'}
									<span class="text-gray-400 font-black text-xs">...</span>
								{:else}
									<button
										on:click={() => loadPage(pageNum)}
										disabled={isLoadingMore}
										class="w-8 h-8 text-xs font-black rounded-md border-[2px] transition-all duration-200 flex items-center justify-center
										{pageNum === currentPage 
											? 'bg-gray-900 border-gray-900 text-white shadow-[2px_2px_0_0_#ffc480]' 
											: 'bg-white border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-900'}"
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
							class="w-10 h-10 flex items-center justify-center rounded-lg border-[2px] border-gray-900 transition-all duration-200
							{hasNext 
								? 'bg-white text-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]' 
								: 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 border-gray-300'}"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
							</svg>
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</section>

<!-- Lightbox Modal -->
{#if showLightbox && selectedMedia}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
	<div 
		class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		on:click={closeLightbox}
		role="dialog"
		aria-modal="true"
		aria-labelledby="lightbox-title"
		tabindex="-1"
	>
		<!-- Close button -->
		<button 
			class="absolute top-6 right-6 w-12 h-12 bg-white rounded-xl border-[3px] border-gray-900 flex items-center justify-center transition-all shadow-[4px_4px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] z-50"
			on:click={closeLightbox}
			aria-label="Close lightbox"
		>
			<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
			</svg>
		</button>
		
		<h2 id="lightbox-title" class="sr-only">Image Preview</h2>
		
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div class="max-w-6xl w-full max-h-[90vh] flex flex-col relative" on:click|stopPropagation>
			<!-- Image Frame -->
			<div class="bg-white rounded-2xl border-[3px] border-gray-900 p-2 shadow-[12px_12px_0_0_#000] relative overflow-hidden">
				<!-- Pattern Background -->
				<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50 pointer-events-none"></div>
				
				<div class="relative z-10 bg-white/50 rounded-xl overflow-hidden flex items-center justify-center min-h-[400px]">
					{#if mediaType === 'pdfs'}
						<!-- PDF Viewer styled like an image viewer -->
						<div class="w-full max-w-6xl h-[calc(85vh-100px)] bg-white rounded-lg shadow-2xl overflow-hidden border-[3px] border-gray-900">
							<iframe
								src={selectedMedia.url + '#view=FitH'}
								class="w-full h-full border-0"
								title="PDF Document"
								style="background: white;"
							/>
						</div>
					{:else}
						<img
							src={selectedMedia.url}
							alt="Full size media"
							class="max-w-full max-h-[calc(85vh-100px)] object-contain rounded-lg shadow-lg"
						/>
					{/if}
				</div>
			</div>
			
			<!-- Toolbar -->
			<div class="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 px-2">
				<div class="flex items-center gap-3">
					{#if mediaType === 'pdfs' && selectedMedia.pageCount}
						<div class="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border-2 border-white/20">
							<svg class="w-4 h-4 text-[#ffc480]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
							</svg>
							<span class="text-xs font-bold text-white uppercase">{selectedMedia.pageCount} {selectedMedia.pageCount === 1 ? 'Page' : 'Pages'}</span>
						</div>
					{:else if selectedMedia.width && selectedMedia.height}
						<div class="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border-2 border-white/20">
							<svg class="w-4 h-4 text-[#ffc480]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
							<span class="text-xs font-bold text-white font-mono">{selectedMedia.width} × {selectedMedia.height}</span>
						</div>
					{/if}
					{#if selectedMedia.createdAt}
						<div class="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border-2 border-white/20">
							<svg class="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
							<span class="text-xs font-bold text-white uppercase">{formatDate(selectedMedia.createdAt)}</span>
						</div>
					{/if}
				</div>

				<div class="flex gap-3 w-full sm:w-auto">
					<button 
						class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-900 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs font-black uppercase tracking-wide"
						on:click={(e) => copyToClipboard(selectedMedia.url, e)}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
						</svg>
						Copy Link
					</button>
					<button 
						class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[#ff6b6b] text-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs font-black uppercase tracking-wide"
						on:click={(e) => downloadMedia(selectedMedia.url, e)}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
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

	/* Hide PDF scrollbars and toolbars in preview mode */
	iframe {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	iframe::-webkit-scrollbar {
		display: none;
	}

	/* Style PDF preview to look like an image */
	iframe[title="PDF Preview"] {
		background: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		transition: transform 0.3s ease;
	}

	/* Add subtle loading background pattern */
	iframe[title="PDF Preview"]:not([src]) {
		background: white;
		background-image: linear-gradient(45deg, #f9f9f9 25%, transparent 25%),
						  linear-gradient(-45deg, #f9f9f9 25%, transparent 25%),
						  linear-gradient(45deg, transparent 75%, #f9f9f9 75%),
						  linear-gradient(-45deg, transparent 75%, #f9f9f9 75%);
		background-size: 20px 20px;
		background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
	}

	/* Full PDF viewer in lightbox */
	iframe[title="PDF Document"] {
		background: white;
	}

	/* Add hover effect for PDF preview */
	.group:hover iframe[title="PDF Preview"] {
		transform: scale(1.02);
	}
</style>