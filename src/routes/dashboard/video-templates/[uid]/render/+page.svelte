<script>
	/**
	 * Render a video template with real values.
	 *
	 * This is the step that made the loop a loop. Before it, a video could be
	 * authored but only ever rendered with whatever values happened to be in
	 * the editor. Now: fill the declared variables, render one, and copy the
	 * API call that does the same thing from anywhere.
	 *
	 * Mirrors /dashboard/template/[uid]/render on the image side.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getVideoTemplate, renderVideoTemplate } from '../../../../../api/videoTemplates';
	import { analytics } from '$lib/analytics.js';
	import { sampleAll } from '$lib/utils/sample-variable-generator';
	import { humanizeName, missingRequired, MEDIA_TYPES } from '$lib/video/variables.js';

	let template = null;
	let isLoading = true;
	let loadError = '';

	let values = {};
	let isRendering = false;
	let renderError = '';
	let renderUrl = '';
	let elapsed = 0;
	let timer = null;
	let copied = '';

	$: uid = $page.params.uid;
	$: definitions = template?.variableDefinitions || [];
	$: editorPath = template?.kind === 'tsx' ? 'code' : 'studio';
	$: missing = missingRequired(definitions, values);
	// Not required, but empty and with no default: the token stays literal in
	// the render. Worth saying out loud — it looks like a bug in the output.
	$: blank = definitions
		.filter((d) => !d.validation?.required)
		.filter((d) => {
			const value = values[d.name];
			return (value === undefined || value === null || value === '') && !d.defaultValue;
		})
		.map((d) => d.name);

	async function load() {
		isLoading = true;
		loadError = '';
		try {
			const response = await getVideoTemplate(uid);
			template = response?.template || null;
			if (!template) throw new Error('This video template no longer exists.');
			// Seed from the declared defaults so the form is renderable on arrival.
			values = Object.fromEntries(
				(template.variableDefinitions || []).map((v) => [v.name, v.defaultValue ?? ''])
			);
		} catch (error) {
			loadError = error?.message || 'Failed to load the video template.';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		analytics.page('Video Template Render');
		load();
	});

	async function fillSample() {
		values = { ...values, ...(await sampleAll(definitions)) };
	}

	async function render() {
		if (isRendering) return;
		renderError = '';
		renderUrl = '';
		if (missing.length) {
			renderError = `Fill in ${missing.map((n) => `"${n}"`).join(', ')} first.`;
			return;
		}
		isRendering = true;
		elapsed = 0;
		timer = setInterval(() => (elapsed += 1), 1000);
		try {
			const response = await renderVideoTemplate(uid, { variables: values });
			renderUrl = response?.url || '';
			if (!renderUrl) throw new Error('The render finished but returned no URL.');
			analytics.track?.('Video Template Rendered', { uid, via: 'render_page' });
		} catch (error) {
			if (error?.data?.code === 'render_bridge_not_installed') {
				renderError =
					'Server rendering is not enabled on this server yet. Open the studio and use Render MP4 — it renders in your browser.';
			} else {
				renderError = error?.message || 'The render failed. Please try again.';
			}
		} finally {
			clearInterval(timer);
			timer = null;
			isRendering = false;
		}
	}

	function copy(text, label) {
		navigator.clipboard?.writeText(text);
		copied = label;
		setTimeout(() => (copied = ''), 1800);
	}

	$: apiSnippet = `curl -X POST https://api.pictify.io/video/templates/${uid}/render \\
  -H "Authorization: Bearer $PICTIFY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ variables: values }, null, 2).split('\n').join('\n  ')}'`;

	const INPUT_CLASS =
		'w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-bold text-black transition-all focus:outline-none focus:shadow-brutal-md focus-brutal';
</script>

<svelte:head>
	<title>Render {template?.name || 'video template'} - Pictify.io</title>
</svelte:head>

<section class="relative z-0 min-h-full pb-12">
	<div
		class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] opacity-70 [background-size:20px_20px]"
	></div>

	{#if isLoading}
		<div class="pt-4">
			<div class="mb-8 h-10 w-72 animate-pulse rounded bg-gray-200"></div>
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{#each [0, 1] as skeleton (skeleton)}
					<div class="rounded-2xl border-[3px] border-black bg-white p-6 shadow-brutal-md">
						<div class="mb-4 h-5 w-1/3 animate-pulse rounded bg-gray-200"></div>
						<div class="h-48 animate-pulse rounded-xl bg-gray-100"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else if loadError}
		<div class="pt-8">
			<div
				class="flex flex-col items-center rounded-2xl border-[3px] border-black bg-white p-8 text-center shadow-brutal-lg"
			>
				<p class="mb-4 text-sm font-black uppercase tracking-wider text-black">{loadError}</p>
				<a
					href="/dashboard/template?type=video"
					class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-black px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
				>
					Back to video templates
				</a>
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-8 pt-4">
			<a
				href="/dashboard/template?type=video"
				class="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 transition-colors hover:text-black"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M7 16l-4-4m0 0l4-4m-4 4h18"
					/>
				</svg>
				Video Templates
			</a>
			<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1
						class="text-3xl font-black leading-[0.95] tracking-tighter text-black sm:text-4xl md:text-5xl lg:text-4xl"
					>
						Render {template.name}.
					</h1>
					<div class="mt-3 flex flex-wrap items-center gap-2">
						<span
							class="rounded-full border-[2px] border-black bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700"
						>
							{template.width}&times;{template.height}
						</span>
						<span
							class="rounded-full border-[2px] border-black bg-brand-accent/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-black"
						>
							{(template.durationInFrames / Math.max(1, template.fps)).toFixed(1)}s @ {template.fps}fps
						</span>
						<span
							class="rounded-full border-[2px] border-black bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700"
						>
							{definitions.length} variable{definitions.length === 1 ? '' : 's'}
						</span>
					</div>
				</div>
				<a
					href="/dashboard/video-templates/{uid}/{editorPath}"
					class="inline-flex items-center gap-2 self-start rounded-xl border-[3px] border-black bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal-md sm:self-auto"
				>
					Edit template
				</a>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Values -->
			<div class="rounded-2xl border-[3px] border-black bg-white p-6 shadow-brutal-2xl">
				<div class="mb-5 flex items-center justify-between gap-3">
					<h2 class="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-black">
						<span class="h-3 w-3 rounded-sm border-[2px] border-black bg-brand-accent"></span>
						Values
					</h2>
					{#if definitions.length > 0}
						<button
							on:click={fillSample}
							class="inline-flex items-center gap-1.5 rounded-lg border-[2px] border-black bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-black shadow-brutal-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
						>
							<i class="fa fa-dice text-[10px]" aria-hidden="true"></i>
							Sample data
						</button>
					{/if}
				</div>

				{#if definitions.length === 0}
					<div class="rounded-xl border-[3px] border-dashed border-black p-8 text-center">
						<p class="text-sm font-black text-black">This template has no variables</p>
						<p class="mx-auto mt-2 max-w-sm text-xs font-bold text-gray-500">
							Every render will be identical. Open the editor and add a
							<code class="font-mono">{'{{'}variable{'}}'}</code> to make it reusable.
						</p>
						<a
							href="/dashboard/video-templates/{uid}/{editorPath}"
							class="mt-4 inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
						>
							Add variables
						</a>
					</div>
				{:else}
					<div class="space-y-4">
						{#each definitions as field (field.name)}
							<div>
								<label
									for={'v-' + field.name}
									class="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black"
								>
									{humanizeName(field.name)}
									{#if field.validation?.required}
										<span class="text-brand-danger" title="Required">*</span>
									{/if}
									<span class="font-mono text-[10px] font-bold normal-case text-gray-400">
										{field.name}
									</span>
								</label>
								{#if field.type === 'color'}
									<div class="flex gap-2">
										<input
											id={'v-' + field.name}
											type="color"
											bind:value={values[field.name]}
											class="h-12 w-12 flex-shrink-0 cursor-pointer rounded-xl border-[3px] border-black bg-white p-1"
										/>
										<input
											type="text"
											aria-label="{field.name} hex value"
											bind:value={values[field.name]}
											class="{INPUT_CLASS} min-w-0 flex-1 font-mono"
										/>
									</div>
								{:else if field.type === 'number'}
									<input
										id={'v-' + field.name}
										type="number"
										bind:value={values[field.name]}
										class={INPUT_CLASS}
									/>
								{:else if MEDIA_TYPES.has(field.type)}
									<input
										id={'v-' + field.name}
										type="url"
										bind:value={values[field.name]}
										placeholder="https://…"
										class="{INPUT_CLASS} font-mono text-xs"
									/>
									<p class="mt-1 text-[10px] font-bold text-gray-400">
										A public https:// URL. Private and local addresses are rejected.
									</p>
								{:else}
									<input
										id={'v-' + field.name}
										type="text"
										bind:value={values[field.name]}
										placeholder={field.defaultValue || humanizeName(field.name)}
										class={INPUT_CLASS}
									/>
								{/if}
								{#if field.description}
									<p class="mt-1 text-[11px] font-bold text-gray-500">{field.description}</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				<div class="mt-6 flex items-center gap-3 border-t-[3px] border-black pt-5">
					<button
						on:click={render}
						disabled={isRendering || missing.length > 0}
						class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-brand-accent px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
					>
						{#if isRendering}
							<i class="fa fa-spinner fa-spin text-[10px]" aria-hidden="true"></i>
							Rendering… {elapsed}s
						{:else}
							<i class="fa fa-film text-[10px]" aria-hidden="true"></i>
							Render MP4
						{/if}
					</button>
					{#if missing.length}
						<p class="text-[11px] font-bold text-brand-danger">
							{missing.map((n) => `"${n}"`).join(', ')} required
						</p>
					{:else if blank.length}
						<p class="text-[11px] font-bold text-gray-500">
							{blank.map((n) => `"${n}"`).join(', ')}
							{blank.length === 1 ? 'is' : 'are'} empty — the video will show the raw
							<code class="font-mono">{'{{'}token{'}}'}</code>.
						</p>
					{:else if isRendering}
						<p class="text-[11px] font-bold text-gray-500">Video renders can take a few minutes.</p>
					{/if}
				</div>

				{#if renderError}
					<div
						class="mt-4 rounded-xl border-[3px] border-brand-danger bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger"
						role="alert"
					>
						{renderError}
					</div>
				{/if}
			</div>

			<!-- Result + API -->
			<div class="space-y-6">
				<div class="rounded-2xl border-[3px] border-black bg-white p-6 shadow-brutal-2xl">
					<h2
						class="mb-4 flex items-center gap-3 text-sm font-black uppercase tracking-widest text-black"
					>
						<span class="h-3 w-3 rounded-sm border-[2px] border-black bg-data-green"></span>
						Result
					</h2>
					{#if renderUrl}
						<!-- svelte-ignore a11y-media-has-caption -->
						<video
							controls
							src={renderUrl}
							class="max-h-[420px] w-full rounded-xl border-[3px] border-black bg-black"
						></video>
						<div class="mt-4 flex flex-wrap items-center gap-2">
							<a
								href={renderUrl}
								download
								class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
							>
								<i class="fa fa-download text-[10px]" aria-hidden="true"></i>
								Download
							</a>
							<button
								on:click={() => copy(renderUrl, 'url')}
								class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black shadow-brutal-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
							>
								<i class="fa fa-link text-[10px]" aria-hidden="true"></i>
								{copied === 'url' ? 'Copied' : 'Copy URL'}
							</button>
						</div>
					{:else}
						<div
							class="rounded-xl border-[3px] border-dashed border-black p-10 text-center"
							aria-live="polite"
						>
							<p class="text-sm font-black text-black">Nothing rendered yet</p>
							<p class="mx-auto mt-2 max-w-xs text-xs font-bold text-gray-500">
								Fill the values and hit Render. The video appears here with a permanent URL.
							</p>
						</div>
					{/if}
				</div>

				<!-- The point of the whole loop: the same render, from anywhere. -->
				<div class="rounded-2xl border-[3px] border-black bg-white p-6 shadow-brutal-2xl">
					<div class="mb-4 flex items-center justify-between gap-3">
						<h2
							class="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-black"
						>
							<span class="h-3 w-3 rounded-sm border-[2px] border-black bg-data-violet"></span>
							Render from your code
						</h2>
						<button
							on:click={() => copy(apiSnippet, 'api')}
							class="inline-flex items-center gap-1.5 rounded-lg border-[2px] border-black bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-black shadow-brutal-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
						>
							{copied === 'api' ? 'Copied' : 'Copy'}
						</button>
					</div>
					<pre
						class="ov-scroll overflow-x-auto rounded-xl border-[3px] border-black bg-gray-950 p-4 font-mono text-[11px] leading-relaxed text-gray-100">{apiSnippet}</pre>
					<p class="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
						Same endpoint the bulk workflow uses.
						<a href="/dashboard/api-token" class="text-black underline hover:text-brand-danger">
							Get an API key
						</a>
					</p>
				</div>
			</div>
		</div>
	{/if}
</section>
