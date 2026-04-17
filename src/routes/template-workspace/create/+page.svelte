<script>
	import CreateTemplate from '$lib/components/dashboard/template/CreateTemplate.svelte';
	import TemplateTypeSelector from '$lib/components/editor/TemplateTypeSelector.svelte';
	import EnginePicker from '$lib/components/editor/html/EnginePicker.svelte';
	import { pageActions } from '../../../store/pages.store';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let showSelector = true;
	let selectedConfig = null;
	// Stage 1: engine picker. Stage 2: fabric format selector (only for canvas).
	let stage = 'engine';

	// Check if coming from a draft (tools workflow)
	onMount(() => {
		try {
			const draftKey = 'pictify_template_draft_v1';
			const raw = localStorage.getItem(draftKey);
			if (raw) {
				const draft = JSON.parse(raw);
				// If draft exists, skip selector and go directly to editor
				if (draft && (draft.fabricJSData || draft.backgroundImageUrl)) {
					// Tools workflow drafts use backgroundImageUrl — always image type
					const format = draft.outputFormat || 'image';
					if (format === 'pdf') {
						goto('/template-workspace/pdf/create');
					} else {
						goto('/template-workspace/image/create');
					}
					return;
				}
			}
		} catch (e) {
			/* ignored */
		}
	});

	function handleEngineSelect(event) {
		if (event.detail.engine === 'html') {
			goto('/template-workspace/html/create?engine=html');
		} else {
			// Fabric — fall through to the legacy format selector.
			stage = 'format';
		}
	}

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
	{#if stage === 'engine'}
		<EnginePicker on:select={handleEngineSelect} />
	{:else if showSelector && stage === 'format'}
		<TemplateTypeSelector on:select={handleFormatSelect} />
	{/if}

	{#if !showSelector}
		<CreateTemplate initialConfig={selectedConfig} />
	{/if}
</div>
