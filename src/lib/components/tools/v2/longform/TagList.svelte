<script>
	/**
	 * A row of short labels — supported languages, formats, platforms.
	 *
	 * Not links and not headings: these are a scannable inventory, so they carry
	 * no anchor and add nothing to the outline.
	 */

	/** string[] */
	export let items = [];
</script>

<ul class="flex flex-wrap gap-2">
	{#each items as item}
		<li
			class="border border-brand-rule bg-brand-paper px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] text-brand-slate"
		>
			{item}
		</li>
	{/each}
</ul>
