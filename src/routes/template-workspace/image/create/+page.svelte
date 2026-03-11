<script>
	import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { pageActions } from '../../../../store/pages.store';

	let initialConfig = {
		outputFormat: 'image',
		pdfPreset: null,
		width: 1080,
		height: 1080
	};

	// Check for Figma import query param (from Figma plugin redirect)
	$: figmaImportId = $page.url.searchParams.get('figmaImport') || null;

	onMount(() => {
		pageActions.setOutputFormat('image');
	});
</script>

<CreateTemplate {initialConfig} templateType="image" {figmaImportId} />
