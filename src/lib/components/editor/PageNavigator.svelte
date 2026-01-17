<script>
	import { pages, currentPageIndex, pageCount, pageActions, outputFormat } from '../../../store/pages.store';
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	function switchToPage(index) {
		dispatch('beforeSwitch', { fromIndex: $currentPageIndex, toIndex: index });
		pageActions.switchPage(index);
		dispatch('afterSwitch', { index });
	}
	
	function addPage() {
		dispatch('beforeSwitch', { fromIndex: $currentPageIndex, toIndex: $pages.length });
		const newPageNumber = pageActions.addPage();
		dispatch('pageAdded', { pageNumber: newPageNumber });
		dispatch('afterSwitch', { index: $pages.length - 1 });
	}
	
	function deletePage(id, index, event) {
		event.stopPropagation();
		if ($pages.length <= 1) return;
		
		const confirmed = confirm(`Delete "${$pages[index].name}"? This cannot be undone.`);
		if (confirmed) {
			pageActions.deletePage(id);
			dispatch('pageDeleted', { id });
		}
	}
	
	function renamePage(id, index) {
		const currentName = $pages[index].name;
		const newName = prompt('Enter page name:', currentName);
		if (newName && newName !== currentName) {
			pageActions.renamePage(id, newName);
		}
	}
</script>

{#if $outputFormat === 'pdf'}
	<div class="page-navigator">
		<div class="page-strip">
			<!-- Page thumbnails -->
			{#each $pages as page, index (page.id)}
				<button
					class="page-thumb"
					class:active={index === $currentPageIndex}
					on:click={() => switchToPage(index)}
					on:dblclick={() => renamePage(page.id, index)}
					title={page.name}
				>
					<div class="thumb-preview">
						{#if page.thumbnail}
							<img src={page.thumbnail} alt={page.name} />
						{:else}
							<div class="thumb-placeholder">
								<span class="page-number">{index + 1}</span>
							</div>
						{/if}
					</div>
					<span class="page-label">{page.name}</span>
					
					{#if $pages.length > 1}
						<button 
							class="delete-btn"
							on:click={(e) => deletePage(page.id, index, e)}
							title="Delete page"
						>
							<i class="fa fa-times"></i>
						</button>
					{/if}
				</button>
			{/each}
			
			<!-- Add page button -->
			<button class="add-page-btn" on:click={addPage} title="Add new page">
				<i class="fa fa-plus"></i>
				<span>Add Page</span>
			</button>
		</div>
		
		<div class="page-info">
			<span class="page-count">Page {$currentPageIndex + 1} of {$pageCount}</span>
		</div>
	</div>
{/if}

<style>
	.page-navigator {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px;
		background: #FFFDF8;
		border-bottom: 3px solid #1f2937;
		gap: 16px;
		min-height: 72px;
	}
	
	.page-strip {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-x: auto;
		flex: 1;
		padding: 4px 0;
	}
	
	.page-strip::-webkit-scrollbar {
		height: 6px;
	}
	
	.page-strip::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 3px;
	}
	
	.page-thumb {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 4px;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}
	
	.page-thumb:hover {
		border-color: #9ca3af;
		transform: translateY(-2px);
	}
	
	.page-thumb.active {
		border-color: #1f2937;
		border-width: 3px;
		box-shadow: 4px 4px 0 0 #1f2937;
	}
	
	.thumb-preview {
		width: 60px;
		height: 48px;
		background: #f9fafb;
		border-radius: 4px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.thumb-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.thumb-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
	}
	
	.page-number {
		font-size: 18px;
		font-weight: 800;
		color: #9ca3af;
	}
	
	.page-label {
		font-size: 10px;
		font-weight: 600;
		color: #4b5563;
		max-width: 60px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.delete-btn {
		position: absolute;
		top: -6px;
		right: -6px;
		width: 18px;
		height: 18px;
		background: #ef4444;
		border: 2px solid white;
		border-radius: 50%;
		color: white;
		font-size: 8px;
		cursor: pointer;
		display: none;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}
	
	.page-thumb:hover .delete-btn {
		display: flex;
	}
	
	.delete-btn:hover {
		background: #dc2626;
		transform: scale(1.1);
	}
	
	.add-page-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		width: 68px;
		height: 68px;
		background: white;
		border: 2px dashed #9ca3af;
		border-radius: 8px;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}
	
	.add-page-btn:hover {
		border-color: #1f2937;
		color: #1f2937;
		background: #f9fafb;
	}
	
	.add-page-btn i {
		font-size: 16px;
	}
	
	.add-page-btn span {
		font-size: 9px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.page-info {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}
	
	.page-count {
		font-size: 12px;
		font-weight: 600;
		color: #6b7280;
		background: #f3f4f6;
		padding: 4px 12px;
		border-radius: 12px;
		border: 2px solid #e5e7eb;
	}
</style>
