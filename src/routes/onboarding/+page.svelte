<script>
	/**
	 * Post-signup onboarding. Two required steps: get a file, then make one from
	 * your own caller. Picking a template isn't a step — it's how step 1 starts.
	 *
	 * Activation is the second one: a render from a caller the user controls.
	 * A render made by clicking a button in here only proves our dashboard works.
	 *
	 * The API seams are marked TODO below. Everything else is real.
	 */
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { analytics } from '$lib/telemetry.js';
	import {
		generateFromPrompt,
		startFromStarter,
		renderOnboarding,
		getOnboardingV2Status,
		getOnboardingKey,
		recordRedraw,
		skipOnboarding
	} from '../../api/onboarding-v2.js';
	import { savePersonalization } from '../../api/onboarding.js';
	import PickStep from '$lib/components/onboarding/v2/PickStep.svelte';
	import PixelCluster from '$lib/components/landing/PixelCluster.svelte';
	import Capsule from '$lib/components/landing/Capsule.svelte';
	import GeneratingStep from '$lib/components/onboarding/v2/GeneratingStep.svelte';
	import RenderedStep from '$lib/components/onboarding/v2/RenderedStep.svelte';
	import FillStep from '$lib/components/onboarding/v2/FillStep.svelte';
	import IntegrateStep from '$lib/components/onboarding/v2/IntegrateStep.svelte';

	/** @type {'pick' | 'generating' | 'rendered' | 'fill' | 'integrate'} */
	let step = 'pick';
	/** @type {'ai' | 'template'} */
	let source = 'template';

	let prompt = '';
	let lines = [];
	let variables = [];
	let stage = 0;
	/** Agent pipeline progress keyed by stage id, fed by SSE `stage` events. */
	let agentStages = {};
	let url = '';
	let templateId = '';
	let apiKey = '';
	let received = false;

	// The rendered screen's timing chip is a measurement, never a claim: the
	// clock starts when the user commits (pick or generate) and stops when the
	// file's URL is in hand. Null means we have nothing honest to show.
	let waitStartedAt = 0;
	let elapsedMs = null;

	let timers = [];
	function clearTimers() {
		timers.forEach(clearTimeout);
		timers = [];
	}
	onDestroy(() => {
		clearTimers();
		clearInterval(poll);
		abortGeneration?.abort();
	});

	$: stepLabel = step === 'integrate' || step === 'fill' ? 'Step 2 of 2' : 'Step 1 of 2';

	let errorMessage = '';

	async function loadKey() {
		try {
			const res = await getOnboardingKey();
			apiKey = res?.token || '';
		} catch {
			// The snippet still reads correctly with a placeholder; a missing key
			// is not worth blocking the step over.
			apiKey = 'YOUR_API_KEY';
		}
	}

	async function handlePick(event) {
		const t = event.detail.template;
		source = 'template';
		errorMessage = '';
		analytics.track('onboarding_template_picked', { template: t.id });

		waitStartedAt = Date.now();
		elapsedMs = null;
		try {
			const created = await startFromStarter(t.id);
			templateId = created.templateUid;
			variables = created.variables || [];
			const rendered = await renderOnboarding({ templateUid: templateId });
			url = rendered.url || '';
			elapsedMs = Date.now() - waitStartedAt;
			await loadKey();
			step = 'rendered';
		} catch (e) {
			errorMessage = e?.message || 'Could not start from that template.';
			step = 'pick';
		}
	}

	function handleGenerate(event) {
		prompt = event.detail.prompt;
		source = 'ai';
		errorMessage = '';
		analytics.track('onboarding_generate_started', { length: prompt.length });
		runGeneration();
	}

	/**
	 * Streams the generation so the wait teaches the pipeline: HTML first, then
	 * the variables it declared, then the render.
	 */
	let abortGeneration;

	async function runGeneration() {
		clearTimers();
		abortGeneration?.abort();
		abortGeneration = new AbortController();

		step = 'generating';
		stage = 0;
		lines = [];
		variables = [];
		agentStages = {};
		waitStartedAt = Date.now();
		elapsedMs = null;

		let buffered = '';

		await generateFromPrompt({
			prompt,
			signal: abortGeneration.signal,
			onStage: (s) => {
				// Preserve first-seen time so the feed's per-row timers survive
				// status updates on the same id, and freeze how long the step
				// took the moment it completes.
				const at = agentStages[s.id]?.at ?? Date.now();
				const tookMs = s.status === 'done' ? Date.now() - at : agentStages[s.id]?.tookMs;
				agentStages = { ...agentStages, [s.id]: { ...s, at, tookMs } };
			},
			onToken: (text) => {
				// The server streams raw tokens; the screen renders whole lines.
				buffered += text;
				const parts = buffered.split('\n');
				buffered = parts.pop() ?? '';
				// The model wraps its answer in a markdown fence. It is stripped
				// before the template is saved, so showing it here would put
				// something in the pane that is not in the file we render.
				const visible = parts.filter((l) => !/^\s*```/.test(l));
				if (visible.length) lines = [...lines, ...visible];
			},
			onTemplate: async (payload) => {
				if (buffered.trim() && !/^\s*```/.test(buffered)) lines = [...lines, buffered];
				templateId = payload.templateUid;
				stage = 1;
				// Land them one at a time — the point of the screen is watching the
				// contract get declared, not seeing a finished list appear.
				(payload.variables || []).forEach((v, i) => {
					timers.push(setTimeout(() => (variables = [...variables, v]), 360 * (i + 1)));
				});

				const settle = 360 * (payload.variables?.length || 0) + 300;
				timers.push(
					setTimeout(async () => {
						stage = 2;
						try {
							const rendered = await renderOnboarding({ templateUid: payload.templateUid });
							url = rendered.url || '';
							elapsedMs = Date.now() - waitStartedAt;
							await loadKey();
							analytics.track('onboarding_generate_completed');
							step = 'rendered';
						} catch (e) {
							errorMessage = e?.message || 'Rendered nothing. Try describing it again.';
							step = 'pick';
						}
					}, settle)
				);
			},
			onError: (err) => {
				// Back to the picker with the description intact — the worst possible
				// moment to make someone retype is right after a failure.
				errorMessage = err?.message || 'Could not write that template.';
				analytics.track('onboarding_generate_failed');
				step = 'pick';
			}
		});
	}

	/**
	 * Re-runs the render only. The template already exists server-side, so a
	 * failed image (dead CDN fetch, broken render) never sends anyone back
	 * through generation — their wait is one render long.
	 */
	async function handleRetry() {
		analytics.track('onboarding_render_retry', { source });
		waitStartedAt = Date.now();
		elapsedMs = null;
		try {
			const rendered = await renderOnboarding({ templateUid: templateId });
			// A fresh URL resets the rendered screen's failed state; if the same
			// URL comes back, the cache-buster still forces the image to retry.
			url = rendered.url ? `${rendered.url}${rendered.url.includes('?') ? '&' : '?'}r=${Date.now()}` : url;
			// Deliberately no elapsedMs here: the chip's claim ("written and
			// rendered in…") describes the first wait, which already happened.
		} catch {
			// Still down. The screen is already showing the failed state, and the
			// button stays there — nothing else honest to do.
		}
	}

	/** From the failed state: back to the picker with the description intact. */
	function handleEditDescription() {
		analytics.track('onboarding_edit_after_failure');
		step = 'pick';
	}

	function handleRedraw(event) {
		analytics.track('onboarding_redraw', { change: event.detail.change });
		recordRedraw().catch(() => {});
		// Re-runs with the change appended so the original description survives.
		// The variables must survive too — a fresh set would break any snippet
		// the user has already copied.
		prompt = `${prompt}\n\nChange: ${event.detail.change}`;
		runGeneration();
	}

	/**
	 * The one personalization question. Every answer is saved; only 'api' goes
	 * on to the curl walkthrough — the other paths get their setup on the
	 * dashboard home, where the declared card is waiting.
	 */
	async function handleFillAnswer(event) {
		const mode = event.detail.mode;
		analytics.track('onboarding_fill_answered', { mode, source });
		savePersonalization({ integrationMode: mode }).catch(() => {
			// A lost answer degrades to the home's default card — not worth
			// blocking the flow over.
		});
		if (mode === 'api') {
			goToIntegrate();
		} else {
			finish(`declared_${mode}`);
		}
	}

	/**
	 * Polls for the first render from a caller the user controls. There is no
	 * "I've done it" button because the server is the only thing that can know.
	 */
	let poll;
	function goToIntegrate() {
		analytics.track('onboarding_reached_integrate', { source });
		step = 'integrate';
		clearInterval(poll);
		poll = setInterval(async () => {
			try {
				const status = await getOnboardingV2Status();
				if (status?.received) {
					received = true;
					clearInterval(poll);
					analytics.track('onboarding_activated', { via: status.firstExternalRenderVia });
				}
			} catch {
				// A failed poll is not worth surfacing; the next one will retry.
			}
		}, 4000);
	}

	function finish(reason) {
		analytics.track('onboarding_finished', { reason, source });
		if (reason !== 'activated') skipOnboarding().catch(() => {});
		if (browser) sessionStorage.removeItem('pictify_just_signed_up');
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Get started | Pictify.io</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- onboarding-v2 opts this page out of the app-wide root font-size down-scale (see app.css). -->
<div class="onboarding-v2 flex min-h-screen w-full flex-col bg-brand-paper">
	<header class="flex h-[72px] w-full flex-shrink-0 items-center justify-between border-b border-brand-rule px-10">
		<a href="/" class="flex items-center gap-2.5" aria-label="Pictify home">
			<span class="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-brand-ink">
				<span class="block h-2.5 w-2.5 bg-brand-field"></span>
			</span>
			<span class="font-display text-[21px] font-extrabold tracking-[-0.03em] text-brand-ink">
				Pictify
			</span>
		</a>
		<div class="flex items-center gap-6">
			<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-mute">{stepLabel}</span>
			<button
				type="button"
				on:click={() => finish('exit')}
				class="font-sans text-sm text-brand-slate underline underline-offset-[3px]"
			>
				Skip setup
			</button>
		</div>
	</header>

	<main class="relative flex w-full flex-1 items-center justify-center overflow-hidden">
		<!-- Drawn on the Paper artboard: both cut by a page edge, like everywhere
		     else in the system — the corners carry the brand so the centre can
		     stay all work. -->
		<PixelCluster
			cells={[[2, 0, 'powder'], [1, 1, 'blue'], [2, 1, 'ink'], [0, 2, 'sky'], [2, 2, 'blue']]}
			cell={44}
			origin="sw"
			class="-bottom-[30px] -left-10 hidden lg:block"
		/>
		<Capsule
			from="r"
			drift={10}
			class="-right-[70px] top-6 hidden h-[46px] w-[200px] -rotate-[30deg] bg-brand-field lg:block"
		/>
		{#if step === 'pick'}
			<PickStep {prompt} {errorMessage} on:pick={handlePick} on:generate={handleGenerate} />
		{:else if step === 'generating'}
			<GeneratingStep
				{prompt}
				{lines}
				{variables}
				{stage}
				{agentStages}
				on:edit={() => {
					clearTimers();
					step = 'pick';
				}}
			/>
		{:else if step === 'rendered'}
			<RenderedStep
				{source}
				{variables}
				{url}
				{elapsedMs}
				on:next={() => {
					analytics.track('onboarding_reached_fill', { source });
					step = 'fill';
				}}
				on:redraw={handleRedraw}
				on:retry={handleRetry}
				on:edit={handleEditDescription}
			/>
		{:else if step === 'fill'}
			<FillStep on:answer={handleFillAnswer} />
		{:else}
			<IntegrateStep
				{apiKey}
				{templateId}
				{variables}
				{received}
				on:done={() => finish('activated')}
				on:skip={() => finish('skipped')}
			/>
		{/if}
	</main>
</div>
