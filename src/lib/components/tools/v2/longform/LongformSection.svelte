<script>
	/**
	 * One numbered section of the reading column.
	 *
	 * The heading text is passed in verbatim from the route and rendered as a
	 * real <h2> — these pages rank, so the heading outline is frozen. Pass
	 * `title` for plain text, or use the `heading` slot when the live heading
	 * carries inline markup.
	 *
	 * The first section gets a 2px ink rule; the rest get a hairline, so the
	 * column reads as one document rather than a stack of boxes.
	 */
	export let index = '01';
	export let id = '';
	export let title = '';
	export let first = false;
	/** Two-up sections (06–09 on the board) drop to a 24px heading. */
	export let compact = false;
	/**
	 * Inside a LongformPair, take the full width instead of one of the two
	 * columns. For content that cannot be halved — a four-column comparison
	 * table clips rather than scrolls at 360px, which reads as broken.
	 * Ignored outside a pair.
	 */
	export let span = false;
</script>

<section
	{id}
	class="flex scroll-mt-24 flex-col gap-5 pt-8 {span ? 'min-[900px]:col-span-2' : ''} {first
		? 'border-t-2 border-brand-ink'
		: 'border-t border-brand-rule'}"
>
	<div class="flex items-baseline gap-3">
		<!-- Empty `index` drops the number: legal headings carry their own ("1. Definitions"). -->
		{#if index}
			<span class="flex-shrink-0 font-mono text-xs tracking-[0.06em] text-brand-blue">{index}</span>
		{/if}
		{#if $$slots.heading}
			<slot name="heading" />
		{:else}
			<h2
				class="font-display {compact
					? 'text-2xl leading-[30px]'
					: 'text-[32px] leading-[42px]'} font-bold tracking-[-0.02em] text-brand-ink"
			>
				{title}
			</h2>
		{/if}
	</div>

	<slot />
</section>
