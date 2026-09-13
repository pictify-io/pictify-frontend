<script>
	/**
	 * A grid of internal link cards inside a section — "Try Other Formats",
	 * "Need social previews?", "Comparing Screenshot APIs?".
	 *
	 * Not in the original component list, but three routes hand-rolled a block
	 * of this shape with their own <h3> class strings, which is exactly what the
	 * primitives exist to absorb. The card title is an <h3>: it names a
	 * destination a crawler should see under the section heading.
	 *
	 * `badge` is optional — the short square label ("PNG", "ALL") some of these
	 * grids carry.
	 */
	import { analytics } from '$lib/telemetry.js';
	import ToolStamp from '../ToolStamp.svelte';

	/** [{ href, title, body, badge? }] */
	export let items = [];
	/** 2 or 3 across. Literal classes — Tailwind can't build them from a variable. */
	export let columns = 2;
	export let toolName = '';
	/** 'h3' by default; 'h4' or 'p' where the block being replaced used those. */
	export let titleTag = 'h3';

	const COLUMN_CLASS = {
		2: 'grid grid-cols-1 gap-4 md:grid-cols-2',
		3: 'grid grid-cols-1 gap-4 md:grid-cols-3'
	};
	$: wrapper = COLUMN_CLASS[columns] || COLUMN_CLASS[2];

	function track(target) {
		analytics.track('related_tool_click', { tool_name: toolName, target });
	}
</script>

<div class={wrapper}>
	{#each items as item (item.href)}
		<a
			href={item.href}
			on:click={() => track(item.href)}
			class="group flex items-center gap-4 border border-brand-ink bg-brand-paper p-5 transition-all hover:bg-brand-field"
		>
			{#if item.outputs?.length}
				<!-- A format stamp, same as every tool listing: `outputs` wins over `badge`. -->
				<ToolStamp outputs={item.outputs} />
			{:else if item.badge}
				<div
					class="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-brand-rule bg-brand-ink text-sm font-semibold text-white group-hover:border-black group-hover:bg-brand-paper group-hover:text-brand-ink"
				>
					{item.badge}
				</div>
			{/if}
			<div>
				<svelte:element this={titleTag} class="text-xl font-semibold text-brand-ink"
					>{item.title}</svelte:element
				>
				<p class="text-sm font-bold text-brand-slate group-hover:text-brand-ink">{item.body}</p>
			</div>
		</a>
	{/each}
</div>
