<script>
	/**
	 * New video template — pick a format, then a way to author it.
	 *
	 * The studio is the default and the biggest target. Code mode and AI
	 * generation are the other two doors, deliberately smaller: both produce
	 * the same VideoTemplate entity, so nothing downstream cares which one
	 * gets used.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { generateVideoTemplate } from '../../../../api/videoTemplates';
	import { analytics } from '$lib/analytics.js';
	import { STARTERS, buildStarterClips } from '$lib/video/starters.js';
	import { readGradient, gradientCss } from '$lib/video/gradients.js';

	/**
	 * The swatch for a starter card, read back from the scene the card actually
	 * opens rather than stored alongside it. A hand-kept preview colour drifts
	 * the first time someone retunes a gradient, and a card that lies about what
	 * it opens is worse than no card.
	 */
	function starterSwatch(id) {
		const clips = buildStarterClips(id, { width: 1080, height: 1920 }) || [];
		const backdrop = clips.find((clip) => clip.type === 'Backdrop');
		if (backdrop) {
			const gradient = readGradient(backdrop);
			if (gradient) return gradientCss(gradient);
		}
		// Starters meant to sit over footage have no backdrop — show the plate
		// colour of their first shape so the card is not blank.
		const shape = clips.find((clip) => clip.type === 'Shape');
		return shape?.style?.fill || '#0f172a';
	}

	const FORMATS = [
		{ label: '9:16', hint: 'Reels, Shorts, TikTok', width: 1080, height: 1920 },
		{ label: '1:1', hint: 'Feed posts', width: 1080, height: 1080 },
		{ label: '16:9', hint: 'YouTube, embeds', width: 1920, height: 1080 }
	];

	let format = FORMATS[0];
	let name = '';

	// AI generation (Code mode output)
	let showAi = false;
	let prompt = '';
	let brandColor = '#ffc480';
	let genDuration = 6;
	let generating = false;
	let genError = '';

	function openStudio(starterId) {
		const params = new URLSearchParams({
			w: String(format.width),
			h: String(format.height),
			fps: '30'
		});
		if (name.trim()) params.set('name', name.trim());
		if (starterId) params.set('starter', starterId);
		analytics.track?.('Video Template Created', {
			via: starterId ? 'starter' : 'studio',
			format: format.label,
			starter: starterId || null
		});
		goto(`/dashboard/video-templates/new/studio?${params.toString()}`);
	}

	async function generate() {
		if (generating) return;
		genError = '';
		if (!prompt.trim()) {
			genError = 'Describe the video you want first.';
			return;
		}
		const durationSeconds = Math.round(Number(genDuration));
		if (!durationSeconds || durationSeconds < 1) {
			genError = 'Enter a duration in seconds.';
			return;
		}
		generating = true;
		try {
			const response = await generateVideoTemplate({
				prompt: prompt.trim(),
				brandColor,
				width: format.width,
				height: format.height,
				durationSeconds
			});
			const template = response?.template;
			if (!template?.uid) throw new Error('The template generated but returned no details.');
			analytics.track?.('Video Template Created', {
				via: 'ai',
				uid: template.uid,
				format: format.label
			});
			// The studio opens Remotion templates directly now, so a generated
			// scene lands in the same editor as everything else.
			goto(`/dashboard/video-templates/${template.uid}/studio`);
		} catch (error) {
			genError = error?.message || 'Generation failed. Try rephrasing your prompt.';
			generating = false;
		}
	}

	onMount(() => analytics.page('Video Template New'));

	const CARD =
		'group flex w-full flex-col rounded-2xl border-[3px] border-black bg-white p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-xl focus-brutal';
</script>

<svelte:head>
	<title>New video template - Pictify.io</title>
</svelte:head>

