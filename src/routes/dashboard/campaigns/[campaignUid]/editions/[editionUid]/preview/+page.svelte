<script>
	/**
	 * FE-12 — Preview and approve (board `CJA-0`, spec D06).
	 *
	 * This is the last screen before 248 people receive something. Everything
	 * here is arranged around one question: can the buyer tell what they are
	 * about to send?
	 *
	 * So each tile states WHY that row was chosen. A sample the buyer cannot
	 * interrogate is a sample they have to take on trust, and the whole point of
	 * an adversarial selection is that they can check we picked the hard rows —
	 * the longest name, the decline, the blank metric — rather than the first
	 * ten in the file.
	 *
	 * Approving and generating are deliberately separate actions. Approval
	 * records what was reviewed; it renders nothing. Collapsing them would mean
	 * a mis-click spends the allowance.
	 */
	import { getContext, onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { editionUrl } from '$lib/campaigns/nav';
	import ReviewerChecks from '$lib/components/campaigns/ReviewerChecks.svelte';
	import RepairApplied from '$lib/components/campaigns/RepairApplied.svelte';
	import {
		getPreviewRun,
		startPreviewRun,
		approveEdition,
		getEditionReview,
		proposeRepair,
		applyRepair,
		campaignError
	} from '../../../../../../../api/campaign';
	import { restoreTemplateRevision } from '../../../../../../../api/template';
	import { campaignApproved } from '$lib/campaigns/analytics';

	const { edition, campaign, reload } = getContext('edition');

	$: campaignUid = $page.params.campaignUid;
	$: editionUid = $page.params.editionUid;

	let run = null;
	let loading = true;
	let error = null;
	let busy = false;
	let previewRunId = null;
	let timer;

	/** The three acknowledgements. Each is a separate claim, so each is separate. */
	let acks = { metrics: false, audience: false, reviewed: false };

	/* ----------------------------------------------------------- AI-4 */

	let review = null;
	let reviewLoading = false;

	/**
	 * Load the checks whenever this screen is shown.
	 *
	 * Not cached across visits: the checks are a claim about the data and the
	 * design as they stand, and a stale one would tell a buyer that something
	 * they have since fixed is still wrong — or worse, that something they have
	 * since broken is still fine.
	 */
	async function loadReview() {
		reviewLoading = true;
		try {
			const res = await getEditionReview(campaignUid, editionUid);
			review = res?.issues ? res : null;
		} catch {
			// A rail that could not load says so by staying empty; it must never
			// render as "everything passed".
			review = null;
		} finally {
			reviewLoading = false;
		}
	}
	/* ------------------------------------------------- AI-4 repair, A8 toast */

	let proposal = null;
	let proposalLoading = false;
	let applying = false;
	let repairConflict = false;
	/** `{ revision, accounts, remaining, note }` while the A8 toast is up. */
	let repairApplied = null;

	async function onPropose() {
		proposalLoading = true;
		repairConflict = false;
		try {
			proposal = await proposeRepair(campaignUid, editionUid, 'name_overflow');
		} catch (err) {
			// A card that cannot be measured says so; it must never render as a
			// repair that is ready to apply.
			proposal = { applicable: false, detail: campaignError(err) };
		} finally {
			proposalLoading = false;
		}
	}

	/**
	 * Apply, through the studio's own commit path.
	 *
	 * `expectedRevision` is the revision the proposal was MEASURED against, so a
	 * design that moved underneath conflicts instead of applying. That is not
	 * defensive coding — the fixtures, the chosen size and the re-check all
	 * describe a document that would no longer exist, and committing them would
	 * attach true numbers to the wrong design.
	 */
	async function onApply() {
		if (!proposal?.applicable || applying) return;
		applying = true;
		repairConflict = false;
		try {
			const res = await applyRepair($campaign.templateRevisionUid, {
				html: proposal.patch.html,
				expectedRevision: proposal.baseRevision,
				label: `Repair · name to ${proposal.patch.fontSizePx}px`
			});

			/*
			 * The counts come from the re-check the proposal actually ran, and the
			 * CAS above is what makes that honest: had the design moved, we would
			 * be in the catch. So these numbers describe exactly the revision that
			 * was just committed.
			 */
			repairApplied = {
				revision: res.revision,
				accounts: proposal.recheck.accounts,
				remaining: proposal.recheck.remaining,
				note: proposal.appliesTo?.repinRequired ? proposal.appliesTo.note : null,
				undoTo: proposal.baseRevision
			};
			proposal = null;
			// The design changed, so the checks are about to be about something
			// else. Re-read rather than leave a stale rail on screen.
			await loadReview();
		} catch (err) {
			if (err?.status === 409) {
				/*
				 * The card STAYS, carrying the conflict. Losing it here would make a
				 * failure look like a successful dismissal — the buyer asked for
				 * something and it did not happen. The measurement is deliberately
				 * NOT re-run against the new revision: a design that moved may need
				 * a different repair, or none, and quietly substituting one
				 * proposal for another is the thing this card exists not to do.
				 */
				repairConflict = true;
				await loadReview();
			} else {
				proposal = { applicable: false, detail: campaignError(err) };
			}
		} finally {
			applying = false;
		}
	}

	/**
	 * Undo, through the Versions panel's own restore.
	 *
	 * Restoring creates a NEW revision rather than deleting one, which is why
	 * this stays true after the toast expires: nothing here is a soft delete
	 * waiting on a timer, so a buyer who misses the eight seconds has lost a
	 * shortcut and not the ability to undo.
	 */
	async function onUndoRepair() {
		const target = repairApplied?.undoTo;
		if (!target) return;
		try {
			await restoreTemplateRevision($campaign.templateRevisionUid, target);
			await loadReview();
		} catch {
			/* The studio's own history is the fallback, and it is one click away. */
		} finally {
			repairApplied = null;
		}
	}

	let externalRef = '';

	$: samples = run?.samples || [];
	$: verified = samples.filter((s) => s.state === 'verified');
	$: clipped = samples.filter((s) => s.clipped);
	$: pending = samples.filter((s) => s.state === 'pending');
	$: allAcked = acks.metrics && acks.audience && acks.reviewed;
	/**
	 * Approval is blocked while anything is still rendering: approving previews
	 * you have not seen is the one thing this screen exists to prevent.
	 */
	$: canApprove = allAcked && pending.length === 0 && verified.length > 0 && !busy;

	async function poll() {
		if (!previewRunId) return;
		try {
			run = await getPreviewRun(previewRunId);
			// Back off once nothing is moving; keep going while it is.
			const stillWorking = (run.samples || []).some((s) => s.state === 'pending');
			timer = setTimeout(poll, stillWorking ? 3000 : 30000);
		} catch (err) {
			error = campaignError(err);
		}
	}

	async function begin() {
		loading = true;
		error = null;
		try {
			const started = await startPreviewRun(campaignUid, editionUid);
			previewRunId = started.previewRunId;
			await poll();
		} catch (err) {
			error = campaignError(err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		begin();
		loadReview();
	});
	onDestroy(() => clearTimeout(timer));

	async function approve() {
		busy = true;
		error = null;
		try {
			await approveEdition(campaignUid, editionUid, {
				configDigest: run.approval.configDigest,
				dataDigest: run.approval.dataDigest,
				previewDigest: run.previewRunId,
				acknowledgements: Object.entries(acks)
					.filter(([, v]) => v)
					.map(([k]) => k),
				externalApprovalRef: externalRef.trim() || undefined
			});
			campaignApproved({
				accounts: run?.approval?.eligibleAccounts,
				previews: verified.length,
				clipped: clipped.length,
				external_ref: Boolean(externalRef.trim())
			});
			await reload();
			await goto(editionUrl(campaignUid, editionUid, 'generate'));
		} catch (err) {
			error = campaignError(err);
		} finally {
			busy = false;
		}
	}

	const fmt = (v) => (v === null || v === undefined ? '—' : new Intl.NumberFormat().format(v));
</script>

<div class="min-w-0 flex-1">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="max-w-[560px]">
			<h2 class="font-display text-[19px] font-bold text-brand-ink">
				{samples.length} representative previews
			</h2>
			<p class="mt-1.5 font-sans text-[13.5px] text-brand-slate">
				Chosen from the {$edition?.validation?.valid ?? 0} eligible rows: longest names, numeric extremes,
				zero and negative comparisons, each narrative variant, each with a stable sample.
			</p>
		</div>
	</div>

	{#if loading && !samples.length}
		<div
			class="mt-6 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3"
			aria-busy="true"
		>
			<!-- Six placeholder tiles. Keyed by index and iterated over the indices
			     themselves: `as _, i` bound a value the loop never reads, which is
			     an error under no-unused-vars. -->
			{#each Array.from({ length: 6 }, (_, i) => i) as i (i)}
				<div class="h-[210px] animate-pulse bg-brand-subtle" />
			{/each}
		</div>
	{:else if error && !samples.length}
		<div class="mt-6">
			<StatusSquare tone="blocked" label={error.message} />
			<button
				type="button"
				on:click={begin}
				class="mt-2 block font-sans text-[13.5px] text-brand-royal underline">Try again</button
			>
		</div>
	{:else}
		<div class="mt-6 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
			{#each samples as sample (sample.accountId)}
				<div>
					<div
						class="flex h-[150px] flex-col rounded-[3px] border bg-white p-3.5 {sample.clipped
							? 'border-brand-alarm'
							: 'border-brand-rule'}"
					>
						<!-- 4px brand band: the output is the buyer's brand, not ours. -->
						<span class="-mx-3.5 -mt-3.5 mb-3 block h-1 bg-brand-ink" aria-hidden="true" />
						<span class="flex items-baseline justify-between gap-2">
							<span class="truncate font-sans text-[13px] font-bold text-brand-ink"
								>{sample.accountName || sample.accountId}</span
							>
							<span class="flex-shrink-0 font-mono text-[10px] text-brand-mute"
								>{$edition?.period || ''}</span
							>
						</span>
						<span class="mt-auto flex flex-wrap items-end gap-x-5 gap-y-1">
							{#each Object.entries(sample.values || {}) as [key, value] (key)}
								<span class="flex flex-col">
									<span class="font-display text-[22px] font-extrabold leading-none text-brand-ink"
										>{fmt(value)}</span
									>
									<span class="mt-1 font-mono text-[9.5px] text-brand-mute">{key}</span>
								</span>
							{/each}
						</span>
					</div>

					<div class="mt-2 flex items-start justify-between gap-2 overflow-hidden">
						<span class="flex min-w-0 flex-col">
							<span class="font-mono text-[11px] text-brand-ink">{sample.accountId}</span>
							<!-- The reason this row is in the sample. -->
							<span
								class="truncate font-mono text-[10px] uppercase tracking-[0.05em] text-brand-mute"
							>
								Why · {sample.reason || 'stable sample'}
							</span>
						</span>
						<span class="flex-shrink-0">
							{#if sample.state === 'verified' && sample.clipped}
								<StatusSquare tone="blocked" label="Clipped" />
							{:else if sample.state === 'verified'}
								<StatusSquare tone="ready" label="Verified" />
							{:else if sample.state === 'failed'}
								<StatusSquare tone="blocked" label={sample.errorCode || 'Failed'} />
							{:else}
								<StatusSquare tone="current" label="Rendering" />
							{/if}
						</span>
					</div>
				</div>
			{/each}
		</div>

		<p class="mt-6 font-sans text-[13px] text-brand-mute">
			All {samples.length} previews are shown. Every tile has a text equivalent. Small campaigns get
			min(10, eligible).
		</p>
	{/if}

	{#if error && samples.length}
		<p class="mt-4 flex items-start gap-2">
			<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
			<span class="font-sans text-[13.5px] text-brand-slate">{error.message}</span>
		</p>
	{/if}

	<div
		class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-brand-rule pt-5"
	>
		<p class="flex items-center gap-2 font-sans text-[13.5px] text-brand-slate">
			{#if clipped.length}
				<span class="block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
				{clipped.length}
				{clipped.length === 1 ? 'preview clips' : 'previews clip'} text. Fix it in the design or set
				a display name in Data.
			{:else if pending.length}
				Rendering {pending.length} of {samples.length}…
			{:else if !allAcked}
				Confirm all three statements to approve.
			{:else if !verified.length}
				<!--
					`canApprove` also requires a verified preview, and no branch said so:
					with the statements confirmed and nothing rendered, the line read
					"Ready to approve 0 accounts" beside a disabled button. A sentence
					that contradicts the control next to it is worse than none.
				-->
				No previews have been verified yet. Render previews before approving.
			{:else}
				Ready to approve {verified.length}
				{verified.length === 1 ? 'account' : 'accounts'}.
			{/if}
		</p>
		<div class="flex items-center gap-3">
			<a
				href={editionUrl(campaignUid, editionUid, 'review')}
				class="flex h-11 items-center rounded-btn border border-brand-rule px-4 font-sans text-[13.5px] text-brand-slate"
				>Back to Data</a
			>
			<button
				type="button"
				on:click={approve}
				disabled={!canApprove}
				class="flex h-11 items-center gap-2.5 rounded-btn px-4 font-sans text-[13.5px] {canApprove
					? 'bg-brand-plum text-white'
					: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
			>
				{busy ? 'Approving…' : 'Approve this version'}
				<span
					class="block h-2 w-2 {canApprove ? 'bg-brand-field' : 'bg-brand-rule'}"
					aria-hidden="true"
				/>
			</button>
		</div>
	</div>
</div>

<aside class="w-full flex-shrink-0 xl:w-[340px]">
	<!--
		AI-4. The checks come first in the rail, above the summary of what is
		being approved: they are the reason to hesitate, and a reason to hesitate
		placed under a summary gets read after the decision.
	-->
	<div class="mb-7">
		<ReviewerChecks
			{review}
			loading={reviewLoading}
			revision={run?.snapshot?.revision ?? null}
			{proposal}
			{proposalLoading}
			{applying}
			conflict={repairConflict}
			on:propose={onPropose}
			on:apply={onApply}
			on:studio={() => goto(`/campaign-studio/${$campaign.templateRevisionUid}`)}
			on:dismiss={() => {
				proposal = null;
				repairConflict = false;
			}}
		/>
	</div>

	<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
		What you are approving
	</p>
	<dl class="mt-3 border-t border-brand-ink">
		{#each [['Eligible accounts', String(run?.approval?.eligibleAccounts ?? '—')], ['Required outputs', run?.snapshot ? `${run.approval?.eligibleAccounts ?? 0} × ${String(run.snapshot.format || '').toUpperCase()}` : '—'], ['Revision · snapshot', run?.snapshot ? `rev ${run.snapshot.revision} · ${String(run.approval?.dataDigest || '').slice(0, 6)}…` : '—'], ['Brand assets', run?.snapshot ? `pinned · ${run.snapshot.pinnedAssets} files` : '—'], ['Outputs expire', run?.snapshot ? `${run.snapshot.retentionDays} days after generation` : '—']] as [label, value] (label)}
			<div class="flex items-baseline justify-between gap-3 border-b border-brand-rule py-2.5">
				<dt class="font-sans text-[13.5px] text-brand-slate">{label}</dt>
				<dd class="font-mono text-[11.5px] text-brand-ink">{value}</dd>
			</div>
		{/each}
	</dl>

	<!-- Three separate claims, so three separate checkboxes. One combined "I
	     confirm everything" would be signed without being read. -->
	<div class="mt-5 flex flex-col gap-3">
		{#each [['metrics', 'The metrics and their labels are correct and approved for customers.'], ['audience', 'The audience is final. Exclusions are recorded with reasons.'], ['reviewed', 'I reviewed the previews and the neutral variant copy.']] as [key, label] (key)}
			<label class="flex cursor-pointer items-start gap-2.5">
				<input
					type="checkbox"
					bind:checked={acks[key]}
					class="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-ink"
				/>
				<span class="font-sans text-[13.5px] text-brand-slate">{label}</span>
			</label>
		{/each}
	</div>

	<label class="mt-5 block">
		<span class="font-sans text-[13px] text-brand-slate"
			>Buyer approval obtained outside Pictify (optional)</span
		>
		<input
			bind:value={externalRef}
			placeholder="e.g. email from J. Rivera, Sep 4"
			class="mt-1.5 h-10 w-full rounded-btn border border-brand-rule px-3 font-sans text-[13.5px] text-brand-ink placeholder:text-brand-mute"
		/>
	</label>

	<p class="mt-4 font-sans text-[13px] text-brand-slate">
		Approval records you, the time and this revision on the server. Approving does not generate
		anything; “Generate summaries” is the next step.
	</p>
</aside>

<!--
	A8 (board IKS-0). Mounted at the page root rather than inside the rail so it
	is not clipped by the aside's own stacking and scrolling.
-->
<RepairApplied
	applied={repairApplied}
	on:undo={onUndoRepair}
	on:expire={() => (repairApplied = null)}
/>
