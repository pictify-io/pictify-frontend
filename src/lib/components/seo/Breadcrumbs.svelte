<script>
/**
 * Breadcrumbs component with Schema.org BreadcrumbList structured data
 *
 * @prop {Array<{label: string, href: string}>} items - Array of breadcrumb items
 * @prop {string} currentLabel - Label for the current page (not linked)
 */

export let items = [];
export let currentLabel = '';

// Generate structured data for BreadcrumbList
$: structuredData = {
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: [
		...items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.label,
			item: `https://pictify.io${item.href}`
		})),
		...(currentLabel
			? [
					{
						'@type': 'ListItem',
						position: items.length + 1,
						name: currentLabel
					}
			  ]
			: [])
	]
};
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
</svelte:head>

<nav aria-label="Breadcrumb" class="mb-8">
	<ol class="flex items-center gap-2 text-sm font-bold flex-wrap">
		{#each items as item, i}
			<li>
				<a
					href={item.href}
					class="text-gray-500 hover:text-gray-900 transition-colors"
				>
					{item.label}
				</a>
			</li>
			<li class="text-gray-400" aria-hidden="true">/</li>
		{/each}
		{#if currentLabel}
			<li class="text-gray-900">{currentLabel}</li>
		{/if}
	</ol>
</nav>
