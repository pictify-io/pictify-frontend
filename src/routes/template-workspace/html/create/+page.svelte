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
			// Strip fields the create route doesn't expect (uid is server-generated;
			// engine is re-applied explicitly to avoid client drift).
			const { uid: _ignore, ...rest } = event.detail.template;
			const res = await backend.post('/template', {
				...rest,
				engine: 'html',
				// Legacy schema requires `variables` (array of names). Populate from
				// variableDefinitions so we don't rely on the backend's regex extractor
				// which also picks up block helpers (#if / #each / /if / /each).
				variables: (rest.variableDefinitions || [])
					.map((v) => v && v.name)
					.filter(Boolean)
			});
			if (res && res.template && res.template.uid) {
				if (res.addedVariables && res.addedVariables.length > 0) {
					toast.set({
						message: `Saved · auto-added ${res.addedVariables.length} variable(s)`,
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
			// HTTP errors from backend.post surface as HttpError with .status + .message.
			// Give the user an actionable hint when the route isn't wired (most
			// common cause is a stale dev server that hasn't been restarted to pick
			// up the Phase 3 routes).
			const status = err?.status || 0;
			let message = err?.message || 'Save failed';
			if (status === 404) {
				message = 'Backend route not found — restart the API server to pick up engine=html routes.';
			} else if (status === 401 || status === 403) {
				message = 'Auth required — sign in to the dashboard first.';
			}
			toast.set({ message, type: 'error', duration: 5000 });
			console.error('[html-editor] save failed:', err);
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
