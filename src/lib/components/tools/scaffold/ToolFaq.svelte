<script>
	/**
	 * FAQ accordion for /tools/* pages. Renders only the visible HTML accordion —
	 * the FAQPage JSON-LD schema lives in ToolSeoHead and is emitted independently.
	 * Keeping the two decoupled means this component is pure markup and the schema
	 * always stays in the document <head> where crawlers expect it.
	 *
	 * Markup mirrors what certificate-generator and tweet-screenshot emit today.
	 *
	 * See plan: docs/plans/2026-04-15-002-refactor-tool-scaffold-plan.md
	 */

	/** @type {Array<{q: string, a: string}>} */
	export let faqs = [];
	export let heading = 'Frequently asked questions';
</script>

<section class="mt-16">
	<h2 class="text-3xl md:text-4xl font-black text-gray-900 text-center mb-8">{heading}</h2>
	<div class="max-w-3xl mx-auto space-y-4">
		{#each faqs as faq}
			<details class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5 group">
				<summary class="font-black text-lg cursor-pointer flex justify-between items-center">
					<span>{faq.q}</span>
					<span class="text-2xl group-open:rotate-45 transition-transform">+</span>
				</summary>
				<p class="mt-3 text-gray-700 leading-relaxed">{faq.a}</p>
			</details>
		{/each}
	</div>
</section>
