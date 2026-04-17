<script>
	/**
	 * /template-workspace/html/create
	 *
	 * Two states:
	 *   - If ?engine=html in the query, the user just came from the engine
	 *     picker — skip the picker and show the fresh editor.
	 *   - Otherwise, show the EnginePicker first.
	 *
	 * On save: POST to /template with engine='html', then redirect to
	 * /template-workspace/html/[uid] for the edit view.
	 */
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import EnginePicker from '$lib/components/editor/html/EnginePicker.svelte';
	import HtmlEditorLayout from '$lib/components/editor/html/HtmlEditorLayout.svelte';
	import backend from '../../../../service/backend';
	import { toast } from '../../../../store/toast.store';
	import Toast from '$lib/components/Toast.svelte';

	$: engineParam = $page.url.searchParams.get('engine');
	$: showPicker = engineParam !== 'html';

	let isSaving = false;
	let template = {
		uid: null,
		name: 'Untitled HTML template',
		engine: 'html',
		html: '',
		variableDefinitions: [],
		jsEnabled: false,
		strictVariables: false,
		width: 1080,
		height: 1080,
		outputFormat: 'image',
		pdfPreset: 'A4'
	};

	async function handleSave(event) {
		isSaving = true;
		try {
			const res = await backend.post('/template', {
				...event.detail.template,
				engine: 'html'
			});
			if (res && res.template && res.template.uid) {
				if (res.addedVariables && res.addedVariables.length > 0) {
					toast.set({
						message: `Auto-added ${res.addedVariables.length} variable(s)`,
						type: 'success',
						duration: 3000
					});
				} else {
					toast.set({
						message: 'Template saved',
						type: 'success',
						duration: 2000
					});
				}
				goto(`/template-workspace/html/${res.template.uid}`);
			}
		} catch (err) {
			toast.set({
				message: err?.message || 'Save failed',
				type: 'error',
				duration: 4000
			});
		} finally {
			isSaving = false;
		}
	}
</script>

<Toast />

{#if showPicker}
	<EnginePicker />
{:else}
	<HtmlEditorLayout
		bind:template
		{isSaving}
		on:save={handleSave}
	/>
{/if}
