<script>
	/**
	 * Video templates — one list, both authoring kinds.
	 *
	 * Every card leads somewhere real: Open goes to the editor that matches how
	 * the template was authored, Render goes to the fill-and-render page. The
	 * AI prompt that used to sit at the top of this page moved to /new, where
	 * it belongs alongside the other two ways to start.
	 */
	import { onMount } from 'svelte';
	import {
		getVideoTemplates,
		deleteVideoTemplate,
		duplicateVideoTemplate
	} from '../../../api/videoTemplates';
	import { analytics } from '$lib/analytics.js';

	let isLoading = true;
	let loadError = '';
	let templates = [];
	let deletingUid = '';
	let duplicatingUid = '';
	let actionError = '';

	async function loadTemplates() {
		isLoading = true;
		loadError = '';
		try {
			const response = await getVideoTemplates();
			templates = response?.templates || [];
		} catch (error) {
			loadError = error?.message || 'Failed to load your video templates.';
		} finally {
			isLoading = false;
		}
	}

	function durationLabel(template) {
		if (!template?.durationInFrames || !template?.fps) return '';
		const seconds = template.durationInFrames / template.fps;
		return `${Math.round(seconds * 10) / 10}s`;
	}

	// One editor for both kinds. The studio hosts a Remotion player and code pane
	// for kind: 'tsx', so there is no longer a second door to send anyone through.
	const editorPath = (template) => `/dashboard/video-templates/${template.uid}/studio`;

	async function remove(template) {
		if (deletingUid) return;
		if (
			!confirm(
				`Delete "${template.name || 'Untitled'}"?\n\nAnything rendering it through the API or a workflow will start failing. This can't be undone.`
			)
		) {
			return;
		}
		deletingUid = template.uid;
		actionError = '';
		try {
			await deleteVideoTemplate(template.uid);
			templates = templates.filter((t) => t.uid !== template.uid);
			analytics.track?.('Video Template Deleted', { uid: template.uid });
		} catch (error) {
			actionError = error?.message || 'Could not delete that template.';
		} finally {
			deletingUid = '';
		}
	}

	async function duplicate(template) {
		if (duplicatingUid) return;
		duplicatingUid = template.uid;
		actionError = '';
		try {
			const { template: copy } = await duplicateVideoTemplate(template.uid);
			// Insert next to the original rather than reloading the list: the copy
			// belongs beside the thing it came from, and a full refetch would jump
			// the page back to the top.
			const at = templates.findIndex((t) => t.uid === template.uid);
			templates = [...templates.slice(0, at + 1), copy, ...templates.slice(at + 1)];
			analytics.track?.('Video Template Duplicated', { from: template.uid, to: copy.uid });
		} catch (error) {
			actionError = error?.message || 'Could not duplicate that template.';
		} finally {
			duplicatingUid = '';
		}
	}

	onMount(() => {
		analytics.page('Video Templates');
		loadTemplates();
	});
</script>

<svelte:head>
	<title>Video templates - Pictify.io</title>
</svelte:head>

