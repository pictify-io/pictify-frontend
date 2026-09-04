<script>
	/**
	 * A stack of <h3> sub-points inside a section — the reference's 10–13
	 * bodies. Each item is { heading, body?, bullets? }.
	 *
	 * <h3> is the only sub-heading level in the long-form column: the section
	 * <h2> is LongformSection's, and nothing below h3 is used, so the outline
	 * a crawler sees is h1 → h2 → h3 on every tool page.
	 */

	/** [{ heading, body?, bullets? }] */
	export let items = [];
	/** 1 = stacked, 2 = two-up from the `sm` breakpoint. */
	export let columns = 1;

	$: wrapper = columns === 2 ? 'grid grid-cols-1 gap-6 sm:grid-cols-2' : 'flex flex-col gap-6';
</script>

<div class={wrapper}>
	{#each items as item}
		<div class="flex flex-col gap-1">
			<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">{item.heading}</h3>
			{#if item.body}
				<p class="font-sans text-[15px] leading-[23px] text-brand-slate">{item.body}</p>
			{/if}
			{#if item.bullets?.length}
				<ul class="list-disc pl-5 font-sans text-[15px] leading-[23px] text-brand-slate">
					{#each item.bullets as bullet}
						<li>{bullet}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/each}
</div>
