<script>
	/**
	 * FE-10 — Data review (board `CA0-0`, spec D05).
	 *
	 * Nothing is dropped silently. Counts are ACCOUNTS, not rows, so a duplicate
	 * id appearing on two lines is one issue rather than two; every exclusion
	 * carries a reason and happens before approval; and the eligible count moves
	 * only when a decision is actually made.
	 *
	 * The split that shapes the whole screen: a BLOCKING problem is fixed in the
	 * file and re-uploaded — there is no in-app control for it, because nothing
	 * here can know which of two duplicate rows the buyer meant. A DECISION is
	 * about presentation, and only a human can make it. Neither ever edits a
	 * figure.
	 */
	import { getContext, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { csvRow } from '$lib/campaigns/csv';
	import { editionUrl } from '$lib/campaigns/nav';
	import {
		listEditionItems,
		updateItem,
		startPreviewRun,
		campaignError
	} from '../../../../../../../api/campaign';

	const { edition, reload } = getContext('edition');

	$: campaignUid = $page.params.campaignUid;
	$: editionUid = $page.params.editionUid;

	let items = [];
	let counts = { input: 0, accounts: 0, valid: 0, issues: 0 };
	let loading = true;
	let error = null;
	let filter = 'unresolved';
	let search = '';
	let busy = null;

	/**
	 * Every account sits in exactly ONE bucket, so the five counts add up to the
	 * account total. The severity comes from the server; the client only counts.
	 *
	 * The first version had "clean" and "decision" overlapping — the strip read
	 * VALID 2 while the tab beside it read Valid 1, because the server's
	 * validation.valid counts an account whose DATA is fine even when a
	 * presentation decision is still open. Two numbers labelled the same thing
	 * disagreeing on screen is worse than either being wrong.
	 */
	$: blocking = items.filter((i) => i.severity === 'blocking');
	$: decisions = items.filter((i) => i.severity === 'decision');
	$: excluded = items.filter((i) => i.severity === 'excluded');
	$: clean = items.filter((i) => i.severity === 'valid');
	$: unresolved = [...blocking, ...decisions];
	$: eligible = items.filter((i) => i.eligible).length;

	$: shown = (
		filter === 'all'
			? items
			: filter === 'valid'
			? clean
			: filter === 'excluded'
			? excluded
			: unresolved
	).filter((i) => {
		if (!search.trim()) return true;
		const q = search.trim().toLowerCase();
		return (
			String(i.externalAccountId).toLowerCase().includes(q) ||
			String(i.accountName || '')
				.toLowerCase()
				.includes(q)
		);
	});

	/**
	 * Previews are gated on BLOCKING problems only. An undecided presentation
	 * question does not stop the buyer looking at their work — it is a choice
	 * they may want to make after seeing a preview, not before.
	 */
	$: canPreview = blocking.length === 0 && eligible > 0 && !busy;

	async function load() {
		loading = true;
		error = null;
		try {
			const data = await listEditionItems(campaignUid, editionUid, { limit: 250, status: 'all' });
			items = data.items || [];
			counts = data.counts || counts;
		} catch (err) {
			error = campaignError(err);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function decide(item, decision, extra = {}) {
		busy = item.uid;
		error = null;
		try {
			await updateItem(campaignUid, editionUid, item.uid, { decision, ...extra });
			await load();
			await reload();
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	function exclude(item) {
		// A reason is required by the server; asking for it here keeps the
		// requirement visible rather than surfacing as a validation error.
		const reason = window.prompt(`Why is ${item.externalAccountId} excluded?`);
		if (reason && reason.trim()) decide(item, 'exclude', { reason: reason.trim() });
	}

	function setDisplayName(item) {
		const displayName = window.prompt('Shorter name for the card', item.accountName || '');
		if (displayName && displayName.trim())
			decide(item, 'display_name', { displayName: displayName.trim() });
	}

	/**
	 * The error report, built from what the server said. Every cell goes through
	 * csvRow, so a value starting `=` is neutralised before the buyer reopens
	 * this in Excel.
	 */
	function downloadReport() {
		const lines = [csvRow(['row', 'account_id', 'name', 'field', 'problem'])];
		for (const i of unresolved) {
			lines.push(
				csvRow([
					(i.lines || []).join(' '),
					i.externalAccountId,
					i.accountName || '',
					i.field || '',
					i.problem || ''
				])
			);
		}
		const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${editionUid}-issues.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function renderPreviews() {
		busy = 'previews';
		error = null;
		try {
			await startPreviewRun(campaignUid, editionUid);
			await goto(editionUrl(campaignUid, editionUid, 'preview'));
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	const TONE = { blocking: 'blocked', decision: 'current', excluded: 'excluded', valid: 'ready' };
</script>

<div class="min-w-0 flex-1">
	<!-- Counts strip. Blocking issues carry the alarm colour AND the word, per
	     the status vocabulary: never colour alone. -->
	<div class="flex flex-wrap divide-x divide-brand-rule rounded-md border border-brand-rule">
		{#each [['Input rows', counts.input, false], ['Valid', clean.length, false], ['Blocking issues', blocking.length, true], ['Decisions', decisions.length, false], ['Excluded', excluded.length, false]] as [label, value, alarm] (label)}
			<div class="min-w-[124px] flex-1 px-5 py-4">
				<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">{label}</p>
				<p
					class="mt-1.5 font-display text-[28px] font-extrabold leading-none {alarm && value > 0
						? 'text-brand-alarm'
						: 'text-brand-ink'}"
				>
					{value}
				</p>
			</div>
		{/each}
	</div>

	<div class="mt-5 flex flex-wrap items-center gap-3">
		<div class="flex items-center rounded-btn border border-brand-rule bg-brand-paper p-0.5">
			{#each [['all', 'All', items.length], ['valid', 'Valid', clean.length], ['unresolved', 'Unresolved', unresolved.length], ['excluded', 'Excluded', excluded.length]] as [key, label, n] (key)}
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
		<input
			bind:value={search}
			placeholder="Search account id or name"
			class="h-9 w-[220px] rounded-btn border border-brand-rule px-3 font-sans text-[13.5px] text-brand-ink placeholder:text-brand-mute"
		/>
		{#if unresolved.length}
			<button
				type="button"
				on:click={downloadReport}
				class="font-sans text-[13.5px] text-brand-royal hover:underline"
				>Download error report (.csv)</button
			>
		{/if}
	</div>

	{#if loading}
		<div class="mt-6 flex flex-col gap-px" aria-busy="true">
			{#each Array(5) as _, i (i)}<div class="h-[52px] animate-pulse bg-brand-subtle" />{/each}
		</div>
	{:else}
		<div class="mt-5 overflow-x-auto">
			<table class="w-full min-w-[700px] border-collapse text-left">
				<thead>
					<tr class="border-b border-brand-ink">
						{#each ['Row', 'Account id', 'Name', 'Field', 'Problem', 'Resolution'] as head, i (head)}
							<th
								class="pb-2.5 font-mono text-[11.5px] font-normal uppercase tracking-[0.06em] text-brand-slate {i ===
								5
									? 'text-right'
									: ''}">{head}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each shown as item (item.uid)}
						<tr
							class="border-b border-brand-rule {item.severity === 'excluded'
								? 'text-brand-mute'
								: ''}"
						>
							<td class="py-3 pr-3 font-mono text-[11.5px] text-brand-mute"
								>{(item.lines || []).join(' ')}</td
							>
							<td
								class="py-3 pr-3 font-mono text-[12.5px] {item.severity === 'excluded'
									? 'text-brand-mute'
									: 'text-brand-ink'}">{item.externalAccountId}</td
							>
							<td class="max-w-[180px] truncate py-3 pr-3 font-sans text-[13.5px]"
								>{item.accountName || '—'}</td
							>
							<td class="py-3 pr-3 font-mono text-[11.5px] text-brand-slate">{item.field || '—'}</td
							>
							<td class="py-3 pr-3">
								{#if item.problem}
									<StatusSquare tone={TONE[item.severity]} label={item.problem} />
								{:else}
									<StatusSquare tone="ready" label="Valid" />
								{/if}
							</td>
							<td class="w-[150px] py-3 text-right">
								{#if item.resolution?.kind === 'reupload'}
									<!-- No control: this is fixed in the file. Offering a button
									     here would imply we can repair it, and we cannot. -->
									<span class="font-sans text-[13px] text-brand-mute">{item.resolution.label}</span>
								{:else if item.resolution?.kind === 'include'}
									<button
										type="button"
										disabled={busy === item.uid}
										on:click={() => decide(item, 'include')}
										class="font-sans text-[13px] text-brand-royal hover:underline"
										>{item.resolution.label}</button
									>
								{:else if item.resolution?.kind === 'display_name'}
									<button
										type="button"
										disabled={busy === item.uid}
										on:click={() => setDisplayName(item)}
										class="h-8 rounded-[5px] border border-brand-rule px-2.5 font-sans text-[13px] text-brand-slate"
										>{item.resolution.label}</button
									>
								{:else if item.resolution?.kind === 'neutral_variant'}
									<button
										type="button"
										disabled={busy === item.uid}
										on:click={() => decide(item, 'neutral_variant')}
										class="h-8 rounded-[5px] border border-brand-rule px-2.5 font-sans text-[13px] text-brand-slate"
										>Neutral variant</button
									>
								{:else if item.eligible}
									<button
										type="button"
										disabled={busy === item.uid}
										on:click={() => exclude(item)}
										class="font-sans text-[13px] text-brand-mute hover:text-brand-slate hover:underline"
										>Exclude</button
									>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if !shown.length}
				<p class="py-8 text-center font-sans text-[13.5px] text-brand-mute">
					{search.trim() ? 'No account matches that search.' : 'Nothing in this view.'}
				</p>
			{/if}
		</div>
	{/if}

	{#if error}
		<p class="mt-4 flex items-start gap-2">
			<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
			<span class="font-sans text-[13.5px] text-brand-slate">{error.message}</span>
		</p>
	{/if}

	<div
		class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-brand-rule pt-5"
	>
		<p class="flex items-center gap-2 font-sans text-[13.5px] text-brand-slate">
			{#if blocking.length}
				<span class="block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
				{blocking.length}
				{blocking.length === 1 ? 'blocking error' : 'blocking errors'}. Previews stay off until the
				file is fixed.
			{:else if eligible === 0}
				<span class="block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
				0 accounts can be rendered.
			{:else}
				All valid · {eligible} accounts ready.
			{/if}
		</p>
		<div class="flex items-center gap-3">
			<a
				href={editionUrl(campaignUid, editionUid, 'data')}
				class="flex h-11 items-center rounded-btn border border-brand-rule px-4 font-sans text-[13.5px] text-brand-slate"
				>Re-upload file</a
			>
			<button
				type="button"
				on:click={renderPreviews}
				disabled={!canPreview}
				class="flex h-11 items-center gap-2.5 rounded-btn px-4 font-sans text-[13.5px] {canPreview
					? 'bg-brand-plum text-white'
					: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
			>
				{busy === 'previews' ? 'Starting…' : 'Render previews'}
				<span
					class="block h-2 w-2 {canPreview ? 'bg-brand-field' : 'bg-brand-rule'}"
					aria-hidden="true"
				/>
			</button>
		</div>
	</div>
</div>

<aside class="w-full flex-shrink-0 xl:w-[340px]">
	<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
		After validation
	</p>
	<dl class="mt-3 border-t border-brand-ink">
		{#each [['Input rows', String(counts.input)], ['Eligible now', `${eligible} accounts`], ['Unresolved · excluded', `${unresolved.length} · ${excluded.length}`], ['Input expires', $edition?.dataExpiresAt ? new Date($edition.dataExpiresAt).toLocaleDateString( 'en-US', { month: 'short', day: 'numeric', year: 'numeric' } ) : '—']] as [label, value] (label)}
			<div class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2.5">
				<dt class="font-sans text-[13.5px] text-brand-slate">{label}</dt>
				<dd class="font-mono text-[12px] text-brand-ink">{value}</dd>
			</div>
		{/each}
	</dl>

	<div class="mt-5 rounded-md bg-brand-subtle p-4">
		<p class="font-sans text-[14px] font-bold text-brand-ink">Nothing is dropped silently</p>
		<p class="mt-1.5 font-sans text-[13px] text-brand-slate">
			Counts are accounts, not rows: an id that appears twice is one issue across both lines. Every
			exclusion needs a reason and happens before approval. Eligible updates only after a decision
			is actually made.
		</p>
	</div>
</aside>
