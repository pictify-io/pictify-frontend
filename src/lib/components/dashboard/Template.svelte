<script>
	import NavTemplate from '$lib/components/dashboard/template/NavTemplate.svelte';
	import EmptyTemplate from '$lib/components/dashboard/template/EmptyTemplate.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { getTemplatesAction, searchTemplatesAction, templates, templatesPagination } from '../../../store/template.store';
	import TemplateList from '$lib/components/dashboard/template/TemplateList.svelte';
	import Loader from '$lib/components/Loader.svelte';

	let unsubscribeTemplates = () => {};
	let unsubscribePagination = () => {};
	let templateList = [];
	let pagination = { page: 1, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false };
	let isLoading = true;
	let searchQuery = '';

	const handleSearch = async (event) => {
		const query = event.detail;
		searchQuery = query;
		isLoading = true;
		
		if (query) {
			await searchTemplatesAction(query, { page: 1, limit: 12 });
		} else {
			await getTemplatesAction({ page: 1, limit: 12 });
		}
		
		isLoading = false;
	};

	const handlePageChange = async (event) => {
		const newPage = event.detail;
		isLoading = true;
		
		if (searchQuery) {
			await searchTemplatesAction(searchQuery, { page: newPage, limit: 12 });
		} else {
			await getTemplatesAction({ page: newPage, limit: 12 });
		}
		
		isLoading = false;
		// Scroll to top of template list
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	onMount(async () => {
		unsubscribeTemplates = templates.subscribe(async (t) => {
			templateList = t;
		});
		unsubscribePagination = templatesPagination.subscribe((p) => {
			pagination = p;
		});
		await getTemplatesAction({ page: 1, limit: 12 });
		isLoading = false;
	});

	onDestroy(() => {
		unsubscribeTemplates();
		unsubscribePagination();
	});
</script>

<div class="w-full min-h-screen bg-white">
	<div class="max-w-7xl mx-auto p-6">
		<NavTemplate on:search={handleSearch} />
		{#if templateList.length === 0 && !isLoading && !searchQuery}
			<EmptyTemplate />
		{:else if templateList.length === 0 && !isLoading && searchQuery}
			<div class="text-center mt-20">
				<div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
					</svg>
				</div>
				<p class="text-lg font-medium text-gray-700 mb-1">No templates found</p>
				<p class="text-sm text-gray-500">Try searching for something else or create a new template</p>
			</div>
		{:else if !isLoading}
			<TemplateList templates={templateList} {pagination} on:pageChange={handlePageChange} />
		{:else}
			<div class="mt-20">
				<Loader size="16" show={isLoading} />
			</div>
		{/if}
	</div>
</div>
