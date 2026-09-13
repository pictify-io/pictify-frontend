<script>
	/**
	 * FAQ accordion for /tools/* pages. Renders only the visible HTML accordion —
	 * the FAQPage JSON-LD schema lives in ToolSeoHead and is emitted independently.
	 * Keeping the two decoupled means this component is pure markup and the schema
	 * always stays in the document <head> where crawlers expect it.
	 *
	 * v2 styling: the heading text is frozen (these pages rank), the chrome is
	 * the reading column's — hairline rules, no boxes stacked on boxes.
	 */

	/** @type {Array<{q: string, a: string}>} */
	export let faqs = [];
	export let heading = 'Frequently asked questions';
</script>

<section class="flex flex-col gap-5">
	<h2 class="font-display text-[28px] font-bold leading-9 tracking-[-0.02em] text-brand-ink">
		{heading}
	</h2>
	<div class="flex flex-col gap-3">
		{#each faqs as faq}
			<details class="group border border-brand-ink bg-brand-paper">
				<summary
					class="flex cursor-pointer items-center justify-between gap-4 p-4 font-sans text-[15px] font-medium text-brand-ink"
				>
					<span>{faq.q}</span>
					<span class="font-mono text-lg text-brand-mute transition-transform group-open:rotate-45"
						>+</span
					>
				</summary>
				<p
					class="border-t border-brand-rule p-4 font-sans text-[15px] leading-[23px] text-brand-slate"
				>
					{faq.a}
				</p>
			</details>
		{/each}
	</div>
</section>
