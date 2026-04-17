<script>
	/**
	 * /template-workspace/html/[uid]
	 *
	 * Edit view for an existing engine='html' template. Fetches on mount,
	 * hydrates the layout, persists via PUT /template/:uid on save.
	 *
	 * If the server reports the template is NOT engine='html' (e.g. user
	 * pasted a fabric template URL by mistake), we redirect them to the
	 * fabric editor — one more friendly guardrail than showing a broken UI.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import HtmlEditorLayout from '$lib/components/editor/html/HtmlEditorLayout.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import backend from '../../../../service/backend';
	import { toast } from '../../../../store/toast.store';

	$: uid = $page.params.uid;

	let template = null;
	let isSaving = false;
	let loadError = null;

	onMount(async () => {
		try {
			const res = await backend.get(`/template/${uid}`);
			if (!res || !res.template) {
				loadError = 'Template not found';
				return;
			}
			const t = res.template;
			if (t.engine !== 'html') {
				// Fabric template served at the HTML URL — redirect.
				goto(`/template-workspace/image/${uid}`);
				return;
			}
			template = {
				uid: t.uid,
				name: t.name || 'Untitled',
				engine: 'html',
				html: t.html || '',
				variableDefinitions: t.variableDefinitions || [],
				jsEnabled: !!t.jsEnabled,
				strictVariables: !!t.strictVariables,
				width: t.width || 1080,
				height: t.height || 1080,
				outputFormat: t.outputFormat || 'image',
				pdfPreset: t.pdfPreset || 'A4'
			};
		} catch (err) {
			loadError = err?.message || 'Failed to load template';
		}
	});

	async function handleSave(event) {
		isSaving = true;
		try {
			const { template: t } = event.detail;
			const res = await backend.put(`/template/${uid}`, {
				// Never send engine on update — it's immutable server-side
				html: t.html,
				name: t.name,
				variableDefinitions: t.variableDefinitions,
				jsEnabled: t.jsEnabled,
				strictVariables: t.strictVariables,
				width: t.width,
				height: t.height,
				outputFormat: t.outputFormat,
				pdfPreset: t.pdfPreset,
				// `variables` is required by the legacy schema; backfill from definitions
				variables: (t.variableDefinitions || []).map((v) => v && v.name).filter(Boolean)
			});
			if (res && res.template) {
				template = { ...template, ...res.template };
				if (res.addedVariables && res.addedVariables.length > 0) {
					toast.set({
						message: `Auto-added ${res.addedVariables.length} variable(s)`,
						type: 'success',
						duration: 3000
					});
				} else {
					toast.set({ message: 'Saved', type: 'success', duration: 1500 });
				}
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

{#if loadError}
	<div class="flex h-screen items-center justify-center bg-brand-bg p-6">
		<div class="max-w-md border-3 border-gray-800 bg-white p-6 shadow-brutal-md">
			<h2 class="font-heading text-2xl">Couldn't load this template</h2>
			<p class="mt-2 font-mono text-sm text-brand-danger">{loadError}</p>
			<a
				href="/dashboard/template"
				class="mt-4 inline-block border-2 border-gray-800 bg-brand-accent px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm"
			>← Back to templates</a>
		</div>
	</div>
{:else if template}
	<HtmlEditorLayout {template} {isSaving} on:save={handleSave} />
{:else}
	<div class="flex h-screen items-center justify-center bg-brand-bg">
		<p class="font-mono text-sm text-gray-500">· Loading template…</p>
	</div>
{/if}