<section class="relative z-0 min-h-full pb-12">
	<div
		class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] opacity-70 [background-size:20px_20px]"
	></div>

	<!-- Header -->
	<div class="mb-8 flex flex-col gap-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1
				class="text-3xl font-black leading-[0.95] tracking-tighter text-black sm:text-4xl md:text-5xl lg:text-4xl"
			>
				Video templates.
			</h1>
			<p class="mt-2 max-w-lg text-sm font-bold text-gray-500">
				Build a video once with variables, then render it per row, per customer, per API call.
			</p>
		</div>
		<a
			href="/dashboard/video-templates/new"
			class="inline-flex items-center gap-2 self-start rounded-xl border-[3px] border-black bg-black px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-gray-800 sm:self-auto lg:py-2.5"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
			</svg>
			New video template
		</a>
	</div>

	{#if actionError}
		<div
			class="mb-6 flex items-center gap-3 rounded-xl border-[3px] border-brand-danger bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger"
			role="alert"
		>
			<span class="flex-1">{actionError}</span>
			<button on:click={() => (actionError = '')} class="text-xs font-black uppercase">
				Dismiss
			</button>
		</div>
	{/if}

	{#if isLoading}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(3) as _, i (i)}
				<div class="rounded-2xl border-[3px] border-black bg-white p-5 shadow-brutal-md">
					<div class="mb-4 h-32 animate-pulse rounded-xl bg-gray-100"></div>
					<div class="mb-3 h-5 w-2/3 animate-pulse rounded bg-gray-200"></div>
					<div class="h-4 w-1/2 animate-pulse rounded bg-gray-100"></div>
				</div>
			{/each}
		</div>
	{:else if loadError}
		<div
			class="flex flex-col items-center rounded-2xl border-[3px] border-black bg-white p-8 text-center shadow-brutal-lg"
		>
			<p class="mb-4 text-sm font-black uppercase tracking-wider text-black">{loadError}</p>
			<button
				on:click={loadTemplates}
				class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-black px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-gray-800 lg:px-5 lg:py-2.5 lg:text-xs"
			>
				Retry
			</button>
		</div>
	{:else if templates.length === 0}
		<!-- Empty state teaches the loop, not just "nothing here" -->
		<div
			class="flex flex-col items-center rounded-2xl border-[3px] border-dashed border-black bg-white p-10 text-center"
		>
			<div
				class="mb-4 flex h-14 w-14 rotate-3 items-center justify-center rounded-xl border-[3px] border-black bg-brand-accent shadow-brutal-sm"
			>
				<i class="fa fa-clapperboard text-xl text-black" aria-hidden="true"></i>
			</div>
			<p class="mb-2 text-lg font-black text-black">No video templates yet</p>
			<p class="mb-6 max-w-md text-sm font-bold text-gray-500">
				A video template is a scene with
				<code class="rounded border-[2px] border-black bg-gray-50 px-1 font-mono text-xs">
					{'{{'}variables{'}}'}
				</code>
				in it. Build it once in the studio, then render a personalised copy for every row of a CSV
				or every call to the API.
			</p>
			<a
				href="/dashboard/video-templates/new"
				class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-black px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
			>
				Build your first video
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M17 8l4 4m0 0l-4 4m4-4H3"
					/>
				</svg>
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each templates as template (template.uid)}
				<div
					class="flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-brutal-md transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-xl"
				>
					<!-- Poster. Without one, every card looked identical. -->
					<a
						href={editorPath(template)}
						class="relative block aspect-video overflow-hidden border-b-[3px] border-black bg-gray-950 focus-brutal"
						aria-label="Open {template.name || 'Untitled video template'}"
					>
						{#if template.posterUrl}
							<img
								src={template.posterUrl}
								alt=""
								loading="lazy"
								class="h-full w-full object-contain"
							/>
						{:else}
							<div class="flex h-full w-full items-center justify-center">
								<i class="fa fa-film text-2xl text-gray-700" aria-hidden="true"></i>
							</div>
						{/if}
						<span
							class="absolute left-2 top-2 rounded-full border-[2px] border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-widest
								{template.kind === 'tsx' ? 'bg-data-violet text-black' : 'bg-brand-accent text-black'}"
						>
							{template.kind === 'tsx' ? 'Code' : 'Studio'}
						</span>
					</a>

					<div class="flex flex-1 flex-col p-5">
						<div class="flex items-start justify-between gap-3">
							<h2 class="truncate text-base font-black text-black" title={template.name}>
								{template.name || 'Untitled video template'}
							</h2>
							<span
								class="flex-shrink-0 rounded-full border-[2px] border-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest
									{template.status === 'published'
									? 'bg-data-green text-black'
									: 'bg-gray-100 text-gray-700'}"
							>
								{template.status || 'draft'}
							</span>
						</div>

						<div class="mt-3 flex flex-wrap items-center gap-2">
							<span
								class="rounded-full border-[2px] border-black bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700"
							>
								{template.width}&times;{template.height}
							</span>
							{#if durationLabel(template)}
								<span
									class="rounded-full border-[2px] border-black bg-brand-accent/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-black"
								>
									{durationLabel(template)} @ {template.fps}fps
								</span>
							{/if}
							{#if template.variableDefinitions?.length}
								<span
									class="rounded-full border-[2px] border-black bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700"
									title={template.variableDefinitions.map((v) => v.name).join(', ')}
								>
									{template.variableDefinitions.length} var{template.variableDefinitions.length ===
									1
										? ''
										: 's'}
								</span>
							{/if}
						</div>

						<div class="mt-5 flex flex-wrap items-center gap-2 pt-1">
							<a
								href={editorPath(template)}
								class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
							>
								Edit
							</a>
							<a
								href="/dashboard/video-templates/{template.uid}/render"
								class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-brand-accent px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal-md"
							>
								Render
							</a>
							<button
								on:click={() => duplicate(template)}
								disabled={duplicatingUid === template.uid}
								aria-label="Duplicate {template.name || 'this template'}"
								title="Make a copy"
								class="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-black bg-white text-gray-500 transition-all hover:bg-brand-accent hover:text-black disabled:opacity-50 focus-brutal"
							>
								{#if duplicatingUid === template.uid}
									<i class="fa fa-spinner fa-spin text-[10px]" aria-hidden="true"></i>
								{:else}
									<i class="fa fa-clone text-[10px]" aria-hidden="true"></i>
								{/if}
							</button>
							<button
								on:click={() => remove(template)}
								disabled={deletingUid === template.uid}
								aria-label="Delete {template.name || 'this template'}"
								class="inline-flex h-8 w-8 items-center justify-center rounded-lg border-[2px] border-black bg-white text-gray-500 transition-all hover:bg-brand-danger hover:text-white disabled:opacity-50 focus-brutal"
							>
								{#if deletingUid === template.uid}
									<i class="fa fa-spinner fa-spin text-[10px]" aria-hidden="true"></i>
								{:else}
									<i class="fa fa-trash text-[10px]" aria-hidden="true"></i>
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
