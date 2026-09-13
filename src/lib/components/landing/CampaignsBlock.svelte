<script>
	/**
	 * The campaigns block on the homepage. FE-17.
	 *
	 * ONE example, and a truthful one: the spreadsheet line and the card beside
	 * it are the same fixture the campaigns landing page uses, so the two pages
	 * cannot end up quoting different numbers for the same customer.
	 *
	 * It alternates card / PDF rather than showing both at once, because a send
	 * is one format — showing them side by side would suggest a customer gets
	 * two things. And there is no video here: campaigns render PNG or PDF, and
	 * putting a moving specimen on the block would promise a format the product
	 * refuses.
	 *
	 * "Sample data" is on the block, not in a footnote. Every figure here is
	 * invented, and a reader should not have to hunt for that.
	 */
	import ValueCard from '$lib/components/campaigns/marketing/ValueCard.svelte';
	import { byLine, num, decimal, TOTAL_CUSTOMERS } from '$lib/campaigns/marketing-fixture.js';

	const row = byLine(42);

	/** Alternates on a slow beat: a send is one format, never both. */
	let format = 'card';
	let timer = null;
	import { onMount, onDestroy } from 'svelte';
	onMount(() => {
		timer = setInterval(() => (format = format === 'card' ? 'pdf' : 'card'), 5200);
	});
	onDestroy(() => clearInterval(timer));
</script>

<section class="w-full bg-brand-paper px-5 py-[72px] lg:px-10 lg:py-[112px]">
	<div class="mx-auto max-w-page">
		<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
			<div>
				<p class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-royal">
					Pictify Campaigns · private pilot
				</p>
				<h2
					class="mt-4 max-w-[600px] text-balance font-display text-[36px] font-extrabold leading-[0.95] tracking-[-0.03em] text-brand-ink lg:text-h1"
				>
					One line of a spreadsheet becomes one customer’s card.
				</h2>
			</div>
			<p class="font-sans text-[15.5px] leading-[25px] text-brand-slate lg:pt-9">
				For customer success and lifecycle teams who want to show each customer what they got this
				month — without a designer, and sending from the tool they already use.
			</p>
		</div>

		<div class="mt-10 grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto_340px] lg:gap-10">
			<!-- The line, drawn as the sheet row it is. -->
			<div class="overflow-x-auto border border-brand-rule bg-white">
				<table class="w-full min-w-[420px] border-collapse text-left">
					<caption class="sr-only">One line from a September customer spreadsheet.</caption>
					<thead>
						<tr class="border-b border-brand-rule">
							{#each ['#', 'Account ID', 'Company', 'Workflows', 'Hours saved'] as head (head)}
								<th
									scope="col"
									class="px-3 py-2.5 font-sans text-[12px] font-medium text-brand-slate">{head}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						<tr class="bg-brand-field/25">
							<td class="px-3 py-3 font-mono text-[11px] text-brand-mute">{row.line}</td>
							<td class="px-3 py-3 font-mono text-[12px] text-brand-ink">{row.accountId}</td>
							<td class="px-3 py-3 font-sans text-[13px] font-semibold text-brand-ink"
								>{row.company}</td
							>
							<td class="px-3 py-3 font-sans text-[13px] text-brand-ink">{num(row.workflows)}</td>
							<td class="px-3 py-3 font-sans text-[13px] text-brand-slate"
								>{decimal(row.hoursSaved)}</td
							>
						</tr>
					</tbody>
				</table>
			</div>

			<p class="flex items-center gap-3 lg:flex-col lg:gap-1.5">
				<span class="font-display text-[26px] leading-none text-brand-ink" aria-hidden="true"
					>→</span
				>
				<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
					>{format === 'card' ? 'Email card' : 'One-page PDF'}</span
				>
			</p>

			<!--
				BOTH VARIANTS ARE THE SAME HEIGHT. The first version rendered the PDF
				at a true A4 ratio, which at this width is ~480px — three times the
				card — so the section grew and shrank every five seconds while
				someone was reading it. The difference between the two formats is
				carried by the label and the page chrome, not by the specimen's size.
				`aria-live` is off for the same reason: this alternates on a timer
				nobody asked for, and announcing it would talk over the reader.
			-->
			<div class="flex h-[212px] items-stretch">
				{#if format === 'pdf'}
					<div class="w-full bg-brand-subtle p-3">
						<div class="flex h-full flex-col bg-white shadow-[2px_2px_0_0_rgba(0,0,0,0.10)]">
							<ValueCard {row} size="sm" />
							<p
								class="mt-auto border-t border-brand-rule px-3 py-2 font-sans text-[10px] leading-[14px] text-brand-slate"
							>
								Hours saved is an estimate: workflows × the handling time you told us at onboarding.
							</p>
						</div>
					</div>
				{:else}
					<div class="flex w-full items-center border border-brand-rule bg-white">
						<ValueCard {row} />
					</div>
				{/if}
			</div>
		</div>

		<div class="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
			<a
				href="/campaigns/customer-value-updates"
				class="flex h-11 items-center gap-2.5 bg-brand-ink px-5 font-sans text-[14.5px] font-semibold text-white"
			>
				See customer value updates
				<span class="block h-2.5 w-2.5 bg-brand-field" aria-hidden="true" />
			</a>
			<p class="flex items-center gap-2.5">
				<span class="block h-2 w-2 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
				<span class="font-mono text-[11px] text-brand-slate">
					Sample data · up to {TOTAL_CUSTOMERS + 2} customers per send · you send from your own tool
				</span>
			</p>
		</div>
	</div>
</section>
