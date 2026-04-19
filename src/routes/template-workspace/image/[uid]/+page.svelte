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

		const loaded = await getTemplateAction($page.params.uid);
		// HTML templates are served by /template-workspace/html/<uid>
		// and can't render in the fabric editor. Cross-redirect if a
		// user lands here with an HTML uid (shared link, legacy
		// bookmark, typo on the list page).
		if (loaded?.engine === 'html') {
			goto(`/template-workspace/html/${$page.params.uid}`, { replaceState: true });
			return;
		}
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
