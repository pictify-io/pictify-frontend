<script>
	/**
	 * "Video from a prompt" — boards CF-02 (compose), CF-03 (building → landed)
	 * and CF-04 (failures) on Paper page 04 · row 04·E.
	 *
	 * The Remotion path: POST /video/templates/generate has the agent write the
	 * whole scene (brief, code, compile, review, poster) and save it as a `tsx`
	 * template; the studio then opens it in code mode where edits are prompts.
	 *
	 * Rules the design depends on:
	 * - /generate reports no progress, so building shows elapsed time and an
	 *   indeterminate sweep — never a percentage.
	 * - There is no cancel. Closing the tab does not stop the server: the
	 *   template is still saved and the credits still spent. Hence "Keep this
	 *   tab open", and the modal cannot be dismissed while building.
	 * - Every failure keeps the brief, and "no credits used" is true: the
	 *   backend spends AI credits only after the template is saved.
	 */
	import { createEventDispatcher, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { generateVideoTemplate } from '../../../../api/videoTemplates';
	import { analytics } from '$lib/telemetry.js';
	import { usageWidget, plgStatus } from '../../../../store/plg.store';
	import { openUpgradeModal } from '../../../../store/upgrade-modal.store';

	export let open = false;
	/** Brief to start with — the MP4 empty state and old links pass one. */
	export let seed = '';

	const dispatch = createEventDispatcher();

	const FORMATS = [
		{ key: '9:16', width: 1080, height: 1920, glyph: 'h-[13px] w-2' },
		{ key: '1:1', width: 1080, height: 1080, glyph: 'h-2.5 w-2.5' },
		{ key: '16:9', width: 1920, height: 1080, glyph: 'h-2 w-[13px]' }
	];
	const LENGTHS = [3, 5, 6, 8, 10, 15, 20, 30];
	const EXAMPLES = [
		{
			title: 'Welcome video',
			line: 'Their name, our logo, 5 s',
			brief:
				'A 5-second welcome video. The viewer’s name fades in big, then our logo settles in underneath on our brand colour.',
			seconds: 5
		},
		{
			title: 'Stats recap',
			line: 'Three numbers count up',
			brief:
				'A monthly recap: three numbers count up one after another, each with a short label, then a thank-you line.',
			seconds: 8
		},
		{
			title: 'Quote card',
			line: 'A line types itself in',
			brief:
				'A quote types itself in, one word at a time, then the author’s name and role slide up underneath.',
			seconds: 6
		}
	];

	let state = 'compose'; // compose | building | landed | failed
	let failure = null; // compile | credits | slots | unavailable
	let brief = '';
	let formatKey = '9:16';
	let seconds = 6;
	let brandColor = '#2F4BFF';
	let elapsed = 0;
	let timer = null;
	let openTimer = null;
	let landed = null; // { uid, posterUrl, inputs }
	let textareaEl;
	let wasOpen = false;

	$: format = FORMATS.find((f) => f.key === formatKey) || FORMATS[0];
	$: aiRemaining = $usageWidget?.aiCredits?.remaining;
	$: resetLabel = $plgStatus?.resetDate
		? new Date($plgStatus.resetDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
		: '';

	// Fresh state each time the modal opens, with the seed in the box.
	$: if (open && !wasOpen) {
		wasOpen = true;
		reset();
	} else if (!open && wasOpen) {
		wasOpen = false;
	}

	async function reset() {
		state = 'compose';
		failure = null;
		landed = null;
		elapsed = 0;
		brief = seed || '';
		await tick();
		textareaEl?.focus();
	}

	const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

	function close() {
		if (state === 'building') return;
		clearTimeout(openTimer);
		dispatch('close');
	}

	function useExample(example) {
		brief = example.brief;
		seconds = example.seconds;
		textareaEl?.focus();
	}

	function openStudio() {
		if (!landed) return;
		clearTimeout(openTimer);
		goto(`/dashboard/video-templates/${landed.uid}/studio`);
	}

	async function generate() {
		if (!brief.trim() || state === 'building') return;
		state = 'building';
		failure = null;
		elapsed = 0;
		timer = setInterval(() => (elapsed += 1), 1000);
		analytics.track('video_prompt_generate_started', { format: formatKey, seconds });
		try {
			const response = await generateVideoTemplate({
				prompt: brief.trim(),
				brandColor,
				width: format.width,
				height: format.height,
				durationSeconds: seconds
			});
			const template = response?.template;
			if (!template?.uid) throw new Error('The scene was built but came back without an id.');
			landed = {
				uid: template.uid,
				posterUrl: response?.previewUrl || template.posterUrl || '',
				inputs: (template.variableDefinitions || []).map((d) => d?.name).filter(Boolean)
			};
			state = 'landed';
			analytics.track('video_prompt_generate_landed', { uid: template.uid, seconds: elapsed });
			openTimer = setTimeout(openStudio, 2000);
		} catch (err) {
			const code = err?.data?.code;
			if (code === 'template_limit_reached') failure = 'slots';
			else if (code === 'ai_quota_exceeded') failure = 'credits';
			else if (err?.status === 422) failure = 'compile';
			else failure = 'unavailable';
			state = 'failed';
			analytics.track('video_prompt_generate_failed', { failure, status: err?.status || 0 });
		} finally {
			clearInterval(timer);
		}
	}

	function buildByHand() {
		dispatch('close');
		goto('/dashboard/video-templates/new/studio?tab=text');
	}

	function seePlans() {
		openUpgradeModal(failure === 'slots' ? 'template_limit' : 'ai_credits');
	}

	function onKey(event) {
		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') generate();
	}

	onDestroy(() => {
		clearInterval(timer);
		clearTimeout(openTimer);
	});

	const FAILURES = {
		compile: {
			tag: 'Scene didn’t build',
			alarm: true,
			title: 'That one didn’t come together',
			line: 'No credits used. Try again, or say it a little differently.'
		},
		credits: {
			tag: 'Out of AI credits',
			alarm: false,
			title: 'That needs 5 AI credits',
			line: 'Building by hand uses none.'
		},
		slots: {
			tag: 'Slots full',
			alarm: false,
			title: 'Your template slots are all in use',
			line: 'Delete one you don’t use, or upgrade for more.'
		},
		unavailable: {
			tag: 'AI unavailable',
			alarm: true,
			title: 'We couldn’t reach the AI',
			line: 'No credits used. Try again in a few minutes, or build it by hand.'
		}
	};

	$: failureCopy = failure ? FAILURES[failure] : null;
	$: creditsLine =
		failure === 'credits' && typeof aiRemaining === 'number'
			? `You have ${aiRemaining} left${resetLabel ? ` until ${resetLabel}` : ''}. Building by hand uses none.`
			: failureCopy?.line;

	const BTN_PRIMARY =
		'flex h-[34px] items-center rounded-btn bg-brand-ink px-3.5 font-sans text-[13px] font-semibold text-white hover:opacity-90';
	const BTN_SECONDARY =
		'flex h-[34px] items-center rounded-btn border-[1.5px] border-brand-ink px-3.5 font-sans text-[13px] font-semibold text-brand-ink hover:bg-brand-subtle';
	const CHIP =
		'relative flex h-[30px] items-center gap-[7px] rounded-[6px] border border-brand-rule bg-brand-subtle px-2.5 font-mono text-[11.5px] text-brand-ink';
</script>

<svelte:window on:keydown={(e) => open && e.key === 'Escape' && close()} />

{#if open}
	<div class="fixed inset-0 z-40 bg-[rgba(19,20,23,0.42)]" on:click={close} aria-hidden="true"></div>
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pb-10 pt-[12vh] pointer-events-none"
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="video-prompt-title"
			class="pointer-events-auto w-full max-w-[660px] rounded-[14px] border-[1.5px] border-brand-ink bg-white shadow-[6px_6px_0_theme(colors.brand.ink)]"
		>
			{#if state === 'compose'}
				<div class="flex flex-col gap-5 px-5 pb-6 pt-6 sm:px-[30px] sm:pt-7">
					<div class="flex items-start justify-between gap-4">
						<div class="flex flex-col gap-2">
							<span class="flex items-center gap-2">
								<span class="block h-2 w-2 rotate-45 bg-brand-pink" aria-hidden="true"></span>
								<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-slate"
									>New video · AI builds the scene</span
								>
							</span>
							<h2
								id="video-prompt-title"
								class="font-display text-[26px] font-bold leading-[32px] tracking-[-0.03em] text-brand-ink sm:text-[32px] sm:leading-[38px]"
							>
								What's your video about?
							</h2>
						</div>
						<button
							type="button"
							on:click={close}
							aria-label="Close"
							class="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-btn border border-brand-rule hover:border-brand-ink"
						>
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
								><path
									d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
								/></svg
							>
						</button>
					</div>

					<div
						class="flex min-h-[196px] flex-col justify-between rounded-[10px] border-[1.5px] border-brand-ink focus-within:shadow-[3px_3px_0_theme(colors.brand.field)]"
					>
						<textarea
							bind:this={textareaEl}
							bind:value={brief}
							on:keydown={onKey}
							rows="4"
							maxlength="2000"
							aria-label="Describe the video"
							placeholder="A 6-second launch teaser. The product name slides in big, the price pops in with a little bounce, and our logo sits in the corner at the end."
							class="w-full flex-1 resize-none border-0 bg-transparent px-[18px] pt-4 font-sans text-[16px] leading-6 text-brand-ink outline-none placeholder:text-brand-mute"
						></textarea>
						<div class="flex flex-wrap items-center justify-between gap-3 p-3 pl-3.5">
							<div class="flex flex-wrap items-center gap-1.5">
								<label class={CHIP} title="Format">
									<span
										class="block rounded-[1.5px] border-[1.5px] border-brand-ink {format.glyph}"
										aria-hidden="true"
									></span>
									{formatKey}
									<svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true"
										><path
											d="M2 3.5 L5 6.5 L8 3.5"
											stroke="#8A8A85"
											stroke-width="1.6"
											stroke-linecap="round"
											stroke-linejoin="round"
										/></svg
									>
									<select
										bind:value={formatKey}
										aria-label="Format"
										class="absolute inset-0 cursor-pointer opacity-0"
									>
										{#each FORMATS as f (f.key)}<option value={f.key}>{f.key}</option>{/each}
									</select>
								</label>
								<label class={CHIP} title="Length">
									<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
										><circle cx="6" cy="6" r="4.6" stroke="currentColor" stroke-width="1.4" /><path
											d="M6 3.6 V6 L7.6 7"
											stroke="currentColor"
											stroke-width="1.4"
											stroke-linecap="round"
										/></svg
									>
									{seconds} s
									<svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true"
										><path
											d="M2 3.5 L5 6.5 L8 3.5"
											stroke="#8A8A85"
											stroke-width="1.6"
											stroke-linecap="round"
											stroke-linejoin="round"
										/></svg
									>
									<select
										bind:value={seconds}
										aria-label="Length in seconds"
										class="absolute inset-0 cursor-pointer opacity-0"
									>
										{#each LENGTHS as s (s)}<option value={s}>{s} s</option>{/each}
									</select>
								</label>
								<label class={CHIP} title="Brand colour">
									<span
										class="block h-3 w-3 rounded-full border border-brand-ink"
										style="background:{brandColor}"
										aria-hidden="true"
									></span>
									{brandColor.toUpperCase()}
									<input
										type="color"
										bind:value={brandColor}
										aria-label="Brand colour"
										class="absolute inset-0 cursor-pointer opacity-0"
									/>
								</label>
							</div>
							<button
								type="button"
								on:click={generate}
								disabled={!brief.trim()}
								class="flex h-[38px] items-center gap-2.5 rounded-btn px-4 {brief.trim()
									? 'bg-brand-ink text-white hover:opacity-90'
									: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
							>
								<span class="font-sans text-[13.5px] font-semibold">Generate</span>
								<span
									class="font-mono text-[10.5px] {brief.trim()
										? 'text-brand-press-text'
										: 'text-brand-mute'}">5 credits</span
								>
								<span
									class="hidden font-mono text-[10.5px] sm:inline {brief.trim()
										? 'text-brand-field'
										: 'text-brand-mute'}">⌘↵</span
								>
							</button>
						</div>
					</div>

					<div class="flex flex-col gap-2.5">
						<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">Try one</span>
						<div class="flex flex-col gap-2 sm:flex-row">
							{#each EXAMPLES as example (example.title)}
								<button
									type="button"
									on:click={() => useExample(example)}
									class="flex flex-1 flex-col gap-[3px] rounded-[8px] border border-brand-rule px-3 py-2.5 text-left hover:border-brand-ink"
								>
									<span class="font-sans text-[13px] font-semibold text-brand-ink">{example.title}</span>
									<span class="font-sans text-[12px] leading-4 text-brand-slate">{example.line}</span>
								</button>
							{/each}
						</div>
					</div>

					<div
						class="flex flex-col gap-2 border-t border-brand-rule pt-3.5 sm:flex-row sm:items-center sm:justify-between"
					>
						<span class="font-sans text-[12.5px] text-brand-slate"
							>Opens in the studio. Change it by saying what you want.</span
						>
						<button
							type="button"
							on:click={buildByHand}
							class="self-start font-sans text-[12.5px] font-medium text-brand-ink underline underline-offset-[3px]"
						>
							Build it by hand instead
						</button>
					</div>
				</div>
			{:else}
				<!-- CF-03 / CF-04: the video's own frame on the left, status on the right. -->
				<div class="flex flex-col gap-6 p-5 sm:flex-row sm:items-start sm:p-[26px]">
					<div
						class="relative mx-auto flex h-[384px] w-[216px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[8px] border-[1.5px] border-brand-ink bg-brand-press-deep sm:mx-0"
						aria-hidden="true"
					>
						{#if state === 'landed' && landed?.posterUrl}
							<img src={landed.posterUrl} alt="" class="h-full w-full object-cover" />
							<span
								class="absolute left-3.5 top-3.5 rounded-[3px] bg-black/35 px-1.5 py-[3px] font-mono text-[9.5px] tracking-[0.06em] text-white"
								>POSTER FRAME</span
							>
						{:else}
							<div class="flex w-[132px] flex-col gap-[7px] {state === 'building' ? 'animate-pulse' : ''}">
								<span class="block h-3.5 w-[108px] rounded-[2px] bg-[#2A2C30]"></span>
								<span class="block h-3.5 w-[132px] rounded-[2px] bg-[#2A2C30]"></span>
								<span class="block h-2 w-[70px] rounded-[2px] bg-[#2A2C30]"></span>
							</div>
							{#if state === 'building'}
								<span class="press-sweep absolute bottom-0 left-0 block h-[3px] w-1/2 bg-brand-pink"></span>
							{/if}
						{/if}
					</div>

					<div class="flex min-w-0 flex-1 flex-col gap-[18px] pt-1.5">
						{#if state === 'building'}
							<div class="flex flex-col gap-1.5" aria-live="polite">
								<span class="flex items-center gap-2">
									<span class="block h-2 w-2 rotate-45 bg-brand-pink" aria-hidden="true"></span>
									<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-slate"
										>Building · {clock(elapsed)}</span
									>
								</span>
								<h2
									id="video-prompt-title"
									class="font-display text-[24px] font-bold leading-[30px] tracking-[-0.025em] text-brand-ink"
								>
									Writing your scene
								</h2>
								<p class="font-sans text-[13.5px] leading-[19px] text-brand-slate">
									Usually under a minute. Keep this tab open.
								</p>
							</div>
							<div class="flex flex-col gap-2 rounded-[8px] bg-brand-subtle px-3.5 py-3">
								<p class="font-sans text-[13px] leading-[19px] text-brand-slate">{brief}</p>
								<span class="font-mono text-[10.5px] tracking-[0.04em] text-brand-mute"
									>{formatKey} · {seconds} s · {brandColor.toUpperCase()}</span
								>
							</div>
						{:else if state === 'landed'}
							<div class="flex flex-col gap-1.5" aria-live="polite">
								<span class="flex items-center gap-2">
									<span class="block h-2 w-2 rotate-45 bg-brand-proof" aria-hidden="true"></span>
									<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-slate"
										>Ready · {clock(elapsed)}</span
									>
								</span>
								<h2
									id="video-prompt-title"
									class="font-display text-[24px] font-bold leading-[30px] tracking-[-0.025em] text-brand-ink"
								>
									Your scene is ready
								</h2>
								<p class="font-sans text-[13.5px] leading-[19px] text-brand-slate">
									Opening it in the studio…
								</p>
							</div>
							<div class="flex flex-col gap-2">
								<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute"
									>Inputs it found</span
								>
								{#if landed?.inputs?.length}
									<div class="flex flex-wrap gap-1.5">
										{#each landed.inputs as input (input)}
											<span
												class="rounded-btn bg-brand-rose px-2 py-1 font-mono text-[12px] font-medium text-brand-ink"
												>{input}</span
											>
										{/each}
									</div>
								{:else}
									<p class="font-sans text-[13px] text-brand-slate">
										No inputs yet — add them in the studio.
									</p>
								{/if}
							</div>
							<div class="flex items-center gap-3.5">
								<button type="button" on:click={openStudio} class={BTN_PRIMARY.replace('h-[34px]', 'h-[38px]')}>
									Open in the studio
								</button>
								<span class="font-mono text-[10.5px] text-brand-mute">opens by itself in 2 s</span>
							</div>
						{:else if state === 'failed' && failureCopy}
							<div class="flex flex-col gap-2" role="alert">
								<span class="flex items-center gap-2">
									<span
										class="block h-2 w-2 {failureCopy.alarm ? 'bg-brand-alarm' : 'bg-brand-ink'}"
										aria-hidden="true"
									></span>
									<span
										class="font-mono text-[10.5px] uppercase tracking-[0.1em] {failureCopy.alarm
											? 'text-brand-alarm'
											: 'text-brand-slate'}">{failureCopy.tag}</span
									>
								</span>
								<h2
									id="video-prompt-title"
									class="font-display text-[22px] font-bold leading-[28px] tracking-[-0.02em] text-brand-ink"
								>
									{failureCopy.title}
								</h2>
								<p class="font-sans text-[13.5px] leading-[19px] text-brand-slate">{creditsLine}</p>
							</div>
							<div class="flex flex-wrap gap-2">
								{#if failure === 'compile'}
									<button type="button" on:click={generate} class={BTN_PRIMARY}>Try again</button>
									<button type="button" on:click={() => (state = 'compose')} class={BTN_SECONDARY}
										>Edit the brief</button
									>
								{:else if failure === 'credits'}
									<button type="button" on:click={seePlans} class={BTN_PRIMARY}>See plans</button>
									<button type="button" on:click={buildByHand} class={BTN_SECONDARY}
										>Build it by hand</button
									>
								{:else if failure === 'slots'}
									<button type="button" on:click={seePlans} class={BTN_PRIMARY}>See plans</button>
									<button type="button" on:click={close} class={BTN_SECONDARY}>Back to templates</button>
								{:else}
									<button type="button" on:click={generate} class={BTN_PRIMARY}>Try again</button>
									<button type="button" on:click={buildByHand} class={BTN_SECONDARY}
										>Build it by hand</button
									>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Indeterminate: /generate reports no progress, so the sweep only says
	   "working" and never claims how far along. */
	.press-sweep {
		animation: press-sweep 1.6s ease-in-out infinite;
	}
	@keyframes press-sweep {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(200%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.press-sweep {
			animation: none;
			width: 100%;
			opacity: 0.6;
		}
	}
</style>
