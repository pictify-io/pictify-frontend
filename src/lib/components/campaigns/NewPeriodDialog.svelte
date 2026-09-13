<script>
	/**
	 * New period. AI-5 (board AN-05).
	 *
	 * A DETERMINISTIC DIFF, not a summary. Every row here is a comparison
	 * between what the last approved edition froze and what the campaign holds
	 * now, read from saved records — so nothing in this dialog has to be
	 * believed, and nothing was generated.
	 *
	 * THE REVISION PICKER DEFAULTS TO THE APPROVED ONE. A buyer who edited the
	 * design after September approved it has not asked for October to use the
	 * edit; if they had, they would say so, which is what the picker is for.
	 * Pictify never switches to a newer design on its own, and that sentence is
	 * on the dialog rather than in a doc because it is the promise being kept.
	 */
	import { createEventDispatcher } from 'svelte';

	/** `{ period, previousPeriod, approvedRevision, currentRevision, revisions, changes }` */
	export let plan = null;
	export let period = '';
	export let busy = false;
	export let error = null;

	const dispatch = createEventDispatcher();

	/** Chosen revision. Set from the plan, never inferred from the newest. */
	export let designRevision = null;
	$: if (plan && designRevision === null) designRevision = plan.approvedRevision;

	const TONE = {
		changed: 'bg-brand-field border border-brand-ink',
		fresh: 'border border-brand-mute'
	};

	/** `2026-10` → the month a buyer would name it by. */
	function monthLabel(p) {
		const m = /^(\d{4})-(\d{2})$/.exec(String(p || ''));
		if (!m) return p || 'the next period';
		return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString(undefined, {
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<div
	class="fixed inset-0 z-40 flex items-center justify-center bg-brand-ink/40 p-5"
	role="dialog"
	aria-modal="true"
	aria-label="New period"
>
	<div class="w-full max-w-[640px] rounded-card bg-white p-6 shadow-[6px_6px_0_0_rgba(0,0,0,0.12)]">
		<h2 class="font-display text-[24px] font-extrabold tracking-[-0.02em] text-brand-ink">
			New period · {monthLabel(period)}
		</h2>
		<p class="mt-1.5 font-sans text-[13.5px] text-brand-slate">
			Reuses {plan?.previousPeriod ? monthLabel(plan.previousPeriod) : 'the last'} approved setup. Data
			is not carried over.
		</p>

		<label class="mt-5 block">
			<span class="font-sans text-[13px] text-brand-slate">Period</span>
			<input
				type="month"
				bind:value={period}
				class="mt-1 h-10 w-[200px] border border-brand-rule px-2 font-mono text-[13px] text-brand-ink"
			/>
		</label>

		{#if plan}
			<div class="mt-5 border border-brand-rule">
				<div
					class="grid grid-cols-[140px_minmax(0,1fr)_auto] gap-3 border-b border-brand-rule bg-brand-subtle px-4 py-2"
				>
					{#each ['What', plan.previousPeriod ? `Since ${monthLabel(plan.previousPeriod)}’s approval` : 'Since the last approval', `${monthLabel(period).split(' ')[0]} uses`] as head, i (head)}
						<span
							class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute {i === 2
								? 'text-right'
								: ''}">{head}</span
						>
					{/each}
				</div>

				{#each plan.changes as row (row.what)}
					<div
						class="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-3 border-b border-brand-rule px-4 py-3 last:border-b-0"
					>
						<span class="font-sans text-[13.5px] text-brand-ink">{row.what}</span>
						<span class="flex min-w-0 items-center gap-2.5">
							<span
								class="block h-2 w-2 flex-shrink-0 {TONE[row.state] || 'bg-brand-proof'}"
								aria-hidden="true"
							/>
							<span class="font-sans text-[13px] leading-[18px] text-brand-slate">{row.since}</span>
						</span>

						{#if row.what === 'Design' && plan.revisions?.length}
							<!--
								The one row that is a CHOICE rather than a report. Defaulted to
								the approved revision; anything newer has to be picked.
							-->
							<select
								bind:value={designRevision}
								class="h-8 border border-brand-ink bg-white px-2 font-mono text-[11.5px] text-brand-ink"
								aria-label="Design revision for this period"
							>
								{#each plan.revisions as rev (rev)}
									<option value={rev}
										>Rev {rev}{rev === plan.approvedRevision ? ' · approved' : ''}</option
									>
								{/each}
							</select>
						{:else}
							<span class="text-right font-mono text-[11.5px] text-brand-slate">{row.uses}</span>
						{/if}
					</div>
				{/each}
			</div>

			<p class="mt-4 flex items-start gap-2.5">
				<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-ink" aria-hidden="true" />
				<span class="font-sans text-[13px] leading-[19px] text-brand-slate">
					You choose the design revision. Pictify never switches to a newer one on its own, and
					{monthLabel(period).split(' ')[0]} is reviewed and approved on its own.
				</span>
			</p>
		{:else}
			<p class="mt-5 font-sans text-[13.5px] text-brand-mute">Reading what changed…</p>
		{/if}

		{#if error}
			<p class="mt-4 flex items-start gap-2">
				<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-alarm" aria-hidden="true" />
				<span class="font-sans text-[13.5px] text-brand-slate">{error}</span>
			</p>
		{/if}

		<div class="mt-6 flex items-center justify-end gap-3">
			<button
				type="button"
				on:click={() => dispatch('cancel')}
				class="h-11 border border-brand-rule px-4 font-sans text-[13.5px] text-brand-slate"
				>Cancel</button
			>
			<button
				type="button"
				on:click={() => dispatch('create', { period, designRevision })}
				disabled={busy || !plan}
				class="flex h-11 items-center gap-2.5 bg-brand-ink px-4 font-sans text-[13.5px] font-semibold text-white disabled:bg-brand-rule disabled:text-brand-mute"
			>
				{busy ? 'Creating…' : `Create ${monthLabel(period).split(' ')[0]} draft`}
				<span class="block h-2 w-2 bg-brand-field" aria-hidden="true" />
			</button>
		</div>
	</div>
</div>
