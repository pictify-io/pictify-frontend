<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	let isOpen = false;
	let query = '';
	let selectedIndex = 0;
	let inputEl;

	// All searchable items
	const allItems = [
		// Navigation
		{ type: 'nav', label: 'Home', description: 'Dashboard overview & analytics', path: '/dashboard', keywords: 'home dashboard overview stats analytics' },
		{ type: 'nav', label: 'Templates', description: 'Manage your templates', path: '/dashboard/template', keywords: 'templates list manage create' },
		{ type: 'nav', label: 'Brand Assets', description: 'Manage brand colors, logos, fonts', path: '/dashboard/brand-assets', keywords: 'brand assets logos fonts colors' },
		{ type: 'nav', label: 'Experiments', description: 'A/B tests, smart links, scheduled images', path: '/dashboard/experiments', keywords: 'experiments ab test smart link scheduled auto-optimize' },
		{ type: 'nav', label: 'Images', description: 'Generated images library', path: '/dashboard/media/images', keywords: 'images media generated renders' },
		{ type: 'nav', label: 'GIFs', description: 'Generated GIFs library', path: '/dashboard/media/gifs', keywords: 'gifs animated media generated' },
		{ type: 'nav', label: 'PDFs', description: 'Generated PDFs library', path: '/dashboard/media/pdfs', keywords: 'pdfs documents media generated' },
		{ type: 'nav', label: 'Activity Logs', description: 'View usage history & audit trail', path: '/dashboard/activity-logs', keywords: 'activity logs audit history usage tracking' },
		{ type: 'nav', label: 'API Playground', description: 'Test API endpoints interactively', path: '/dashboard/api-playground', keywords: 'api playground test endpoints curl' },
		{ type: 'nav', label: 'API Keys', description: 'Manage API tokens', path: '/dashboard/api-token', keywords: 'api keys tokens authentication bearer' },
		{ type: 'nav', label: 'Integrations', description: 'Webhooks, storage connectors, Zapier', path: '/dashboard/integrations', keywords: 'integrations webhooks storage zapier make n8n pipedream' },
		{ type: 'nav', label: 'Webhooks', description: 'Configure webhook subscriptions', path: '/dashboard/integrations/webhooks', keywords: 'webhooks events notifications' },
		{ type: 'nav', label: 'Storage Connectors', description: 'S3, Google Cloud, Cloudinary, ImageKit', path: '/dashboard/integrations/storage', keywords: 'storage s3 gcs cloudinary imagekit connectors upload' },
		{ type: 'nav', label: 'Team Settings', description: 'Manage team members & roles', path: '/dashboard/team', keywords: 'team settings members invite roles' },
		{ type: 'nav', label: 'Billing', description: 'Subscription, invoices, usage', path: '/dashboard/billing', keywords: 'billing subscription plan invoices usage upgrade pricing' },

		// Actions
		{ type: 'action', label: 'Create New Template', description: 'Start building a new template', path: '/dashboard/template/create', keywords: 'create new template start build' },
		{ type: 'action', label: 'Create New Experiment', description: 'Set up an A/B test or smart link', path: '/dashboard/experiments/create', keywords: 'create new experiment ab test smart link' },
		{ type: 'action', label: 'Upgrade Plan', description: 'View plans and upgrade', path: '/dashboard/billing', keywords: 'upgrade plan pricing pro business enterprise' },
	];

	// Simple fuzzy search
	function searchItems(q) {
		if (!q.trim()) return allItems;

		const terms = q.toLowerCase().split(/\s+/);
		return allItems
			.map(item => {
				const searchText = `${item.label} ${item.description} ${item.keywords}`.toLowerCase();
				let score = 0;
				let allMatch = true;

				for (const term of terms) {
					if (searchText.includes(term)) {
						if (item.label.toLowerCase().includes(term)) score += 10;
						else if (item.keywords.includes(term)) score += 5;
						else score += 2;
					} else {
						allMatch = false;
					}
				}

				return { ...item, score, allMatch };
			})
			.filter(item => item.allMatch || item.score > 0)
			.sort((a, b) => b.score - a.score);
	}

	$: filteredItems = searchItems(query);
	$: if (filteredItems.length > 0 && selectedIndex >= filteredItems.length) {
		selectedIndex = 0;
	}

	function open() {
		isOpen = true;
		query = '';
		selectedIndex = 0;
		setTimeout(() => inputEl?.focus(), 10);
	}

	function close() {
		isOpen = false;
		query = '';
	}

	function selectItem(item) {
		close();
		goto(item.path);
	}

	function handleGlobalKeydown(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			if (isOpen) close();
			else open();
		}
	}

	function handlePaletteKeydown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = (selectedIndex + 1) % filteredItems.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (filteredItems[selectedIndex]) {
				selectItem(filteredItems[selectedIndex]);
			}
		}
	}

	export function toggle() {
		if (isOpen) close();
		else open();
	}

	onMount(() => {
		window.addEventListener('keydown', handleGlobalKeydown);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleGlobalKeydown);
		}
	});
