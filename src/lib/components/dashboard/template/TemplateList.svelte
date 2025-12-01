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
		if (diffDays <= 7) return `${diffDays - 1} days ago`;
		
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
		return `${width} × ${height}`;
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
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full mt-8">
		{#each templates as template (template.uid)}
			<div
				role="button"
				tabindex="0"
				class="template-card group bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#ff6b6b]"
				on:click={() => handleTemplateClick(template)}
				on:keydown={(e) => {
					if (e.key === 'Enter') handleTemplateClick(template);
				}}
			>
				<!-- Preview Container -->
				<div class="relative bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200 overflow-hidden flex items-center justify-center" style="height: 180px;">
					{#if template.thumbnail}
						<!-- Use thumbnail if available (with cache-busting) -->
						<img 
							src={getThumbnailUrl(template)} 
							alt={template.name}
							class="w-full h-full object-contain"
							loading="lazy"
						/>
					{:else if generateSvgPreview(template)}
						<!-- Render SVG from FabricJS data -->
						<div class="w-full h-full p-2 flex items-center justify-center">
							{@html generateSvgPreview(template)}
						</div>
					{:else}
						<!-- Placeholder for empty templates -->
						<div class="flex flex-col items-center justify-center w-full h-full text-gray-400">
							<svg class="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
							</svg>
							<span class="text-xs">No preview</span>
						</div>
					{/if}
					
					<!-- Dimension badge -->
					<div class="absolute bottom-2 left-2 z-20">
						<span class="text-[10px] font-medium text-gray-500 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
							{getDimensionLabel(template)}
						</span>
				</div>
				
				<!-- Hover overlay -->
				<div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-20 pointer-events-none" />
				
				<!-- Open icon on hover -->
				<div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
					<div class="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
						<svg class="w-4 h-4 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
						</svg>
					</div>
				</div>
			</div>
				
				<!-- Template Info -->
				<div class="p-4">
					<h3 class="font-semibold text-gray-900 text-base mb-2 line-clamp-1 group-hover:text-[#ff6b6b] transition-colors">
						{template.name}
					</h3>
					<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 text-xs text-gray-500">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
						</svg>
						<span>{formatDate(template.createdAt)}</span>
						</div>
						{#if template.usageCount > 0}
							<div class="flex items-center gap-1 text-xs text-gray-400">
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
								</svg>
								<span>{template.usageCount}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Pagination -->
	{#if pagination.totalPages > 1}
		<div class="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
			<!-- Results count -->
			<div class="text-sm text-gray-500">
				Showing <span class="font-medium text-gray-700">{(pagination.page - 1) * pagination.limit + 1}</span>
				to <span class="font-medium text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
				of <span class="font-medium text-gray-700">{pagination.total}</span> templates
			</div>

			<!-- Page controls -->
			<div class="flex items-center gap-1">
				<!-- Previous button -->
				<button
					on:click={prevPage}
					disabled={!pagination.hasPrev}
					class="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
						{pagination.hasPrev 
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
								on:click={() => goToPage(pageNum)}
								class="w-9 h-9 text-sm font-medium rounded-lg transition-all duration-200
									{pageNum === pagination.page 
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
					on:click={nextPage}
					disabled={!pagination.hasNext}
					class="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
						{pagination.hasNext 
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
</section>

<style>
	.template-card {
		/* Prevent layout shift on hover */
		will-change: transform;
	}
	
	.line-clamp-1 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
		line-clamp: 1;
	}
</style>
