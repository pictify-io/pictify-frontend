<script>
	/**
	 * Webhooks as a dev tool, not a marketing surface: the endpoints you have,
	 * the secret you sign with, and whether the last few deliveries actually
	 * landed. The deliveries table is the point — an endpoint that "exists" tells
	 * you nothing, a 500 from twelve minutes ago tells you everything.
	 */
	import { onMount } from 'svelte';
	import { analytics } from '$lib/telemetry.js';
	import { timeAgo } from '$lib/utils/format.js';
	import { copyToClipboard } from '$lib/utils/format.js';
	import {
		getWebhookSubscriptions,
		getWebhookDeliveries,
		sendWebhookTest
	} from '../../../../api/integrations.js';

	let loaded = false;
	let endpoints = [];
	let deliveries = [];
	let deliveryTotal = 0;
	let errorMessage = '';
	let testingUid = '';
	let testResult = '';

	async function load() {
		errorMessage = '';
		try {
			const [subs, dels] = await Promise.all([
				getWebhookSubscriptions({ limit: 50 }),
				getWebhookDeliveries(20).catch(() => ({ deliveries: [], total: 0 }))
			]);
			endpoints = subs?.subscriptions || [];
			deliveries = dels?.deliveries || [];
			deliveryTotal = dels?.total || 0;
		} catch (e) {
			errorMessage = e?.message || 'Could not load your webhooks.';
		} finally {
			loaded = true;
		}
	}

	onMount(load);

	// One endpoint carries one event, so the same URL registered for
	// render.completed and render.failed is two rows in the database and one
	// endpoint to the user. Group them back.
	$: grouped = (() => {
		const byUrl = new Map();
		for (const e of endpoints) {
			const entry = byUrl.get(e.targetUrl) || {
				targetUrl: e.targetUrl,
				events: [],
				uids: [],
				status: e.status,
				secret: e.secret,
				lastDeliveryAt: null,
				lastDeliveryStatus: null
			};
			entry.events.push(e.event);
			entry.uids.push(e.uid);
			if (e.secret) entry.secret = e.secret;
			if (e.status === 'failed') entry.status = 'failed';
			else if (e.status === 'paused' && entry.status !== 'failed') entry.status = 'paused';
			if (e.lastDeliveryAt && (!entry.lastDeliveryAt || e.lastDeliveryAt > entry.lastDeliveryAt)) {
				entry.lastDeliveryAt = e.lastDeliveryAt;
				entry.lastDeliveryStatus = e.lastDeliveryStatus;
			}
			byUrl.set(e.targetUrl, entry);
		}
		return [...byUrl.values()];
	})();

	// The subscription's own `status` only flips to 'failed' after the model's
	// failure threshold, so a fresh endpoint bouncing every delivery still reads
	// 'active'. The last actual delivery is the truth, and it's already loaded.
	$: lastBySubscription = (() => {
		const map = new Map();
		for (const d of deliveries) {
			if (d.subscriptionUid && !map.has(d.subscriptionUid)) map.set(d.subscriptionUid, d);
		}
		return map;
	})();

	$: signingSecret = grouped.find((g) => g.secret)?.secret || null;
	$: maskedSecret = signingSecret
		? `whsec_••••${String(signingSecret).slice(-4)}`
		: null;

	/** 'paused' | 'failing' | 'delivering' | 'idle' */
	const health = (entry, lastMap) => {
		if (entry.status === 'paused') return 'paused';
		if (entry.status === 'failed') return 'failing';
		const recent = entry.uids.map((u) => lastMap.get(u)).filter(Boolean);
		if (recent.some((d) => d.status !== 'success')) return 'failing';
		if (recent.length) return 'delivering';
		return entry.lastDeliveryAt ? 'delivering' : 'idle';
	};

	async function test(entry) {
		testingUid = entry.uids[0];
		testResult = '';
		try {
			await sendWebhookTest(entry.uids[0]);
			testResult = entry.uids[0];
			analytics.track('webhook_test_sent');
			// The delivery lands through the queue, so the table needs a beat
			// before it can show the attempt.
			setTimeout(load, 2500);
		} catch (e) {
			errorMessage = e?.message || 'Could not send a test event.';
		} finally {
			testingUid = '';
		}
	}
</script>

