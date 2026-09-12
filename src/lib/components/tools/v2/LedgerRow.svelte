<script>
	/**
	 * One tool, as a row on the counter. HB-01 (`M1M-0`).
	 *
	 * The whole row is the link — a title-only hit area on a 40 px row is a
	 * miss for anyone not using a mouse precisely — and there is no description
	 * here: the hub's job is to route, and eighteen sentences down a column is
	 * a page nobody scans. The description belongs on the tool page.
	 */
	import ToolStamp from './ToolStamp.svelte';

	/** `{ slug, title, meta, href, outputs }` from the registry. */
	export let tool;
	export let isNew = false;
</script>

<a
	href={tool.href}
	class="group flex items-center gap-3.5 border-b border-brand-rule py-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal"
>
	<ToolStamp outputs={tool.outputs} />
	<span class="flex min-w-0 flex-1 flex-col gap-[3px]">
		<!--
			An <h3>, because the cards this replaced were <h3>s and the hub's
			outline is what search reads: dropping eighteen headings off a page
			that ranks is a change with no upside. Styled as the row title; the
			heading level is the only thing it carries.
		-->
		<h3 class="truncate font-sans text-[16px] font-semibold leading-5 text-brand-ink group-hover:underline">
			{tool.title}
		</h3>
		<span class="truncate font-mono text-[11px] tracking-[0.06em] text-brand-mute">{tool.meta}</span>
	</span>
	{#if isNew}
		<span
			class="flex-shrink-0 rounded-full border border-brand-ink bg-brand-field px-[7px] py-[2px] font-mono text-[10px] font-bold leading-3 tracking-[0.06em] text-brand-ink"
			>NEW</span
		>
	{/if}
	<span
		class="flex-shrink-0 font-mono text-[12px] text-brand-mute group-hover:text-brand-ink"
		aria-hidden="true">→</span
	>
</a>
