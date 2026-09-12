<script>
	/**
	 * "More from the counter" — the foot of every tool page. HB-04 (`MHX-0`).
	 *
	 * Was three cards with 156 px drawings. The user's reason for changing it:
	 * the drawings "take a lot of attention" — at the bottom of a page whose
	 * job is the tool above them, three pictures competed with the thing the
	 * visitor came for. Rows carry more information in less space: the
	 * description survives, and a mono tag says WHY each row is here, which the
	 * cards never did.
	 *
	 * Rows are derived from the registry (`relatedRows`), so a new tool needs
	 * no edit here or on any route.
	 */
	import { analytics } from '$lib/telemetry.js';
	import ToolStamp from './ToolStamp.svelte';

	/** `[{ slug, title, meta, href, desc, outputs, reason }]` */
	export let tools = [];
	export let toolName = '';
	/** Every tool on the counter, for the "ALL n TOOLS →" link. */
	export let total = 0;

	function track(target) {
		analytics.track('related_tool_click', { tool_name: toolName, target });
	}
</script>

<section class="mx-auto w-full max-w-page px-5 lg:px-10">
	<!--
		A <p>, not an <h2>: the routes' heading outlines are frozen for search,
		and this line is the shell's, not the page's.
	-->
	<div class="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 border-t-2 border-brand-ink pb-1 pt-3.5">
		<p class="font-display text-[22px] font-bold tracking-[-0.02em] text-brand-ink">
			More from the counter
		</p>
		<p class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">
			Same shelf first · then same output
		</p>
		<span class="flex-1" />
		<a href="/tools" class="font-mono text-[11px] tracking-[0.06em] text-brand-royal hover:underline"
			>ALL {total} TOOLS →</a
		>
	</div>

	<div class="flex flex-col">
		{#each tools as tool (tool.slug)}
			<a
				href={tool.href}
				on:click={() => track(tool.href)}
				class="group flex items-center gap-3.5 border-b border-brand-rule py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal"
			>
				<ToolStamp outputs={tool.outputs} />
				<span class="flex min-w-0 flex-col gap-[3px] sm:w-[300px] sm:flex-shrink-0">
					<span
						class="truncate font-sans text-[16px] font-semibold leading-5 text-brand-ink group-hover:underline"
						>{tool.title}</span
					>
					<span class="truncate font-mono text-[11px] tracking-[0.06em] text-brand-mute"
						>{tool.meta}</span
					>
					<!-- Under the meta below 640, where the description is gone. -->
					<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute sm:hidden"
						>{tool.reason}</span
					>
				</span>
				<!-- The description is the first thing to go when the row narrows:
				     the title and the stamp already say what the tool is. -->
				<span class="hidden min-w-0 flex-1 font-sans text-sm leading-[18px] text-brand-slate sm:block"
					>{tool.desc}</span
				>
				<span
					class="hidden flex-shrink-0 font-mono text-[11px] tracking-[0.06em] text-brand-mute sm:block"
					>{tool.reason}</span
				>
				<span
					class="ml-auto flex-shrink-0 font-mono text-[12px] text-brand-mute group-hover:text-brand-ink sm:ml-0"
					aria-hidden="true">→</span
				>
			</a>
		{/each}
	</div>
</section>
