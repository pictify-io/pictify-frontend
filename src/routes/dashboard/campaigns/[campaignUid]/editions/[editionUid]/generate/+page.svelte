<script>
	/**
	 * FE-13 — Generate (board `CVB-0`, spec D07).
	 *
	 * NO ETA, anywhere. The duration depends on 248 independent renders and any
	 * estimate would be wrong in a way the buyer would plan around. What the
	 * screen shows instead is what has actually happened, when it was last
	 * checked, and how often it is checking.
	 *
	 * Errors are SAFE CODES. A renderer message can quote the customer's own
	 * figures, and this table is the most screenshotted surface in the product —
	 * it ends up in tickets, in Slack, in email threads.
	 */
	import { getContext, onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import DitherBar from '$lib/components/campaigns/DitherBar.svelte';
	import { editionUrl } from '$lib/campaigns/nav';
	import {
		startRun,
		getRun,
		listRunItems,
		retryRun,
		cancelRun,
		startExport,
		newIdempotencyKey,
		campaignError
	} from '../../../../../../../api/campaign';
	import { campaignRunStarted } from '$lib/campaigns/analytics';

	const { edition, reload } = getContext('edition');

	$: campaignUid = $page.params.campaignUid;
	$: editionUid = $page.params.editionUid;

	let run = null;
	let items = [];
	let filter = 'failed';
	let error = null;
	let busy = null;
	let lastChecked = null;
	let pollSeconds = 3;
	let timer;

	$: counts = run?.counts || { total: 0, ready: 0, failed: 0, pending: 0, cancelled: 0 };
	$: failed = items.filter((i) => i.status === 'failed');
	$: ready = items.filter((i) => i.status === 'ready');
	$: shown = filter === 'failed' ? failed : filter === 'ready' ? ready : items;
	$: settled = ['ready', 'partial', 'failed', 'cancelled'].includes(run?.state);
	$: cancelling = run?.state === 'cancelling';
	$: canExport = run?.state === 'ready' && !busy;

	async function tick() {
		try {
			run = await getRun(run.runId);
			const data = await listRunItems(run.runId, { limit: 50, status: 'all' });
			items = data.items || [];
			lastChecked = new Date();

			// Back off to 30s once nothing is moving. Polling a settled run every
			// three seconds is noise for the server and tells the buyer nothing.
			const moving = ['accepted', 'queued', 'processing', 'cancelling'].includes(run.state);
			pollSeconds = moving ? 3 : 30;
			timer = setTimeout(tick, pollSeconds * 1000);
		} catch (err) {
			error = campaignError(err);
			// Keep trying; a dropped poll is not a failed run, and stopping would
			// leave the screen frozen on a stale count.
			timer = setTimeout(tick, 10000);
		}
	}

	async function begin() {
		error = null;

		/*
		 * B05-2. Do not start a run against an approval the campaign has outgrown.
		 *
		 * The server refuses this too, and this check is not a substitute for
		 * that one — it is here because this page starts a run the moment it
		 * opens. Without it the buyer's first sight of the problem is a failed
		 * run, which reads as something breaking rather than as a decision they
		 * still have to make.
		 */
		if ($edition?.approvalStale) {
			error = {
				message:
					'This campaign changed after it was approved — most likely a new design revision. Approve this version again before generating.'
			};
			return;
		}

		try {
			const started = await startRun(campaignUid, editionUid, {
				approvalId: $edition?.approvalId || $edition?.approval?.approvalUid,
				expectedRevision: $edition?.revision
			});
			run = { runId: started.runId, state: started.status, counts };
			campaignRunStarted({ state: started.status });
			await tick();
		} catch (err) {
			error = campaignError(err);
		}
	}

	onMount(begin);
	onDestroy(() => clearTimeout(timer));

	/**
	 * Retry. `itemIds` names specific cards; `null` means every failure.
	 *
	 * Null is not a shortcut — it is the only correct value for "Retry the N
	 * failed". The items table is one page of at most fifty, so retrying the
	 * ids it happens to hold would requeue fifty of two hundred failures under
	 * a button that says two hundred.
	 */
	async function doRetry(itemIds) {
		busy = 'retry';
		error = null;
		try {
			// One key per gesture, reused across network retries of that gesture.
			await retryRun(run.runId, {
				...(itemIds ? { itemIds } : {}),
				idempotencyKey: newIdempotencyKey()
			});
			await tick();
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	async function doCancel() {
		busy = 'cancel';
		error = null;
		try {
			await cancelRun(run.runId, { idempotencyKey: newIdempotencyKey() });
			await tick();
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	async function toExport() {
		busy = 'export';
		try {
			await startExport(run.runId, { idempotencyKey: newIdempotencyKey() });
			await reload();
			await goto(editionUrl(campaignUid, editionUid, 'export'));
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	const clock = (d) =>
		d
			? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
			: '—';

	$: headline = !run
		? 'Starting…'
		: run.state === 'ready'
		? `Ready · ${counts.ready} of ${counts.total} verified`
		: run.state === 'partial'
		? `Partial · ${counts.ready} ready, ${counts.failed} failed`
		: run.state === 'failed'
		? `Failed · ${counts.failed} of ${counts.total}`
		: run.state === 'cancelled'
		? 'Cancelled'
		: cancelling
		? 'Cancelling · leased work may still finish'
		: `Working · ${counts.ready} of ${counts.total}`;

	$: tone =
		run?.state === 'ready'
			? 'ready'
			: ['partial', 'failed'].includes(run?.state)
			? 'blocked'
			: 'current';
</script>

<div class="min-w-0 flex-1">
	<div class="rounded-md border border-brand-rule p-5">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<StatusSquare {tone} label={headline} />
			<!-- What it knows and how often it looks. Never how long is left. -->
			<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute">
				Last checked {clock(lastChecked)} · Polling {pollSeconds} s
			</span>
		</div>
		<p class="mt-1.5 font-sans text-[13px] text-brand-slate">
			{$edition?.periodLabel || ''} · revision {$edition?.revision ?? 1} · counts rebuilt from item states,
			not a timer.
		</p>

		<div class="mt-4">
			<DitherBar counts={{ ...counts, working: 0 }} />
		</div>

		<div class="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
			{#each [['bg-brand-proof', 'Ready', counts.ready], ['bg-brand-alarm', 'Failed', counts.failed], ['border border-brand-rule', 'Queued', counts.pending], ['bg-brand-rule', 'Cancelled', counts.cancelled]] as [cls, label, n] (label)}
				<span class="flex items-center gap-2">
					<span class="block h-2 w-2 {cls}" aria-hidden="true" />
					<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-slate"
						>{label} {n}</span
					>
				</span>
			{/each}
		</div>
	</div>

	{#if counts.failed > 0}
		<!--
			A6. What a partial run means, stated where the failures are.
			DELIBERATELY WITHOUT A BUTTON: the step's action bar at the foot already
			owns Retry, and a second one here would be two primaries doing the same
			thing on one screen — the rule this codebase keeps (handoff §2 decision
			2). What this adds is the fact the foot does not state: a retry
			re-renders only the failures, so pressing it is cheap and safe.
		-->
		<p class="mt-6 flex items-start gap-3 border-l-2 border-brand-alarm bg-brand-subtle p-4">
			<span class="min-w-0">
				<span class="block font-sans text-[14px] font-medium text-brand-ink">
					{counts.ready} of {counts.total} cards verified · {counts.failed} failed
				</span>
				<span class="mt-0.5 block font-sans text-[13px] leading-[19px] text-brand-slate">
					A retry re-renders only the {counts.failed}. Nothing already verified is made again.
				</span>
			</span>
		</p>
	{/if}

	<div class="mt-6 flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center rounded-btn border border-brand-rule bg-brand-paper p-0.5">
			{#each [['failed', 'Failed', failed.length], ['ready', 'Ready', ready.length], ['all', 'All', counts.total]] as [key, label, n] (key)}
				<button
					type="button"
					on:click={() => (filter = key)}
					class="h-8 rounded-[5px] px-3 font-sans text-[13px] {filter === key
						? 'bg-brand-subtle font-semibold text-brand-ink'
						: 'text-brand-slate'}"
					aria-pressed={filter === key}>{label} {n}</button
				>
			{/each}
		</div>
		<p class="font-sans text-[13px] text-brand-mute">
			Retries of this approved version don’t use another account allowance
		</p>
	</div>

	<div class="mt-4 overflow-x-auto">
		<table class="w-full min-w-[640px] border-collapse text-left">
			<thead>
				<tr class="border-b border-brand-ink">
					{#each ['Account id', 'Name', 'Attempts', 'Safe error', 'Action'] as head, i (head)}
						<th
							class="pb-2.5 font-mono text-[11.5px] font-normal uppercase tracking-[0.06em] text-brand-slate {i ===
							4
								? 'w-[92px] text-right'
								: ''}">{head}</th
						>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each shown as item (item.uid)}
					<tr class="border-b border-brand-rule">
						<td class="py-3 pr-3 font-mono text-[12.5px] text-brand-ink"
							>{item.externalAccountId}</td
						>
						<td class="max-w-[200px] truncate py-3 pr-3 font-sans text-[13.5px] text-brand-slate"
							>{item.accountName || '—'}</td
						>
						<td class="py-3 pr-3 font-mono text-[11.5px] text-brand-slate"
							>{item.attempts || 0} of 3</td
						>
						<td class="py-3 pr-3">
							{#if item.status === 'failed'}
								<!--
									The server's sentence, never the renderer's message and no
									longer the raw enum. `render_failed` told a customer success
									lead nothing about whether to retry, and the code is still
									there under Details for anyone who needs it.
								-->
								<StatusSquare
									tone="blocked"
									label={item.reason || item.errorCode || 'The card could not be rendered'}
								/>
							{:else if item.status === 'ready'}
								<StatusSquare tone="ready" label="Verified" />
							{:else}
								<StatusSquare tone="current" label={item.status} />
							{/if}
						</td>
						<td class="w-[92px] py-3 text-right">
							{#if item.status === 'failed'}
								<button
									type="button"
									disabled={busy !== null}
									on:click={() => doRetry([item.uid])}
									class="font-sans text-[13px] text-brand-royal hover:underline disabled:text-brand-mute"
									>Retry</button
								>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if !shown.length}
			<p class="py-8 text-center font-sans text-[13.5px] text-brand-mute">
				{filter === 'failed' ? 'No failures.' : 'Nothing here yet.'}
			</p>
		{/if}
	</div>

	{#if error}
		<p class="mt-4 flex items-start gap-2">
			<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
			<span class="font-sans text-[13.5px] text-brand-slate">{error.message}</span>
		</p>
	{/if}

	<div
		class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-brand-rule pt-5"
	>
		<p class="font-sans text-[13.5px] text-brand-slate">
			{#if run?.state === 'ready'}
				All {counts.ready} verified. Ready to package.
			{:else if cancelling}
				Cancelling. Work already started will finish.
			{:else}
				Export opens when all {counts.total} are verified.
			{/if}
		</p>
		<div class="flex items-center gap-3">
			{#if !settled}
				<button
					type="button"
					on:click={doCancel}
					disabled={busy !== null || cancelling}
					class="flex h-11 items-center rounded-btn border border-brand-rule px-4 font-sans text-[13.5px] text-brand-slate disabled:text-brand-mute"
					>{busy === 'cancel' ? 'Cancelling…' : 'Cancel run'}</button
				>
			{/if}
			<!--
				`counts.failed`, not the loaded page. The items table holds at most
				fifty rows, so a run with two hundred failures showed a button that
				said fifty and requeued fifty of them.
			-->
			{#if counts.failed > 0}
				<button
					type="button"
					on:click={() => doRetry(null)}
					disabled={busy !== null}
					class="flex h-11 items-center gap-2.5 rounded-btn bg-brand-plum px-4 font-sans text-[13.5px] text-white"
				>
					{busy === 'retry'
						? 'Retrying…'
						: `Retry ${counts.failed} ${counts.failed === 1 ? 'failure' : 'failures'}`}
					<span class="block h-2 w-2 bg-brand-field" aria-hidden="true" />
				</button>
			{:else}
				<button
					type="button"
					on:click={toExport}
					disabled={!canExport}
					class="flex h-11 items-center gap-2.5 rounded-btn px-4 font-sans text-[13.5px] {canExport
						? 'bg-brand-plum text-white'
						: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
				>
					{busy === 'export' ? 'Packaging…' : 'Continue to Export'}
					<span
						class="block h-2 w-2 {canExport ? 'bg-brand-field' : 'bg-brand-rule'}"
						aria-hidden="true"
					/>
				</button>
			{/if}
		</div>
	</div>
</div>

<aside class="w-full flex-shrink-0 xl:w-[340px]">
	<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">This run</p>
	<dl class="mt-3 border-t border-brand-ink">
		{#each [['Run id', run?.runId || '—'], ['State', run?.state || '—'], ['Metered outcomes', `${counts.ready} of ${counts.total}`], ['Automatic retries', String(run?.automaticRetries ?? 0)], ['Manual retries', String(run?.manualRetries ?? 0)]] as [label, value] (label)}
			<div class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2.5">
				<dt class="font-sans text-[13.5px] text-brand-slate">{label}</dt>
				<dd class="font-mono text-[11.5px] text-brand-ink">{value}</dd>
			</div>
		{/each}
	</dl>

	<div class="mt-5 rounded-md bg-brand-subtle p-4">
		<p class="font-sans text-[14px] font-bold text-brand-ink">
			Why a manual retry is still offered
		</p>
		<p class="mt-1.5 font-sans text-[13px] text-brand-slate">
			Automatic retries stop after three attempts. Transient errors can be retried by hand while the
			pilot’s retry budget lasts. Data or template errors need a revised edition; that edition draws
			on the same grant.
		</p>
	</div>
</aside>
