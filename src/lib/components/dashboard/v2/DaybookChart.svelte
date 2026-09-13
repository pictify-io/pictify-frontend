<script>
	/**
	 * Renders over time drawn in raster: each day's bar is a stack of print
	 * lines. Counted from the renders actually fetched, so the label stays
	 * honest — if the window's data is truncated upstream, the caller decides
	 * whether to show this at all.
	 */
	export let days = 14;
	/** Renders with createdAt (any order). */
	export let renders = [];
	export let total = 0;
	export let trendPct = null;

	const DAY_MS = 86_400_000;

	$: buckets = (() => {
		const out = Array(days).fill(0);
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		const startMs = start.getTime() - (days - 1) * DAY_MS;
		for (const r of renders) {
			const i = Math.floor((new Date(r.createdAt).getTime() - startMs) / DAY_MS);
			if (i >= 0 && i < days) out[i] += 1;
		}
		return out;
	})();
	$: peak = Math.max(1, ...buckets);
	// Up to 12 cells per bar; every day with any prints shows at least one line.
	$: cellCounts = buckets.map((n) => (n === 0 ? 0 : Math.max(1, Math.round((n / peak) * 12))));

	const fmt = (d) =>
		d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
	$: fromLabel = fmt(new Date(Date.now() - (days - 1) * DAY_MS));
	$: toLabel = fmt(new Date());
</script>

<section class="flex flex-col gap-3.5 rounded-[10px] border-[1.5px] border-brand-rule px-5 py-[18px]">
	<div class="flex flex-wrap items-baseline justify-between gap-2">
		<div class="flex items-baseline gap-4">
			<h2 class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">
				Renders — last {days} days
			</h2>
			<span class="font-display text-[22px] font-extrabold tracking-[-0.02em] text-brand-ink">
				{total.toLocaleString()}
			</span>
			{#if trendPct !== null}
				<span class="font-mono text-[11px] {trendPct >= 0 ? 'text-brand-proof' : 'text-brand-mute'}">
					{trendPct >= 0 ? '▲' : '▼'} {Math.abs(trendPct)}% vs prior {days}
				</span>
			{/if}
		</div>
		<span class="flex items-center gap-2">
			<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
			<span class="font-mono text-[10px] text-brand-slate">RENDERS</span>
		</span>
	</div>

	<div class="flex h-[110px] items-end gap-2.5" role="img" aria-label="Daily render counts for the last {days} days">
		{#each cellCounts as count, i (i)}
			<div class="flex flex-1 flex-col-reverse gap-0.5" title="{buckets[i]} renders">
				{#each Array(count) as _}
					<span class="block h-1.5 w-full bg-brand-field"></span>
				{/each}
				{#if count === 0}
					<span class="block h-px w-full bg-brand-rule"></span>
				{/if}
			</div>
		{/each}
	</div>

	<div class="flex justify-between">
		<span class="font-mono text-[10px] text-brand-mute">{fromLabel}</span>
		<span class="font-mono text-[10px] text-brand-mute">{toLabel}</span>
	</div>
</section>
