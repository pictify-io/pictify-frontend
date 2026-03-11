<script>
	import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
	import { getTemplateAction } from '../../../../store/template.store';
	import { pageActions } from '../../../../store/pages.store';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Loader from '$lib/components/Loader.svelte';

	let isLoading = true;

	onMount(async () => {
		if (!$page.params.uid) {
			goto('/dashboard/template');
			return;
		}

		// Set image mode immediately so UI shows correct panels
		pageActions.setOutputFormat('image');

		await getTemplateAction($page.params.uid);
		isLoading = false;
	});
</script>

<div class="h-full w-full">
	{#if isLoading}
		<div class="mt-20">
			<Loader size="16" show={isLoading} />
		</div>
	{:else}
		<CreateTemplate isEdit={true} templateType="image" />
	{/if}
</div>
