<script>
/**
 * RelatedLinks Component
 * Displays related content links for internal linking SEO
 *
 * @prop {Object[]} items - Array of related items
 * @prop {string} title - Section title
 * @prop {string} [layout] - Layout style: 'grid' | 'list' | 'pills'
 * @prop {string} [hubLink] - Optional link to hub/category page
 * @prop {string} [hubLabel] - Label for hub link
 */

export let items = [];
export let title = 'Related';
export let layout = 'grid';
export let hubLink = null;
export let hubLabel = 'View All';

// Get link href for an item
function getHref(item) {
	if (item.href) return item.href;
	if (item.slug) return `/${item.pageType || 'page'}/${item.slug}`;
	if (item.term) return `/glossary/${item.term}`;
	if (item.id) return `/tools/${item.id}`;
	return '#';
}

// Get display title for an item
function getTitle(item) {
	return item.title || item.name || item.label || 'Untitled';
}

// Get description for an item
function getDescription(item) {
	return item.shortDefinition || item.description || item.metaDescription || '';
}
</script>

{#if items.length > 0}
	<section class="related-links">
		<h2 class="text-xl font-black uppercase tracking-wide text-gray-400 mb-6">
			{title}
		</h2>

		{#if layout === 'grid'}
			<div class="grid sm:grid-cols-2 gap-4">
				{#each items as item}
					<a
						href={getHref(item)}
						class="bg-white border-[3px] border-gray-900 p-5 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
					>
						<h3 class="font-black text-gray-900 mb-1 group-hover:text-[#ff6b6b] transition-colors">
							{getTitle(item)}
						</h3>
						{#if getDescription(item)}
							<p class="text-sm text-gray-500 font-medium line-clamp-2">
								{getDescription(item)}
							</p>
						{/if}
					</a>
				{/each}
			</div>

		{:else if layout === 'list'}
			<ul class="space-y-3">
				{#each items as item}
					<li>
						<a
							href={getHref(item)}
							class="flex items-center gap-3 p-3 bg-white border-[2px] border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all group"
						>
							<div class="w-2 h-2 bg-[#ff6b6b] rounded-full flex-shrink-0"></div>
							<span class="font-bold text-gray-900 group-hover:text-[#ff6b6b] transition-colors">
								{getTitle(item)}
							</span>
						</a>
					</li>
				{/each}
			</ul>

		{:else if layout === 'pills'}
			<div class="flex flex-wrap gap-3">
				{#each items as item}
					<a
						href={getHref(item)}
						class="px-4 py-2 bg-white border-[2px] border-gray-900 rounded-lg font-bold text-gray-900 hover:bg-[#ffc480] transition-colors shadow-[2px_2px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px]"
					>
						{getTitle(item)}
					</a>
				{/each}
			</div>
		{/if}

		{#if hubLink}
			<div class="mt-6">
				<a
					href={hubLink}
					class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white border-[2px] border-gray-900 rounded-lg font-bold hover:bg-gray-700 transition-colors"
				>
					{hubLabel}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
					</svg>
				</a>
			</div>
		{/if}
	</section>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
