<script>
	/**
	 * The FAQ accordion. It renders NO heading — the section's <h2> belongs to
	 * LongformSection, so the FAQ block can't introduce a second heading style.
	 *
	 * Pass the same `faqs` constant to ToolSeoHead: the visible answers and the
	 * FAQPage JSON-LD then cannot drift apart, which is the failure this
	 * component exists to prevent.
	 */

	/** [{ q, a }] */
	export let faqs = [];
</script>

<div class="space-y-4">
	{#each faqs as faq}
		<details class="group">
			<summary
				class="flex cursor-pointer items-center justify-between border border-brand-ink bg-brand-paper p-4 transition-all"
			>
				<span class="text-lg font-semibold text-brand-ink">{faq.q}</span>
				<span
					class="border border-brand-ink bg-brand-ink p-1 text-white transition-colors group-open:bg-brand-paper group-open:text-brand-ink"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 transition-transform group-open:rotate-180"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
						><path
							fill-rule="evenodd"
							d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/></svg
					>
				</span>
			</summary>
			<div
				class="mt-0 border-x border-b border-brand-ink bg-brand-subtle p-4 font-medium text-brand-ink"
			>
				{faq.a}
			</div>
		</details>
	{/each}
</div>
