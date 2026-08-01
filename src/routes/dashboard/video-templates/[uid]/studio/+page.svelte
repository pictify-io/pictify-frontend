<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import VideoStudio from '$lib/components/video/VideoStudio.svelte';
	import { getVideoTemplate } from '../../../../../api/videoTemplates';

	let template = null;
	let isLoading = true;
	let loadError = '';

	$: uid = $page.params.uid;

	async function load() {
		isLoading = true;
		loadError = '';
		try {
			const response = await getVideoTemplate(uid);
			template = response?.template || null;
			if (!template) throw new Error('This video template no longer exists.');
			// Both kinds open here. This used to bounce kind: 'tsx' to /code, which
			// is what sent every AI- and MCP-generated template out of the studio and
			// kept it out. /code now redirects back here, so the bounce would also
			// be an infinite loop.
		} catch (error) {
			loadError = error?.message || 'Failed to open this video template.';
		} finally {
			isLoading = false;
		}
	}

	onMount(load);
</script>

{#if isLoading}
	<div class="flex h-screen flex-col items-center justify-center gap-3 bg-gray-950">
		<div
			class="h-10 w-10 animate-pulse rounded-xl border-[3px] border-black bg-brand-accent shadow-brutal-sm"
		></div>
		<p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Opening your video</p>
	</div>
{:else if loadError}
	<div class="flex h-screen items-center justify-center bg-gray-950 p-6">
		<div
			class="w-full max-w-md rounded-2xl border-[3px] border-black bg-gray-900 p-6 text-center shadow-brutal-lg"
		>
			<p class="text-xs font-black uppercase tracking-widest text-brand-danger">{loadError}</p>
			<div class="mt-5 flex items-center justify-center gap-2">
				<button
					on:click={load}
					class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-brand-accent px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal-md focus-brutal"
				>
					Try again
				</button>
				<a
					href="/dashboard/template?type=video"
					class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-gray-800 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-100 transition-all hover:bg-gray-700 focus-brutal"
				>
					Back to templates
				</a>
			</div>
		</div>
	</div>
{:else if template}
	{#key template.uid}
		<VideoStudio {template} />
	{/key}
{/if}
