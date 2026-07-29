<script>
	/**
	 * Code mode — the Remotion TSX editor.
	 *
	 * The advanced door, not the front one. Most people author video in the
	 * timeline studio; this exists for scenes that need real code, and it is
	 * where AI-generated templates land.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import VideoTemplateEditor from '$lib/components/dashboard/VideoTemplateEditor.svelte';
	import { getVideoTemplate } from '../../../../../api/videoTemplates';
	import { analytics } from '$lib/analytics.js';

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
			if (template.kind === 'timeline') {
				// Wrong door — timeline templates have no scene source.
				window.location.replace(`/dashboard/video-templates/${uid}/studio`);
				return;
			}
			// The AI generate flow used to stash a server still here before
			// routing; the live player compiles the TSX directly now.
			try {
				sessionStorage.removeItem(`pictify:video-template-preview:${uid}`);
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
		analytics.page('Video Template Code Editor');
		load();
	});
</script>

<svelte:head>
	<title>{template?.name || 'Video template'} - Pictify.io</title>
</svelte:head>

{#if isLoading}
	<section class="min-h-full pb-12 pt-4">
		<div class="mb-8 h-10 w-72 animate-pulse rounded bg-gray-200"></div>
		<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
			{#each [0, 1] as skeleton (skeleton)}
				<div class="rounded-2xl border-[3px] border-black bg-white p-6 shadow-brutal-md">
					<div class="mb-4 h-5 w-1/3 animate-pulse rounded bg-gray-200"></div>
					<div class="h-64 animate-pulse rounded-xl bg-gray-100"></div>
				</div>
			{/each}
		</div>
	</section>
{:else if loadError}
	<section class="min-h-full pb-12 pt-8">
		<div
			class="flex flex-col items-center rounded-2xl border-[3px] border-black bg-white p-8 text-center shadow-brutal-lg"
		>
			<p class="mb-4 text-sm font-black uppercase tracking-wider text-black">{loadError}</p>
			<div class="flex items-center gap-3">
				<button
					on:click={load}
					class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-black px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white transition-colors hover:bg-gray-800"
				>
					Retry
				</button>
				<a
					href="/dashboard/video-templates"
					class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wide text-black transition-colors hover:bg-gray-100"
				>
					Back to list
				</a>
			</div>
		</div>
	</section>
{:else if template}
	{#key template.uid}
		<VideoTemplateEditor {template} />
	{/key}
{/if}
