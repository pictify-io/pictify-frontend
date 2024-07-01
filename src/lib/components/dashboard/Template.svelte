<script>
	import NavTemplate from '$lib/components/dashboard/template/NavTemplate.svelte';
	import EmptyTemplate from '$lib/components/dashboard/template/EmptyTemplate.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { getTemplatesAction, templates } from '../../../store/template.store';
	import TemplateList from '$lib/components/dashboard/template/TemplateList.svelte';
	import Loader from '$lib/components/Loader.svelte';

	let unsubscribe = () => {};
	let templateList = [];
	let isLoading = true;

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
	<NavTemplate />
	{#if templateList.length === 0 && !isLoading}
		<EmptyTemplate />
	{:else if !isLoading}
		<TemplateList templates={templateList} />
	{:else}
		<div class="mt-20">
			<Loader size="16" show={isLoading} />
		</div>
	{/if}
</div>
