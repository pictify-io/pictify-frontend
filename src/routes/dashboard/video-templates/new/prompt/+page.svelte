<script>
	/**
	 * /dashboard/video-templates/new/prompt — a video template from a prompt.
	 *
	 * This is the Remotion path: the generation agent writes the whole scene as
	 * a composition (POST /video/templates/generate — brief, code, compile,
	 * review, poster), saves it as a `tsx` template, and the studio opens it in
	 * code mode. From there every change is a prompt in Say it and renders are
	 * composition renders.
	 *
	 * It is NOT the timeline copilot. Pre-filling Say it on a blank template
	 * would only run the code-edit endpoint over a starter file, which skips the
	 * agent that actually builds a scene.
	 *
	 * ?prompt=<brief> pre-fills the description (the Templates page's MP4 empty
	 * state). Nothing is generated until the user presses Generate: it spends
	 * AI credits and a template slot.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { generateVideoTemplate } from '../../../../../api/videoTemplates';
	import { analytics } from '$lib/telemetry.js';
	import { toast } from '../../../../../store/toast.store';
	import { openUpgradeModal } from '../../../../../store/upgrade-modal.store';

	const FORMATS = [
		{ key: '9:16', detail: 'Reels, Shorts, TikTok', width: 1080, height: 1920, box: 'h-[26px] w-[15px]' },
		{ key: '1:1', detail: 'Feed posts', width: 1080, height: 1080, box: 'h-5 w-5' },
		{ key: '16:9', detail: 'YouTube, embeds', width: 1920, height: 1080, box: 'h-[15px] w-[26px]' }
	];

	let format = FORMATS[0];
	let description = '';
	let durationSeconds = 6;
	let brandColor = '#2F4BFF';
	let busy = false;
	let error = '';

	onMount(() => {
		const seed = $page.url.searchParams.get('prompt');
		if (seed) description = seed;
		analytics.page('Video Template New Prompt');
	});

	async function generate() {
		if (!description.trim() || busy) return;
		const seconds = Math.round(Number(durationSeconds));
		if (!seconds || seconds < 1 || seconds > 60) {
			error = 'Pick a length between 1 and 60 seconds.';
			return;
		}
		busy = true;
		error = '';
		try {
			const response = await generateVideoTemplate({
				prompt: description.trim(),
				brandColor,
				width: format.width,
				height: format.height,
				durationSeconds: seconds
			});
			const uid = response?.template?.uid;
			if (!uid) throw new Error('The scene was built but came back without an id.');
			analytics.track?.('Video Template Created', { via: 'ai', uid, format: format.key });
			goto(`/dashboard/video-templates/${uid}/studio`, { replaceState: true });
		} catch (err) {
			const code = err?.data?.code;
			if (code === 'template_limit_reached') {
				openUpgradeModal('template_limit');
				error = err?.data?.message || "You're out of template slots.";
			} else if (code === 'ai_quota_exceeded') {
				error = err?.data?.message || "You're out of AI credits this month.";
			} else if (err?.status === 422) {
				error = 'The scene did not compile. Try describing it differently.';
			} else {
				error = err?.data?.message || err?.message || 'Could not build that scene.';
			}
			toast.set({ message: error, type: 'error', duration: 5000 });
			busy = false;
		}
	}

	function onKey(event) {
		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') generate();
	}
</script>

<svelte:head>
	<title>New video template | Pictify.io</title>
</svelte:head>

<div class="flex justify-center px-4 py-10">
	<div class="h-fit w-full max-w-[460px] rounded-[12px] border border-brand-rule bg-brand-paper">
		<div class="flex items-center gap-2 border-b border-brand-rule px-4 py-3">
			<a href="/dashboard/template" class="font-sans text-[13px] text-brand-slate hover:underline"
				>Templates</a
			>
			<span class="font-mono text-[11px] text-brand-mute">/</span>
			<span class="font-sans text-[15px] font-semibold text-brand-ink">New video</span>
			<span class="ml-1 flex items-center gap-1.5">
				<span class="block h-2 w-2 border border-brand-mute" aria-hidden="true" />
				<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-slate"
					>Not saved yet</span
				>
			</span>
		</div>

		<div class="flex flex-col gap-4 p-4">
			<div class="flex flex-col gap-1">
				<h1
					class="font-display text-[21px] font-medium leading-[26px] tracking-[-0.015em] text-brand-ink"
				>
					Describe the video. AI builds the scene.
				</h1>
				<p class="font-sans text-[13px] leading-[17px] text-brand-slate">
					It opens in the studio as a Remotion scene. Change it by saying what you want; renders
					use the same composition.
				</p>
			</div>

			<div class="flex flex-col gap-2">
				<p class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">Format</p>
				<div class="grid grid-cols-3 gap-1.5">
					{#each FORMATS as option (option.key)}
						<button
							type="button"
							on:click={() => (format = option)}
							aria-pressed={format.key === option.key}
							disabled={busy}
							class="flex flex-col items-start gap-2 rounded-[6px] px-3 py-2.5 text-left {format.key ===
							option.key
								? 'border-[1.5px] border-brand-ink'
								: 'border border-brand-rule'}"
						>
							<span class="flex h-[26px] items-end" aria-hidden="true">
								<span
									class="block rounded-[2px] border {option.box} {format.key === option.key
										? 'border-brand-ink'
										: 'border-brand-mute'}"
								/>
							</span>
							<span class="min-w-0">
								<span
									class="block font-mono text-[12px] leading-4 text-brand-ink {format.key ===
									option.key
										? 'font-medium'
										: ''}">{option.key}</span
								>
								<span class="block font-sans text-[11.5px] leading-[14px] text-brand-slate"
									>{option.detail}</span
								>
							</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="flex gap-3">
				<label class="flex flex-col gap-2">
					<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute"
						>Seconds</span
					>
					<input
						type="number"
						min="1"
						max="60"
						bind:value={durationSeconds}
						disabled={busy}
						class="h-[36px] w-20 rounded-[4px] border border-brand-rule px-2.5 font-mono text-[13px] text-brand-ink outline-none focus:border-brand-ink"
					/>
				</label>
				<div class="flex flex-col gap-2">
					<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute"
						>Brand colour</span
					>
					<div class="flex h-[36px] items-center gap-2 rounded-[4px] border border-brand-rule px-2">
						<input
							type="color"
							bind:value={brandColor}
							disabled={busy}
							aria-label="Brand colour"
							class="h-6 w-7 cursor-pointer border-0 bg-transparent p-0"
						/>
						<input
							type="text"
							bind:value={brandColor}
							disabled={busy}
							aria-label="Brand colour hex value"
							class="w-[74px] bg-transparent font-mono text-[12.5px] text-brand-ink outline-none"
						/>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<p class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">Describe it</p>
				<div
					class="flex h-[132px] flex-col justify-between rounded-[6px] border-[1.5px] border-brand-ink p-3"
				>
					<textarea
						bind:value={description}
						on:keydown={onKey}
						disabled={busy}
						placeholder="A product launch teaser: the headline slides in, the price pops with a spring, our logo at the end."
						class="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 font-sans text-[13.5px] leading-[19px] text-brand-ink outline-none placeholder:text-brand-mute"
					/>
					<div class="flex items-center justify-between">
						<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
							>Inputs: the scene's schema</span
						>
						<span class="font-mono text-[10px] tracking-[0.06em] text-brand-mute">⌘↵</span>
					</div>
				</div>
				<button
					type="button"
					on:click={generate}
					disabled={!description.trim() || busy}
					class="flex h-[38px] items-center justify-center rounded-[4px] font-sans text-[13.5px] font-medium {description.trim() &&
					!busy
						? 'bg-brand-plum text-white'
						: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
				>
					{busy ? 'Building the scene… this can take a minute' : 'Generate · 5 AI credits'}
				</button>
			</div>

			<a
				href="/dashboard/video-templates/new/studio?tab=text"
				class="self-start font-sans text-[12.5px] text-brand-slate underline underline-offset-[3px] hover:text-brand-ink"
			>
				Build it by hand on the timeline instead
			</a>

			{#if error}
				<p class="flex items-start gap-2">
					<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
					<span class="font-sans text-[12.5px] leading-[17px] text-brand-slate">{error}</span>
				</p>
			{/if}
		</div>
	</div>
</div>
