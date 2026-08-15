<script>
	/**
	 * /template-workspace/html/[uid] — the template studio.
	 *
	 * Route kept from the old workspace because it already sits outside the
	 * dashboard rail layout, which the studio needs: this is a full-bleed
	 * three-zone surface, not a page inside a shell.
	 *
	 * Legacy fabric templates cannot be edited here — the studio is HTML-only —
	 * so they continue to the render page, which still handles them.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import TemplateStudio from '$lib/components/studio/TemplateStudio.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import backend from '../../../../service/backend';

	$: uid = $page.params.uid;
	$: preview = $page.url.searchParams.get('preview');
	$: initialMode = $page.url.searchParams.get('mode') === 'html' ? 'html' : 'say';

	let template = null;
	let loadError = null;

	onMount(async () => {
		try {
			const res = await backend.get(`/templates/${uid}`);
			const t = res?.template;
			if (!t) {
				loadError = 'Template not found';
				return;
			}
			if (t.engine !== 'html') {
				// `?from=studio` stops the render page bouncing it straight back.
				goto(`/dashboard/template/${uid}/render?from=studio`, { replaceState: true });
				return;
			}
			template = t;
		} catch (err) {
			loadError = err?.message || 'Failed to load template';
		}
	});
</script>

<svelte:head>
	<title>{template?.name ? `${template.name} | Pictify.io` : 'Template studio | Pictify.io'}</title>
</svelte:head>

{#if loadError}
	<div class="flex h-screen flex-col items-center justify-center gap-3 bg-brand-paper px-6 text-center">
		<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">Template</span>
		<p class="font-display text-xl font-extrabold tracking-[-0.02em] text-brand-ink">{loadError}</p>
		<a
			href="/dashboard/template"
			class="rounded-btn bg-brand-ink px-4 py-2 font-sans text-[13px] font-bold text-white hover:opacity-90"
		>
			Back to templates
		</a>
	</div>
{:else if template}
	<TemplateStudio {template} {initialMode} {preview} />
{:else}
	<div class="flex h-screen items-center justify-center bg-brand-paper">
		<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-mute">Opening studio…</span>
	</div>
{/if}

<Toast />
