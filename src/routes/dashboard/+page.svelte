<script>
	/**
	 * The press room. One layout, three swappable slots driven by observed
	 * facts — never by time or hand-waving:
	 *
	 *   S0  no template or no render yet   → setup ledger + starters + empty line
	 *   S1  renders, but none external     → key/invite strip + connect row
	 *   S2+ an external caller has printed → fills-from line + daybook + nudge
	 *
	 * Every promo module retires itself the moment the server observes the
	 * behavior it exists to cause. Dismissal is the escape hatch.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { analytics } from '$lib/telemetry.js';

	import Composer from '$lib/components/dashboard/v2/Composer.svelte';
	import SetupStrip from '$lib/components/dashboard/v2/SetupStrip.svelte';
	import NextStepCard from '$lib/components/dashboard/v2/NextStepCard.svelte';
	import ProofSheet from '$lib/components/dashboard/v2/ProofSheet.svelte';
	import JustPrinted from '$lib/components/dashboard/v2/JustPrinted.svelte';
	import DaybookChart from '$lib/components/dashboard/v2/DaybookChart.svelte';
	import UpgradeNudge from '$lib/components/dashboard/v2/UpgradeNudge.svelte';
	import GeneratingStep from '$lib/components/onboarding/v2/GeneratingStep.svelte';

	import { getTemplates } from '../../api/template.js';
	import { getImages, getGifs, getPdfs } from '../../api/media.js';
	import { checkApiHealth } from '../../api/image.js';
	import { getOnboardingV2Status, generateFromPrompt } from '../../api/onboarding-v2.js';
	import { usageWidget, plgStatus } from '../../store/plg.store';
	import { activeApiToken, getAPITokenAction, createAPITokenAction } from '../../store/user.store';
	import { currentTeam, teamMembers, createInvitationAction } from '../../store/team.store';
	import { personalization } from '../../store/onboarding.store';
	import { PUBLIC_DOCS_URL } from '$env/static/public';

	const DAY_MS = 86_400_000;
	const HIDE_SETUP_KEY = 'pictify_home_hide_setup';
	const HIDE_INVITE_KEY = 'pictify_home_hide_invite';

	let loaded = false;
	let templates = [];
	let totalTemplates = 0;
	let renders = [];
	let rendersTruncated = false;
	let hasStoredRender = false;
	let external = { received: false, via: null };
	let apiUp = null;
	let setupHidden = browser ? localStorage.getItem(HIDE_SETUP_KEY) === '1' : false;
	let inviteHidden = browser ? localStorage.getItem(HIDE_INVITE_KEY) === '1' : false;

	// The onboarding answer to "How will this template fill?". Silence renders
	// as 'api' — the key/curl card is account facts, the least ad-like default.
	// 'dashboard' (the explicit "just me" answer) renders no card at all.
	const MODE_MAP = {
		api: 'api',
		both: 'api',
		mcp: 'mcp',
		automation: 'automation',
		csv: 'csv',
		dashboard: 'dashboard',
		editor: 'dashboard'
	};
	$: declaredMode = MODE_MAP[$personalization?.integrationMode] || 'api';

	const FILL_LABELS = { api: 'YOUR CODE', mcp: 'AN AGENT', automation: 'AN AUTOMATION', csv: 'A SPREADSHEET' };
	$: otherFills = Object.keys(FILL_LABELS)
		.filter((m) => m !== declaredMode)
		.map((m) => FILL_LABELS[m])
		.join(' · ');

	// ---- facts → stage -------------------------------------------------------
	// Usage counts as proof of printing: onboarding renders bill quota without
	// persisting to media, so an empty media list alone doesn't mean "never
	// rendered".
	$: hasTemplate = totalTemplates > 0;
	$: hasRender = hasStoredRender || ($usageWidget?.current ?? 0) > 0;
	$: stage = !hasTemplate || !hasRender ? 's0' : external.received ? 's2' : 's1';

	$: quotaPct = $usageWidget?.percentage ?? 0;
	$: apiKey = $activeApiToken?.token || '';

	// ---- data ----------------------------------------------------------------
	const tagged = (list, format) => (list || []).map((r) => ({ ...r, format }));

	onMount(async () => {
		const [templatesData, imagesData, gifsData, pdfsData, status, health] = await Promise.all([
			getTemplates({ page: 1, limit: 4, sort: 'newest' }),
			getImages({ limit: 100 }),
			getGifs({ limit: 30 }),
			getPdfs({ limit: 30 }),
			getOnboardingV2Status().catch(() => null),
			checkApiHealth().catch(() => null)
		]);

		templates = templatesData?.templates || [];
		totalTemplates = templatesData?.pagination?.total ?? templates.length;

		const all = [
			...tagged(imagesData?.images, 'PNG'),
			...tagged(gifsData?.gifs, 'GIF'),
			...tagged(pdfsData?.pdfs, 'PDF')
		]
			.filter((r) => r.createdAt)
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
		renders = all;
		rendersTruncated = Boolean(
			imagesData?.pagination?.hasMore || gifsData?.pagination?.hasMore || pdfsData?.pagination?.hasMore
		);
		hasStoredRender =
			all.length > 0 ||
			(imagesData?.pagination?.total ?? 0) + (gifsData?.pagination?.total ?? 0) + (pdfsData?.pagination?.total ?? 0) > 0;

		if (status) external = { received: Boolean(status.received), via: status.firstExternalRenderVia || null };
		apiUp = health ? true : false;

		// The key chip and curl snippet need a real key; make one if the account
		// has none (parity with the old home).
		try {
			const existing = await getAPITokenAction();
			if (!existing?.apiTokens?.length) await createAPITokenAction();
		} catch {
			// Snippet falls back to a placeholder — not worth blocking the page.
		}

		loaded = true;
		analytics.track('home_v2_viewed', { stage });
	});

	// ---- derived slices ------------------------------------------------------
	$: justPrinted = renders.slice(0, 8);
	$: windowStart = Date.now() - 14 * DAY_MS;
	$: window14 = renders.filter((r) => new Date(r.createdAt).getTime() >= windowStart);
	$: prior14 = renders.filter((r) => {
		const t = new Date(r.createdAt).getTime();
		return t < windowStart && t >= Date.now() - 28 * DAY_MS;
	});
	// A truncated fetch can't make honest claims about the window or the trend.
	$: trendPct =
		!rendersTruncated && prior14.length > 0
			? Math.round(((window14.length - prior14.length) / prior14.length) * 100)
			: null;
	$: showChart = stage === 's2' && window14.length > 0 && !rendersTruncated;

	$: fillChips = (() => {
		const via = (external.via || '').toLowerCase();
		return [
			{ label: 'YOUR CODE', on: via.includes('api') || via.includes('code') },
			{ label: 'ZAPIER', on: via.includes('zapier') },
			{ label: 'CSV', on: via.includes('csv') || via.includes('batch') },
			{ label: 'MCP', on: via.includes('mcp') || via.includes('agent') }
		];
	})();

	function hideSetup() {
		setupHidden = true;
		if (browser) localStorage.setItem(HIDE_SETUP_KEY, '1');
		analytics.track('home_setup_hidden', { stage });
	}

	function hideInvite() {
		inviteHidden = true;
		if (browser) localStorage.setItem(HIDE_INVITE_KEY, '1');
		analytics.track('home_invite_hidden');
	}

	// The invite ask fires once, at the moment it's earned: first external
	// render landed, still a team of one.
	$: showInviteCard = stage === 's2' && !inviteHidden && ($teamMembers?.length || 1) <= 1;

	// ---- invite --------------------------------------------------------------
	let inviteBusy = false;
	let inviteResult = '';

	async function handleInvite(event) {
		if (!$currentTeam?.uid) {
			inviteResult = 'No team to invite into yet.';
			return;
		}
		inviteBusy = true;
		inviteResult = '';
		try {
			await createInvitationAction($currentTeam.uid, event.detail.email);
			inviteResult = `Invite sent to ${event.detail.email}.`;
			analytics.track('home_invite_sent');
		} catch (e) {
			inviteResult = e?.message || 'Could not send that invite.';
		} finally {
			inviteBusy = false;
		}
	}

	// ---- the press run -------------------------------------------------------
	let view = 'home';
	let prompt = '';
	let generateError = '';
	let lines = [];
	let variables = [];
	let genStage = 0;
	let agentStages = {};
	let abortGeneration;
	let timers = [];

	function clearTimers() {
		timers.forEach(clearTimeout);
		timers = [];
	}
	onDestroy(() => {
		clearTimers();
		abortGeneration?.abort();
	});

	async function runGeneration(event) {
		prompt = event.detail.prompt;
		generateError = '';
		analytics.track('home_generate_started', { length: prompt.length, stage });

		clearTimers();
		abortGeneration?.abort();
		abortGeneration = new AbortController();

		view = 'generating';
		genStage = 0;
		lines = [];
		variables = [];
		agentStages = {};

		let buffered = '';

		await generateFromPrompt({
			prompt,
			signal: abortGeneration.signal,
			onStage: (s) => {
				const at = agentStages[s.id]?.at ?? Date.now();
				const tookMs = s.status === 'done' ? Date.now() - at : agentStages[s.id]?.tookMs;
				agentStages = { ...agentStages, [s.id]: { ...s, at, tookMs } };
			},
			onToken: (text) => {
				buffered += text;
				const parts = buffered.split('\n');
				buffered = parts.pop() ?? '';
				const visible = parts.filter((l) => !/^\s*```/.test(l));
				if (visible.length) lines = [...lines, ...visible];
			},
			onTemplate: (payload) => {
				if (buffered.trim() && !/^\s*```/.test(buffered)) lines = [...lines, buffered];
				genStage = 1;
				(payload.variables || []).forEach((v, i) => {
					timers.push(setTimeout(() => (variables = [...variables, v]), 360 * (i + 1)));
				});
				const settle = 360 * (payload.variables?.length || 0) + 400;
				timers.push(
					setTimeout(() => {
						analytics.track('home_generate_completed');
						goto(`/template-workspace/html/${payload.templateUid}`);
					}, settle)
				);
			},
			onError: (err) => {
				generateError = err?.message || 'Could not write that template.';
				analytics.track('home_generate_failed');
				view = 'home';
			}
		});
	}
</script>

<svelte:head>
	<title>Home | Pictify.io</title>
</svelte:head>

{#if view === 'generating'}
	<div class="min-h-full w-full bg-brand-paper">
		<GeneratingStep
			{prompt}
			{lines}
			{variables}
			stage={genStage}
			{agentStages}
			on:edit={() => {
				clearTimers();
				abortGeneration?.abort();
				view = 'home';
			}}
		/>
	</div>
{:else}
	<div class="relative min-h-full w-full overflow-hidden px-6 py-8 lg:px-11 lg:py-9">
		<!-- Edge cluster: the app sharing the landing's cut-by-the-page-edge
		     decoration language. -->
		<div class="absolute -right-[26px] top-[60px] hidden flex-col lg:flex" aria-hidden="true">
			<div class="flex">
				<span class="block h-[26px] w-[26px]"></span>
				<span class="block h-[26px] w-[26px] bg-brand-powder"></span>
				<span class="block h-[26px] w-[26px] bg-brand-blue"></span>
			</div>
			<div class="flex">
				<span class="block h-[26px] w-[26px] bg-brand-sky"></span>
				<span class="block h-[26px] w-[26px] bg-brand-ink"></span>
				<span class="block h-[26px] w-[26px] bg-brand-powder"></span>
			</div>
		</div>

		<div class="mx-auto flex max-w-page flex-col gap-6">
			<div class="flex items-center justify-between">
				<span class="flex items-center gap-2">
					<span
						class="block h-[9px] w-[9px] {apiUp === false ? 'bg-[#B0483A]' : 'bg-brand-proof'} {apiUp === null
							? 'animate-pulse opacity-50'
							: ''}"
						aria-hidden="true"
					></span>
					<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-mute">
						{apiUp === null ? 'Checking…' : apiUp ? 'API up' : 'API down'}
					</span>
				</span>
				<a
					href={PUBLIC_DOCS_URL || 'https://docs.pictify.io'}
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-btn border-[1.5px] border-brand-rule px-3.5 py-2 font-sans text-[13px] font-semibold text-brand-slate hover:border-brand-ink hover:text-brand-ink"
				>
					Docs
				</a>
			</div>

			<div class="flex flex-col gap-4">
				<h1 class="font-display text-[34px] font-extrabold tracking-[-0.03em] text-brand-ink lg:text-[38px]">
					What do you need to make?
				</h1>
				<Composer bind:prompt busy={view === 'generating'} on:generate={runGeneration} />
				{#if generateError}
					<p role="alert" class="flex items-start gap-2.5 rounded-btn bg-brand-rose px-4 py-3 font-sans text-[15px] leading-[21px] text-brand-ink">
						<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-ink" aria-hidden="true"></span>
						{generateError} Your description is still in the ticket — adjust it and try again.
					</p>
				{/if}
			</div>

			{#if loaded}
				{#if stage === 's0' && !setupHidden}
					<SetupStrip variant="s0" {apiKey} {hasTemplate} on:hide={hideSetup} />
				{/if}

				{#if stage === 's1'}
					{#if declaredMode !== 'dashboard' && !setupHidden}
						<NextStepCard
							variant={declaredMode}
							{apiKey}
							templateName={templates[0]?.name || ''}
							variables={templates[0]?.variables || []}
						/>
					{/if}
					<div class="flex items-center justify-between px-0.5">
						<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">
							Also works with — {declaredMode === 'dashboard' ? Object.values(FILL_LABELS).join(' · ') : otherFills}
						</span>
						<a
							href="/dashboard/integrations"
							class="font-sans text-[12.5px] font-semibold text-brand-slate underline underline-offset-[3px]"
						>
							Set up another way
						</a>
					</div>
				{/if}

				{#if stage === 's2'}
					<div class="flex items-center justify-between border-y border-brand-rule py-2.5">
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">Fills from</span>
							{#each fillChips as chip (chip.label)}
								{#if chip.on}
									<span class="rounded-[3px] bg-brand-canvas px-[9px] py-[3px] font-mono text-[10px] tracking-[0.06em] text-brand-ink">
										{chip.label} ✓
									</span>
								{:else}
									<span class="rounded-[3px] border border-brand-rule px-[9px] py-[3px] font-mono text-[10px] tracking-[0.06em] text-brand-slate">
										+ {chip.label}
									</span>
								{/if}
							{/each}
						</div>
						<a
							href="/dashboard/integrations"
							class="font-sans text-[12.5px] font-semibold text-brand-slate underline underline-offset-[3px]"
						>
							Callers
						</a>
					</div>

					{#if showChart}
						<DaybookChart renders={window14} total={window14.length} {trendPct} />
					{/if}

					{#if showInviteCard}
						<div class="relative flex flex-col justify-between gap-3 overflow-hidden rounded-[10px] bg-brand-canvas px-[22px] py-4 sm:flex-row sm:items-center">
							<div class="flex flex-col gap-0.5">
								<div class="flex items-center gap-3">
									<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6B6B68]">
										Bring your team
									</span>
									<button
										type="button"
										on:click={hideInvite}
										class="font-mono text-[10px] text-brand-mute hover:text-brand-ink"
									>
										HIDE ✕
									</button>
								</div>
								<span class="font-sans text-[13px] text-brand-slate">
									Templates are shared. Everyone gets their own key, renders share one quota.
								</span>
								{#if inviteResult}
									<span class="font-mono text-[10.5px] text-brand-slate">{inviteResult}</span>
								{/if}
							</div>
							<form class="flex flex-shrink-0 items-center gap-2" on:submit|preventDefault={(e) => handleInvite({ detail: { email: e.target.email.value } })}>
								<input
									name="email"
									type="email"
									placeholder="teammate@yours.com"
									class="w-[200px] rounded-btn border-[1.5px] border-brand-rule bg-white px-3 py-2 font-mono text-[11px] text-brand-ink outline-none placeholder:text-brand-mute focus:border-brand-ink"
								/>
								<button
									type="submit"
									disabled={inviteBusy}
									class="rounded-btn bg-brand-ink px-4 py-2 font-sans text-xs font-bold text-white disabled:opacity-30"
								>
									{inviteBusy ? 'Inviting…' : 'Invite'}
								</button>
							</form>
						</div>
					{/if}
				{/if}

				<ProofSheet
					starters={stage === 's0'}
					{templates}
					on:use={(e) => {
						prompt = e.detail.seed;
						analytics.track('home_starter_seeded');
					}}
				/>

				{#if stage === 's2' && quotaPct >= 80}
					<UpgradeNudge percentage={quotaPct} resetDate={$plgStatus?.resetDate ?? null} />
				{/if}

				<JustPrinted renders={justPrinted} empty={stage === 's0' && justPrinted.length === 0} />
			{:else}
				<div class="flex flex-col gap-4" aria-hidden="true">
					<div class="h-[88px] animate-pulse rounded-[10px] bg-brand-canvas"></div>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{#each Array(4) as _}
							<div class="h-[220px] animate-pulse rounded-[10px] bg-brand-canvas"></div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
