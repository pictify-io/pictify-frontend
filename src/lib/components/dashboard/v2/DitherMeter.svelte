<script>
	/**
	 * Usage drawn in the house raster: a row of cells that fill as the month
	 * prints. The half-opacity cell is the edge currently being burned — the
	 * meter always looks mid-print, never like a finished bar chart.
	 */
	export let label = '';
	export let used = 0;
	export let total = 0;
	/** Tailwind bg class for filled cells — lime for renders, pink for AI. */
	export let fill = 'bg-brand-field';
	export let cells = 17;

	$: display = total ? `${used.toLocaleString()} / ${total.toLocaleString()}` : '—';
	$: ratio = total ? Math.min(1, used / total) : 0;
	$: filled = Math.floor(ratio * cells);
	// The burning edge only shows mid-fill: nothing burning at 0, nothing left at cap.
	$: burning = ratio > 0 && filled < cells;
</script>

<div class="flex flex-col gap-1.5">
	<div class="flex items-baseline justify-between">
		<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">{label}</span>
		<span class="font-mono text-[10px] text-brand-slate">{display}</span>
	</div>
	<div class="flex flex-wrap gap-[3px]" role="img" aria-label="{label}: {display}">
		{#each Array(cells) as _, i}
			{#if i < filled}
				<span class="block h-2 w-2 {fill}"></span>
			{:else if i === filled && burning}
				<span class="block h-2 w-2 opacity-55 {fill}"></span>
			{:else}
				<span class="block h-2 w-2 border border-black/15"></span>
			{/if}
		{/each}
	</div>
</div>