<section class="relative z-0 min-h-full pb-12">
	<div
		class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] opacity-70 [background-size:20px_20px]"
	></div>

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
		<h1
			class="text-3xl font-black leading-[0.95] tracking-tighter text-black sm:text-4xl md:text-5xl lg:text-4xl"
		>
			New video template.
		</h1>
		<p class="mt-2 max-w-lg text-sm font-bold text-gray-500">
			Build it once with variables, then render it as many times as you need — from here, from a
			CSV, or from your code.
		</p>
	</div>

	<!-- Format -->
	<div class="mb-8 rounded-2xl border-[3px] border-black bg-white p-6 shadow-brutal-md">
		<div class="flex flex-col gap-5 lg:flex-row lg:items-end">
			<div>
				<span class="mb-2 block text-xs font-black uppercase tracking-widest text-black">
					Format
				</span>
				<div class="flex flex-wrap items-center gap-2">
					{#each FORMATS as f (f.label)}
						<button
							on:click={() => (format = f)}
							aria-pressed={format.label === f.label}
							class="rounded-xl border-[3px] border-black px-4 py-2.5 text-left transition-all focus-brutal
								{format.label === f.label
								? 'bg-black text-white shadow-brutal-sm'
								: 'bg-white text-black hover:bg-gray-100'}"
						>
							<span class="block text-xs font-black uppercase tracking-widest">{f.label}</span>
							<span
								class="block text-[10px] font-bold {format.label === f.label
									? 'text-gray-300'
									: 'text-gray-500'}"
							>
								{f.hint}
							</span>
						</button>
					{/each}
				</div>
			</div>
			<div class="lg:flex-1">
				<label for="new-name" class="mb-2 block text-xs font-black uppercase tracking-widest text-black">
					Name <span class="font-bold normal-case text-gray-400">(optional)</span>
				</label>
				<input
					id="new-name"
					type="text"
					bind:value={name}
					placeholder="Certificate reveal"
					class="w-full rounded-xl border-[3px] border-black bg-white px-4 py-2.5 text-sm font-bold text-black transition-all focus:shadow-brutal-md focus:outline-none focus-brutal"
				/>
			</div>
		</div>
	</div>

	<!-- Start from a scene: the fastest path, and the one that teaches the loop -->
	<div class="mb-8">
		<div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
			<h2 class="text-sm font-black uppercase tracking-widest text-black">Start from a scene</h2>
			<p class="text-xs font-bold text-gray-500">
				Every scene already has
				<code class="rounded border-[2px] border-black bg-gray-50 px-1 font-mono text-[10px]">
					{'{{'}variables{'}}'}
				</code>
				in it — edit the words, then render one per row.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each STARTERS as starter (starter.id)}
				<button
					on:click={() => openStudio(starter.id)}
					class="group flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white text-left shadow-brutal-md transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-xl focus-brutal"
				>
					<span
						class="flex h-24 items-center justify-center border-b-[3px] border-black"
						style="background-image:{starterSwatch(starter.id)}; background-color:{starterSwatch(
							starter.id
						)};"
						aria-hidden="true"
					>
						<span
							class="rounded-lg border-[2px] border-black bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-black"
						>
							{format.label}
						</span>
					</span>
					<span class="flex flex-1 flex-col p-4">
						<span class="text-sm font-black tracking-tight text-black">{starter.name}</span>
						<span class="mt-1 text-xs font-bold leading-snug text-gray-600">
							{starter.description}
						</span>
						<span class="mt-3 flex flex-wrap gap-1">
							{#each starter.tokens as token (token)}
								<span
									class="rounded-md border-[2px] border-black bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-700"
								>
									{token}
								</span>
							{/each}
						</span>
					</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Authoring modes -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Studio: the default, given the most weight -->
		<button on:click={() => openStudio()} class="{CARD} lg:col-span-2 !bg-brand-accent/15 shadow-brutal-2xl">
			<div class="flex items-start justify-between gap-4">
				<div
					class="flex h-12 w-12 flex-shrink-0 rotate-3 items-center justify-center rounded-xl border-[3px] border-black bg-brand-accent shadow-brutal-sm"
				>
					<i class="fa fa-clapperboard text-black" aria-hidden="true"></i>
				</div>
				<span
					class="rounded-full border-[2px] border-black bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white"
				>
					Recommended
				</span>
			</div>
			<h2 class="mt-4 text-xl font-black tracking-tight text-black">Open the studio</h2>
			<p class="mt-2 max-w-md text-sm font-bold text-gray-600">
				Drag clips on a timeline, type
				<code class="rounded border-[2px] border-black bg-white px-1 font-mono text-xs">
					{'{{'}name{'}}'}
				</code>
				into any text, and bind images or colors to variables. No code.
			</p>
			<span
				class="mt-5 inline-flex items-center gap-2 self-start rounded-xl border-[3px] border-black bg-black px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-colors group-hover:bg-gray-800"
			>
				Start building
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M17 8l4 4m0 0l-4 4m4-4H3"
					/>
				</svg>
			</span>
		</button>

		<div class="flex flex-col gap-6">
			<!-- AI -->
			<button on:click={() => (showAi = !showAi)} class="{CARD} shadow-brutal-md" aria-expanded={showAi}>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-black bg-data-violet shadow-brutal-sm"
				>
					<svg class="h-5 w-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
						/>
					</svg>
				</div>
				<h2 class="mt-3 text-base font-black tracking-tight text-black">Generate with AI</h2>
				<p class="mt-1 text-xs font-bold text-gray-600">
					Describe a scene and get an editable coded template.
				</p>
			</button>

			<!-- Code -->
			<a href="/dashboard/video-templates/new/code" class="{CARD} shadow-brutal-md">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-black bg-gray-900 shadow-brutal-sm"
				>
					<i class="fa fa-code text-brand-accent" aria-hidden="true"></i>
				</div>
				<h2 class="mt-3 text-base font-black tracking-tight text-black">Code mode</h2>
				<p class="mt-1 text-xs font-bold text-gray-600">
					Write a Remotion scene in TSX. For motion the timeline can't express.
				</p>
			</a>
		</div>
	</div>

	<!-- AI prompt, revealed inline rather than in a modal -->
	{#if showAi}
		<div class="mt-6 rounded-2xl border-[3px] border-black bg-data-violet/10 p-6 shadow-brutal-2xl">
			<h3 class="mb-4 text-sm font-black uppercase tracking-widest text-black">
				Describe your scene
			</h3>

			{#if genError}
				<div
					class="mb-4 rounded-xl border-[3px] border-brand-danger bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger"
					role="alert"
				>
					{genError}
				</div>
			{/if}

			<textarea
				bind:value={prompt}
				rows="3"
				disabled={generating}
				placeholder="A product launch teaser: bold headline slides in, price tag pops with a spring, confetti at the end…"
				class="w-full resize-y rounded-xl border-[3px] border-black bg-white p-4 text-sm font-bold text-black transition-all focus:shadow-brutal-md focus:outline-none disabled:opacity-60 focus-brutal"
			></textarea>

			<div class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end">
				<div>
					<label
						for="gen-brand-color"
						class="mb-2 block text-xs font-black uppercase tracking-widest text-black"
					>
						Brand color
					</label>
					<div class="flex gap-2">
						<input
							id="gen-brand-color"
							type="color"
							bind:value={brandColor}
							disabled={generating}
							class="h-11 w-12 cursor-pointer rounded-xl border-[3px] border-black bg-white p-1"
						/>
						<input
							type="text"
							aria-label="Brand color hex value"
							bind:value={brandColor}
							disabled={generating}
							class="w-28 rounded-xl border-[3px] border-black bg-white px-4 py-2.5 font-mono text-sm font-bold text-black transition-all focus:shadow-brutal-md focus:outline-none"
						/>
					</div>
				</div>
				<div>
					<label
						for="gen-duration"
						class="mb-2 block text-xs font-black uppercase tracking-widest text-black"
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
						class="w-24 rounded-xl border-[3px] border-black bg-white px-4 py-2.5 text-sm font-bold text-black transition-all focus:shadow-brutal-md focus:outline-none"
					/>
				</div>
				<button
					on:click={generate}
					disabled={generating}
					class="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-black px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-brutal-md transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 lg:ml-auto"
				>
					{#if generating}
						<i class="fa fa-spinner fa-spin text-[10px]" aria-hidden="true"></i>
						Directing your scene… ~30s
					{:else}
						Generate · 5 AI credits
					{/if}
				</button>
			</div>
		</div>
	{/if}
</section>
