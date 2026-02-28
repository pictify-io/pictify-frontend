<script>
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { createEventDispatcher } from 'svelte';
	import DOMPurify from 'dompurify';
	import { getPageNumbers as sharedGetPageNumbers } from '$lib/utils/format.js';

	export let templates;
	export let pagination = { page: 1, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false };

	const dispatch = createEventDispatcher();

	// Handle format filter change - dispatch to parent to refetch from API


	const handleTemplateClick = (template) => {
		// Route to format-specific editor based on outputFormat
		const formatPath = template.outputFormat === 'pdf' ? 'pdf' : 'image';
		const url = `/template-workspace/${formatPath}/${template.uid}`;
		if (browser) {
			window.open(url, '_blank', 'noopener,noreferrer');
		} else {
			goto(url);
		}
	};

	// Format date nicely
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now - date);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 1) return 'Today';
		if (diffDays === 2) return 'Yesterday';
		if (diffDays <= 7) return `${diffDays - 1}d ago`;
		
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};

	// Get thumbnail URL with cache-busting based on updatedAt
	const getThumbnailUrl = (template) => {
		if (!template.thumbnail) return null;
		const timestamp = template.updatedAt ? new Date(template.updatedAt).getTime() : Date.now();
		const separator = template.thumbnail.includes('?') ? '&' : '?';
		return `${template.thumbnail}${separator}v=${timestamp}`;
	};

	// Generate SVG preview from FabricJS data
	const generateSvgPreview = (template) => {
		const width = template.width || 1080;
		const height = template.height || 1080;
		const fabricData = template.fabricJSData;
		
		if (!fabricData || !fabricData.objects || fabricData.objects.length === 0) {
			return null;
		}
		
		let svgElements = [];
		
		fabricData.objects.forEach(obj => {
			if (!obj) return;
			
			const opacity = obj.opacity !== undefined ? obj.opacity : 1;
			const left = obj.left || 0;
			const top = obj.top || 0;
			
			if (obj.type === 'rect') {
				const w = (obj.width || 0) * (obj.scaleX || 1);
				const h = (obj.height || 0) * (obj.scaleY || 1);
				svgElements.push(
					'<rect x="' + left + '" y="' + top + '" width="' + w + '" height="' + h + 
					'" fill="' + (obj.fill || '#ccc') + '" opacity="' + opacity + 
					'" rx="' + (obj.rx || 0) + '" />'
				);
			} else if (obj.type === 'circle') {
				const r = (obj.radius || 0) * (obj.scaleX || 1);
				svgElements.push(
					'<circle cx="' + (left + r) + '" cy="' + (top + r) + '" r="' + r + 
					'" fill="' + (obj.fill || '#ccc') + '" opacity="' + opacity + '" />'
				);
			} else if (['i-text', 'text', 'IText', 'Text', 'Textbox', 'textbox'].includes(obj.type)) {
				const fontSize = (obj.fontSize || 16) * (obj.scaleX || 1);
				const text = obj.text || '';
				// Escape HTML entities
				const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
				svgElements.push(
					'<text x="' + left + '" y="' + (top + fontSize * 0.85) + 
					'" font-size="' + fontSize + 'px" font-family="' + (obj.fontFamily || 'Arial') + 
					'" font-weight="' + (obj.fontWeight || 'normal') + 
					'" fill="' + (obj.fill || '#000') + '" opacity="' + opacity + '">' + 
					escapedText + '</text>'
				);
			} else if (obj.type === 'image' && obj.src) {
				const w = (obj.width || 100) * (obj.scaleX || 1);
				const h = (obj.height || 100) * (obj.scaleY || 1);
				svgElements.push(
					'<image href="' + obj.src + '" x="' + left + '" y="' + top + 
					'" width="' + w + '" height="' + h + '" opacity="' + opacity + 
					'" preserveAspectRatio="xMidYMid slice" />'
				);
			} else if (obj.type === 'path' && obj.path) {
				// Handle path objects
				let pathD = '';
				if (Array.isArray(obj.path)) {
					pathD = obj.path.map(p => Array.isArray(p) ? p.join(' ') : p).join(' ');
				}
				if (pathD) {
					svgElements.push(
						'<path d="' + pathD + '" fill="' + (obj.fill || 'none') + 
						'" stroke="' + (obj.stroke || 'none') + '" opacity="' + opacity + 
						'" transform="translate(' + left + ',' + top + ')" />'
					);
				}
			}
		});
		
		const bgColor = fabricData.background || '#ffffff';
		
		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height +
			'" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">' +
			'<rect width="' + width + '" height="' + height + '" fill="' + bgColor + '"/>' +
			svgElements.join('') + '</svg>';
	};

	// Sanitize SVG preview to prevent XSS attacks
	const sanitizedPreview = (template) => {
		const svg = generateSvgPreview(template);
		if (!svg) return null;
		return DOMPurify.sanitize(svg, {
			USE_PROFILES: { svg: true }
		});
	};

	// Get dimension label
	const getDimensionLabel = (template) => {
		const width = template.width || 1080;
		const height = template.height || 1080;
		return `${width}x${height}`;
	};

	// Pagination handlers
	const goToPage = (page) => {
		dispatch('pageChange', page);
	};

	const prevPage = () => {
		if (pagination.hasPrev) {
			goToPage(pagination.page - 1);
		}
	};

	const nextPage = () => {
		if (pagination.hasNext) {
			goToPage(pagination.page + 1);
		}
	};

	const getPageNumbers = () => sharedGetPageNumbers(pagination.page, pagination.totalPages);
