<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getVideoTemplates, generateVideoTemplate } from '../../../api/videoTemplates';
	import { analytics } from '$lib/analytics.js';

	let isLoading = true;
	let loadError = '';
	let templates = [];

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

	// ── AI generation ────────────────────────────────────────────────────
	const PRESETS = [
		{ label: '9:16', width: 1080, height: 1920 },
		{ label: '1:1', width: 1080, height: 1080 },
		{ label: '16:9', width: 1920, height: 1080 }
	];

	let prompt = '';
	let brandColor = '#FACC15';
	let preset = PRESETS[0];
	let genDuration = 6;
	let generating = false;
	let genError = '';

	async function generate() {
		if (generating) return;
		genError = '';
		if (!prompt.trim()) {
			genError = 'Describe the video you want first.';
			return;
		}
		const durationSeconds = Math.round(Number(genDuration));
		if (!durationSeconds || durationSeconds < 1) {
			genError = 'Enter a valid duration in seconds.';
			return;
		}
		generating = true;
		try {
			const response = await generateVideoTemplate({
				prompt: prompt.trim(),
				brandColor,
				width: preset.width,
				height: preset.height,
				durationSeconds
			});
			const template = response?.template;
			if (!template?.uid)
				throw new Error('The template was generated but no details were returned.');
			analytics.track?.('Video Template Generated', {
				uid: template.uid,
				preset: preset.label,
				durationSeconds
			});
			if (response?.previewUrl) {
				try {
					sessionStorage.setItem(
						`pictify:video-template-preview:${template.uid}`,
						response.previewUrl
					);
				} catch (error) {
					/* ignore */
				}
			}
			goto(`/dashboard/video-templates/${template.uid}`);
		} catch (error) {
			genError = error?.message || 'Failed to generate the template. Please try again.';
			generating = false;
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

<section class="min-h-full pb-12 relative z-0">
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none -z-10"
	/>

	<!-- Header -->
	<div class="pt-4 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
		<div>
			<h1
				class="text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-black text-black tracking-tighter leading-[0.95]"
			>
				Video templates.
			</h1>
			<p class="text-sm font-bold text-gray-500 mt-2 max-w-lg">
				Remotion-style scenes with variables — write the TSX yourself or let AI direct it.
			</p>
		</div>
		<a
			href="/dashboard/video-templates/new"
			class="inline-flex items-center gap-2 bg-black text-white px-5 py-3 lg:py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black hover:bg-gray-800 transition-colors self-start sm:self-auto"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M12 4v16m8-8H4"
				/>
			</svg>
			New Video Template
		</a>
	</div>

	<!-- Generate with AI -->
	<div class="bg-brand-accent/10 rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 mb-10">
		<div class="flex items-center gap-3 mb-4">
			<div
				class="w-10 h-10 bg-brand-accent rounded-xl border-[3px] border-black shadow-brutal-sm flex items-center justify-center rotate-3"
			>
				<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
					/>
				</svg>
			</div>
			<div>
				<h2 class="text-sm font-black text-black uppercase tracking-widest">Generate with AI</h2>
				<p class="text-xs font-bold text-gray-500">
					Describe the scene — we write the TSX, you tweak it in the editor.
				</p>
			</div>
		</div>

		{#if genError}
			<div
				class="bg-brand-danger/10 border-[3px] border-brand-danger rounded-xl p-4 mb-4 text-sm font-bold text-brand-danger"
			>
				{genError}
			</div>
		{/if}

		<textarea
			bind:value={prompt}
			rows="3"
			disabled={generating}
			placeholder="A product launch teaser: bold headline slides in, price tag pops with a spring, confetti at the end…"
			class="w-full rounded-xl border-[3px] border-black p-4 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all resize-y disabled:opacity-60"
		/>

		<div class="flex flex-col lg:flex-row lg:items-end gap-4 mt-4">
			<div>
				<span class="block text-xs font-black text-black uppercase tracking-widest mb-2">
					Format
				</span>
				<div class="flex items-center gap-2">
					{#each PRESETS as p (p.label)}
						<button
							on:click={() => (preset = p)}
							disabled={generating}
							class="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-[3px] border-black transition-all
								{preset.label === p.label
								? 'bg-black text-white shadow-brutal-sm'
								: 'bg-white text-black hover:bg-gray-100'}"
						>
							{p.label}
						</button>
					{/each}
				</div>
			</div>
			<div>
				<label
					for="gen-brand-color"
					class="block text-xs font-black text-black uppercase tracking-widest mb-2"
				>
					Brand color
				</label>
				<div class="flex gap-2">
					<input
						id="gen-brand-color"
						type="color"
						bind:value={brandColor}
						disabled={generating}
						class="w-12 h-11 rounded-xl border-[3px] border-black bg-white p-1 cursor-pointer"
					/>
					<input
						type="text"
						aria-label="Brand color hex value"
						bind:value={brandColor}
						disabled={generating}
						class="w-28 rounded-xl border-[3px] border-black px-4 py-2.5 text-sm font-mono font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
					/>
				</div>
			</div>
			<div>
				<label
					for="gen-duration"
					class="block text-xs font-black text-black uppercase tracking-widest mb-2"
				>
					Seconds
				</label>
				<input
					id="gen-duration"
					type="number"
					min="1"
					max="30"
					bind:value={genDuration}
					disabled={generating}
					class="w-24 rounded-xl border-[3px] border-black px-4 py-2.5 text-sm font-bold text-black bg-white focus:outline-none focus:shadow-brutal-md transition-all"
				/>
			</div>
			<button
				on:click={generate}
				disabled={generating}
				class="lg:ml-auto inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black shadow-brutal-md hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
			>
				{#if generating}
					<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
					Directing your scene… ~30s
				{:else}
					Generate with AI
				{/if}
			</button>
		</div>
	</div>

	<!-- Templates list -->
	<div class="flex items-center gap-3 mb-6">
		<h2 class="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3">
			<span class="w-3 h-3 bg-data-violet rounded-sm border-[2px] border-black" />
			Your video templates
		</h2>
	</div>

	{#if isLoading}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each Array(3) as _}
				<div class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-md p-5">
					<div class="h-5 w-2/3 bg-gray-200 rounded animate-pulse mb-4" />
					<div class="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
				</div>
			{/each}
		</div>
	{:else if loadError}
		<div
			class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg p-8 text-center flex flex-col items-center"
		>
			<p class="text-sm font-black text-black uppercase tracking-wider mb-4">{loadError}</p>
			<button
				on:click={loadTemplates}
				class="inline-flex items-center gap-2 bg-black text-white px-6 lg:px-5 py-3 lg:py-2.5 rounded-xl font-black text-sm lg:text-xs uppercase tracking-wide border-[3px] border-black hover:bg-gray-800 transition-colors"
			>
				Retry
			</button>
		</div>
	{:else if templates.length === 0}
		<div
			class="bg-white rounded-2xl border-[3px] border-black border-dashed p-10 text-center flex flex-col items-center"
		>
			<p class="text-lg font-black text-black mb-2">No video templates yet</p>
			<p class="text-sm font-bold text-gray-500 max-w-sm">
				Start from scratch with
				<a
					href="/dashboard/video-templates/new"
					class="underline text-black hover:text-brand-danger"
				>
					a new template
				</a>
				— or describe one above and let AI direct it.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each templates as template (template.uid)}
				<div
					class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-md hover:shadow-brutal-xl hover:-translate-y-1 transition-all duration-200 p-5 flex flex-col"
				>
					<div class="flex items-start justify-between gap-3">
						<h3 class="text-base font-black text-black truncate">
							{template.name || 'Untitled video template'}
						</h3>
						<span
							class="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black flex-shrink-0
								{template.status === 'published' ? 'bg-data-green text-black' : 'bg-gray-100 text-gray-700'}"
						>
							{template.status || 'draft'}
						</span>
					</div>
					<div class="flex items-center gap-2 mt-3 flex-wrap">
						<span
							class="px-2.5 py-1 bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black"
						>
							{template.width}&times;{template.height}
						</span>
						{#if durationLabel(template)}
							<span
								class="px-2.5 py-1 bg-brand-accent/20 text-black text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black"
							>
								{durationLabel(template)} @ {template.fps}fps
							</span>
						{/if}
					</div>
					<a
						href="/dashboard/video-templates/{template.uid}"
						class="mt-5 self-start inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border-[3px] border-black hover:bg-gray-800 transition-colors"
					>
						Open
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M17 8l4 4m0 0l-4 4m4-4H3"
							/>
						</svg>
					</a>
				</div>
			{/each}
		</div>
	{/if}
</section>