</script>

{#if isOpen}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]"
		on:click={close}
	>
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="w-full max-w-xl bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden animate-palette-in"
			on:click|stopPropagation
			on:keydown={handlePaletteKeydown}
		>
			<!-- Search Input -->
			<div class="flex items-center gap-3 px-5 py-4 border-b-[3px] border-gray-900">
				<svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					type="text"
					placeholder="Search pages, features, actions..."
					class="flex-1 text-sm font-bold text-gray-900 placeholder-gray-400 bg-transparent outline-none"
				/>
				<kbd class="hidden sm:inline-block px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono text-gray-500">ESC</kbd>
			</div>

			<!-- Results -->
			<div class="max-h-[50vh] overflow-y-auto py-2" role="listbox">
				{#if filteredItems.length === 0}
					<div class="px-5 py-8 text-center">
						<p class="text-sm font-bold text-gray-400">No results for "{query}"</p>
					</div>
				{:else}
					{#each filteredItems as item, i}
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							role="option"
							aria-selected={i === selectedIndex}
							class="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors
								{i === selectedIndex ? 'bg-[#ffc480]/30' : 'hover:bg-gray-50'}"
							on:click={() => selectItem(item)}
							on:mouseenter={() => selectedIndex = i}
							on:keydown
						>
							{#if item.type === 'action'}
								<div class="w-8 h-8 rounded-lg bg-[#4ecdc4]/10 border-2 border-[#4ecdc4]/30 flex items-center justify-center flex-shrink-0">
									<svg class="w-4 h-4 text-[#4ecdc4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
									</svg>
								</div>
							{:else}
								<div class="w-8 h-8 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
									<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
									</svg>
								</div>
							{/if}

							<div class="flex-1 min-w-0">
								<div class="text-sm font-bold text-gray-900">{item.label}</div>
								<div class="text-xs text-gray-500 truncate">{item.description}</div>
							</div>

							{#if item.type === 'action'}
								<span class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#4ecdc4]/10 text-[#0d9488] rounded-full border border-[#4ecdc4]/30">Action</span>
							{/if}

							{#if i === selectedIndex}
								<kbd class="hidden sm:inline-block px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono text-gray-500">&#9166;</kbd>
							{/if}
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer hint -->
			<div class="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 bg-gray-50/50">
				<div class="flex gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
					<span class="flex items-center gap-1">
						<kbd class="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono">&#8593;&#8595;</kbd>
						Navigate
					</span>
					<span class="flex items-center gap-1">
						<kbd class="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono">&#9166;</kbd>
						Select
					</span>
					<span class="flex items-center gap-1">
						<kbd class="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono">Esc</kbd>
						Close
					</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes palette-in {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(-8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.animate-palette-in {
		animation: palette-in 0.15s ease-out forwards;
	}
</style>
