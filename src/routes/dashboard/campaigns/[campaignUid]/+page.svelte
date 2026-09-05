<script>
	/**
	 * FE-15 / FE-16 — Campaign detail and the delete dialog (boards `DHL-0`,
	 * `DLG-0`; spec D09, D10).
	 *
	 * Two ideas the screen exists to keep apart, because conflating them is how
	 * a buyer destroys data they meant to keep:
	 *
	 *   ARCHIVE hides the campaign and blocks new editions. It deletes nothing
	 *   and changes no retention. It is a header button.
	 *   DELETE destroys one edition's customer data. It lives at the bottom of
	 *   the config panel under its own heading, needs owner/admin, and needs the
	 *   period typed back.
	 *
	 * "New period" copies configuration ONLY. Last month's audience and figures
	 * are never carried over — presenting August's numbers as September's is the
	 * worst thing this product could do, so there is no path that does it.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { campaignsHome, editionUrl } from '$lib/campaigns/nav';
	import {
		getCampaign,
		createEdition,
		archiveCampaign,
		requestEditionDeletion,
		getDeletion,
		campaignError
	} from '../../../../api/campaign';
	import { capabilities, initCampaignCapabilities } from '../../../../store/campaign.store';
	import { campaignNewPeriod } from '$lib/campaigns/analytics';

	$: campaignUid = $page.params.campaignUid;

	let campaign = null;
	let editions = [];
	let loading = true;
	let error = null;
	let busy = null;

	/** The delete dialog. Held here so the dimmed backdrop is this page. */
	let deleting = null;
	let typed = '';
	let deletionStatus = null;
	let statusTimer;

	$: canPurge = $capabilities?.permissions?.canPurge === true;
	$: canEdit = $capabilities?.permissions?.canEdit === true;
	/** The typed confirmation must match exactly — no trimming games. */
	$: confirmed = deleting ? typed === `delete ${deleting.period}` : false;

	async function load() {
		loading = true;
		error = null;
		try {
			await initCampaignCapabilities();
			const data = await getCampaign(campaignUid);
			campaign = data.campaign;
			editions = data.editions || [];
		} catch (err) {
			error = campaignError(err);
		} finally {
			loading = false;
		}
	}
	onMount(load);

	async function newPeriod() {
		busy = 'period';
		error = null;
		try {
			// The server returns an existing draft for the period rather than
			// forking one, so clicking twice resumes instead of splitting work.
			const period = new Date().toISOString().slice(0, 7);
			const result = await createEdition(campaignUid, { period });
			campaignNewPeriod({ resumed: Boolean(result?.resumed), editions: editions.length });
			await goto(editionUrl(campaignUid, result.edition.uid, 'data'));
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	async function archive() {
		busy = 'archive';
		error = null;
		try {
			await archiveCampaign(campaignUid, campaign.configVersion);
			await goto(campaignsHome());
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	async function confirmDelete() {
		if (!confirmed) return;
		busy = 'delete';
		error = null;
		try {
			const result = await requestEditionDeletion(campaignUid, deleting.uid, {
				confirmation: typed
			});
			deletionStatus = { state: result.state || 'requested', deletionId: result.deletionId };
			deleting = null;
			typed = '';
			pollDeletion(result.deletionId);
			await load();
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	/**
	 * Poll until the server says purged. It reports `purged` only after the
	 * object prefix comes back empty, so this is the one place the UI is allowed
	 * to say the data is gone.
	 */
	async function pollDeletion(deletionId) {
		try {
			const status = await getDeletion(deletionId);
			deletionStatus = status;
			if (!['purged', 'purge_failed'].includes(status.state)) {
				statusTimer = setTimeout(() => pollDeletion(deletionId), 3000);
			} else {
				await load();
			}
		} catch {
			// A dropped poll is not a failed purge; the row state still shows it.
		}
	}
</script>

<svelte:head><title>{campaign?.name || 'Campaign'} · Pictify</title></svelte:head>

<div data-v2 class="px-5 pt-6 md:px-11 md:pt-7">
	{#if loading}
		<div class="h-64 animate-pulse bg-brand-subtle" aria-busy="true" />
	{:else if error && !campaign}
		<StatusSquare tone="blocked" label={error.message} />
	{:else if campaign}
		<div class="flex flex-wrap items-center gap-2.5">
			<a href={campaignsHome()} class="font-sans text-[14px] text-brand-mute hover:text-brand-slate"
				>Campaigns</a
			>
			<span class="font-sans text-[14px] text-brand-mute" aria-hidden="true">/</span>
			<span class="font-mono text-[12px] text-brand-mute">{campaign.uid}</span>
		</div>

		<div class="mt-3 flex flex-wrap items-start justify-between gap-4">
			<div class="max-w-[620px]">
				<h1
					class="font-display text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-brand-ink"
				>
					{campaign.name}
				</h1>
				<!-- Names the DESIGN revision, not a preset: presets are no longer a
				     product surface (studio handoff §5). -->
				<p class="mt-1.5 font-sans text-[14px] text-brand-slate">
					{campaign.format?.toUpperCase()}{campaign.formatDetail
						? ` · ${campaign.formatDetail}`
						: ''} ·
					{campaign.metricCount}
					{campaign.metricCount === 1 ? 'metric' : 'metrics'} · design {campaign.templateRevisionUid}
					· config v{campaign.configVersion}
				</p>
			</div>
			{#if canEdit}
				<div class="flex flex-wrap items-center gap-3">
					<button
						type="button"
						on:click={archive}
						disabled={busy !== null || campaign.archived}
						class="flex h-11 items-center rounded-btn border border-brand-rule px-4 font-sans text-[13.5px] text-brand-slate disabled:text-brand-mute"
						>{campaign.archived ? 'Archived' : 'Archive'}</button
					>
					<button
						type="button"
						on:click={newPeriod}
						disabled={busy !== null || campaign.archived}
						class="flex h-11 items-center gap-2.5 rounded-btn bg-brand-plum px-4 font-sans text-[13.5px] text-white disabled:bg-brand-subtle disabled:text-brand-mute"
					>
						{busy === 'period' ? 'Opening…' : 'New period'}
						<span class="block h-2 w-2 bg-brand-field" aria-hidden="true" />
					</button>
				</div>
			{/if}
		</div>

		<div class="mt-8 flex flex-col gap-10 pb-16 xl:flex-row">
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-baseline justify-between gap-2">
					<h2 class="font-display text-[17px] font-bold text-brand-ink">Editions</h2>
					<p class="font-sans text-[13px] text-brand-mute">
						One per reporting period · every period needs its own approval
					</p>
				</div>

				<div class="mt-3 overflow-x-auto">
					<table class="w-full min-w-[680px] border-collapse text-left">
						<thead>
							<tr class="border-b border-brand-ink">
								{#each ['Period', 'Rev', 'State', 'Audience', 'Expires', 'Open'] as head, i (head)}
									<th
										class="pb-2.5 font-mono text-[11.5px] font-normal uppercase tracking-[0.06em] text-brand-slate {i ===
										5
											? 'w-[92px] text-right'
											: ''}">{head}</th
									>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each editions as row (row.uid)}
								<tr class="border-b border-brand-rule {row.muted ? 'text-brand-mute' : ''}">
									<td
										class="py-3.5 pr-3 font-sans text-[14px] {row.muted
											? ''
											: 'font-semibold text-brand-ink'}">{row.periodLabel || row.period}</td
									>
									<td class="py-3.5 pr-3 font-mono text-[11.5px] text-brand-mute"
										>rev {row.revision}</td
									>
									<td class="py-3.5 pr-3">
										<StatusSquare tone={row.state.tone} label={row.state.label} />
									</td>
									<td class="py-3.5 pr-3 font-sans text-[13px] text-brand-slate">{row.audience}</td>
									<td class="py-3.5 pr-3 font-mono text-[11px] text-brand-mute"
										>{row.expires || '—'}</td
									>
									<td class="w-[92px] py-3.5 text-right">
										{#if row.open.step}
											<a
												href={editionUrl(campaignUid, row.uid, row.open.step)}
												class="font-sans text-[13px] text-brand-royal hover:underline"
												>{row.open.label}</a
											>
										{:else}
											<span class="font-sans text-[13px] text-brand-mute">{row.open.label}</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if deletionStatus}
					<div class="mt-5 rounded-md border border-brand-rule p-4">
						<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
							Deletion {deletionStatus.deletionId || ''}
						</p>
						<!-- Only 'purged' means gone, and only the server may say it. -->
						<p class="mt-2">
							{#if deletionStatus.state === 'purged'}
								<StatusSquare tone="ready" label="Purged · files verified removed" />
							{:else if deletionStatus.state === 'purge_failed'}
								<StatusSquare
									tone="blocked"
									label={`Purge failed · ${deletionStatus.failureReason || 'files remain'}`}
								/>
							{:else}
								<StatusSquare tone="current" label="Purging · data access already blocked" />
							{/if}
						</p>
					</div>
				{/if}
			</div>

			<aside class="w-full flex-shrink-0 xl:w-[340px]">
				<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
					Saved configuration · v{campaign.configVersion}
				</p>
				<dl class="mt-3 border-t border-brand-ink">
					{#each [['Format', `${campaign.format?.toUpperCase()}${campaign.formatDetail ? ` · ${campaign.formatDetail}` : ''}`], ['Metrics', (campaign.metrics || [])
								.map((m) => m.label)
								.join(' · ') || '—'], ['Cadence', campaign.cadence || 'Manual'], ['Locale · timezone', `${campaign.locale} · ${campaign.timezone}`]] as [label, value] (label)}
						<div
							class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2.5"
						>
							<dt class="font-sans text-[13px] text-brand-slate">{label}</dt>
							<dd class="max-w-[190px] truncate text-right font-sans text-[13px] text-brand-ink">
								{value}
							</dd>
						</div>
					{/each}
				</dl>

				<div class="mt-5 rounded-md border-2 border-brand-ink p-4">
					<p class="font-sans text-[14px] font-bold text-brand-ink">
						New period copies configuration only
					</p>
					<p class="mt-1.5 font-sans text-[13px] text-brand-slate">
						You set new dates and upload fresh values. A previous audience and its figures are never
						carried over. If a draft already exists for the period you pick, we open it instead of
						creating a second one.
					</p>
				</div>

				<!-- Deletion lives here, under its own heading, away from Archive. -->
				<p class="mt-6 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
					Data and deletion
				</p>
				{#if canPurge}
					<div class="mt-2 flex flex-col items-start gap-1.5">
						{#each editions.filter((e) => !e.deletionState) as row (row.uid)}
							<button
								type="button"
								on:click={() => {
									deleting = row;
									typed = '';
								}}
								class="font-sans text-[13.5px] text-brand-royal hover:underline"
								>Delete {row.periodLabel || row.period} data…</button
							>
						{/each}
					</div>
				{:else}
					<p class="mt-2 font-sans text-[13px] text-brand-mute">
						Deleting an edition’s data needs an owner or admin.
					</p>
				{/if}
				<p class="mt-2.5 font-sans text-[13px] text-brand-slate">
					Archive hides the campaign and blocks new editions. It does not delete files or change
					retention.
				</p>
			</aside>
		</div>
	{/if}
</div>

<!-- FE-16 — the typed confirmation dialog (board `DLG-0`). -->
{#if deleting}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40 px-5"
		role="dialog"
		aria-modal="true"
		aria-label="Delete edition data"
	>
		<div class="w-full max-w-[520px] rounded-md border-2 border-brand-ink bg-white p-6">
			<h2 class="font-display text-[19px] font-bold text-brand-ink">
				Delete {deleting.periodLabel || deleting.period} data
			</h2>
			<!-- What goes, what stays, and that it cannot be undone — before the
			     field, not after it. -->
			<p class="mt-2.5 font-sans text-[14px] text-brand-slate">
				This permanently deletes the uploaded rows, every rendered summary and the package for this
				edition. Counts and the approval record stay so the history is still readable. It cannot be
				undone, and any download link you have already shared will stop working.
			</p>

			<label class="mt-5 block">
				<span class="font-sans text-[13px] text-brand-slate"
					>Type <span class="font-mono text-brand-ink">delete {deleting.period}</span> to confirm</span
				>
				<input
					bind:value={typed}
					autocomplete="off"
					class="mt-1.5 h-11 w-full rounded-btn border border-brand-rule px-3 font-mono text-[13.5px] text-brand-ink"
				/>
			</label>

			<div class="mt-5 flex items-center justify-end gap-3">
				<button
					type="button"
					on:click={() => {
						deleting = null;
						typed = '';
					}}
					class="flex h-11 items-center rounded-btn border border-brand-rule px-4 font-sans text-[13.5px] text-brand-slate"
					>Cancel</button
				>
				<!-- Stays disabled until the typed text matches exactly. -->
				<button
					type="button"
					on:click={confirmDelete}
					disabled={!confirmed || busy !== null}
					class="flex h-11 items-center rounded-btn px-4 font-sans text-[13.5px] {confirmed
						? 'bg-brand-alarm text-white'
						: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
					>{busy === 'delete' ? 'Deleting…' : 'Delete this data'}</button
				>
			</div>
		</div>
	</div>
{/if}
