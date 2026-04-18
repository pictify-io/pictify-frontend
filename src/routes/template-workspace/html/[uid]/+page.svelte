<script>
	/**
	 * /template-workspace/html/[uid]
	 *
	 * Edit view for an existing engine='html' template. Fetches on mount,
	 * hydrates the layout, persists via PUT /templates/:uid on save.
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
			const res = await backend.get(`/templates/${uid}`);
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
			const res = await backend.put(`/templates/${uid}`, {
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
			const status = err?.status || 0;
			let message = err?.message || 'Save failed';
			if (status === 404) {
				message =
					'Backend route not found — restart the API server to pick up engine=html routes.';
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

{#if loadError}
	<div class="flex h-screen items-center justify-center bg-[#FFFDF8] p-6">
		<div class="max-w-md rounded-2xl border-[3px] border-gray-900 bg-white p-8 shadow-[8px_8px_0_0_#1f2937]">
			<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-[3px] border-gray-900 bg-[#ff6b6b] shadow-[3px_3px_0_0_#1f2937]">
				<i class="fa fa-triangle-exclamation text-white"></i>
			</div>
			<h2 class="text-xl font-black uppercase tracking-widest text-gray-900">
				Couldn't load template
			</h2>
			<p class="mt-2 font-mono text-xs text-gray-600">{loadError}</p>
			<a
				href="/dashboard/template"
				class="mt-5 inline-flex items-center gap-2 rounded-xl border-[3px] border-gray-900 bg-[#ffc480] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
			>
				<i class="fa fa-arrow-left text-[10px]"></i>
				Back to templates
			</a>
		</div>
	</div>
{:else if template}
	<HtmlEditorLayout {template} {isSaving} on:save={handleSave} />
{:else}
	<div class="flex h-screen items-center justify-center bg-[#FFFDF8]">
		<div class="flex flex-col items-center gap-3 text-gray-700">
			<div class="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl border-[3px] border-gray-900 bg-[#ffc480] shadow-[3px_3px_0_0_#1f2937]">
				<i class="fa fa-hourglass-half"></i>
			</div>
			<p class="text-[11px] font-black uppercase tracking-widest">Loading template…</p>
		</div>
	</div>
{/if}
