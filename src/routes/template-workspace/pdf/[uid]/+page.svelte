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

		// Set PDF mode immediately so UI shows correct panels
		pageActions.setOutputFormat('pdf');

		const loaded = await getTemplateAction($page.params.uid);
		// HTML templates live on /template-workspace/html/<uid>. If a
		// user lands here with an HTML uid the fabric editor would
		// render a blank canvas; cross-redirect instead.
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
		<CreateTemplate isEdit={true} templateType="pdf" />
	{/if}
</div>
