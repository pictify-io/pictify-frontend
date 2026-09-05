<script>
	/**
	 * Generation progress as raster filling in — the house signature (handoff §2
	 * decision 8). One 9px square per four accounts.
	 *
	 * A progress BAR implies a rate and invites the question "how long left".
	 * Squares filling in state only what has actually happened, which is the
	 * honest thing to show for work whose duration depends on 248 different
	 * renders. There is deliberately no ETA anywhere on this screen.
	 *
	 * Order is stable: ready, then failed, then working, then queued. The bar is
	 * a picture of the counts, not of the sequence, so a retry moving one square
	 * from failed to ready does not reshuffle the rest.
	 */
	export let counts = { total: 0, ready: 0, failed: 0, pending: 0, cancelled: 0 };
	export let perSquare = 4;

	const TONE = {
		ready: 'bg-brand-proof',
		failed: 'bg-brand-alarm',
		working: 'bg-brand-field border border-brand-ink',
		queued: 'border border-brand-rule',
		excluded: 'bg-brand-rule'
	};

	/**
	 * Round UP for any non-zero bucket, so a single failure among 248 still gets
	 * a square. Rounding it away would hide the one account a buyer most needs
	 * to see.
	 */
	const squares = (n) => (n > 0 ? Math.max(1, Math.round(n / perSquare)) : 0);

	$: cells = [
		...Array(squares(counts.ready)).fill('ready'),
		...Array(squares(counts.failed)).fill('failed'),
		...Array(squares(counts.working ?? 0)).fill('working'),
		...Array(squares(counts.pending)).fill('queued'),
		...Array(squares(counts.cancelled)).fill('excluded')
	];
</script>

<div
	class="flex flex-wrap gap-[3px]"
	role="img"
	aria-label="{counts.ready} ready, {counts.failed} failed, {counts.pending} queued of {counts.total}"
>
	{#each cells as tone, i (i)}
		<span class="block h-[9px] w-[9px] {TONE[tone]}" />
	{/each}
</div>
