<script>
	/**
	 * Three art-strip cards, same drawings as the /tools hub so a visitor moving
	 * between tools recognises the shelf they came from.
	 *
	 * These are ordinary internal links; the route keeps its existing
	 * RelatedTools block further down for the wider link set.
	 */
	import { analytics } from '$lib/telemetry.js';

	/** [{ title, meta, href, art }] */
	export let tools = [];
	export let toolName = '';

	function track(target) {
		analytics.track('related_tool_click', { tool_name: toolName, target });
	}
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2 min-[1200px]:grid-cols-3">
	{#each tools as tool (tool.href)}
		<a
			href={tool.href}
			on:click={() => track(tool.href)}
			class="group block overflow-hidden rounded-card border-[1.5px] border-brand-ink bg-brand-paper transition-[transform,box-shadow] duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_0_#000000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal motion-reduce:transition-none"
		>
			<div class="overflow-hidden border-b-[1.5px] border-brand-ink">
				<img
					src={tool.art}
					alt=""
					aria-hidden="true"
					loading="lazy"
					class="h-[156px] w-full object-cover"
				/>
			</div>
			<div class="flex flex-col gap-1 px-4 py-3.5">
				<span
					class="font-sans text-base font-semibold leading-5 text-brand-ink group-hover:underline"
				>
					{tool.title}
				</span>
				<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">{tool.meta}</span>
			</div>
		</a>
	{/each}
</div>
