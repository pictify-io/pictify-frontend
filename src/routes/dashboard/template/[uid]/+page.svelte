<script>
	/**
	 * /dashboard/template/[uid] — now a doorway to the studio.
	 *
	 * HTML templates open in the studio. Anything else (legacy fabric) has no
	 * studio to open, so it goes to the render page, which still handles them.
	 * Deciding here rather than always bouncing to the list means old links and
	 * bookmarks land on the template they name.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import backend from '../../../../service/backend';

	onMount(async () => {
		const uid = $page.params.uid;
		try {
			const res = await backend.get(`/templates/${uid}`);
			const engine = res?.template?.engine;
			if (!res?.template) {
				goto('/dashboard/template', { replaceState: true });
			} else if (engine === 'html') {
				goto(`/template-workspace/html/${uid}`, { replaceState: true });
			} else {
				goto(`/dashboard/template/${uid}/render?from=studio`, { replaceState: true });
			}
		} catch {
			goto('/dashboard/template', { replaceState: true });
		}
	});
</script>

<div class="flex h-full w-full items-center justify-center">
	<p class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-mute">Opening…</p>
</div>