{#if errorMessage}
	<p role="alert" class="flex items-start gap-2.5 rounded-btn bg-brand-rose px-4 py-3 font-sans text-sm text-brand-ink">
		<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-ink" aria-hidden="true"></span>
		{errorMessage}
	</p>
{/if}

{#if !loaded}
	<div class="flex flex-col gap-3 pt-8" aria-hidden="true">
		<div class="h-[42px] animate-pulse rounded-btn bg-brand-canvas"></div>
		<div class="h-[73px] animate-pulse rounded-btn bg-brand-canvas"></div>
	</div>
{:else if grouped.length === 0}
	<div class="mt-8 flex flex-col items-center gap-4 rounded-tile border border-brand-rule px-8 pb-12 pt-11 text-center">
		<img src="/landing/mascot-press-empty.jpg" alt="" class="h-[250px] w-[340px] object-contain" aria-hidden="true" />
		<div class="flex flex-col items-center gap-1.5">
			<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">No endpoint yet</span>
			<span class="font-display text-xl font-extrabold tracking-[-0.02em] text-brand-ink">
				Add an endpoint and every finished render POSTs to you.
			</span>
			<span class="font-sans text-[13.5px] text-brand-slate">
				Signed with a shared secret, retried on failure, one POST per render.
			</span>
		</div>
		<a
			href="/dashboard/integrations/webhooks"
			class="mt-1 flex items-center gap-2 rounded-md bg-brand-ink px-[18px] py-2.5 font-sans text-[13px] font-bold text-white transition-opacity hover:opacity-90"
		>
			Add endpoint
			<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
		</a>
	</div>
{:else}
	<section class="flex w-full flex-col pt-8">
		<div class="flex items-center gap-3 pb-3">
			<h2 class="font-mono text-xs font-medium uppercase tracking-[0.06em] text-brand-ink">Endpoints</h2>
			<span class="h-0.5 flex-1 bg-brand-ink/[0.08]"></span>
			<a
				href="/dashboard/integrations/webhooks"
				class="rounded-btn border border-brand-rule px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
			>
				+ Add endpoint
			</a>
		</div>

		{#each grouped as entry (entry.targetUrl)}
			{@const state = health(entry, lastBySubscription)}
			<div class="flex w-full items-center gap-4 border-b border-brand-rule py-[18px]">
				<span class="flex w-4 flex-shrink-0 items-center justify-center">
					<span
						class="block h-[9px] w-[9px] {state === 'failing'
							? 'bg-brand-alarm'
							: state === 'delivering'
								? 'bg-brand-proof'
								: 'bg-brand-mute'}"
						aria-hidden="true"
					></span>
				</span>
				<div class="flex min-w-0 flex-1 flex-col gap-1">
					<span class="truncate font-mono text-sm font-medium text-brand-ink">{entry.targetUrl}</span>
					<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
						Events — {entry.events.join(' · ')}
					</span>
				</div>
				<div class="flex w-[190px] flex-shrink-0 flex-col items-end gap-1">
					<span
						class="font-mono text-sm font-medium {state === 'failing'
							? 'text-brand-alarm'
							: 'text-brand-ink'}"
					>
						{state}
					</span>
					<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
						{entry.lastDeliveryAt ? `Last event — ${timeAgo(entry.lastDeliveryAt)}` : 'No events yet'}
					</span>
				</div>
				<div class="flex flex-shrink-0 gap-2">
					<button
						type="button"
						on:click={() => test(entry)}
						disabled={testingUid === entry.uids[0]}
						class="rounded-btn border border-brand-rule px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink disabled:opacity-60"
					>
						{testResult === entry.uids[0] ? 'SENT' : 'SEND TEST'}
					</button>
					<a
						href="/dashboard/integrations/webhooks"
						class="rounded-btn border border-brand-rule px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
					>
						MANAGE
					</a>
				</div>
			</div>
		{/each}

		{#if maskedSecret}
			<div class="flex items-center gap-3 pt-3.5">
				<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">Signing secret</span>
				<span class="font-mono text-xs font-medium text-brand-ink">{maskedSecret}</span>
				<button
					type="button"
					on:click={() => copyToClipboard(signingSecret, 'Signing secret copied')}
					class="rounded-btn border border-brand-rule px-2 py-1 font-mono text-[10px] font-medium tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
				>
					COPY
				</button>
			</div>
		{/if}
	</section>

	<section class="flex w-full flex-col pt-10">
		<div class="flex items-center gap-3 pb-1">
			<h2 class="font-mono text-xs font-medium uppercase tracking-[0.06em] text-brand-ink">
				Recent deliveries
			</h2>
			<span class="h-0.5 flex-1 bg-brand-ink/[0.08]"></span>
			<span class="font-mono text-xs uppercase tracking-[0.06em] text-brand-mute">
				Last 24 hours — {deliveryTotal}
			</span>
		</div>

		{#if deliveries.length === 0}
			<p class="py-6 font-sans text-sm text-brand-slate">
				Nothing delivered in the last 24 hours. Send a test to check the endpoint end to end.
			</p>
		{:else}
			{#each deliveries as d (d.uid)}
				{@const failed = d.status !== 'success'}
				<div class="flex w-full items-center gap-4 border-b border-brand-rule py-3.5">
					<span
						class="w-[52px] flex-shrink-0 font-mono text-[11px] font-semibold tracking-[0.06em] {failed
							? 'text-brand-alarm'
							: 'text-brand-proof'}"
					>
						{d.httpStatus || (failed ? 'ERR' : '200')}
					</span>
					<span class="w-[220px] flex-shrink-0 truncate font-mono text-xs text-brand-ink">
						{d.event || 'delivery'}
					</span>
					<span class="min-w-0 flex-1 truncate font-mono text-xs {failed ? 'text-brand-alarm' : 'text-brand-mute'}">
						{d.description || d.targetUrl || ''}
					</span>
					<span class="w-[110px] flex-shrink-0 text-right font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
						{timeAgo(d.createdAt)}
					</span>
					<span class="flex w-[110px] flex-shrink-0 justify-end">
						<a
							href="/dashboard/activity-logs"
							class="rounded-btn border border-brand-rule px-2 py-1 font-mono text-[10px] font-medium tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
						>
							PAYLOAD
						</a>
					</span>
				</div>
			{/each}
		{/if}
	</section>
{/if}
