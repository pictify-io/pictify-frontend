<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import VideoTemplateEditor from '$lib/components/dashboard/VideoTemplateEditor.svelte';
	import { getVideoTemplate } from '../../../../api/videoTemplates';
	import { analytics } from '$lib/analytics.js';

	let template = null;
	let initialPreviewUrl = '';
	let isLoading = true;
	let loadError = '';

	$: uid = $page.params.uid;

	async function load() {
		isLoading = true;
		loadError = '';
		try {
			const response = await getVideoTemplate(uid);
			template = response?.template || null;
			if (!template) throw new Error('Video template not found.');
			// The AI generate flow stashes the first still here before routing.
			try {
				const key = `pictify:video-template-preview:${uid}`;
				initialPreviewUrl = sessionStorage.getItem(key) || '';
				sessionStorage.removeItem(key);
			} catch (error) {
				/* ignore */
			}
		} catch (error) {
			loadError = error?.message || 'Failed to load the video template.';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		analytics.page('Video Template Editor');
		load();
	});
</script>

<svelte:head>
	<title>{template?.name || 'Video template'} - Pictify.io</title>
</svelte:head>

{#if isLoading}
	<section class="min-h-full pb-12 pt-4">
		<div class="h-10 w-72 bg-gray-200 rounded animate-pulse mb-8" />
		<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
			{#each Array(2) as _}
				<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-md p-6">
					<div class="h-5 w-1/3 bg-gray-200 rounded animate-pulse mb-4" />
					<div class="h-64 bg-gray-100 rounded-xl animate-pulse" />
				</div>
			{/each}
		</div>
	</section>
{:else if loadError}
	<section class="min-h-full pb-12 pt-8">
		<div
			class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg p-8 text-center flex flex-col items-center"
		>
			<p class="text-sm font-black text-black uppercase tracking-wider mb-4">{loadError}</p>
			<div class="flex items-center gap-3">
				<button
					on:click={load}
					class="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide border-[3px] border-black hover:bg-gray-800 transition-colors"
				>
					Retry
				</button>
				<a
					href="/dashboard/video-templates"
					class="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide border-[3px] border-black hover:bg-gray-100 transition-colors"
				>
					Back to list
				</a>
			</div>
		</div>
	</section>
{:else}
	{#key template.uid}
		<VideoTemplateEditor {template} {initialPreviewUrl} />
	{/key}
{/if}
