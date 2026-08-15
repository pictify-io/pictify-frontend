<script>
	/**
	 * Callers — everything that renders through the account, on one switchboard.
	 *
	 * The v1 page was a directory of logos: a grid of things you could integrate
	 * with, none of which knew whether you actually had. This asks the opposite
	 * question — of the ways to reach the press, which ones are running, which
	 * has gone quiet, and which was never wired up. A caller only earns a card
	 * because it exists as a path, and it only shows a number because renders
	 * came through it.
	 *
	 * Storage connectors are deliberately absent. Delivery is not a caller.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { analytics } from '$lib/telemetry.js';
	import CallerCard from '$lib/components/dashboard/v2/CallerCard.svelte';
	import WebhooksTab from '$lib/components/dashboard/v2/WebhooksTab.svelte';
	import NextStepCard from '$lib/components/dashboard/v2/NextStepCard.svelte';
	import { getCallers } from '../../../api/media.js';
	import { getTemplates } from '../../../api/template.js';
	import { activeApiToken, getAPITokenAction } from '../../../store/user.store';

	// Shape, copy and glyph per caller. The stats come from the server; this is
	// everything the server has no opinion about.
	const CALLERS = [
		{
			source: 'api',
			name: 'Your code',
			glyph: 'M9 6L4 12l5 6M15 6l5 6-5 6',
			tint: '#D3E7F6',
			action: 'ROTATE KEY',
			variant: 'api',
			description: 'Call the render API from your backend with your key.'
		},
		{
			source: 'mcp',
			name: 'Agent',
			detail: 'Connected over MCP',
			glyph: 'M12 4v16M4 12h16M6.8 6.8l10.4 10.4M17.2 6.8L6.8 17.2',
			tint: '#FFD3E8',
			action: 'MCP SETUP',
			variant: 'mcp',
			description: 'Hand an agent the press — it renders on your behalf over MCP.'
		},
		{
			source: 'dashboard',
			name: 'Dashboard',
			detail: 'You, rendering by hand',
			glyph: 'M5 3l14 8-6.5 2L10 20 5 3z',
			tint: '#D8F34A',
			action: null,
			variant: null,
			description: 'Rendering by hand, right here.'
		},
		{
			source: 'automation',
			name: 'Automation',
			detail: 'Zapier, Make or n8n on a trigger',
			glyph: 'M13 2L5 14h6l-2 8 8-12h-6l2-8z',
			tint: '#A9D7F2',
			action: 'CHECK ZAP',
			variant: 'automation',
			description: 'Fire a render from a Zap, scenario or workflow step.'
		},
		{
			source: 'csv',
			name: 'A spreadsheet',
			detail: 'CSV batches',
			glyph: 'M4 4h16v16H4V4zM4 10h16M4 16h16M10 4v16',
			tint: '#E2E4DD',
			action: null,
			variant: 'csv',
			description: 'Upload a CSV — one row becomes one file, up to 500 rows a batch.'
		}
	];

	const AUTOMATION_HOME = 'https://zapier.com/apps/pictify';

	let loaded = false;
	let errorMessage = '';
	let stats = [];
	let windowStart = null;
	let unattributed = 0;
	let templates = [];
	let setupVariant = null;

	$: tab = $page.url.searchParams.get('tab') === 'webhooks' ? 'webhooks' : 'callers';

	$: apiKey = $activeApiToken?.token || '';
	$: keyMasked = apiKey ? `API key pic_live_••••${apiKey.slice(-5)}` : 'No API key yet';

	$: statsBySource = Object.fromEntries((stats || []).map((s) => [s.source, s]));

	/**
	 * "Not connected" means there is nothing wired up — not merely that nothing
	 * has rendered yet. Renders are one signal; configuration is another, and a
	 * path you have already set up should not be offering you "Set up".
	 *
	 * Dashboard is always live: you are standing in it. Your code is live the
	 * moment a key exists. MCP, automation and CSV leave no trace until they
	 * actually call, so for those a render is the only signal we have.
	 */
	const configured = (source) => {
		if (source === 'dashboard') return true;
		if (source === 'api') return Boolean(apiKey);
		return false;
	};

	$: callers = CALLERS.map((c) => {
		const stat = statsBySource[c.source] || {};
		return {
			...c,
			detail: c.source === 'api' ? keyMasked : c.detail,
			connected: Boolean(stat.connected) || configured(c.source),
			// Distinct from `connected`: has this caller ever actually rendered?
			// Set up but idle is not the same as working, and the header count
			// should mean working.
			hasRendered: Boolean(stat.connected),
			quiet: Boolean(stat.quiet),
			quietDays: stat.quietDays ?? null,
			renders: stat.renders ?? 0,
			lastRenderAt: stat.lastRenderAt ?? null
		};
	});
	$: liveCount = callers.filter((c) => c.hasRendered && !c.quiet).length;

	// Until a full month has passed since attribution shipped, the label names
	// the real start of the data rather than implying it covers the month.
	$: windowLabel = windowStart
		? `Renders since ${new Date(windowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
		: 'Renders';

	function pickTab(next) {
		const url = new URL($page.url);
		if (next === 'webhooks') url.searchParams.set('tab', 'webhooks');
		else url.searchParams.delete('tab');
		goto(`${url.pathname}${url.search}`, { replaceState: true, noScroll: true });
		analytics.track('callers_tab_switched', { tab: next });
	}

	function handleAction(event) {
		const caller = event.detail.caller;
		analytics.track('callers_action_clicked', {
			source: caller.source,
			connected: caller.connected
		});
		if (caller.source === 'api' && caller.connected) {
			goto('/dashboard/api-token');
			return;
		}
		if (caller.source === 'automation' && caller.connected) {
			window.open(AUTOMATION_HOME, '_blank', 'noopener');
			return;
		}
		setupVariant = caller.variant;
	}

	async function load() {
		errorMessage = '';
		try {
			const [callerData, templateData] = await Promise.all([
				getCallers(),
				getTemplates({ page: 1, limit: 1, sort: 'newest' }).catch(() => null)
			]);
			stats = callerData?.callers || [];
			windowStart = callerData?.windowStart || null;
			unattributed = callerData?.unattributed || 0;
			templates = templateData?.templates || [];
		} catch (e) {
			errorMessage = e?.message || 'Could not load your callers.';
		} finally {
			loaded = true;
		}
	}

	onMount(() => {
		getAPITokenAction().catch(() => {});
		load().then(() => analytics.track('callers_v2_viewed', { live: liveCount }));
	});
</script>

<svelte:head>
	<title>Callers | Pictify.io</title>
</svelte:head>

<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col">
		<div class="flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
			<div class="flex items-end gap-3">
				<h1 class="font-display text-[44px] font-extrabold leading-[44px] tracking-[-0.02em] text-brand-ink">
					Callers
				</h1>
				{#if loaded && tab === 'callers'}
					<span class="pb-1 font-mono text-xs tracking-[0.06em] text-brand-mute">
						{liveCount} LIVE
					</span>
				{/if}
			</div>
			<p class="font-sans text-sm text-brand-mute">
				{tab === 'webhooks'
					? 'Get a POST from Pictify every time a render finishes.'
					: 'Everything that renders through your account.'}
			</p>
		</div>

		<div class="flex gap-2 pt-6" role="tablist" aria-label="Callers sections">
			{#each [{ id: 'callers', label: 'CALLERS' }, { id: 'webhooks', label: 'WEBHOOKS' }] as t (t.id)}
				{@const active = tab === t.id}
				<button
					type="button"
					role="tab"
					aria-selected={active}
					on:click={() => pickTab(t.id)}
					class="rounded-btn border px-4 py-2 font-mono text-xs tracking-[0.06em] {active
						? 'border-brand-ink bg-brand-field font-medium text-brand-ink'
						: 'border-brand-rule bg-brand-paper text-brand-slate hover:border-brand-ink'}"
				>
					{t.label}
				</button>
			{/each}
		</div>

		{#if errorMessage}
			<p role="alert" class="mt-6 flex items-start gap-2.5 rounded-btn bg-brand-rose px-4 py-3 font-sans text-sm text-brand-ink">
				<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-ink" aria-hidden="true"></span>
				{errorMessage}
			</p>
		{/if}

		{#if tab === 'webhooks'}
			<WebhooksTab />
		{:else if !loaded}
			<div class="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
				{#each Array(5) as _}
					<div class="h-[239px] animate-pulse rounded-card bg-brand-canvas"></div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2 xl:grid-cols-3">
				{#each callers as caller (caller.source)}
					<CallerCard {caller} {windowLabel} on:action={handleAction} />
				{/each}
			</div>

			{#if unattributed > 0}
				<!-- Renders made before caller attribution existed can't be assigned
				     to a card. Saying so beats letting a busy account read as five
				     dead integrations. -->
				<p class="pt-4 font-mono text-xs tracking-[0.06em] text-brand-mute">
					Counts start {new Date(windowStart).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric'
					})} — {unattributed.toLocaleString()} older render{unattributed === 1 ? " isn't" : "s aren't"} attributed to a caller.
				</p>
			{/if}

			{#if setupVariant}
				<div class="flex flex-col gap-3 pt-8">
					<div class="flex items-center justify-between">
						<span class="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-mute">
							Set up — {CALLERS.find((c) => c.variant === setupVariant)?.name}
						</span>
						<button
							type="button"
							on:click={() => (setupVariant = null)}
							class="font-sans text-[13px] font-semibold text-brand-slate underline underline-offset-[3px]"
						>
							Close
						</button>
					</div>
					<NextStepCard
						variant={setupVariant}
						{apiKey}
						templateName={templates[0]?.name || ''}
						variables={templates[0]?.variables || []}
					/>
				</div>
			{/if}
		{/if}
	</div>
</div>
