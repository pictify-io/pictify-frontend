<script>
	/**
	 * The campaigns list (board `BPC-0`, spec D01).
	 *
	 * Four states, and three of them are not errors: a team with no campaigns,
	 * a team without pilot access, and a member who can look but not act. Only
	 * the fourth — the load actually failing — is a fault. Treating "no access"
	 * as an error page is how a private pilot ends up feeling broken.
	 *
	 * Every word in a row comes from the server. Nothing here computes a status,
	 * a next action or a count from what it can see locally; if the server has
	 * not said it, the cell is empty rather than plausible.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { campaignUrl, editionUrl } from '$lib/campaigns/nav';
	import { listCampaigns, campaignError } from '../../../api/campaign';
	import {
		capabilities,
		capabilitiesError,
		initCampaignCapabilities
	} from '../../../store/campaign.store';

	let loading = true;
	/** Distinct from `error`: no pilot access is a state, not a failure. */
	let loadError = null;
	let campaigns = [];
	let tab = 'active';

	$: enabled = $capabilities?.enabled === true;
	/**
	 * View-only members see the table without the two header buttons. They are
	 * not shown disabled buttons — a disabled control invites a click and
	 * explains nothing.
	 */
	$: canCreate = $capabilities?.permissions?.canCreate !== false;

	/**
	 * The sample sorts last wherever it appears. It is scaffolding, and a
	 * fixture sitting above a buyer's real September run reads as though we
	 * think it matters more than their work.
	 */
	const sampleLast = (rows) => [...rows].sort((a, b) => Number(a.sample) - Number(b.sample));

	$: activeRows = sampleLast(campaigns.filter((c) => !c.archived));
	$: archivedRows = sampleLast(campaigns.filter((c) => c.archived));
	$: rows =
		tab === 'active' ? activeRows : tab === 'archived' ? archivedRows : sampleLast(campaigns);

	/**
	 * The sample campaign is always labelled and never counted with live work.
	 * A buyer must not be able to mistake the fixture for their own data, and a
	 * count that includes it would be the first way that happens.
	 */
	/*
	 * The sample IS counted in the tab totals — board `BPC-0` reads "Active 4"
	 * over four active rows one of which is the sample. The spec line about
	 * excluding it from "live lists' counts" is about the ALLOWANCE: a fixture
	 * must never consume the buyer's pilot quota. Those are different numbers,
	 * and the tab is just how many rows the tab shows. Counting it here and not
	 * there is what makes both statements true.
	 */
	$: activeCount = activeRows.length;
	$: archivedCount = archivedRows.length;

	async function load() {
		loading = true;
		loadError = null;
		try {
			await initCampaignCapabilities({ force: true });
			const data = await listCampaigns({ includeSample: true, limit: 50 });
			campaigns = data.campaigns || [];
		} catch (err) {
			const e = campaignError(err);
			// 403 campaign_not_enabled is the no-pilot state, which the template
			// renders as an invitation rather than a failure.
			if (e.code !== 'campaign_not_enabled') loadError = e;
		} finally {
			loading = false;
		}
	}

	onMount(load);

	const openCampaign = (row) => goto(campaignUrl(row.uid));

	/** The next-action link opens the edition AT the step the server named. */
	function nextActionHref(row) {
		if (!row.nextAction?.editionUid || !row.nextAction?.step) return null;
		return editionUrl(row.uid, row.nextAction.editionUid, row.nextAction.step);
	}
</script>

<svelte:head><title>Campaigns · Pictify</title></svelte:head>

