<script>
	import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
	import { getTemplateAction, template } from '../../../store/template.store';
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

		const loadedTemplate = await getTemplateAction($page.params.uid);

		// Redirect in priority order: engine first (HTML templates have
		// a dedicated editor that speaks Handlebars + variables), then
		// outputFormat for fabric templates (pdf vs image editors).
		// This route is a catch-all landing page for legacy `/template-
		// workspace/<uid>` links — it should not render the canvas
		// editor directly.
		if (loadedTemplate?.engine === 'html') {
			goto(`/template-workspace/html/${$page.params.uid}`, { replaceState: true });
			return;
		}
		if (loadedTemplate?.outputFormat === 'pdf') {
			goto(`/template-workspace/pdf/${$page.params.uid}`, { replaceState: true });
			return;
		} else if (loadedTemplate?.outputFormat === 'image' || loadedTemplate) {
			goto(`/template-workspace/image/${$page.params.uid}`, { replaceState: true });
			return;
		}

		// Fallback: show editor if redirect didn't happen
		isLoading = false;
	});
</script>

<div class="h-full w-full">
	{#if isLoading}
		<div class="mt-20">
			<Loader size="16" show={isLoading} />
		</div>
	{:else}
		<CreateTemplate isEdit={true} />
	{/if}
</div>
