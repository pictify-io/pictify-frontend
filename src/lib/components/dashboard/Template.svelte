<script>
	import NavTemplate from '$lib/components/dashboard/template/NavTemplate.svelte';
	import EmptyTemplate from '$lib/components/dashboard/template/EmptyTemplate.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { getTemplatesAction, searchTemplatesAction, templates } from '../../../store/template.store';
	import TemplateList from '$lib/components/dashboard/template/TemplateList.svelte';
	import Loader from '$lib/components/Loader.svelte';

	let unsubscribe = () => {};
	let templateList = [];
	let isLoading = true;
	let searchQuery = '';

	const handleSearch = async (event) => {
		const query = event.detail;
		searchQuery = query;
		isLoading = true;
		
		if (query) {
			await searchTemplatesAction(query);
		} else {
			await getTemplatesAction();
		}
		
		isLoading = false;
	};

	onMount(async () => {
		unsubscribe = templates.subscribe(async (t) => {
			templateList = t;
		});
		await getTemplatesAction();
		isLoading = false;
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div class="h-full w-full max-w-6xl m-auto p-5">
	<NavTemplate on:search={handleSearch} />
	{#if templateList.length === 0 && !isLoading && !searchQuery}
		<EmptyTemplate />
	{:else if templateList.length === 0 && !isLoading && searchQuery}
		<div class="text-center mt-20">
			<p class="text-lg text-gray-600">No templates found for "{searchQuery}"</p>
		</div>
	{:else if !isLoading}
		<TemplateList templates={templateList} />
	{:else}
		<div class="mt-20">
			<Loader size="16" show={isLoading} />
		</div>
	{/if}
</div>