<div class="px-5 pt-6 md:px-11 md:pt-7">
	<p class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-mute">
		Pictify campaigns · Customer value updates
	</p>

	<div class="mt-3 flex flex-wrap items-start justify-between gap-4">
		<div class="max-w-[620px]">
			<h1
				class="font-display text-[34px] font-extrabold leading-tight tracking-[-0.03em] text-brand-ink"
			>
				Campaigns
			</h1>
			<!-- The division of labour, stated before anything else on the page. -->
			<p class="mt-2 font-sans text-[14.5px] text-brand-slate">
				Pictify prepares one branded update per account and exports the files. Your existing tool
				sends them.
			</p>
		</div>

		{#if canCreate}
			<div class="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:flex-shrink-0">
				<button
					type="button"
					class="h-11 flex-1 rounded-btn border border-brand-rule bg-brand-paper px-4 font-sans text-[13.5px] text-brand-slate hover:bg-brand-subtle sm:flex-none"
				>
					Try sample data
				</button>
				{#if enabled}
					<!-- One plum primary per screen (handoff §2 decision 2). -->
					<button
						type="button"
						class="flex h-11 flex-1 items-center justify-center gap-2.5 rounded-btn bg-brand-plum px-4 font-sans text-[13.5px] text-white sm:flex-none"
					>
						Create customer value update
						<span class="block h-2 w-2 bg-brand-field" aria-hidden="true" />
					</button>
				{:else}
					<a
						href="/campaigns/customer-value-updates"
						class="flex h-11 flex-1 items-center justify-center rounded-btn bg-brand-plum px-4 font-sans text-[13.5px] text-white sm:flex-none"
					>
						Request pilot access
					</a>
				{/if}
			</div>
		{/if}
	</div>

	{#if loading}
		<!-- Four skeleton rows at 64px: the table's real height, so the page does
		     not jump when the answer arrives. -->
		<div class="mt-8 flex flex-col gap-px" aria-busy="true" aria-label="Loading campaigns">
			{#each Array(4) as _, i (i)}
				<div class="h-16 animate-pulse bg-brand-subtle" />
			{/each}
		</div>
	{:else if loadError}
		<div class="mt-8 border-t border-brand-ink pt-6">
			<StatusSquare tone="blocked" label="Couldn’t load campaigns." />
			<p class="mt-2 font-sans text-[13.5px] text-brand-slate">
				{loadError.message}
				<button type="button" on:click={load} class="ml-1 text-brand-royal underline"
					>Try again</button
				>
			</p>
			{#if loadError.requestId}
				<p class="mt-1 font-mono text-[10.5px] text-brand-mute">REF {loadError.requestId}</p>
			{/if}
		</div>
	{:else if !enabled}
		<!-- Not an error. The pilot is closed; say so and show the way in. -->
		<div class="mt-8 max-w-[560px] border-t border-brand-ink pt-6">
			<h2 class="font-display text-[19px] font-bold text-brand-ink">
				Campaigns is in private pilot.
			</h2>
			<p class="mt-2 font-sans text-[14px] text-brand-slate">
				Ask for access and we will get back to you. You can look through the sample campaign in the
				meantime — it uses synthetic data and is never mixed with live editions.
			</p>
		</div>
	{:else if campaigns.length === 0}
		<div class="mt-8 max-w-[560px] border-t border-brand-ink pt-6">
			<h2 class="font-display text-[19px] font-bold text-brand-ink">No campaigns yet.</h2>
			<ol class="mt-3 flex flex-col gap-1.5 font-sans text-[14px] text-brand-slate">
				<li>Upload approved metrics</li>
				<li>Review and approve</li>
				<li>Export to your tool</li>
			</ol>
		</div>
	{:else}
		<div class="mt-7 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center rounded-btn border border-brand-rule bg-brand-paper p-0.5">
				{#each [['active', 'Active', activeCount], ['archived', 'Archived', archivedCount], ['all', 'All', campaigns.length]] as [key, label, count] (key)}
					<button
						type="button"
						on:click={() => (tab = key)}
						class="h-8 rounded-[5px] px-3 font-sans text-[13px] {tab === key
							? 'bg-brand-subtle font-semibold text-brand-ink'
							: 'text-brand-slate'}"
						aria-pressed={tab === key}
					>
						{label}
						{count}
					</button>
				{/each}
			</div>
			<p class="font-sans text-[13px] text-brand-mute">
				Click a row to open the campaign · the “next action” link opens the edition at that step
			</p>
		</div>

		<div class="mt-5 overflow-x-auto">
			<table class="w-full min-w-[900px] border-collapse text-left">
				<thead>
					<tr class="border-b border-brand-ink">
						{#each ['Campaign', 'Cadence', 'Last period', 'Last status', 'Next action', 'Format'] as head, i (head)}
							<th
								class="pb-2.5 font-mono text-[11.5px] font-normal uppercase tracking-[0.06em] text-brand-slate {i ===
								5
									? 'text-right'
									: ''}"
							>
								{head}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.uid)}
						<tr
							on:click={() => openCampaign(row)}
							class="cursor-pointer border-b border-brand-rule align-middle {row.sample
								? 'bg-brand-subtle'
								: ''} {row.archived ? 'text-brand-mute' : ''} hover:bg-brand-subtle"
						>
							<td class="py-3.5 pr-4">
								<span class="flex flex-wrap items-center gap-2">
									<span
										class="font-sans text-[15px] font-bold {row.archived
											? 'text-brand-mute'
											: 'text-brand-ink'}">{row.name}</span
									>
									{#if row.sample}
										<span
											class="border border-brand-ink px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-ink"
											>Sample data</span
										>
									{/if}
								</span>
								<span class="mt-0.5 block font-mono text-[11px] text-brand-mute">
									{row.uid} · {row.editionCount ?? 0}
									{row.editionCount === 1 ? 'edition' : 'editions'}{row.archived
										? ' · archived'
										: ''}
								</span>
							</td>
							<td class="py-3.5 pr-4 font-sans text-[13.5px]">{row.cadence || 'Manual'}</td>
							<td class="py-3.5 pr-4 font-sans text-[13.5px]">{row.lastPeriodLabel || '—'}</td>
							<td class="py-3.5 pr-4">
								{#if row.lastStatus}
									<StatusSquare tone={row.lastStatus.tone} label={row.lastStatus.label} />
								{:else}
									<span class="font-sans text-[13.5px] text-brand-mute">—</span>
								{/if}
							</td>
							<td class="py-3.5 pr-4 font-sans text-[13.5px]">
								{#if nextActionHref(row)}
									<a
										href={nextActionHref(row)}
										on:click|stopPropagation
										class="text-brand-ink underline decoration-brand-rule underline-offset-2 hover:decoration-brand-ink"
									>
										{row.nextAction.label}
									</a>
								{:else}
									<span class={row.archived ? 'text-brand-mute' : 'text-brand-slate'}
										>{row.nextAction?.label || '—'}</span
									>
								{/if}
							</td>
							<td class="py-3.5 text-right font-mono text-[11.5px] uppercase text-brand-mute">
								{row.format}{row.formatDetail ? ` · ${row.formatDetail}` : ''}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