</script>

<section>
	<!-- Template Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full mt-6 sm:mt-8">
		{#each templates as template (template.uid)}
			<div
				role="button"
				tabindex="0"
				class="template-card group relative bg-white rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] shadow-[4px_4px_0_0_#1f2937] sm:shadow-[6px_6px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] sm:hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 overflow-hidden flex flex-col
					{template.hasDynamicLink ? 'border-[#a855f7] ring-2 ring-[#a855f7]/30' : 'border-gray-900'}"
				on:click={() => handleTemplateClick(template)}
				on:keydown={(e) => {
					if (e.key === 'Enter') handleTemplateClick(template);
				}}
			>
				<!-- Card Header / Tab -->
				<div class="h-7 sm:h-8 border-b-[2px] sm:border-b-[3px] flex items-center justify-between px-2 sm:px-3
					{template.hasDynamicLink ? 'bg-[#a855f7]/10 border-[#a855f7]' : 'bg-gray-100 border-gray-900'}">
					<div class="flex items-center gap-1 sm:gap-1.5">
						<div class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
						<div class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ffc480] border border-gray-900"></div>
						<div class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#4ade80] border border-gray-900"></div>
					</div>
					<div class="flex items-center gap-2">
						{#if template.hasDynamicLink}
							<span class="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold font-mono bg-[#a855f7] text-white uppercase tracking-wider rounded border border-gray-900 flex items-center gap-0.5">
								<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
								LIVE
							</span>
						{/if}
						{#if template.outputFormat === 'pdf'}
							<span class="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold font-mono bg-[#ff6b6b] text-white uppercase tracking-wider rounded border border-gray-900">
								PDF
							</span>
						{:else}
							<span class="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold font-mono bg-[#4facfe] text-white uppercase tracking-wider rounded border border-gray-900">
								IMAGE
							</span>
						{/if}
						<span class="text-[9px] sm:text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wider">
							{getDimensionLabel(template)}
						</span>
					</div>
				</div>

				<!-- Preview Container -->
				<div class="relative aspect-[4/3] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden group-hover:bg-gray-50 transition-colors">
					<div class="absolute inset-0 flex items-center justify-center p-3 sm:p-4 md:p-6 transition-transform duration-300 group-hover:scale-105">
						{#if template.thumbnail}
							<img 
								src={getThumbnailUrl(template)} 
								alt={template.name}
								class="w-full h-full object-contain drop-shadow-lg"
								loading="lazy"
							/>
						{:else if sanitizedPreview(template)}
							<div class="w-full h-full drop-shadow-lg">
								{@html sanitizedPreview(template)}
							</div>
						{:else}
							<div class="flex flex-col items-center justify-center w-full h-full text-gray-300">
								<svg class="w-16 h-16 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
								</svg>
								<span class="text-xs font-black uppercase tracking-widest opacity-50">Empty</span>
							</div>
						{/if}
					</div>

				<!-- Edit Hint Pill (hover only) -->
				<div class="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-10">
					<span class="inline-flex items-center gap-1 px-2 py-1 bg-[#ffc480] text-gray-900 font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-full border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937]">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
						Edit
					</span>
				</div>
			</div>
			
			<!-- Footer Info -->
			<div class="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-2 border-t-[2px] sm:border-t-[3px] bg-white flex-1 flex flex-col justify-between
				{template.hasDynamicLink ? 'border-[#a855f7]' : 'border-gray-900'}">
				<div>
					<h3 class="font-black text-gray-900 text-base sm:text-lg leading-tight mb-2 sm:mb-3 line-clamp-1" title={template.name}>
						{template.name}
					</h3>

					<div class="flex flex-wrap gap-1.5 sm:gap-2">
						<!-- Live Link Tag -->
						{#if template.hasDynamicLink}
							<div class="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#a855f7]/20 border border-[#a855f7] rounded text-[9px] sm:text-[10px] font-bold uppercase text-[#7c3aed] tracking-wide">
								<svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
								<span class="flex items-center gap-1">
									Live
									<span class="w-1.5 h-1.5 bg-[#a855f7] rounded-full animate-pulse"></span>
								</span>
							</div>
						{/if}

						<!-- Date Tag -->
						<div class="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 border border-gray-300 rounded text-[9px] sm:text-[10px] font-bold uppercase text-gray-600 tracking-wide">
							<svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
							{formatDate(template.createdAt)}
						</div>

						<!-- Usage Tag -->
						{#if template.usageCount > 0}
							<div class="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#4ade80]/20 border border-[#4ade80] rounded text-[9px] sm:text-[10px] font-bold uppercase text-gray-900 tracking-wide">
								<svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
								{template.usageCount} Runs
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Footer Action Bar -->
			<div class="grid grid-cols-3 border-t-[2px] sm:border-t-[3px]
				{template.hasDynamicLink ? 'border-[#a855f7]' : 'border-gray-900'}">
				<button
					class="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-gray-500 hover:text-[#4ecdc4] hover:bg-[#4ecdc4]/10 transition-all duration-150 border-r-[2px] sm:border-r-[3px]
						{template.hasDynamicLink ? 'border-[#a855f7]' : 'border-gray-900'}"
					on:click|stopPropagation={() => goto(`/dashboard/template/${template.uid}/render`)}
					title="Render with variables"
				>
					<svg class="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
					<span class="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">Render</span>
				</button>
				<button
					class="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-gray-500 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-all duration-150 border-r-[2px] sm:border-r-[3px]
						{template.hasDynamicLink ? 'border-[#a855f7]' : 'border-gray-900'}"
					on:click|stopPropagation={() => goto(`/dashboard/template/${template.uid}/bulk-render`)}
					title="Batch render from CSV"
				>
					<svg class="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
					<span class="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">Bulk</span>
				</button>
				{#if template.hasDynamicLink}
					<button
						class="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-[#a855f7] bg-[#a855f7]/10 hover:bg-[#a855f7]/20 transition-all duration-150"
						on:click|stopPropagation={() => goto(`/dashboard/template/${template.uid}/dynamic`)}
						title="View live link"
					>
						<svg class="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
						<span class="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">Live</span>
						<span class="w-1.5 h-1.5 bg-[#a855f7] rounded-full animate-pulse"></span>
					</button>
				{:else}
					<button
						class="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-gray-500 hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-all duration-150"
						on:click|stopPropagation={() => goto(`/dashboard/template/${template.uid}/dynamic`)}
						title="Deploy as live link"
					>
						<svg class="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
						<span class="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">Live</span>
					</button>
				{/if}
			</div>
			</div>
		{/each}
	</div>

	<!-- Pagination -->
	{#if pagination.totalPages > 1}
		<div class="flex flex-col sm:flex-row items-center justify-between mt-8 sm:mt-12 pt-6 sm:pt-8 border-t-[2px] sm:border-t-[3px] border-gray-900 gap-4 sm:gap-6">
			<!-- Results count -->
			<div class="flex items-center gap-2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-[2px] border-gray-900 shadow-sm">
				<div class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ffc480] rounded-full animate-pulse"></div>
				<div class="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wide">
					<span class="hidden sm:inline">Showing </span><span class="text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> / <span class="text-gray-900">{pagination.total}</span>
				</div>
			</div>

			<!-- Page controls -->
			<div class="flex items-center gap-1.5 sm:gap-2">
				<!-- Previous button -->
				<button
					on:click={prevPage}
					disabled={!pagination.hasPrev}
					class="group flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-[2px] border-gray-900 bg-white transition-all duration-200
						{pagination.hasPrev 
							? 'hover:bg-gray-900 hover:text-white shadow-[2px_2px_0_0_#1f2937] sm:shadow-[3px_3px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]' 
							: 'opacity-50 cursor-not-allowed bg-gray-100'}"
					title="Previous Page"
					aria-label="Previous Page"
				>
					<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
					</svg>
				</button>

				<!-- Page numbers -->
				<div class="flex items-center gap-1 sm:gap-2 mx-1 sm:mx-2 bg-gray-100 p-0.5 sm:p-1 rounded-lg border border-gray-200">
					{#each getPageNumbers() as pageNum}
						{#if pageNum === '...'}
							<span class="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-gray-400 font-black text-[10px] sm:text-xs">...</span>
						{:else}
							<button
								on:click={() => goToPage(pageNum)}
								class="w-6 h-6 sm:w-8 sm:h-8 text-[10px] sm:text-xs font-black rounded-md transition-all duration-200 flex items-center justify-center
									{pageNum === pagination.page 
										? 'bg-gray-900 text-white shadow-md scale-105' 
										: 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'}"
								aria-label="Page {pageNum}"
								aria-current={pageNum === pagination.page ? 'page' : undefined}
							>
								{pageNum}
							</button>
						{/if}
					{/each}
				</div>

				<!-- Next button -->
				<button
					on:click={nextPage}
					disabled={!pagination.hasNext}
					class="group flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-[2px] border-gray-900 bg-white transition-all duration-200
						{pagination.hasNext 
							? 'hover:bg-gray-900 hover:text-white shadow-[2px_2px_0_0_#1f2937] sm:shadow-[3px_3px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]' 
							: 'opacity-50 cursor-not-allowed bg-gray-100'}"
					title="Next Page"
					aria-label="Next Page"
				>
					<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
					</svg>
				</button>
			</div>
		</div>
	{/if}
</section>

<style>
	.line-clamp-1 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
		line-clamp: 1;
	}
</style>