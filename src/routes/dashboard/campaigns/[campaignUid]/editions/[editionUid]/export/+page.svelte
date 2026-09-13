<script>
	/**
	 * FE-14 — Export and handoff (board `D7Z-0`, spec D08).
	 *
	 * The screen where the buyer takes the work away. Three things it must never
	 * do, each of which the copy here is shaped around:
	 *
	 *   Show per-file URLs. The package is the unit; a list of links invites
	 *   pasting one somewhere it outlives its retention.
	 *   Claim anything about delivery. "Launch confirmed" is the buyer telling
	 *   us what they did, labelled as a user report, because Pictify does not
	 *   observe the send.
	 *   Let acceptance happen by accident. Accepting starts the deletion clock
	 *   on their customers' rows, so it is an explicit outlined button, not the
	 *   plum primary, and the sentence beside it names the date first.
	 */
	import { getContext, onMount } from 'svelte';
	import { page } from '$app/stores';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import {
		getExport,
		downloadExport,
		recordLaunchConfirmation,
		recordHandoffConfirmation,
		campaignError
	} from '../../../../../../../api/campaign';
	import { campaignExportDownloaded, campaignHandoffAccepted } from '$lib/campaigns/analytics';

	const { edition, campaign, reload } = getContext('edition');

	$: campaignUid = $page.params.campaignUid;
	$: editionUid = $page.params.editionUid;

	let pkg = null;
	let error = null;
	let busy = null;
	let accepted = null;
	let launchTool = '';

	$: exportId = $edition?.exportId || pkg?.exportId;
	$: counts = $edition?.validation || { accounts: 0, valid: 0 };
	$: reconciled = pkg?.state === 'ready';

	async function load() {
		if (!$edition?.exportId) return;
		try {
			pkg = await getExport($edition.exportId);
		} catch (err) {
			error = campaignError(err);
		}
	}
	onMount(load);
	$: if ($edition?.exportId && !pkg) load();

	/**
	 * The download goes through the authenticated gateway and comes back as a
	 * blob, so there is never a URL to hand a browser — and a failure throws
	 * rather than resolving empty, because "the download quietly did nothing" is
	 * the one outcome the buyer must not get.
	 */
	async function download() {
		busy = 'download';
		error = null;
		try {
			const { blob, filename } = await downloadExport(exportId);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename || `${$campaign?.name || 'campaign'}-${$edition?.period || ''}.zip`;
			a.click();
			URL.revokeObjectURL(url);
			// The size is a shape; the filename would carry the campaign name.
			campaignExportDownloaded({ accounts: pkg?.accountCount, bytes: blob.size });
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	async function confirmLaunch() {
		if (!launchTool.trim()) return;
		busy = 'launch';
		error = null;
		try {
			await recordLaunchConfirmation(campaignUid, editionUid, { tool: launchTool.trim() });
			await reload();
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	async function acceptHandoff() {
		busy = 'accept';
		error = null;
		try {
			accepted = await recordHandoffConfirmation(campaignUid, editionUid, { exportId });
			campaignHandoffAccepted({ accounts: pkg?.accountCount });
			await reload();
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = null;
		}
	}

	const date = (d) =>
		d
			? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
			: '—';
	const mb = (n) => (n ? `${(n / 1024 / 1024).toFixed(1)} MB` : '—');
</script>

<div class="min-w-0 flex-1">
	<div class="flex flex-wrap divide-x divide-brand-rule rounded-md border border-brand-rule">
		{#each [['Audience', String(counts.valid ?? 0)], ['Verified files', String(pkg?.accountCount ?? 0)], ['Text equivalents', String(pkg?.accountCount ?? 0)], ['Excluded', String((counts.accounts ?? 0) - (counts.valid ?? 0))]] as [label, value] (label)}
			<div class="min-w-[130px] flex-1 px-5 py-4">
				<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">{label}</p>
				<p class="mt-1.5 font-display text-[28px] font-extrabold leading-none text-brand-ink">
					{value}
				</p>
			</div>
		{/each}
		<div class="min-w-[130px] flex-1 bg-brand-subtle px-5 py-4">
			<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">Reconciled</p>
			<p class="mt-2.5">
				<StatusSquare
					tone={reconciled ? 'ready' : 'current'}
					label={reconciled ? 'Yes' : 'Building'}
				/>
			</p>
		</div>
	</div>

	<div class="mt-6 rounded-md border-2 border-brand-ink p-5">
		<div class="flex flex-wrap items-baseline justify-between gap-3">
			<h2 class="font-display text-[17px] font-bold text-brand-ink">Campaign package</h2>
			<span class="font-mono text-[10.5px] uppercase tracking-[0.05em] text-brand-mute">
				ZIP · {mb(pkg?.byteLength)} · {pkg?.manifestDigest
					? `sha256 ${pkg.manifestDigest.slice(0, 6)}…`
					: 'built on download'}
			</span>
		</div>

		<!-- The four file classes, not a list of files. -->
		<ul class="mt-3 flex flex-col gap-1 font-mono text-[11.5px] text-brand-slate">
			<li>manifest.json · canonical</li>
			<li>manifest.csv · account_id, file, text_file, bytes, status</li>
			<li>README.txt · join and handoff instructions</li>
			<li>
				summaries/…{$campaign?.format || 'png'} × {pkg?.accountCount ?? 0} · text/….txt × {pkg?.accountCount ??
					0}
			</li>
		</ul>

		<div class="mt-4 flex flex-wrap items-center gap-4">
			<button
				type="button"
				on:click={download}
				disabled={!reconciled || busy !== null}
				class="flex h-11 items-center gap-2.5 rounded-btn px-4 font-sans text-[13.5px] {reconciled
					? 'bg-brand-plum text-white'
					: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
			>
				{busy === 'download' ? 'Preparing…' : 'Download campaign package'}
				<span
					class="block h-2 w-2 {reconciled ? 'bg-brand-field' : 'bg-brand-rule'}"
					aria-hidden="true"
				/>
			</button>
		</div>

		<!--
			The storage truth, in the owner's words (docs/campaigns-w00.md §8.1).
			The files are unguessable, not private; the package download is the
			part that requires login. Saying "private" here would promise a
			property the storage does not have.
		-->
		<p class="mt-4 max-w-[620px] font-sans text-[13px] text-brand-slate">
			Files are named by artifact id, never by account name — the manifest carries the join. Each
			summary is hosted on the same CDN as your other renders at an unguessable address; the package
			download itself requires login. These are not email image URLs.
		</p>
	</div>

	<h2 class="mt-8 font-display text-[17px] font-bold text-brand-ink">
		Use with your existing sending workflow
	</h2>
	<div class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
		{#each [['1 · Join', 'Match on account_id in manifest.csv. Row order and filenames mean nothing.'], ['2 · Host or attach', 'Host the files on your own asset host or attach them. Wrap the whole image in your own link and put the CTA as real text beside it.'], ['3 · Test two accounts', 'Preview two distinct accounts in your tool before launch. Example HTML layout in README.']] as [title, body] (title)}
			<div class="rounded-md border border-brand-rule p-4">
				<p class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute">{title}</p>
				<p class="mt-2 font-sans text-[13.5px] text-brand-slate">{body}</p>
			</div>
		{/each}
	</div>

	<div class="mt-6 flex flex-wrap items-center gap-3">
		{#if $edition?.launchConfirmation?.tool}
			<StatusSquare
				tone="ready"
				label={`Launch confirmed in ${$edition.launchConfirmation.tool}`}
			/>
		{:else}
			<input
				bind:value={launchTool}
				placeholder="Which tool did you send from?"
				class="h-10 w-[240px] rounded-btn border border-brand-rule px-3 font-sans text-[13.5px] text-brand-ink placeholder:text-brand-mute"
			/>
			<button
				type="button"
				on:click={confirmLaunch}
				disabled={!launchTool.trim() || busy !== null}
				class="font-sans text-[13.5px] text-brand-royal hover:underline disabled:text-brand-mute"
				>Record “Launch confirmed in my tool”</button
			>
		{/if}
		<!-- Labelled at the point of entry, so it can never be read as telemetry. -->
		<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
			>User report · not delivery telemetry</span
		>
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
		<p class="max-w-[560px] font-sans text-[13.5px] text-brand-slate">
			{#if accepted || pkg?.acceptedAt}
				Accepted. Source data is deleted on {date(
					accepted?.sourceDataExpiresAt || $edition?.dataExpiresAt
				)}. Output expiry is unchanged.
			{:else}
				<!-- The consequence, with its date, BEFORE the button. -->
				Accepting now deletes source data on {date(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))} (or
				{date($edition?.dataExpiresAt)} if that came first). Output expiry is unchanged.
			{/if}
		</p>
		{#if !(accepted || pkg?.acceptedAt)}
			<!-- Outlined ink, not plum: accepting is not the happy-path primary,
			     it is an irreversible commitment (handoff §2 decision 9). -->
			<button
				type="button"
				on:click={acceptHandoff}
				disabled={!reconciled || busy !== null}
				class="flex h-11 items-center rounded-btn border-2 border-brand-ink px-4 font-sans text-[13.5px] font-semibold text-brand-ink disabled:border-brand-rule disabled:text-brand-mute"
				>{busy === 'accept' ? 'Accepting…' : 'Accept handoff'}</button
			>
		{/if}
	</div>
</div>

<aside class="w-full flex-shrink-0 xl:w-[340px]">
	<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">Retention</p>
	<dl class="mt-3 border-t border-brand-ink">
		{#each [['Source data expires', date($edition?.dataExpiresAt)], ['If accepted today · whichever is earlier', date(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))], ['Outputs and package expire', date($edition?.artifactsExpireAt)], ['Export built', pkg?.readyAt ? new Date(pkg.readyAt).toLocaleTimeString( 'en-GB', { hour: '2-digit', minute: '2-digit' } ) : '—']] as [label, value] (label)}
			<div class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2.5">
				<dt class="font-sans text-[13px] text-brand-slate">{label}</dt>
				<dd class="font-mono text-[11.5px] text-brand-ink">{value}</dd>
			</div>
		{/each}
	</dl>

	<div class="mt-5 rounded-md bg-brand-subtle p-4">
		<p class="font-sans text-[14px] font-bold text-brand-ink">Pictify renders. Your tool sends.</p>
		<p class="mt-1.5 font-sans text-[13px] text-brand-slate">
			Nothing on this page sends email. Recipients, eligibility and sending stay in your own tool,
			wherever you already send from.
		</p>
	</div>
</aside>
