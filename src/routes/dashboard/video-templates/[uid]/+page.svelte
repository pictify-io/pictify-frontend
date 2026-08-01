<script>
	/**
	 * Router. A video template's uid is one address; how you edit it depends on
	 * how it was authored. Fetch the template, then hand off:
	 *
	 *   kind 'timeline' → /studio  (the visual editor, the default)
	 *   kind 'tsx'      → /code    (Code mode, advanced)
	 *
	 * Redirecting here rather than in a `+page.js` load keeps the request on the
	 * client, where the session cookie and the shared store already live.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getVideoTemplate } from '../../../../api/videoTemplates';
	import { analytics } from '$lib/analytics.js';

	let loadError = '';

	onMount(async () => {
		const { uid } = $page.params;
		try {
			const response = await getVideoTemplate(uid);
			const template = response?.template;
			if (!template) throw new Error('This video template no longer exists.');
			analytics.page('Video Template Open');
			const destination = template.kind === 'tsx' ? 'code' : 'studio';
			await goto(`/dashboard/video-templates/${uid}/${destination}`, { replaceState: true });
		} catch (error) {
			loadError = error?.message || 'Failed to open this video template.';
		}
	});
</script>

<svelte:head>
	<title>Opening video template - Pictify.io</title>
</svelte:head>

<section class="min-h-full pb-12 pt-8">
	{#if loadError}
		<div
			class="mx-auto max-w-md rounded-2xl border-[3px] border-black bg-white p-8 text-center shadow-brutal-lg"
		>
			<p class="text-sm font-black uppercase tracking-wider text-black">{loadError}</p>
			<a
				href="/dashboard/template?type=video"
				class="mt-5 inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-black px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
			>
				Back to video templates
			</a>
		</div>
	{:else}
		<div class="mx-auto max-w-md text-center">
			<div
				class="mx-auto h-10 w-10 animate-pulse rounded-xl border-[3px] border-black bg-brand-accent shadow-brutal-sm"
			></div>
			<p class="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
				Opening your template
			</p>
		</div>
	{/if}
</section>
