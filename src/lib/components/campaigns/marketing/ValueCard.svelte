<script>
	/**
	 * The card a customer receives, drawn in HTML. FE-17.
	 *
	 * Not a screenshot. It appears eight times across the landing page at four
	 * different sizes, and an image set would either be eight exports that drift
	 * from each other or one export scaled until the type breaks. Built from the
	 * shared fixture, it cannot disagree with the spreadsheet shown beside it.
	 *
	 * It is a SPECIMEN, not the product's renderer — the real card is rendered
	 * server-side from the buyer's own design. This is what one looks like.
	 */
	import { SENDER, num, decimal, comparison } from '$lib/campaigns/marketing-fixture.js';

	/** A row from the fixture. */
	export let row;
	/** 'sm' inside a phone, 'md' in a body section, 'lg' as a hero specimen. */
	export let size = 'md';
	/** The comparison line is dropped at the smallest size for room. */
	export let showComparison = true;

	const SIZES = {
		sm: { pad: 'p-3', name: 'text-[13px]', figure: 'text-[19px]', label: 'text-[8.5px]' },
		md: { pad: 'p-4', name: 'text-[17px]', figure: 'text-[27px]', label: 'text-[10px]' },
		lg: { pad: 'p-5', name: 'text-[22px]', figure: 'text-[38px]', label: 'text-[11.5px]' }
	};

	$: s = SIZES[size] || SIZES.md;
	$: delta = showComparison ? comparison(row) : null;
</script>

<div class="w-full bg-white">
	<!-- The buyer's brand colour, which is the only thing on the card that is theirs rather than ours. -->
	<div class="h-1.5 w-full bg-brand-royal" aria-hidden="true" />
	<div class={s.pad}>
		<div class="flex items-baseline justify-between gap-3">
			<span class="font-sans text-[11px] font-semibold text-brand-royal">{SENDER.name}</span>
			<!--
				The full date range is dropped at the smallest size. On a 240px card
				it and the brand name crowd each other onto one cramped line, and the
				period is the least load-bearing thing on a card whose subject is the
				customer's own figures.
			-->
			<span class="font-sans text-[10.5px] text-brand-mute">
				{size === 'sm' ? SENDER.periodShort : SENDER.period}
			</span>
		</div>

		<p class="mt-2 font-display font-bold leading-[1.12] text-brand-ink {s.name}">
			{row.company}
		</p>

		<div class="mt-3 flex flex-wrap items-start gap-x-8 gap-y-3">
			<span>
				<span class="block font-display font-bold leading-none text-brand-ink {s.figure}"
					>{num(row.workflows)}</span
				>
				<span class="mt-1 block font-sans text-brand-slate {s.label}">workflows completed</span>
				{#if delta}
					<!--
						A fall is stated as plainly as a rise, in the same colour. Colouring
						a dip red on a card a customer reads turns a fact into a verdict —
						and the buyer, not the template, decides whether a dip is bad news.
					-->
					<span class="mt-0.5 block font-sans font-semibold text-brand-royal {s.label}">
						{delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : '■'}
						{delta.label}
					</span>
				{/if}
			</span>

			{#if row.hoursSaved !== null}
				<span>
					<span class="block font-display font-bold leading-none text-brand-ink {s.figure}"
						>{decimal(row.hoursSaved)}</span
					>
					<span class="mt-1 block font-sans text-brand-slate {s.label}">hours saved (est.)</span>
				</span>
			{/if}
		</div>
	</div>
</div>
