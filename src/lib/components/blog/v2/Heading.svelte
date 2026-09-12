<script>
	/**
	 * H2s are the article's atomic sections, so they are numbered and ruled: a
	 * 25k-character guide with 14 of them needs to read as a sequence you are
	 * moving through, not as one undifferentiated column.
	 *
	 * Ids come from the slugger the page put on context — the same function
	 * `tableOfContents` used to build the rail, fed the same headings in the
	 * same order. That shared call is the only reason the anchors land.
	 */
	import { getContext } from 'svelte';
	import { BLOG_HEADINGS } from '$lib/blog/context.js';

	export let depth;
	export let raw;
	export let text;

	const headings = getContext(BLOG_HEADINGS);

	// Computed once at construction, NOT reactively: the slugger is stateful,
	// and re-running it on an update would burn another suffix and move the id
	// out from under the rail.
	const id = headings ? headings.nextId(text) : undefined;
	const index = depth === 2 && headings ? headings.nextIndex() : null;
</script>

{#if depth === 1}
	<h1
		{id}
		class="mb-5 mt-12 font-display text-[38px] font-extrabold leading-[1.08] tracking-[-0.03em] text-brand-ink"
	>
		<slot />
	</h1>
{:else if depth === 2}
	<!--
		THE NUMERAL IS A SIBLING, NOT PART OF THE HEADING. Inside the <h2> its
		text joined the heading's, so what search read was "01 Introduction" on
		a page that ranks for "Introduction". The rule and the rhythm move to
		the wrapper; the <h2> keeps the id the rail anchors to and holds nothing
		but the heading.
	-->
	<div class="mt-14 border-t border-brand-ink pt-6">
		{#if index !== null}
			<span
				class="mb-2 block font-mono text-[12px] tracking-[0.14em] text-brand-royal"
				aria-hidden="true"
			>
				{String(index).padStart(2, '0')}
			</span>
		{/if}
		<h2
			{id}
			class="scroll-mt-28 font-display text-[30px] font-extrabold leading-[1.12] tracking-[-0.025em] text-brand-ink"
		>
			<slot />
		</h2>
	</div>
{:else if depth === 3}
	<h3
		{id}
		class="mb-3 mt-9 scroll-mt-28 font-display text-[21px] font-bold leading-[1.2] text-brand-ink"
	>
		<slot />
	</h3>
{:else if depth === 4}
	<h4 {id} class="mb-2 mt-7 font-sans text-[17px] font-semibold text-brand-ink">
		<slot />
	</h4>
{:else if depth === 5}
	<h5 {id} class="mb-2 mt-6 font-mono text-[13px] uppercase tracking-[0.08em] text-brand-slate">
		<slot />
	</h5>
{:else if depth === 6}
	<h6 {id} class="mb-2 mt-6 font-mono text-[12px] uppercase tracking-[0.08em] text-brand-mute">
		<slot />
	</h6>
{:else}
	{raw}
{/if}
