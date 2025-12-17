<script>
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { createEventDispatcher } from 'svelte';
	
	export let templates;
	export let pagination = { page: 1, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false };
	
	const dispatch = createEventDispatcher();

	const handleTemplateClick = (template) => {
		const url = `/template-workspace/${template.uid}`;
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

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const { page, totalPages } = pagination;
		const pages = [];
		const maxVisible = 5;
		
		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (page <= 3) {
				for (let i = 1; i <= 4; i++) pages.push(i);
				pages.push('...');
				pages.push(totalPages);
			} else if (page >= totalPages - 2) {
				pages.push(1);
				pages.push('...');
				for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
			} else {
				pages.push(1);
				pages.push('...');
				for (let i = page - 1; i <= page + 1; i++) pages.push(i);
				pages.push('...');
				pages.push(totalPages);
			}
		}
		
		return pages;
	};
</script>

<section>
	<!-- Template Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full mt-6 sm:mt-8">
		{#each templates as template (template.uid)}
			<div
				role="button"
				tabindex="0"
				class="template-card group relative bg-white rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] sm:shadow-[6px_6px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937] sm:hover:shadow-[8px_8px_0_0_#1f2937] hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col"
				on:click={() => handleTemplateClick(template)}
				on:keydown={(e) => {
					if (e.key === 'Enter') handleTemplateClick(template);
				}}
			>
				<!-- Card Header / Tab -->
				<div class="h-7 sm:h-8 bg-gray-100 border-b-[2px] sm:border-b-[3px] border-gray-900 flex items-center justify-between px-2 sm:px-3">
					<div class="flex items-center gap-1 sm:gap-1.5">
						<div class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
						<div class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ffc480] border border-gray-900"></div>
						<div class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#4ade80] border border-gray-900"></div>
					</div>
					<div class="text-[9px] sm:text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wider">
						{getDimensionLabel(template)}
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
						{:else if generateSvgPreview(template)}
							<div class="w-full h-full drop-shadow-lg">
								{@html generateSvgPreview(template)}
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

				<!-- Hover Overlay Actions -->
				<div class="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
					<button class="bg-[#ffc480] text-gray-900 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-[2px] border-gray-900 shadow-[4px_4px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all transform translate-y-4 group-hover:translate-y-0">
						Edit Template
					</button>
				</div>
			</div>
			
			<!-- Footer Info -->
			<div class="p-3 sm:p-4 border-t-[2px] sm:border-t-[3px] border-gray-900 bg-white flex-1 flex flex-col justify-between">
				<div>
					<h3 class="font-black text-gray-900 text-base sm:text-lg leading-tight mb-2 sm:mb-3 line-clamp-1" title={template.name}>
						{template.name}
					</h3>
					
					<div class="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
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