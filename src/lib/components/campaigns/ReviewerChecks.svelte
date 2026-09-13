<script>
	/**
	 * The reviewer's checks. AI-4 (board AN-04).
	 *
	 * THE VOCABULARY IS THE POINT, and it is fixed by the spec:
	 *
	 *   a count    a rule ran on every eligible account, and this many matched.
	 *              Shown as "1 of 248", never as a percentage — "96%" does not
	 *              say what it is 96% of, and this is the last screen between a
	 *              buyer and 248 customers.
	 *   NEEDS YOU  a reading, not a rule. No count, because nothing was
	 *              measured; only a person can clear it.
	 *
	 * One line per issue, per the layout pass: square, rule, trailing count. The
	 * explanation lives under the line it explains and nowhere else — there is
	 * no paragraph in this component that is not attached to a specific check.
	 */
	import StatusSquare from './StatusSquare.svelte';
	import RepairProposal from './RepairProposal.svelte';

	/** `{ checkedAccounts, issues, blocking, needsYou }` from the review route. */
	export let review = null;
	export let loading = false;
	export let revision = null;

	/*
	 * The repair card (AI-4, board I30-0). This component stays presentational:
	 * it decides WHERE the card belongs — under the check it repairs — and the
	 * page above owns proposing, applying and the conflict that may follow.
	 */
	export let proposal = null;
	export let proposalLoading = false;
	export let applying = false;
	export let conflict = false;

	/*
	 * Only offered against a check that is actually failing. A repair card under
	 * a rule reading "0 of 248" would be offering to fix something that is not
	 * broken, and the one thing this rail is for is not overstating.
	 */
	$: repairable =
		review?.issues?.find((i) => i.id === 'name_overflow' && i.severity === 'block') || null;

	/** "1 of 248", or NEEDS YOU when nothing was counted. */
	const tally = (issue) =>
		issue.verified && issue.count !== null ? `${issue.count} of ${issue.of}` : 'Needs you';
</script>

<section aria-label="Checks">
	<div class="flex items-baseline justify-between gap-3">
		<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
			Checks{review ? ` · ${review.checkedAccounts} accounts` : ''}
		</p>
		{#if revision}
			<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
				Rev {revision}
			</p>
		{/if}
	</div>

	{#if loading}
		<p class="mt-3 border-t border-brand-ink pt-3 font-sans text-[13px] text-brand-mute">
			Running the checks…
		</p>
	{:else if !review}
		<!-- Not "everything passed": nothing ran. -->
		<p class="mt-3 border-t border-brand-ink pt-3 font-sans text-[13px] text-brand-mute">
			The checks have not run yet.
		</p>
	{:else if !review.issues.length}
		<p class="mt-3 border-t border-brand-ink pt-3">
			<StatusSquare
				tone="ready"
				label={`Every rule ran on all ${review.checkedAccounts} accounts`}
			/>
		</p>
	{:else}
		<ul class="mt-3 border-t border-brand-ink">
			{#each review.issues as issue (issue.id)}
				<li class="border-b border-brand-rule py-2.5">
					<span class="flex items-start justify-between gap-3">
						<span class="flex min-w-0 items-start gap-2.5">
							<span
								class="mt-1.5 block h-2 w-2 flex-shrink-0 {issue.severity === 'block'
									? 'bg-brand-alarm'
									: issue.severity === 'warn'
									? 'border border-brand-ink bg-brand-field'
									: issue.severity === 'ok'
									? 'bg-brand-proof'
									: 'border border-brand-mute'}"
								aria-hidden="true"
							/>
							<span class="font-sans text-[13.5px] leading-[19px] text-brand-ink">{issue.rule}</span
							>
						</span>
						<span
							class="flex-shrink-0 font-mono text-[10.5px] uppercase tracking-[0.06em] {issue.verified
								? 'text-brand-slate'
								: 'text-brand-mute'}">{tally(issue)}</span
						>
					</span>
					{#if issue.detail}
						<span
							class="mt-1 block pl-[18px] font-sans text-[12.5px] leading-[18px] text-brand-slate"
							>{issue.detail}</span
						>
					{/if}
					{#if issue.examples?.length}
						<span class="mt-0.5 block pl-[18px] font-mono text-[10.5px] text-brand-mute"
							>e.g. {issue.examples.join(', ')}</span
						>
					{/if}
				</li>
			{/each}
		</ul>

		{#if repairable}
			<RepairProposal
				{proposal}
				loading={proposalLoading}
				{applying}
				{conflict}
				on:propose
				on:apply
				on:studio
				on:dismiss
			/>
		{/if}

		<!--
			The one piece of prose in the rail, and it earns its place: it is what
			makes every number above readable. Without it "248" could be a score.
		-->
		<p class="mt-3 font-sans text-[12.5px] leading-[18px] text-brand-mute">
			Counts come from rules run on every account. “Needs you” is the AI’s reading; only you can
			clear it.
		</p>
	{/if}
</section>
