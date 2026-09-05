<script>
	/**
	 * The spreadsheet, as a table. FE-17.
	 *
	 * A real `<table>` with a caption and header cells, not a grid of divs. The
	 * page is aimed at people who live in spreadsheets, and a screen reader user
	 * in that audience should get the same "this is a table with these columns"
	 * that everyone else gets from the ruled lines.
	 *
	 * The highlighted line is marked with `aria-current`, because "it is a
	 * different colour" is not available to everyone reading it.
	 */
	import { ROWS, TOTAL_CUSTOMERS, num, decimal } from '$lib/campaigns/marketing-fixture.js';

	/** Which line the arrow points at. */
	export let highlight = 42;
	/** Fewer rows in tight layouts. */
	export let limit = 4;

	$: rows = ROWS.slice(0, limit);
</script>

<div class="w-full overflow-hidden border border-brand-rule bg-white">
	<div
		class="flex flex-wrap items-center gap-2 border-b border-brand-rule bg-brand-subtle px-4 py-3"
	>
		<span class="block h-2.5 w-2.5 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
		<span class="font-sans text-[13.5px] font-semibold text-brand-ink">September accounts</span>
		<span class="font-sans text-[12.5px] text-brand-slate"
			>· {TOTAL_CUSTOMERS + 2} customers · exported from your CRM or warehouse</span
		>
	</div>

	<!-- Scrolls on its own rather than pushing the page sideways. -->
	<div class="overflow-x-auto">
		<table class="w-full min-w-[560px] border-collapse text-left">
			<caption class="sr-only">
				Four lines from a September customer spreadsheet. Line {highlight} is the one shown as a card.
			</caption>
			<thead>
				<tr class="border-b border-brand-rule">
					<th scope="col" class="w-12 px-3 py-2.5 font-mono text-[10.5px] text-brand-mute">#</th>
					{#each ['Account ID', 'Company', 'Workflows', 'Last month', 'Hours saved'] as head (head)}
						<th scope="col" class="px-3 py-2.5 font-sans text-[12.5px] font-medium text-brand-slate"
							>{head}</th
						>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.line)}
					<tr
						class="border-b border-brand-rule last:border-b-0 {row.line === highlight
							? 'bg-brand-field/25'
							: ''}"
						aria-current={row.line === highlight ? 'true' : undefined}
					>
						<td class="px-3 py-2.5 font-mono text-[11px] text-brand-mute">{row.line}</td>
						<td class="px-3 py-2.5 font-mono text-[12px] text-brand-ink">{row.accountId}</td>
						<td
							class="max-w-[210px] truncate px-3 py-2.5 font-sans text-[13px] {row.line ===
							highlight
								? 'font-semibold text-brand-ink'
								: 'text-brand-ink'}">{row.company}</td
						>
						<td class="px-3 py-2.5 font-sans text-[13px] text-brand-ink">{num(row.workflows)}</td>
						<td class="px-3 py-2.5 font-sans text-[13px] text-brand-slate">{num(row.lastMonth)}</td>
						<td class="px-3 py-2.5 font-sans text-[13px] text-brand-slate"
							>{decimal(row.hoursSaved)}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
