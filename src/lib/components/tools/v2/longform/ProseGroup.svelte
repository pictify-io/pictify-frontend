<script>
	/**
	 * A stack of <h3> sub-points inside a section — the reference's 10–13
	 * bodies. Each item is { heading, body?, bullets? }.
	 *
	 * <h3> is the only sub-heading level in the long-form column: the section
	 * <h2> is LongformSection's, and nothing below h3 is used, so the outline
	 * a crawler sees is h1 → h2 → h3 on every tool page.
	 */

	/**
	 * [{ heading, body?, bodyHtml?, bullets? }]
	 *
	 * `bodyHtml` is for copy that ships as markup in the pSEO config (the
	 * use-case long descriptions carry their own line breaks). It is rendered
	 * verbatim, so only pass content the repo controls — never anything a user
	 * supplied.
	 */
	export let items = [];
	/** 1 = stacked, 2 = two-up from the `sm` breakpoint. */
	export let columns = 1;
	/**
	 * 'h3' by default. Pass 'h4' where the block being replaced already shipped
	 * h4 — these outlines are frozen, so a level cannot drift either way.
	 */
	export let headingTag = 'h3';

	$: wrapper = columns === 2 ? 'grid grid-cols-1 gap-6 sm:grid-cols-2' : 'flex flex-col gap-6';
</script>

<div class={wrapper}>
	{#each items as item}
		<div class="flex flex-col gap-1">
			<svelte:element
				this={headingTag}
				class="font-sans text-lg font-medium leading-6 text-brand-ink"
				>{item.heading}</svelte:element
			>
			{#if item.body}
				<p class="font-sans text-[15px] leading-[23px] text-brand-slate">{item.body}</p>
			{/if}
			{#if item.bodyHtml}
				<div class="font-sans text-[15px] leading-[23px] text-brand-slate">
					{@html item.bodyHtml}
				</div>
			{/if}
			{#if item.bullets?.length}
				<ul class="list-disc pl-5 font-sans text-[15px] leading-[23px] text-brand-slate">
					{#each item.bullets as bullet}
						<!-- Same rule as bodyHtml: repo-controlled copy only. -->
						<li>
							{#if typeof bullet === 'object'}{@html bullet.html}{:else}{bullet}{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/each}
</div>
