<script>
	import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
	import TemplateTypeSelector from '$lib/components/editor/TemplateTypeSelector.svelte';
	import { pageActions } from '../../../store/pages.store';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	let showSelector = true;
	let selectedConfig = null;
	
	// Check if coming from a draft (tools workflow)
	onMount(() => {
		try {
			const draftKey = 'pictify_template_draft_v1';
			const raw = localStorage.getItem(draftKey);
			if (raw) {
				const draft = JSON.parse(raw);
				// If draft exists, skip selector and go directly to editor
				if (draft && draft.fabricJSData) {
					showSelector = false;
					selectedConfig = {
						outputFormat: draft.outputFormat || 'image',
						pdfPreset: draft.pdfPreset || 'A4',
						width: draft.width || 1080,
						height: draft.height || 1080
					};
					pageActions.setOutputFormat(selectedConfig.outputFormat);
					pageActions.setPdfPreset(selectedConfig.pdfPreset);
				}
			}
		} catch (e) {
			console.log('No draft to load');
		}
	});
	
	function handleFormatSelect(event) {
		selectedConfig = event.detail;
		
		const format = selectedConfig.outputFormat;
		
		if (format === 'pdf') {
			// Save config to local storage or store if needed, but for now defaults are fine
            // or pass as query params if complex config is needed.
            // For now, straightforward redirect.
			goto('/template-workspace/pdf/create');
		} else {
			goto('/template-workspace/image/create');
		}
	}
</script>

<div class="h-full w-full">
	{#if showSelector}
		<TemplateTypeSelector on:select={handleFormatSelect} />
	{/if}
	
	{#if !showSelector}
		<CreateTemplate initialConfig={selectedConfig} />
	{/if}
</div>
