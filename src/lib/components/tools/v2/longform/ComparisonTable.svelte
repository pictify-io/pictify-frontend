<script>
	/**
	 * One table style for the whole tool surface. The first cell of each row is
	 * the row label (emphasised); `highlightRow` tints the row for the format
	 * or product the page is actually about.
	 *
	 * Wrapped in its own overflow-x container so a wide table scrolls inside the
	 * reading column instead of widening the page.
	 */

	/** string[] — header cells. */
	export let columns = [];
	/** string[][] — one array per row, first entry is the row label. */
	export let rows = [];
	/** Index into `rows`, or null. */
	export let highlightRow = null;
</script>

<div class="overflow-x-auto">
	<table class="w-full border-collapse text-left">
		<thead>
			<tr class="border-b border-brand-ink">
				{#each columns as column}
					<th class="p-3 text-sm font-semibold">{column}</th>
				{/each}
			</tr>
		</thead>
		<tbody class="text-sm font-medium text-brand-slate">
			{#each rows as row, r}
				<tr
					class="{r === rows.length - 1 ? '' : 'border-b border-brand-rule'} {r === highlightRow
						? 'bg-brand-field/30'
						: ''}"
				>
					{#each row as cell, c}
						<td class="p-3 {c === 0 ? 'font-semibold text-brand-ink' : ''}">{cell}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
