<script>
	/**
	 * Comparison tables are the load-bearing element of the alternatives posts,
	 * so they get the card treatment rather than bare rules.
	 *
	 * overflow-x on the wrapper, not the table: a six-column comparison must
	 * scroll inside its own box instead of making the whole page scroll
	 * sideways.
	 */
</script>

<div class="my-8 overflow-x-auto rounded-tile border border-brand-ink">
	<table class="w-full border-collapse text-left">
		<slot />
	</table>
</div>

<style>
	table :global(thead) {
		background: #f4f6f4;
	}
	table :global(th) {
		padding: 12px 16px;
		border-bottom: 1px solid #000;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #000;
		white-space: nowrap;
	}
	table :global(td) {
		padding: 12px 16px;
		border-bottom: 1px solid #e5e7eb;
		font-size: 15px;
		line-height: 23px;
		color: #383a42;
		vertical-align: top;
	}
	table :global(tr:last-child td) {
		border-bottom: none;
	}
	/* The first column is the thing being compared — the row's label, not data. */
	table :global(td:first-child) {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 13px;
		color: #ff48b0;
		white-space: nowrap;
	}
</style>
