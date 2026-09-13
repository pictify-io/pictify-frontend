<script>
	/**
	 * The daybook: fourteen days of output with the month's quota stated beside
	 * it, so "am I printing more than usual" and "am I about to run out" are one
	 * glance instead of two pages.
	 *
	 * Bars come pre-bucketed from the server (zeros included) — the chart never
	 * invents a day it wasn't given. A day with no renders still draws a hairline
	 * so the row reads as fourteen days rather than a gap.
	 */
	export let days = [];
	export let total = 0;
	/** { used, limit, resetsAt } — omit to hide the quota line. */
	export let quota = null;
	/**
	 * What the bars count. Defaults to renders; Analytics reuses this chart for
	 * views and bandwidth, and a chart labelled "renders" while plotting
	 * bandwidth is just wrong.
	 */
	export let noun = 'render';
	/** Pre-formatted total, for units that aren't a plain count (e.g. "2.4 MB"). */
	export let totalLabel = null;

	const TRACK = 72;

	$: peak = Math.max(1, ...days.map((d) => d.count));
	$: bars = days.map((d, i) => ({
		...d,
		height: d.count === 0 ? 4 : Math.max(6, Math.round((d.count / peak) * TRACK)),
		isToday: i === days.length - 1,
		label: i === days.length - 1 ? 'TODAY' : String(new Date(`${d.date}T00:00:00Z`).getUTCDate())
	}));

	$: resetLabel = quota?.resetsAt
		? new Date(quota.resetsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
		: null;
</script>

<section class="flex flex-col gap-3.5 rounded-tile bg-brand-subtle px-6 pb-4 pt-5">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 class="font-mono text-xs font-bold uppercase tracking-[0.06em] text-brand-ink">
			Last {days.length} days — {totalLabel ?? `${total.toLocaleString()} ${noun}${total === 1 ? '' : 's'}`}
		</h2>
		{#if quota && quota.limit > 0}
			<span class="font-sans text-[13px] text-brand-mute">
				{quota.used.toLocaleString()} / {quota.limit.toLocaleString()} this month{resetLabel
					? ` · resets ${resetLabel}`
					: ''}
			</span>
		{/if}
	</div>

	<div
		class="flex h-24 items-end gap-2.5"
		role="img"
		aria-label="{noun}s per day for the last {days.length} days"
	>
		{#each bars as bar (bar.date)}
			<div class="flex flex-1 flex-col items-center gap-1.5" title="{bar.date}: {bar.count}">
				<span
					class="block w-full rounded-[2px] {bar.count === 0 ? 'bg-[#D6D8D2]' : 'bg-brand-field'} {bar.isToday
						? 'border-[1.5px] border-brand-ink'
						: ''}"
					style="height: {bar.height}px"
				></span>
				<span class="font-mono text-[10px] {bar.isToday ? 'font-bold text-brand-ink' : 'text-brand-mute'}">
					{bar.label}
				</span>
			</div>
		{/each}
	</div>
</section>
